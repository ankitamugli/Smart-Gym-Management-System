# FORMA – Backend Integration Guide

This guide is for the developer who will build a backend for the FORMA frontend. The frontend ships **without** a backend. Nothing here exists yet. These are *suggested* endpoints and shapes that match what the frontend already sends and expects.

---

## 1. How the frontend is wired

```
HTML page ─► page script (e.g. js/nutrition.js) ─► API.nutrition.meals()  ─┬─► demo: localStorage (js/storage.js + js/data.js)
                                                                            └─► backend: fetch(baseUrl + '/meals')   (js/api.js)
```

- **`js/config.js`** holds the base URL and the demo/backend switch.
- **`js/api.js`** is the only file page scripts use for data. Every function returns a Promise and has two branches selected by `FORMA_CONFIG.useBackend`.
- **`js/data.js`** holds all sample data. Page scripts never contain data.
- **`js/storage.js`** is used only by the demo branch.

### Switching to your backend

```js
// js/config.js
window.FORMA_CONFIG = {
  baseUrl: 'https://api.example.com/api/v1',  // no trailing slash
  useBackend: true,
  timeoutMs: 15000,
  authMode: 'bearer',          // 'bearer' = Authorization header, 'cookie' = credentials:'include'
  equipmentPollMs: 10000,
  currency: '₹',
  branchName: 'FORMA Central'
};
```

The `fetch()` branches in `api.js` are untested against a live server. Treat them as a starting point: run each page, watch the Network tab and adjust field names or paths to match your API.

### Conventions the frontend expects

| Topic | Convention |
|-------|-----------|
| Format | JSON request and response bodies, `Content-Type: application/json` |
| Dates | `YYYY-MM-DD` for dates, `HH:MM` (24 h) for times, ISO-8601 for timestamps |
| IDs | strings |
| Success | HTTP 2xx with the JSON shown below. `DELETE` returns `{ "ok": true }` |
| Errors | HTTP 4xx/5xx with `{ "error": { "code": "invalid_token", "message": "Human-readable text" } }`. The `message` is shown to the user in a toast |
| Update | `PATCH` with the changed fields, returns the full updated object |
| CORS | Allow the frontend origin, methods `GET, POST, PUT, PATCH, DELETE`, headers `Authorization, Content-Type` |

---

## 2. Authentication integration points

| Where | Function | Endpoint |
|-------|----------|----------|
| `pages/login.html` → `js/auth.js` | `API.auth.login` | `POST /auth/login` |
| `pages/register.html` → `js/auth.js` | `API.auth.register` | `POST /auth/register` |
| account menu → `js/app.js` | `API.auth.logout` | `POST /auth/logout` |
| profile modal → `js/app.js` | `API.user.get / update` | `GET /users/me`, `PATCH /users/me` |
| every protected page → `js/app.js` boot | `API.auth.hasSession()` | local check only |

```jsonc
// POST /auth/login
{ "email": "user@example.com", "password": "••••••••" }
// 200
{ "token": "eyJ...", "user": { "id": "usr_1", "name": "User", "email": "user@example.com", "memberId": "FRM-000001" } }

// POST /auth/register
{ "name": "User", "email": "user@example.com", "password": "...", "phone": "9876543210" }
// 201  same shape as login
```

**Token handling.** `api.js` stores `{ token, user }` under the `session` key in localStorage and sends `Authorization: Bearer <token>` when `authMode` is `'bearer'`. For better security prefer `authMode: 'cookie'` with an `HttpOnly; Secure; SameSite` cookie set by your server (the frontend then sends `credentials: 'include'`), because tokens in localStorage can be read by injected scripts.

**To do on your side:** return `401` for missing or expired sessions. Extend `http()` in `api.js` to redirect to `pages/login.html` on `401` (a three-line change), add a refresh-token flow if you use one, hash passwords (argon2/bcrypt), rate-limit login, and enforce password rules on the server (the frontend rules are only hints).

---

## 3. Replacing localStorage with API calls

For most features there is **nothing to change in page code**. Set `useBackend: true` and implement the endpoint. The generic collection helper in `api.js` maps as follows:

| Function | HTTP |
|----------|------|
| `list(params)` | `GET {endpoint}?param=value` |
| `create(item)` | `POST {endpoint}` |
| `update(id, patch)` | `PATCH {endpoint}/{id}` |
| `remove(id)` | `DELETE {endpoint}/{id}` |

Things the backend must take over (the demo does them in the browser):

