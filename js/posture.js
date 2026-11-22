/* ==========================================================================
   FORMA – posture.js   (Feature 2: posture check)

   WHAT THIS DOES: camera preview (getUserMedia), exercise-specific form guide,
   a drawn alignment overlay, a self-check list, a timer and a manual rep counter.

   WHAT IT DOES NOT DO: it does not detect poses or judge form. There is no ML here.

   WHERE REAL DETECTION PLUGS IN: see PoseAnalyzer at the bottom. Replace
   PoseAnalyzer.analyze(videoEl) with a model (MediaPipe Pose / TF.js MoveNet, or
   frames sent to your server). It should return
     { keypoints:[{name,x,y,score}], feedback:[{checkIndex, ok, message}] }
   and the UI below would tick checklist items and draw the skeleton from it.
   Backend (optional): POST /posture/sessions saves session summaries.
   ========================================================================== */
Page.ready(function () {
  const EX_ORDER = ['squats', 'pushups', 'lunges', 'planks', 'deadlifts'];
  let guides = {}; let current = 'squats'; let stream = null; let rafId = null;
  let ticked = {}; let timer = { running: false, start: 0, elapsed: 0, id: null }; let reps = 0;

  const video = $('#video'), overlay = $('#overlay'), stage = $('#stage');

  /* ------------ init ------------ */
  (async function init() {
    try { guides = await API.posture.guides(); } catch (e) { return UI.fail(e, 'Could not load the form guides.'); }
    $('#exerciseSeg').innerHTML = EX_ORDER.map(k => `<input type="radio" name="exercise" id="ex_${k}" value="${k}" ${k === current ? 'checked' : ''}><label for="ex_${k}">${esc(guides[k].label)}</label>`).join('');
    $('#exerciseSeg').addEventListener('change', e => { current = e.target.value; ticked = {}; resetTimer(); renderGuide(); });
    renderGuide(); loadSessions();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('#camHelp').textContent = 'This browser cannot access the camera. You can still use the guide, checklist and timer.';
      $('#startCam').disabled = true;
    }
  })();

  function renderGuide() {
    const g = guides[current];
    $('#guideTitle').textContent = g.label + ' form guide';
    $('#camTip').innerHTML = '<b>Camera position:</b> ' + esc(g.camera);
    $('#checklist').innerHTML = g.cues.map((c, i) => `<label class="check-item ${ticked[i] ? 'done' : ''}"><input type="checkbox" data-i="${i}" ${ticked[i] ? 'checked' : ''}><div><b>${esc(c.t)}</b><span>${esc(c.d)}</span></div></label>`).join('');
    $('#mistakes').innerHTML = g.mistakes.map(m => `<li>${esc(m)}</li>`).join('');
    updateScore(); drawOverlay();
  }
  $('#checklist').addEventListener('change', e => {
    const i = e.target.dataset.i; if (i === undefined) return;
    ticked[i] = e.target.checked; e.target.closest('.check-item').classList.toggle('done', e.target.checked); updateScore();
  });
  function updateScore() {
    const total = guides[current].cues.length; const n = Object.values(ticked).filter(Boolean).length;
    $('#scoreText').textContent = n + ' / ' + total; $('#scoreBar').style.width = (n / total * 100) + '%';
  }

  /* ------------ camera ------------ */
  function setBadge(live, text) { $('#camBadge').className = 'cam-badge' + (live ? ' live' : ''); $('#camBadge').innerHTML = '<span class="dot"></span> ' + esc(text); }

  async function startCamera() {
    $('#camError').innerHTML = '';
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      showCamError('Camera access needs a secure page', 'Browsers only allow the camera on https:// pages or on localhost. Run the project with a local server (see the README) or host it on HTTPS.');
      return;
    }
    $('#startCam').disabled = true; $('#camHelp').textContent = 'Waiting for permission…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.srcObject = stream; await video.play().catch(() => { });
      video.classList.remove('hidden'); overlay.classList.remove('hidden'); $('#camPlaceholder').classList.add('hidden');
      $('#startCam').classList.add('hidden'); $('#stopCam').classList.remove('hidden');
      setBadge(true, 'Camera on · preview only'); applyMirror(); loop();
    } catch (err) {
      const map = {
        NotAllowedError: ['Camera permission was blocked', 'Allow camera access in the address-bar site settings, then press Start camera again.'],
        PermissionDeniedError: ['Camera permission was blocked', 'Allow camera access in the address-bar site settings, then press Start camera again.'],
        NotFoundError: ['No camera found', 'Connect a webcam or use a device with a camera, then try again.'],
        DevicesNotFoundError: ['No camera found', 'Connect a webcam or use a device with a camera, then try again.'],
        NotReadableError: ['Camera is in use', 'Close other apps or tabs that are using the camera, then try again.'],
        OverconstrainedError: ['Camera settings not supported', 'Try a different camera.']
      };
      const m = map[err.name] || ['Could not start the camera', err.message || 'Unknown error.'];
      showCamError(m[0], m[1]);
      $('#camHelp').textContent = 'Camera is off. You can still use the checklist and timer.';
    }
    $('#startCam').disabled = false;
  }
  function showCamError(title, text) { $('#camError').innerHTML = UI.notice('<b>' + esc(title) + '.</b> ' + esc(text), 'danger', 'alert'); }
  function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; video.srcObject = null;
    cancelAnimationFrame(rafId); video.classList.add('hidden'); overlay.classList.add('hidden'); $('#camPlaceholder').classList.remove('hidden');
    $('#startCam').classList.remove('hidden'); $('#stopCam').classList.add('hidden'); setBadge(false, 'Camera off'); $('#camHelp').textContent = 'Press “Start camera” and allow access when your browser asks.';
  }
  $('#startCam').addEventListener('click', startCamera);
  $('#stopCam').addEventListener('click', stopCamera);
  window.addEventListener('pagehide', stopCamera);
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) { stopCamera(); UI.toast('Camera turned off because the tab was hidden.', 'info'); } });

  const applyMirror = () => video.classList.toggle('mirror', $('#optMirror').checked);
  ['optOverlay', 'optMirror', 'optGrid'].forEach(id => $('#' + id).addEventListener('change', () => { applyMirror(); drawOverlay(); }));

  /* ------------ guide overlay (static drawing, NOT detection) ------------ */
  function loop() { drawOverlay(); rafId = requestAnimationFrame(() => setTimeout(loop, 120)); }
  function drawOverlay() {
    const r = stage.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    if (overlay.width !== Math.floor(r.width * dpr)) { overlay.width = Math.floor(r.width * dpr); overlay.height = Math.floor(r.height * dpr); }
    const c = overlay.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, r.width, r.height);
    if (!stream) return; const w = r.width, h = r.height;
    if ($('#optGrid').checked) {
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.setLineDash([4, 6]);
      [1 / 3, 2 / 3].forEach(f => { c.beginPath(); c.moveTo(w * f, 0); c.lineTo(w * f, h); c.stroke(); c.beginPath(); c.moveTo(0, h * f); c.lineTo(w, h * f); c.stroke(); });
      c.setLineDash([]);
    }
    if ($('#optOverlay').checked) {
      const cx = w / 2; const col = 'rgba(255,106,56,.9)';
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.lineCap = 'round'; c.setLineDash([10, 8]);
      const horizontal = current === 'pushups' || current === 'planks';
      if (horizontal) { // body-line guide from head to heels
        c.beginPath(); c.moveTo(w * .18, h * .52); c.lineTo(w * .82, h * .66); c.stroke();
        c.setLineDash([]); c.beginPath(); c.arc(w * .18, h * .52, 10, 0, 7); c.stroke();
        c.font = '600 13px sans-serif'; c.fillText('Head to heels in one line', w * .3, h * .5);
      } else { // plumb line + hip/knee markers
        c.beginPath(); c.moveTo(cx, h * .08); c.lineTo(cx, h * .94); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.arc(cx, h * .16, 12, 0, 7); c.stroke();
        c.beginPath(); c.moveTo(cx - 55, h * .52); c.lineTo(cx + 55, h * .52); c.stroke();
        c.beginPath(); c.moveTo(cx - 40, h * .92); c.lineTo(cx + 40, h * .92); c.stroke();
        c.font = '600 13px sans-serif'; c.textAlign = 'left'; c.fillText('Keep shoulders over mid-foot', cx + 16, h * .3); c.fillText('Hips', cx + 62, h * .52 + 4);
      }
      c.setLineDash([]); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(8, h - 30, 250, 22); c.fillStyle = '#fff'; c.font = '12px sans-serif'; c.textAlign = 'left'; c.fillText('Static guide only – not AI detection', 14, h - 14);
    }
  }
  window.addEventListener('resize', drawOverlay);

  /* ------------ timer + reps ------------ */
  const fmt = ms => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  function tick() { $('#timerText').textContent = fmt(timer.elapsed + (timer.running ? Date.now() - timer.start : 0)); }
  $('#timerBtn').addEventListener('click', () => {
    if (timer.running) { timer.elapsed += Date.now() - timer.start; timer.running = false; clearInterval(timer.id); $('#timerBtn').innerHTML = Icons.svg('play') + ' Resume'; }
    else { timer.start = Date.now(); timer.running = true; timer.id = setInterval(tick, 250); $('#timerBtn').innerHTML = Icons.svg('stop') + ' Pause'; }
    tick();
  });
  function resetTimer() { clearInterval(timer.id); timer = { running: false, start: 0, elapsed: 0, id: null }; reps = 0; $('#repText').textContent = '0'; $('#timerBtn').innerHTML = Icons.svg('play') + ' Start'; tick(); }
  $('#resetBtn').addEventListener('click', () => { resetTimer(); ticked = {}; renderGuide(); });
  $('#repPlus').addEventListener('click', () => { reps++; $('#repText').textContent = reps; });
  $('#repMinus').addEventListener('click', () => { reps = Math.max(0, reps - 1); $('#repText').textContent = reps; });

  /* ------------ sessions ------------ */
  $('#saveSession').addEventListener('click', async () => {
    const total = guides[current].cues.length; const n = Object.values(ticked).filter(Boolean).length;
    const dur = Math.round((timer.elapsed + (timer.running ? Date.now() - timer.start : 0)) / 1000);
    if (!n && !reps && !dur) return UI.toast('Tick at least one form check, count a rep or run the timer before saving.', 'error');
    try {
      await API.posture.saveSession({ exercise: current, date: todayISO(), durationSec: dur, reps, checksTicked: n, checksTotal: total, source: 'self-check' });
      UI.toast('Session saved.'); resetTimer(); ticked = {}; renderGuide(); loadSessions();
    } catch (e) { UI.fail(e, 'Could not save the session.'); }
  });
  async function loadSessions() {
    let list; try { list = await API.posture.sessions(); } catch (e) { return UI.fail(e); }
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    $('#sessCount').textContent = list.length ? list.length + ' saved' : '';
    $('#sessionList').innerHTML = list.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Exercise</th><th>Form checks</th><th>Reps</th><th>Time</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${list.map(s => `<tr><td>${fmtDate(s.date)}</td><td>${esc(guides[s.exercise] ? guides[s.exercise].label : s.exercise)}</td><td>${s.checksTicked}/${s.checksTotal}</td><td>${s.reps}</td><td>${fmt(s.durationSec * 1000)}</td><td class="right"><button class="btn sm danger outline" data-del="${s.id}" aria-label="Delete session">Delete</button></td></tr>`).join('')}</tbody></table></div>`
      : UI.empty({ icon: 'posture', title: 'No sessions saved', text: 'Finish a set, then press Save session to keep a note of it.' });
    $('#sessionList').onclick = async e => {
      const b = e.target.closest('[data-del]'); if (!b) return;
      if (await UI.confirm({ title: 'Delete session?', message: 'This removes the saved session.', confirmText: 'Delete', danger: true })) { try { await API.posture.removeSession(b.dataset.del); UI.toast('Session deleted.'); loadSessions(); } catch (er) { UI.fail(er); } }
    };
  }
});

/* ---------- FUTURE: real pose analysis plug-in point (not implemented) ---------- */
const PoseAnalyzer = {
  /**
   * @param {HTMLVideoElement} videoEl
   * @returns {Promise<{keypoints:Array, feedback:Array}>}
   * Implement with MediaPipe/TF.js, or POST a frame to e.g. /posture/analyze on your server.
   */
  async analyze(/* videoEl */) { throw new Error('Pose analysis is not implemented in this frontend demo.'); }
};
