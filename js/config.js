/* ==========================================================================
   FORMA – config.js
   The ONLY file a backend developer must edit to switch the app from demo mode
   to a real API. Loaded before api.js on every page.

   Demo mode (default):  useBackend = false  -> data is read/written in the
                          browser's localStorage. No network requests are made.
   Backend mode:         useBackend = true   -> api.js calls fetch() against
                          `baseUrl` using the endpoints in
                          docs/backend-integration-guide.md.

   NEVER put secrets here (API keys, payment keys, AI keys). This file is
   public to every visitor. Secrets belong on the server.
   ========================================================================== */
window.FORMA_CONFIG = {
  // Root of your REST API, without a trailing slash.
  baseUrl: 'http://localhost:8000/api/v1',

  // false = demo mode (localStorage). true = call the backend through fetch().
  useBackend: false,

  // Request timeout in milliseconds.
  timeoutMs: 15000,

  // How the auth token is sent. Change if your backend uses cookies instead:
  //   'bearer'  -> Authorization: Bearer <token>
  //   'cookie'  -> credentials: 'include' (the server sets an HttpOnly cookie)
  authMode: 'bearer',

  // Equipment availability refresh interval when connected to a backend (ms).
  equipmentPollMs: 10000,

  // Currency symbol shown in the membership UI.
  currency: '₹',

  // Gym branch name displayed in check-in history.
  branchName: 'FORMA Central'
};
