/* ==========================================================================
   FORMA – auth.js   (login + registration forms)
   Backend hook: API.auth.login / API.auth.register in api.js
     POST /auth/login     {email, password}               -> {token, user}
     POST /auth/register  {name, email, password, phone}  -> {token, user}
   Password rules below are UI hints only – enforce real rules on the server.
   ========================================================================== */
(function () {
  const dashboardUrl = ROOT + 'index.html';
  const go = () => { location.href = dashboardUrl; };

  const loginForm = $('#loginForm');
  if (loginForm) {
    $('#pwToggle').addEventListener('click', () => {
      const input = $('#password'); const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      $('#pwToggle').setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const { valid, values } = UI.validate(loginForm, {
        email: { label: 'Email', required: true, email: true },
        password: { label: 'Password', required: true, min: 6 }
      });
      if (!valid) return;
      const btn = $('button[type=submit]', loginForm); btn.disabled = true; btn.textContent = 'Signing in…';
      try { await API.auth.login({ email: values.email, password: values.password }); go(); }
      catch (err) { UI.fail(err, 'Could not sign in. Check your details and try again.'); btn.disabled = false; btn.textContent = 'Sign in'; }
    });
    $('#demoBtn').addEventListener('click', async () => { try { await API.auth.demoLogin(); go(); } catch (e) { UI.fail(e); } });
    $('#forgotLink').addEventListener('click', e => {
      e.preventDefault();
      UI.modal({ title: 'Reset password', body: '<p>Password reset needs a backend that can email a secure link. In this demo there is nothing to reset – use <b>Continue as demo User</b> to get in.</p>', footer: [{ label: 'Got it', cls: '' }] });
    });
    if (API.auth.hasSession()) { /* already signed in: offer a shortcut */
      const n = document.createElement('div'); n.className = 'notice success'; n.innerHTML = Icons.svg('check') + '<div>You are already signed in. <a href="' + dashboardUrl + '">Go to dashboard</a></div>';
      loginForm.before(n);
    }
  }

  const regForm = $('#registerForm');
  if (regForm) {
    const strength = pw => {
      let s = 0; if (pw.length >= 8) s++; if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++; if (/\d/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++; return s;
    };
    $('#password').addEventListener('input', e => {
      const s = strength(e.target.value); const bar = $('#pwBar');
      bar.style.width = (s * 25) + '%'; bar.style.background = s <= 1 ? 'var(--danger)' : s === 2 ? 'var(--warning)' : 'var(--success)';
      $('#pwHint').textContent = e.target.value ? ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][s] : 'Use 8+ characters with letters and numbers.';
    });
    regForm.addEventListener('submit', async e => {
      e.preventDefault();
      const { valid, values } = UI.validate(regForm, {
        name: { label: 'Name', required: true, min: 2, max: 60 },
        email: { label: 'Email', required: true, email: true },
        phone: { label: 'Phone', pattern: /^[0-9+\-\s]{7,15}$/, message: 'Enter a phone number with 7–15 digits.' },
        password: { label: 'Password', required: true, min: 8, pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: 'Password needs at least one letter and one number.' },
        confirm: { label: 'Confirm password', required: true },
        terms: { label: 'The terms', required: true }
      });
      if (values.confirm && values.confirm !== values.password) { UI.setError(regForm.elements.confirm, 'Passwords do not match.'); return; }
      if (!valid) return;
      const btn = $('button[type=submit]', regForm); btn.disabled = true; btn.textContent = 'Creating account…';
      try { await API.auth.register({ name: values.name, email: values.email, password: values.password, phone: values.phone }); UI.toast('Account created. Welcome to FORMA!'); setTimeout(go, 600); }
      catch (err) { UI.fail(err, 'Could not create the account.'); btn.disabled = false; btn.textContent = 'Create account'; }
    });
  }
})();
