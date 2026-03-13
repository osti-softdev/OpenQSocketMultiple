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
    $('#loginSec').show();
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
    $('#avatar-initials').text(currentTeller.username.charAt(0).toUpperCase());
}
// ^ Load queue data
function loadQueueData() {
    if (!currentTeller) return;

    $.ajax({
        url: '/api/tickets/waiting',
        method: 'GET',
        data: { services: currentTeller.services },
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
// ^ Load Held Tickets
function loadHeldTickets() {
    if (!currentTeller) return;

    $.get('/api/tickets/held', { tellerId: currentTeller.counter_number }, function(tickets) {
        const $queue = $('#held-queue');
        $queue.empty();

        if (tickets.length === 0) {
            $queue.html('<div class="empty-list">No held tickets</div>');
            $('.heldTickets').text("Held: " + "0");
            return;
        }

        $('.heldTickets').text("Held: "+tickets.length);

        // Held Tickets Render Update
        tickets.forEach(ticket => {
        const isPriority = ticket.priority === 1;
            const $item = $(`
                <div class="queue-item ${isPriority ? 'priority' : ''}">
                    <div class="queue-item-info">
                        <h4>${ticket.ticketservice}${ticket.ticketnum}</h4>
                        <span>${ticket.sname}</span>
                    </div>
                    <div class="queue-actions">
                        <button class="btn btn-secondary btn-sm forward-held-btn">Forward</button>
                        <button class="btn btn-success btn-sm resume-held-btn">Resume</button>
                    </div>
                </div>
            `);

            $item.find('.resume-held-btn').click(() => resumeHeldTicket(ticket.id));
            $item.find('.forward-held-btn').click(() => {
                // For forwarding held ticket, we temporarily set it as current OR pass ID to modal
                // Ideally, we open modal and pass ticket ID context
                currentTicket = ticket; // Hacky but works with existing openForwardModal which uses currentTicket
                openForwardModal();
            });
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
            $queue.html('<div class="empty-list">No forwarded tickets</div>');
            $('.forwardTickets').text("Forwarded: " + "0");
            return;
        }

        $('.forwardTickets').text("Forwarded: " + tickets.length);

        tickets.forEach(ticket => {
        const isPriority = ticket.priority === 1;
            const $item = $(`
                <div class="queue-item ${isPriority ? 'priority' : ''}">
                    <div class="queue-item-info">
                        <h4>${ticket.ticketservice}${ticket.ticketnum}</h4>
                        <span>${ticket.sname} - From: ${ticket.from_teller_name}</span>
                        ${ticket.note ? `<small>${ticket.note}</small>` : ''}
                    </div>
                    <button class="btn btn-primary btn-sm">Call</button>
                </div>
            `);

            $item.find('button').click(() => callSpecificTicket(ticket.id));
            $queue.append($item);
        });
    });
}
// ^ Load History
function loadHistory() {
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
            if (!t.start_time || !t.end_time) {
                return;
            }
            const startDate = new Date(`${t.date}T${t.start_time}`);
            const endDate   = new Date(`${t.date}T${t.end_time}`);

            if (isNaN(startDate) || isNaN(endDate)) {
                return;
            }
            const durationSeconds = Math.floor((endDate - startDate) / 1000);

            const mins = Math.floor(durationSeconds / 60);
            const secs = durationSeconds % 60;

            const $row = $(`
                <tr>
                    <td><strong>${t.ticketservice}${t.ticketnum}</strong></td>
                    <td>${t.ticketservice}</td>
                    <td>${t.start_time}</td>
                    <td>${t.end_time}</td>
                    <td>${mins}m ${secs}s</td>
                    <td>
                        <button class="btn btn-primary btn-sm call-again-btn">
                            Call Again
                        </button>
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
    const ticketSname = ticket.sname.replace(/_/g, " ");
    $display.html(`
        <div class="active-ticket-info">
            <div class="ticket-num-large">${ticket.ticketservice}${ticket.ticketnum}</div>
            <div class="ticket-service-name">${ticketSname}</div>
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
// ^ Initialize dashboard services
function createServiceBoxes() {
    const $grid = $('.servicesManage');
    $grid.empty();

        const services = currentTeller.services.split(',').map(s => s.trim());

    services.forEach(service => {
        const $box = $('<div>').addClass('service-box').attr('id', `service-box-${service}`);
        const Sname = service.replace(/_/g, " ");
        
        $box.html(`
            <div class="service-stats">
                <h5>${Sname}</h5>
                <div class="stat-item">Last: <span class="last">-</span></div>
            </div>
                <div class="service-btns">
                    <button class="btn btn-primary call-regular" data-service="${service}">Reg ( <b class="count-reg">0</b> )</button>
                    <button class="btn btn-danger call-priority" data-service="${service}">Pri ( <b class="count-pri">0</b> )</button>
                </div>
           
        `);

        $box.find('.call-regular').click(() => callNext('regular', service));
        $box.find('.call-priority').click(() => callNext('priority', service));

        $grid.append($box);
    });
}
// ^ Update pending counts
function updatePendingCounts(tickets) {
        const services = currentTeller.services.split(',').map(s => s.trim());
    services.forEach(service => {
        const serviceTickets = tickets.filter(t => t.sname === service);
        const total = serviceTickets.length;
        const reg = serviceTickets.filter(t => t.priority === 0).length;
        const pri = serviceTickets.filter(t => t.priority === 1).length;

        $(`#service-box-${service} .count`).text(total);
        $(`#service-box-${service} .count-reg`).text(reg);
        $(`#service-box-${service} .count-pri`).text(pri);
    });
}
// ^ Display waiting queue
function displayWaitingQueue(tickets) {
    const $queue = $('#waiting-queue');
    $queue.empty();
    if (tickets.length === 0) {
        $queue.html('<div class="empty-list">No pending tickets</div>');
    $('.pendingTickets').text("Waiting: 0");
        return;
    }

    $('.pendingTickets').text("Waiting: " + tickets.length);

    tickets.forEach(ticket => {
        const isPriority = ticket.priority === 1;
        const $item = $(`
            <div class="queue-item ${isPriority ? 'priority' : ''}">
                <div class="queue-item-info">
                    <h4>${ticket.ticketservice}${ticket.ticketnum}</h4>
                    <span>${ticket.sname}</span>
                </div>
                    <span>${ticket.date} : ${ticket.time}</span>
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
// ^ Call specific ticket
function callSpecificTicket(ticketId) {
    executeCall({
        ticketId: ticketId,
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
function openForwardModal() {
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
    const targetType = $('#forward-target-type').val();
    const toTellerId = targetType === 'teller' ? $('#forward-teller-id').val() : null;
    const toGroupId = targetType === 'group' ? $('#forward-group-id').val() : null;
    const note = $('#forward-note').val();

    if (!toTellerId && !toGroupId) {
           showMsg("warning", "Please select a teller or group");
        return;
    }

    $.ajax({
        url: '/api/tickets/forward',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            ticketId: currentTicket.id,
            fromTellerId: currentTeller.id,
            toTellerId: toTellerId,
            toGroupId: toGroupId,
            note: note,
            cname: currentTeller.username,
            cnum: currentTeller.counter_number
        }),
        success: function() {
            $('#forward-modal').hide();
            currentTicket = null;
            clearCurrentTicket();
            loadQueueData();
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

