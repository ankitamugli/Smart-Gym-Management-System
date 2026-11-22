/* ==========================================================================
   FORMA – nutrition.js   (Feature 3: diet & nutrition tracker)
   API used: API.nutrition.meals/addMeal/updateMeal/removeMeal, foods, goals,
             saveGoals, water, setWater   (see api.js for endpoints + JSON shapes)
   Meal JSON: { id, date:'YYYY-MM-DD', type:'breakfast|lunch|dinner|snacks',
                items:[{foodId,name,serving,qty,calories,protein,carbs,fat}] }
   All macro totals are computed here from items, so a backend only stores items.
   ========================================================================== */
Page.ready(function () {
  const TYPES = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']];
  let date = todayISO(); let goals; let meals = []; let water = []; let metric = 'calories';
  const sum = (items, k) => items.reduce((s, i) => s + (Number(i[k]) || 0), 0);
  const totals = list => { const items = list.flatMap(m => m.items); return { calories: sum(items, 'calories'), protein: sum(items, 'protein'), carbs: sum(items, 'carbs'), fat: sum(items, 'fat') }; };
  const r = n => Math.round(n);
  const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------- date navigation ---------- */
  $('#dayPicker').max = todayISO();
  const shift = n => { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + n); const v = DemoData.iso(d); if (v > todayISO()) return UI.toast('You cannot log meals for future days.', 'info'); date = v; load(); };
  $('#prevDay').innerHTML = '<span style="display:inline-flex;transform:rotate(180deg)">' + Icons.svg('chevron') + '</span>';
  $('#prevDay').addEventListener('click', () => shift(-1));
  $('#nextDay').addEventListener('click', () => shift(1));
  $('#dayPicker').addEventListener('change', e => { if (e.target.value && e.target.value <= todayISO()) { date = e.target.value; load(); } else e.target.value = date; });

  async function load() {
    $('#dayPicker').value = date;
    try {
      const from = new Date(date + 'T12:00:00'); from.setDate(from.getDate() - 6);
      [goals, meals, water] = await Promise.all([API.nutrition.goals(), API.nutrition.meals(), API.nutrition.water()]);
    } catch (e) { return UI.fail(e, 'Could not load nutrition records.'); }
    render();
  }
  const dayMeals = d => meals.filter(m => m.date === d);

  /* ---------- render ---------- */
  function render() {
    const t = totals(dayMeals(date));
    const isToday = date === todayISO();
    $('#mealsTitle').textContent = isToday ? 'Today’s meals' : 'Meals on ' + fmtDate(date, { weekday: 'long', day: 'numeric', month: 'short' });
    $('#mealsSub').textContent = r(t.calories) + ' kcal logged';

    const card = (label, v, goal, unit, tone, icon) => {
      const pct = goal ? Math.min(100, v / goal * 100) : 0; const over = goal && v > goal;
      return `<div class="card"><div class="stat mb-1"><div class="stat-ico ${tone}">${Icons.svg(icon)}</div><div><div class="num">${r(v)}<small style="font-size:.95rem;color:var(--muted)">${unit.trim()}</small></div><div class="lbl">${label} · goal ${goal}${unit}</div></div></div><div class="progress ${over ? 'over' : tone === 'teal' ? 'teal' : tone === 'blue' ? 'blue' : tone === 'green' ? 'green' : ''}"><span style="width:${pct}%"></span></div><div class="tiny muted mt-1">${over ? r(v - goal) + unit + ' over goal' : r(goal - v) + unit + ' left'}</div></div>`;
    };
    $('#macroCards').innerHTML = card('Calories', t.calories, goals.calories, ' kcal', '', 'flame') + card('Protein', t.protein, goals.protein, ' g', 'teal', 'heart') + card('Carbs', t.carbs, goals.carbs, ' g', 'blue', 'bolt') + card('Fat', t.fat, goals.fat, ' g', 'amber', 'droplet');

    renderMeals(); renderMacroChart(t); renderWeek(); renderWater();
  }

  function renderMeals() {
    const list = dayMeals(date);
    if (!list.length) { $('#mealList').innerHTML = UI.empty({ icon: 'nutrition', title: 'No meals logged', text: 'Add what you ate to see calories and macros for the day.', action: '<button class="btn sm" id="emptyAdd">Add a meal</button>' }); const b = $('#emptyAdd'); if (b) b.onclick = () => openMeal(); return; }
    $('#mealList').innerHTML = TYPES.map(([key, label]) => {
      const group = list.filter(m => m.type === key); if (!group.length) return '';
      const cals = r(group.reduce((s, m) => s + sum(m.items, 'calories'), 0));
      return `<div class="meal-block"><div class="meal-head"><span>${label} · ${cals} kcal</span><button class="btn sm ghost" data-add="${key}">${Icons.svg('plus')} Add</button></div>` +
        group.map(m => m.items.map((it, idx) => `<div class="food-row"><div><b>${esc(it.name)}</b> <span class="muted small">× ${it.qty} (${esc(it.serving)})</span><div class="macros">${r(it.calories)} kcal · P ${round1(it.protein)} g · C ${round1(it.carbs)} g · F ${round1(it.fat)} g</div></div>
        <div class="nowrap"><button class="icon-btn" style="width:32px;height:32px" data-edit="${m.id}" aria-label="Edit ${esc(label)} meal" title="Edit meal">${Icons.svg('edit')}</button> <button class="icon-btn" style="width:32px;height:32px" data-del="${m.id}:${idx}" aria-label="Delete ${esc(it.name)}" title="Delete item">${Icons.svg('trash')}</button></div></div>`).join('')).join('') + '</div>';
    }).join('');
  }
  $('#mealList').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.add) return openMeal(null, b.dataset.add);
    if (b.dataset.edit) return openMeal(meals.find(m => m.id === b.dataset.edit));
    if (b.dataset.del) {
      const [id, idx] = b.dataset.del.split(':'); const m = meals.find(x => x.id === id); if (!m) return;
      const item = m.items[Number(idx)];
      if (!await UI.confirm({ title: 'Delete food item?', message: `Remove ${item.name} from this meal?`, confirmText: 'Delete', danger: true })) return;
      try {
        if (m.items.length === 1) await API.nutrition.removeMeal(m.id); else await API.nutrition.updateMeal(m.id, { items: m.items.filter((_, i) => i !== Number(idx)) });
        UI.toast('Food item deleted.'); load();
      } catch (er) { UI.fail(er); }
    }
  });

  function renderMacroChart(t) {
    const kc = [t.protein * 4, t.carbs * 4, t.fat * 9];
    Charts.doughnut($('#macroChart'), { labels: ['Protein', 'Carbs', 'Fat'], data: kc.map(r), colors: [cssv('--teal'), cssv('--info'), cssv('--warning')], valueLabels: [r(t.protein) + ' g', r(t.carbs) + ' g', r(t.fat) + ' g'], centerTop: r(t.calories).toString(), centerBottom: 'kcal' });
  }
  function renderWeek() {
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() - i); days.push(DemoData.iso(d)); }
    const vals = days.map(d => r(totals(dayMeals(d))[metric]));
    const goal = { calories: goals.calories, protein: goals.protein, carbs: goals.carbs, fat: goals.fat }[metric];
    const names = { calories: 'Calories', protein: 'Protein (g)', carbs: 'Carbs (g)', fat: 'Fat (g)' };
    Charts.bar($('#weekChart'), { labels: days.map(d => fmtDate(d, { weekday: 'short', day: 'numeric' })), datasets: [{ label: names[metric], data: vals, color: cssv(metric === 'protein' ? '--teal' : metric === 'carbs' ? '--info' : metric === 'fat' ? '--warning' : '--primary') }], goal });
  }
  $('#chartTabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; metric = b.dataset.metric; $$('#chartTabs .tab').forEach(x => x.classList.toggle('active', x === b)); renderWeek(); });

  /* ---------- water ---------- */
  const cups = () => (water.find(w => w.date === date) || { cups: 0 }).cups;
  function renderWater() {
    const goalCups = Math.round(goals.waterMl / goals.cupMl); const n = cups(); const total = Math.max(goalCups, n);
    $('#waterCups').innerHTML = Array.from({ length: total }, (_, i) => `<button type="button" class="cup ${i < n ? 'full' : ''}" data-n="${i + 1}" aria-label="Set water to ${i + 1} cups" aria-pressed="${i < n}"></button>`).join('');
    $('#waterBadge').textContent = `${n * goals.cupMl} / ${goals.waterMl} ml`;
    $('#waterBar').style.width = Math.min(100, n / goalCups * 100) + '%';
  }
  async function setCups(n) {
    n = Math.max(0, Math.min(30, n));
    try { await API.nutrition.setWater(date, n); const i = water.findIndex(w => w.date === date); if (i >= 0) water[i].cups = n; else water.push({ date, cups: n }); renderWater(); if (n === Math.round(goals.waterMl / goals.cupMl)) UI.toast('Water goal reached!'); } catch (e) { UI.fail(e); }
  }
  $('#waterPlus').addEventListener('click', () => setCups(cups() + 1));
  $('#waterMinus').addEventListener('click', () => setCups(cups() - 1));
  $('#waterCups').addEventListener('click', e => { const b = e.target.closest('.cup'); if (!b) return; const n = Number(b.dataset.n); setCups(n === cups() ? n - 1 : n); });

  /* ---------- goals modal ---------- */
  $('#goalsBtn').addEventListener('click', () => {
    UI.modal({
      title: 'Daily nutrition goals',
      body: `<form id="goalForm" novalidate>
        <div class="form-row"><div class="field"><label for="gCal">Calories (kcal)</label><input class="form-control" id="gCal" name="calories" type="number" value="${goals.calories}"></div>
        <div class="field"><label for="gPro">Protein (g)</label><input class="form-control" id="gPro" name="protein" type="number" value="${goals.protein}"></div></div>
        <div class="form-row"><div class="field"><label for="gCarb">Carbs (g)</label><input class="form-control" id="gCarb" name="carbs" type="number" value="${goals.carbs}"></div>
        <div class="field"><label for="gFat">Fat (g)</label><input class="form-control" id="gFat" name="fat" type="number" value="${goals.fat}"></div></div>
        <div class="form-row"><div class="field"><label for="gWater">Water (ml)</label><input class="form-control" id="gWater" name="waterMl" type="number" step="250" value="${goals.waterMl}"></div>
        <div class="field"><label for="gCup">Cup size (ml)</label><input class="form-control" id="gCup" name="cupMl" type="number" value="${goals.cupMl}"></div></div>
        <p class="hint">These are your own targets. A dietitian can recommend numbers for your body and goals.</p>
      </form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Save goals', onClick: async (btn, m) => {
        const { valid, values } = UI.validate($('#goalForm', m.el), {
          calories: { label: 'Calories', required: true, number: true, minValue: 800, maxValue: 8000 }, protein: { label: 'Protein', required: true, number: true, minValue: 10, maxValue: 500 },
          carbs: { label: 'Carbs', required: true, number: true, minValue: 10, maxValue: 1000 }, fat: { label: 'Fat', required: true, number: true, minValue: 10, maxValue: 400 },
          waterMl: { label: 'Water', required: true, number: true, minValue: 500, maxValue: 8000 }, cupMl: { label: 'Cup size', required: true, number: true, minValue: 100, maxValue: 1000 } });
        if (!valid) return false;
        try { goals = await API.nutrition.saveGoals({ calories: +values.calories, protein: +values.protein, carbs: +values.carbs, fat: +values.fat, waterMl: +values.waterMl, cupMl: +values.cupMl }); UI.toast('Goals saved.'); render(); } catch (e) { UI.fail(e); return false; }
      } }]
    });
  });

  /* ---------- add / edit meal modal ---------- */
  $('#addMealBtn').addEventListener('click', () => openMeal());

  async function openMeal(existing, presetType) {
    let foods; try { foods = await API.nutrition.foods(); } catch (e) { return UI.fail(e); }
    let items = existing ? JSON.parse(JSON.stringify(existing.items)) : [];
    const hour = new Date().getHours(); const guess = hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 19 ? 'snacks' : 'dinner';
    const type = existing ? existing.type : presetType || guess;
    UI.modal({
      title: existing ? 'Edit meal' : 'Add meal', wide: true,
      body: `<form id="mealForm" novalidate>
        <div class="form-row"><div class="field"><label for="mType">Meal</label><select class="form-control" id="mType" name="type">${TYPES.map(([k, l]) => `<option value="${k}" ${k === type ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        <div class="field"><label for="mSearch">Search foods</label><div class="input-icon">${Icons.svg('search')}<input class="form-control" id="mSearch" type="search" placeholder="e.g. rice, egg, dal" autocomplete="off"></div></div></div>
        <div class="grid grid-2">
          <div><div class="label">Food list</div><div id="foodResults" style="max-height:260px;overflow:auto;border:1px solid var(--line);border-radius:12px"></div>
            <button class="btn sm secondary mt-1" type="button" id="customToggle">${Icons.svg('plus')} Add a custom food</button></div>
          <div><div class="label">In this meal</div><div id="mealItems" style="min-height:120px"></div><div class="small muted mt-1" id="mealTotals"></div><div class="error-text" id="mealError"></div></div>
        </div>
        <div id="customBox" class="card flat mt-2 hidden">
          <h4>Custom food</h4>
          <div class="form-row three"><div class="field"><label for="cName">Name</label><input class="form-control" id="cName" name="cName" maxlength="40"></div>
          <div class="field"><label for="cServ">Serving</label><input class="form-control" id="cServ" name="cServ" value="1 serving" maxlength="30"></div>
          <div class="field"><label for="cCal">Calories</label><input class="form-control" id="cCal" name="cCal" type="number" min="0"></div></div>
          <div class="form-row three"><div class="field"><label for="cPro">Protein (g)</label><input class="form-control" id="cPro" name="cPro" type="number" min="0" step="0.1" value="0"></div>
          <div class="field"><label for="cCarb">Carbs (g)</label><input class="form-control" id="cCarb" name="cCarb" type="number" min="0" step="0.1" value="0"></div>
          <div class="field"><label for="cFat">Fat (g)</label><input class="form-control" id="cFat" name="cFat" type="number" min="0" step="0.1" value="0"></div></div>
          <button class="btn sm" type="button" id="customAdd">Add to meal</button>
        </div>
      </form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: existing ? 'Save changes' : 'Save meal', onClick: async (btn, m) => {
        if (!items.length) { $('#mealError', m.el).textContent = 'Add at least one food to this meal.'; return false; }
        const payload = { date: existing ? existing.date : date, type: $('#mType', m.el).value, items };
        try { if (existing) await API.nutrition.updateMeal(existing.id, payload); else await API.nutrition.addMeal(payload); UI.toast(existing ? 'Meal updated.' : 'Meal saved.'); load(); } catch (e) { UI.fail(e); return false; }
      } }],
      onOpen: el => {
        const results = $('#foodResults', el), box = $('#mealItems', el);
        const showFoods = q => {
          const f = foods.filter(x => x.name.toLowerCase().includes(q.trim().toLowerCase()));
          results.innerHTML = f.length ? f.map(x => `<button type="button" class="food-row" style="width:100%;background:none;border:0;border-top:1px solid var(--line);text-align:left;cursor:pointer;font:inherit;color:inherit" data-food="${x.id}"><span><b>${esc(x.name)}</b><br><span class="macros muted small">${esc(x.serving)} · ${x.calories} kcal · P${x.protein} C${x.carbs} F${x.fat}</span></span>${Icons.svg('plus')}</button>`).join('') : '<div class="empty" style="padding:1rem">No match. Use “Add a custom food”.</div>';
        };
        const showItems = () => {
          $('#mealError', el).textContent = '';
          box.innerHTML = items.length ? items.map((it, i) => `<div class="food-row" style="padding:.5rem 0"><div><b>${esc(it.name)}</b><div class="macros">${r(it.calories)} kcal · P ${round1(it.protein)} · C ${round1(it.carbs)} · F ${round1(it.fat)}</div></div>
            <div class="nowrap"><input class="form-control" style="width:72px;display:inline-block;padding:.3rem .5rem" type="number" min="0.25" max="20" step="0.25" value="${it.qty}" data-qty="${i}" aria-label="Quantity of ${esc(it.name)}"> <button type="button" class="icon-btn" style="width:32px;height:32px" data-rm="${i}" aria-label="Remove ${esc(it.name)}">${Icons.svg('x')}</button></div></div>`).join('') : '<div class="muted small">Nothing added yet. Pick foods from the list.</div>';
          const t = { c: sum(items, 'calories'), p: sum(items, 'protein'), cb: sum(items, 'carbs'), f: sum(items, 'fat') };
          $('#mealTotals', el).textContent = items.length ? `Total: ${r(t.c)} kcal · P ${round1(t.p)} g · C ${round1(t.cb)} g · F ${round1(t.f)} g` : '';
        };
        showFoods(''); showItems();
        $('#mSearch', el).addEventListener('input', debounce(e => showFoods(e.target.value), 120));
        results.addEventListener('click', e => {
          const b = e.target.closest('[data-food]'); if (!b) return; const f = foods.find(x => x.id === b.dataset.food);
          const ex = items.find(i => i.foodId === f.id);
          if (ex) { const per = ex.qty; ex.qty += 1; ['calories', 'protein', 'carbs', 'fat'].forEach(k => ex[k] = f[k] * ex.qty); }
          else items.push({ foodId: f.id, name: f.name, serving: f.serving, qty: 1, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat });
          showItems();
        });
        box.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { items.splice(Number(b.dataset.rm), 1); showItems(); } });
        box.addEventListener('change', e => {
          const i = e.target.dataset.qty; if (i === undefined) return; const it = items[Number(i)]; const q = Number(e.target.value);
          if (!(q > 0 && q <= 20)) { e.target.value = it.qty; return UI.toast('Quantity must be between 0.25 and 20.', 'error'); }
          const base = { calories: it.calories / it.qty, protein: it.protein / it.qty, carbs: it.carbs / it.qty, fat: it.fat / it.qty };
          it.qty = q; Object.keys(base).forEach(k => it[k] = base[k] * q); showItems();
        });
        $('#customToggle', el).addEventListener('click', () => $('#customBox', el).classList.toggle('hidden'));
        $('#customAdd', el).addEventListener('click', () => {
          const form = $('#mealForm', el);
          const { valid, values } = UI.validate(form, { cName: { label: 'Name', required: true, max: 40 }, cServ: { label: 'Serving', required: true }, cCal: { label: 'Calories', required: true, number: true, minValue: 0, maxValue: 3000 }, cPro: { label: 'Protein', number: true, minValue: 0, maxValue: 300 }, cCarb: { label: 'Carbs', number: true, minValue: 0, maxValue: 500 }, cFat: { label: 'Fat', number: true, minValue: 0, maxValue: 300 } });
          if (!valid) return;
          items.push({ foodId: 'custom', name: values.cName, serving: values.cServ, qty: 1, calories: +values.cCal, protein: +values.cPro || 0, carbs: +values.cCarb || 0, fat: +values.cFat || 0 });
          ['cName', 'cCal'].forEach(n => form.elements[n].value = ''); showItems(); UI.toast('Custom food added to the meal.');
        });
        el.addEventListener('submit', e => e.preventDefault());
      }
    });
  }

  load();
});
