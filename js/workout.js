/* ==========================================================================
   FORMA – workout.js   (Feature 1: workout planner)

   Two parts:
   1. DEMO ENGINE  – rule-based generator registered as DemoEngines.workout.
      Replace by a server model: set FORMA_CONFIG.useBackend = true and
      implement POST /workout-plans/generate (see backend guide).
   2. UI           – form, plan rendering, swap/remove exercise, save/rename/delete.

   Plan JSON shape (same for demo and backend):
   { id?, name, createdAt, preferences:{goal,level,durationMin,daysPerWeek,equipment[],notes},
     summary:{split,sessionsPerWeek,avgMinutes,setsPerWeek},
     days:[{ day:'Monday', focus:'Upper body', rest:false, estMinutes:55,
             exercises:[{ exerciseId,name,muscle,equipment,sets,reps,restSec,notes }] }],
     tips:[string] }
   ========================================================================== */

/* ---------------- 1. demo engine ---------------- */
const WorkoutEngine = (() => {
  const GOALS = {
    weight_loss: { label: 'Weight loss', desc: 'Burn more, build habits', icon: 'flame' },
    muscle_gain: { label: 'Muscle gain', desc: 'Build size and shape', icon: 'dumbbell' },
    fitness: { label: 'General fitness', desc: 'Feel fit and capable', icon: 'heart' },
    strength: { label: 'Strength', desc: 'Lift heavier over time', icon: 'bolt' }
  };
  const LEVELS = { beginner: { label: 'Beginner', n: 1 }, intermediate: { label: 'Intermediate', n: 2 }, advanced: { label: 'Advanced', n: 3 } };
  const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SCHEDULE = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };

  // Slot = which muscle(s) a day needs, in priority order.
  const S = (m, kind) => ({ m: Array.isArray(m) ? m : [m], kind: kind || 'any' });
  const DAY_TYPES = {
    full: { focus: 'Full body', slots: [S('legs', 'compound'), S('chest', 'compound'), S('back', 'compound'), S(['glutes', 'shoulders']), S('core'), S(['biceps', 'triceps']), S('legs'), S('shoulders')] },
    fullB: { focus: 'Full body', slots: [S(['glutes', 'legs'], 'compound'), S('back', 'compound'), S(['chest', 'shoulders'], 'compound'), S('legs'), S(['biceps', 'triceps']), S('core'), S('back'), S('chest')] },
    upper: { focus: 'Upper body', slots: [S('chest', 'compound'), S('back', 'compound'), S('shoulders', 'compound'), S('back'), S('biceps'), S('triceps'), S('chest'), S('core')] },
    lower: { focus: 'Lower body', slots: [S('legs', 'compound'), S(['glutes'], 'compound'), S('legs'), S('legs', 'isolation'), S('glutes'), S('core'), S('legs')] },
    push: { focus: 'Push (chest, shoulders, triceps)', slots: [S('chest', 'compound'), S('shoulders', 'compound'), S('chest'), S('triceps'), S('shoulders', 'isolation'), S('triceps'), S('core')] },
    pull: { focus: 'Pull (back, biceps)', slots: [S('back', 'compound'), S('back', 'compound'), S('back'), S('shoulders', 'isolation'), S('biceps'), S('biceps'), S('core')] },
    legs: { focus: 'Legs and glutes', slots: [S('legs', 'compound'), S(['legs', 'glutes'], 'compound'), S('glutes'), S('legs', 'isolation'), S('legs'), S('core'), S('legs')] },
    cardio: { focus: 'Cardio and core', slots: [], cardio: true }
  };
  const SPLITS = {
    2: ['full', 'fullB'], 3: ['full', 'fullB', 'full'], 4: ['upper', 'lower', 'upper', 'lower'],
    5: ['push', 'pull', 'legs', 'upper', 'lower'], 6: ['push', 'pull', 'legs', 'push', 'pull', 'legs']
  };

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function prescribe(goal, lvl, ex, index) {
    const compound = ex.kind === 'compound';
    let sets, reps, rest;
    if (ex.kind === 'timed') {
      reps = lvl === 1 ? '20–30 sec' : lvl === 2 ? '30–45 sec' : '45–60 sec'; sets = lvl === 1 ? 2 : 3; rest = 40;
    } else if (ex.kind === 'core') {
      reps = lvl === 1 ? '10–12' : '12–20'; sets = lvl === 1 ? 2 : 3; rest = 45;
    } else if (ex.kind === 'cardio') {
      reps = '40 sec on / 20 sec off'; sets = 3; rest = 30;
    } else if (goal === 'strength') {
      sets = compound ? 4 : 3; reps = compound ? '4–6' : '8–10'; rest = compound ? 150 : 90;
    } else if (goal === 'muscle_gain') {
      sets = compound ? 4 : 3; reps = compound ? '8–10' : '10–15'; rest = compound ? 90 : 60;
    } else if (goal === 'weight_loss') {
      sets = 3; reps = compound ? '12–15' : '15–20'; rest = 40;
    } else {
      sets = 3; reps = compound ? '10–12' : '12–15'; rest = 60;
    }
    if (ex.kind === 'compound' || ex.kind === 'isolation') {
      if (lvl === 1) sets = Math.max(2, sets - 1);
      if (lvl === 3 && compound && index < 2) sets = Math.min(5, sets + 1);
    }
    return { sets, reps, restSec: rest };
  }
  const minutesFor = p => (p.sets * (45 + p.restSec)) / 60;

  function pickExercise(pool, slot, used, usage, rand) {
    const match = (strictKind) => pool.filter(e => slot.m.includes(e.muscle) && !used.has(e.id) && e.kind !== 'cardio' &&
      (!strictKind || slot.kind === 'any' || (slot.kind === 'compound' ? e.kind === 'compound' : e.kind !== 'compound')));
    let c = match(true); if (!c.length) c = match(false);
    if (!c.length) return null;
    const least = Math.min(...c.map(e => usage[e.id] || 0));
    c = c.filter(e => (usage[e.id] || 0) === least);
    return c[Math.floor(rand() * c.length)];
  }

  function cardioFinisher(pool, lvl, minutes, rand, usage) {
    const c = pool.filter(e => e.kind === 'cardio'); if (!c.length) return null;
    const least = Math.min(...c.map(e => usage[e.id] || 0)); const pick = c.filter(e => (usage[e.id] || 0) === least);
    const ex = pick[Math.floor(rand() * pick.length)];
    return { ex, mins: Math.max(5, Math.min(25, Math.round(minutes))) };
  }

  function generate(prefs) {
    const goal = GOALS[prefs.goal] ? prefs.goal : 'fitness';
    const lvlKey = LEVELS[prefs.level] ? prefs.level : 'beginner'; const lvl = LEVELS[lvlKey].n;
    const duration = Math.max(20, Math.min(120, Number(prefs.durationMin) || 60));
    const days = Math.max(2, Math.min(6, Number(prefs.daysPerWeek) || 3));
    const equipment = Array.from(new Set(['bodyweight'].concat(prefs.equipment || [])));
    const seed = prefs.seed !== undefined ? prefs.seed : Math.floor(Math.random() * 1e9);
    const rand = rng(seed);
    const pool = DemoData.exercises.filter(e => equipment.includes(e.eq) && e.level <= lvl);
    const usage = {};
    const weekday = SCHEDULE[days];
    let split = SPLITS[days].slice();
    // Weight-loss / fitness plans with 5+ days swap the last session for a cardio-and-core day.
    if ((goal === 'weight_loss' || goal === 'fitness') && days >= 5) split[split.length - 1] = 'cardio';

    const out = WEEK.map(d => ({ day: d, focus: 'Rest day', rest: true, estMinutes: 0, exercises: [], note: 'Rest or easy movement: a 20–30 minute walk, stretching or yoga.' }));
    const budget = duration - 11; // warm-up + cool-down

    split.forEach((type, i) => {
      const def = DAY_TYPES[type]; const used = new Set(); const items = []; let total = 0;
      const addItem = (ex, p, extra) => { items.push(Object.assign({ exerciseId: ex.id, name: ex.name, muscle: ex.muscle, equipment: ex.eq, notes: ex.tip }, p, extra || {})); usage[ex.id] = (usage[ex.id] || 0) + 1; used.add(ex.id); total += minutesFor(p); };
      if (def.cardio) {
        // Interval-style cardio blocks (about 65% of the time) plus core work. Always at least 3 items.
        const blocks = budget >= 45 ? 3 : 2;
        const perBlock = Math.max(5, Math.min(15, Math.round(budget * 0.65 / blocks)));
        for (let b = 0; b < blocks; b++) {
          const f = cardioFinisher(pool.filter(e => !used.has(e.id)), lvl, perBlock, rand, usage); if (!f) break;
          addItem(f.ex, { sets: 1, reps: f.mins + ' min', restSec: 60 }, { notes: f.ex.tip });
          total += f.mins - minutesFor({ sets: 1, restSec: 60 });
        }
        for (const slot of [S('core'), S('core'), S('core'), S('core')]) {
          if (total >= budget && items.length >= 3) break;
          const ex = pickExercise(pool, slot, used, usage, rand); if (!ex) break;
          addItem(ex, prescribe(goal, lvl, ex, items.length));
        }
      } else {
        for (const slot of def.slots) {
          if (items.length >= 3 && total >= budget - 3) break;
          if (items.length >= 9) break;
          const ex = pickExercise(pool, slot, used, usage, rand); if (!ex) continue;
          const p = prescribe(goal, lvl, ex, items.length);
          if (items.length >= 3 && total + minutesFor(p) > budget + 4) break;
          addItem(ex, p);
        }
        // Limited equipment can leave a day short. Top up (at least 4 exercises) from related muscle groups.
        const FALLBACK = { push: ['chest', 'shoulders', 'triceps', 'core', 'full'], pull: ['back', 'shoulders', 'biceps', 'core', 'full'], legs: ['legs', 'glutes', 'core', 'full'], lower: ['legs', 'glutes', 'core', 'full'], upper: ['chest', 'back', 'shoulders', 'core', 'full'] };
        const order = FALLBACK[type] || ['core', 'full', 'legs', 'glutes', 'chest', 'back', 'shoulders'];
        for (const m of order) {
          while (items.length < 4) { const ex = pickExercise(pool, S(m), used, usage, rand); if (!ex) break; addItem(ex, prescribe(goal, lvl, ex, items.length)); }
          if (items.length >= 4) break;
        }
        // Finisher cardio for fat-loss / fitness goals when time is left
        if ((goal === 'weight_loss' || goal === 'fitness') && budget - total >= 8) {
          const f = cardioFinisher(pool, lvl, Math.min(goal === 'weight_loss' ? 20 : 12, budget - total), rand, usage);
          if (f) { addItem(f.ex, { sets: 1, reps: f.mins + ' min', restSec: 0 }, { notes: f.ex.tip + ' Finisher.' }); total += f.mins - minutesFor({ sets: 1, restSec: 0 }); }
        }
      }
      // Short sessions: trim sets (never below 2) from the longest exercises until the day fits the time budget.
      while (total > budget + 3) {
        const cand = items.filter(e => e.sets > 2 && !/min/.test(e.reps)).sort((a, b) => b.sets - a.sets)[0];
        if (!cand) break; cand.sets--; total -= (45 + cand.restSec) / 60;
      }
      const idx = weekday[i];
      out[idx] = { day: WEEK[idx], focus: def.focus, rest: false, estMinutes: Math.round(total + 11), exercises: items };
    });

    const trained = out.filter(d => !d.rest);
    const setsPerWeek = trained.reduce((s, d) => s + d.exercises.reduce((a, e) => a + e.sets, 0), 0);
    const tips = [
      'Warm up for 5–6 minutes before each session and cool down with light stretching.',
      lvl === 1 ? 'Pick weights where the last 2 reps feel challenging but your form stays clean.' : 'Aim to add a rep or a little weight each week while keeping form strict.',
      goal === 'weight_loss' ? 'Pair training with a modest calorie deficit and a daily walk. Track meals on the Nutrition page.' :
        goal === 'muscle_gain' ? 'Eat enough protein and slightly above maintenance calories, and sleep 7–9 hours.' :
          goal === 'strength' ? 'Rest fully between heavy sets and log your weights so you can progress.' : 'Mix strength and cardio and build up gradually.',
      'Drink water through the session and stop if you feel sharp pain or dizziness.'
    ];
    const missing = [];
    ['chest', 'back', 'legs', 'shoulders'].forEach(m => { if (!pool.some(e => e.muscle === m && e.kind !== 'cardio')) missing.push(m); });
    if (missing.length) tips.push('With the equipment selected there are few options for: ' + missing.join(', ') + '. Add more equipment for a more balanced plan.');

    return {
      name: `${GOALS[goal].label} · ${LEVELS[lvlKey].label} · ${days} days`, createdAt: new Date().toISOString(),
      preferences: { goal, level: lvlKey, durationMin: duration, daysPerWeek: days, equipment, notes: prefs.notes || '', seed },
      summary: { split: [...new Set(split.map(t => DAY_TYPES[t].focus))].join(' / '), sessionsPerWeek: days, avgMinutes: Math.round(trained.reduce((s, d) => s + d.estMinutes, 0) / trained.length), setsPerWeek },
      days: out, tips
    };
  }

  /** Alternatives for the "swap exercise" action. */
  function alternatives(plan, day, exercise) {
    const equipment = plan.preferences.equipment; const lvl = LEVELS[plan.preferences.level].n;
    const names = new Set(day.exercises.map(e => e.exerciseId));
    return DemoData.exercises.filter(e => e.muscle === exercise.muscle && e.id !== exercise.exerciseId && !names.has(e.id) && equipment.includes(e.eq) && e.level <= lvl && (e.kind === 'cardio') === (exercise.equipment === 'cardio' || DemoData.exercises.find(x => x.id === exercise.exerciseId)?.kind === 'cardio'));
  }
  function toRow(plan, ex, old) {
    const p = old.reps.includes('min') && ex.kind === 'cardio' ? { sets: 1, reps: old.reps, restSec: old.restSec } : prescribe(plan.preferences.goal, LEVELS[plan.preferences.level].n, ex, 2);
    return Object.assign({ exerciseId: ex.id, name: ex.name, muscle: ex.muscle, equipment: ex.eq, notes: ex.tip }, p);
  }
  return { GOALS, LEVELS, generate, alternatives, toRow };
})();
DemoEngines.workout = prefs => WorkoutEngine.generate(prefs);

