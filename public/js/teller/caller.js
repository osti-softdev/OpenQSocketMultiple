const socket = io();
let currentTeller = null;
let currentTicket = null;
let durationInterval = null;
let totalTickets = null;

$(document).ready(function () {
    checkSession();

    // Login form handler
    $('#login-form').submit(function (e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password }),
            success: function (response) {
                if (response.success) {
                    if (response.teller.role === 'admin') {
                        $('#login-error').text('Please use the admin login page').show();
                        return;
                    }
                    currentTeller = response.teller;
                    showTellerSection();
                    initDashboard();
                } else {
                    $('#login-error').text(response.message);
                }
            },
            error: function (xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.message : 'Login failed';
                $('#login-error').text(error).show();
            }
        });
    });

    // & SOCKET EVENTS ======
      // Socket events
    socket.on('new_ticket', (ticket) => {
        if (isTicketForTeller(ticket)) loadQueueData();
    });

    socket.on('ticket_called', () => loadQueueData());
    socket.on('ticket_completed', () => loadQueueData());
    socket.on('ticket_held', () => {
        loadQueueData();
        loadHeldTickets();
    });
    socket.on('ticket_forwarded', (data) => {
        console.log('Forward event:', data);

    const isForThisTeller =
        Number(data.toTellerId) === Number(currentTeller.id);

    const isForThisGroup =
        Number(data.toGroupId) === Number(currentTeller.group_id);

    if (isForThisTeller || isForThisGroup) {
        showMsgForwarded(
            'success',
            `You received ticket ${data.ticket.ticketservice}${data.ticket.ticketnum} : ${data.note}`
        );
    }
        loadQueueData();
        loadForwardedTickets();
    });
    socket.on('ticket_voided', () => {
        loadQueueData();
    });

    // & BUTTON EVENTS ========
    // Complete button
    $('#complete-btn').click(function () {
        if (!currentTicket) return;
        completeTicket();
    });

    // & Recall button
    $('#recall-btn').click(function() {
        if (!currentTicket) return;
        recallTicket();
    });

    // & Hold button
    $('#hold-btn').click(function() {
        if (!currentTicket) return;
        holdTicket();
    });

    // & Forward button
    $('#forward-btn').click(function() {
        if (!currentTicket) return;
        openForwardModal();
    });
    $('.close-forward-modal').click(() => $('#forward-modal').hide());
        $('#forward-target-type').change(function() {
            if ($(this).val() === 'teller') {
                $('#forward-teller-group').show();
                $('#forward-group-group').hide();
            } else {
                $('#forward-teller-group').hide();
                $('#forward-group-group').show();
            }
        });

    // & Void button
    $('#void-btn').click(function() {
        if (!currentTicket) return;
        openVoidModal();
    });
    $('#confirm-forward-btn').click(confirmForward);
    // Void modal handlers
    $('.close-void-modal').click(() => $('#void-modal').hide());
    $('#confirm-void-btn').click(confirmVoid);

    let activeManager = 'services';

    function switchManager(manager) {
        // & Reset all views
        $('.servicesManage, .pendingManage, .heldManage, .forwardManage , .historyManage')
            .removeClass('activeDisplay')
            .hide();

        // & Reset all buttons
        $('.pendingTickets, .heldTickets, .forwardTickets, .historyTickets')
            .removeClass('activeDisplay')
            .css('background-color', '');

        if (manager === 'services') {
            $('.servicesManage')
                .addClass('activeDisplay')
                .css('display', 'flex');
            activeManager = 'services';
            return;
        }
        if(manager === 'history') {
            loadHistory();
        }
        // & Show selected manager
        $(`.${manager}Manage`)
            .addClass('activeDisplay')
            .css('display', 'flex');

        // & Highlight matching button
        $(`.${manager}Tickets`)
            .addClass('activeDisplay')
            .css('background-color', '#ff0000');

        activeManager = manager;
    }

    // ^ Button bindings
    $('.pendingTickets').on('click', function () {
        switchManager(activeManager === 'pending' ? 'services' : 'pending');
    });

    $('.heldTickets').on('click', function () {
        switchManager(activeManager === 'held' ? 'services' : 'held');
    });

    $('.forwardTickets').on('click', function () {
        switchManager(activeManager === 'forward' ? 'services' : 'forward');
    });

    $(".historyBtn").on('click', function() {
        switchManager(activeManager === 'history' ? 'services' : 'history');

    })
});

