
/* ==========================================================================
   FORMA - CHATBOT.JS
   Connected to Spring Boot FitnessChatbotController
   ========================================================================== */

DemoEngines.chatbot = function (message) {
    const q = ' ' + message.toLowerCase().replace(/[^\w\s-]/g, ' ') + ' ';

    const red = [
        'chest pain', 'faint', 'dizzy', 'injury', 'injured',
        'pain', 'dislocat', 'surgery', 'pregnan',
        'eating disorder', 'starve', 'diabetes', 'blood pressure'
    ];

    if (red.some(w => q.includes(w))) {
        return {
            reply: 'Please consult a qualified doctor or physiotherapist before training through pain or medical conditions.',
            suggestions: ['Do I need rest days?', 'How do I reduce muscle soreness?']
        };
    }

    let best = null;
    let bestScore = 0;

    DemoData.chatTopics.forEach(t => {
        const score = t.keywords.reduce((a, k) =>
            a + (q.includes(k.includes(' ') ? k : ' ' + k)
                ? (k.length > 5 ? 2 : 1) : 0), 0);

        if (score > bestScore) {
            best = t;
            bestScore = score;
        }
    });

    if (!best) {
        return {
            reply: DemoData.chatFallback,
            suggestions: [
                'How many days a week should I train?',
                'How much protein do I need?',
                'How much sleep do I need?'
            ]
        };
    }

    return {
        reply: best.answer,
        suggestions: ['How much protein do I need?', 'How many days a week should I train?']
    };
};


