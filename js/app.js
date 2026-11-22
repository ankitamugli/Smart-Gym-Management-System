/* ==========================================================================
   FORMA – app.js
   Shared shell: auth guard, sidebar + header, theme, toasts, modals, helpers.
   Each page sets on <body>:
     data-root   "" (index.html) or "../" (pages/*)   – path back to project root
     data-page   id of the active nav item
     data-title  header title
     data-public "true" on login / register
   ========================================================================== */

/* ---------------- helpers ---------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ROOT = document.body.dataset.root || '';
const fmtDate = (d, opts) => d ? new Date(d.length <= 10 ? d + 'T12:00:00' : d).toLocaleDateString('en-IN', opts || { day: 'numeric', month: 'short', year: 'numeric' }) : '–';
const fmtShort = d => fmtDate(d, { day: 'numeric', month: 'short' });
const money = n => API.config.currency + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const round1 = n => Math.round(n * 10) / 10;
const debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
const todayISO = () => DemoData.today();
const initials = name => (String(name || 'U').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || 'U').toUpperCase();

/* ---------------- UI toolkit ---------------- */
const UI = (() => {
  function toast(message, type = 'success') {
    let box = $('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = Icons.svg(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check') + '<span>' + esc(message) + '</span>';
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, type === 'error' ? 5200 : 3200);
  }

  /**
   * modal({ title, body, footer:[{label,cls,onClick,close}], wide, onOpen })
   * body: HTML string or Node. Returns { el, close }.
   */
  function modal({ title, body, footer, wide, onOpen, onClose }) {
    const opener = document.activeElement;
    const back = document.createElement('div');
    back.className = 'modal-backdrop open';
    back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" type="button" data-close aria-label="Close dialog">${Icons.svg('x')}</button></div>
      <div class="modal-body"></div>
      ${footer && footer.length ? '<div class="modal-foot"></div>' : ''}
    </div>`;
    const bodyEl = $('.modal-body', back);
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (opener && opener.focus) opener.focus(); if (onClose) onClose(); };
    const onKey = e => { if (e.key === 'Escape' && back === $$('.modal-backdrop').pop()) close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('mousedown', e => { if (e.target === back) close(); });
    $('[data-close]', back).addEventListener('click', close);
    if (footer && footer.length) {
      const f = $('.modal-foot', back);
      footer.forEach(b => {
        const btn = document.createElement('button');
        // No cls -> primary button. Pass cls:'secondary' (Cancel) or 'danger' explicitly.
        btn.type = 'button'; btn.className = ('btn ' + (b.cls || '')).trim(); btn.innerHTML = b.label;
        btn.addEventListener('click', async () => {
          let keep = false;
          if (b.onClick) { const r = await b.onClick(btn, { el: back, close }); keep = r === false; }
          if (b.close !== false && !keep) close();
        });
        f.appendChild(btn);
      });
    }
    document.body.appendChild(back);
    Icons.hydrate(back);
    const first = $('input:not([type=hidden]), select, textarea, .modal-foot .btn', back);
    if (first) setTimeout(() => first.focus(), 30);
    if (onOpen) onOpen(back, close);
    return { el: back, close };
  }

  /** confirm({title,message,confirmText,danger}) -> Promise<boolean> */
  function confirm({ title = 'Are you sure?', message = '', confirmText = 'Confirm', danger = false }) {
    return new Promise(resolve => {
      let answered = false;
      modal({
        title, body: '<p class="mb-0">' + esc(message) + '</p>',
        footer: [
          { label: 'Cancel', cls: 'secondary', onClick: () => { answered = true; resolve(false); } },
          { label: esc(confirmText), cls: danger ? 'danger' : '', onClick: () => { answered = true; resolve(true); } }
        ],
        onClose: () => { if (!answered) resolve(false); }
      });
    });
  }

  /**
   * validate(form, rules) -> { valid, values }
   * rules: { fieldName: { label, required, min, max, email, pattern, message, number:true, minValue, maxValue } }
   */
  function validate(form, rules) {
    let valid = true; const values = {};
    Object.entries(rules).forEach(([name, r]) => {
      const input = form.elements[name]; if (!input) return;
      const raw = input.type === 'checkbox' ? input.checked : String(input.value || '').trim();
      values[name] = raw; let err = '';
      const label = r.label || name;
      if (r.required && (raw === '' || raw === false)) err = `${label} is required.`;
      else if (raw !== '' && raw !== false) {
        if (r.min && String(raw).length < r.min) err = `${label} must be at least ${r.min} characters.`;
        else if (r.max && String(raw).length > r.max) err = `${label} must be ${r.max} characters or fewer.`;
        else if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) err = 'Enter a valid email address, like name@example.com.';
        else if (r.pattern && !r.pattern.test(raw)) err = r.message || `${label} is not in the right format.`;
        else if (r.number) {
          const n = Number(raw);
          if (isNaN(n)) err = `${label} must be a number.`;
          else if (r.minValue !== undefined && n < r.minValue) err = `${label} must be at least ${r.minValue}.`;
          else if (r.maxValue !== undefined && n > r.maxValue) err = `${label} must be ${r.maxValue} or less.`;
        }
      }
      setError(input, err);
      if (err) valid = false;
    });
    if (!valid) { const bad = $('.invalid', form); if (bad) bad.focus(); }
    return { valid, values };
  }
  function setError(input, msg) {
    input.classList.toggle('invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const host = input.closest('.field') || input.parentElement;
    let el = $('.error-text', host);
    if (!el) { el = document.createElement('div'); el.className = 'error-text'; el.setAttribute('role', 'alert'); host.appendChild(el); }
    el.textContent = msg;
  }
  function clearErrors(form) { $$('.invalid', form).forEach(i => setError(i, '')); }

  const empty = ({ icon = 'info', title, text = '', action = '' }) => `<div class="empty">${Icons.svg(icon)}<h4>${esc(title)}</h4><p>${esc(text)}</p>${action}</div>`;
  const badge = (text, color = '') => `<span class="badge ${color}">${esc(text)}</span>`;
  const notice = (html, kind = '', icon = 'info') => `<div class="notice ${kind}">${Icons.svg(icon)}<div>${html}</div></div>`;
  const demoTag = (text = 'Demo') => `<span class="demo-tag">${esc(text)}</span>`;

  function download(filename, text, mime = 'text/plain') {
    const url = URL.createObjectURL(new Blob([text], { type: mime }));
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }
  /** Standard error handler for API calls. */
  const fail = (err, fallback = 'Something went wrong. Please try again.') => { (err && err.status >= 400 && err.status < 500 ? console.warn : console.error)(err); toast(err && err.message ? err.message : fallback, 'error'); };

  return { toast, modal, confirm, validate, setError, clearErrors, empty, badge, notice, demoTag, download, fail };
})();

/* ---------------- theme ---------------- */
const Theme = (() => {
  function apply(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    Store.set('theme', mode);
    window.dispatchEvent(new Event('forma:theme'));
  }
  const current = () => document.documentElement.getAttribute('data-theme') || 'light';
  const init = () => document.documentElement.setAttribute('data-theme', Store.get('theme') || 'light');
  return { apply, current, init, toggle: () => apply(current() === 'dark' ? 'light' : 'dark') };
})();
Theme.init();

/* ---------------- navigation model ---------------- */
const NAV = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: 'index.html' }] },
  { group: 'Train', items: [
    { id: 'workout', label: 'Workout planner', icon: 'dumbbell', href: 'pages/workout-planner.html' },
    { id: 'posture', label: 'Posture check', icon: 'posture', href: 'pages/posture-detection.html' },
    { id: 'progress', label: 'Progress predictor', icon: 'progress', href: 'pages/progress-predictor.html' } ] },
  { group: 'Gym', items: [
    { id: 'qr', label: 'QR check-in', icon: 'qr', href: 'pages/qr-checkin.html' },
    { id: 'equipment', label: 'Equipment live', icon: 'kettlebell', href: 'pages/equipment.html' },
    { id: 'trainers', label: 'Trainers', icon: 'trainers', href: 'pages/trainers.html' } ] },
  { group: 'Lifestyle', items: [
    { id: 'nutrition', label: 'Nutrition tracker', icon: 'nutrition', href: 'pages/nutrition.html' },
    { id: 'chatbot', label: 'AI fitness coach', icon: 'chat', href: 'pages/chatbot.html' },
    { id: 'membership', label: 'Membership', icon: 'membership', href: 'pages/membership.html' } ] }
];

/* ---------------- shell ---------------- */
const Shell = (() => {
  function build() {
    const page = document.body.dataset.page;
    const title = document.body.dataset.title || 'FORMA';
    const sess = API.auth.session() || { user: { name: 'User', email: '' } };
    const u = sess.user;
    const sidebar = $('#sidebar'); const topbar = $('#topbar');
    if (sidebar) {
      sidebar.setAttribute('aria-label', 'Main navigation');
      sidebar.innerHTML = `
        <a class="brand" href="${ROOT}index.html" aria-label="FORMA home"><span class="brand-mark">F</span><span><span class="brand-name">FORMA</span><span class="brand-sub">Smart Gym Management System</span></span></a>
        <nav>${NAV.map(g => `<div class="nav-group">${g.group}</div>` + g.items.map(i => `<a class="nav-link ${i.id === page ? 'active' : ''}" href="${ROOT}${i.href}" ${i.id === page ? 'aria-current="page"' : ''}>${Icons.svg(i.icon)}<span>${i.label}</span></a>`).join('')).join('')}</nav>
        <div class="sidebar-foot"><div class="sidebar-card" id="sideMembership"><strong>Membership</strong><span>Loading…</span></div></div>`;
    }
    if (topbar) {
      topbar.innerHTML = `
        <button class="icon-btn menu-btn" type="button" id="menuBtn" aria-label="Open navigation" aria-expanded="false">${Icons.svg('menu')}</button>
        <div class="topbar-title">${esc(title)}</div>
        <div class="topbar-spacer"></div>
        <span class="badge ${API.config.useBackend ? 'green' : 'amber'}" title="${API.config.useBackend ? 'Connected to a backend API' : 'Demo mode – data is stored only in this browser'}">${API.config.useBackend ? 'Live API' : 'Demo mode'}</span>
        <button class="icon-btn" type="button" id="themeBtn" aria-label="Toggle dark mode">${Icons.svg(Theme.current() === 'dark' ? 'sun' : 'moon')}</button>
        <div class="user-chip">
          <button class="icon-btn" style="width:auto;padding:0 .35rem 0 .35rem;gap:.55rem;display:inline-flex;align-items:center" type="button" id="userBtn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
            <span class="avatar" id="avatarEl">${esc(initials(u.name))}</span>
            <span class="who" style="text-align:left"><b id="whoName">${esc(u.name)}</b><span>${esc(u.memberId || 'Member')}</span></span>
          </button>
          <div class="dropdown" id="userMenu" role="menu">
            <button type="button" data-act="profile" role="menuitem">${Icons.svg('user')} Edit profile</button>
            <button type="button" data-act="reset" role="menuitem">${Icons.svg('refresh')} Reset demo data</button>
            <button type="button" data-act="logout" role="menuitem">${Icons.svg('logout')} Sign out</button>
          </div>
        </div>`;
    }
    const scrim = document.createElement('div'); scrim.className = 'scrim'; document.body.appendChild(scrim);
    const setNav = open => { document.body.classList.toggle('nav-open', open); const b = $('#menuBtn'); if (b) b.setAttribute('aria-expanded', String(open)); };
    document.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('#menuBtn')) setNav(!document.body.classList.contains('nav-open'));
      else if (t.closest('.scrim') || t.closest('.nav-link')) setNav(false);
      if (t.closest('#themeBtn')) { Theme.toggle(); $('#themeBtn').innerHTML = Icons.svg(Theme.current() === 'dark' ? 'sun' : 'moon'); }
      const menu = $('#userMenu');
      if (t.closest('#userBtn')) { const open = menu.classList.toggle('open'); $('#userBtn').setAttribute('aria-expanded', String(open)); }
      else if (menu && !t.closest('#userMenu')) menu.classList.remove('open');
      const act = t.closest('[data-act]');
      if (act && act.closest('#userMenu')) { menu.classList.remove('open'); userAction(act.dataset.act); }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { setNav(false); const m = $('#userMenu'); if (m) m.classList.remove('open'); } });
    loadSidebarMembership();
  }

  async function loadSidebarMembership() {
    const box = $('#sideMembership'); if (!box) return;
    try {
      const [m, plans] = await Promise.all([API.membership.current(), API.membership.plans()]);
      const plan = plans.plans.find(p => p.id === m.planId);
      const left = daysBetween(todayISO(), m.expiryDate);
      box.innerHTML = `<strong>${esc(plan ? plan.name : 'Member')} plan</strong>${left >= 0 ? left + ' day' + (left === 1 ? '' : 's') + ' left · ' : 'Expired · '}${m.autoRenew ? 'auto-renew on' : 'auto-renew off'}`;
    } catch (e) { box.innerHTML = '<strong>Membership</strong>Unavailable'; }
  }

  async function userAction(act) {
    if (act === 'logout') { await API.auth.logout(); location.href = ROOT + 'pages/login.html'; }
    if (act === 'reset') {
      if (API.config.useBackend) { UI.toast('Reset only applies to demo mode.', 'info'); return; }
      const ok = await UI.confirm({ title: 'Reset demo data?', message: 'This deletes everything saved in this browser for FORMA (meals, bookings, check-ins, plans) and restores the sample data.', confirmText: 'Reset data', danger: true });
      if (ok) { API.resetDemo(); UI.toast('Demo data reset.'); setTimeout(() => location.reload(), 500); }
    }
    if (act === 'profile') openProfile();
  }

  async function openProfile() {
    let profile; try { profile = await API.user.get(); } catch (e) { return UI.fail(e); }
    UI.modal({
      title: 'Edit profile',
      body: `<form id="profileForm" novalidate>
        <div class="field"><label for="pfName">Name</label><input class="form-control" id="pfName" name="name" value="${esc(profile.name)}" autocomplete="name"></div>
        <div class="form-row"><div class="field"><label for="pfEmail">Email</label><input class="form-control" id="pfEmail" name="email" type="email" value="${esc(profile.email)}"></div>
        <div class="field"><label for="pfPhone">Phone (optional)</label><input class="form-control" id="pfPhone" name="phone" value="${esc(profile.phone || '')}" inputmode="tel"></div></div>
        <div class="field"><label for="pfHeight">Height (cm)</label><input class="form-control" id="pfHeight" name="heightCm" type="number" min="100" max="230" value="${esc(profile.heightCm || '')}"></div>
      </form>`,
      footer: [{ label: 'Cancel', cls: 'secondary' }, { label: 'Save changes', onClick: async (btn, m) => {
        const form = $('#profileForm', m.el);
        const { valid, values } = UI.validate(form, { name: { label: 'Name', required: true, min: 2, max: 60 }, email: { label: 'Email', required: true, email: true }, heightCm: { label: 'Height', number: true, minValue: 100, maxValue: 230 } });
        if (!valid) return false;
        try { const saved = await API.user.update({ name: values.name, email: values.email, phone: $('#pfPhone', m.el).value.trim(), heightCm: values.heightCm ? Number(values.heightCm) : undefined });
          $('#whoName').textContent = saved.name; $('#avatarEl').textContent = initials(saved.name); UI.toast('Profile saved.'); document.dispatchEvent(new CustomEvent('forma:profile', { detail: saved })); }
        catch (e) { UI.fail(e); return false; }
      } }]
    });
  }
  return { build };
})();

/* ---------------- boot ---------------- */
/** Page scripts wrap their code in Page.ready(fn) so nothing runs while redirecting to login. */
const Page = { blocked: false, ready(fn) { if (!Page.blocked) fn(); } };

(function boot() {
  const isPublic = document.body.dataset.public === 'true';
  if (!isPublic && !API.auth.hasSession()) { Page.blocked = true; location.replace(ROOT + 'pages/login.html'); return; }
  if (!isPublic) Shell.build();
  Icons.hydrate(document);
})();