- **IDs and timestamps** (`id`, `createdAt`, `updatedAt`) are created by the server.
- **Ownership:** derive the user from the token. The frontend never sends a user id.
- **Filtering:** the demo filters client-side on exact-match query params. For large collections add server-side filtering, date ranges and pagination (`?from=&to=&page=`) and adapt the matching `list()` calls.
- **Derived values** such as nutrition totals, streaks and chart data are computed in the browser from raw records. You can keep that or return aggregates from the server.
- Pure-demo helpers to remove once you have a backend: `DemoEngines.*`, `DemoData.seed*`, `Store`, `API.resetDemo`.
- Static reference data (`exercises`, `posture/guides`, `foods`, membership `plans`) currently comes from `js/data.js`. Move it to the server when you want it editable.

---

## 4. Endpoints by feature

All paths are relative to `baseUrl`. All except `/auth/*` require authentication.

### 4.1 AI workout planner  (`js/workout.js`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/workout-plans/generate` | Generate a plan from preferences (AI / rules engine) |
| GET | `/workout-plans` | List saved plans |
| POST | `/workout-plans` | Save a plan |
| DELETE | `/workout-plans/{id}` | Delete a plan |
| GET | `/exercises` | Exercise library (optional) |

```jsonc
// POST /workout-plans/generate
{ "goal": "muscle_gain",              // weight_loss | muscle_gain | fitness | strength
  "level": "intermediate",            // beginner | intermediate | advanced
  "durationMin": 60, "daysPerWeek": 4,
  "equipment": ["bodyweight", "dumbbells", "barbell"],   // bodyweight|dumbbells|barbell|machines|cables|kettlebell|bands|bar|cardio
  "notes": "sore left knee" }
// 200 — also the body of POST /workout-plans when saving
{ "name": "Muscle gain · Intermediate · 4 days",
  "createdAt": "2026-11-21T06:00:00Z",
  "preferences": { "goal": "muscle_gain", "level": "intermediate", "durationMin": 60, "daysPerWeek": 4, "equipment": ["bodyweight","dumbbells","barbell"], "notes": "" },
  "summary": { "split": "Upper body / Lower body", "sessionsPerWeek": 4, "avgMinutes": 58, "setsPerWeek": 72 },
  "days": [
    { "day": "Monday", "focus": "Upper body", "rest": false, "estMinutes": 58,
      "exercises": [ { "exerciseId": "bench-press", "name": "Barbell bench press", "muscle": "chest", "equipment": "barbell",
                       "sets": 4, "reps": "8–10", "restSec": 90, "notes": "Shoulder blades pinched." } ] },
    { "day": "Tuesday", "focus": "Rest day", "rest": true, "estMinutes": 0, "exercises": [], "note": "Rest or easy movement." }
  ],
  "tips": ["Warm up for 5–6 minutes before each session."] }
```
Requires: **AI service or rules engine** (server side). Add safety checks for injuries in `notes`. `days` must always contain 7 entries, Monday to Sunday.

### 4.2 AI posture detection  (`js/posture.js`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/posture/guides` | Exercise guides (cues, camera tip, common mistakes) |
| POST | `/posture/sessions` | Save a session summary |
| GET | `/posture/sessions` | List sessions |
| DELETE | `/posture/sessions/{id}` | Delete |
| POST | `/posture/analyze` *(future)* | Analyse a frame or clip |

```jsonc
// POST /posture/sessions
{ "exercise": "squats", "date": "2026-11-21", "durationSec": 95, "reps": 12, "checksTicked": 4, "checksTotal": 5, "source": "self-check" }
// 201 → same fields plus "id", "createdAt"

// GET /posture/guides → { "squats": { "label": "Squats", "camera": "…", "cues": [{"t":"…","d":"…"}], "mistakes": ["…"] }, … }

// POST /posture/analyze  (not used by the frontend yet)
{ "exercise": "squats", "frame": "<base64 jpeg>" }
// → { "keypoints": [{"name":"left_knee","x":0.41,"y":0.62,"score":0.93}], "feedback": [{"checkIndex":1,"ok":false,"message":"Knees caving in"}] }
```
Requires: **ML pose-estimation model and camera processing.** Two options: run MediaPipe/TensorFlow.js **in the browser** (implement `PoseAnalyzer.analyze` in `js/posture.js`, no video leaves the device), or stream frames to a server. Get explicit consent for any video upload and avoid storing video.

