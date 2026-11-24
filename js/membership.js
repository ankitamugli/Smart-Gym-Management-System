
/* =========================================================
   FORMA - Membership
   Connected to Spring Boot Membership APIs
   ========================================================= */

Page.ready(() => {
    const currentPlanEl = document.getElementById('currentPlan');
    const autoRenewEl = document.getElementById('autoRenew');
    const prefForm = document.getElementById('prefForm');
    const planGrid = document.getElementById('planGrid');
    const historyList = document.getElementById('historyList');
    const histCount = document.getElementById('histCount');
    const cycleSeg = document.getElementById('cycleSeg');
    const renewCycle = document.getElementById('renewCycle');
    const reminder = document.getElementById('reminder');
    const payMethod = document.getElementById('payMethod');

    let currentMembership = null;
    let membershipPlans = [];

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[char]);
    }

    function formatMoney(value) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function formatDate(value) {
        if (!value) return 'Not available';

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return escapeHtml(value);

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function showMessage(message, type = 'info') {
        const notice = document.createElement('div');
        notice.className = `notice ${type}`;
        notice.textContent = message;

        document.getElementById('content').prepend(notice);

        setTimeout(() => notice.remove(), 4000);
    }

    function renderCurrent() {
        if (!currentMembership) {
            currentPlanEl.innerHTML = `
                <div class="card">
                    <h3>No active membership</h3>
                    <p class="muted">
                        You do not have an active membership yet.
                        Choose a plan below to subscribe.
                    </p>
                </div>
            `;

            autoRenewEl.checked = false;
            autoRenewEl.disabled = true;
            return;
        }

        const membership = currentMembership;

        currentPlanEl.innerHTML = `
            <div class="card">
                <span class="demo-tag">Current Membership</span>
                <h2>${escapeHtml(membership.planName)}</h2>

                <h3>${formatMoney(membership.price)}</h3>

                <p class="muted">
                    Status:
                    <b>${escapeHtml(membership.status)}</b>
                </p>

                <div class="mt-2">
                    <p>
                        <b>Start date:</b>
                        ${formatDate(membership.startDate)}
                    </p>

                    <p>
                        <b>Expiry date:</b>
                        ${formatDate(membership.expiryDate)}
                    </p>

                    <p>
                        <b>Days remaining:</b>
                        ${Number(membership.daysLeft) || 0}
                    </p>
                </div>
            </div>
        `;

        autoRenewEl.checked = Boolean(membership.autoRenew);
        autoRenewEl.disabled = false;
    }

    function renderPlans() {
        if (!membershipPlans.length) {
            planGrid.innerHTML = `
                <div class="card">
                    No membership plans are currently available.
                </div>
            `;
            return;
        }

        planGrid.innerHTML = membershipPlans.map(plan => {
            const isCurrent = currentMembership &&
                currentMembership.planName === plan.name &&
                String(currentMembership.status).toUpperCase() === 'ACTIVE';

            return `
                <div class="card">
                    <div class="card-head">
                        <h3>${escapeHtml(plan.name)}</h3>
                    </div>

                    <h2>${formatMoney(plan.price)}</h2>

                    <p class="muted">
                        ${Number(plan.durationInMonths) || 0} month(s)
                    </p>

                    <p>
                        ${escapeHtml(plan.description || 'Gym membership plan')}
                    </p>

                    <button
                        class="btn block"
                        type="button"
                        data-plan-id="${escapeHtml(plan.id)}"
                        ${isCurrent || currentMembership ? 'disabled' : ''}
                    >
                        ${isCurrent ? 'Current Plan' :
                          currentMembership ? 'Active Membership Exists' :
                          'Choose Plan'}
                    </button>
                </div>
            `;
        }).join('');
    }

    function renderHistory(history) {
        histCount.textContent = `${history.length} record(s)`;

        if (!history.length) {
            historyList.innerHTML = `
                <p class="muted">No membership history available.</p>
            `;
            return;
        }

        historyList.innerHTML = `
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Plan</th>
                            <th>Price</th>
                            <th>Start date</th>
                            <th>Expiry date</th>
                            <th>Status</th>
                            <th>Auto-renew</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${history.map(item => `
                            <tr>
                                <td>${escapeHtml(item.planName)}</td>
                                <td>${formatMoney(item.price)}</td>
                                <td>${formatDate(item.startDate)}</td>
                                <td>${formatDate(item.expiryDate)}</td>
                                <td>${escapeHtml(item.status)}</td>
                                <td>${item.autoRenew ? 'Yes' : 'No'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function loadMembership() {
        try {
            const results = await Promise.all([
                API.membership.plans(),
                API.membership.current(),
                API.membership.history()
            ]);

            membershipPlans = Array.isArray(results[0]) ? results[0] : [];
            currentMembership = results[1] || null;

            renderCurrent();
            renderPlans();
            renderHistory(Array.isArray(results[2]) ? results[2] : []);

        } catch (error) {
            console.error('Membership loading error:', error);

            showMessage(
                error.message || 'Unable to load membership details.',
                'warn'
            );
        }
    }

    planGrid.addEventListener('click', async event => {
        const button = event.target.closest('[data-plan-id]');

        if (!button || button.disabled) return;

        const planId = Number(button.dataset.planId);

        if (!planId) {
            showMessage('Invalid membership plan.', 'warn');
            return;
        }

        const confirmed = window.confirm(
            'Do you want to subscribe to this membership plan?'
        );

        if (!confirmed) return;

        button.disabled = true;
        button.textContent = 'Please wait...';

        try {
            await API.membership.subscribe({
                planId: planId,
                autoRenew: false
            });

            showMessage('Membership subscribed successfully!', 'success');

            await loadMembership();

        } catch (error) {
            console.error('Subscription error:', error);

            showMessage(
                error.message || 'Unable to subscribe to this plan.',
                'warn'
            );

            button.disabled = false;
            button.textContent = 'Choose Plan';
        }
    });

    prefForm.addEventListener('submit', async event => {
        event.preventDefault();

        if (!currentMembership) {
            showMessage('Please subscribe to a plan first.', 'warn');
            return;
        }

        const enabled = autoRenewEl.checked;

        try {
            const button = prefForm.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = 'Saving...';

            await API.membership.savePreferences(
                currentMembership.id,
                enabled
            );

            showMessage('Auto-renew preference updated!', 'success');

            await loadMembership();

        } catch (error) {
            console.error('Auto-renew error:', error);

            showMessage(
                error.message || 'Unable to update auto-renew preference.',
                'warn'
            );

        } finally {
            const button = prefForm.querySelector('button[type="submit"]');
            button.disabled = false;
            button.textContent = 'Save preferences';
        }
    });

    // These options are not supported by the current backend.
    cycleSeg.hidden = true;
    renewCycle.closest('.field').hidden = true;
    reminder.closest('.field').hidden = true;

    payMethod.innerHTML = `
        <span class="muted">
            Payment gateway is not connected.
        </span>
    `;

    loadMembership();
});
