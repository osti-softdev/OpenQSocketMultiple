function checkSession() {
    $.ajax({
        url: '/api/check-session',
        method: 'GET',
        success: function (response) {
            if (response.loggedIn) {
                if (response.teller.role === 'admin') {
                    window.location.href = '/admin';
                    return;
                }
                currentTeller = response.teller;
                setAuthUser(currentTeller);
                showTellerSection();
                initDashboard();
            } else {
                showLoginSection();
            }
        }
    });
}
// ^ DASHBOARD INITIALIZATION
function initDashboard() {
    createServiceBoxes();
    loadQueueData();
    loadHeldTickets();
    loadForwardedTickets();
    
    // Check if teller is currently serving a ticket (refresh case)
    $.ajax({
        url: '/api/tickets/called',
        method: 'GET',
        success: function (tickets) {
            const myTicket = tickets.find(
                t => Number(t.counter_num) === Number(currentTeller.counter_number)
            );
            if (myTicket) {
                if(myTicket.status === 'held' || myTicket.status === 'received' || myTicket.status === 'voided' || myTicket.status === 'finished') {
                    return;
                }
                currentTicket = myTicket;
                displayCurrentTicket(myTicket);
            }
        }
    });
}

function refreshTellerAssignment() {
    const previousServices = currentTeller ? currentTeller.services : '';

    $.ajax({
        url: '/api/check-session',
        method: 'GET',
        success: function (response) {
            if (!response.loggedIn) {
                showLoginSection();
                return;
            }

            currentTeller = response.teller;
            setAuthUser(currentTeller);
            showTellerSection();
            createServiceBoxes();
            loadQueueData();
            loadHeldTickets();
            loadForwardedTickets();
            loadHistory();

            if (previousServices !== currentTeller.services) {
                showMsg('success', 'Your assigned services were updated.');
            }
        }
    });
}
// ^ Auto-call next ticket for any service
$('#auto-call-btn').click(function () {
        if (!currentTeller) return;
        callNext('auto');
});
// ^ Search functionality for waiting queue
 $('#queue-search').on('input', function () {
        const val = $(this).val().toLowerCase();
        $('.queue-item').each(function () {
            const text = $(this).text().toLowerCase();
            $(this).toggle(text.indexOf(val) > -1);
        });
});
// ^ DISPLAY LOGIN SECTION
function showLoginSection() {
    window.location.href = '/312Xtellerlogin';
    $('#tellerSec').hide();
    $('#username').val('');
    $('#password').val('');
}
// ^ DISPLAY TELLER SECTION
function showTellerSection() {
    $('#loginSec').hide();
    $('#tellerSec').show();
    $('#counter-number').text("Counter "+currentTeller.counter_number);
    $('#teller-username').text(currentTeller.username);
    $('#avatar-initials').text(currentTeller.username.charAt(0).toUpperCase()+currentTeller.counter_number);
}
// ^ Load queue data
function loadQueueData() {
    if (!currentTeller) return;

    $.ajax({
        url: '/api/tickets/waiting',
        method: 'GET',
        data: {
            services: currentTeller.services,
            tellerId: currentTeller.id,
            groupId: currentTeller.group_id
        },
        success: function (tickets) {
            displayWaitingQueue(tickets);
            updatePendingCounts(tickets);
        }
    });

    // $.ajax({
    //     url: '/api/tickets/called',
    //     method: 'GET',
    //     success: function (tickets) {
    //         updateLastCalled(tickets);
    //     }
    // });

    $.ajax({
        url: '/api/tickets/last_called',
        method: 'GET',
        success: function (tickets) {
            updateLastCalled(tickets);
        }
    });
}

function updateTicketCountBadge(buttonSelector, count) {
    const ticketCount = Math.max(0, Number(count) || 0);
    const $badge = $(`${buttonSelector} .ticket-count-badge`);

    $badge
        .text(ticketCount > 99 ? '99+' : ticketCount)
        .toggleClass('has-tickets', ticketCount > 0)
        .attr('aria-hidden', ticketCount > 0 ? 'false' : 'true');
}

