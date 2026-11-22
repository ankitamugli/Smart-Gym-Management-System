/* ==========================================================================
   FORMA – data.js
   ALL sample / demo data lives here, separate from UI logic.

   • Used only as the seed for the demo data layer in api.js.
   • When a backend is connected (API_CONFIG.useBackend = true) none of the
     "seed*" collections below are read – the backend becomes the source.
   • Static reference data (exercise library, chatbot topics, posture guides,
     plan catalogue) would normally also come from the backend; each is
     marked with the endpoint that should replace it.
   • Dates are generated relative to today so the demo never looks stale.
   ========================================================================== */
const DemoData = (() => {
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const offsetDate = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };

  /* ---------------- User (default profile name is "User") ---------------- */
  const user = () => ({
    id: 'usr_demo',
    name: 'User',
    email: 'user@forma.demo',
    memberId: 'FRM-000001',
    phone: '',
    heightCm: 172,
    dateOfBirth: '',
    gender: '',
    joinedOn: offsetDate(-140)
  });

  /* ---------------- 1. Exercise library  (GET /exercises) ---------------- */
  // eq: bodyweight | dumbbells | barbell | machines | cables | kettlebell | bands | bar | cardio
  // muscle: chest back legs glutes shoulders biceps triceps core cardio full
  // kind: compound | isolation | core | cardio | timed
  const E = (id, name, muscle, eq, level, kind, tip) => ({ id, name, muscle, eq, level, kind, tip });
  const exercises = [
    // bodyweight
    E('pushup', 'Push-ups', 'chest', 'bodyweight', 1, 'compound', 'Body in one line from head to heels.'),
    E('incline-pushup', 'Incline push-ups', 'chest', 'bodyweight', 1, 'compound', 'Hands on a bench or step to lower the load.'),
    E('diamond-pushup', 'Diamond push-ups', 'triceps', 'bodyweight', 2, 'compound', 'Elbows track close to your ribs.'),
    E('pike-pushup', 'Pike push-ups', 'shoulders', 'bodyweight', 2, 'compound', 'Hips high, head moves between the hands.'),
    E('bw-squat', 'Bodyweight squats', 'legs', 'bodyweight', 1, 'compound', 'Knees follow the toes; chest tall.'),
    E('reverse-lunge', 'Reverse lunges', 'legs', 'bodyweight', 1, 'compound', 'Step back softly; front knee stays stable.'),
    E('split-squat', 'Bulgarian split squats', 'legs', 'bodyweight', 2, 'compound', 'Rear foot on a bench; lower straight down.'),
    E('jump-squat', 'Jump squats', 'legs', 'bodyweight', 2, 'compound', 'Land softly and reset between reps.'),
    E('glute-bridge', 'Glute bridges', 'glutes', 'bodyweight', 1, 'compound', 'Squeeze at the top for one second.'),
    E('sl-glute-bridge', 'Single-leg glute bridges', 'glutes', 'bodyweight', 2, 'isolation', 'Keep hips level; no twisting.'),
    E('calf-raise-bw', 'Standing calf raises', 'legs', 'bodyweight', 1, 'isolation', 'Pause at the top, slow lowering.'),
    E('wall-sit', 'Wall sit', 'legs', 'bodyweight', 1, 'timed', 'Thighs parallel to the floor.'),
    E('superman', 'Superman holds', 'back', 'bodyweight', 1, 'timed', 'Lift arms and legs together, neck neutral.'),
    E('plank', 'Plank', 'core', 'bodyweight', 1, 'timed', 'Ribs down, glutes tight, breathe steadily.'),
    E('side-plank', 'Side plank', 'core', 'bodyweight', 2, 'timed', 'Hips stacked; do both sides.'),
    E('mountain-climber', 'Mountain climbers', 'core', 'bodyweight', 1, 'timed', 'Hips low, drive knees quickly.'),
    E('dead-bug', 'Dead bug', 'core', 'bodyweight', 1, 'core', 'Lower back stays flat on the floor.'),
    E('bicycle-crunch', 'Bicycle crunches', 'core', 'bodyweight', 1, 'core', 'Slow and controlled; no neck pulling.'),
    E('burpee', 'Burpees', 'full', 'bodyweight', 2, 'cardio', 'Keep a steady pace you can sustain.'),
    E('jumping-jack', 'Jumping jacks', 'cardio', 'bodyweight', 1, 'cardio', 'Easy warm-up or finisher.'),
    // dumbbells
    E('db-bench', 'Dumbbell bench press', 'chest', 'dumbbells', 1, 'compound', 'Wrists stacked over elbows.'),
    E('db-incline', 'Incline dumbbell press', 'chest', 'dumbbells', 2, 'compound', 'Bench at about 30 degrees.'),
    E('db-fly', 'Dumbbell fly', 'chest', 'dumbbells', 2, 'isolation', 'Soft elbows; stretch without strain.'),
    E('db-row', 'One-arm dumbbell row', 'back', 'dumbbells', 1, 'compound', 'Pull the elbow towards your hip.'),
    E('db-shoulder-press', 'Dumbbell shoulder press', 'shoulders', 'dumbbells', 1, 'compound', 'Ribs down; avoid arching the back.'),
    E('lateral-raise', 'Lateral raises', 'shoulders', 'dumbbells', 1, 'isolation', 'Lead with the elbows, stop at shoulder height.'),
    E('db-curl', 'Dumbbell curls', 'biceps', 'dumbbells', 1, 'isolation', 'No swinging; elbows stay at your sides.'),
    E('hammer-curl', 'Hammer curls', 'biceps', 'dumbbells', 1, 'isolation', 'Neutral grip, controlled lowering.'),
    E('db-overhead-ext', 'Overhead triceps extension', 'triceps', 'dumbbells', 1, 'isolation', 'Keep elbows pointing forward.'),
    E('goblet-squat', 'Goblet squat', 'legs', 'dumbbells', 1, 'compound', 'Hold the weight close to your chest.'),
    E('db-rdl', 'Dumbbell Romanian deadlift', 'glutes', 'dumbbells', 2, 'compound', 'Hinge at the hips with a flat back.'),
    E('db-lunge', 'Dumbbell walking lunges', 'legs', 'dumbbells', 2, 'compound', 'Long strides, upright torso.'),
    E('db-hip-thrust', 'Dumbbell hip thrust', 'glutes', 'dumbbells', 1, 'compound', 'Chin tucked, drive through the heels.'),
    E('renegade-row', 'Renegade rows', 'back', 'dumbbells', 3, 'compound', 'Wide feet; keep hips square to the floor.'),
    E('db-thruster', 'Dumbbell thrusters', 'full', 'dumbbells', 3, 'compound', 'Use leg drive to power the press.'),
    // barbell
    E('back-squat', 'Barbell back squat', 'legs', 'barbell', 2, 'compound', 'Brace your core, hit depth you control.'),
    E('front-squat', 'Front squat', 'legs', 'barbell', 3, 'compound', 'Elbows high, torso tall.'),
    E('deadlift', 'Conventional deadlift', 'back', 'barbell', 2, 'compound', 'Bar over mid-foot, flat back, push the floor away.'),
    E('barbell-rdl', 'Barbell Romanian deadlift', 'glutes', 'barbell', 2, 'compound', 'Bar slides along the thighs.'),
    E('bench-press', 'Barbell bench press', 'chest', 'barbell', 2, 'compound', 'Shoulder blades pinched; feet planted.'),
    E('ohp', 'Overhead press', 'shoulders', 'barbell', 2, 'compound', 'Squeeze glutes; press in a straight line.'),
    E('barbell-row', 'Barbell row', 'back', 'barbell', 2, 'compound', 'Hinge forward, pull to the lower ribs.'),
    E('hip-thrust', 'Barbell hip thrust', 'glutes', 'barbell', 2, 'compound', 'Pause at the top without over-arching.'),
    E('close-grip-bench', 'Close-grip bench press', 'triceps', 'barbell', 2, 'compound', 'Hands about shoulder-width apart.'),
    E('barbell-curl', 'Barbell curl', 'biceps', 'barbell', 1, 'isolation', 'Strict form; no leaning back.'),
    // machines
    E('leg-press', 'Leg press', 'legs', 'machines', 1, 'compound', 'Do not lock out your knees.'),
    E('leg-ext', 'Leg extension', 'legs', 'machines', 1, 'isolation', 'Slow lowering, pause at the top.'),
    E('leg-curl', 'Leg curl', 'legs', 'machines', 1, 'isolation', 'Hips stay down on the pad.'),
    E('chest-press-m', 'Chest press machine', 'chest', 'machines', 1, 'compound', 'Adjust the seat so handles meet mid-chest.'),
    E('pec-deck', 'Pec deck', 'chest', 'machines', 1, 'isolation', 'Think about hugging a barrel.'),
    E('lat-pulldown', 'Lat pulldown', 'back', 'machines', 1, 'compound', 'Pull the bar to your upper chest.'),
    E('seated-row', 'Seated row machine', 'back', 'machines', 1, 'compound', 'Chest proud, squeeze shoulder blades.'),
    E('shoulder-press-m', 'Shoulder press machine', 'shoulders', 'machines', 1, 'compound', 'Smooth press, controlled return.'),
    E('calf-raise-m', 'Seated calf raise', 'legs', 'machines', 1, 'isolation', 'Full stretch, full squeeze.'),
    E('hip-abduction', 'Hip abduction machine', 'glutes', 'machines', 1, 'isolation', 'Slow tempo, no momentum.'),
    // cables
    E('cable-row', 'Cable row', 'back', 'cables', 1, 'compound', 'Keep the torso still.'),
    E('face-pull', 'Face pulls', 'shoulders', 'cables', 1, 'isolation', 'Pull to eye level, elbows high.'),
    E('cable-fly', 'Cable fly', 'chest', 'cables', 2, 'isolation', 'Slight forward lean, hands meet in front.'),
    E('pushdown', 'Triceps pushdown', 'triceps', 'cables', 1, 'isolation', 'Pin the elbows to your sides.'),
    E('cable-curl', 'Cable curl', 'biceps', 'cables', 1, 'isolation', 'Constant tension all the way.'),
    E('cable-woodchop', 'Cable woodchop', 'core', 'cables', 2, 'core', 'Rotate through the torso, not the arms.'),
    E('cable-crunch', 'Cable crunch', 'core', 'cables', 2, 'core', 'Curl the ribs to the hips.'),
    E('straight-arm-pd', 'Straight-arm pulldown', 'back', 'cables', 2, 'isolation', 'Arms nearly straight; feel the lats.'),
    // kettlebell
    E('kb-swing', 'Kettlebell swings', 'glutes', 'kettlebell', 2, 'compound', 'Hinge, do not squat; snap the hips.'),
    E('kb-goblet', 'Kettlebell goblet squat', 'legs', 'kettlebell', 1, 'compound', 'Elbows inside the knees at the bottom.'),
    E('kb-halo', 'Kettlebell halo', 'shoulders', 'kettlebell', 1, 'isolation', 'Circle close to your head, ribs down.'),
    E('kb-clean-press', 'Kettlebell clean and press', 'full', 'kettlebell', 3, 'compound', 'Keep the bell close to the body.'),
    E('kb-getup', 'Turkish get-up', 'full', 'kettlebell', 3, 'compound', 'Go slowly; use a light bell first.'),
    // bands
    E('band-pullapart', 'Band pull-aparts', 'shoulders', 'bands', 1, 'isolation', 'Pull the band to your chest.'),
    E('band-row', 'Banded row', 'back', 'bands', 1, 'compound', 'Anchor at chest height.'),
    E('band-press', 'Banded chest press', 'chest', 'bands', 1, 'compound', 'Press forward in a smooth arc.'),
    E('band-walk', 'Banded lateral walks', 'glutes', 'bands', 1, 'isolation', 'Stay low; keep tension on the band.'),
    E('band-squat', 'Banded squats', 'legs', 'bands', 1, 'compound', 'Push the knees out against the band.'),
    E('band-pushdown', 'Banded triceps pushdown', 'triceps', 'bands', 1, 'isolation', 'Elbows locked at your sides.'),
    // pull-up bar
    E('pullup', 'Pull-ups', 'back', 'bar', 3, 'compound', 'Start from a full hang; chest to bar.'),
    E('chinup', 'Chin-ups', 'biceps', 'bar', 2, 'compound', 'Underhand grip, shoulders down.'),
    E('inverted-row', 'Inverted rows', 'back', 'bar', 1, 'compound', 'Body straight; pull chest to the bar.'),
    E('hanging-knee', 'Hanging knee raises', 'core', 'bar', 2, 'core', 'Avoid swinging; curl the pelvis up.'),
    E('hanging-leg', 'Hanging leg raises', 'core', 'bar', 3, 'core', 'Lift with the abs, lower slowly.'),
    // cardio machines
    E('treadmill-int', 'Treadmill intervals', 'cardio', 'cardio', 1, 'cardio', '1 min hard, 1 min easy.'),
    E('incline-walk', 'Incline walk', 'cardio', 'cardio', 1, 'cardio', 'Hold a pace where you can still talk.'),
    E('bike-steady', 'Stationary bike (steady)', 'cardio', 'cardio', 1, 'cardio', 'Moderate resistance, smooth cadence.'),
    E('rower-int', 'Rowing intervals', 'cardio', 'cardio', 2, 'cardio', 'Legs, then hips, then arms.'),
    E('stair-climber', 'Stair climber', 'cardio', 'cardio', 2, 'cardio', 'Stay tall; light grip on the rails.'),
    E('elliptical', 'Elliptical (steady)', 'cardio', 'cardio', 1, 'cardio', 'Low-impact option for sore joints.'),
    E('assault-bike', 'Air bike intervals', 'cardio', 'cardio', 3, 'cardio', '20 s hard, 40 s easy.')
  ];

  const equipmentOptions = [
    { id: 'bodyweight', label: 'Bodyweight', locked: true },
    { id: 'dumbbells', label: 'Dumbbells' },
    { id: 'barbell', label: 'Barbell & rack' },
    { id: 'machines', label: 'Weight machines' },
    { id: 'cables', label: 'Cable station' },
    { id: 'kettlebell', label: 'Kettlebells' },
    { id: 'bands', label: 'Resistance bands' },
    { id: 'bar', label: 'Pull-up bar' },
    { id: 'cardio', label: 'Cardio machines' }
  ];

  /* ---------------- 2. Posture guides  (GET /posture/guides) ---------------- */
  const postureGuides = {
    squats: {
      label: 'Squats', icon: 'dumbbell', camera: 'Place the camera at hip height, about 2 m away, and turn side-on so your full body is visible.',
      cues: [
        { t: 'Feet shoulder-width apart', d: 'Toes turned out slightly (10–30°).' },
        { t: 'Knees track over the toes', d: 'Do not let the knees cave inwards.' },
        { t: 'Chest up, neutral spine', d: 'Look ahead; avoid rounding the lower back.' },
        { t: 'Hips back and down', d: 'Reach at least parallel if your mobility allows.' },
        { t: 'Heels stay flat', d: 'Drive up through mid-foot and heels.' }
      ],
      mistakes: ['Knees collapsing inwards', 'Heels lifting off the floor', 'Lower back rounding at the bottom']
    },
    pushups: {
      label: 'Push-ups', icon: 'dumbbell', camera: 'Camera at floor level, side-on, so shoulders to ankles are in frame.',
      cues: [
        { t: 'Hands just wider than shoulders', d: 'Fingers spread, wrists under shoulders.' },
        { t: 'Body in one straight line', d: 'Head, hips and heels aligned – no sagging.' },
        { t: 'Elbows about 45° from the body', d: 'Avoid flaring them out to 90°.' },
        { t: 'Lower until chest nears the floor', d: 'Full range with control.' },
        { t: 'Press away from the floor', d: 'Keep the core braced on the way up.' }
      ],
      mistakes: ['Hips sagging', 'Head dropping forward', 'Elbows flaring wide']
    },
    lunges: {
      label: 'Lunges', icon: 'dumbbell', camera: 'Camera at knee height, side-on, a step wider than your stride.',
      cues: [
        { t: 'Long enough step', d: 'Front shin stays close to vertical.' },
        { t: 'Front knee over the ankle', d: 'Not collapsing in or out.' },
        { t: 'Torso upright', d: 'Stack shoulders over hips.' },
        { t: 'Back knee lowers straight down', d: 'Tap just above the floor.' },
        { t: 'Push through the front heel', d: 'Return with control, no bouncing.' }
      ],
      mistakes: ['Step too short, knee past toes', 'Leaning forward', 'Wobbling front knee']
    },
    planks: {
      label: 'Planks', icon: 'dumbbell', camera: 'Camera low and side-on so you can see ears, hips and ankles.',
      cues: [
        { t: 'Elbows under shoulders', d: 'Forearms parallel, shoulders pushed away from the floor.' },
        { t: 'Straight line, ear to ankle', d: 'Hips neither piked nor sagging.' },
        { t: 'Glutes and quads tight', d: 'Squeeze to protect the lower back.' },
        { t: 'Neutral neck', d: 'Gaze at the floor just ahead of your hands.' },
        { t: 'Breathe steadily', d: 'Do not hold your breath.' }
      ],
      mistakes: ['Hips sagging', 'Hips too high', 'Holding the breath']
    },
    deadlifts: {
      label: 'Deadlifts', icon: 'dumbbell', camera: 'Camera at mid-thigh height, side-on, 2–3 m away.',
      cues: [
        { t: 'Bar over mid-foot', d: 'Feet hip-width apart.' },
        { t: 'Flat back, chest proud', d: 'Create tension before the bar leaves the floor.' },
        { t: 'Hinge at the hips', d: 'Hips and shoulders rise together.' },
        { t: 'Bar stays against the legs', d: 'It should travel in a straight vertical line.' },
        { t: 'Finish tall', d: 'Squeeze glutes; avoid leaning back.' }
      ],
      mistakes: ['Rounded lower back', 'Bar drifting away from the legs', 'Hips shooting up first']
    }
  };

  /* ---------------- 3. Foods  (GET /foods?search=) ---------------- */
  // Approximate values for demo only.
  const F = (id, name, serving, cal, p, c, f) => ({ id, name, serving, calories: cal, protein: p, carbs: c, fat: f });
  const foods = [
    F('f01', 'Boiled egg', '1 large', 78, 6.3, 0.6, 5.3),
    F('f02', 'Oats with milk', '1 bowl', 210, 9, 32, 5),
    F('f03', 'Banana', '1 medium', 105, 1.3, 27, 0.4),
    F('f04', 'Apple', '1 medium', 95, 0.5, 25, 0.3),
    F('f05', 'Peanut butter toast', '2 slices', 290, 11, 30, 15),
    F('f06', 'Greek yogurt', '1 cup (170 g)', 130, 17, 6, 4),
    F('f07', 'Paneer bhurji', '1 cup', 280, 17, 8, 20),
    F('f08', 'Grilled chicken breast', '100 g', 165, 31, 0, 3.6),
    F('f09', 'Brown rice (cooked)', '1 cup', 215, 5, 45, 1.8),
    F('f10', 'White rice (cooked)', '1 cup', 205, 4.3, 45, 0.4),
    F('f11', 'Chapati / roti', '1 piece', 100, 3, 18, 2.2),
    F('f12', 'Dal (cooked)', '1 cup', 190, 12, 28, 3),
    F('f13', 'Rajma (cooked)', '1 cup', 225, 15, 40, 1),
    F('f14', 'Idli', '2 pieces', 120, 4, 24, 0.6),
    F('f15', 'Plain dosa', '1 piece', 135, 3, 22, 3.5),
    F('f16', 'Upma', '1 cup', 230, 5, 34, 8),
    F('f17', 'Poha', '1 cup', 250, 5, 42, 7),
    F('f18', 'Sambar', '1 cup', 130, 6, 20, 3),
    F('f19', 'Curd', '1 cup', 150, 8, 11, 8),
    F('f20', 'Almonds', '10 pieces', 70, 2.6, 2.5, 6),
    F('f21', 'Whey protein shake', '1 scoop', 120, 24, 3, 1.5),
    F('f22', 'Grilled salmon', '100 g', 208, 22, 0, 13),
    F('f23', 'Mixed vegetable salad', '1 bowl', 80, 3, 12, 2),
    F('f24', 'Chickpea salad', '1 bowl', 260, 12, 38, 6),
    F('f25', 'Sweet potato (boiled)', '1 medium', 112, 2, 26, 0.1),
    F('f26', 'Whole-wheat bread', '2 slices', 160, 8, 28, 2),
    F('f27', 'Milk (toned)', '1 glass (250 ml)', 135, 8, 12, 5),
    F('f28', 'Tofu (firm)', '100 g', 145, 16, 3, 9),
    F('f29', 'Egg omelette', '2 eggs', 190, 13, 1, 14),
    F('f30', 'Protein bar', '1 bar', 200, 20, 20, 7),
    F('f31', 'Orange', '1 medium', 62, 1.2, 15, 0.2),
    F('f32', 'Buttermilk', '1 glass', 40, 3, 5, 1)
  ];

  const nutritionGoals = () => ({ calories: 2200, protein: 130, carbs: 260, fat: 70, waterMl: 2500, cupMl: 250 });

  // Sample meal history: today (breakfast + lunch only) and the previous 6 days.
  const seedMeals = () => {
    const pick = (id, qty = 1) => { const f = foods.find(x => x.id === id); return { foodId: f.id, name: f.name, serving: f.serving, qty, calories: f.calories * qty, protein: f.protein * qty, carbs: f.carbs * qty, fat: f.fat * qty }; };
    const plan = [
      [0, 'breakfast', [['f02'], ['f03'], ['f01', 2]]],
      [0, 'lunch', [['f08', 1.5], ['f09'], ['f23']]],
      [1, 'breakfast', [['f14'], ['f18'], ['f31']]], [1, 'lunch', [['f12'], ['f11', 3], ['f19']]], [1, 'dinner', [['f07'], ['f11', 2], ['f23']]], [1, 'snacks', [['f20'], ['f04']]],
      [2, 'breakfast', [['f29'], ['f26'], ['f27']]], [2, 'lunch', [['f08', 1.5], ['f10'], ['f23']]], [2, 'dinner', [['f13'], ['f09'], ['f19']]],
      [3, 'breakfast', [['f17'], ['f01', 2]]], [3, 'lunch', [['f12'], ['f09', 1.5], ['f32']]], [3, 'dinner', [['f22', 1.5], ['f25'], ['f23']]], [3, 'snacks', [['f21']]],
      [4, 'breakfast', [['f02'], ['f04']]], [4, 'lunch', [['f24'], ['f11', 2]]], [4, 'dinner', [['f28', 2], ['f09'], ['f23']]],
      [5, 'breakfast', [['f16'], ['f27']]], [5, 'lunch', [['f08', 1.5], ['f09', 1.5], ['f23']]], [5, 'dinner', [['f07'], ['f11', 3]]], [5, 'snacks', [['f30']]],
      [6, 'breakfast', [['f15', 2], ['f18']]], [6, 'lunch', [['f13'], ['f10'], ['f19']]], [6, 'dinner', [['f08', 1.5], ['f25'], ['f23']]]
    ];
    return plan.map(([back, type, items], i) => ({ id: 'meal_seed_' + i, date: offsetDate(-back), type, items: items.map(([id, q]) => pick(id, q || 1)), createdAt: new Date().toISOString() }));
  };
  const seedWater = () => [{ date: today(), cups: 3 }];

  /* ---------------- 4. Check-ins  (GET /checkins) ---------------- */
  const seedCheckins = () => {
    const out = [];
    [-1, -2, -4, -5, -7, -8, -10, -12, -14, -15, -17, -19].forEach((n, i) => {
      out.push({ id: 'chk_seed_' + i, date: offsetDate(n), time: ['06:42', '18:10', '07:05', '17:55', '06:30', '19:20'][i % 6], method: i % 3 === 0 ? 'scan' : 'qr', branch: 'FORMA Central', status: 'demo-recorded' });
    });
    return out;
  };

  /* ---------------- 5. Equipment  (GET /equipment) ---------------- */
  const Q = (id, name, category, type, zone, status, wait) => ({ id, name, category, type, zone, status, waitMinutes: wait || 0, updatedAt: new Date().toISOString() });
  const equipmentCategories = ['Cardio', 'Free weights', 'Strength machines', 'Functional'];
  const seedEquipment = () => [
    Q('eq01', 'Treadmill 1', 'Cardio', 'treadmill', 'Cardio floor', 'available'),
    Q('eq02', 'Treadmill 2', 'Cardio', 'treadmill', 'Cardio floor', 'occupied', 12),
    Q('eq03', 'Treadmill 3', 'Cardio', 'treadmill', 'Cardio floor', 'occupied', 6),
    Q('eq04', 'Treadmill 4', 'Cardio', 'treadmill', 'Cardio floor', 'maintenance'),
    Q('eq05', 'Spin bike 1', 'Cardio', 'bike', 'Cardio floor', 'available'),
    Q('eq06', 'Spin bike 2', 'Cardio', 'bike', 'Cardio floor', 'available'),
    Q('eq07', 'Elliptical 1', 'Cardio', 'elliptical', 'Cardio floor', 'occupied', 9),
    Q('eq08', 'Rowing machine', 'Cardio', 'rower', 'Cardio floor', 'available'),
    Q('eq09', 'Stair climber', 'Cardio', 'stairs', 'Cardio floor', 'occupied', 14),
    Q('eq10', 'Dumbbell rack (2–30 kg)', 'Free weights', 'dumbbell', 'Free weight area', 'available'),
    Q('eq11', 'Olympic bar station 1', 'Free weights', 'barbell', 'Free weight area', 'occupied', 15),
    Q('eq12', 'Olympic bar station 2', 'Free weights', 'barbell', 'Free weight area', 'available'),
    Q('eq13', 'Flat bench 1', 'Free weights', 'bench', 'Free weight area', 'available'),
    Q('eq14', 'Adjustable bench 2', 'Free weights', 'bench', 'Free weight area', 'occupied', 8),
    Q('eq15', 'Squat rack 1', 'Free weights', 'rack', 'Free weight area', 'occupied', 20),
    Q('eq16', 'Squat rack 2', 'Free weights', 'rack', 'Free weight area', 'maintenance'),
    Q('eq17', 'Kettlebell set', 'Free weights', 'kettlebell', 'Free weight area', 'available'),
    Q('eq18', 'Leg press', 'Strength machines', 'legpress', 'Machine zone', 'occupied', 10),
    Q('eq19', 'Cable crossover', 'Strength machines', 'cable', 'Machine zone', 'available'),
    Q('eq20', 'Lat pulldown', 'Strength machines', 'cable', 'Machine zone', 'available'),
    Q('eq21', 'Chest press machine', 'Strength machines', 'cable', 'Machine zone', 'occupied', 5),
    Q('eq22', 'Pull-up station', 'Functional', 'pullup', 'Functional zone', 'available'),
    Q('eq23', 'Heavy bag', 'Functional', 'bag', 'Functional zone', 'available'),
    Q('eq24', 'Battle ropes', 'Functional', 'rope', 'Functional zone', 'available'),
    Q('eq25', 'Stretching mats', 'Functional', 'mat', 'Functional zone', 'available')
  ];

  /* ---------------- 6. Progress  (GET /body-metrics, /workouts, /goals) ---------------- */
  const seedBodyMetrics = () => {
    const w = [78.4, 78.0, 77.7, 77.1, 77.0, 76.5, 76.3, 75.9, 75.6, 75.4, 75.0, 74.8];
    return w.map((kg, i) => ({ id: 'bm_seed_' + i, date: offsetDate(-(w.length - 1 - i) * 7), weightKg: kg, bodyFatPct: +(23.5 - i * 0.28).toFixed(1) }));
  };
  const seedWorkouts = () => {
    const types = [['Upper body strength', 55, 340], ['Lower body strength', 60, 410], ['HIIT cardio', 35, 380], ['Full body', 50, 360], ['Core and mobility', 30, 150], ['Steady cardio', 45, 330]];
    const out = [];
    let id = 0;
    for (let week = 7; week >= 0; week--) {
      [1, 3, 5, 6].forEach((dayOff, k) => {
        if (week === 0 && dayOff > 3) return;
        const t = types[(week + k) % types.length];
        out.push({ id: 'wk_seed_' + (id++), date: offsetDate(-(week * 7) - 6 + dayOff), type: t[0], durationMin: t[1] + ((week + k) % 3) * 5, calories: t[2] + ((week * 7 + k) % 5) * 12, notes: '' });
      });
    }
    return out.filter(x => x.date <= today());
  };
  const seedGoal = () => ({ type: 'weight_loss', startWeightKg: 78.4, targetWeightKg: 70, targetDate: offsetDate(110), weeklyWorkouts: 4 });

  /* ---------------- 7. Trainers  (GET /trainers) ---------------- */
  const T = (id, name, spec, exp, rating, reviews, price, days, langs, gender, bio, certs, slots) => ({ id, name, specializations: spec, experienceYears: exp, rating, reviewCount: reviews, pricePerSession: price, availableDays: days, languages: langs, gender, bio, certifications: certs, slots, photo: `assets/images/trainers/${id}.svg` });
  const morning = ['06:00', '07:00', '08:00', '09:00'];
  const evening = ['17:00', '18:00', '19:00', '20:00'];
  const trainers = [
    T('tr01', 'Aarav Mehta', ['Strength', 'Muscle gain'], 9, 4.9, 212, 900, ['Mon', 'Tue', 'Thu', 'Fri'], ['English', 'Hindi'], 'Male', 'Strength coach focused on safe progressive overload and clean technique for lifters of every level.', ['NSCA-CSCS', 'First Aid & CPR'], morning.concat(evening)),
    T('tr02', 'Priya Nair', ['Weight loss', 'Nutrition'], 7, 4.8, 187, 800, ['Mon', 'Wed', 'Fri', 'Sat'], ['English', 'Malayalam', 'Hindi'], 'Female', 'Helps members build sustainable fat-loss habits with simple training and practical meal planning.', ['ACE-CPT', 'Precision Nutrition L1'], morning.concat(['18:00', '19:00'])),
    T('tr03', 'Rohan Shetty', ['HIIT', 'Fat burn'], 6, 4.7, 154, 750, ['Tue', 'Thu', 'Sat', 'Sun'], ['English', 'Kannada', 'Tulu'], 'Male', 'High-energy interval and circuit sessions that fit into a busy week.', ['ACSM-CPT'], ['06:00', '07:00', '17:00', '18:00', '19:00']),
    T('tr04', 'Ananya Rao', ['Yoga', 'Mobility', 'Recovery'], 10, 4.9, 301, 700, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ['English', 'Kannada'], 'Female', 'Combines yoga, mobility work and breathing for flexibility, posture and injury recovery.', ['RYT-500', 'Corrective Exercise Specialist'], ['06:00', '07:00', '08:00', '18:00', '19:00']),
    T('tr05', 'Vikram Singh', ['Powerlifting', 'Strength'], 12, 4.8, 129, 1100, ['Mon', 'Wed', 'Fri', 'Sat'], ['English', 'Hindi', 'Punjabi'], 'Male', 'Competitive powerlifter coaching the squat, bench and deadlift for strength athletes.', ['IPF Coach L2', 'NSCA-CPT'], ['07:00', '08:00', '17:00', '18:00', '19:00', '20:00']),
    T('tr06', 'Sneha Kulkarni', ['Functional training', 'Beginners'], 5, 4.6, 98, 650, ['Tue', 'Wed', 'Thu', 'Sat'], ['English', 'Marathi', 'Hindi'], 'Female', 'Patient, beginner-friendly coaching that builds confidence on the gym floor.', ['ACE-CPT'], morning.concat(['17:00', '18:00'])),
    T('tr07', 'Karthik Gowda', ['Muscle gain', 'Bodybuilding'], 8, 4.7, 143, 950, ['Mon', 'Tue', 'Thu', 'Fri', 'Sat'], ['English', 'Kannada', 'Telugu'], 'Male', 'Hypertrophy programming, posing basics and contest prep guidance.', ['ISSA-CPT', 'Sports Nutrition Coach'], ['06:00', '07:00', '18:00', '19:00', '20:00']),
    T('tr08', 'Meera Joshi', ['Rehab', 'Senior fitness', 'Mobility'], 11, 4.9, 176, 850, ['Mon', 'Wed', 'Fri'], ['English', 'Hindi', 'Gujarati'], 'Female', 'Physio-informed training for people returning from injury or starting gently after a long break.', ['BPT', 'Corrective Exercise Specialist'], ['08:00', '09:00', '10:00', '16:00', '17:00'])
  ];
  const trainerSpecializations = ['Strength', 'Muscle gain', 'Weight loss', 'Nutrition', 'HIIT', 'Fat burn', 'Yoga', 'Mobility', 'Recovery', 'Powerlifting', 'Functional training', 'Beginners', 'Bodybuilding', 'Rehab', 'Senior fitness'];

  /* ---------------- 8. Chatbot topics  (POST /chatbot/messages) ---------------- */
  // Demo replies only. Replace the whole "topics" list with a real AI call.
  const chatSuggestions = {
    Workouts: ['How many days a week should I train?', 'How do I start strength training?', 'What is progressive overload?'],
    Nutrition: ['How much protein do I need?', 'What should I eat before a workout?', 'Tips for a calorie deficit'],
    Fitness: ['How do I stay consistent?', 'How long until I see results?', 'How do I improve my cardio?'],
    Recovery: ['How much sleep do I need?', 'How do I reduce muscle soreness?', 'Do I need rest days?']
  };
  const chatTopics = [
    { id: 'greeting', keywords: ['hello', 'hi', 'hey', 'good morning', 'good evening'], answer: 'Hi! I am the FORMA demo coach. Ask me about workouts, nutrition, fitness habits or recovery.' },
    { id: 'frequency', keywords: ['how many days', 'days a week', 'how often', 'frequency'], answer: 'Most people do well with:\n- Beginners: 3 full-body sessions per week\n- Intermediate: 4 sessions (upper/lower split)\n- Advanced: 4–6 sessions, depending on recovery\nQuality and consistency matter more than the exact number.' },
    { id: 'start-strength', keywords: ['start strength', 'begin strength', 'start lifting', 'beginner'], answer: 'Starting strength training:\n- Learn 5 patterns: squat, hinge, push, pull, carry\n- Use a light weight and focus on form\n- Do 2–3 sets of 8–12 reps\n- Add weight or reps gradually each week\nBook a trainer session if you want technique feedback.' },
    { id: 'overload', keywords: ['progressive overload', 'overload', 'progress strength', 'plateau'], answer: 'Progressive overload means gradually asking your muscles to do a bit more over time:\n- Add 1–2 reps per set\n- Add a small amount of weight\n- Add a set\n- Slow down the lowering phase\nChange one variable at a time and track it in your workout log.' },
    { id: 'protein', keywords: ['protein', 'how much protein'], answer: 'A common range for active adults is about 1.4–2.0 g of protein per kg of body weight per day, spread across meals. Good sources: eggs, dal, paneer, curd, chicken, fish, tofu and whey. Ask your doctor or a dietitian if you have kidney or medical conditions.' },
    { id: 'pre-workout', keywords: ['before a workout', 'pre workout', 'pre-workout', 'eat before'], answer: 'Pre-workout ideas (1–2 hours before):\n- Banana with peanut butter\n- Oats with milk\n- Idli with sambar\n- Toast with egg\nKeep fat and fibre moderate so you feel light. Sip water through the session.' },
    { id: 'deficit', keywords: ['calorie deficit', 'lose weight', 'weight loss', 'fat loss', 'burn fat'], answer: 'A gentle deficit works best:\n- Aim to eat roughly 300–500 kcal below maintenance\n- Keep protein high to protect muscle\n- Lift 3+ times a week and walk daily\n- Expect about 0.25–0.75 kg per week\nCrash diets usually backfire.' },
    { id: 'consistency', keywords: ['consistent', 'consistency', 'motivation', 'stay motivated', 'habit'], answer: 'Staying consistent:\n- Schedule workouts like appointments\n- Start with sessions so short they feel easy\n- Track attendance and celebrate streaks\n- Train with a friend or trainer\nMissing a day is fine – just do not miss twice.' },
    { id: 'results', keywords: ['how long', 'see results', 'results'], answer: 'Typical timelines with steady training and nutrition: energy and mood often improve in 2–3 weeks, strength gains in 3–6 weeks, and visible body changes in 8–12 weeks. Progress is rarely linear.' },
    { id: 'cardio', keywords: ['cardio', 'endurance', 'stamina', 'improve my cardio'], answer: 'To improve cardio:\n- 2–3 easy sessions of 20–45 min per week\n- 1 interval session (e.g. 6 × 1 min hard / 1 min easy)\n- Increase total time by about 10% a week\nUse the talk test: easy runs should still let you speak in sentences.' },
    { id: 'sleep', keywords: ['sleep', 'how much sleep'], answer: 'Most adults need 7–9 hours of sleep. Keep a regular schedule, dim screens an hour before bed and avoid caffeine late in the day. Poor sleep reduces recovery, strength and appetite control.' },
    { id: 'soreness', keywords: ['sore', 'soreness', 'doms', 'muscle pain'], answer: 'To ease muscle soreness:\n- Light movement such as walking or cycling\n- Hydration and enough protein\n- Gentle mobility and stretching\n- Sleep\nSharp, one-sided or joint pain is different – stop and see a clinician.' },
    { id: 'rest', keywords: ['rest day', 'rest days', 'recovery', 'overtraining'], answer: 'Rest days are when you adapt. Aim for at least 1–2 per week, and take a lighter week every 4–8 weeks. Signs you need more rest: lingering fatigue, poor sleep, falling performance and low mood.' },
    { id: 'water', keywords: ['water', 'hydration', 'hydrate'], answer: 'A good starting point is about 30–35 ml of water per kg of body weight a day, plus more when you sweat. Pale-yellow urine is a handy indicator. Use the water tracker on the Nutrition page.' },
    { id: 'warmup', keywords: ['warm up', 'warm-up', 'warmup', 'stretch'], answer: 'A simple 5–8 minute warm-up: easy cardio, then dynamic moves (leg swings, arm circles, hip hinges, bodyweight squats), then 1–2 light sets of your first exercise.' }
  ];
  const chatFallback = 'I am only a demo bot that matches keywords, so I might have missed that. Try asking about workouts, protein, weight loss, sleep, soreness or consistency. A real AI model can be connected through the chatbot API in api.js.';

  /* ---------------- 9. Membership  (GET /membership/plans etc.) ---------------- */
  const membershipPlans = [
    { id: 'basic', name: 'Basic', monthlyPrice: 999, tagline: 'Everything you need to get started', features: ['Gym floor access 6 am – 10 pm', 'Locker room access', 'QR check-in', 'Equipment availability view', 'FORMA workout planner'], featured: false },
    { id: 'pro', name: 'Pro', monthlyPrice: 1799, tagline: 'Most popular for regular members', features: ['24 × 7 gym access', 'Group classes (6 per month)', 'Nutrition tracker and reports', 'AI fitness chatbot', 'Progress predictor', '1 free trainer consultation'], featured: true },
    { id: 'elite', name: 'Elite', monthlyPrice: 2999, tagline: 'Coaching, recovery and perks', features: ['Everything in Pro', 'Unlimited group classes', '2 trainer sessions per month', 'Recovery zone and sauna', 'Guest pass (2 per month)', 'Priority equipment booking'], featured: false }
  ];
  const billingCycles = [
    { id: 'monthly', label: 'Monthly', months: 1, discount: 0 },
    { id: 'quarterly', label: 'Quarterly', months: 3, discount: 0.1 },
    { id: 'yearly', label: 'Yearly', months: 12, discount: 0.2 }
  ];
  const seedMembership = () => ({
    planId: 'pro', cycle: 'monthly', status: 'active',
    startDate: offsetDate(-18), expiryDate: offsetDate(12),
    autoRenew: true, reminderDaysBefore: 3, renewalCycle: 'monthly',
    paymentMethod: { brand: 'Visa', last4: '4242', holder: 'User' }
  });
  const seedMembershipHistory = () => [
    { id: 'mh_3', date: offsetDate(-18), description: 'Pro plan – monthly renewal', amount: 1799, status: 'paid (demo)', planId: 'pro' },
    { id: 'mh_2', date: offsetDate(-48), description: 'Pro plan – monthly renewal', amount: 1799, status: 'paid (demo)', planId: 'pro' },
    { id: 'mh_1', date: offsetDate(-78), description: 'Pro plan – first purchase', amount: 1799, status: 'paid (demo)', planId: 'pro' },
    { id: 'mh_0', date: offsetDate(-140), description: 'Basic plan – joining month', amount: 999, status: 'paid (demo)', planId: 'basic' }
  ];

  return {
    iso, today, offsetDate,
    user, exercises, equipmentOptions, postureGuides,
    foods, nutritionGoals, seedMeals, seedWater, seedCheckins,
    equipmentCategories, seedEquipment,
    seedBodyMetrics, seedWorkouts, seedGoal,
    trainers, trainerSpecializations,
    chatSuggestions, chatTopics, chatFallback,
    membershipPlans, billingCycles, seedMembership, seedMembershipHistory
  };
})();
