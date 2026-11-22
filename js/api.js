/* ==========================================================================
   FORMA – api.js   (data-access layer)

   Every page talks to data ONLY through the `API` object below. Each function
   returns a Promise and has two implementations:

     • Demo mode    (FORMA_CONFIG.useBackend === false)  -> localStorage via Store
     • Backend mode (FORMA_CONFIG.useBackend === true)   -> fetch() to REST endpoints

   The backend branch is a documented PLACEHOLDER. No backend ships with this
   project, so those branches have never talked to a real server. Check each
   endpoint, request body and response shape against your server, using
   docs/backend-integration-guide.md.

   Expected response convention (see the guide):
     success -> HTTP 2xx with JSON body (shape noted on each function)
     failure -> HTTP 4xx/5xx with { "error": { "code": "...", "message": "..." } }
   ========================================================================== */

const API_CONFIG = Object.assign({
  baseUrl: '', useBackend: false, timeoutMs: 15000, authMode: 'bearer',
  equipmentPollMs: 10000, currency: '₹', branchName: 'FORMA Central'
}, window.FORMA_CONFIG || {});

/** Demo-only logic registered by page scripts (workout generator, chatbot, predictor). */
const DemoEngines = {};

class ApiError extends Error {
  constructor(message, status, code) { super(message); this.name = 'ApiError'; this.status = status || 0; this.code = code || 'error'; }
}

