/* ==========================================================================
   FORMA – chatbot.js   (Feature 8: fitness chatbot)

   HOW TO CONNECT A REAL AI MODEL
   • Implement  POST {baseUrl}/chatbot/messages  on YOUR server:
       request  { "message": "How much protein do I need?", "conversationId": "optional" }
       response { "reply": "text (basic markdown: '- ' bullets)", "conversationId": "c_123",
                  "suggestions": ["optional follow-up", "..."] }
     The server calls the AI provider with a secret key stored in server-side
     environment variables. NEVER put an API key in this file or any frontend file.
   • Set FORMA_CONFIG.useBackend = true. api.js then calls fetch() for chatbot.send().
   • Add safety rules on the server (no diagnosis, referral for medical topics).

   DEMO ENGINE (below): scores each topic in DemoData.chatTopics by keyword matches.
   ========================================================================== */
DemoEngines.chatbot = function (message) {
  const q = ' ' + message.toLowerCase().replace(/[^\w\s-]/g, ' ') + ' ';
  const red = ['chest pain', 'faint', 'dizzy', 'injury', 'injured', 'pain', 'dislocat', 'surgery', 'pregnan', 'eating disorder', 'starve', 'diabetes', 'blood pressure'];
  if (red.some(w => q.includes(w))) {
    return { reply: 'That sounds like something to check with a qualified professional. Please talk to a doctor or physiotherapist before training through pain, with a medical condition, or while pregnant. If you have chest pain, fainting or severe dizziness, stop and seek medical help right away.', suggestions: ['Do I need rest days?', 'How do I reduce muscle soreness?'], matched: 'safety' };
  }
  let best = null, bestScore = 0;
  DemoData.chatTopics.forEach(t => { const s = t.keywords.reduce((a, k) => a + (q.includes(k.includes(' ') ? k : ' ' + k) ? (k.length > 5 ? 2 : 1) : 0), 0); if (s > bestScore) { best = t; bestScore = s; } });
  if (!best) return { reply: DemoData.chatFallback, suggestions: ['How many days a week should I train?', 'How much protein do I need?', 'How much sleep do I need?'], matched: null };
  const groups = { Workouts: ['frequency', 'start-strength', 'overload', 'warmup'], Nutrition: ['protein', 'pre-workout', 'deficit', 'water'], Fitness: ['consistency', 'results', 'cardio'], Recovery: ['sleep', 'soreness', 'rest'] };
  const grp = Object.keys(groups).find(g => groups[g].includes(best.id));
  const sug = grp ? DemoData.chatSuggestions[grp].filter(s => s.toLowerCase() !== message.toLowerCase()).slice(0, 2) : ['How many days a week should I train?', 'How much protein do I need?'];
  return { reply: best.answer, suggestions: sug, matched: best.id };
};

