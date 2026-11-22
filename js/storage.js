/* ==========================================================================
   FORMA – storage.js
   Thin wrapper around localStorage used ONLY by the demo data layer in api.js.

   Backend note: UI code never calls Store directly for business data – it goes
   through api.js. When a real backend is connected (API_CONFIG.useBackend = true)
   these demo records are no longer read or written. Only UI preferences
   (theme, last-viewed tab…) and the session token placeholder stay local.

   Falls back to in-memory storage if the browser blocks localStorage
   (private mode, some file:// configurations).
   ========================================================================== */
const Store = (() => {
  const PREFIX = 'forma:v1:';
  const memory = {};
  let usable = true;
  try {
    const k = PREFIX + '__test';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
  } catch (e) { usable = false; }

  function get(key, fallback = null) {
    try {
      const raw = usable ? window.localStorage.getItem(PREFIX + key) : memory[key];
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function set(key, value) {
    const raw = JSON.stringify(value);
    try {
      if (usable) window.localStorage.setItem(PREFIX + key, raw);
      else memory[key] = raw;
    } catch (e) { memory[key] = raw; }
    return value;
  }
  function remove(key) {
    try { if (usable) window.localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    delete memory[key];
  }
  function keys() {
    if (!usable) return Object.keys(memory);
    const out = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
    }
    return out;
  }
  /** Remove every FORMA record (used by "Reset demo data"). */
  function clearAll() { keys().forEach(remove); Object.keys(memory).forEach(k => delete memory[k]); }
  function uid(prefix = 'id') {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  /** Read a value; if missing, store and return the seed produced by seedFn(). */
  function ensure(key, seedFn) {
    const existing = get(key, undefined);
    if (existing !== undefined && existing !== null) return existing;
    return set(key, typeof seedFn === 'function' ? seedFn() : seedFn);
  }
  return { get, set, remove, keys, clearAll, uid, ensure, isPersistent: () => usable };
})();