/* ---------------- 2. UI ---------------- */
Page.ready(function () {
  const { GOALS, LEVELS } = WorkoutEngine;
  const form = $('#planForm');
  const saved = Store.get('prefs:workout', { goal: 'weight_loss', level: 'beginner', durationMin: 60, daysPerWeek: 3, equipment: ['dumbbells', 'machines'], notes: '' });
  let plan = null;          // plan currently displayed (may be edited)
  let planId = null;        // set when the displayed plan has been saved

  /* build form controls */
  $('#goalCards').innerHTML = Object.entries(GOALS).map(([id, g]) =>
    `<input type="radio" name="goal" id="goal_${id}" value="${id}" ${saved.goal === id ? 'checked' : ''}><label for="goal_${id}">${Icons.svg(g.icon)}<span>${g.label}</span><small>${g.desc}</small></label>`).join('');
  $('#levelSeg').innerHTML = Object.entries(LEVELS).map(([id, l]) =>
    `<input type="radio" name="level" id="lvl_${id}" value="${id}" ${saved.level === id ? 'checked' : ''}><label for="lvl_${id}">${l.label}</label>`).join('');
  $('#daysSeg').innerHTML = [2, 3, 4, 5, 6].map(n =>
    `<input type="radio" name="daysPerWeek" id="days_${n}" value="${n}" ${Number(saved.daysPerWeek) === n ? 'checked' : ''}><label for="days_${n}">${n}</label>`).join('');
  $('#duration').value = String(saved.durationMin);
  $('#notes').value = saved.notes || '';
  $('#equipmentChips').innerHTML = DemoData.equipmentOptions.map(o =>
    `<button type="button" class="chip ${o.locked || saved.equipment.includes(o.id) ? 'active' : ''}" data-eq="${o.id}" aria-pressed="${o.locked || saved.equipment.includes(o.id)}" ${o.locked ? 'disabled style="opacity:.8;cursor:default"' : ''}>${o.label}</button>`).join('');
  $('#equipmentChips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b || b.disabled) return;
    b.classList.toggle('active'); b.setAttribute('aria-pressed', b.classList.contains('active'));
  });

  const readPrefs = () => ({
    goal: form.elements.goal.value, level: form.elements.level.value,
    durationMin: Number(form.elements.durationMin.value), daysPerWeek: Number(form.elements.daysPerWeek.value),
    equipment: $$('#equipmentChips .chip.active').map(b => b.dataset.eq), notes: form.elements.notes.value.trim()
  });

  form.addEventListener('submit', e => { e.preventDefault(); build(); });

  async function build(seed) {
    const prefs = readPrefs();
    if (!prefs.goal || !prefs.level) { UI.toast('Choose a goal and an experience level first.', 'error'); return; }
    Store.set('prefs:workout', prefs);
    const btn = $('button[type=submit]', form); btn.disabled = true;
    try {
      plan = await API.workout.generate(seed !== undefined ? Object.assign({}, prefs, { seed }) : prefs);
      planId = null; renderPlan(); $('#planOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) { UI.fail(err, 'Could not generate a plan.'); }
    btn.disabled = false;
  }

  /* ---- plan view ---- */
  function renderPlan() {
    const box = $('#planOutput');
    if (!plan) { box.innerHTML = `<div class="card">${UI.empty({ icon: 'dumbbell', title: 'No plan yet', text: 'Fill in your preferences and press “Generate my plan”.' })}</div>`; return; }
    const p = plan.preferences; const s = plan.summary;
    box.innerHTML = `
      <div class="card mb-2" id="planHead">
        <div class="card-head">
          <div><h2 class="mb-0">${esc(plan.name)}</h2><div class="muted small">${planId ? 'Saved plan' : 'Not saved yet'} · ${UI.demoTag('Rule-based demo')}</div></div>
          <div class="btn-row no-print">
            <button class="btn" type="button" id="savePlan">${Icons.svg('check')} ${planId ? 'Update saved plan' : 'Save plan'}</button>
            <button class="btn secondary" type="button" id="shufflePlan">${Icons.svg('refresh')} Shuffle</button>
            <button class="btn secondary" type="button" id="printPlan">${Icons.svg('download')} Print</button>
            <button class="btn secondary" type="button" id="jsonPlan">${Icons.svg('copy')} Export JSON</button>
          </div>
        </div>
        <div class="chip-row" style="cursor:default">
          ${UI.badge(GOALS[p.goal].label, 'orange')} ${UI.badge(LEVELS[p.level].label, 'teal')} ${UI.badge(p.durationMin + ' min sessions', 'blue')}
          ${UI.badge(s.sessionsPerWeek + ' days / week')} ${UI.badge('≈ ' + s.setsPerWeek + ' sets / week')} ${UI.badge(s.split)}
        </div>
        ${p.notes ? `<p class="mt-2 mb-0 small"><b>Your notes:</b> ${esc(p.notes)}</p>` : ''}
      </div>
      <div class="plan-days">${plan.days.map((d, di) => dayCard(d, di)).join('')}</div>
      <div class="card mt-2"><h4>Coaching tips</h4><ul class="mb-0">${plan.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
  }
  function dayCard(d, di) {
    if (d.rest) return `<div class="day-card"><div class="day-head"><h4>${d.day}</h4><span class="badge">Rest day</span></div><div class="rest-day">${esc(d.note || 'Rest or easy movement.')}</div></div>`;
    return `<div class="day-card"><div class="day-head"><h4>${d.day} · ${esc(d.focus)}</h4><span class="badge">≈ ${d.estMinutes} min</span></div>
      <div class="table-wrap" style="border:0;border-radius:0"><table class="ex-table"><thead><tr><th>Exercise</th><th>Sets</th><th>Reps / time</th><th>Rest</th><th class="no-print"><span class="sr-only">Actions</span></th></tr></thead><tbody>
      ${d.exercises.map((e, ei) => `<tr><td>${esc(e.name)}<div class="muted tiny" style="font-weight:400">${esc(e.notes || '')}</div></td><td>${e.sets}</td><td>${esc(e.reps)}</td><td>${e.restSec ? e.restSec + ' s' : '–'}</td>
      <td class="right nowrap no-print"><button class="icon-btn" style="width:32px;height:32px" type="button" data-swap="${di}:${ei}" aria-label="Swap ${esc(e.name)}" title="Swap exercise">${Icons.svg('refresh')}</button>
      <button class="icon-btn" style="width:32px;height:32px" type="button" data-remove="${di}:${ei}" aria-label="Remove ${esc(e.name)}" title="Remove exercise">${Icons.svg('x')}</button></td></tr>`).join('')}
      ${d.exercises.length ? '' : '<tr><td colspan="5" class="muted">All exercises removed. Press Shuffle to rebuild the plan.</td></tr>'}
      </tbody></table></div></div>`;
  }

  $('#planOutput').addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || !plan) return;
    if (t.id === 'savePlan') return savePlan();
    if (t.id === 'shufflePlan') return build(Math.floor(Math.random() * 1e9));
    if (t.id === 'printPlan') return window.print();
    if (t.id === 'jsonPlan') { UI.download(plan.name.replace(/[^\w]+/g, '-').toLowerCase() + '.json', JSON.stringify(plan, null, 2), 'application/json'); return UI.toast('Plan exported as JSON.'); }
    if (t.dataset.remove) {
      const [di, ei] = t.dataset.remove.split(':').map(Number);
      plan.days[di].exercises.splice(ei, 1); renderPlan(); UI.toast('Exercise removed. Save the plan to keep this change.', 'info');
    }
    if (t.dataset.swap) {
      const [di, ei] = t.dataset.swap.split(':').map(Number); const day = plan.days[di]; const ex = day.exercises[ei];
      const alts = WorkoutEngine.alternatives(plan, day, ex);
      if (!alts.length) return UI.toast('No other exercise fits your equipment for this muscle group.', 'info');
      UI.modal({
        title: 'Swap ' + ex.name,
        body: `<p class="muted">Pick a replacement for the same muscle group (${esc(ex.muscle)}).</p><div class="chip-row" id="altList">${alts.map(a => `<button type="button" class="chip" data-id="${a.id}">${esc(a.name)}</button>`).join('')}</div>`,
        footer: [{ label: 'Cancel', cls: 'secondary' }],
        onOpen: (el, close) => $('#altList', el).addEventListener('click', ev => {
          const c = ev.target.closest('.chip'); if (!c) return;
          const newEx = DemoData.exercises.find(x => x.id === c.dataset.id);
          day.exercises[ei] = WorkoutEngine.toRow(plan, newEx, ex); close(); renderPlan(); UI.toast('Swapped to ' + newEx.name + '.');
        })
      });
    }
  });

  async function savePlan() {
    try {
      if (planId) { await API.workout.remove(planId); }
      const rec = await API.workout.save(plan); planId = rec.id; plan = Object.assign({}, plan, { id: rec.id });
      UI.toast('Plan saved.'); renderPlan(); loadSaved();
    } catch (err) { UI.fail(err, 'Could not save the plan.'); }
  }

  /* ---- saved plans: view / rename / delete ---- */
  async function loadSaved() {
    let list; try { list = await API.workout.list(); } catch (err) { return UI.fail(err); }
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    $('#savedCount').textContent = list.length ? list.length + ' saved' : '';
    $('#savedPlans').innerHTML = list.length ? '<ul class="list-plain">' + list.map(p => `<li><span><b>${esc(p.name)}</b><br><span class="muted small">${GOALS[p.preferences.goal] ? GOALS[p.preferences.goal].label : ''} · saved ${fmtDate(p.createdAt)}</span></span>
      <span class="btn-row"><button class="btn sm secondary" data-view="${p.id}">View</button><button class="btn sm secondary" data-rename="${p.id}">Rename</button><button class="btn sm danger outline" data-del="${p.id}" aria-label="Delete ${esc(p.name)}">Delete</button></span></li>`).join('') + '</ul>'
      : UI.empty({ icon: 'list', title: 'No saved plans', text: 'Generate a plan and press Save plan to keep it here.' });
    $('#savedPlans').onclick = async e => {
      const b = e.target.closest('button'); if (!b) return;
      const item = list.find(x => x.id === (b.dataset.view || b.dataset.rename || b.dataset.del)); if (!item) return;
      if (b.dataset.view) { plan = JSON.parse(JSON.stringify(item)); planId = item.id; renderPlan(); $('#planOutput').scrollIntoView({ behavior: 'smooth' }); }
      if (b.dataset.rename) {
        UI.modal({ title: 'Rename plan', body: '<form id="rnForm"><div class="field"><label for="rnName">Plan name</label><input class="form-control" id="rnName" name="name" maxlength="60"></div></form>',
          onOpen: el => { $('#rnName', el).value = item.name; },
          footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Save name', onClick: async (btn, m) => {
            const { valid, values } = UI.validate($('#rnForm', m.el), { name: { label: 'Name', required: true, min: 2, max: 60 } }); if (!valid) return false;
            try { await API.workout.remove(item.id); const rec = await API.workout.save(Object.assign({}, item, { name: values.name })); if (planId === item.id) { planId = rec.id; plan.name = values.name; renderPlan(); } UI.toast('Plan renamed.'); loadSaved(); } catch (err) { UI.fail(err); return false; }
          } }] });
      }
      if (b.dataset.del) {
        if (await UI.confirm({ title: 'Delete this plan?', message: `“${item.name}” will be removed.`, confirmText: 'Delete plan', danger: true })) {
          try { await API.workout.remove(item.id); if (planId === item.id) { planId = null; renderPlan(); } UI.toast('Plan deleted.'); loadSaved(); } catch (err) { UI.fail(err); }
        }
      }
    };
  }

  renderPlan();
  loadSaved();
});