Page.ready(function () {
  let history = [];            // [{role:'user'|'bot', text, time}]
  let waiting = false;
  const log = $('#chatLog'), input = $('#chatInput');
  const time = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  /** Minimal safe markdown: escape first, then turn "- " lines into a list. */
  function format(text) {
    const lines = String(text).split('\n'); let html = '', inList = false;
    lines.forEach(l => { if (/^\s*-\s+/.test(l)) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + esc(l.replace(/^\s*-\s+/, '')) + '</li>'; } else { if (inList) { html += '</ul>'; inList = false; } if (l.trim()) html += '<p style="margin:0 0 .4rem">' + esc(l) + '</p>'; } });
    return html + (inList ? '</ul>' : '');
  }
  function add(role, text, extra) {
    const el = document.createElement('div'); el.className = 'msg ' + role;
    el.innerHTML = (role === 'bot' ? format(text) : '<p style="margin:0">' + esc(text) + '</p>') + '<span class="time">' + esc(extra && extra.time || time()) + '</span>';
    log.appendChild(el); log.scrollTop = log.scrollHeight; return el;
  }
  function chips(list) {
    $$('.followups', log).forEach(n => n.remove()); if (!list || !list.length) return;
    const w = document.createElement('div'); w.className = 'chip-row followups'; w.innerHTML = list.map(s => `<button class="chip" type="button" data-q="${esc(s)}">${esc(s)}</button>`).join('');
    log.appendChild(w); log.scrollTop = log.scrollHeight;
  }

  async function send(text) {
    text = text.trim(); if (!text || waiting) return;
    if (text.length > 400) return UI.toast('Please keep questions under 400 characters.', 'error');
    waiting = true; $('#sendBtn').disabled = true; input.value = '';
    $$('.followups', log).forEach(n => n.remove());
    history.push({ role: 'user', text, time: time() }); add('user', text);
    const typing = document.createElement('div'); typing.className = 'msg bot'; typing.innerHTML = '<span class="typing" aria-label="Coach is typing"><i></i><i></i><i></i></span>'; log.appendChild(typing); log.scrollTop = log.scrollHeight;
    try {
      const started = Date.now(); const r = await API.chatbot.send(text, history);
      if (!API.config.useBackend) await new Promise(res => setTimeout(res, Math.max(0, 650 - (Date.now() - started))));   // small pause so the demo feels conversational
      typing.remove(); history.push({ role: 'bot', text: r.reply, time: time() }); add('bot', r.reply); chips(r.suggestions);
      await API.chatbot.saveHistory(history.slice(-60));
    } catch (err) {
      typing.remove(); const m = err && err.message ? err.message : 'The coach could not answer.';
      const el = add('bot', 'Sorry, I could not get an answer. ' + m); el.style.borderColor = 'var(--danger)';
      const retry = document.createElement('button'); retry.className = 'btn sm secondary mt-1'; retry.type = 'button'; retry.textContent = 'Try again'; retry.onclick = () => { retry.remove(); history.pop(); log.lastChild && el.remove(); send(text); }; el.appendChild(retry);
    }
    waiting = false; $('#sendBtn').disabled = false; input.focus();
  }

  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); if (!input.value.trim()) { UI.toast('Type a question first.', 'error'); return; } send(input.value); });
  log.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) send(b.dataset.q); });

  /* suggestion panel */
  const topics = Object.keys(DemoData.chatSuggestions); let activeTopic = topics[0];
  function renderTopics() {
    $('#topicTabs').innerHTML = topics.map(t => `<button class="tab ${t === activeTopic ? 'active' : ''}" role="tab" aria-selected="${t === activeTopic}" data-t="${t}">${t}</button>`).join('');
    $('#suggestList').innerHTML = DemoData.chatSuggestions[activeTopic].map(s => `<button class="chip" type="button" style="text-align:left;border-radius:12px" data-q="${esc(s)}">${esc(s)}</button>`).join('');
  }
  $('#topicTabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) { activeTopic = b.dataset.t; renderTopics(); } });
  $('#suggestList').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (b) send(b.dataset.q); });
  renderTopics();

  $('#clearChat').addEventListener('click', async () => {
    if (!history.length) return UI.toast('The chat is already empty.', 'info');
    if (!await UI.confirm({ title: 'Clear chat history?', message: 'All messages in this conversation will be deleted.', confirmText: 'Clear chat', danger: true })) return;
    try { await API.chatbot.clearHistory(); history = []; log.innerHTML = ''; welcome(); UI.toast('Chat cleared.'); } catch (e) { UI.fail(e); }
  });

  function welcome() { add('bot', `Hi ${((API.auth.session() || {}).user || {}).name || 'there'}! I am the FORMA demo coach. Pick a suggested question or type your own about workouts, nutrition, fitness or recovery.`); }
  (async function init() {
    if (API.config.useBackend) $('#botStatus').textContent = 'Connected to your server';
    try { history = await API.chatbot.history(); } catch (e) { history = []; }
    if (!history.length) welcome(); else history.forEach(m => add(m.role, m.text, { time: m.time }));
  })();
});
