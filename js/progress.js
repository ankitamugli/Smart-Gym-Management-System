/* ==========================================================================
   FORMA – progress.js   (Feature 6: progress dashboard + demo projection)

   1. DEMO PREDICTION ENGINE (DemoEngines.prediction) – ordinary least-squares
      line through recent weight entries. NOT AI. Replace with a server model:
      GET /progress/prediction?weeks=12
      reply { generatedBy, weeks:[{date,predictedWeightKg,lower,upper}], etaTargetDate, confidence }
   2. UI – stats, goal tracker, charts, add/delete workout + weight entries.

   API used: API.progress.workouts/addWorkout/removeWorkout, metrics/addMetric/
   removeMetric, goal/saveGoal, prediction
   ========================================================================== */

DemoEngines.prediction = function ({ weeks, metrics, goal }) {
  const pts = metrics.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-8);   // last 8 entries
  if (pts.length < 3) return { generatedBy: 'demo-linear-trend', ok: false, reason: 'Log at least 3 weight entries to see a projection.', weeks: [] };
  const t0 = new Date(pts[0].date + 'T12:00:00').getTime(); const x = pts.map(p => (new Date(p.date + 'T12:00:00').getTime() - t0) / 86400000); const y = pts.map(p => p.weightKg);
  const n = pts.length; const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  const sxx = x.reduce((s, v) => s + (v - mx) ** 2, 0); if (!sxx) return { generatedBy: 'demo-linear-trend', ok: false, reason: 'Entries need to be on different dates.', weeks: [] };
  let slope = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0) / sxx; const icpt = my - slope * mx;   // kg per day
  const resid = Math.sqrt(y.reduce((s, v, i) => s + (v - (icpt + slope * x[i])) ** 2, 0) / Math.max(1, n - 2));
  // Real-world progress slows down, so damp the demo slope a little each week.
  const last = pts[n - 1]; const lastX = x[n - 1]; const out = []; let w = icpt + slope * lastX; const today = todayISO();
  const daysFromLast = Math.max(0, daysBetween(last.date, today)); w += slope * daysFromLast * 0.9;
  for (let i = 1; i <= weeks; i++) {
    const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() + i * 7); const damp = Math.pow(0.985, i);
    w += slope * 7 * damp; const band = resid * 1.2 + i * 0.12;
    out.push({ date: DemoData.iso(d), predictedWeightKg: round1(w), lower: round1(w - band), upper: round1(w + band) });
  }
  let eta = null; const target = goal.targetWeightKg;
  const reach = out.find(p => slope < 0 ? p.predictedWeightKg <= target : p.predictedWeightKg >= target); if (reach) eta = reach.date;
  const weeklyChange = round1(slope * 7);
  const confidence = resid < 0.4 && n >= 6 ? 'moderate' : 'low';
  return { generatedBy: 'demo-linear-trend', ok: true, weeklyChangeKg: weeklyChange, residualKg: round1(resid), confidence, etaTargetDate: eta, weeks: out };
};

