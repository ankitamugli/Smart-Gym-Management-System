# FORMA – Smart Gym Management System (frontend)

A complete, responsive **frontend-only** gym management web app with nine feature modules. It runs in any modern browser with **no backend, no build step and no dependencies to install**. All data is demo data stored in your browser (`localStorage`).

It is also structured so that another developer can connect a real REST backend later **without redesigning or rebuilding the UI** – see [`docs/backend-integration-guide.md`](docs/backend-integration-guide.md).

> **Important:** there is no backend in this repository and none is implied. Features that would normally need servers, AI models, hardware or payment gateways are clearly labelled as demos in the UI and in the table below.

---

## 1. Features

| # | Feature | Page | What works in the frontend | What a real product still needs |
|---|---------|------|----------------------------|---------------------------------|
| 1 | AI-based workout planner | `pages/workout-planner.html` | Goal, level, duration, days/week, equipment → 7-day plan with exercises, sets, reps, rest. Swap/remove exercises, shuffle, save/rename/delete plans, print, export JSON | A server-side AI model or rules engine (`POST /workout-plans/generate`). The demo uses a rule-based generator, **not AI** |
| 2 | AI posture detection | `pages/posture-detection.html` | Camera permission handling and live preview, exercise selector (squats, push-ups, lunges, planks, deadlifts), form guide overlay, self-check list, timer, rep counter, saved sessions | A pose-estimation model (MediaPipe / TensorFlow.js / server). **No pose detection is performed**; a clearly marked plug-in point exists in `js/posture.js` |
| 3 | Diet & nutrition tracker | `pages/nutrition.html` | Add/edit/delete meals and foods (32-food sample list + custom foods), calories/protein/carbs/fat vs goals, water cups, 7-day charts, macro split, editable goals, date navigation | Real food database, user-specific targets from a dietitian/service |
| 4 | QR check-in | `pages/qr-checkin.html` | QR code generated in-browser (own encoder, no CDN), camera scanner (BarcodeDetector), paste-a-code fallback, confirmation modal, attendance history, streak, heatmap, CSV export | **Server-side token signing and verification** against an active membership. The demo accepts any text starting with `FORMA-DEMO\|` |
| 5 | Real-time equipment availability | `pages/equipment.html` | 25 sample items with icons, available/occupied/maintenance, search, category + status filters, summary dashboard, chart, wait times, staff-control demo | Live data from staff entries or sensors, delivered by polling/WebSocket/SSE |
| 6 | AI fitness progress predictor | `pages/progress-predictor.html` | Weight/body-fat logging, workout history (add/edit/delete), goal tracker, weekly-minutes chart, straight-line projection with range | A trained prediction model. The dashed line is a **simple linear trend, not AI**, and is labelled that way |
| 7 | Personal trainer matching | `pages/trainers.html` | 8 sample trainers with illustrated avatars, search, specialty/day/price/gender filters, sorting, details modal, booking request with slot picker, change/cancel, “Match me” scoring | Real trainers, availability, double-booking prevention, notifications |
| 8 | AI fitness chatbot | `pages/chatbot.html` | Chat UI, typing indicator, persistent history, suggested questions by topic, keyword-matched demo answers, basic safety reply for medical keywords | A real AI model behind your own server endpoint. **API keys must never go in frontend code** |
| 9 | Membership & auto renewal | `pages/membership.html` | Plans and pricing (monthly/quarterly/yearly), current membership, start/expiry dates, renewal preferences, payment **demonstration** (Luhn/expiry/CVV validation, only last 4 digits kept), history, demo receipts, cancel | A payment gateway, secure tokenised cards, webhooks and scheduled renewal jobs |

Also included: login and registration pages (frontend validation only), dashboard with statistics and charts, light/dark theme, profile editing, “Reset demo data”.

---

## 2. Technologies