function getTicketServiceName(ticket) {
    return String(ticket.shortSname || ticket.sname || '').replace(/_/g, ' ');
}

// ^ Load Held Tickets
function loadHeldTickets() {
    if (!currentTeller) return;

    $.get('/api/tickets/held', { tellerId: currentTeller.counter_number }, function(tickets) {
        const $queue = $('#held-queue');
        $queue.empty();

        if (tickets.length === 0) {
            $queue.html('<div class="empty-list">No held tickets</div>');
            updateTicketCountBadge('.heldTickets', 0);
            return;
        }

        updateTicketCountBadge('.heldTickets', tickets.length);

        // Held Tickets Render Update
        tickets.forEach(ticket => {
        const isPriority = ticket.priority === 1;
            const $item = $(`
                <div class="queue-item ${isPriority ? 'priority' : ''}">
                    <div class="queue-item-info">
                        <h4>${ticket.ticketservice}${ticket.ticketnum}</h4>
                        <span>${getTicketServiceName(ticket)}</span>
                    </div>
                    <div class="queue-actions">
                        <button class="btn btn-secondary btn-sm forward-held-btn">Forward</button>
                        <button class="btn btn-success btn-sm resume-held-btn">Resume</button>
                    </div>
                </div>
            `);

            $item.find('.resume-held-btn').click(() => resumeHeldTicket(ticket.id));
            $item.find('.forward-held-btn').click(() => openForwardModal(ticket));
            $queue.append($item);
        });
    });
}
// ^ Load Forwarded Tickets
function loadForwardedTickets() {
    if (!currentTeller) return;

    $.get('/api/tickets/forwarded', { 
        tellerId: currentTeller.id, 
        groupId: currentTeller.group_id 
    }, function(tickets) {
        const $queue = $('#forward-queue');
        $queue.empty();

        if (tickets.length === 0) {
            $queue.html('<div class="empty-list">No received tickets</div>');
            updateTicketCountBadge('.forwardTickets', 0);
            return;
        }

        updateTicketCountBadge('.forwardTickets', tickets.length);

        tickets.forEach(ticket => {
        const isPriority = ticket.priority === 1;
            const $item = $(`
                <div class="queue-item ${isPriority ? 'priority' : ''}">
                    <div class="queue-item-info">
                        <h4>${ticket.ticketservice}${ticket.ticketnum}</h4>
                        <span>${getTicketServiceName(ticket)} - From: ${ticket.from_teller_name}</span>
                        ${ticket.note ? `<small>${ticket.note}</small>` : ''}
                    </div>
                    <div class="queue-actions">
                        <button class="btn btn-secondary btn-sm forward-received-btn">Forward</button>
                        <button class="btn btn-primary btn-sm call-received-btn">Call</button>
                    </div>
                </div>
            `);

            $item.find('.call-received-btn').click(() => callSpecificTicket(ticket.id));
            $item.find('.forward-received-btn').click(() => openForwardModal(ticket));
            $queue.append($item);
        });
    });
}
// ^ Load History
function loadHistory() {
    if (!currentTeller) return;

    $.get('/api/tickets/history', { 
          counterNumber: currentTeller.counter_number, cname: currentTeller.username,
    }, function (tickets) {
        const $list = $('#history-list');
        $list.empty();
        if (tickets.length === 0) {
            $list.append('<tr><td colspan="6" style="text-align:center">No history yet</td></tr>');
            return;
        }

        tickets.forEach(t => {
            if (!t.start_time) {
                return;
            }

            const startDate = new Date(`${t.date}T${t.start_time}`);
            if (isNaN(startDate)) {
                return;
            }

            const isServing = t.status === 'calling' || t.status === 'called';
            let durationLabel = 'In progress';
            if (!isServing && t.end_time) {
                const endDate = new Date(`${t.date}T${t.end_time}`);
                if (!isNaN(endDate)) {
                    const durationSeconds = Math.max(0, Math.floor((endDate - startDate) / 1000));
                    const mins = Math.floor(durationSeconds / 60);
                    const secs = durationSeconds % 60;
                    durationLabel = `${mins}m ${secs}s`;
                }
            }

            const statusLabel = isServing
                ? 'Serving'
                : String(t.status || '').replace(/_/g, ' ');

            const $row = $(`
                <tr>
                    <td><strong>${t.ticketservice}${t.ticketnum}</strong></td>
                    <td>${statusLabel}</td>
                    <td>${t.start_time}</td>
                    <td>${durationLabel}</td>
                    <td>
                        <div class="history-actions">
                            <button class="btn btn-secondary btn-sm forward-history-btn">Forward</button>
                            <button class="btn btn-primary btn-sm call-again-btn">Call Again</button>
                        </div>
                    </td>
                </tr>
            `);

            
            $row.find('.call-again-btn').click(function() {
                if (currentTicket) {
                    showMsg("warning", `Please complete or hold your current ticket first.`);
                    return;
                }
                callSpecificTicket(t.id);
            });
            $row.find('.forward-history-btn').click(() => openForwardModal(t));

            $list.append($row);
        });
    });
}
// ^ Update last called tickets
function updateLastCalled(calledTickets) {
        const services = currentTeller.services.split(',').map(s => s.trim());

    services.forEach(service => {
        const lastTicket = calledTickets.find(t => t.sname === service);
        $(`#service-box-${service} .last`).text(lastTicket ? lastTicket.ticketservice+lastTicket.ticketnum : '-');
    });
}
// ^ Display current ticket
function displayCurrentTicket(ticket) {
    if(ticket.status === 'held' || ticket.status === 'forwarded' || ticket.status === 'voided' || ticket.status === 'finished') {
        return;
    }
    const $display = $('.currentCalledTicket');
    const ticketSname = getTicketServiceName(ticket);
    $display.html(`
        <div class="active-ticket-info">
            <div class="ticket-num-large">${ticket.ticketservice}${ticket.ticketnum}</div>
            <div class="ticket-service-name">${ticketSname}</div>
            ${ticket.sub_services ? `<div class="ticket-subservice-name" style="font-size:18px;color:#666;">${ticket.sub_services}</div>` : ''}
        </div>
    `);
    $('#start-time').text(ticket.start_time);
    startDurationTimer(ticket.start_time,ticket.date);
}
// ^ Clear Current Ticket
function clearCurrentTicket() {
    $('.currentCalledTicket').html(`
            <p>Ready to serve visitors</p>
    `);
    $('#start-time').text("--");
    stopDurationTimer();
}

