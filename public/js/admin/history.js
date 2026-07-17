// Ticket History Module for Admin Panel
const historyState = {
    page: 1,
    limit: 10,
    search: '',
    totalPages: 0
};

function loadTicketHistory(search = historyState.search, page = 1) {
    historyState.search = String(search || '').trim();
    historyState.page = Math.max(Number(page) || 1, 1);

    const $list = $('#history-list').html('<tr><td colspan="9" class="history-loading">Loading ticket history…</td></tr>');

    $.get('/api/admin/tickets/all', {
        search: historyState.search,
        page: historyState.page,
        limit: historyState.limit
    }, function (payload) {
        const tickets = Array.isArray(payload) ? payload : (payload.tickets || []);
        const pagination = payload.pagination || {
            page: 1,
            limit: historyState.limit,
            totalRows: tickets.length,
            totalPages: tickets.length ? 1 : 0,
            hasPrevious: false,
            hasNext: false
        };

        historyState.page = pagination.page;
        historyState.totalPages = pagination.totalPages;
        $list.empty();

        if (!tickets.length) {
            $list.append('<tr><td colspan="9" class="history-empty"><strong>No tickets found</strong><span>Try a different ticket number, service, status, or teller.</span></td></tr>');
            renderHistoryPagination(pagination);
            return;
        }

        tickets.forEach(ticket => {
            const duration = ticket.duration_minutes ? `${Math.round(ticket.duration_minutes)} min` : '—';
            const ticketNumber = `${ticket.ticketservice || ''}${ticket.ticketnum || ''}`;
            $list.append(`
                <tr>
                    <td><strong>${escapeHistoryHtml(ticketNumber)}</strong></td>
                    <td>${escapeHistoryHtml(ticket.sname || ticket.ticketservice || '—')}</td>
                    <td><span class="status-badge status-${escapeHistoryHtml(ticket.status || 'unknown')}">${escapeHistoryHtml(ticket.status || 'Unknown')}</span></td>
                    <td>${escapeHistoryHtml(ticket.counter_user || ticket.teller_name || '—')}</td>
                    <td>${escapeHistoryHtml(ticket.date || '—')}</td>
                    <td>${escapeHistoryHtml(ticket.start_time || '—')}</td>
                    <td>${escapeHistoryHtml(ticket.end_time || '—')}</td>
                    <td>${duration}</td>
                    <td><div class="actions"><button class="btn btn-sm btn-primary" onclick="viewTicketDetails(${Number(ticket.id)})">View journey</button></div></td>
                </tr>
            `);
        });

        renderHistoryPagination(pagination);
    }).fail(function (err) {
        console.error('Failed to load ticket history:', err);
        $list.html('<tr><td colspan="9" class="history-empty"><strong>Unable to load ticket history</strong><span>Please try refreshing this page.</span></td></tr>');
        showMsg('error', 'Unable to load ticket history.');
    });
}

function renderHistoryPagination(pagination) {
    const totalRows = Number(pagination.totalRows || 0);
    const totalPages = Number(pagination.totalPages || 0);
    const currentPage = Number(pagination.page || 1);
    const start = totalRows ? ((currentPage - 1) * historyState.limit) + 1 : 0;
    const end = totalRows ? Math.min(currentPage * historyState.limit, totalRows) : 0;

    $('#history-range').text(`${start}–${end}`);
    $('#history-total').text(totalRows);
    $('#history-prev').prop('disabled', !pagination.hasPrevious);
    $('#history-next').prop('disabled', !pagination.hasNext);

    const $pages = $('#history-pages').empty();
    if (!totalPages) return;

    const candidates = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const pages = [...candidates].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);

    pages.forEach((page, index) => {
        if (index && page - pages[index - 1] > 1) $pages.append('<span class="pagination-gap">…</span>');
        $pages.append(`<button type="button" class="pagination-page ${page === currentPage ? 'active' : ''}" data-history-page="${page}">${page}</button>`);
    });
}

$(document).on('click', '#history-prev', function () {
    if (historyState.page > 1) loadTicketHistory(historyState.search, historyState.page - 1);
});

$(document).on('click', '#history-next', function () {
    if (historyState.page < historyState.totalPages) loadTicketHistory(historyState.search, historyState.page + 1);
});

$(document).on('click', '[data-history-page]', function () {
    loadTicketHistory(historyState.search, Number($(this).data('history-page')));
});

