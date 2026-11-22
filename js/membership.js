/* ==========================================================================
   FORMA – membership.js   (Feature 9: membership + auto renewal)
   API used: API.membership.plans/current/history/subscribe/savePreferences/cancel
   Membership JSON: { planId, cycle, status:'active|cancelling|expired', startDate,
     expiryDate, autoRenew, reminderDaysBefore, renewalCycle, paymentMethod:{brand,last4} }

   PAYMENT SAFETY: the demo form below validates a card NUMBER only to show UX,
   keeps just the last 4 digits and brand, and discards the rest immediately.
   In production, do not build your own card form: use the gateway's hosted
   fields / checkout (Razorpay Checkout, Stripe Elements) so card data never
   touches your JavaScript, then send the resulting token/intent id to your server.
   ========================================================================== */
Page.ready(function () {
  let plans = [], cycles = [], mem = null, history = [], cycle = 'monthly';
  const price = (plan, cyc) => { const c = cycles.find(x => x.id === cyc); const gross = plan.monthlyPrice * c.months; return { total: Math.round(gross * (1 - c.discount)), perMonth: Math.round(gross * (1 - c.discount) / c.months), saved: Math.round(gross * c.discount), months: c.months }; };
  const rank = id => plans.findIndex(p => p.id === id);

  async function load() {
    try { const pl = await API.membership.plans(); plans = pl.plans; cycles = pl.cycles; [mem, history] = await Promise.all([API.membership.current(), API.membership.history()]); }
    catch (e) { return UI.fail(e, 'Could not load membership details.'); }
    if (!$('#cycleSeg').children.length) {
      $('#cycleSeg').innerHTML = cycles.map(c => `<input type="radio" name="cycle" id="cy_${c.id}" value="${c.id}" ${c.id === cycle ? 'checked' : ''}><label for="cy_${c.id}">${c.label}${c.discount ? ` <span class="badge green">save ${c.discount * 100}%</span>` : ''}</label>`).join('');
      $('#renewCycle').innerHTML = cycles.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
    }
    render();
  }

  function render() { renderCurrent(); renderPrefs(); renderPlans(); renderHistory(); }

  function renderCurrent() {
    const plan = plans.find(p => p.id === mem.planId) || { name: 'Member', features: [] }; const left = daysBetween(todayISO(), mem.expiryDate);
    const total = Math.max(1, daysBetween(mem.startDate, mem.expiryDate)); const used = Math.min(total, Math.max(0, daysBetween(mem.startDate, todayISO()))); const expired = left < 0;
    const status = expired ? ['Expired', 'red'] : mem.status === 'cancelling' ? ['Ends ' + fmtShort(mem.expiryDate), 'amber'] : left <= 7 ? ['Expiring soon', 'amber'] : ['Active', 'green'];
    $('#currentPlan').innerHTML = `<div class="flex between items-center wrap gap-1 mb-2" style="position:relative;z-index:1"><div><div class="muted small">Current plan</div><h2 class="mb-0" style="font-size:2.4rem">${esc(plan.name)}</h2></div><span class="badge ${status[1]}" style="font-size:.85rem">${status[0]}</span></div>
      <div class="grid grid-3" style="position:relative;z-index:1;gap:.8rem"><div><div class="muted small">Start date</div><b>${fmtDate(mem.startDate)}</b></div><div><div class="muted small">Expiry date</div><b>${fmtDate(mem.expiryDate)}</b></div><div><div class="muted small">${expired ? 'Expired' : 'Days left'}</div><b>${expired ? Math.abs(left) + ' days ago' : left}</b></div></div>
      <div class="progress mt-2" style="position:relative;z-index:1;background:rgba(255,255,255,.15);border-color:transparent" role="progressbar" aria-valuenow="${Math.round(used / total * 100)}" aria-valuemin="0" aria-valuemax="100" aria-label="Membership period used"><span style="width:${used / total * 100}%"></span></div>
      <div class="flex between wrap gap-1 mt-2" style="position:relative;z-index:1"><span class="small muted">${mem.autoRenew && !expired && mem.status !== 'cancelling' ? 'Renews (demo) on ' + fmtDate(mem.expiryDate) + ' · ' + esc((cycles.find(c => c.id === mem.renewalCycle) || { label: '' }).label.toLowerCase()) : 'Auto-renew is off'}</span>
        <span class="btn-row">${expired || left <= 7 ? '<button class="btn sm" id="renewNow">Renew now</button>' : ''}${mem.status !== 'cancelling' && !expired ? '<button class="btn sm secondary" id="cancelMem" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">Cancel membership</button>' : ''}</span></div>`;
    const rn = $('#renewNow'); if (rn) rn.onclick = () => startCheckout(mem.planId, mem.renewalCycle || 'monthly', true);
    const cm = $('#cancelMem'); if (cm) cm.onclick = cancelMembership;
  }

  function renderPrefs() {
    $('#autoRenew').checked = !!mem.autoRenew && mem.status !== 'cancelling'; $('#renewCycle').value = mem.renewalCycle || 'monthly'; $('#reminder').value = String(mem.reminderDaysBefore ?? 3);
    const pm = mem.paymentMethod; $('#payMethod').innerHTML = pm && pm.last4 ? `<span>${esc(pm.brand)} •••• ${esc(pm.last4)}</span><button type="button" class="btn sm secondary" id="chgCard">Change</button>` : `<span class="muted">No payment method</span><button type="button" class="btn sm" id="chgCard">Add</button>`;
    $('#chgCard').onclick = changeCard;
  }
  $('#prefForm').addEventListener('submit', async e => {
    e.preventDefault(); const on = $('#autoRenew').checked;
    if (on && (!mem.paymentMethod || !mem.paymentMethod.last4)) return UI.toast('Add a payment method before turning auto-renew on.', 'error');
    if (mem.status === 'cancelling' && on) return UI.toast('This membership is set to end. Subscribe again to keep it.', 'error');
    try { mem = await API.membership.savePreferences({ autoRenew: on, renewalCycle: $('#renewCycle').value, reminderDaysBefore: Number($('#reminder').value) }); UI.toast(on ? 'Auto-renew is on (demo: nothing will actually be charged).' : 'Auto-renew is off.'); render(); } catch (er) { UI.fail(er); }
  });

  /* ---------- plans ---------- */
  $('#cycleSeg').addEventListener('change', e => { cycle = e.target.value; renderPlans(); });
  function renderPlans() {
    const expired = daysBetween(todayISO(), mem.expiryDate) < 0;
    $('#planGrid').innerHTML = plans.map(p => {
      const pr = price(p, cycle); const isCurrent = p.id === mem.planId && !expired; const up = rank(p.id) > rank(mem.planId);
      const label = isCurrent ? 'Extend this plan' : expired ? 'Choose plan' : up ? 'Upgrade' : 'Switch plan';
      return `<article class="plan-card ${p.featured ? 'featured' : ''} ${isCurrent ? 'current' : ''}">
        ${p.featured ? `<span class="plan-ribbon">${UI.badge('Most popular', 'orange')}</span>` : ''}${isCurrent ? `<span class="plan-ribbon">${UI.badge('Your plan', 'teal')}</span>` : ''}
        <div><h3 class="mb-0">${esc(p.name)}</h3><div class="muted small">${esc(p.tagline)}</div></div>
        <div class="plan-price">${money(pr.perMonth)}<small> / month</small></div>
        <div class="small muted">${pr.months > 1 ? `Billed ${money(pr.total)} every ${pr.months} months${pr.saved ? ` · you save ${money(pr.saved)}` : ''}` : 'Billed monthly'}</div>
        <ul class="plan-list">${p.features.map(f => `<li>${Icons.svg('check')}<span>${esc(f)}</span></li>`).join('')}</ul>
        <button class="btn ${p.featured || isCurrent ? '' : 'secondary'} block" style="margin-top:auto" data-plan="${p.id}">${label}</button></article>`;
    }).join('');
  }
  $('#planGrid').addEventListener('click', e => { const b = e.target.closest('[data-plan]'); if (b) startCheckout(b.dataset.plan, cycle); });

  /* ---------- demo checkout ---------- */
  const luhn = n => { let s = 0, alt = false; for (let i = n.length - 1; i >= 0; i--) { let d = +n[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return s % 10 === 0; };
  const brandOf = n => /^4/.test(n) ? 'Visa' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'Amex' : /^6/.test(n) ? 'RuPay / Discover' : 'Card';

  function cardFields(prefix) {
    return `<div class="field"><label for="${prefix}Name">Name on card</label><input class="form-control" id="${prefix}Name" name="holder" autocomplete="off" value="User"></div>
      <div class="field"><label for="${prefix}Num">Card number</label><input class="form-control" id="${prefix}Num" name="number" inputmode="numeric" autocomplete="off" placeholder="4242 4242 4242 4242" maxlength="23"><div class="hint">Use the test number 4242 4242 4242 4242. Do not enter a real card.</div></div>
      <div class="form-row"><div class="field"><label for="${prefix}Exp">Expiry (MM/YY)</label><input class="form-control" id="${prefix}Exp" name="expiry" inputmode="numeric" autocomplete="off" placeholder="12/30" maxlength="5"></div>
      <div class="field"><label for="${prefix}Cvv">CVV</label><input class="form-control" id="${prefix}Cvv" name="cvv" type="password" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="123"></div></div>`;
  }
  function wireCard(el, prefix) {
    $('#' + prefix + 'Num', el).addEventListener('input', e => { const d = e.target.value.replace(/\D/g, '').slice(0, 19); e.target.value = d.replace(/(.{4})/g, '$1 ').trim(); });
    $('#' + prefix + 'Exp', el).addEventListener('input', e => { let d = e.target.value.replace(/\D/g, '').slice(0, 4); if (d.length > 2) d = d.slice(0, 2) + '/' + d.slice(2); e.target.value = d; });
  }
  function validateCard(form) {
    const v = UI.validate(form, { holder: { label: 'Name', required: true, min: 2 }, number: { label: 'Card number', required: true }, expiry: { label: 'Expiry', required: true, pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, message: 'Use the format MM/YY.' }, cvv: { label: 'CVV', required: true, pattern: /^\d{3,4}$/, message: 'CVV is 3 or 4 digits.' } });
    let ok = v.valid; const digits = (v.values.number || '').replace(/\D/g, '');
    if (v.values.number && (digits.length < 13 || !luhn(digits))) { UI.setError(form.elements.number, 'That card number is not valid. Try the test number 4242 4242 4242 4242.'); ok = false; }
    if (v.values.expiry && /^(0[1-9]|1[0-2])\/\d{2}$/.test(v.values.expiry)) { const [mm, yy] = v.values.expiry.split('/').map(Number); const now = new Date(); if (2000 + yy < now.getFullYear() || (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)) { UI.setError(form.elements.expiry, 'This card has expired.'); ok = false; } }
    return { ok, last4: digits.slice(-4), brand: brandOf(digits) };   // number, expiry and CVV are discarded here
  }

  function startCheckout(planId, cyc, renewal) {
    const plan = plans.find(p => p.id === planId); const pr = price(plan, cyc); const cy = cycles.find(c => c.id === cyc); const hasCard = mem.paymentMethod && mem.paymentMethod.last4; let useSaved = !!hasCard;
    UI.modal({ title: (renewal ? 'Renew ' : 'Subscribe to ') + plan.name, wide: true,
      body: `<div class="grid grid-2"><form id="payForm" novalidate>
          ${hasCard ? `<div class="field"><span class="label">Payment method</span><div class="seg" role="radiogroup"><input type="radio" name="pm" id="pmSaved" value="saved" checked><label for="pmSaved">${esc(mem.paymentMethod.brand)} •••• ${esc(mem.paymentMethod.last4)}</label><input type="radio" name="pm" id="pmNew" value="new"><label for="pmNew">New test card</label></div></div>` : ''}
          <div id="newCard" class="${hasCard ? 'hidden' : ''}">${cardFields('pay')}</div>
          <div class="notice warn mb-0"><i data-icon="lock"></i><div>Demo checkout. Nothing is charged.</div></div></form>
        <div><div class="card flat"><h4>Order summary</h4><ul class="list-plain small"><li><span>${esc(plan.name)} plan</span><b>${esc(cy.label)}</b></li><li><span>${money(plan.monthlyPrice)} × ${pr.months} month${pr.months > 1 ? 's' : ''}</span><span>${money(plan.monthlyPrice * pr.months)}</span></li>${pr.saved ? `<li><span>${cy.discount * 100}% discount</span><span style="color:var(--success)">−${money(pr.saved)}</span></li>` : ''}<li><b>Total today</b><b style="font-size:1.2rem">${money(pr.total)}</b></li></ul>
          <p class="tiny muted mb-0">Taxes are not calculated in this demo.</p></div></div></div>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Pay ' + money(pr.total) + ' (demo)', onClick: async (btn, m) => {
        const form = $('#payForm', m.el); let last4 = mem.paymentMethod && mem.paymentMethod.last4, brand = mem.paymentMethod && mem.paymentMethod.brand;
        const wantsNew = !hasCard || form.elements.pm.value === 'new';
        if (wantsNew) { const c = validateCard(form); if (!c.ok) return false; last4 = c.last4; brand = c.brand; }
        btn.disabled = true; btn.textContent = 'Processing…';
        try { await new Promise(r => setTimeout(r, API.config.useBackend ? 0 : 700)); mem = await API.membership.subscribe({ planId, cycle: cyc, amount: pr.total, last4, brand }); UI.toast(`${plan.name} plan active until ${fmtDate(mem.expiryDate)} (demo).`); await load(); }
        catch (er) { UI.fail(er, 'Payment could not be completed.'); btn.disabled = false; btn.textContent = 'Pay ' + money(pr.total) + ' (demo)'; return false; }
      } }],
      onOpen: el => { wireCard(el, 'pay'); $$('input[name=pm]', el).forEach(r => r.addEventListener('change', () => $('#newCard', el).classList.toggle('hidden', r.value === 'saved' && r.checked))); } });
  }

  function changeCard() {
    UI.modal({ title: 'Payment method', body: `<form id="cardForm" novalidate>${cardFields('cc')}<div class="notice warn mb-0"><i data-icon="lock"></i><div>Only the last 4 digits and card brand are kept in this browser. In production, use your payment gateway's hosted form instead.</div></div></form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Save card', onClick: async (b, m) => { const c = validateCard($('#cardForm', m.el)); if (!c.ok) return false; try { mem = await API.membership.savePreferences({ paymentMethod: { brand: c.brand, last4: c.last4, holder: 'User' } }); UI.toast('Payment method saved (demo).'); render(); } catch (er) { UI.fail(er); return false; } } }],
      onOpen: el => wireCard(el, 'cc') });
  }

  async function cancelMembership() {
    if (!await UI.confirm({ title: 'Cancel membership?', message: `Your plan stays active until ${fmtDate(mem.expiryDate)} and will not renew. You can subscribe again at any time.`, confirmText: 'Cancel membership', danger: true })) return;
    try { mem = await API.membership.cancel(); UI.toast('Membership will end on ' + fmtDate(mem.expiryDate) + '.', 'info'); render(); } catch (e) { UI.fail(e); }
  }

  /* ---------- history ---------- */
  function renderHistory() {
    $('#histCount').textContent = history.length ? history.length + ' records' : '';
    $('#historyList').innerHTML = history.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th><span class="sr-only">Receipt</span></th></tr></thead><tbody>${history.map(h => `<tr><td class="nowrap">${fmtDate(h.date)}</td><td>${esc(h.description)}</td><td>${money(h.amount)}</td><td>${UI.badge(h.status, 'green')}</td><td class="right"><button class="btn sm secondary" data-receipt="${h.id}">Receipt</button></td></tr>`).join('')}</tbody></table></div>`
      : UI.empty({ icon: 'membership', title: 'No membership history', text: 'Your purchases and renewals will be listed here.' });
  }
  $('#historyList').addEventListener('click', e => {
    const b = e.target.closest('[data-receipt]'); if (!b) return; const h = history.find(x => x.id === b.dataset.receipt); const u = (API.auth.session() || {}).user || {};
    UI.download('forma-demo-receipt-' + h.date + '.txt', ['FORMA – Smart Gym Management System', 'DEMO RECEIPT – NOT A TAX INVOICE – NO PAYMENT WAS TAKEN', '', 'Member: ' + (u.name || 'User') + ' (' + (u.memberId || '') + ')', 'Date: ' + h.date, 'Item: ' + h.description, 'Amount: ' + API.config.currency + h.amount, 'Status: ' + h.status].join('\n'));
    UI.toast('Demo receipt downloaded.');
  });

  load();
});