### 4.3 Nutrition  (`js/nutrition.js`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/meals?date=YYYY-MM-DD` | Meals (the frontend currently loads all and filters; add `from`/`to` for efficiency) |
| POST | `/meals` | Create a meal |
| PATCH | `/meals/{id}` | Update items or type |
| DELETE | `/meals/{id}` | Delete |
| GET | `/foods?search=rice` | Food search |
| GET / PUT | `/nutrition/goals` | Daily targets |
| GET | `/water` | Water log |
| PUT | `/water/{date}` | Set cups for a date |

```jsonc
// POST /meals
{ "date": "2026-11-21", "type": "lunch",     // breakfast | lunch | dinner | snacks
  "items": [ { "foodId": "f08", "name": "Grilled chicken breast", "serving": "100 g", "qty": 1.5,
               "calories": 247.5, "protein": 46.5, "carbs": 0, "fat": 5.4 } ] }   // values are totals for qty
// 201 → meal with "id"

// GET /nutrition/goals → { "calories": 2200, "protein": 130, "carbs": 260, "fat": 70, "waterMl": 2500, "cupMl": 250 }
// PUT /water/2026-11-21  { "cups": 4 }  →  { "date": "2026-11-21", "cups": 4 }
// GET /foods?search=rice → [ { "id": "f09", "name": "Brown rice (cooked)", "serving": "1 cup", "calories": 215, "protein": 5, "carbs": 45, "fat": 1.8 } ]
```
Custom foods are sent with `"foodId": "custom"`. You may want to create them as user foods.

### 4.4 QR check-in  (`js/checkin.js`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/checkins/qr-token` | Short-lived signed token for the member's QR code |
| POST | `/checkins` | Verify a scanned/entered token and record the visit |
| GET | `/checkins` | Attendance history |
| DELETE | `/checkins/{id}` | (optional) remove an entry |

