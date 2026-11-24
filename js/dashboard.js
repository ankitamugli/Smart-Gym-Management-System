
/* ==========================================================================
   FORMA - dashboard.js
   Dashboard with safe backend API loading
   ========================================================================== */

Page.ready(async function () {

    // ---------- Basic elements ----------
    const get = id => document.getElementById(id);

    // ---------- Greeting ----------
    const session = API.auth.session();
    const userName = session?.user?.name || 'Member';

    const hour = new Date().getHours();
    const part = hour < 12
        ? 'Good morning'
        : hour < 17
            ? 'Good afternoon'
            : 'Good evening';

    get('greeting').textContent = `${part}, ${userName}`;

    get('todayDate').textContent = fmtDate(todayISO(), {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
    });

    document.addEventListener('forma:profile', event => {
        get('greeting').textContent =
            `${part}, ${event.detail?.name || 'Member'}`;
    });

    // ---------- Quick links ----------
    get('quickLinks').innerHTML = NAV
        .flatMap(group => group.items)
        .filter(item => item.id !== 'dashboard')
        .map(item => `
            <a class="quick-link" href="${item.href}">
                ${Icons.svg(item.icon)}
                <span>${esc(item.label)}</span>
            </a>
        `)
        .join('');

    // ---------- API helper ----------
    function unwrap(response) {
        if (
            response &&
            Object.prototype.hasOwnProperty.call(response, 'data')
        ) {
            return response.data;
        }

        return response;
    }

    async function safeLoad(apiCall, fallback, name) {
        try {
            const response = await apiCall;
            const result = unwrap(response);

            return result ?? fallback;

        } catch (error) {
            console.error(`Dashboard ${name} error:`, error);
            return fallback;
        }
    }

    function toArray(value) {
        return Array.isArray(value) ? value : [];
    }

    // ---------- Load all dashboard data ----------
    const today = todayISO();

    const [
        workouts,
        metrics,
        goal,
        meals,
        goals,
        water,
        checkins,
        membership,
        equipment,
        bookings,
        trainers
    ] = await Promise.all([

        safeLoad(API.progress.workouts(), [], 'Workouts'),

        safeLoad(API.progress.metrics(), [], 'Metrics'),

        safeLoad(API.progress.goal(), {
            weeklyWorkouts: 3,
            targetWeightKg: 65
        }, 'Workout goal'),

        safeLoad(API.nutrition.meals({ date: today }), [], 'Meals'),

        safeLoad(API.nutrition.goals(), {
            calories: 2000,
            waterMl: 2000,
            cupMl: 250
        }, 'Nutrition goals'),

        safeLoad(API.nutrition.water(), [], 'Water'),

        safeLoad(API.checkin.list(), [], 'Check-ins'),

        safeLoad(API.membership.current(), null, 'Membership'),

        safeLoad(API.equipment.list(), [], 'Equipment'),

        safeLoad(API.trainers.bookings(), [], 'Trainer bookings'),

        safeLoad(API.trainers.list(), [], 'Trainers')
    ]);

    // ---------- Normalize response data ----------
    const workoutList = toArray(workouts);
    const metricList = toArray(metrics);
    const mealList = toArray(meals);
    const waterList = toArray(water);
    const checkinList = toArray(checkins);
    const equipmentList = toArray(equipment);
    const bookingList = toArray(bookings);
    const trainerList = toArray(trainers);

    const weeklyGoal = Number(goal?.weeklyWorkouts) || 3;
    const targetWeight = Number(goal?.targetWeightKg) || 65;

    const calorieGoal = Number(goals?.calories) || 2000;
    const waterGoal = Number(goals?.waterMl) || 2000;
    const cupSize = Number(goals?.cupMl) || 250;

    // ---------- Date calculations ----------
    const monday = (() => {
        const date = new Date();

        date.setHours(12, 0, 0, 0);

        date.setDate(
            date.getDate() - ((date.getDay() + 6) % 7)
        );

        return DemoData.iso(date);
    })();

    const thisWeek = workoutList.filter(workout =>
        workout.date >= monday && workout.date <= today
    );

    const month = today.slice(0, 7);

    const monthCheckins = checkinList.filter(checkin =>
        checkin.date && checkin.date.startsWith(month)
    ).length;

    // ---------- Membership ----------
    const daysLeft = membership?.expiryDate
        ? daysBetween(today, membership.expiryDate)
        : null;

    // ---------- Calories ----------
    const eaten = Math.round(
        mealList.reduce((total, meal) => {
            const items = toArray(meal.items);

            return total + items.reduce(
                (sum, item) => sum + (Number(item.calories) || 0),
                0
            );
        }, 0)
    );

    // ---------- Water ----------
    const todayWater = waterList.find(item =>
        item.date === today
    );

    const cups = Number(todayWater?.cups) || 0;

    const cupsGoal = Math.max(
        1,
        Math.round(waterGoal / cupSize)
    );

    // ---------- Latest weight ----------
    const sortedMetrics = metricList
        .filter(item => item.date)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date));

    const latest = sortedMetrics[sortedMetrics.length - 1];

    // ---------- Statistics cards ----------
    const stat = (icon, tone, number, label) => `
        <div class="card">
            <div class="stat">
                <div class="stat-ico ${tone}">
                    ${Icons.svg(icon)}
                </div>

                <div>
                    <div class="num">${number}</div>
                    <div class="lbl">${label}</div>
                </div>
            </div>
        </div>
    `;

    const membershipValue = daysLeft === null
        ? 'No plan'
        : daysLeft >= 0
            ? daysLeft
            : 'Expired';

    get('statCards').innerHTML =

        stat(
            'dumbbell',
            '',
            `${thisWeek.length}<small style="font-size:1rem;color:var(--muted)"> / ${weeklyGoal}</small>`,
            'Workouts this week'
        ) +

        stat(
            'calendar',
            'teal',
            monthCheckins,
            'Gym visits this month'
        ) +

        stat(
            'scale',
            'blue',
            latest ? `${latest.weightKg} kg` : '–',
            latest
                ? `Latest weight · ${fmtShort(latest.date)}`
                : 'No weight logged'
        ) +

        stat(
            'membership',
            'amber',
            membershipValue,
            daysLeft === null
                ? 'No active membership'
                : daysLeft >= 0
                    ? 'Days left on membership'
                    : 'Renew your membership'
        );

    // ---------- Hero message ----------
    const lastVisit = checkinList
        .filter(item => item.date)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))[0];

    if (thisWeek.length >= weeklyGoal) {

        get('heroLine').textContent =
            `You have hit your weekly target of ${weeklyGoal} workouts. Nice work - keep recovery in mind.`;

    } else {

        const remaining = weeklyGoal - thisWeek.length;

        get('heroLine').textContent =
            `${remaining} more workout${remaining === 1 ? '' : 's'} to reach this week's target.` +
            (
                lastVisit
                    ? ` Last gym visit: ${fmtDate(lastVisit.date, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short'
                    })}.`
                    : ''
            );
    }

    // ---------- Calories ring ----------
    Charts.ring(get('calRing'), {
        value: eaten,
        max: calorieGoal,
        label: eaten.toLocaleString('en-IN'),
        sub: `of ${calorieGoal.toLocaleString('en-IN')} kcal`,
        color: getComputedStyle(document.documentElement)
            .getPropertyValue('--primary')
            .trim()
    });

    // ---------- Water ring ----------
    Charts.ring(get('waterRing'), {
        value: cups,
        max: cupsGoal,
        label: `${cups}/${cupsGoal}`,
        sub: 'cups of water',
        color: getComputedStyle(document.documentElement)
            .getPropertyValue('--info')
            .trim()
    });

    // ---------- Weekly workout chart ----------
    const weeks = [];

    const base = new Date(monday + 'T12:00:00');

    for (let i = 7; i >= 0; i--) {

        const date = new Date(base);

        date.setDate(date.getDate() - i * 7);

        weeks.push(DemoData.iso(date));
    }

    const minutes = weeks.map(week => {

        const end = DemoData.iso(
            new Date(
                new Date(week + 'T12:00:00').getTime() +
                6 * 86400000
            )
        );

        return workoutList
            .filter(workout =>
                workout.date >= week && workout.date <= end
            )
            .reduce(
                (sum, workout) =>
                    sum + (Number(workout.durationMin) || 0),
                0
            );
    });

    Charts.bar(get('weeklyChart'), {
        labels: weeks.map(fmtShort),

        datasets: [{
            label: 'Minutes',
            data: minutes
        }],

        unit: ''
    });

    // ---------- Weight chart ----------
    Charts.line(get('weightChart'), {

        labels: sortedMetrics.map(item =>
            fmtShort(item.date)
        ),

        datasets: [
            {
                label: 'Weight (kg)',
                data: sortedMetrics.map(item =>
                    Number(item.weightKg) || 0
                ),
                fill: true
            },

            {
                label: 'Goal',
                data: sortedMetrics.map(() => targetWeight),
                dashed: true,
                color: getComputedStyle(document.documentElement)
                    .getPropertyValue('--teal')
                    .trim()
            }
        ],

        unit: ''
    });

    // ---------- Equipment summary ----------
    const count = status =>
        equipmentList.filter(item =>
            String(item.status || '').toLowerCase() === status
        ).length;

    const equipmentRows = [
        ['Available', 'available', 'green'],
        ['Occupied', 'occupied', 'amber'],
        ['Under maintenance', 'maintenance', 'over']
    ];

    get('equipSummary').innerHTML = equipmentRows
        .map(([label, key, tone]) => `
            <div class="meter-row">

                <div class="top">
                    <span>${label}</span>
                    <b>${count(key)} / ${equipmentList.length}</b>
                </div>

                <div class="progress ${tone}">
                    <span style="width:${
                        equipmentList.length
                            ? count(key) / equipmentList.length * 100
                            : 0
                    }%"></span>
                </div>

            </div>
        `)
        .join('');

    if (API.config.useBackend) {
        get('liveDot').textContent = 'Live';
    }

    // ---------- Recent workouts ----------
    const recent = workoutList
        .filter(item => item.date)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);

    get('recentWorkouts').innerHTML = recent.length

        ? recent.map(workout => `
            <li>

                <span>
                    <b>${esc(workout.type || 'Workout')}</b><br>

                    <span class="muted small">
                        ${fmtDate(workout.date, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                        })}
                    </span>
                </span>

                <span class="badge orange">
                    ${Number(workout.durationMin) || 0} min
                </span>

            </li>
        `).join('')

        : UI.empty({
            icon: 'dumbbell',
            title: 'No workouts yet',
            text: 'Log a session on the Progress page.',
            action: '<a class="btn sm" href="pages/progress-predictor.html">Log workout</a>'
        });

    // ---------- Upcoming trainer sessions ----------
    const upcoming = bookingList
        .filter(booking =>
            booking.date >= today &&
            String(booking.status || '').toLowerCase() !== 'cancelled'
        )
        .slice()
        .sort((a, b) =>
            (a.date + (a.time || '')).localeCompare(
                b.date + (b.time || '')
            )
        )
        .slice(0, 3);

    get('upcomingSessions').innerHTML = upcoming.length

        ? '<ul class="list-plain">' +

            upcoming.map(booking => {

                const trainer = trainerList.find(item =>
                    String(item.id) === String(booking.trainerId)
                );

                return `
                    <li>

                        <span>
                            <b>${esc(trainer?.name || 'Trainer')}</b><br>

                            <span class="muted small">
                                ${fmtDate(booking.date, {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                })}
                                · ${esc(booking.time || '')}
                            </span>
                        </span>

                        ${UI.badge('Requested', 'blue')}

                    </li>
                `;
            }).join('') +

          '</ul>'

        : UI.empty({
            icon: 'trainers',
            title: 'No sessions booked',
            text: 'Find a trainer that fits your goals.',
            action: '<a class="btn sm" href="pages/trainers.html">Browse trainers</a>'
        });

    console.log('FORMA Dashboard loaded successfully.');

});
