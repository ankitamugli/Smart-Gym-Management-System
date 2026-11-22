/* ==========================================================================
   FORMA – checkin.js   (Feature 4: QR check-in)
   API used: API.checkin.qrToken(), verify({token, method}), list(), remove(id)
   Backend: GET /checkins/qr-token, POST /checkins, GET /checkins, DELETE /checkins/{id}
   Scanning uses the browser BarcodeDetector API where available (Chrome/Edge/
   Android). Elsewhere the page falls back to paste-a-code. To support every
   browser, add a decoder library (e.g. jsQR) inside decodeFrame().
   ========================================================================== */
Page.ready(function () {
  let history = []; let tokenInfo = null; let countdownId = null; let scanStream = null; let scanTimer = null; let busy = false;

  /* ---------- tabs ---------- */
  $$('.tab[data-pane]').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab[data-pane]').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
    ['paneMy', 'paneScan'].forEach(id => $('#' + id).classList.toggle('hidden', id !== tab.dataset.pane));
    if (tab.dataset.pane !== 'paneScan') stopScan();
  }));

  /* ---------- my QR ---------- */
  async function newToken() {
    try {
      tokenInfo = await API.checkin.qrToken(); const u = (API.auth.session() || {}).user || {};
      $('#qrName').textContent = u.name || 'User'; $('#qrMember').textContent = u.memberId || '';
      QR.toCanvas($('#qrCanvas'), tokenInfo.token, { scale: 8, margin: 1, ecc: 'M' });
      clearInterval(countdownId);
      const tick = () => {
        const left = Math.max(0, Math.round((new Date(tokenInfo.expiresAt) - Date.now()) / 1000));
        $('#qrExpiry').textContent = left > 0 ? `Code refreshes in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'Code expired – generating a new one…';
        if (left === 0) { clearInterval(countdownId); newToken(); }
      };
      tick(); countdownId = setInterval(tick, 1000);
    } catch (e) { UI.fail(e, 'Could not create your QR code.'); }
  }
  $('#refreshQr').addEventListener('click', () => { newToken(); UI.toast('New code generated.', 'info'); });
  $('#downloadQr').addEventListener('click', () => { const a = document.createElement('a'); a.href = $('#qrCanvas').toDataURL('image/png'); a.download = 'forma-checkin-qr.png'; document.body.appendChild(a); a.click(); a.remove(); });
  async function copyToken() {
    if (!tokenInfo) return;
    try { await navigator.clipboard.writeText(tokenInfo.token); UI.toast('Code copied. Paste it in the box above.'); }
    catch (e) { $('#manualCode').value = tokenInfo.token; UI.toast('Clipboard is blocked, so the code was placed in the box for you.', 'info'); }
  }
  $('#copyCode').addEventListener('click', copyToken);
  $('#simulateBtn').addEventListener('click', () => { if (tokenInfo) submit(tokenInfo.token, 'qr'); });

  /* ---------- submit a scanned/typed token ---------- */
  async function submit(token, method) {
    if (busy) return; busy = true;
    try {
      const r = await API.checkin.verify({ token, method });
      showConfirmation(r); await load();
    } catch (e) { UI.fail(e, 'Check-in failed. Try again or ask the front desk.'); }
    busy = false;
  }
  function showConfirmation(r) {
    UI.modal({
      title: 'Check-in confirmed',
      body: `<div class="checkin-ok"><div class="tick">${Icons.svg('check')}</div><h2>Welcome, ${esc(r.member ? r.member.name : 'User')}</h2>
        <p class="muted">${esc(r.branch || API.config.branchName)} · ${fmtDate(r.date, { weekday: 'long', day: 'numeric', month: 'long' })} at ${esc(r.time)}</p>
        ${r.member && r.member.plan ? `<p>${UI.badge(r.member.plan + ' plan', 'orange')}</p>` : ''}
        ${r.alreadyCheckedInToday ? UI.notice('You had already checked in today. This visit was recorded as an extra entry.', 'warn', 'info') : ''}
        ${API.config.useBackend ? '' : UI.notice('Demo only: this visit was saved in your browser, not verified by a server.', '', 'info')}</div>`,
      footer: [{ label: 'Done', cls: '' }]
    });
  }

  /* ---------- scanner ---------- */
  const hasDetector = 'BarcodeDetector' in window;
  async function startScan() {
    $('#scanError').innerHTML = '';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { $('#scanError').innerHTML = UI.notice('This browser cannot open the camera. Use the paste option below.', 'warn', 'alert'); return; }
    if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(location.hostname)) { $('#scanError').innerHTML = UI.notice('<b>Camera needs a secure page.</b> Use https:// or run the project on localhost (see the README).', 'danger', 'alert'); return; }
    try {
      scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      const v = $('#scanVideo'); v.srcObject = scanStream; await v.play().catch(() => { });
      v.classList.remove('hidden'); $('#scanBox').classList.remove('hidden'); $('#scanLine').classList.remove('hidden'); $('#scanPlaceholder').classList.add('hidden');
      $('#startScan').classList.add('hidden'); $('#stopScan').classList.remove('hidden');
      if (!hasDetector) { $('#scanError').innerHTML = UI.notice('This browser cannot read QR codes from the camera (no BarcodeDetector). The preview works, but please paste the code instead, or use Chrome or Edge.', 'warn', 'info'); return; }
      const detector = new BarcodeDetector({ formats: ['qr_code'] });
      scanTimer = setInterval(async () => {
        if (busy || v.readyState < 2) return;
        try { const found = await detector.detect(v); if (found.length) { const raw = found[0].rawValue; stopScan(); submit(raw, 'scan'); } } catch (e) { /* ignore frame errors */ }
      }, 350);
    } catch (err) {
      const msg = { NotAllowedError: 'Camera permission was blocked. Allow it in the address-bar site settings and try again.', NotFoundError: 'No camera was found on this device.', NotReadableError: 'Another app is using the camera.' }[err.name] || ('Could not start the camera: ' + (err.message || err.name));
      $('#scanError').innerHTML = UI.notice(esc(msg), 'danger', 'alert');
    }
  }
  function stopScan() {
    clearInterval(scanTimer); if (scanStream) scanStream.getTracks().forEach(t => t.stop()); scanStream = null;
    const v = $('#scanVideo'); v.srcObject = null; v.classList.add('hidden'); $('#scanBox').classList.add('hidden'); $('#scanLine').classList.add('hidden'); $('#scanPlaceholder').classList.remove('hidden');
    $('#startScan').classList.remove('hidden'); $('#stopScan').classList.add('hidden');
  }
  $('#startScan').addEventListener('click', startScan); $('#stopScan').addEventListener('click', stopScan);
  window.addEventListener('pagehide', stopScan);
  document.addEventListener('visibilitychange', () => { if (document.hidden && scanStream) stopScan(); });

  $('#manualForm').addEventListener('submit', e => {
    e.preventDefault(); const { valid, values } = UI.validate(e.target, { manualCode: { label: 'Code', required: true } });
    if (valid) { submit(values.manualCode, 'manual'); e.target.reset(); }
  });

  /* ---------- history + stats ---------- */
  async function load() {
    try { history = await API.checkin.list(); } catch (e) { return UI.fail(e, 'Could not load attendance.'); }
    history.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    renderStats(); renderHeat(); renderHistory();
  }
  function streak() {
    const days = new Set(history.map(h => h.date)); let n = 0; const d = new Date(); d.setHours(12, 0, 0, 0);
    if (!days.has(DemoData.iso(d))) d.setDate(d.getDate() - 1);
    while (days.has(DemoData.iso(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function renderStats() {
    const today = todayISO(); const month = today.slice(0, 7); const days = new Set(history.map(h => h.date));
    const d30 = Array.from(days).filter(d => daysBetween(d, today) <= 29 && d <= today).length;
    const stat = (icon, tone, num, label) => `<div class="card"><div class="stat"><div class="stat-ico ${tone}">${Icons.svg(icon)}</div><div><div class="num">${num}</div><div class="lbl">${label}</div></div></div></div>`;
    const last = history[0];
    $('#checkinStats').innerHTML = stat('calendar', '', new Set(history.filter(h => h.date.startsWith(month)).map(h => h.date)).size, 'Visit days this month') + stat('flame', 'amber', streak() + (streak() === 1 ? ' day' : ' days'), 'Current streak') + stat('target', 'teal', d30 + ' / 30', 'Active days, last 30') + stat('clock', 'blue', last ? last.time : '–', last ? 'Last visit · ' + fmtShort(last.date) : 'No visits yet');
  }
  function renderHeat() {
    const days = new Set(history.map(h => h.date)); const end = new Date(); end.setHours(12, 0, 0, 0); const start = new Date(end); start.setDate(start.getDate() - ((end.getDay() + 6) % 7) - 9 * 7);
    let html = '<div style="display:grid;grid-template-columns:auto repeat(10,1fr);gap:4px;align-items:center;font-size:.72rem;color:var(--muted)">';
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((dn, r) => {
      html += `<span>${dn}</span>`;
      for (let w = 0; w < 10; w++) { const d = new Date(start); d.setDate(d.getDate() + w * 7 + r); const iso = DemoData.iso(d); const future = iso > todayISO(); const on = days.has(iso);
        html += `<span title="${iso}${on ? ' – visited' : ''}" style="aspect-ratio:1;border-radius:5px;background:${future ? 'transparent' : on ? 'var(--primary)' : 'var(--surface-2)'};border:1px solid ${future ? 'transparent' : on ? 'var(--primary)' : 'var(--line)'}"></span>`; }
    });
    $('#heatmap').innerHTML = html + '</div>';
  }
  function renderHistory() {
    const sel = $('#monthFilter'); const months = Array.from(new Set(history.map(h => h.date.slice(0, 7)))).sort().reverse(); const cur = sel.value || 'all';
    sel.innerHTML = '<option value="all">All months</option>' + months.map(m => `<option value="${m}">${fmtDate(m + '-01', { month: 'long', year: 'numeric' })}</option>`).join(''); sel.value = months.includes(cur) || cur === 'all' ? cur : 'all';
    const rows = history.filter(h => sel.value === 'all' || h.date.startsWith(sel.value));
    $('#historyList').innerHTML = rows.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Time</th><th>Method</th><th>Branch</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${rows.map(h => `<tr><td>${fmtDate(h.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td><td>${esc(h.time)}</td><td>${esc({ qr: 'QR at desk', scan: 'Camera scan', manual: 'Pasted code' }[h.method] || h.method)}</td><td>${esc(h.branch || '')}</td><td>${UI.badge(API.config.useBackend ? 'Verified' : 'Demo record', API.config.useBackend ? 'green' : 'amber')}</td><td class="right"><button class="btn sm danger outline" data-del="${h.id}" aria-label="Delete check-in on ${h.date}">Delete</button></td></tr>`).join('')}</tbody></table></div>`
      : UI.empty({ icon: 'qr', title: 'No check-ins yet', text: 'Use “Simulate check-in” or scan a code to record your first visit.' });
  }
  $('#monthFilter').addEventListener('change', renderHistory);
  $('#historyList').addEventListener('click', async e => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    if (await UI.confirm({ title: 'Delete this check-in?', message: 'The visit will be removed from your demo history.', confirmText: 'Delete', danger: true })) { try { await API.checkin.remove(b.dataset.del); UI.toast('Check-in deleted.'); load(); } catch (er) { UI.fail(er); } }
  });
  $('#exportCsv').addEventListener('click', () => {
    if (!history.length) return UI.toast('There is nothing to export yet.', 'error');
    const csv = 'date,time,method,branch\n' + history.map(h => [h.date, h.time, h.method, h.branch].map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',')).join('\n');
    UI.download('forma-attendance.csv', csv, 'text/csv'); UI.toast('Attendance exported.');
  });

  newToken(); load();
});