```jsonc
// GET /checkins/qr-token
{ "token": "eyJhbGciOi…", "expiresAt": "2026-11-21T06:05:00Z" }
// POST /checkins
{ "token": "eyJhbGciOi…", "method": "scan" }     // qr | scan | manual
// 201
{ "id": "chk_1", "date": "2026-11-21", "time": "06:42", "method": "scan", "branch": "FORMA Central", "status": "verified",
  "alreadyCheckedInToday": false, "member": { "name": "User", "memberId": "FRM-000001", "plan": "Pro" } }
// 422 { "error": { "code": "invalid_token", "message": "This code has expired. Refresh your QR code." } }
// 403 { "error": { "code": "membership_expired", "message": "Your membership has expired." } }
```
Requires: **QR verification on the server.** Sign tokens (e.g. JWT or HMAC) containing member id and a short expiry (about 5 minutes), make them single-use or rate-limited, verify against an active membership and the current branch, and log each check-in. In production the **desk scanner or staff app** (not the member's phone) normally calls `POST /checkins`. The member's page here simulates that for demonstration. If you do keep member-side scanning, never trust a "success" decided on the client. The QR image is generated in the browser by `js/qrcode.js` from the token text.

### 4.5 Equipment availability  (`js/equipment.js`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/equipment` | All equipment with current status |
| PATCH | `/equipment/{id}` | Update status (staff or sensor only) |
| GET | `/equipment/stream` *(optional)* | Server-Sent Events or WebSocket for push updates |

```jsonc
// GET /equipment
[ { "id": "eq02", "name": "Treadmill 2", "category": "Cardio", "type": "treadmill", "zone": "Cardio floor",
    "status": "occupied",                  // available | occupied | maintenance
    "waitMinutes": 12, "updatedAt": "2026-11-21T06:10:00Z" } ]
// PATCH /equipment/eq02  { "status": "available", "waitMinutes": 0 }
```
`type` selects the icon and must be one of the keys in `Icons.equipTypes` (`js/icons.js`) or it falls back to a dumbbell. `category` values are used for the filter and chart, so any strings work.
Requires: **hardware sensors or staff input** for real occupancy (pressure mats, door/rack sensors, IoT tags, machine telemetry, or a staff tablet). Without these the status is only as accurate as manual updates. With `useBackend: true` the page polls every `equipmentPollMs`. For push updates replace `startPolling()` in `js/equipment.js` with an `EventSource`/`WebSocket` listener that calls `apply(list)`. The "Staff controls (demo)" switch is a demo aid, so restrict `PATCH /equipment/{id}` to staff roles and hide the switch for members.

### 4.6 Progress predictor  (`js/progress.js`)

| Method | Path | Purpose |
|--------|------|---------|
| GET / POST / DELETE | `/workouts`, `/workouts/{id}` | Workout log |
| GET / POST / DELETE | `/body-metrics`, `/body-metrics/{id}` | Weight and body-fat entries |
| GET / PUT | `/goals` | Fitness goal |
| GET | `/progress/prediction?weeks=12` | AI forecast |

```jsonc
// POST /workouts      { "date": "2026-11-21", "type": "Upper body strength", "durationMin": 55, "calories": 340, "notes": "" }
// POST /body-metrics  { "date": "2026-11-21", "weightKg": 74.8, "bodyFatPct": 21.4 }      // bodyFatPct may be null
// PUT  /goals         { "type": "weight_loss", "startWeightKg": 78.4, "targetWeightKg": 70, "targetDate": "2027-03-10", "weeklyWorkouts": 4 }
// GET  /progress/prediction?weeks=12
{ "generatedBy": "your-model-name-v1", "ok": true, "confidence": "moderate", "weeklyChangeKg": -0.4, "etaTargetDate": "2027-04-02",
  "weeks": [ { "date": "2026-11-28", "predictedWeightKg": 74.5, "lower": 73.9, "upper": 75.1 } ] }
// not enough data → { "ok": false, "reason": "Log at least 3 weight entries.", "weeks": [] }
```
Requires: **an AI/ML service** (or at least a documented statistical model) trained and validated server-side. The UI labels projections as "demo" while `generatedBy` is `demo-linear-trend`. If your model replaces it, update the banner text in `pages/progress-predictor.html` so it does not misdescribe the prediction.

### 4.7 Trainers  (`js/trainers.js`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/trainers` | Trainer list (the frontend filters/sorts client-side) |
| GET | `/trainers/{id}` | Trainer detail |
| GET | `/trainer-bookings` | Member's requests |
| POST | `/trainer-bookings` | Request a session |
| PATCH | `/trainer-bookings/{id}` | Change date/time or `status: "cancelled"` |
| DELETE | `/trainer-bookings/{id}` | Remove from list |

```jsonc
// GET /trainers
[ { "id": "tr01", "name": "Aarav Mehta", "photo": "https://cdn.example.com/trainers/tr01.jpg",
    "specializations": ["Strength","Muscle gain"], "experienceYears": 9, "rating": 4.9, "reviewCount": 212,
    "pricePerSession": 900, "availableDays": ["Mon","Tue","Thu","Fri"], "languages": ["English","Hindi"], "gender": "Male",
    "bio": "…", "certifications": ["NSCA-CSCS"], "slots": ["06:00","07:00","17:00"] } ]
// POST /trainer-bookings
{ "trainerId": "tr01", "date": "2026-11-24", "time": "07:00", "goal": "Strength", "notes": "", "contactPhone": "9876543210", "status": "requested" }
// 201 → booking with "id". Server rules: status flow requested → confirmed | declined | cancelled
// 409 { "error": { "code": "slot_taken", "message": "That slot is no longer available." } }
```
`photo` is currently a relative path to an included SVG. Return absolute URLs from your API (the page prefixes relative paths with `../`). Requires on the server: availability calendar per trainer, double-booking prevention, notifications (email/SMS/push) and payment if sessions are paid. "Match me" currently uses a simple scoring function in `trainers.js`. Move it server-side if you want real recommendations.

### 4.8 Chatbot  (`js/chatbot.js`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/chatbot/messages` | Send a message, get a reply |
| GET | `/chatbot/history` | Past messages |
| DELETE | `/chatbot/history` | Clear history |

```jsonc
// POST /chatbot/messages
{ "message": "How much protein do I need?", "conversationId": "c_123" }
// 200
{ "reply": "About 1.4–2.0 g per kg of body weight…\n- Eggs\n- Dal", "conversationId": "c_123", "suggestions": ["What should I eat before a workout?"] }
// GET /chatbot/history → [ { "role": "user"|"bot", "text": "…", "time": "06:41" } ]
```
`reply` supports plain text with `- ` bullet lines only (the frontend escapes everything else, so HTML is shown as text).
Requires: **an AI language model behind your server.** Keep the provider API key in server environment variables and call the provider from your backend. **Never put an API key in any frontend file.** Add server-side moderation, rate limits per user, prompt instructions to avoid diagnosis or medical advice, and escalation text for pain, injury, eating disorders, pregnancy and emergencies. The demo replies contain a small keyword-based safety message you should replicate in your system prompt.

### 4.9 Membership  (`js/membership.js`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/membership/plans` | Plans and billing cycles |
| GET | `/membership` | Current membership |
| POST | `/membership/subscribe` | Buy, renew or change plan |
| PATCH | `/membership/preferences` | Auto-renew, cycle, reminders, payment method choice |
| POST | `/membership/cancel` | Cancel at period end |
| GET | `/membership/history` | Payments |
| POST | `/payments/intents` *(recommended)* | Create a gateway payment intent / order |

```jsonc
// GET /membership/plans
{ "plans": [ { "id": "pro", "name": "Pro", "monthlyPrice": 1799, "tagline": "…", "features": ["…"], "featured": true } ],
  "cycles": [ { "id": "monthly", "label": "Monthly", "months": 1, "discount": 0 }, { "id": "yearly", "label": "Yearly", "months": 12, "discount": 0.2 } ] }
// GET /membership
{ "planId": "pro", "cycle": "monthly", "status": "active",       // active | cancelling | expired
  "startDate": "2026-11-03", "expiryDate": "2026-12-03", "autoRenew": true, "reminderDaysBefore": 3, "renewalCycle": "monthly",
  "paymentMethod": { "brand": "Visa", "last4": "4242" } }
// POST /membership/subscribe
{ "planId": "elite", "cycle": "yearly", "paymentMethodId": "pm_123" }    // id/token from the gateway, never a card number
// 200 → updated membership object
// PATCH /membership/preferences  { "autoRenew": false, "renewalCycle": "quarterly", "reminderDaysBefore": 7 }
// GET /membership/history → [ { "id": "mh_1", "date": "2026-11-03", "description": "Pro plan – monthly renewal", "amount": 1799, "status": "paid", "planId": "pro" } ]
```
Requires: **a payment gateway** (e.g. Razorpay, Stripe), and for auto-renewal **scheduled server jobs, saved gateway payment methods or mandates, webhooks and retry/dunning logic**, receipts or tax invoices, and reminder emails/SMS. The frontend never handles real card data.

> **Payment form warning.** The demo has its own card fields only to demonstrate validation, and it discards the number, expiry and CVV immediately, keeping only brand and last 4. In production **delete the card inputs** (`cardFields`, `validateCard`, `startCheckout` and `changeCard` in `js/membership.js`) and open the gateway's hosted checkout or secure fields instead, so card data never touches your JavaScript. Then send the returned token/intent id to `POST /membership/subscribe`. Calculate price and discount on the server (the frontend calculation is for display only). Never trust the amount sent by the browser. The `amount`, `last4` and `brand` the demo passes to `API.membership.subscribe` are ignored by the backend branch.

---

## 5. What needs which external capability

| Feature | AI / ML | Camera processing | QR verification | Hardware sensors | Payment gateway | Notifications |
|---------|:------:|:----------------:|:--------------:|:---------------:|:--------------:|:------------:|
| 1 Workout planner | ✔ (model or rules engine) | | | | | |
| 2 Posture detection | ✔ (pose model) | ✔ | | | | |
| 3 Nutrition tracker | optional (food recognition) | | | | | |
| 4 QR check-in | | ✔ (scanning only) | ✔ (server-signed tokens) | optional (turnstile/door) | | |
| 5 Equipment availability | | | | ✔ (or staff entry) | | |
| 6 Progress predictor | ✔ (forecast model) | | | optional (smart scale, wearables) | | |
| 7 Trainer matching | optional (recommendation) | | | | optional | ✔ |
| 8 Chatbot | ✔ (LLM) | | | | | |
| 9 Membership & renewal | | | | | ✔ | ✔ |

---

## 6. Suggested rollout order

1. Auth (`/auth/*`, `/users/me`) and the 401 redirect.
2. Simple CRUD features: nutrition, progress, trainers, check-in history, equipment (read-only).
3. Membership read endpoints, then payments with a gateway sandbox.
4. QR token signing and verification.
5. AI features last: workout generation, prediction, chatbot, posture detection.

Test each step by setting `useBackend: true` and exercising the related page. Remember to remove or hide demo-only UI when its backend arrives (for example the "Demo mode" badge disappears automatically when `useBackend` is true, but demo notices on pages should be reworded to match what your backend really does).

## 7. Security checklist

- Validate and authorise everything on the server. The frontend validation is for convenience only.
- Use HTTPS. Set strict CORS. Prefer HttpOnly cookies over localStorage tokens.
- Never put secrets in frontend files (`config.js` is public). Keep AI, payment and signing keys on the server.
- All user-supplied text shown in the UI is escaped with `esc()` in `js/app.js`. Keep using it if you add fields, and avoid `innerHTML` with untrusted data.
- Treat health, body and attendance data as personal data. Add consent, retention and deletion policies that match the laws that apply to you.