const API = (() => {
  const useBackend = () => API_CONFIG.useBackend === true;
  const SESSION_KEY = 'session';

  /* ---------------- low-level fetch wrapper (backend mode) ---------------- */
  function token() { const s = Store.get(SESSION_KEY); return s && s.token; }
  function qs(params) {
    const p = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '');
    return p.length ? '?' + new URLSearchParams(p).toString() : '';
  }
  /**
   * http('GET', '/meals', { query:{date:'2026-11-20'} })
   * http('POST', '/meals', { body:{...} })
   */
  async function http(method, path, { body, query } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_CONFIG.timeoutMs);
    const headers = { 'Accept': 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (API_CONFIG.authMode === 'bearer' && token()) headers['Authorization'] = 'Bearer ' + token();
    try {
      const res = await fetch(API_CONFIG.baseUrl + path + qs(query), {
        method, headers, signal: ctrl.signal,
        credentials: API_CONFIG.authMode === 'cookie' ? 'include' : 'same-origin',
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) {
        const e = data && data.error ? data.error : {};
        throw new ApiError(e.message || ('Request failed (' + res.status + ')'), res.status, e.code);
      }
      return data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err.name === 'AbortError') throw new ApiError('The request timed out. Check your connection and try again.', 0, 'timeout');
      throw new ApiError('Could not reach the server at ' + API_CONFIG.baseUrl + '. Check that the backend is running.', 0, 'network');
    } finally { clearTimeout(timer); }
  }

  const later = fn => Promise.resolve().then(fn);
  const clone = v => JSON.parse(JSON.stringify(v));

  /**
   * Generic CRUD collection.
   *   list(params)      GET    {endpoint}?params         -> Array
   *   create(item)      POST   {endpoint}                -> created item
   *   update(id,patch)  PATCH  {endpoint}/{id}           -> updated item
   *   remove(id)        DELETE {endpoint}/{id}           -> { ok:true }
   */
  function collection(storeKey, endpoint, seedFn, idPrefix) {
    const all = () => Store.ensure(storeKey, seedFn);
    return {
      list: (params = {}) => useBackend() ? http('GET', endpoint, { query: params }) : later(() => {
        const keys = Object.keys(params).filter(k => params[k] !== undefined && params[k] !== '');
        return clone(all().filter(it => keys.every(k => String(it[k]) === String(params[k]))));
      }),
      create: item => useBackend() ? http('POST', endpoint, { body: item }) : later(() => {
        const rec = Object.assign({ id: Store.uid(idPrefix), createdAt: new Date().toISOString() }, clone(item));
        const list = all(); list.push(rec); Store.set(storeKey, list); return clone(rec);
      }),
      update: (id, patch) => useBackend() ? http('PATCH', endpoint + '/' + encodeURIComponent(id), { body: patch }) : later(() => {
        const list = all(); const i = list.findIndex(x => x.id === id);
        if (i < 0) throw new ApiError('That record no longer exists.', 404, 'not_found');
        list[i] = Object.assign({}, list[i], clone(patch), { updatedAt: new Date().toISOString() }); Store.set(storeKey, list); return clone(list[i]);
      }),
      remove: id => useBackend() ? http('DELETE', endpoint + '/' + encodeURIComponent(id)) : later(() => {
        Store.set(storeKey, all().filter(x => x.id !== id)); return { ok: true };
      })
    };
  }

  /* ======================================================================
     AUTH   (endpoints: POST /auth/login, POST /auth/register, POST /auth/logout,
             GET /users/me, PATCH /users/me)
     ====================================================================== */
  const auth = {
    /** Synchronous session lookup used by the page guard and header. */
    session: () => Store.get(SESSION_KEY),
    hasSession: () => !!Store.get(SESSION_KEY),

    /** POST /auth/login  body {email,password} -> { token, user:{id,name,email,memberId} } */
    async login({ email, password }) {
      if (useBackend()) {
        const r = await http('POST', '/auth/login', { body: { email, password } });
        Store.set(SESSION_KEY, { token: r.token, user: r.user }); return r.user;
      }
      // DEMO ONLY: any well-formed credentials work. No password is checked or stored.
      const profile = Store.get('user') || DemoData.user();
      const user = Object.assign({}, profile, { email: email || profile.email });
      Store.set('user', user);
      Store.set(SESSION_KEY, { token: 'demo-token', user: { id: user.id, name: user.name, email: user.email, memberId: user.memberId } });
      return user;
    },
    /** POST /auth/register body {name,email,password,phone} -> { token, user } */
    async register({ name, email, password, phone }) {
      if (useBackend()) {
        const r = await http('POST', '/auth/register', { body: { name, email, password, phone } });
        Store.set(SESSION_KEY, { token: r.token, user: r.user }); return r.user;
      }
      const user = Object.assign(DemoData.user(), { name: name || 'User', email, phone: phone || '' });
      Store.set('user', user);
      Store.set(SESSION_KEY, { token: 'demo-token', user: { id: user.id, name: user.name, email: user.email, memberId: user.memberId } });
      return user;
    },
    /** Demo shortcut used by "Continue as demo User". */
    async demoLogin() { return auth.login({ email: DemoData.user().email, password: '' }); },
    /** POST /auth/logout */
    async logout() {
      if (useBackend()) { try { await http('POST', '/auth/logout'); } catch (e) { /* ignore */ } }
      Store.remove(SESSION_KEY);
    }
  };

  const user = {
    /** GET /users/me -> user object */
    get: () => useBackend() ? http('GET', '/users/me') : later(() => clone(Store.ensure('user', DemoData.user))),
    /** PATCH /users/me body {name?,phone?,heightCm?,...} -> user object */
    update: patch => useBackend() ? http('PATCH', '/users/me', { body: patch }) : later(() => {
      const u = Object.assign({}, Store.ensure('user', DemoData.user), clone(patch)); Store.set('user', u);
      const s = Store.get(SESSION_KEY); if (s) { s.user = Object.assign({}, s.user, { name: u.name, email: u.email }); Store.set(SESSION_KEY, s); }
      return clone(u);
    })
  };

  /* ======================================================================
     1. WORKOUT PLANNER  (POST /workout-plans/generate, GET/POST/DELETE /workout-plans)
     ====================================================================== */
  const workoutPlans = collection('workoutPlans', '/workout-plans', () => [], 'plan');
  const workout = {
    /**
     * POST /workout-plans/generate
     * body  { goal, level, durationMin, daysPerWeek, equipment:[...], notes }
     * reply { name, summary, days:[{day,focus,rest,estMinutes,exercises:[{name,muscle,sets,reps,restSec,notes}]}], tips:[] }
     * Demo: generated in the browser by DemoEngines.workout (js/workout.js). Real AI/rules engine belongs on the server.
     */
    generate: prefs => useBackend() ? http('POST', '/workout-plans/generate', { body: prefs }) : later(() => DemoEngines.workout(prefs)),
    list: workoutPlans.list, save: workoutPlans.create, remove: workoutPlans.remove,
    /** GET /exercises  (static reference data; demo reads js/data.js) */
    exercises: () => useBackend() ? http('GET', '/exercises') : later(() => DemoData.exercises)
  };

  /* ======================================================================
     2. POSTURE DETECTION  (GET /posture/guides, POST /posture/sessions, GET /posture/sessions)
     Real pose estimation needs an ML model (e.g. MediaPipe / TensorFlow.js in the
     browser, or video streamed to a server). It is NOT implemented here.
     ====================================================================== */
  const postureSessions = collection('postureSessions', '/posture/sessions', () => [], 'ps');
  const posture = {
    guides: () => useBackend() ? http('GET', '/posture/guides') : later(() => DemoData.postureGuides),
    /** POST /posture/sessions body {exercise, durationSec, reps, checklistScore, notes} */
    saveSession: postureSessions.create, sessions: postureSessions.list, removeSession: postureSessions.remove
  };

  /* ======================================================================
     3. NUTRITION  (GET/POST/PATCH/DELETE /meals, GET/PUT /nutrition/goals, GET/PUT /water, GET /foods)
     ====================================================================== */
  const meals = collection('meals', '/meals', DemoData.seedMeals, 'meal');
  const nutrition = {
    /** GET /meals?date=YYYY-MM-DD -> [{id,date,type,items:[{foodId,name,serving,qty,calories,protein,carbs,fat}]}] */
    meals: meals.list, addMeal: meals.create, updateMeal: meals.update, removeMeal: meals.remove,
    /** GET /foods?search=rice -> [{id,name,serving,calories,protein,carbs,fat}] */
    foods: (search = '') => useBackend() ? http('GET', '/foods', { query: { search } }) : later(() => {
      const q = search.trim().toLowerCase(); return clone(q ? DemoData.foods.filter(f => f.name.toLowerCase().includes(q)) : DemoData.foods);
    }),
    /** GET /nutrition/goals -> {calories,protein,carbs,fat,waterMl,cupMl} */
    goals: () => useBackend() ? http('GET', '/nutrition/goals') : later(() => clone(Store.ensure('nutritionGoals', DemoData.nutritionGoals))),
    /** PUT /nutrition/goals body same shape */
    saveGoals: g => useBackend() ? http('PUT', '/nutrition/goals', { body: g }) : later(() => { Store.set('nutritionGoals', clone(g)); return clone(g); }),
    /** GET /water?from=&to= -> [{date,cups}] */
    water: () => useBackend() ? http('GET', '/water') : later(() => clone(Store.ensure('water', DemoData.seedWater))),
    /** PUT /water/{date} body {cups} */
    setWater: (date, cups) => useBackend() ? http('PUT', '/water/' + date, { body: { cups } }) : later(() => {
      const list = Store.ensure('water', DemoData.seedWater); const i = list.findIndex(x => x.date === date);
      if (i >= 0) list[i].cups = cups; else list.push({ date, cups }); Store.set('water', list); return { date, cups };
    })
  };

  /* ======================================================================
     4. QR CHECK-IN  (GET /checkins/qr-token, POST /checkins, GET /checkins)
     Real verification MUST happen on the server: sign short-lived tokens and
     check them against the membership. The demo only checks a text prefix.
     ====================================================================== */
  const checkinList = collection('checkins', '/checkins', DemoData.seedCheckins, 'chk');
  const checkin = {
    /** GET /checkins/qr-token -> { token, expiresAt }  (server-signed, short-lived) */
    qrToken: () => useBackend() ? http('GET', '/checkins/qr-token') : later(() => {
      const u = Store.ensure('user', DemoData.user);
      return { token: 'FORMA-DEMO|' + u.memberId + '|' + Date.now().toString(36), expiresAt: new Date(Date.now() + 5 * 60000).toISOString(), demo: true };
    }),
    /** POST /checkins body {token, method:'qr'|'scan'|'manual'} -> {id,date,time,status,member:{name,plan}} */
    verify: ({ token: tk, method }) => useBackend() ? http('POST', '/checkins', { body: { token: tk, method } }) : later(() => {
      if (!tk || !String(tk).startsWith('FORMA-DEMO|')) throw new ApiError('This code is not a FORMA demo QR code. Use the code shown on the "My QR" tab.', 422, 'invalid_token');
      const now = new Date(); const date = DemoData.iso(now);
      const hh = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      const list = Store.ensure('checkins', DemoData.seedCheckins);
      const existing = list.find(c => c.date === date && c.method !== 'seed');
      const rec = { id: Store.uid('chk'), date, time: hh, method: method || 'qr', branch: API_CONFIG.branchName, status: 'demo-recorded', createdAt: now.toISOString() };
      list.push(rec); Store.set('checkins', list);
      const mem = Store.ensure('membership', DemoData.seedMembership);
      const plan = DemoData.membershipPlans.find(p => p.id === mem.planId);
      const u = Store.ensure('user', DemoData.user);
      return { ...rec, alreadyCheckedInToday: !!existing, member: { name: u.name, memberId: u.memberId, plan: plan ? plan.name : '' } };
    }),
    list: checkinList.list, remove: checkinList.remove
  };

  /* ======================================================================
     5. EQUIPMENT  (GET /equipment, PATCH /equipment/{id} [staff only])
     For real-time updates use WebSockets or Server-Sent Events from the server
     (e.g. GET /equipment/stream). The UI polls list() as a simple placeholder.
     ====================================================================== */
  const equipmentCol = collection('equipment', '/equipment', DemoData.seedEquipment, 'eq');
  const equipment = {
    /** GET /equipment?category=&status= -> [{id,name,category,type,zone,status,waitMinutes,updatedAt}] */
    list: equipmentCol.list,
    /** PATCH /equipment/{id} body {status, waitMinutes}. Normally staff/IoT sensors only. */
    setStatus: (id, status, waitMinutes) => equipmentCol.update(id, { status, waitMinutes: status === 'occupied' ? (waitMinutes || 5) : 0 }),
    categories: () => DemoData.equipmentCategories
  };

  /* ======================================================================
     6. PROGRESS  (GET/POST/DELETE /workouts, /body-metrics; GET/PUT /goals; GET /progress/prediction)
     ====================================================================== */
  const workoutLog = collection('workouts', '/workouts', DemoData.seedWorkouts, 'wk');
  const metrics = collection('bodyMetrics', '/body-metrics', DemoData.seedBodyMetrics, 'bm');
  const progress = {
    workouts: workoutLog.list, addWorkout: workoutLog.create, removeWorkout: workoutLog.remove,
    metrics: metrics.list, addMetric: metrics.create, removeMetric: metrics.remove,
    /** GET /goals -> {type,startWeightKg,targetWeightKg,targetDate,weeklyWorkouts} */
    goal: () => useBackend() ? http('GET', '/goals') : later(() => clone(Store.ensure('goal', DemoData.seedGoal))),
    saveGoal: g => useBackend() ? http('PUT', '/goals', { body: g }) : later(() => { Store.set('goal', clone(g)); return clone(g); }),
    /**
     * GET /progress/prediction?weeks=12
     * reply { generatedBy:'model-name', weeks:[{date,predictedWeightKg,lower,upper}], etaTargetDate, confidence }
     * Demo: simple linear trend in the browser (DemoEngines.prediction). NOT an AI model.
     */
    prediction: ({ weeks = 12 } = {}) => useBackend() ? http('GET', '/progress/prediction', { query: { weeks } }) : later(async () => DemoEngines.prediction({ weeks, metrics: await metrics.list(), goal: Store.ensure('goal', DemoData.seedGoal) }))
  };

  /* ======================================================================
     7. TRAINERS  (GET /trainers, GET /trainers/{id}, GET/POST/PATCH/DELETE /trainer-bookings)
     ====================================================================== */
  const bookings = collection('trainerBookings', '/trainer-bookings', () => [], 'bk');
  const trainers = {
    /** GET /trainers?search=&specialization=&day= -> [{id,name,specializations,experienceYears,rating,reviewCount,pricePerSession,availableDays,languages,slots,photo,bio,certifications}] */
    list: () => useBackend() ? http('GET', '/trainers') : later(() => clone(DemoData.trainers)),
    get: id => useBackend() ? http('GET', '/trainers/' + encodeURIComponent(id)) : later(() => clone(DemoData.trainers.find(t => t.id === id))),
    /** POST /trainer-bookings body {trainerId,date,time,goal,notes,contactPhone} -> booking {id,status:'requested'} */
    bookings: bookings.list, book: bookings.create, updateBooking: bookings.update, cancelBooking: bookings.remove
  };

  /* ======================================================================
     8. CHATBOT  (POST /chatbot/messages, GET /chatbot/history, DELETE /chatbot/history)
     Keep AI provider keys on the SERVER. The browser only calls your own endpoint.
     ====================================================================== */
  const chatbot = {
    /**
     * POST /chatbot/messages body {message, conversationId?}
     * reply { reply:'text', conversationId, suggestions:[] }
     */
    send: (message, history) => useBackend() ? http('POST', '/chatbot/messages', { body: { message } }) : later(() => DemoEngines.chatbot(message, history)),
    history: () => useBackend() ? http('GET', '/chatbot/history') : later(() => clone(Store.get('chatHistory', []))),
    saveHistory: list => useBackend() ? Promise.resolve(list) : later(() => { Store.set('chatHistory', clone(list)); return list; }),
    clearHistory: () => useBackend() ? http('DELETE', '/chatbot/history') : later(() => { Store.remove('chatHistory'); return { ok: true }; })
  };

  /* ======================================================================
     9. MEMBERSHIP  (GET /membership/plans, GET /membership, POST /membership/subscribe,
                     PATCH /membership/preferences, POST /membership/cancel, GET /membership/history,
                     POST /payments/intents)
     Real payments need a payment gateway (Razorpay, Stripe, …) with tokenised
     cards created on the server. The browser must NEVER store card numbers.
     ====================================================================== */
  const addMonths = (dateStr, months) => { const d = new Date(dateStr + 'T12:00:00'); d.setMonth(d.getMonth() + months); return DemoData.iso(d); };
  const membership = {
    plans: () => useBackend() ? http('GET', '/membership/plans') : later(() => ({ plans: clone(DemoData.membershipPlans), cycles: clone(DemoData.billingCycles) })),
    /** GET /membership -> {planId,cycle,status,startDate,expiryDate,autoRenew,reminderDaysBefore,renewalCycle,paymentMethod:{brand,last4}} */
    current: () => useBackend() ? http('GET', '/membership') : later(() => clone(Store.ensure('membership', DemoData.seedMembership))),
    history: () => useBackend() ? http('GET', '/membership/history') : later(() => clone(Store.ensure('membershipHistory', DemoData.seedMembershipHistory))),
    /**
     * POST /membership/subscribe body {planId, cycle, paymentMethodId}
     * Backend flow: create payment intent -> confirm with gateway SDK -> server activates plan.
     * Demo: records a fake paid entry. NO real payment is made.
     */
    subscribe: ({ planId, cycle, amount, last4, brand }) => useBackend() ? http('POST', '/membership/subscribe', { body: { planId, cycle } }) : later(() => {
      const plan = DemoData.membershipPlans.find(p => p.id === planId); const cyc = DemoData.billingCycles.find(c => c.id === cycle) || DemoData.billingCycles[0];
      if (!plan) throw new ApiError('Choose a plan to continue.', 422, 'invalid_plan');
      const cur = Store.ensure('membership', DemoData.seedMembership);
      const today = DemoData.today();
      const startFrom = cur.status === 'active' && cur.expiryDate > today && cur.planId === planId ? cur.expiryDate : today;
      const next = Object.assign({}, cur, { planId, cycle, status: 'active', startDate: today, expiryDate: addMonths(startFrom, cyc.months), renewalCycle: cycle, paymentMethod: { brand: brand || cur.paymentMethod.brand, last4: last4 || cur.paymentMethod.last4, holder: 'User' } });
      Store.set('membership', next);
      const hist = Store.ensure('membershipHistory', DemoData.seedMembershipHistory);
      hist.unshift({ id: Store.uid('mh'), date: today, description: plan.name + ' plan – ' + cyc.label.toLowerCase(), amount, status: 'paid (demo)', planId });
      Store.set('membershipHistory', hist);
      return clone(next);
    }),
    /** PATCH /membership/preferences body {autoRenew, reminderDaysBefore, renewalCycle} */
    savePreferences: patch => useBackend() ? http('PATCH', '/membership/preferences', { body: patch }) : later(() => {
      const next = Object.assign({}, Store.ensure('membership', DemoData.seedMembership), clone(patch)); Store.set('membership', next); return clone(next);
    }),
    /** POST /membership/cancel -> membership (status:'cancelled' effective at expiry) */
    cancel: () => useBackend() ? http('POST', '/membership/cancel') : later(() => {
      const next = Object.assign({}, Store.ensure('membership', DemoData.seedMembership), { autoRenew: false, status: 'cancelling' }); Store.set('membership', next); return clone(next);
    })
  };

  /** Clears all demo data (used by the "Reset demo data" menu item). Demo mode only. */
  function resetDemo() { const s = Store.get(SESSION_KEY); const theme = Store.get('theme'); Store.clearAll(); if (s) Store.set(SESSION_KEY, { token: s.token, user: { id: 'usr_demo', name: 'User', email: 'user@forma.demo', memberId: 'FRM-000001' } }); if (theme) Store.set('theme', theme); }

  return { config: API_CONFIG, http, auth, user, workout, posture, nutrition, checkin, equipment, progress, trainers, chatbot, membership, resetDemo };
})();
