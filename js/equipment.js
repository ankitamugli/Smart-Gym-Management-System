/* ==========================================================================
   FORMA – equipment.js   (Feature 5: real-time equipment availability)
   API used: API.equipment.list(), API.equipment.setStatus(id, status, waitMinutes)
   Item JSON: { id, name, category, type, zone, status:'available|occupied|maintenance',
                waitMinutes, updatedAt }
   LIVE UPDATES: when FORMA_CONFIG.useBackend is true the page polls list() every
   equipmentPollMs. For true push updates, replace startPolling() with a
   WebSocket / Server-Sent-Events subscription (e.g. GET /equipment/stream)
   that calls apply(newList).
   ========================================================================== */
Page.ready(function () {
  const STATUS = { available: { label: 'Available', badge: 'green' }, occupied: { label: 'Occupied', badge: 'amber' }, maintenance: { label: 'Under maintenance', badge: 'red' } };
  let items = []; let pollId = null; let demoTickId = null;
  const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  async function load(manual) {
    try { apply(await API.equipment.list()); if (manual) UI.toast('Equipment refreshed.', 'info'); }
    catch (e) { UI.fail(e, 'Could not load equipment status.'); $('#liveState').textContent = 'Offline'; $('#liveState').style.color = 'var(--danger)'; }
  }
  function apply(list) { items = list; $('#updatedAt').textContent = 'Updated ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); renderCategories(); render(); }

  function renderCategories() {
    const sel = $('#eqCategory'); const cur = sel.value; const cats = Array.from(new Set(items.map(i => i.category)));
    sel.innerHTML = '<option value="">All categories</option>' + cats.map(c => `<option>${esc(c)}</option>`).join(''); sel.value = cats.includes(cur) ? cur : '';
  }
  const filtered = () => {
    const q = $('#eqSearch').value.trim().toLowerCase(), c = $('#eqCategory').value, s = $('#eqStatus').value;
    return items.filter(i => (!q || (i.name + ' ' + i.category + ' ' + i.zone).toLowerCase().includes(q)) && (!c || i.category === c) && (!s || i.status === s));
  };
  const count = (list, s) => list.filter(i => i.status === s).length;

  function render() {
    // summary cards (always on the full list)
    const tot = items.length; const card = (key, icon, tone) => `<button type="button" class="card" style="text-align:left;cursor:pointer;font:inherit;color:inherit" data-quick="${key}" aria-label="Show ${STATUS[key].label.toLowerCase()} equipment"><div class="stat"><div class="stat-ico ${tone}">${Icons.svg(icon)}</div><div><div class="num">${count(items, key)}</div><div class="lbl">${STATUS[key].label}</div></div></div></button>`;
    $('#statusCards').innerHTML = `<div class="card"><div class="stat"><div class="stat-ico blue">${Icons.svg('grid')}</div><div><div class="num">${tot}</div><div class="lbl">Total equipment</div></div></div></div>` + card('available', 'check', 'green') + card('occupied', 'clock', 'amber') + card('maintenance', 'wrench', '');

    const cats = Array.from(new Set(items.map(i => i.category)));
    Charts.bar($('#zoneChart'), { labels: cats, stacked: true, datasets: [{ label: 'Available', data: cats.map(c => count(items.filter(i => i.category === c), 'available')), color: cssv('--success') }, { label: 'Occupied', data: cats.map(c => count(items.filter(i => i.category === c), 'occupied')), color: cssv('--warning') }, { label: 'Maintenance', data: cats.map(c => count(items.filter(i => i.category === c), 'maintenance')), color: cssv('--danger') }] });

    const free = items.filter(i => i.status === 'available').slice(0, 4).map(i => `<li><span><b>${esc(i.name)}</b><br><span class="muted small">${esc(i.zone)}</span></span>${UI.badge('Free now', 'green')}</li>`);
    const soon = items.filter(i => i.status === 'occupied').sort((a, b) => a.waitMinutes - b.waitMinutes).slice(0, 4 - Math.min(free.length, 2)).map(i => `<li><span><b>${esc(i.name)}</b><br><span class="muted small">${esc(i.zone)}</span></span>${UI.badge('~' + i.waitMinutes + ' min', 'amber')}</li>`);
    const rows = free.slice(0, 2).concat(soon);
    $('#waitList').innerHTML = rows.length ? '<ul class="list-plain">' + rows.join('') + '</ul>' : UI.empty({ icon: 'clock', title: 'Nothing to show', text: 'No equipment is available or in use right now.' });

    const list = filtered(); const staff = $('#staffMode').checked;
    $('#resultCount').textContent = `Showing ${list.length} of ${items.length} items`;
    $('#eqGrid').innerHTML = list.length ? list.map(i => `<article class="eq-card ${i.status}" aria-label="${esc(i.name)}, ${STATUS[i.status].label}">
        <div class="eq-art">${Icons.equip(i.type)}</div>
        <div><h4>${esc(i.name)}</h4><div class="muted small">${esc(i.category)} · ${esc(i.zone)}</div></div>
        <div class="eq-meta">${UI.badge(STATUS[i.status].label, STATUS[i.status].badge)}<span>${i.status === 'occupied' ? '~' + i.waitMinutes + ' min wait' : i.status === 'available' ? 'Ready to use' : 'Back soon'}</span></div>
        ${staff ? `<select class="form-control" style="padding:.35rem .5rem;font-size:.86rem" data-set="${i.id}" aria-label="Set status for ${esc(i.name)}">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === i.status ? 'selected' : ''}>${v.label}</option>`).join('')}</select>` : ''}
      </article>`).join('')
      : `<div style="grid-column:1/-1">${UI.empty({ icon: 'search', title: 'No equipment matches', text: 'Try a different search, category or status.', action: '<button class="btn sm secondary" id="clearFilters">Clear filters</button>' })}</div>`;
    const cf = $('#clearFilters'); if (cf) cf.onclick = () => { $('#eqSearch').value = ''; $('#eqCategory').value = ''; $('#eqStatus').value = ''; render(); };
  }

  $('#eqSearch').addEventListener('input', debounce(render, 120));
  $('#eqCategory').addEventListener('change', render); $('#eqStatus').addEventListener('change', render);
  $('#staffMode').addEventListener('change', render);
  $('#refreshBtn').addEventListener('click', () => load(true));
  $('#statusCards').addEventListener('click', e => { const b = e.target.closest('[data-quick]'); if (!b) return; const sel = $('#eqStatus'); sel.value = sel.value === b.dataset.quick ? '' : b.dataset.quick; render(); $('#eqGrid').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#eqGrid').addEventListener('change', async e => {
    const id = e.target.dataset.set; if (!id) return;
    try { await API.equipment.setStatus(id, e.target.value); UI.toast('Status updated.'); load(); } catch (er) { UI.fail(er); load(); }
  });

  /* ---------- live updates ---------- */
  function startPolling() {
    if (API.config.useBackend) { $('#liveState').textContent = 'Live'; pollId = setInterval(() => load(), API.config.equipmentPollMs); }
    // Demo only: occasionally flip one machine so the page feels alive. Never runs against a real backend.
    else demoTickId = setInterval(async () => {
      if ($('#staffMode').checked || document.hidden) return;
      const pool = items.filter(i => i.status !== 'maintenance'); if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      try { await API.equipment.setStatus(pick.id, pick.status === 'available' ? 'occupied' : 'available', 4 + Math.floor(Math.random() * 12)); await load(); } catch (e) { /* ignore */ }
    }, 12000);
  }
  window.addEventListener('pagehide', () => { clearInterval(pollId); clearInterval(demoTickId); });
  window.addEventListener('forma:theme', render);

  load(); startPolling();
});