- HTML5, CSS3 (custom properties, grid, flexbox), vanilla JavaScript (ES2020, no framework, no bundler)
- Charts: a small dependency-free canvas chart helper (`js/charts.js`)
- QR code generation: a small dependency-free encoder (`js/qrcode.js`, checked against OpenCV's decoder)
- Icons: inline SVG (`js/icons.js`)
- Fonts: Barlow and Barlow Condensed from Google Fonts. If you are offline the app falls back to system fonts and still works
- Bootstrap and Chart.js were **not** used, so there is nothing to download and the project works offline

---

## 3. Folder structure

```
smart-gym-management-system/
├── index.html                     Dashboard
├── README.md
├── .gitignore
├── pages/
│   ├── login.html  register.html
│   ├── workout-planner.html       (1)
│   ├── posture-detection.html     (2)
│   ├── nutrition.html             (3)
│   ├── qr-checkin.html            (4)
│   ├── equipment.html             (5)
│   ├── progress-predictor.html    (6)
│   ├── trainers.html              (7)
│   ├── chatbot.html               (8)
│   └── membership.html            (9)
├── css/
│   ├── style.css                  Design tokens, layout, components
│   └── responsive.css             Tablet and phone breakpoints
├── js/
│   ├── config.js                  ★ API base URL and demo/backend switch
│   ├── api.js                     ★ ALL data access (demo + fetch() backend branch)
│   ├── storage.js                 localStorage wrapper (used only by api.js demo branch)
│   ├── data.js                    ★ ALL sample/demo data, separate from UI logic
│   ├── app.js                     Shell: sidebar, header, auth guard, modals, toasts, validation
│   ├── auth.js                    Login / register forms
│   ├── dashboard.js
│   ├── workout.js                 Feature 1 (+ demo generator)
│   ├── posture.js                 Feature 2
│   ├── nutrition.js               Feature 3
│   ├── checkin.js  qrcode.js      Feature 4
│   ├── equipment.js               Feature 5
│   ├── progress.js                Feature 6 (+ demo projection)
│   ├── trainers.js                Feature 7
│   ├── chatbot.js                 Feature 8 (+ demo answers)
│   ├── membership.js              Feature 9
│   ├── charts.js  icons.js        Helpers
├── assets/
│   ├── icons/favicon.svg
│   └── images/trainers/           Illustrated avatars (not real people)
└── docs/
    └── backend-integration-guide.md
```

Files marked ★ are the ones a backend developer works with.

---

## 4. How to run

**Quickest:** double-click `index.html` (or `pages/login.html`). It opens in your browser, no server needed. Click **Continue as demo User**.

**Recommended (camera features):** browsers only allow camera access on `https://` pages and on `localhost`, and some browsers also block it on `file://`. Serve the folder locally:

```bash
cd smart-gym-management-system
python3 -m http.server 8080      # or: npx serve .
# open http://localhost:8080/pages/login.html
```

Any static server works. No install of project dependencies is needed.

### Demo sign-in
Any well-formed email plus a password of 6+ characters signs you in, or use **Continue as demo User**. Nothing is checked against a server. The default profile name is **User**.

---

## 5. Browser requirements

- Current Chrome, Edge, Firefox or Safari (ES2020, CSS grid, `color-mix`, `localStorage`).
- Camera features need `getUserMedia` and a secure context (HTTPS or localhost) plus a camera and permission.
- Live QR scanning from the camera uses the `BarcodeDetector` API (Chrome/Edge, Android Chrome). In other browsers the preview still works and the paste-a-code fallback is offered.
- If `localStorage` is blocked (some private modes), the app keeps data in memory for the session.

---

## 6. Demo limitations

- **No backend.** Data lives in this browser only. Clearing site data, using another browser or another device starts fresh. “Reset demo data” in the account menu restores the sample data.
- **No security.** Login, QR verification, bookings and payments are simulated. Do not treat anything here as secure, and do not enter real card details (the demo asks for the test number 4242 4242 4242 4242).
- **No AI.** Workout plans (rules), the progress projection (linear trend) and the chatbot (keyword matching) are simple JavaScript stand-ins and say so in the UI. Posture detection is not implemented at all, only camera preview, a static guide overlay and a checklist.
- **Equipment page:** in demo mode a random machine flips status every ~12 seconds so the page feels live. This is simulated and never runs when `useBackend` is true.
- **Sample data** (trainers, reviews, prices, foods, equipment) is invented. Food nutrition values are approximate. Trainer photos are illustrated avatars, not real people.
- Fitness and nutrition content is general information, not medical advice.

---

## 7. Connecting a backend (summary)

1. Build a REST API following [`docs/backend-integration-guide.md`](docs/backend-integration-guide.md) (endpoint list and JSON examples for all nine features).
2. Edit **`js/config.js`**:
   ```js
   window.FORMA_CONFIG = {
     baseUrl: 'https://api.example.com/api/v1',
     useBackend: true,
     authMode: 'bearer',   // or 'cookie'
     ...
   };
   ```
3. That is the only switch. Every page already calls `API.*` functions in `js/api.js`, and each function has a `fetch()` branch that is used when `useBackend` is `true`. The branch has never been run against a real server, so verify each call against your API.
4. Demo-only helpers (`DemoEngines`, `DemoData`, `Store`) are then unused and can be deleted.
5. Enable CORS on your server for the frontend origin, or serve both from the same origin.

Never put API keys, payment secrets or AI provider keys in this frontend.

---

## 8. Accessibility and quality notes

Keyboard-focus styles, labelled form controls, `aria-live` regions for dynamic content, reduced-motion support, dialogs closable with Esc, and responsive layouts tested at phone (390 px), tablet (820 px) and desktop (1360 px) widths.

---

## 9. Licence

No licence is included. Add one (for example MIT) before publishing if you want others to reuse the code.