window.viewTicketDetails = function (id) {
    $.get(`/api/admin/tickets/details/${id}`, function (data) {
        const ticket = data.ticket || {};
        const events = Array.isArray(data.timeline) ? data.timeline : [];
        const $journey = $('#ticket-journey-timeline').empty();

        $('#journey-modal-title').text(`Ticket ${ticket.number || data.ticket_id || ''}`);
        $('#journey-modal-subtitle').text(`${ticket.service || 'Service journey'} · ${ticket.date || 'Date unavailable'}`);

        if (!events.length) {
            $journey.html('<div class="journey-empty"><strong>No journey events recorded</strong><span>This ticket does not contain process-history entries.</span></div>');
        } else {
            const winding = events.length >= 4;
            const columns = winding ? Math.ceil(events.length / 2) : events.length;
            const mapPoints = events.map((event, index) => {
                if (!winding) return { x: ((index + 0.5) / columns) * 100, y: 50 };
                const isTopRow = index < columns;
                const column = isTopRow ? index : columns - 1 - (index - columns);
                return { x: ((column + 0.5) / columns) * 100, y: isTopRow ? 8 : 58 };
            });
            const mapPath = mapPoints.reduce((path, point, index) => {
                if (!index) return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
                const previous = mapPoints[index - 1];
                const changesRow = previous.y !== point.y;
                if (changesRow) {
                    const bendX = Math.max(2, Math.min(98, point.x + (point.x >= 50 ? 5.5 : -5.5))).toFixed(2);
                    return `${path} C ${bendX} ${previous.y.toFixed(2)}, ${bendX} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
                }
                const firstControlX = (previous.x + ((point.x - previous.x) * .36)).toFixed(2);
                const secondControlX = (previous.x + ((point.x - previous.x) * .64)).toFixed(2);
                return `${path} C ${firstControlX} ${previous.y.toFixed(2)}, ${secondControlX} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
            }, '');
            const steps = events.map((event, index) => {
                const presentation = getJourneyPresentation(event.event);
                const actor = event.counter
                    ? `${event.actor || 'Teller'} · Counter ${event.counter}`
                    : (event.actor || 'System');
                const isTopRow = !winding || index < columns;
                const column = winding
                    ? (isTopRow ? index : columns - 1 - (index - columns)) + 1
                    : index + 1;
                const row = winding ? (isTopRow ? 1 : 2) : 1;

                return `
                    <article class="journey-step ${presentation.type}" style="--journey-column:${column};--journey-row:${row}">
                        <div class="journey-node"><span>${presentation.icon}</span><b>${String(index + 1).padStart(2, '0')}</b></div>
                        <div class="journey-event-card">
                            <span class="journey-time">${escapeHistoryHtml(event.time || '—')}</span>
                            <h4>${presentation.label}</h4>
                            <p>${escapeHistoryHtml(actor)}</p>
                        </div>
                    </article>
                `;
            }).join('');

            $journey.html(`
                <div class="journey-overview">
                    <div><span>Current status</span><strong>${escapeHistoryHtml(ticket.status || 'Unknown')}</strong></div>
                    <div><span>Created</span><strong>${escapeHistoryHtml(ticket.created_time || '—')}</strong></div>
                    <div><span>Service started</span><strong>${escapeHistoryHtml(ticket.start_time || '—')}</strong></div>
                    <div><span>Service ended</span><strong>${escapeHistoryHtml(ticket.end_time || '—')}</strong></div>
                </div>
                <div class="journey-chart-scroll">
                    <div class="journey-line-chart ${winding ? 'journey-winding-map' : ''}" style="--journey-steps:${events.length};--journey-columns:${columns}">
                        ${winding ? `<svg class="journey-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${mapPath}"></path></svg>` : ''}
                        ${steps}
                    </div>
                </div>
                <div class="journey-axis"><span>Start</span><span>Ticket progression</span><span>End</span></div>
            `);
        }

        $('#ticket-modal-overlay').css('display', 'grid');
    }).fail(function (err) {
        console.error('Failed to load ticket details:', err);
        showMsg('error', 'Unable to load ticket details.');
    });
};

function getJourneyPresentation(eventName) {
    const value = String(eventName || 'Event').toLowerCase();
    if (value.includes('void')) return { type: 'voided', icon: '×', label: 'Voided' };
    if (value.includes('finish') || value.includes('complete')) return { type: 'finished', icon: '✓', label: value.includes('auto') ? 'Auto-finished' : 'Completed' };
    if (value.includes('forward')) return { type: 'forwarded', icon: '→', label: 'Forwarded' };
    if (value.includes('hold') || value.includes('held')) return { type: 'held', icon: 'Ⅱ', label: 'Held' };
    if (value.includes('recall')) return { type: 'recalled', icon: '↻', label: 'Recalled' };
    if (value.includes('call')) return { type: 'called', icon: '⌁', label: 'Called' };
    if (value.includes('insert') || value.includes('create')) return { type: 'created', icon: '+', label: 'Ticket created' };
    if (value.includes('receive')) return { type: 'received', icon: '↓', label: 'Received' };
    return { type: 'standard', icon: '•', label: escapeHistoryHtml(eventName || 'Event') };
}

function escapeHistoryHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

$(document).on('click', '.close-ticket-modal', function () {
    $('#ticket-modal-overlay').hide();
});
