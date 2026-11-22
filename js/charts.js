/* ==========================================================================
   FORMA – charts.js
   Small dependency-free canvas chart helper (line, bar, doughnut, ring).
   Written so the project runs offline with no CDN. If you prefer Chart.js,
   replace the calls in dashboard.js / nutrition.js / progress.js – the data
   passed in (labels + datasets) already matches Chart.js' shape.

   Charts.line(canvas, { labels, datasets:[{label,data,color,dashed,fill}], unit, yMin, yMax })
   Charts.bar(canvas,  { labels, datasets:[{label,data,color}], unit, stacked })
   Charts.doughnut(canvas, { labels, data, colors, centerTop, centerBottom })
   Charts.ring(canvas, { value, max, color, label, sub })
   ========================================================================== */
const Charts = (() => {
  const live = new Map(); // canvas -> redraw function

  const css = (name, fb) => (getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb);
  const theme = () => ({
    text: css('--text', '#1c2738'), muted: css('--muted', '#5d6b82'), line: css('--line', '#e0e5ec'),
    surface: css('--surface', '#fff'), ink: css('--ink', '#0f1b2d'), font: css('--font-body', 'sans-serif'),
    series: [css('--primary', '#e0481a'), css('--teal', '#0f8b98'), css('--info', '#2b6cb0'), css('--warning', '#a16207'), css('--success', '#15803d')]
  });

  function prep(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(40, Math.floor(rect.width));
    const h = Math.max(40, Math.floor(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function niceScale(min, max, ticks = 5) {
    if (!isFinite(min) || !isFinite(max)) { min = 0; max = 1; }
    if (min === max) { max = min + 1; }
    const range = max - min;
    const rough = range / (ticks - 1);
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow;
    const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10) * pow;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(6));
    return out;
  }
  const fmt = (v, unit) => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'k' : (Math.round(v * 10) / 10)) + (unit || '');

  function legend(ctx, t, datasets, x, y, w) {
    ctx.font = `12px ${t.font}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    let cx = x;
    datasets.forEach((d, i) => {
      const color = d.color || t.series[i % t.series.length];
      ctx.fillStyle = color;
      if (d.dashed) { ctx.fillRect(cx, y - 1, 5, 2); ctx.fillRect(cx + 8, y - 1, 5, 2); } else ctx.fillRect(cx, y - 5, 12, 10);
      ctx.fillStyle = t.muted;
      const label = d.label || ('Series ' + (i + 1));
      ctx.fillText(label, cx + 18, y);
      cx += 18 + ctx.measureText(label).width + 16;
      if (cx > x + w) return;
    });
  }

  function tooltip(ctx, t, w, h, px, py, title, rows) {
    ctx.font = `12px ${t.font}`;
    const lines = [title].concat(rows.map(r => `${r.label}: ${r.value}`));
    const tw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20;
    const th = lines.length * 18 + 12;
    let x = px + 12; if (x + tw > w - 4) x = px - tw - 12;
    let y = Math.max(4, Math.min(py - th / 2, h - th - 4));
    ctx.fillStyle = t.ink; ctx.globalAlpha = .94;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, tw, th, 8) : ctx.rect(x, y, tw, th); ctx.fill(); ctx.globalAlpha = 1;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    lines.forEach((l, i) => {
      ctx.fillStyle = i === 0 ? '#fff' : 'rgba(255,255,255,.85)';
      ctx.font = `${i === 0 ? 'bold ' : ''}12px ${t.font}`;
      ctx.fillText(l, x + 10, y + 15 + i * 18);
    });
  }

  function register(canvas, drawFn) {
    live.set(canvas, drawFn);
    const state = { hover: -1 };
    const redraw = () => drawFn(state);
    canvas._redraw = redraw;
    if (!canvas._bound) {
      canvas._bound = true;
      canvas.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        state.mx = e.clientX - r.left; state.my = e.clientY - r.top;
        canvas._redraw();
      });
      canvas.addEventListener('mouseleave', () => { state.hover = -1; state.mx = null; canvas._redraw(); });
      if (window.ResizeObserver && canvas.parentElement) {
        new ResizeObserver(() => { if (canvas.isConnected) canvas._redraw(); }).observe(canvas.parentElement);
      }
    }
    canvas._state = state;
    redraw();
  }

  /* ---------------- line ---------------- */
  function line(canvas, cfg) {
    register(canvas, state => {
      const t = theme(); const { ctx, w, h } = prep(canvas);
      const ds = cfg.datasets || []; const labels = cfg.labels || [];
      const all = ds.flatMap(d => d.data).filter(v => v !== null && v !== undefined && !isNaN(v));
      if (!labels.length || !all.length) { empty(ctx, t, w, h); return; }
      let lo = cfg.yMin !== undefined ? cfg.yMin : Math.min(...all);
      let hi = cfg.yMax !== undefined ? cfg.yMax : Math.max(...all);
      if (cfg.yMin === undefined) { const pad = (hi - lo) * .12 || 1; lo -= pad; if (lo > 0 && Math.min(...all) >= 0 && cfg.zero) lo = 0; hi += pad; }
      const ticks = niceScale(lo, hi, 5); lo = ticks[0]; hi = ticks[ticks.length - 1];
      const topPad = ds.length > 1 ? 34 : 14;
      const m = { l: 46, r: 16, t: topPad, b: 30 };
      const pw = w - m.l - m.r, ph = h - m.t - m.b;
      const X = i => m.l + (labels.length === 1 ? pw / 2 : (i / (labels.length - 1)) * pw);
      const Y = v => m.t + ph - ((v - lo) / (hi - lo)) * ph;
      ctx.font = `12px ${t.font}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'right';
      ticks.forEach(v => {
        ctx.strokeStyle = t.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(w - m.r, Y(v)); ctx.stroke();
        ctx.fillStyle = t.muted; ctx.fillText(fmt(v, cfg.unit), m.l - 8, Y(v));
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = t.muted;
      const every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(pw / 70))));
      // walk back from the last point so the newest label is always shown and spacing stays even
      for (let i = labels.length - 1; i >= 0; i -= every) ctx.fillText(labels[i], Math.min(Math.max(X(i), m.l + 16), w - m.r - 16), h - m.b + 9);
      if (ds.length > 1) legend(ctx, t, ds, m.l, 14, pw);
      ds.forEach((d, di) => {
        const color = d.color || t.series[di % t.series.length];
        ctx.strokeStyle = color; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.setLineDash(d.dashed ? [7, 6] : []);
        ctx.beginPath(); let pen = false;
        d.data.forEach((v, i) => {
          if (v === null || v === undefined || isNaN(v)) { pen = false; return; }
          if (!pen) { ctx.moveTo(X(i), Y(v)); pen = true; } else ctx.lineTo(X(i), Y(v));
        });
        ctx.stroke(); ctx.setLineDash([]);
        if (d.fill) {
          ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = color; ctx.beginPath();
          let first = -1, last = -1;
          d.data.forEach((v, i) => { if (v !== null && v !== undefined && !isNaN(v)) { if (first < 0) first = i; last = i; } });
          if (first >= 0) {
            ctx.moveTo(X(first), Y(lo));
            d.data.forEach((v, i) => { if (i >= first && i <= last && v !== null && v !== undefined && !isNaN(v)) ctx.lineTo(X(i), Y(v)); });
            ctx.lineTo(X(last), Y(lo)); ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        }
        if (labels.length <= 40) d.data.forEach((v, i) => {
          if (v === null || v === undefined || isNaN(v)) return;
          ctx.fillStyle = t.surface; ctx.strokeStyle = color; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(X(i), Y(v), d.dashed ? 2.5 : 3.5, 0, 7); ctx.fill(); ctx.stroke();
        });
      });
      if (state.mx != null && state.mx >= m.l && state.mx <= w - m.r) {
        let idx = Math.round(((state.mx - m.l) / pw) * (labels.length - 1)); idx = Math.max(0, Math.min(labels.length - 1, idx));
        ctx.strokeStyle = t.muted; ctx.globalAlpha = .5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(X(idx), m.t); ctx.lineTo(X(idx), m.t + ph); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        const rows = ds.filter(d => d.data[idx] !== null && d.data[idx] !== undefined && !isNaN(d.data[idx])).map(d => ({ label: d.label || 'Value', value: fmt(d.data[idx], cfg.unit) }));
        tooltip(ctx, t, w, h, X(idx), state.my || h / 2, labels[idx], rows);
      }
    });
  }

  /* ---------------- bar ---------------- */
  function bar(canvas, cfg) {
    register(canvas, state => {
      const t = theme(); const { ctx, w, h } = prep(canvas);
      const ds = cfg.datasets || []; const labels = cfg.labels || [];
      if (!labels.length || !ds.length) { empty(ctx, t, w, h); return; }
      const totals = labels.map((_, i) => cfg.stacked ? ds.reduce((s, d) => s + (d.data[i] || 0), 0) : Math.max(...ds.map(d => d.data[i] || 0)));
      let hi = Math.max(...totals, cfg.yMax || 0, 1);
      const ticks = niceScale(0, hi, 5); hi = ticks[ticks.length - 1];
      const m = { l: 46, r: 12, t: ds.length > 1 ? 34 : 14, b: 30 };
      const pw = w - m.l - m.r, ph = h - m.t - m.b;
      const Y = v => m.t + ph - (v / hi) * ph;
      ctx.font = `12px ${t.font}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ticks.forEach(v => { ctx.strokeStyle = t.line; ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(w - m.r, Y(v)); ctx.stroke(); ctx.fillStyle = t.muted; ctx.fillText(fmt(v, cfg.unit), m.l - 8, Y(v)); });
      const group = pw / labels.length;
      const inner = group * .7;
      const bw = cfg.stacked ? inner : inner / ds.length;
      if (ds.length > 1) legend(ctx, t, ds, m.l, 14, pw);
      if (cfg.goal) { ctx.strokeStyle = t.series[1]; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(m.l, Y(cfg.goal)); ctx.lineTo(w - m.r, Y(cfg.goal)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = t.series[1]; ctx.textAlign = 'left'; ctx.fillText('Goal ' + fmt(cfg.goal, cfg.unit), m.l + 6, Y(cfg.goal) - 9); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const labelEvery = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor(pw / 60))));
      let hover = -1;
      if (state.mx != null) { hover = Math.floor((state.mx - m.l) / group); if (hover < 0 || hover >= labels.length) hover = -1; }
      labels.forEach((l, i) => {
        const gx = m.l + i * group + (group - inner) / 2;
        let acc = 0;
        ds.forEach((d, di) => {
          const v = d.data[i] || 0; const color = d.color || t.series[di % t.series.length];
          const x = cfg.stacked ? gx : gx + di * bw;
          const y0 = cfg.stacked ? Y(acc + v) : Y(v);
          const hh = cfg.stacked ? Y(acc) - Y(acc + v) : Y(0) - Y(v);
          ctx.fillStyle = color; ctx.globalAlpha = hover === -1 || hover === i ? 1 : .55;
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x + 1, y0, Math.max(2, bw - 2), Math.max(0, hh), [4, 4, 0, 0]); else ctx.rect(x + 1, y0, bw - 2, hh); ctx.fill(); ctx.globalAlpha = 1;
          acc += v;
        });
        if ((labels.length - 1 - i) % labelEvery === 0) { ctx.fillStyle = t.muted; ctx.fillText(l, m.l + i * group + group / 2, h - m.b + 9); }
      });
      if (hover >= 0) tooltip(ctx, t, w, h, m.l + hover * group + group / 2, state.my, labels[hover], ds.map(d => ({ label: d.label || 'Value', value: fmt(d.data[hover] || 0, cfg.unit) })));
    });
  }

  /* ---------------- doughnut ---------------- */
  function doughnut(canvas, cfg) {
    register(canvas, state => {
      const t = theme(); const { ctx, w, h } = prep(canvas);
      const data = cfg.data || []; const total = data.reduce((a, b) => a + b, 0);
      const colors = cfg.colors || t.series;
      const side = w > 380;
      const size = side ? Math.min(h, w * .5) : Math.min(w, h - 60);
      const cx = side ? size / 2 + 6 : w / 2, cy = side ? h / 2 : size / 2 + 6;
      const R = size / 2 - 6, r = R * .64;
      if (!total) { ctx.strokeStyle = t.line; ctx.lineWidth = R - r; ctx.beginPath(); ctx.arc(cx, cy, (R + r) / 2, 0, 7); ctx.stroke(); }
      let a = -Math.PI / 2;
      data.forEach((v, i) => {
        if (!total) return;
        const ang = (v / total) * Math.PI * 2;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath(); ctx.arc(cx, cy, R, a, a + ang); ctx.arc(cx, cy, r, a + ang, a, true); ctx.closePath(); ctx.fill();
        a += ang;
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = t.ink;
      ctx.font = `700 ${Math.round(R * .38)}px ${css('--font-head', 'sans-serif')}`; ctx.fillText(cfg.centerTop || '', cx, cy - 6);
      ctx.font = `12px ${t.font}`; ctx.fillStyle = t.muted; ctx.fillText(cfg.centerBottom || '', cx, cy + R * .24);
      ctx.textAlign = 'left';
      (cfg.labels || []).forEach((l, i) => {
        const lx = side ? size + 24 : 10 + (i % 2) * (w / 2); const ly = side ? cy - ((cfg.labels.length - 1) * 11) + i * 24 : size + 28 + Math.floor(i / 2) * 20;
        ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(lx, ly - 5, 11, 11);
        ctx.fillStyle = t.text; ctx.font = `13px ${t.font}`; ctx.fillText(`${l}  ${cfg.valueLabels ? cfg.valueLabels[i] : data[i]}`, lx + 18, ly);
      });
    });
  }

  /* ---------------- ring ---------------- */
  function ring(canvas, cfg) {
    register(canvas, () => {
      const t = theme(); const { ctx, w, h } = prep(canvas);
      const size = Math.min(w, h); const cx = w / 2, cy = h / 2; const R = size / 2 - 10; const lw = Math.max(10, size * .09);
      const pct = Math.max(0, Math.min(1, (cfg.value || 0) / (cfg.max || 1)));
      ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.strokeStyle = t.line; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      if (pct > 0) { ctx.strokeStyle = cfg.color || t.series[0]; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2); ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = t.ink;
      ctx.font = `700 ${Math.round(size * .22)}px ${css('--font-head', 'sans-serif')}`; ctx.fillText(cfg.label !== undefined ? cfg.label : Math.round(pct * 100) + '%', cx, cy - size * .03);
      ctx.font = `12px ${t.font}`; ctx.fillStyle = t.muted; ctx.fillText(cfg.sub || '', cx, cy + size * .15);
    });
  }

  function empty(ctx, t, w, h) {
    ctx.fillStyle = t.muted; ctx.font = `13px ${t.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('No data to chart yet', w / 2, h / 2);
  }

  function redrawAll() {
    live.forEach((fn, canvas) => { if (canvas.isConnected && canvas._redraw) canvas._redraw(); else live.delete(canvas); });
  }
  window.addEventListener('forma:theme', redrawAll);

  return { line, bar, doughnut, ring, redrawAll };
})();
