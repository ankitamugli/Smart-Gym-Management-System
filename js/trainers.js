/* ==========================================================================
   FORMA – trainers.js   (Feature 7: personal trainer matching)
   API used: API.trainers.list(), get(id), bookings(), book(), updateBooking(), cancelBooking()
   Booking JSON: { id, trainerId, date:'YYYY-MM-DD', time:'HH:MM', goal, notes,
                   contactPhone, status:'requested|confirmed|cancelled' }
   In demo mode every booking stays 'requested' – only a server/trainer can confirm.
   ========================================================================== */
Page.ready(function () {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const GOALS = ['Weight loss', 'Muscle gain', 'Strength', 'General fitness', 'Mobility and recovery', 'Learn technique'];
  let trainers = [], bookings = [];
  let matchGoal = null;

  async function load() {
    try { [trainers, bookings] = await Promise.all([API.trainers.list(), API.trainers.bookings()]); } catch (e) { return UI.fail(e, 'Could not load trainers.'); }
    const specs = Array.from(new Set(trainers.flatMap(t => t.specializations))).sort(); const sel = $('#tSpec'); const cur = sel.value;
    sel.innerHTML = '<option value="">All specialties</option>' + specs.map(s => `<option>${esc(s)}</option>`).join(''); sel.value = specs.includes(cur) ? cur : '';
    render(); renderBookings();
  }

  /* ---------- listing ---------- */
  function filtered() {
    const q = $('#tSearch').value.trim().toLowerCase(), sp = $('#tSpec').value, day = $('#tDay').value, price = Number($('#tPrice').value) || 0, g = $('#tGender').value, sort = $('#tSort').value;
    let list = trainers.filter(t => (!q || (t.name + ' ' + t.specializations.join(' ') + ' ' + t.languages.join(' ')).toLowerCase().includes(q)) && (!sp || t.specializations.includes(sp)) && (!day || t.availableDays.includes(day)) && (!price || t.pricePerSession <= price) && (!g || t.gender === g));
    const by = { rating: (a, b) => b.rating - a.rating, experience: (a, b) => b.experienceYears - a.experienceYears, priceAsc: (a, b) => a.pricePerSession - b.pricePerSession, priceDesc: (a, b) => b.pricePerSession - a.pricePerSession }[sort];
    list.sort(by); if (matchGoal) list.sort((a, b) => score(b) - score(a));
    return list;
  }
  // Simple demo scoring for "Match me" – NOT a recommendation model.
  const GOAL_TAGS = { 'Weight loss': ['Weight loss', 'HIIT', 'Fat burn', 'Nutrition'], 'Muscle gain': ['Muscle gain', 'Bodybuilding', 'Strength'], 'Strength': ['Strength', 'Powerlifting'], 'General fitness': ['Functional training', 'HIIT', 'Beginners'], 'Mobility and recovery': ['Mobility', 'Recovery', 'Yoga', 'Rehab', 'Senior fitness'], 'Learn technique': ['Beginners', 'Strength', 'Functional training'] };
  const score = t => matchGoal ? t.specializations.filter(s => (GOAL_TAGS[matchGoal.goal] || []).includes(s)).length * 10 + (matchGoal.day && t.availableDays.includes(matchGoal.day) ? 5 : 0) + (matchGoal.budget && t.pricePerSession <= matchGoal.budget ? 3 : 0) + t.rating : 0;

  function render() {
    const list = filtered(); $('#tCount').textContent = `${list.length} of ${trainers.length} trainers`;
    $('#trainerGrid').innerHTML = list.length ? list.map((t, i) => `<article class="trainer-card">
        <div class="trainer-photo"><img src="${esc('../' + t.photo)}" alt="Illustrated avatar of ${esc(t.name)}" loading="lazy" width="400" height="300"></div>
        <div class="trainer-body">
          ${matchGoal && i === 0 && score(t) >= 10 ? UI.badge('Best match for ' + matchGoal.goal.toLowerCase(), 'orange') : ''}
          <div class="flex between items-center"><h4>${esc(t.name)}</h4><span class="rating" aria-label="Rating ${t.rating} out of 5">${Icons.svg('star')} ${t.rating}<span class="muted small" style="font-weight:400">(${t.reviewCount})</span></span></div>
          <div class="chip-row" style="gap:.3rem">${t.specializations.map(s => UI.badge(s, 'teal')).join('')}</div>
          <div class="small muted">${t.experienceYears} years experience · ${esc(t.languages.join(', '))}</div>
          <div class="small"><b>Days:</b> ${t.availableDays.map(d => d).join(' · ')}</div>
          <div class="flex between items-center"><b style="font-size:1.1rem">${money(t.pricePerSession)}</b><span class="muted small">per session</span></div>
          <div class="trainer-foot"><button class="btn secondary sm" style="flex:1" data-view="${t.id}">Details</button><button class="btn sm" style="flex:1" data-book="${t.id}">Request session</button></div>
        </div></article>`).join('')
      : `<div style="grid-column:1/-1">${UI.empty({ icon: 'trainers', title: 'No trainers match', text: 'Loosen a filter or search for a different specialty.', action: '<button class="btn sm secondary" id="emptyReset">Reset filters</button>' })}</div>`;
    const er = $('#emptyReset'); if (er) er.onclick = resetFilters;
  }
  function resetFilters() { ['tSearch', 'tSpec', 'tDay', 'tPrice', 'tGender'].forEach(id => $('#' + id).value = ''); $('#tSort').value = 'rating'; matchGoal = null; render(); }
  $('#tReset').addEventListener('click', resetFilters);
  $('#tSearch').addEventListener('input', debounce(render, 120));
  ['tSpec', 'tDay', 'tPrice', 'tGender', 'tSort'].forEach(id => $('#' + id).addEventListener('change', () => { if (id === 'tSort') matchGoal = null; render(); }));
  $('#trainerGrid').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.view) openDetails(b.dataset.view); if (b.dataset.book) openBooking(b.dataset.book); });

  /* ---------- match me ---------- */
  $('#matchBtn').addEventListener('click', () => {
    UI.modal({ title: 'Match me to a trainer',
      body: `<form id="matchForm" novalidate><div class="field"><label for="mGoal">What is your main goal?</label><select class="form-control" id="mGoal" name="goal">${GOALS.map(g => `<option>${g}</option>`).join('')}</select></div>
        <div class="form-row"><div class="field"><label for="mDay">Preferred day</label><select class="form-control" id="mDay" name="day"><option value="">Any day</option>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<option>${d}</option>`).join('')}</select></div>
        <div class="field"><label for="mBudget">Budget per session</label><select class="form-control" id="mBudget" name="budget"><option value="">No limit</option><option value="700">Up to ₹700</option><option value="900">Up to ₹900</option><option value="1100">Up to ₹1,100</option></select></div></div></form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Show matches', onClick: (b, m) => { const f = $('#matchForm', m.el); matchGoal = { goal: f.elements.goal.value, day: f.elements.day.value, budget: Number(f.elements.budget.value) || 0 }; $('#tSort').value = 'rating'; render(); UI.toast('Trainers re-ordered for “' + matchGoal.goal + '”.', 'info'); $('#trainerGrid').scrollIntoView({ behavior: 'smooth' }); } }] });
  });

  /* ---------- details ---------- */
  function openDetails(id) {
    const t = trainers.find(x => x.id === id); if (!t) return;
    UI.modal({ title: t.name, wide: true,
      body: `<div class="grid grid-2"><div><img src="${esc('../' + t.photo)}" alt="Illustrated avatar of ${esc(t.name)}" style="width:100%;border-radius:12px"></div>
        <div><p class="rating mb-1">${Icons.svg('star')} ${t.rating} <span class="muted small" style="font-weight:400">from ${t.reviewCount} reviews (sample)</span></p>
        <p>${esc(t.bio)}</p>
        <ul class="list-plain small"><li><span>Experience</span><b>${t.experienceYears} years</b></li><li><span>Languages</span><b>${esc(t.languages.join(', '))}</b></li><li><span>Price</span><b>${money(t.pricePerSession)} / session</b></li><li><span>Available</span><b>${t.availableDays.join(', ')}</b></li></ul>
        <div class="label mt-2">Specialties</div><div class="chip-row" style="gap:.3rem">${t.specializations.map(s => UI.badge(s, 'teal')).join('')}</div>
        <div class="label mt-2">Certifications</div><div class="chip-row" style="gap:.3rem">${t.certifications.map(s => UI.badge(s, 'blue')).join('')}</div>
        <div class="label mt-2">Typical time slots</div><div class="chip-row" style="gap:.3rem">${t.slots.map(s => UI.badge(s)).join('')}</div></div></div>`,
      footer: [{ label: 'Close', cls: 'secondary' }, { label: 'Request session', onClick: () => { setTimeout(() => openBooking(id), 50); } }] });
  }

  /* ---------- booking ---------- */
  function nextDates(t) { const out = []; const d = new Date(); d.setHours(12, 0, 0, 0); for (let i = 0; i < 21 && out.length < 8; i++) { d.setDate(d.getDate() + (i === 0 ? 0 : 1)); if (t.availableDays.includes(DAYS[d.getDay()])) out.push(DemoData.iso(d)); } return out; }
  function slotTaken(trainerId, date, time, ignoreId) { return bookings.some(b => b.trainerId === trainerId && b.date === date && b.time === time && b.status !== 'cancelled' && b.id !== ignoreId); }

  function openBooking(id, existing) {
    const t = trainers.find(x => x.id === id); if (!t) return;
    const dates = nextDates(t); let pickedDate = existing ? existing.date : dates[0]; let pickedTime = existing ? existing.time : '';
    const slotsHtml = () => t.slots.map(s => { const past = pickedDate === todayISO() && s <= new Date().toTimeString().slice(0, 5); const taken = slotTaken(t.id, pickedDate, s, existing && existing.id); return `<button type="button" class="slot ${pickedTime === s ? 'selected' : ''}" data-slot="${s}" ${past || taken ? 'disabled' : ''} title="${taken ? 'Already requested' : past ? 'Time has passed' : ''}">${s}</button>`; }).join('');
    UI.modal({ title: (existing ? 'Change request – ' : 'Request a session with ') + t.name, wide: true,
      body: `<form id="bkForm" novalidate>
        <div class="field"><span class="label">Date</span><div class="slot-grid" id="dateGrid">${dates.map(d => `<button type="button" class="slot ${d === pickedDate ? 'selected' : ''}" data-date="${d}">${fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}</button>`).join('')}</div></div>
        <div class="field"><span class="label">Time</span><div class="slot-grid" id="slotGrid">${slotsHtml()}</div><div class="error-text" id="slotErr"></div></div>
        <div class="form-row"><div class="field"><label for="bGoal">Session goal</label><select class="form-control" id="bGoal" name="goal">${GOALS.map(g => `<option ${existing && existing.goal === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
        <div class="field"><label for="bPhone">Contact phone</label><input class="form-control" id="bPhone" name="contactPhone" inputmode="tel" value="${esc(existing ? existing.contactPhone : '')}" placeholder="10-digit number"></div></div>
        <div class="field"><label for="bNotes">Notes for the trainer (optional)</label><textarea class="form-control" id="bNotes" name="notes" maxlength="300" placeholder="Injuries, experience, what you want to work on">${esc(existing ? existing.notes || '' : '')}</textarea></div>
        <div class="notice mb-0"><i data-icon="info"></i><div>Price: <b>${money(t.pricePerSession)}</b> per session, paid at the gym. This sends a <b>request</b>; the trainer has not confirmed it.</div></div></form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: existing ? 'Save changes' : 'Send request', onClick: async (btn, m) => {
        const f = $('#bkForm', m.el); const { valid, values } = UI.validate(f, { contactPhone: { label: 'Phone', required: true, pattern: /^[0-9+\-\s]{10,15}$/, message: 'Enter a phone number with 10–15 digits.' } });
        let ok = valid; if (!pickedTime) { $('#slotErr', m.el).textContent = 'Choose a time slot.'; ok = false; } if (!ok) return false;
        if (slotTaken(t.id, pickedDate, pickedTime, existing && existing.id)) { $('#slotErr', m.el).textContent = 'That slot was just requested. Pick another.'; return false; }
        const body = { trainerId: t.id, date: pickedDate, time: pickedTime, goal: f.elements.goal.value, notes: f.elements.notes.value.trim(), contactPhone: values.contactPhone, status: 'requested' };
        try { existing ? await API.trainers.updateBooking(existing.id, body) : await API.trainers.book(body); UI.toast(existing ? 'Request updated.' : 'Request sent to ' + t.name + ' (demo).'); load(); } catch (er) { UI.fail(er); return false; }
      } }],
      onOpen: el => {
        $('#dateGrid', el).addEventListener('click', e => { const b = e.target.closest('[data-date]'); if (!b) return; pickedDate = b.dataset.date; pickedTime = ''; $$('#dateGrid .slot', el).forEach(x => x.classList.toggle('selected', x === b)); $('#slotGrid', el).innerHTML = slotsHtml(); });
        $('#slotGrid', el).addEventListener('click', e => { const b = e.target.closest('[data-slot]'); if (!b || b.disabled) return; pickedTime = b.dataset.slot; $('#slotErr', el).textContent = ''; $$('#slotGrid .slot', el).forEach(x => x.classList.toggle('selected', x === b)); });
      } });
  }

  /* ---------- my requests ---------- */
  function renderBookings() {
    const list = bookings.slice().sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    $('#bkCount').textContent = list.length ? list.length + ' total' : '';
    $('#bookingList').innerHTML = list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Trainer</th><th>When</th><th>Goal</th><th>Status</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${list.map(b => { const t = trainers.find(x => x.id === b.trainerId); const past = b.date < todayISO(); const st = b.status === 'cancelled' ? ['Cancelled', 'red'] : past ? ['Past', ''] : [API.config.useBackend ? (b.status === 'confirmed' ? 'Confirmed' : 'Requested') : 'Requested (demo)', b.status === 'confirmed' ? 'green' : 'blue'];
      return `<tr><td><b>${esc(t ? t.name : 'Trainer')}</b></td><td>${fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${esc(b.time)}</td><td>${esc(b.goal)}</td><td>${UI.badge(st[0], st[1])}</td><td class="right nowrap">${b.status !== 'cancelled' && !past ? `<button class="btn sm secondary" data-change="${b.id}">Change</button> <button class="btn sm danger outline" data-cancel="${b.id}">Cancel</button>` : `<button class="btn sm ghost" data-remove="${b.id}" aria-label="Remove from list">Remove</button>`}</td></tr>`; }).join('')}</tbody></table></div>`
      : UI.empty({ icon: 'calendar', title: 'No session requests yet', text: 'Pick a trainer above and send your first request.' });
  }
  $('#bookingList').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.change) { const bk = bookings.find(x => x.id === b.dataset.change); return openBooking(bk.trainerId, bk); }
    if (b.dataset.cancel) { if (await UI.confirm({ title: 'Cancel this request?', message: 'The trainer will no longer see this request.', confirmText: 'Cancel request', danger: true })) { try { await API.trainers.updateBooking(b.dataset.cancel, { status: 'cancelled' }); UI.toast('Request cancelled.'); load(); } catch (er) { UI.fail(er); } } }
    if (b.dataset.remove) { try { await API.trainers.cancelBooking(b.dataset.remove); UI.toast('Removed from your list.'); load(); } catch (er) { UI.fail(er); } }
  });

  load();
});