Page.ready(function () {
  const GOAL_TYPES = { weight_loss: 'Lose weight', muscle_gain: 'Gain weight / muscle', fitness: 'Maintain and stay fit', strength: 'Get stronger' };
  let workouts = [], metrics = [], goal = null, pred = null;
  const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const mondayOf = d => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return DemoData.iso(x); };

  async function load() {
    try {
      [workouts, metrics, goal] = await Promise.all([API.progress.workouts(), API.progress.metrics(), API.progress.goal()]);
      pred = await API.progress.prediction({ weeks: +$('#horizon').value });
    } catch (e) { return UI.fail(e, 'Could not load progress data.'); }
    metrics.sort((a, b) => a.date.localeCompare(b.date)); workouts.sort((a, b) => b.date.localeCompare(a.date));
    render();
  }

  function render() { renderStats(); renderWeight(); renderGoal(); renderCharts(); renderLists(); }

  function renderStats() {
    const cur = metrics.length ? metrics[metrics.length - 1] : null; const first = metrics[0];
    const change = cur && first ? round1(cur.weightKg - first.weightKg) : 0;
    const monday = mondayOf(todayISO()); const wk = workouts.filter(w => w.date >= monday);
    const last30 = workouts.filter(w => daysBetween(w.date, todayISO()) <= 29);
    const stat = (icon, tone, num, label) => `<div class="card"><div class="stat"><div class="stat-ico ${tone}">${Icons.svg(icon)}</div><div><div class="num">${num}</div><div class="lbl">${label}</div></div></div></div>`;
    $('#progressStats').innerHTML = stat('scale', 'blue', cur ? cur.weightKg + ' kg' : '–', cur ? 'Current weight' : 'No weight logged') +
      stat('progress', change <= 0 ? 'green' : 'amber', (change > 0 ? '+' : '') + change + ' kg', 'Change since ' + (first ? fmtShort(first.date) : 'start')) +
      stat('dumbbell', '', `${wk.length}<small style="font-size:1rem;color:var(--muted)"> / ${goal.weeklyWorkouts}</small>`, 'Workouts this week') +
      stat('clock', 'teal', last30.reduce((s, w) => s + w.durationMin, 0) + ' min', `Training, last 30 days (${last30.length} sessions)`);
  }

  function renderWeight() {
    const hist = metrics.map(m => ({ label: fmtShort(m.date), v: m.weightKg }));
    const proj = pred && pred.ok ? pred.weeks : [];
    const labels = hist.map(h => h.label).concat(proj.map(p => fmtShort(p.date)));
    const histData = hist.map(h => h.v).concat(proj.map(() => null));
    const projData = hist.map((h, i) => i === hist.length - 1 ? h.v : null).concat(proj.map(p => p.predictedWeightKg));
    const targetLine = labels.map(() => goal.targetWeightKg);
    Charts.line($('#weightChart'), { labels, datasets: [
      { label: 'Logged weight (kg)', data: histData, fill: true },
      { label: 'Demo projection', data: projData, dashed: true, color: cssv('--info') },
      { label: 'Goal weight', data: targetLine, dashed: true, color: cssv('--teal') }
    ] });
    if (!pred || !pred.ok) $('#projNote').textContent = (pred && pred.reason) || 'No projection available.';
    else $('#projNote').textContent = `Demo trend: about ${pred.weeklyChangeKg > 0 ? '+' : ''}${pred.weeklyChangeKg} kg per week from your last ${Math.min(8, metrics.length)} entries (confidence: ${pred.confidence}). Estimated range after ${proj.length} weeks: ${proj[proj.length - 1].lower}–${proj[proj.length - 1].upper} kg.`;
  }

  function renderGoal() {
    const cur = metrics.length ? metrics[metrics.length - 1].weightKg : goal.startWeightKg;
    const total = goal.targetWeightKg - goal.startWeightKg; const done = cur - goal.startWeightKg;
    const pct = total === 0 ? 100 : Math.max(0, Math.min(100, done / total * 100));
    const left = round1(Math.abs(goal.targetWeightKg - cur)); const daysLeft = daysBetween(todayISO(), goal.targetDate);
    const reached = total < 0 ? cur <= goal.targetWeightKg : total > 0 ? cur >= goal.targetWeightKg : true;
    const eta = pred && pred.ok ? pred.etaTargetDate : null;
    let verdict = '';
    if (reached) verdict = UI.notice('<b>Goal weight reached.</b> Set a new goal to keep going.', 'success', 'check');
    else if (!pred || !pred.ok) verdict = UI.notice('Log at least 3 weight entries for a projection.', '', 'info');
    else if (!eta) verdict = UI.notice('At the current demo trend you would not reach your goal within the projection window. Try a longer window, or adjust your plan.', 'warn', 'alert');
    else verdict = UI.notice(`Demo trend reaches your goal around <b>${fmtDate(eta)}</b> ${goal.targetDate && eta > goal.targetDate ? ' – <b>after</b> your target date' : ' – on time for your target date'}.`, eta > goal.targetDate ? 'warn' : 'success', 'info');
    $('#goalPanel').innerHTML = `<p class="mb-1"><b>${esc(GOAL_TYPES[goal.type] || 'Goal')}</b></p>
      <div class="meter-row"><div class="top"><span>${goal.startWeightKg} kg start</span><b>${goal.targetWeightKg} kg target</b></div><div class="progress"><span style="width:${pct}%"></span></div><div class="tiny muted mt-1">${Math.round(pct)}% of the way · ${left} kg to go</div></div>
      <ul class="list-plain small mb-2"><li><span>Now</span><b>${cur} kg</b></li><li><span>Target date</span><b>${fmtDate(goal.targetDate)}</b></li><li><span>${daysLeft >= 0 ? 'Days left' : 'Past target date by'}</span><b>${Math.abs(daysLeft)}</b></li><li><span>Weekly workout target</span><b>${goal.weeklyWorkouts}</b></li></ul>${verdict}`;
  }

  function renderCharts() {
    const monday = mondayOf(todayISO()); const weeks = []; for (let i = 7; i >= 0; i--) { const d = new Date(monday + 'T12:00:00'); d.setDate(d.getDate() - i * 7); weeks.push(DemoData.iso(d)); }
    const mins = weeks.map(w => { const e = new Date(w + 'T12:00:00'); e.setDate(e.getDate() + 6); const end = DemoData.iso(e); return workouts.filter(x => x.date >= w && x.date <= end).reduce((s, x) => s + x.durationMin, 0); });
    Charts.bar($('#minutesChart'), { labels: weeks.map(fmtShort), datasets: [{ label: 'Minutes', data: mins }], goal: goal.weeklyWorkouts * 45 });
    const fat = metrics.filter(m => m.bodyFatPct !== undefined && m.bodyFatPct !== null && m.bodyFatPct !== '');
    Charts.line($('#fatChart'), { labels: fat.map(m => fmtShort(m.date)), datasets: [{ label: 'Body fat %', data: fat.map(m => m.bodyFatPct), color: cssv('--warning'), fill: true }], unit: '%' });
  }

  function renderLists() {
    $('#wkCount').textContent = workouts.length ? workouts.length + ' sessions' : '';
    $('#workoutList').innerHTML = workouts.length ? `<div class="table-wrap" style="max-height:340px;overflow:auto"><table class="table"><thead><tr><th>Date</th><th>Workout</th><th>Min</th><th>kcal</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${workouts.slice(0, 40).map(w => `<tr><td class="nowrap">${fmtShort(w.date)}</td><td>${esc(w.type)}</td><td>${w.durationMin}</td><td>${w.calories || '–'}</td><td class="right nowrap"><button class="icon-btn" style="width:32px;height:32px" data-edit-wk="${w.id}" aria-label="Edit workout on ${w.date}">${Icons.svg('edit')}</button> <button class="icon-btn" style="width:32px;height:32px" data-del-wk="${w.id}" aria-label="Delete workout on ${w.date}">${Icons.svg('trash')}</button></td></tr>`).join('')}</tbody></table></div>`
      : UI.empty({ icon: 'dumbbell', title: 'No workouts logged', text: 'Log your first session to start your history.' });
    const m = metrics.slice().reverse(); $('#wtCount').textContent = m.length ? m.length + ' entries' : '';
    $('#weightList').innerHTML = m.length ? `<div class="table-wrap" style="max-height:340px;overflow:auto"><table class="table"><thead><tr><th>Date</th><th>Weight</th><th>Body fat</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${m.map(x => `<tr><td class="nowrap">${fmtDate(x.date)}</td><td>${x.weightKg} kg</td><td>${x.bodyFatPct ? x.bodyFatPct + '%' : '–'}</td><td class="right"><button class="icon-btn" style="width:32px;height:32px" data-del-wt="${x.id}" aria-label="Delete weight on ${x.date}">${Icons.svg('trash')}</button></td></tr>`).join('')}</tbody></table></div>`
      : UI.empty({ icon: 'scale', title: 'No weight entries', text: 'Log your weight to see your trend.' });
  }

  /* ---------- events ---------- */
  $('#horizon').addEventListener('change', load);
  window.addEventListener('forma:theme', () => { if (goal) renderWeight(); });
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-del-wk],[data-del-wt],[data-edit-wk]'); if (!b) return;
    if (b.dataset.editWk) return workoutModal(workouts.find(w => w.id === b.dataset.editWk));
    const isWk = !!b.dataset.delWk; const id = b.dataset.delWk || b.dataset.delWt;
    if (!await UI.confirm({ title: isWk ? 'Delete workout?' : 'Delete weight entry?', message: 'This cannot be undone.', confirmText: 'Delete', danger: true })) return;
    try { isWk ? await API.progress.removeWorkout(id) : await API.progress.removeMetric(id); UI.toast('Entry deleted.'); load(); } catch (er) { UI.fail(er); }
  });

  $('#logWeightBtn').addEventListener('click', () => {
    const last = metrics[metrics.length - 1];
    UI.modal({ title: 'Log weight',
      body: `<form id="wtForm" novalidate><div class="form-row"><div class="field"><label for="wDate">Date</label><input class="form-control" id="wDate" name="date" type="date" max="${todayISO()}" value="${todayISO()}"></div>
        <div class="field"><label for="wKg">Weight (kg)</label><input class="form-control" id="wKg" name="weightKg" type="number" step="0.1" value="${last ? last.weightKg : ''}" inputmode="decimal"></div></div>
        <div class="field"><label for="wFat">Body fat % (optional)</label><input class="form-control" id="wFat" name="bodyFatPct" type="number" step="0.1" inputmode="decimal"></div></form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Save entry', onClick: async (btn, m) => {
        const f = $('#wtForm', m.el); const { valid, values } = UI.validate(f, { date: { label: 'Date', required: true }, weightKg: { label: 'Weight', required: true, number: true, minValue: 25, maxValue: 300 }, bodyFatPct: { label: 'Body fat', number: true, minValue: 3, maxValue: 60 } });
        if (!valid) return false; if (values.date > todayISO()) { UI.setError(f.elements.date, 'Date cannot be in the future.'); return false; }
        if (metrics.some(x => x.date === values.date) && !await UI.confirm({ title: 'Entry already exists', message: 'There is already a weight logged for that date. Add another entry anyway?', confirmText: 'Add anyway' })) return false;
        try { await API.progress.addMetric({ date: values.date, weightKg: +values.weightKg, bodyFatPct: values.bodyFatPct ? +values.bodyFatPct : null }); UI.toast('Weight saved.'); load(); } catch (er) { UI.fail(er); return false; }
      } }] });
  });

  $('#logWorkoutBtn').addEventListener('click', () => workoutModal());
  function workoutModal(existing) {
    const types = ['Upper body strength', 'Lower body strength', 'Full body', 'HIIT cardio', 'Steady cardio', 'Core and mobility', 'Yoga', 'Sport / other'];
    UI.modal({ title: existing ? 'Edit workout' : 'Log workout',
      body: `<form id="wkForm" novalidate><div class="form-row"><div class="field"><label for="kDate">Date</label><input class="form-control" id="kDate" name="date" type="date" max="${todayISO()}" value="${existing ? existing.date : todayISO()}"></div>
        <div class="field"><label for="kType">Type</label><select class="form-control" id="kType" name="type">${types.map(t => `<option ${existing && existing.type === t ? 'selected' : ''}>${t}</option>`).join('')}${existing && !types.includes(existing.type) ? `<option selected>${esc(existing.type)}</option>` : ''}</select></div></div>
        <div class="form-row"><div class="field"><label for="kMin">Duration (minutes)</label><input class="form-control" id="kMin" name="durationMin" type="number" value="${existing ? existing.durationMin : 45}"></div>
        <div class="field"><label for="kCal">Calories burned (optional)</label><input class="form-control" id="kCal" name="calories" type="number" value="${existing && existing.calories ? existing.calories : ''}"></div></div>
        <div class="field"><label for="kNotes">Notes (optional)</label><textarea class="form-control" id="kNotes" name="notes" maxlength="200">${esc(existing ? existing.notes || '' : '')}</textarea></div></form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: existing ? 'Save changes' : 'Save workout', onClick: async (btn, m) => {
        const f = $('#wkForm', m.el); const { valid, values } = UI.validate(f, { date: { label: 'Date', required: true }, durationMin: { label: 'Duration', required: true, number: true, minValue: 5, maxValue: 300 }, calories: { label: 'Calories', number: true, minValue: 0, maxValue: 3000 } });
        if (!valid) return false; if (values.date > todayISO()) { UI.setError(f.elements.date, 'Date cannot be in the future.'); return false; }
        const body = { date: values.date, type: f.elements.type.value, durationMin: +values.durationMin, calories: values.calories ? +values.calories : 0, notes: f.elements.notes.value.trim() };
        try { existing ? await API.progress.removeWorkout(existing.id).then(() => API.progress.addWorkout(body)) : await API.progress.addWorkout(body); UI.toast(existing ? 'Workout updated.' : 'Workout saved.'); load(); } catch (er) { UI.fail(er); return false; }
      } }] });
  }

  $('#goalBtn').addEventListener('click', () => {
    const last = metrics.length ? metrics[metrics.length - 1].weightKg : goal.startWeightKg;
    UI.modal({ title: 'Edit goal',
      body: `<form id="gForm" novalidate><div class="field"><label for="gType">Goal type</label><select class="form-control" id="gType" name="type">${Object.entries(GOAL_TYPES).map(([k, v]) => `<option value="${k}" ${goal.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="form-row"><div class="field"><label for="gStart">Start weight (kg)</label><input class="form-control" id="gStart" name="startWeightKg" type="number" step="0.1" value="${goal.startWeightKg}"></div>
        <div class="field"><label for="gTarget">Target weight (kg)</label><input class="form-control" id="gTarget" name="targetWeightKg" type="number" step="0.1" value="${goal.targetWeightKg}"></div></div>
        <div class="form-row"><div class="field"><label for="gDate">Target date</label><input class="form-control" id="gDate" name="targetDate" type="date" min="${todayISO()}" value="${goal.targetDate}"></div>
        <div class="field"><label for="gWk">Workouts per week</label><input class="form-control" id="gWk" name="weeklyWorkouts" type="number" min="1" max="14" value="${goal.weeklyWorkouts}"></div></div>
        <p class="hint">Current weight: ${last} kg. A safe pace is usually well under 1 kg per week.</p></form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Save goal', onClick: async (btn, m) => {
        const f = $('#gForm', m.el); const { valid, values } = UI.validate(f, { startWeightKg: { label: 'Start weight', required: true, number: true, minValue: 25, maxValue: 300 }, targetWeightKg: { label: 'Target weight', required: true, number: true, minValue: 25, maxValue: 300 }, targetDate: { label: 'Target date', required: true }, weeklyWorkouts: { label: 'Workouts per week', required: true, number: true, minValue: 1, maxValue: 14 } });
        if (!valid) return false; if (values.targetDate < todayISO()) { UI.setError(f.elements.targetDate, 'Choose a date in the future.'); return false; }
        try { goal = await API.progress.saveGoal({ type: f.elements.type.value, startWeightKg: +values.startWeightKg, targetWeightKg: +values.targetWeightKg, targetDate: values.targetDate, weeklyWorkouts: +values.weeklyWorkouts }); UI.toast('Goal saved.'); load(); } catch (er) { UI.fail(er); return false; }
      } }] });
  });

  load();
});