Page.ready(function () {

    let history = [];
    let waiting = false;

    const log = $('#chatLog');
    const input = $('#chatInput');

    const time = () =>
        new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });

    // Convert backend time into display time
    function formatTime(value) {
        if (!value) return time();

        const date = new Date(value);

        if (isNaN(date.getTime())) return time();

        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Read Spring Boot ApiResponse data
    function unwrap(response) {
        return response?.data ?? response;
    }

    // Convert backend ChatResponse into UI messages
    function normalizeHistory(records) {

        const data = unwrap(records);

        if (!Array.isArray(data)) return [];

        const messages = [];

        data.forEach(chat => {

            if (chat.message) {
                messages.push({
                    role: 'user',
                    text: chat.message,
                    time: formatTime(chat.createdAt),
                    chatId: chat.id
                });
            }

            if (chat.response) {
                messages.push({
                    role: 'bot',
                    text: chat.response,
                    time: formatTime(chat.createdAt),
                    chatId: chat.id
                });
            }
        });

        return messages;
    }

    // Convert backend chatbot response
    function normalizeChatResponse(response) {

        const result = unwrap(response);

        return {
            reply:
                result?.response ||
                result?.reply ||
                result?.message ||
                'Sorry, I could not generate a response.',

            suggestions: Array.isArray(result?.suggestions)
                ? result.suggestions
                : [],

            chatId: result?.id
        };
    }

    // Safe text formatting
    function format(text) {

        const lines = String(text).split('\n');

        let html = '';
        let inList = false;

        lines.forEach(line => {

            if (/^\s*-\s+/.test(line)) {

                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }

                html += '<li>' +
                    esc(line.replace(/^\s*-\s+/, '')) +
                    '</li>';

            } else {

                if (inList) {
                    html += '</ul>';
                    inList = false;
                }

                if (line.trim()) {
                    html += '<p style="margin:0 0 .4rem">' +
                        esc(line) +
                        '</p>';
                }
            }
        });

        return html + (inList ? '</ul>' : '');
    }

    // Add message to screen
    function add(role, text, extra = {}) {

        const el = document.createElement('div');

        el.className = 'msg ' + role;

        el.innerHTML =
            (role === 'bot'
                ? format(text)
                : '<p style="margin:0">' + esc(text) + '</p>') +
            '<span class="time">' +
            esc(extra.time || time()) +
            '</span>';

        log.appendChild(el);
        log.scrollTop = log.scrollHeight;

        return el;
    }

    // Show suggestion buttons
    function chips(list) {

        $$('.followups', log).forEach(n => n.remove());

        if (!list || !list.length) return;

        const wrapper = document.createElement('div');

        wrapper.className = 'chip-row followups';

        wrapper.innerHTML = list.map(s =>
            `<button class="chip" type="button" data-q="${esc(s)}">${esc(s)}</button>`
        ).join('');

        log.appendChild(wrapper);
        log.scrollTop = log.scrollHeight;
    }

    // Send message
    async function send(text) {

        text = text.trim();

        if (!text || waiting) return;

        if (text.length > 400) {
            return UI.toast(
                'Please keep questions under 400 characters.',
                'error'
            );
        }

        waiting = true;
        $('#sendBtn').disabled = true;
        input.value = '';

        $$('.followups', log).forEach(n => n.remove());

        const userMessage = {
            role: 'user',
            text: text,
            time: time()
        };

        history.push(userMessage);
        add('user', text);

        const typing = document.createElement('div');

        typing.className = 'msg bot';

        typing.innerHTML =
            '<span class="typing" aria-label="Coach is typing"><i></i><i></i><i></i></span>';

        log.appendChild(typing);
        log.scrollTop = log.scrollHeight;

        try {

            const started = Date.now();

            const rawResponse = await API.chatbot.send(text, history);

            if (!API.config.useBackend) {
                await new Promise(resolve =>
                    setTimeout(resolve, Math.max(0, 650 - (Date.now() - started)))
                );
            }

            const result = normalizeChatResponse(rawResponse);

            typing.remove();

            // Attach backend chat ID to user message
            userMessage.chatId = result.chatId;

            const botMessage = {
                role: 'bot',
                text: result.reply,
                time: time(),
                chatId: result.chatId
            };

            history.push(botMessage);

            add('bot', result.reply);

            chips(result.suggestions);

            await API.chatbot.saveHistory(history.slice(-60));

            console.log('Chatbot response:', result);

        } catch (err) {

            typing.remove();

            console.error('Chatbot error:', err);

            const message = err?.message ||
                'The coach could not answer.';

            const el = add(
                'bot',
                'Sorry, I could not get an answer. ' + message
            );

            el.style.borderColor = 'var(--danger)';

            const retry = document.createElement('button');

            retry.className = 'btn sm secondary mt-1';
            retry.type = 'button';
            retry.textContent = 'Try again';

            retry.onclick = () => {
                retry.remove();
                history.pop();
                el.remove();
                send(text);
            };

            el.appendChild(retry);

        } finally {

            waiting = false;
            $('#sendBtn').disabled = false;
            input.focus();
        }
    }

    // Chat form
    $('#chatForm').addEventListener('submit', e => {

        e.preventDefault();

        if (!input.value.trim()) {
            UI.toast('Type a question first.', 'error');
            return;
        }

        send(input.value);
    });

    // Follow-up buttons
    log.addEventListener('click', e => {

        const button = e.target.closest('[data-q]');

        if (button) {
            send(button.dataset.q);
        }
    });

    // Suggestion panel
    const topics = Object.keys(DemoData.chatSuggestions);

    let activeTopic = topics[0];

    function renderTopics() {

        $('#topicTabs').innerHTML = topics.map(t =>
            `<button class="tab ${t === activeTopic ? 'active' : ''}"
                role="tab"
                aria-selected="${t === activeTopic}"
                data-t="${t}">${t}</button>`
        ).join('');

        $('#suggestList').innerHTML =
            DemoData.chatSuggestions[activeTopic].map(s =>
                `<button class="chip" type="button"
                    style="text-align:left;border-radius:12px"
                    data-q="${esc(s)}">${esc(s)}</button>`
            ).join('');
    }

    $('#topicTabs').addEventListener('click', e => {

        const button = e.target.closest('[data-t]');

        if (button) {
            activeTopic = button.dataset.t;
            renderTopics();
        }
    });

    $('#suggestList').addEventListener('click', e => {

        const button = e.target.closest('[data-q]');

        if (button) {
            send(button.dataset.q);
        }
    });

    renderTopics();

    // Clear all chat history
    $('#clearChat').addEventListener('click', async () => {

        if (!history.length) {
            return UI.toast('The chat is already empty.', 'info');
        }

        const confirmed = await UI.confirm({
            title: 'Clear chat history?',
            message: 'All messages in this conversation will be deleted.',
            confirmText: 'Clear chat',
            danger: true
        });

        if (!confirmed) return;

        try {

            if (API.config.useBackend) {

                // Each backend record has its own ID
                const chatIds = [
                    ...new Set(
                        history
                            .map(item => item.chatId)
                            .filter(id => id !== undefined && id !== null)
                    )
                ];

                for (const id of chatIds) {
                    await API.chatbot.clearHistory(id);
                }
            }

            history = [];

            await API.chatbot.saveHistory([]);

            log.innerHTML = '';

            welcome();

            UI.toast('Chat cleared.');

        } catch (error) {

            console.error('Clear chat error:', error);

            UI.fail(error);
        }
    });

    // Welcome message
    function welcome() {

        const name =
            ((API.auth.session() || {}).user || {}).name || 'there';

        add(
            'bot',
            `Hi ${name}! I am the FORMA fitness coach. Ask me about workouts, nutrition, fitness or recovery.`
        );
    }

    // Load chat history from backend
    async function init() {

        if (API.config.useBackend) {
            $('#botStatus').textContent = 'Connected to your server';
        }

        try {

            const response = await API.chatbot.history();

            history = normalizeHistory(response);

            console.log('Chat history loaded:', history);

        } catch (error) {

            console.error('Chat history error:', error);

            history = [];
        }

        if (!history.length) {

            welcome();

        } else {

            history.forEach(message => {
                add(message.role, message.text, {
                    time: message.time
                });
            });
        }
    }

    init();

});