let catalogServicesList = [];

// ^ Initialize dashboard services
function createServiceBoxes() {
    const $grid = $('.servicesManage');
    $grid.empty();

    if (!currentTeller || !currentTeller.services) return;
    const services = currentTeller.services.split(',').map(s => s.trim());

    $.get('/api/services', function (response) {
        if (response && response.success && Array.isArray(response.data)) {
            catalogServicesList = response.data;
        }

        services.forEach(service => {
            const $box = $('<div>').addClass('service-box').attr('id', `service-box-${service}`);
            const Sname = service.replace(/_/g, " ");

            const sObj = catalogServicesList.find(x => x.sname === service);
            const subList = (sObj && sObj.sub_services)
                ? sObj.sub_services.split(',').map(sub => sub.trim()).filter(Boolean)
                : [];

            let subServicesHtml = '';
            if (subList.length > 0) {
                subServicesHtml = `
                <div class="sub-service-section" style="margin-top: 10px; border-top: 1px dashed rgba(0,0,0,0.15); padding-top: 8px;">
                    <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px; color: #555; text-transform: uppercase;">Sub Services Call Buttons</div>
                    <div class="sub-service-list" style="display: flex; flex-direction: column; gap: 6px;">
                        ${subList.map(subItem => {
                            const safeSubId = subItem.replace(/[^a-zA-Z0-9]/g, '_');
                            return `
                            <div class="sub-service-row" style="display: flex; align-items: center; justify-content: space-between; gap: 6px; font-size: 12px; background: rgba(0,0,0,0.03); padding: 4px 8px; border-radius: 4px;">
                                <span class="sub-service-title" style="flex: 1; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${subItem}">${subItem}</span>
                                <button class="btn btn-sm btn-primary call-sub-regular" data-service="${service}" data-subservice="${subItem}" style="padding: 2px 6px; font-size: 11px;">Reg (<b class="count-sub-reg-${service}-${safeSubId}">0</b>)</button>
                                <button class="btn btn-sm btn-danger call-sub-priority" data-service="${service}" data-subservice="${subItem}" style="padding: 2px 6px; font-size: 11px;">Pri (<b class="count-sub-pri-${service}-${safeSubId}">0</b>)</button>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                `;
            }

            $box.html(`
                <div class="service-stats">
                    <h5>${Sname}</h5>
                    <div class="stat-item">Last: <span class="last">-</span></div>
                </div>
                <div class="service-btns">
                    <button class="btn btn-primary call-regular" data-service="${service}">Reg ( <b class="count-reg">0</b> )</button>
                    <button class="btn btn-danger call-priority" data-service="${service}">Pri ( <b class="count-pri">0</b> )</button>
                </div>
                ${subServicesHtml}
            `);

            $box.find('.call-regular').click(() => callNext('regular', service));
            $box.find('.call-priority').click(() => callNext('priority', service));

            $box.find('.call-sub-regular').click(function () {
                const s = $(this).data('service');
                const sub = $(this).data('subservice');
                callNextSubService('regular', s, sub);
            });

            $box.find('.call-sub-priority').click(function () {
                const s = $(this).data('service');
                const sub = $(this).data('subservice');
                callNextSubService('priority', s, sub);
            });

            $grid.append($box);
        });
    });
}

// ^ Update pending counts
function updatePendingCounts(tickets) {
    if (!currentTeller || !currentTeller.services) return;
    const services = currentTeller.services.split(',').map(s => s.trim());

    services.forEach(service => {
        const serviceTickets = tickets.filter(
            t => t.status === 'pending' && t.sname === service
        );
        const total = serviceTickets.length;
        const reg = serviceTickets.filter(t => t.priority === 0).length;
        const pri = serviceTickets.filter(t => t.priority === 1).length;

        $(`#service-box-${service} .count`).text(total);
        $(`#service-box-${service} .count-reg`).text(reg);
        $(`#service-box-${service} .count-pri`).text(pri);

        const sObj = catalogServicesList.find(x => x.sname === service);
        if (sObj && sObj.sub_services) {
            const subList = sObj.sub_services.split(',').map(sub => sub.trim()).filter(Boolean);
            subList.forEach(subItem => {
                const safeSubId = subItem.replace(/[^a-zA-Z0-9]/g, '_');
                const subTickets = serviceTickets.filter(t => String(t.sub_services || '').trim() === subItem.trim());
                const subReg = subTickets.filter(t => t.priority === 0).length;
                const subPri = subTickets.filter(t => t.priority === 1).length;

                $(`.count-sub-reg-${service}-${safeSubId}`).text(subReg);
                $(`.count-sub-pri-${service}-${safeSubId}`).text(subPri);
            });
        }
    });
}

// ^ Display waiting queue
function displayWaitingQueue(tickets) {
    const $queue = $('#waiting-queue');
    const visibleTickets = shouldShowReceivedInManualList()
        ? tickets
        : tickets.filter(ticket => ticket.status !== 'received' && Number(ticket.isReceived) !== 1);

    $queue.empty();
    if (visibleTickets.length === 0) {
        $queue.html('<div class="empty-list">No pending tickets</div>');
        updateTicketCountBadge('.pendingTickets', 0);
        return;
    }

    updateTicketCountBadge('.pendingTickets', visibleTickets.length);

    visibleTickets.forEach(ticket => {
        const isPriority = Number(ticket.priority) === 1;
        const isReceived = ticket.status === 'received' || Number(ticket.isReceived) === 1;
        const queueType = isReceived
            ? (isPriority ? 'Priority received' : 'Received')
            : (isPriority ? 'Priority' : 'Regular');
        const $item = $(`
            <div class="queue-item ${isPriority ? 'priority' : ''} ${isReceived ? 'received' : ''}">
                <div class="queue-item-info">
                    <h4>${ticket.ticketservice}${ticket.ticketnum}</h4>
                    <span>${getTicketServiceName(ticket)}</span>
                    ${ticket.sub_services ? `<small style="display:block;color:#555;">Sub: ${ticket.sub_services}</small>` : ''}
                    ${isReceived && ticket.from_teller_name ? `<small>From: ${ticket.from_teller_name}</small>` : ''}
                </div>
                    <span class="ticket-queue-type">${queueType}</span>
                <button class="btn btn-primary btn-sm">Call</button>
            </div>
        `);

        $item.find('button').click(() => callSpecificTicket(ticket.id));
        $queue.append($item);
    });
}

// ^ Call next ticket
function callNext(type, service = null) {
    const data = {
        tellerId: currentTeller.id,
        counterNumber: currentTeller.counter_number,
        counter_group: currentTeller.group_name,
        counter_user: currentTeller.username
    };

    if (type === 'auto') {
        data.mode = 'auto';
    } else {
        $.ajax({
            url: '/api/tickets/waiting',
            method: 'GET',
            data: { services: service },
            success: function (tickets) {
                const priorityValue = type === 'priority' ? 1 : 0;
                const nextTicket = tickets.find(t => t.priority === priorityValue);

                if (nextTicket) {
                    callSpecificTicket(nextTicket.id);
                } else {
                    showMsg("warning", `No ${type} tickets for ${service}`);
                }
            }
        });
        return;
    }

    executeCall(data);
}

function callNextSubService(type, service, subService) {
    $.ajax({
        url: '/api/tickets/waiting',
        method: 'GET',
        data: { services: service },
        success: function (tickets) {
            const priorityValue = type === 'priority' ? 1 : 0;
            const nextTicket = tickets.find(t => t.priority === priorityValue && String(t.sub_services || '').trim() === String(subService || '').trim());

            if (nextTicket) {
                callSpecificTicket(nextTicket.id);
            } else {
                showMsg("warning", `No ${type} tickets for ${subService}`);
            }
        }
    });
}
function callSpecificTicket(ticketId) {
    executeCall({
        ticketId: ticketId,
        tellerId: currentTeller.id,
        counterNumber: currentTeller.counter_number,
        counter_group: currentTeller.group_name,
        counter_user: currentTeller.username
    });
}
// ^ Call EXCECUTE
function executeCall(data) {
    $.ajax({
        url: '/api/tickets/call',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function (response) {
            if (response.success) {
                currentTicket = response.ticket;
                displayCurrentTicket(currentTicket);
                loadQueueData();
                loadHeldTickets();
                loadForwardedTickets();
            } else {
                    showMsg("warning", `${response.message || 'No tickets available'}`);
            }
        }
    });
}
// ^ Recall Ticket
function recallTicket() {
    $.ajax({
        url: '/api/tickets/recall',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ ticketId: currentTicket.id, cname: currentTeller.username, cnum: currentTeller.counter_number }),
        success: function(response) {
            showMsg("info", `Ticket recalled`);
        }
    });
}
// ^ Complete a Ticket
function completeTicket() {
    $.ajax({
            url: '/api/tickets/complete',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ ticketId: currentTicket.id, cname: currentTeller.username, cnum: currentTeller.counter_number }),
            success: function () {
                currentTicket = null;
                stopDurationTimer();
                clearCurrentTicket();
                loadQueueData();
                loadHeldTickets();
                loadForwardedTickets();
                // showMsg("info", `Ticket ${currentTicket} finished`);
            }
        });
}
// ^ Hold a Ticket
function holdTicket() {
    $.ajax({
        url: '/api/tickets/hold',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ ticketId: currentTicket.id, cname: currentTeller.username, cnum: currentTeller.counter_number }),
        success: function() {
            currentTicket = null;
            clearCurrentTicket();
            loadQueueData();
            loadHeldTickets();
            // showMsg("info", `Ticket ${currentTicket} held`);
        }
    });
}
// ^ Resume Held Ticket
function resumeHeldTicket(ticketId) {
    $.ajax({
        url: '/api/tickets/resume',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
            ticketId: ticketId,
            tellerId: currentTeller.id,
            counterNumber: currentTeller.counter_number,
            counter_group: currentTeller.group_name,
            counter_user: currentTeller.username
        }),
        success: function(response) {
            if (response.success) {
                currentTicket = response.ticket;
                displayCurrentTicket(currentTicket);
                loadQueueData();
                loadHeldTickets();

            // showMsg("info", `Ticket ${currentTicket} called`);
            }
        }
    });
}
// ^ TIMER
function startDurationTimer(startTime, ticketDate) {
    stopDurationTimer();

    // Combine date + time properly
    const start = new Date(`${ticketDate}T${startTime}`).getTime();

    if (isNaN(start)) {
        console.error("Invalid start time:", startTime);
        return;
    }

    durationInterval = setInterval(() => {
        const now = Date.now();
        const diff = now - start;

        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        $('#duration-timer').text(
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
    }, 1000);
}
// ^ Stop Timer
function stopDurationTimer() {
    if (durationInterval) clearInterval(durationInterval);
    $('#duration-timer').text('00:00');
    $('#duration-timer').text('00:00');
}
// ^ New Ticket Checker
function isTicketForTeller(ticket) {
    if (!currentTeller) return false;
    return currentTeller.services.split(',').includes(ticket.service);
}
// ^ TIME FORMATTER
function formatTime(isoString) {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
// ^ Forwarding modal show
function openForwardModal(ticket = currentTicket) {
    if (!ticket) return;
    forwardTicketContext = ticket;

    // Load tellers
    $.get('/api/tellers/list', { groupId: currentTeller.group_id, id: currentTeller.id }, function(tellers) {
        const $select = $('#forward-teller-id');
        $select.find('option:not(:first)').remove();
        tellers.forEach(t => {
            if (t.id !== currentTeller.id) {
                $select.append(`<option value="${t.id}">${t.cname} (Counter ${t.cnum})</option>`);
            }
        });
    });

    // Load groups
    $.get('/api/admin/groups', function(groups) {
        const $select = $('#forward-group-id');
        $select.find('option:not(:first)').remove();
        groups.forEach(g => {
            $select.append(`<option value="${g.id}">${g.group_name}</option>`);
        });
    });

    $('#forward-modal').show();
}
// ^ Forward a Ticket
function confirmForward() {
    const ticketToForward = forwardTicketContext || currentTicket;
    const targetType = $('#forward-target-type').val();
    const toTellerId = targetType === 'teller' ? $('#forward-teller-id').val() : null;
    const toGroupId = targetType === 'group' ? $('#forward-group-id').val() : null;
    const note = $('#forward-note').val();

    if (!ticketToForward) {
        showMsg('warning', 'No ticket selected to forward');
        return;
    }

    if (!toTellerId && !toGroupId) {
           showMsg("warning", "Please select a teller or group");
        return;
    }

    $.ajax({
        url: '/api/tickets/forward',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            ticketId: ticketToForward.id,
            fromTellerId: currentTeller.id,
            toTellerId: toTellerId,
            toGroupId: toGroupId,
            note: note,
            cname: currentTeller.username,
            cnum: currentTeller.counter_number
        }),
        success: function() {
            $('#forward-modal').hide();
            if (currentTicket && Number(currentTicket.id) === Number(ticketToForward.id)) {
                currentTicket = null;
                clearCurrentTicket();
            }
            forwardTicketContext = null;
            loadQueueData();
            loadHeldTickets();
            loadForwardedTickets();
            loadHistory();
           showMsg("success", "Ticket sent ✅")
        }
    });
}
// ^ Void modal show
function openVoidModal() {
    $('#void-modal').show();
}
// ^ Void a Ticket
function confirmVoid() {
    const reason = $('#void-reason').val();
    const notes = $('#void-notes').val();

    $.ajax({
        url: '/api/tickets/void',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            ticketId: currentTicket.id,
            reason: reason,
            notes: notes,
            cname: currentTeller.username, 
            cnum: currentTeller.counter_number 
        }),
        success: function() {
            $('#void-modal').hide();
            currentTicket = null;
            clearCurrentTicket();
            loadQueueData();
           showMsg("success", "Ticket voided successfully");
        }
    });
}

