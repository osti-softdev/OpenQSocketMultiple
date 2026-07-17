const socket = io();
let currentTeller = null;
let currentTicket = null;
let forwardTicketContext = null;
let durationInterval = null;
let totalTickets = null;

$(document).ready(function () {
    initTheme();
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
                    currentTeller = response.teller;
                    setAuthUser(currentTeller);
                    window.location.href = '/caller';
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

    socket.on('ticket_called', () => {
        loadQueueData();
        loadHeldTickets();
        loadForwardedTickets();
        loadHistory();
    });
    socket.on('ticket_completed', () => {
        loadQueueData();
        loadHeldTickets();
        loadForwardedTickets();
        loadHistory();
    });
    socket.on('ticket_held', () => {
        loadQueueData();
        loadHeldTickets();
        loadForwardedTickets();
        loadHistory();
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
        loadHeldTickets();
        loadForwardedTickets();
        loadHistory();
    });
    socket.on('ticket_voided', () => {
        loadQueueData();
        loadHeldTickets();
        loadForwardedTickets();
        loadHistory();
    });
    socket.on('teller_assignment_updated', data => {
        if (!currentTeller || Number(data.tellerId) !== Number(currentTeller.id)) return;
        refreshTellerAssignment();
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
    $('.close-forward-modal').click(() => {
        $('#forward-modal').hide();
        forwardTicketContext = null;
    });
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

    $('.avatar').click(function (event) {
        event.stopPropagation();
        const menu = document.getElementById('avatar-menu');
        menu.hidden = !menu.hidden;
    });

    $('#avatar-menu').click(event => event.stopPropagation());
    $('#receive-settings-btn').click(function () {
        $('#avatar-menu').prop('hidden', true);
        openReceiveSettings();
    });
    $('#avatar-logout-btn').click(function () {
        $('#avatar-menu').prop('hidden', true);
        confirmTellerLogout();
    });
    $(document).click(() => $('#avatar-menu').prop('hidden', true));

});

function initTheme() {
    const savedTheme = localStorage.getItem('callerTheme') || 'light';
    applyCallerTheme(savedTheme);

    $('#theme-toggle').on('click', function () {
        const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('callerTheme', nextTheme);
        applyCallerTheme(nextTheme);
    });
}

function applyCallerTheme(theme) {
    document.body.dataset.theme = theme;
    const isDark = theme === 'dark';
    $('#theme-toggle')
        .attr('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode')
        .attr('title', isDark ? 'Light mode' : 'Dark mode');
    $('#theme-toggle .theme-icon').text(isDark ? 'light_mode' : 'dark_mode');
}

function shouldShowReceivedInManualList() {
    const tellerKey = currentTeller ? currentTeller.id : 'default';
    return localStorage.getItem(`showReceivedInManualList:${tellerKey}`) !== 'false';
}

function openReceiveSettings() {
    Swal.fire({
        title: 'Receive Settings',
        text: 'Control whether received tickets also appear in the Waiting manual-call list.',
        input: 'checkbox',
        inputValue: shouldShowReceivedInManualList() ? 1 : 0,
        inputPlaceholder: 'Show received tickets in Waiting list',
        showCancelButton: true,
        confirmButtonText: 'Save Setting'
    }).then(result => {
        if (!result.isConfirmed) return;

        const showReceived = Boolean(result.value);
        const tellerKey = currentTeller ? currentTeller.id : 'default';
        localStorage.setItem(`showReceivedInManualList:${tellerKey}`, String(showReceived));
        loadQueueData();
        showMsg('success', showReceived
            ? 'Received tickets will display in the Waiting list.'
            : 'Received tickets are hidden from the Waiting list.');
    });
}

function confirmTellerLogout() {
    Swal.fire({
        title: 'Logout?',
        text: 'Are you sure you want to continue logging out?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Logout',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        reverseButtons: true
    }).then(result => {
        if (!result.isConfirmed) return;

        $.ajax({
            url: '/api/logout',
            method: 'POST',
            success: function () {
                currentTeller = null;
                currentTicket = null;
                forwardTicketContext = null;
                localStorage.removeItem('authUser');
                stopDurationTimer();
                window.location.href = '/312Xtellerlogin';
            },
            error: function () {
                Swal.fire({
                    icon: 'error',
                    title: 'Logout Failed',
                    text: 'Something went wrong. Please try again.'
                });
            }
        });
    });
}

function setAuthUser(teller) {
    localStorage.setItem('authUser', JSON.stringify({
        id: teller.id,
        cname: teller.username,
        cnum: teller.counter_number
    }));
}
