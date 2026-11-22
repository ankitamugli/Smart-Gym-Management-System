/* ==========================================================================
   FORMA – dashboard.js
   Reads from several API modules in parallel and renders the overview.
   Every figure comes from api.js, so connecting a backend updates this page too.
   ========================================================================== */
Page.ready(async function () {
  const sess = API.auth.session();
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  $('#greeting').textContent = `${part}, ${sess.user.name}`;
  $('#todayDate').textContent = fmtDate(todayISO(), { weekday: 'long', day: 'numeric', month: 'short' });
  document.addEventListener('forma:profile', e => { $('#greeting').textContent = `${part}, ${e.detail.name}`; });

  $('#quickLinks').innerHTML = NAV.flatMap(g => g.items).filter(i => i.id !== 'dashboard')
    .map(i => `<a class="quick-link" href="${i.href}">${Icons.svg(i.icon)}<span>${i.label}</span></a>`).join('');

  let data;
  try {
    const today = todayISO();
    const [workouts, metrics, goal, meals, goals, water, checkins, membership, equipment, bookings, trainers] = await Promise.all([
      API.progress.workouts(), API.progress.metrics(), API.progress.goal(), API.nutrition.meals({ date: today }),
      API.nutrition.goals(), API.nutrition.water(), API.checkin.list(), API.membership.current(),
      API.equipment.list(), API.trainers.bookings(), API.trainers.list()
    ]);
    data = { workouts, metrics, goal, meals, goals, water, checkins, membership, equipment, bookings, trainers };
  } catch (err) { UI.fail(err, 'Could not load the dashboard data.'); return; }

  const { workouts, metrics, goal, meals, goals, water, checkins, membership, equipment, bookings, trainers } = data;
  const today = todayISO();

  /* ---- stats ---- */
  const monday = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return DemoData.iso(d); })();
  const thisWeek = workouts.filter(w => w.date >= monday && w.date <= today);
  const month = today.slice(0, 7);
  const monthCheckins = checkins.filter(c => c.date.startsWith(month)).length;
  const daysLeft = daysBetween(today, membership.expiryDate);
  const eaten = Math.round(meals.reduce((s, m) => s + m.items.reduce((a, i) => a + i.calories, 0), 0));
  const cups = (water.find(w => w.date === today) || { cups: 0 }).cups;
  const cupsGoal = Math.round(goals.waterMl / goals.cupMl);
  const latest = metrics.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];

  const stat = (icon, tone, num, label) => `<div class="card"><div class="stat"><div class="stat-ico ${tone}">${Icons.svg(icon)}</div><div><div class="num">${num}</div><div class="lbl">${label}</div></div></div></div>`;
  $('#statCards').innerHTML =
    stat('dumbbell', '', `${thisWeek.length}<small style="font-size:1rem;color:var(--muted)"> / ${goal.weeklyWorkouts}</small>`, 'Workouts this week') +
    stat('calendar', 'teal', monthCheckins, 'Gym visits this month') +
    stat('scale', 'blue', latest ? latest.weightKg + ' kg' : '–', latest ? 'Latest weight · ' + fmtShort(latest.date) : 'No weight logged') +
    stat('membership', 'amber', daysLeft >= 0 ? daysLeft : 'Expired', daysLeft >= 0 ? 'Days left on membership' : 'Renew your membership');

  const lastVisit = checkins.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  $('#heroLine').textContent = thisWeek.length >= goal.weeklyWorkouts
    ? `You have hit your weekly target of ${goal.weeklyWorkouts} workouts. Nice work – keep recovery in mind.`
    : `${goal.weeklyWorkouts - thisWeek.length} more workout${goal.weeklyWorkouts - thisWeek.length === 1 ? '' : 's'} to reach this week's target.${lastVisit ? ' Last gym visit: ' + fmtDate(lastVisit.date, { weekday: 'long', day: 'numeric', month: 'short' }) + '.' : ''}`;

  /* ---- rings ---- */
  Charts.ring($('#calRing'), { value: eaten, max: goals.calories, label: eaten.toLocaleString('en-IN'), sub: `of ${goals.calories.toLocaleString('en-IN')} kcal`, color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() });
  Charts.ring($('#waterRing'), { value: cups, max: cupsGoal, label: `${cups}/${cupsGoal}`, sub: 'cups of water', color: getComputedStyle(document.documentElement).getPropertyValue('--info').trim() });
  window.addEventListener('forma:theme', () => { /* rings pick up new colours on redraw */ });

  /* ---- weekly minutes (last 8 Mondays) ---- */
  const weeks = []; const base = new Date(monday + 'T12:00:00');
  for (let i = 7; i >= 0; i--) { const d = new Date(base); d.setDate(d.getDate() - i * 7); weeks.push(DemoData.iso(d)); }
  const mins = weeks.map(w => { const end = DemoData.iso(new Date(new Date(w + 'T12:00:00').getTime() + 6 * 86400000)); return workouts.filter(x => x.date >= w && x.date <= end).reduce((s, x) => s + x.durationMin, 0); });
  Charts.bar($('#weeklyChart'), { labels: weeks.map(fmtShort), datasets: [{ label: 'Minutes', data: mins }], unit: '' });

  /* ---- weight ---- */
  const sorted = metrics.slice().sort((a, b) => a.date.localeCompare(b.date));
  Charts.line($('#weightChart'), { labels: sorted.map(m => fmtShort(m.date)), datasets: [{ label: 'Weight (kg)', data: sorted.map(m => m.weightKg), fill: true }, { label: 'Goal', data: sorted.map(() => goal.targetWeightKg), dashed: true, color: getComputedStyle(document.documentElement).getPropertyValue('--teal').trim() }], unit: '' });

  /* ---- equipment ---- */
  const count = s => equipment.filter(e => e.status === s).length;
  const rows = [['Available', 'available', 'green'], ['Occupied', 'occupied', 'amber'], ['Under maintenance', 'maintenance', 'over']];
  $('#equipSummary').innerHTML = rows.map(([label, key, tone]) => `<div class="meter-row"><div class="top"><span>${label}</span><b>${count(key)} / ${equipment.length}</b></div><div class="progress ${tone}"><span style="width:${equipment.length ? count(key) / equipment.length * 100 : 0}%"></span></div></div>`).join('');
  if (API.config.useBackend) $('#liveDot').textContent = 'Live';

  /* ---- recent workouts ---- */
  const recent = workouts.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  $('#recentWorkouts').innerHTML = recent.length ? recent.map(w => `<li><span><b>${esc(w.type)}</b><br><span class="muted small">${fmtDate(w.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span></span><span class="badge orange">${w.durationMin} min</span></li>`).join('')
    : UI.empty({ icon: 'dumbbell', title: 'No workouts yet', text: 'Log a session on the Progress page.', action: '<a class="btn sm" href="pages/progress-predictor.html">Log workout</a>' });

  /* ---- upcoming trainer sessions ---- */
  const upcoming = bookings.filter(b => b.date >= today && b.status !== 'cancelled').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 3);
  $('#upcomingSessions').innerHTML = upcoming.length ? '<ul class="list-plain">' + upcoming.map(b => { const t = trainers.find(x => x.id === b.trainerId); return `<li><span><b>${esc(t ? t.name : 'Trainer')}</b><br><span class="muted small">${fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${esc(b.time)}</span></span>${UI.badge('Requested', 'blue')}</li>`; }).join('') + '</ul>'
    : UI.empty({ icon: 'trainers', title: 'No sessions booked', text: 'Find a trainer that fits your goals.', action: '<a class="btn sm" href="pages/trainers.html">Browse trainers</a>' });
});
