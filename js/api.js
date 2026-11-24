
/* ==========================================================================
   FORMA - API.JS
   Connected to the actual Spring Boot backend controllers.
   ========================================================================== */

/* ======================== CONFIGURATION ======================== */

const API_CONFIG = Object.assign({
    baseUrl: 'http://localhost:8080',
    useBackend: true,
    timeoutMs: 15000,
    authMode: 'bearer',
    equipmentPollMs: 10000,
    currency: '₹',
    branchName: 'FORMA Central'
}, window.FORMA_CONFIG || {});

class ApiError extends Error {
    constructor(message, status = 0, code = 'error') {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
    }
}

const DemoEngines = window.DemoEngines || {};

/* ======================== MAIN API ======================== */

const API = (() => {

    const SESSION_KEY = 'session';

    const useBackend = () => API_CONFIG.useBackend === true;

    const clone = value =>
        value == null ? value : JSON.parse(JSON.stringify(value));

    /* ======================== LOCAL STORAGE ======================== */

    const StoreFallback = {
        get(key, fallback = null) {
            try {
                const value = localStorage.getItem('forma_' + key);
                return value ? JSON.parse(value) : fallback;
            } catch (error) {
                return fallback;
            }
        },

        set(key, value) {
            localStorage.setItem('forma_' + key, JSON.stringify(value));
            return value;
        },

        remove(key) {
            localStorage.removeItem('forma_' + key);
        },

        ensure(key, seed) {
            const value = this.get(key);
            if (value !== null) return value;

            const initial =
                typeof seed === 'function' ? seed() : seed;

            this.set(key, initial);
            return initial;
        },

        uid(prefix = 'id') {
            return prefix + '_' + Date.now() + '_' +
                Math.random().toString(36).slice(2, 8);
        },

        clearAll() {
            Object.keys(localStorage)
                .filter(key => key.startsWith('forma_'))
                .forEach(key => localStorage.removeItem(key));
        }
    };

    const db = window.Store || StoreFallback;

    function getDemoData(key, fallback = []) {
        if (window.DemoData && window.DemoData[key] !== undefined) {
            const value = window.DemoData[key];
            return clone(typeof value === 'function' ? value() : value);
        }
        return clone(fallback);
    }

    function ensure(key, fallback = []) {
        return db.ensure(key, () => getDemoData(key, fallback));
    }

    function uid(prefix) {
        return db.uid(prefix);
    }

    /* ======================== SESSION / TOKEN ======================== */

    function session() {
        return db.get(SESSION_KEY);
    }

    function token() {
        const current = session();
        return current && current.token;
    }

    function currentUser() {
        const current = session();
        return current && current.user;
    }

    function currentUserId() {
        const user = currentUser();
        return user && (user.id || user.userId);
    }

    function today() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

    function requireUserId() {
        const id = currentUserId();

        if (!id) {
            throw new ApiError(
                'User ID not found. Please login again.',
                401,
                'user_not_found'
            );
        }

        return id;
    }

    /* ======================== QUERY PARAMETERS ======================== */

    function qs(params) {
        const values = Object.entries(params || {})
            .filter(([, value]) =>
                value !== undefined &&
                value !== null &&
                value !== ''
            );

        return values.length
            ? '?' + new URLSearchParams(values).toString()
            : '';
    }

    /* ======================== HTTP REQUEST ======================== */

    async function http(method, path, options = {}) {

        if (!useBackend()) {
            throw new ApiError(
                'Backend is disabled.',
                0,
                'backend_disabled'
            );
        }

        const { body, query } = options;

        const controller = new AbortController();

        const timer = setTimeout(
            () => controller.abort(),
            API_CONFIG.timeoutMs
        );

        const headers = {
            Accept: 'application/json'
        };

        if (body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        if (
            API_CONFIG.authMode === 'bearer' &&
            token() &&
            !options.skipAuth
        ) {
            headers.Authorization = 'Bearer ' + token();
        }

        const baseUrl = API_CONFIG.baseUrl.replace(/\/+$/, '');
        const url = baseUrl + path + qs(query);

        try {
            const response = await fetch(url, {
                method,
                headers,
                signal: controller.signal,
                credentials:
                    API_CONFIG.authMode === 'cookie'
                        ? 'include'
                        : 'same-origin',
                body: body !== undefined
                    ? JSON.stringify(body)
                    : undefined
            });

            const responseText = await response.text();

            let data = null;

            try {
                data = responseText
                    ? JSON.parse(responseText)
                    : null;
            } catch (error) {
                if (response.ok) {
                    data = responseText;
                }
            }

            if (!response.ok) {
                const message =
                    data?.message ||
                    data?.error?.message ||
                    data?.detail ||
                    (typeof data === 'string' ? data : null) ||
                    `Request failed (${response.status})`;

                throw new ApiError(
                    message,
                    response.status,
                    data?.code || data?.error?.code || 'request_failed'
                );
            }

            return data;

        } catch (error) {
            if (error instanceof ApiError) throw error;

            if (error.name === 'AbortError') {
                throw new ApiError(
                    'Request timed out.',
                    0,
                    'timeout'
                );
            }

            throw new ApiError(
                'Cannot connect to Spring Boot server: ' + baseUrl,
                0,
                'network'
            );

        } finally {
            clearTimeout(timer);
        }
    }

    /* ======================== GENERIC COLLECTION ======================== */

    function collection(
        storeKey,
        endpoint,
        seed = [],
        prefix = 'id',
        updateMethod = 'PUT'
    ) {
        return {

            list: params => {
                if (useBackend()) {
                    return http('GET', endpoint, { query: params });
                }

                return Promise.resolve(
                    ensure(storeKey, seed).filter(record =>
                        Object.entries(params || {}).every(
                            ([key, value]) =>
                                value === undefined ||
                                value === '' ||
                                String(record[key]) === String(value)
                        )
                    )
                ).then(clone);
            },

            create: item => {
                if (useBackend()) {
                    return http('POST', endpoint, { body: item });
                }

                const records = ensure(storeKey, seed);

                const record = Object.assign({
                    id: uid(prefix),
                    createdAt: new Date().toISOString()
                }, clone(item));

                records.push(record);
                db.set(storeKey, records);

                return Promise.resolve(clone(record));
            },

            update: (id, patch) => {
                if (useBackend()) {
                    return http(
                        updateMethod,
                        endpoint + '/' + encodeURIComponent(id),
                        { body: patch }
                    );
                }

                const records = ensure(storeKey, seed);

                const index = records.findIndex(
                    item => String(item.id) === String(id)
                );

                if (index < 0) {
                    throw new ApiError('Record not found.', 404, 'not_found');
                }

                records[index] = Object.assign(
                    {},
                    records[index],
                    clone(patch),
                    { updatedAt: new Date().toISOString() }
                );

                db.set(storeKey, records);

                return Promise.resolve(clone(records[index]));
            },

            remove: id => {
                if (useBackend()) {
                    return http(
                        'DELETE',
                        endpoint + '/' + encodeURIComponent(id)
                    );
                }

                const records = ensure(storeKey, seed);

                db.set(
                    storeKey,
                    records.filter(item => String(item.id) !== String(id))
                );

                return Promise.resolve({ ok: true });
            }
        };
    }

    /* ======================== AUTHENTICATION ======================== */

    function normalizeAuthResponse(result) {
        const data = result?.data || result || {};

        const jwt =
            data.token ||
            data.jwt ||
            data.accessToken ||
            data.access_token;

        const user =
            data.user ||
            data.authUser ||
            data.auth_user ||
            data.profile ||
            data.data?.user ||
            null;

        if (!jwt) {
            throw new ApiError(
                'Login response did not contain a JWT token. Check AuthResponse.',
                500,
                'missing_token'
            );
        }

        if (!user) {
            throw new ApiError(
                'Login response did not contain user information.',
                500,
                'missing_user'
            );
        }

        return { token: jwt, user };
    }

    const auth = {
        session: () => session(),

        hasSession: () => !!session()?.token,

        async login({ email, password } = {}) {
            if (!email || !password) {
                throw new ApiError(
                    'Please enter email and password.',
                    422
                );
            }

            if (useBackend()) {
                const result = await http(
                    'POST',
                    '/api/v1/auth/login',
                    {
                        body: { email, password },
                        skipAuth: true
                    }
                );

                const normalized = normalizeAuthResponse(result);

                db.set(SESSION_KEY, normalized);
                db.set('user', normalized.user);

                return normalized.user;
            }

            const user = Object.assign(
                {},
                db.get('user') || {
                    id: 'usr_demo',
                    name: 'Demo User'
                },
                { email }
            );

            db.set('user', user);
            db.set(SESSION_KEY, {
                token: 'demo-token',
                user
            });

            return clone(user);
        },

        async register({ name, email, password, phone } = {}) {
            if (useBackend()) {
                const result = await http(
                    'POST',
                    '/api/v1/auth/register',
                    {
                        body: { name, email, password, phone },
                        skipAuth: true
                    }
                );

                // Registration response may not automatically log in.
                if (
                    result?.token ||
                    result?.jwt ||
                    result?.accessToken ||
                    result?.data?.token
                ) {
                    const normalized = normalizeAuthResponse(result);
                    db.set(SESSION_KEY, normalized);
                    db.set('user', normalized.user);
                    return normalized.user;
                }

                return result;
            }

            const user = {
                id: uid('usr'),
                name,
                email,
                phone
            };

            db.set('user', user);
            db.set(SESSION_KEY, {
                token: 'demo-token',
                user
            });

            return clone(user);
        },

        async demoLogin() {
            return auth.login({
                email: 'user@forma.demo',
                password: 'demo'
            });
        },

        async logout() {
            if (useBackend()) {
                try {
                    await http('POST', '/api/v1/auth/logout');
                } finally {
                    db.remove(SESSION_KEY);
                }
            } else {
                db.remove(SESSION_KEY);
            }

            return { ok: true };
        }
    };

    /* ======================== USER PROFILE ======================== */

    const user = {
        get: () => useBackend()
            ? http('GET', '/api/v1/users/me')
            : Promise.resolve(ensure('user', {
                id: 'usr_demo',
                name: 'Demo User',
                email: 'user@forma.demo'
            })),

        update: patch => useBackend()
            ? http('PATCH', '/api/v1/users/me', { body: patch })
            : Promise.resolve().then(() => {
                const updated = Object.assign(
                    {},
                    ensure('user', {}),
                    clone(patch)
                );
                db.set('user', updated);
                return clone(updated);
            })
    };

    /* ======================== 1. WORKOUT PLANNER ======================== */

    const workoutPlans = collection(
        'workoutPlans',
        '/api/v1/workout-plans',
        [],
        'plan',
        'PUT'
    );

    const workout = {
        generate: prefs => useBackend()
            ? http('POST', '/api/v1/workout-plans/generate', {
                body: prefs
            })
            : Promise.resolve(
                typeof DemoEngines.workout === 'function'
                    ? DemoEngines.workout(prefs)
                    : { name: 'FORMA Workout Plan', days: [], tips: [] }
            ),

        list: workoutPlans.list,
        save: workoutPlans.create,
        remove: workoutPlans.remove,

        exercises: () => Promise.resolve(
            getDemoData('exercises', [])
        )
    };

    /* ======================== 2. POSTURE ======================== */

    const posture = {
        guides: () => useBackend()
            ? http('GET', '/api/v1/posture/guides')
            : Promise.resolve(getDemoData('postureGuides', [])),

        saveSession: data => useBackend()
            ? http('POST', '/api/v1/posture/sessions', { body: data })
            : Promise.resolve().then(() => {
                const records = ensure('postureSessions', []);
                const record = Object.assign(
                    { id: uid('ps') },
                    clone(data)
                );
                records.push(record);
                db.set('postureSessions', records);
                return clone(record);
            }),

        sessions: params => useBackend()
            ? http('GET', '/api/v1/posture/sessions', { query: params })
            : Promise.resolve(ensure('postureSessions', [])),

        removeSession: id => useBackend()
            ? http('DELETE', '/api/v1/posture/sessions/' + encodeURIComponent(id))
            : Promise.resolve().then(() => {
                const records = ensure('postureSessions', []);
                db.set(
                    'postureSessions',
                    records.filter(item => String(item.id) !== String(id))
                );
                return { ok: true };
            })
    };

/* ======================== 3. NUTRITION TRACKER ======================== */

const nutrition = {

    // GET all meals for a date
    meals: params => useBackend()
        ? http('GET', '/api/nutrition', {
            query: typeof params === 'string'
                ? { date: params }
                : params
        })
        : Promise.resolve(ensure('meals', [])),

    // ADD meal
    addMeal: meal => useBackend()
        ? http('POST', '/api/nutrition', { body: meal })
        : Promise.resolve().then(() => {
            const records = ensure('meals', []);
            const record = Object.assign(
                { id: uid('meal') },
                clone(meal)
            );
            records.push(record);
            db.set('meals', records);
            return clone(record);
        }),

    // UPDATE meal (backend PUT endpoint must exist)
    updateMeal: (id, meal) => useBackend()
        ? http('PUT', '/api/nutrition/' + encodeURIComponent(id), {
            body: meal
        })
        : Promise.resolve().then(() => {
            const records = ensure('meals', []);
            const index = records.findIndex(
                item => String(item.id) === String(id)
            );

            if (index < 0) {
                throw new ApiError('Meal not found.', 404);
            }

            records[index] = Object.assign(
                {},
                records[index],
                clone(meal)
            );

            db.set('meals', records);
            return clone(records[index]);
        }),

    // DELETE meal
    removeMeal: id => useBackend()
        ? http('DELETE', '/api/nutrition/' + encodeURIComponent(id))
        : Promise.resolve().then(() => {
            const records = ensure('meals', []);
            db.set(
                'meals',
                records.filter(item => String(item.id) !== String(id))
            );
            return { ok: true };
        }),

    // GET foods
    foods: search => useBackend()
        ? http('GET', '/foods').then(data => {
            const foods = (Array.isArray(data) ? data : []).map(food => ({
                id: food.id,
                foodId: food.id,
                name: food.name,
                serving: food.serving,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat
            }));

            if (!search) return foods;

            const keyword = String(search).toLowerCase();

            return foods.filter(food =>
                String(food.name || '').toLowerCase().includes(keyword)
            );
        })
        : Promise.resolve(getDemoData('foods', []).filter(food =>
            !search ||
            String(food.name || '').toLowerCase().includes(
                String(search).toLowerCase()
            )
        )),

    // ADD new food
    addFood: data => useBackend()
        ? http('POST', '/foods', { body: data })
        : Promise.resolve().then(() => {
            const records = ensure('foods', []);
            const food = Object.assign(
                { id: uid('food') },
                clone(data)
            );
            records.push(food);
            db.set('foods', records);
            return clone(food);
        }),

    // GET nutrition goals
    goals: () => useBackend()
        ? http(
            'GET',
            '/api/diet/goal/user/' + encodeURIComponent(requireUserId())
        )
        : Promise.resolve(ensure('nutritionGoals', {
            calories: 2000,
            protein: 100,
            carbs: 250,
            fat: 65,
            waterMl: 2500,
            cupMl: 250
        })),

    // SAVE nutrition goals
    saveGoals: goals => useBackend()
        ? http('POST', '/api/diet/goal', { body: goals })
        : Promise.resolve(db.set('nutritionGoals', clone(goals))),

    // GET water intake
    water: date => useBackend()
        ? http('GET', '/water/' + encodeURIComponent(date || today()))
        : Promise.resolve(ensure('water', [])),

    // UPDATE water intake
    setWater: (date, cups) => useBackend()
        ? http(
            'PUT',
            '/water/' + encodeURIComponent(date),
            { body: { cups } }
        )
        : Promise.resolve().then(() => {
            const records = ensure('water', []);
            const index = records.findIndex(
                item => item.date === date
            );

            if (index >= 0) {
                records[index].cups = cups;
            } else {
                records.push({ date, cups });
            }

            db.set('water', records);
            return { date, cups };
        })
};

    /* ======================== 4. QR CHECK-IN ======================== */

    const checkin = {
        qrToken: () => useBackend()
            ? http('GET', '/api/v1/checkins/qr-token')
            : Promise.resolve({
                token: 'FORMA-DEMO|' + Date.now(),
                expiresAt: new Date(Date.now() + 300000).toISOString()
            }),

        verify: data => useBackend()
            ? http('POST', '/api/v1/checkins', { body: data })
            : Promise.resolve({
                id: uid('chk'),
                status: 'demo-recorded',
                method: data.method || 'qr'
            }),

        list: params => useBackend()
            ? http('GET', '/api/v1/checkins', { query: params })
            : Promise.resolve(ensure('checkins', []))
    };

    /* ======================== 5. EQUIPMENT ======================== */

    const equipment = {
        // EquipmentController: GET /api/v1/equipment
        list: params => useBackend()
            ? http('GET', '/api/v1/equipment', { query: params })
            : Promise.resolve(ensure('equipment', [])),

        // EquipmentController: PUT /api/v1/equipment/{id}/status
        setStatus: (id, status, waitMinutes) => useBackend()
            ? http(
                'PUT',
                '/api/v1/equipment/' + encodeURIComponent(id) + '/status',
                {
                    body: {
                        status,
                        waitMinutes: status === 'occupied'
                            ? (waitMinutes || 5)
                            : 0
                    }
                }
            )
            : Promise.resolve().then(() => {
                const records = ensure('equipment', []);
                const item = records.find(
                    record => String(record.id) === String(id)
                );
                if (!item) throw new ApiError('Equipment not found.', 404);
                item.status = status;
                item.waitMinutes = status === 'occupied'
                    ? (waitMinutes || 5)
                    : 0;
                db.set('equipment', records);
                return clone(item);
            }),

        categories: () => getDemoData('equipmentCategories', [])
    };

    /* ======================== 6. PROGRESS TRACKER ======================== */

    const progress = {
        workouts: params => useBackend()
            ? http('GET', '/api/v1/workouts', { query: params })
            : Promise.resolve(ensure('workouts', [])),

        addWorkout: data => useBackend()
            ? http('POST', '/api/v1/workouts', { body: data })
            : Promise.resolve().then(() => {
                const records = ensure('workouts', []);
                const record = Object.assign({ id: uid('wk') }, clone(data));
                records.push(record);
                db.set('workouts', records);
                return clone(record);
            }),

        removeWorkout: id => useBackend()
            ? http('DELETE', '/api/v1/workouts/' + encodeURIComponent(id))
            : Promise.resolve().then(() => {
                const records = ensure('workouts', []);
                db.set(
                    'workouts',
                    records.filter(item => String(item.id) !== String(id))
                );
                return { ok: true };
            }),

        metrics: params => useBackend()
            ? http('GET', '/api/v1/body-metrics', { query: params })
            : Promise.resolve(ensure('bodyMetrics', [])),

        addMetric: data => useBackend()
            ? http('POST', '/api/v1/body-metrics', { body: data })
            : Promise.resolve().then(() => {
                const records = ensure('bodyMetrics', []);
                const record = Object.assign({ id: uid('bm') }, clone(data));
                records.push(record);
                db.set('bodyMetrics', records);
                return clone(record);
            }),

        removeMetric: id => useBackend()
            ? http('DELETE', '/api/v1/body-metrics/' + encodeURIComponent(id))
            : Promise.resolve().then(() => {
                const records = ensure('bodyMetrics', []);
                db.set(
                    'bodyMetrics',
                    records.filter(item => String(item.id) !== String(id))
                );
                return { ok: true };
            }),

        goal: () => useBackend()
            ? http('GET', '/api/v1/goals')
            : Promise.resolve(ensure('goal', {})),

        saveGoal: goal => useBackend()
            ? http('PUT', '/api/v1/goals', { body: goal })
            : Promise.resolve(db.set('goal', clone(goal))),

        prediction: ({ weeks = 12 } = {}) => useBackend()
            ? http('GET', '/api/v1/progress/prediction', {
                query: { weeks }
            })
            : Promise.resolve({
                generatedBy: 'demo',
                weeks: [],
                confidence: 'low'
            })
    };

/* ======================== 7. TRAINERS ======================== */

function unwrapTrainerResponse(response) {
    if (
        response &&
        typeof response === 'object' &&
        Object.prototype.hasOwnProperty.call(response, 'data')
    ) {
        return response.data;
    }

    return response;
}

const trainers = {

    // GET /api/trainers
    list: () => useBackend()
        ? http('GET', '/api/trainers')
            .then(unwrapTrainerResponse)
        : Promise.resolve(getDemoData('trainers', [])),

    // GET /api/trainers/{id}
    get: id => useBackend()
        ? http(
            'GET',
            '/api/trainers/' + encodeURIComponent(id)
        ).then(unwrapTrainerResponse)
        : Promise.resolve(
            getDemoData('trainers', []).find(
                item => String(item.id) === String(id)
            ) || null
        ),

    // GET /api/trainers/search?specialization=
    search: specialization => {
        if (!specialization || !specialization.trim()) {
            return Promise.reject(
                new ApiError('Please enter a specialization.', 422)
            );
        }

        return useBackend()
            ? http('GET', '/api/trainers/search', {
                query: { specialization: specialization.trim() }
            }).then(unwrapTrainerResponse)
            : Promise.resolve(
                getDemoData('trainers', []).filter(trainer =>
                    String(trainer.specialization || '')
                        .toLowerCase()
                        .includes(specialization.toLowerCase())
                )
            );
    },

    // GET /api/trainers/match?goal=
    match: goal => {
        if (!goal || !goal.trim()) {
            return Promise.reject(
                new ApiError('Please select a fitness goal.', 422)
            );
        }

        return useBackend()
            ? http('GET', '/api/trainers/match', {
                query: { goal: goal.trim() }
            }).then(unwrapTrainerResponse)
            : Promise.resolve(
                getDemoData('trainers', []).filter(trainer =>
                    String(trainer.supportedGoals || '')
                        .toLowerCase()
                        .includes(goal.toLowerCase())
                )
            );
    },

    // POST /api/trainers/book
    book: data => {
        if (!data || !data.trainerId || !data.scheduledAt) {
            return Promise.reject(
                new ApiError(
                    'Trainer ID and booking date are required.',
                    422
                )
            );
        }

        return useBackend()
            ? http('POST', '/api/trainers/book', {
                body: Object.assign({}, data, {
                    memberId: data.memberId || requireUserId()
                })
            }).then(unwrapTrainerResponse)
            : Promise.reject(
                new ApiError('Demo booking is not configured.')
            );
    },

    // GET /api/trainers/bookings/member/{memberId}
    bookings: memberId => useBackend()
        ? http(
            'GET',
            '/api/trainers/bookings/member/' +
            encodeURIComponent(memberId || requireUserId())
        ).then(unwrapTrainerResponse)
        : Promise.resolve(ensure('trainerBookings', [])),

    // GET /api/trainers/bookings/trainer/{trainerId}
    trainerBookings: trainerId => useBackend()
        ? http(
            'GET',
            '/api/trainers/bookings/trainer/' +
            encodeURIComponent(trainerId)
        ).then(unwrapTrainerResponse)
        : Promise.resolve(ensure('trainerBookings', [])),

    // PUT /api/trainers/bookings/{bookingId}/status
    updateBooking: (bookingId, status) => useBackend()
        ? http(
            'PUT',
            '/api/trainers/bookings/' +
            encodeURIComponent(bookingId) +
            '/status',
            {
                body: { status }
            }
        ).then(unwrapTrainerResponse)
        : Promise.resolve({ ok: true }),

    // DELETE /api/trainers/bookings/{bookingId}?memberId=
    cancelBooking: (bookingId, memberId) => useBackend()
        ? http(
            'DELETE',
            '/api/trainers/bookings/' +
            encodeURIComponent(bookingId),
            {
                query: {
                    memberId: memberId || requireUserId()
                }
            }
        ).then(unwrapTrainerResponse)
        : Promise.resolve({ ok: true })
};

    /* ======================== 8. CHATBOT ======================== */

    const chatbot = {
        // FitnessChatbotController: POST /api/chatbot/chat
        send: (message, history) => useBackend()
            ? http('POST', '/api/chatbot/chat', {
                body: {
                    message,
                    history
                }
            })
            : Promise.resolve({
                reply: 'Welcome to FORMA! How can I help you?',
                suggestions: []
            }),

        history: () => useBackend()
            ? http(
                'GET',
                '/api/chatbot/user/' +
                encodeURIComponent(requireUserId()) +
                '/history'
            )
            : Promise.resolve(db.get('chatHistory', [])),

        getChat: chatId => useBackend()
            ? http(
                'GET',
                '/api/chatbot/user/' +
                encodeURIComponent(requireUserId()) +
                '/history/' + encodeURIComponent(chatId)
            )
            : Promise.resolve(null),

        saveHistory: list => Promise.resolve(
            db.set('chatHistory', clone(list))
        ),

        clearHistory: chatId => useBackend()
            ? http(
                'DELETE',
                '/api/chatbot/user/' +
                encodeURIComponent(requireUserId()) +
                '/history/' + encodeURIComponent(chatId)
            )
            : Promise.resolve(db.remove('chatHistory') || { ok: true })
    };

    /* 9. MEMBERSHIP */

const unwrapMembershipResponse = response => {
    return response && Object.prototype.hasOwnProperty.call(response, 'data')
        ? response.data
        : response;
};

const membership = {
    plans: () => useBackend()
        ? http('GET', '/api/membership-plans')
            .then(unwrapMembershipResponse)
            .then(data => Array.isArray(data) ? data : [])
        : Promise.resolve(getDemoData('membershipPlans', [])),

    current: () => useBackend()
        ? http(
            'GET',
            '/api/memberships/user/' + encodeURIComponent(requireUserId())
        )
            .then(unwrapMembershipResponse)
            .catch(error => {
                if ((error.message || '').includes('No active membership found')) {
                    return null;
                }
                throw error;
            })
        : Promise.resolve(ensure('membership', null)),

    history: () => useBackend()
        ? http(
            'GET',
            '/api/memberships/user/' +
            encodeURIComponent(requireUserId()) +
            '/history'
        )
            .then(unwrapMembershipResponse)
            .then(data => Array.isArray(data) ? data : [])
        : Promise.resolve(ensure('membershipHistory', [])),

    subscribe: data => useBackend()
        ? http('POST', '/api/memberships/subscribe', {
            body: {
                userId: requireUserId(),
                planId: data.planId,
                autoRenew: !!data.autoRenew
            }
        }).then(unwrapMembershipResponse)
        : Promise.reject(
            new ApiError('Membership is not available in demo mode.')
        ),

    savePreferences: (membershipId, enabled) => useBackend()
        ? http(
            'PUT',
            '/api/memberships/' +
            encodeURIComponent(membershipId) +
            '/auto-renew',
            { query: { enabled: enabled } }
        ).then(unwrapMembershipResponse)
        : Promise.resolve({ ok: true }),

    cancel: () => Promise.reject(
        new ApiError('Membership cancellation is not supported by the backend.')
    )
};
    /* ======================== FOOD CRUD ======================== */

    const food = {
        list: params => useBackend()
            ? http('GET', '/foods', { query: params })
            : Promise.resolve(getDemoData('foods', [])),

        get: id => useBackend()
            ? http('GET', '/foods/' + encodeURIComponent(id))
            : Promise.resolve(null),

        create: data => useBackend()
            ? http('POST', '/foods', { body: data })
            : Promise.resolve(data),

        update: (id, data) => useBackend()
            ? http('PUT', '/foods/' + encodeURIComponent(id), { body: data })
            : Promise.resolve(data),

        remove: id => useBackend()
            ? http('DELETE', '/foods/' + encodeURIComponent(id))
            : Promise.resolve({ ok: true })
    };

    /* ======================== OTHER BACKEND MODULES ======================== */

    const diet = {
        dashboard: () => useBackend()
            ? http(
                'GET',
                '/api/diet/user/' +
                encodeURIComponent(requireUserId()) +
                '/dashboard'
            )
            : Promise.resolve({}),

        today: () => useBackend()
            ? http(
                'GET',
                '/api/diet/user/' +
                encodeURIComponent(requireUserId()) +
                '/today'
            )
            : Promise.resolve([]),

        history: () => useBackend()
            ? http(
                'GET',
                '/api/diet/user/' +
                encodeURIComponent(requireUserId()) +
                '/history'
            )
            : Promise.resolve([])
    };

    const sleep = {
        log: data => useBackend()
            ? http('POST', '/api/sleep/log', { body: data })
            : Promise.resolve(data),

        today: () => useBackend()
            ? http(
                'GET',
                '/api/sleep/user/' +
                encodeURIComponent(requireUserId()) +
                '/today'
            )
            : Promise.resolve([]),

        history: () => useBackend()
            ? http(
                'GET',
                '/api/sleep/user/' +
                encodeURIComponent(requireUserId()) +
                '/history'
            )
            : Promise.resolve([])
    };

    const challenges = {
        list: () => useBackend()
            ? http('GET', '/api/challenges')
            : Promise.resolve([]),

        active: () => useBackend()
            ? http('GET', '/api/challenges/active')
            : Promise.resolve([]),

        join: data => useBackend()
            ? http('POST', '/api/challenges/join', { body: data })
            : Promise.resolve(data)
    };

    /* ======================== RESET DEMO ======================== */

    function resetDemo() {
        if (useBackend()) {
            throw new ApiError(
                'Reset demo is available only in Demo Mode.',
                0,
                'demo_only'
            );
        }

        db.clearAll();
        return { ok: true };
    }

    /* ======================== EXPORT ======================== */

    return {
        config: API_CONFIG,
        http,

        auth,
        user,

        workout,
        posture,
        nutrition,

        checkin,
        equipment,

        progress,
        trainers,

        chatbot,
        membership,

        food,
        diet,
        sleep,
        challenges,

        resetDemo
    };

})();

/* ======================== GLOBAL ACCESS ======================== */

window.API = API;
window.ApiError = ApiError;
window.DemoEngines = DemoEngines;

/* ======================== END OF API.JS ======================== */
