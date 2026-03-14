let currentTab = 'dashboard';
let editId = null;
let charts = {};
$(document).ready(function () {
    checkAdmin();

    // & NAVIGATION 
    $('.nav-item').click(function () {
        const tab = $(this).data('tab');
        switchTab(tab);
    });

     socket.on('service_update', async function (data) {
        loadServices();
    });
    switchTab('reports');
});
    // & MODAL CLOSE
    $('.close-modal').click(() => $('#modal-overlay').hide());

    // & HISTORY SEARCH INPUT
     $('#history-search').on('input', function() {
        const search = $(this).val();
        loadTicketHistory(search);
    });
    // & SETTINGS FORM SUBMISSION
    $('#settings-form').submit(function (e) {
        e.preventDefault();
        saveSettings();
    });
// ^ CHECK ADMIN SESSION
function checkAdmin() {
    $.get('/api/check-session-admin', function (res) {
        if (!res.loggedIn) {
            window.location.href = '/admin';
        } else {
            $('#current-user').text(`Logged in as: ${res.admin.username}`);
        }
    });
}
// & SWITCH TABS
function switchTab(tab) {
    currentTab = tab;
    $('.nav-item').removeClass('active');
    $(`.nav-item[data-tab="${tab}"]`).addClass('active');
    $('.tab-content').removeClass('active');
    $(`#${tab}-tab`).addClass('active');
    const el = $("#adminAdPlayer")[0];
        if(tab != 'settings'){
			el.pause();
        }else{
			el.play();
        }
    const titles = {
        'dashboard': 'Analytics Dashboard',
        'reports': 'Transaction Reports',
        'history': 'Ticket History',
        'services': 'Services Management',
        'tellers': 'Tellers Management',
        'Accounts': 'Accounts Management',
        'groups': 'Teller Groups',
        'settings': 'General Settings'
    };

    $('#tab-title').text(titles[tab]);

    // Load data for the tab
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'reports') loadReports();
    else if (tab === 'history') loadTicketHistory();
    else if (tab === 'services') loadServices();
    else if (tab === 'tellers') loadTellers();
    else if (tab === 'accounts') loadAccounts();
    else if (tab === 'groups') loadGroups();
    else if (tab === 'settings') loadSettings();
}
// ^ ===== LOADING AREA ====== ^ 

// & ===== DASHBOARD =====
function loadDashboard() {
    loadLiveDashboard();
    // Refresh every 30 seconds
    if (window.dashboardInterval) clearInterval(window.dashboardInterval);
    window.dashboardInterval = setInterval(loadLiveDashboard, 30000);
}
// & ===== LIVE DASHBOARD =====
function loadLiveDashboard() {
    // Show loading state if needed, or just silent update
    const now = new Date();
    $('#last-updated').text(now.toLocaleTimeString());

    $.get('/api/admin/dashboard/live', function(data) {
        // 1. Stats Cards
        if (data.stats) {
            $('#live-total').text(data.stats.total_tickets || 0);
            $('#live-queue').text(data.stats.queue_length || 0);
            const turnaround = data.stats.avg_turnaround ? Math.round(data.stats.avg_turnaround) + 'm' : '0m';
            $('#live-turnaround').text(turnaround);
        }

        // 2. Service Live Board
        const $serviceGrid = $('#service-live-grid').empty();
        if (data.services && data.services.length > 0) {
            data.services.sort((a, b) => b.waiting_count - a.waiting_count); // Sort by busiest
            
            data.services.forEach(s => {
                let statusClass = 'status-ok';
                if (s.waiting_count > 5) statusClass = 'status-busy';
                if (s.waiting_count > 10) statusClass = 'status-critical';

                $serviceGrid.append(`
                    <div class="service-live-card ${statusClass}">
                        <div class="service-name">
                            ${s.sname}
                            <span class="status-indicator ${s.waiting_count > 0 ? 'busy' : 'idle'}">${s.waiting_count > 0 ? 'Active' : 'Idle'}</span>
                        </div>
                        <div class="service-metrics">
                            <div class="metric waiting">
                                <span>Waiting</span>
                                <strong>${s.waiting_count}</strong>
                            </div>
                            <div class="metric serving">
                                <span>Serving</span>
                                <strong>${s.serving_count}</strong>
                            </div>
                            <div class="metric">
                                <span>Completed</span>
                                <strong>${s.completed_count || 0}</strong>
                            </div>
                            <div class="metric">
                                <span>Avg Wait</span>
                                <strong>${s.avg_wait_time ? Math.round(s.avg_wait_time) + 'm' : '-'}</strong>
                            </div>
                        </div>
                    </div>
                `);
            });
        } else {
            $serviceGrid.html('<p style="grid-column: span 3; text-align: center;">No active services found.</p>');
        }

        // 3. Teller Live List
        const $tellerList = $('#teller-live-list').empty();
        if (data.tellers && data.tellers.length > 0) {
            data.tellers.forEach(t => {
                const statusClass = t.status_code === 'busy' ? 'busy' : 'idle';
                $tellerList.append(`
                    <tr>
                        <td><strong>${t.cname}</strong></td>
                        <td>Counter ${t.cnum}</td>
                        <td><span class="status-indicator ${statusClass}">${t.status}</span></td>
                        <td>${t.served_today || 0}</td>
                        <td>${t.avg_service_time ? Math.round(t.avg_service_time) + ' min' : '-'}</td>
                        <td>${t.avg_turnaround_time ? Math.round(t.avg_turnaround_time) + ' min' : '-'}</td>
                    </tr>
                `);
            });
        } else {
            $tellerList.append('<tr><td colspan="6" style="text-align:center">No tellers online</td></tr>');
        }
    });

    // 4. Historical Charts (Refresh less often? For now, refresh with dashboard)
    $.get('/api/admin/analytics/overview', function(stats) {
        createServiceChart(stats.byService);
        createStatusChart(stats.byStatus);
    });
    
    $.get('/api/admin/analytics/hourly', function(data) {
        createHourlyChart(data);
    });

    function createServiceChart(data) {
        const ctx = document.getElementById('serviceChart');
        if (charts.sname) charts.sname.destroy();
        
        charts.sname = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(d => d.sname),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: [
                        '#667eea', '#764ba2', '#f093fb', '#4facfe',
                        '#43e97b', '#fa709a', '#fee140', '#30cfd0'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    function createStatusChart(data) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        if (charts.status) {
            charts.status.destroy();
            charts.status = null;
        }

        const statusColors = {
            'waiting': '#fbbf24',
            'calling': '#3b82f6',
            'completed': '#10b981',
            'held': '#8b5cf6',
            'forwarded': '#ec4899',
            'voided': '#ef4444'
        };

        charts.status = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.map(d =>
                    d.status.charAt(0).toUpperCase() + d.status.slice(1)
                ),
                datasets: [{
                    label: 'Total Tickets',
                    data: data.map(d => d.count),
                    backgroundColor: data.map(d =>
                        statusColors[d.status] || '#6b7280'
                    ),
                    borderRadius: 6,
                    barThickness: 20
                }]
            },
            options: {
                indexAxis: 'y',   // 🔥 THIS MAKES IT HORIZONTAL
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {                // X is now the value axis
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    y: {                // Y is now the label axis
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    function createHourlyChart(data) {
        const ctx = document.getElementById('hourlyChart');
        if (charts.hourly) charts.hourly.destroy();

        // Create lookup map
        const map = {};
        data.forEach(d => {
            const key = `${d.hour}:${d.minute_block}`;
            map[key] = d.count;
        });

        // Generate 48 time slots
        const labels = [];
        const counts = [];

        for (let h = 0; h < 24; h++) {
            const hour = String(h).padStart(2, '0');

            ['00', '30'].forEach(minute => {
                const label = `${hour}:${minute}`;
                labels.push(label);
                counts.push(map[label] || 0);
            });
        }

        charts.hourly = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tickets',
                    data: counts,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    }

}
function getCanvas(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (el.offsetParent === null) return null; // hidden
    return el;
}
// ~ ===== SERVICES =====
function loadServices() {
    $.get('/api/admin/services', function (services) {
        if(services.length === 16){
            $('#addServiceBtn').hide();
        }else{
            $('#addServiceBtn').show();
        }
        const $list = $('#services-list').empty();
        services.forEach(s => {
            $list.append(`
                <tr>
                    <td>${s.shortSname}</td>
                    <td>${s.sub_sname}</td>
                    <td>${s.regular}</td>
                    <td>${s.priority}</td>
                    <td>${s.sched || '-'}</td>
                    <td><span class="status-badge ${s.status ? 'status-active' : 'status-inactive'}">${s.status === 1 ? 'Active' : 'Inactive'}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editService(${s.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteService(${s.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}
// & ===== SERVICE ACTIONS =====
function editService(id) {
    $.get('/api/admin/services', (services) => {
        const s = services.find(x => x.id === id);
        openModal('services', s);
    });
}
// & ===== DELETE SERVICE =====
async function deleteService(id) {
    const result = await Swal.fire({
        title: 'Delete this service?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
    });

    if (!result.isConfirmed) return;

    try {
        await $.ajax({
            url: `/api/admin/services/${id}`,
            method: 'DELETE'
        });

        await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The service has been removed.',
            timer: 1500,
            showConfirmButton: false
        });

        loadServices();

    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete the service.'
        });
    }
}
// ~ ===== TELLERS =====
function loadTellers() {
    $.get('/api/admin/tellers', function (tellers) {
        const $list = $('#tellers-list').empty();
        tellers.forEach(t => {
            const isActive = Number(t.cstatus) === 1;
            $list.append(`
                <tr>
                    <td>${t.cname}</td>
                    <td>${t.cnum}</td>
                    <td>${t.group_name || 'None'}</td>
                    <td>${t.services}</td>
                    <td><span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editTeller(${t.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeller(${t.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}
// & EDIT TELLER
function editTeller(id) {
    $.get('/api/admin/tellers', (tellers) => {
        const t = tellers.find(x => x.id === id);
        openModal('tellers', t);
    });
}
// & ===== DELETE TELLER =====
function deleteTeller(id) {
    Swal.fire({
        title: 'Delete this teller?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/api/admin/tellers/${id}`,
                method: 'DELETE',
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The teller has been removed.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadTellers();
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete the teller.'
                    });
                }
            });
        }
    });
}

// ~ ===== Accounts =====
function loadAccounts() {
    $.get('/api/admin/accounts', function (accounts) {
        console.log(accounts);
        const $list = $('#accounts-list').empty();
        accounts.forEach(t => {
            const isActive = Number(t.status) === 1;
            $list.append(`
                <tr>
                    <td>${t.name}</td>
                    <td>${t.username}</td>
                    <td>${t.role || 'None'}</td>
                    <td><span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editAccount(${t.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAccount(${t.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}
// & EDIT ACCOUNT
function editAccount(id) {
    $.get('/api/admin/accounts', (accounts) => {
        const t = accounts.find(x => x.id === id);
        openModal('accounts', t);
    });
}
// & ===== DELETE ACCOUNT =====
function deleteAccount(id) {
    Swal.fire({
        title: 'Delete this account?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/api/admin/accounts/${id}`,
                method: 'DELETE',
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The account has been removed.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadAccounts();
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete the account.'
                    });
                }
            });
        }
    });
}

// ~ ===== GROUPS =====
function loadGroups() {
    $.get('/api/admin/groups', function (groups) {
        const $list = $('#groups-list').empty();
        groups.forEach(g => {
            $list.append(`
                <tr>
                    <td>${g.id}</td>
                    <td>${g.group_name}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-danger" onclick="deleteGroup(${g.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}
// & ===== DELETE GROUP =====
function deleteGroup(id) {
    Swal.fire({
        title: 'Delete this group?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/api/admin/groups/${id}`,
                method: 'DELETE',
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The group has been removed.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadGroups();
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Something went wrong while deleting.'
                    });
                }
            });
        }
    });
}
// ~ ===== SETTINGS =====
function loadSettings() {
    $.get('/api/settings', function (settings) {
        $('#setting-announcement').val(settings.announcement);
        $('#setting-announcement2').val(settings.announcement2);
        $('#setting-announcement3').val(settings.announcement3);
    });
}
// & ===== SAVE SETTINGS =====
function saveSettings() {
    const payload = {
        announcement: $('#setting-announcement').val(),
        announcement2: $('#setting-announcement2').val(),
        announcement3: $('#setting-announcement3').val(),
    };

    $.ajax({
        url: '/api/settings',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: () => showMsg('success', 'Settings saved!'),
        error: (xhr) => {
            console.error(xhr.responseText);
            showMsg('error', 'Failed to save settings');
        }
    });
}
// & ===== TICKET HISTORY =====
function loadTicketHistory(search = '') {
    $.get('/api/admin/tickets/all', { search, limit: 100 }, function(tickets) {
        const $list = $('#history-list').empty();
        
        if (tickets.length === 0) {
            $list.append('<tr><td colspan="9" style="text-align:center">No tickets found</td></tr>');
            return;
        }
        
        tickets.forEach(t => {
            const duration = t.duration_minutes ? Math.round(t.duration_minutes) + ' min' : '-';
            const details = [];
            if (t.recall_count > 0) details.push(`Recalled ${t.recall_count}x`);
            if (t.void_reason) details.push(`Void: ${t.void_reason}`);
            
            $list.append(`
                <tr>
                    <td><strong>${t.ticketservice}${t.ticketnum}</strong></td>
                    <td>${t.sname}</td>
                    <td><span class="status-badge status-${t.status}">${t.status}</span></td>
                    <td>${t.counter_user     || '-'}</td>
                    <td>${t.date}</td>
                    <td>${t.start_time ? t.start_time : '-'}</td>
                    <td>${t.end_time ? t.end_time : '-'}</td>
                    <td>${duration}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-primary" onclick="viewTicketDetails(${t.id})" style="margin-left: 5px;">Journey</button>
                        </div>
                    </td>
                </tr>
            `);
        });
    });
}
// & ===== View Ticket History =====
window.viewTicketDetails = function (id) {
    $.get(`/api/admin/tickets/details/${id}`, function (data) {
        const $timeline = $('#ticket-journey-timeline');
        $timeline.empty();

        if (!data.timeline || data.timeline.length === 0) {
            $timeline.html('<p>No history available.</p>');
        } else {
            data.timeline.forEach(event => {

                const isInserted = event.event && event.event.toLowerCase().includes('inserted');
                const isVoided = event.event && event.event.toLowerCase().includes('void');
                const isAutofinished = event.event && event.event.toLowerCase().includes('autofinished');
                const isCalled = event.event && event.event.toLowerCase().includes('called');
                const isRecalled = event.event && event.event.toLowerCase().includes('recalled');
                const isHeld = event.event && event.event.toLowerCase().includes('held');
                const isforwarded = event.event && event.event.toLowerCase().includes('forwarded');
                
                const inserted = "Inserted 🟢";
                const finished = "Auto-finished ✅";
                const called = "Called 🔊";
                const recalled = "Recalled 🔁";
                const forwarded = "Forwarded ➡️";
                const held = "Held ✋";
                const voided = "Voided ❌";
                    if(isInserted){
                        event.event = inserted;
                    }else if(isAutofinished){
                        event.event = finished;
                    }else if(isCalled){
                        event.event = called;
                    }
                    else if(isRecalled){
                        event.event = recalled;
                    }
                    else if(isHeld){
                        event.event = held;
                    }
                    else if(isforwarded){
                        event.event = forwarded;
                    }
                    else if(isVoided){
                        event.event = voided;
                    }
                const textColor = isVoided ? '#dc3545' : 'inherit';
                const markerColor = isVoided ? '#dc3545' : '';

                $timeline.append(`
                    <div class="timeline-item">
                        <div class="timeline-marker" style="background-color: ${markerColor};"></div>
                        <div class="timeline-content">
                            <h4 style="color: ${textColor};">${event.event}</h4>
                            <span>${event.time}</span>
                            <p>
                                ${event.counter
                                    ? `${event.actor} (Counter ${event.counter})`
                                    : event.actor}
                            </p>
                        </div>
                    </div>
                `);
            });
        }

        $('#ticket-modal-overlay').show();
    }).fail(function (err) {
        console.error('Failed to load ticket details:', err);
        showMsg('error', 'Unable to load ticket history.');
    });
};

// & Ticket View history close modal
$('.close-ticket-modal').click(function() {
    $('#ticket-modal-overlay').hide();
});

// & ===== MODAL FUNCTIONS =====
function openModal(type = currentTab, data = null) {
    editId = data ? data.id : null;

    const $form = $('#admin-form');
    $form.empty();

    $('#modal-title').text((data ? 'Edit ' : 'Add ') + type.slice(0, -1));

    if (type === 'services') {
        $form.html(`
            <div class="form-group">
                <label>Service Name (no spacing & use underscores)</label>
                <input type="text" id="s-name" class="form-control" value="${data?.sname || ''}">
            </div>
            <div class="form-group">
                <label>Service Name Display</label>
                <input type="text" id="s-name-display" class="form-control" value="${data?.shortSname || ''}">
            </div>
            <div class="form-group">
                <label>Sub Name Display</label>
                <input type="text" id="sub-name-display" class="form-control" value="${data?.sub_sname || ''}">
            </div>
            <div class="form-group">
                <label>Regular Letter/Prefix</label>
                <input type="text" id="s-prefix" class="form-control" value="${data?.regular || ''}">
            </div>
            <div class="form-group">
                <label>Priority Letter/Prefix</label>
                <input type="text" id="s-priority" class="form-control" value="${data?.priority || ''}">
            </div>
            <div class="form-group">
                <label>Cutoff Time (HH:mm)</label>
                <input type="time" id="s-cutoff" class="form-control" value="${data?.sched || ''}">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="s-active" ${Number(data?.status) === 1 ? 'checked' : ''}>
                    Is Active
                </label>
            </div>
        `);
    }
    else if (type === 'tellers') {

    // Load groups + services in parallel
    $.when(
        $.get('/api/admin/groups'),
        $.get('/api/services')
    ).done((groupsRes, servicesRes) => {

        const groups = groupsRes[0];
        const servicesData = servicesRes[0];

        const services = servicesData.success ? servicesData.data : [];

        const selectedServices = data?.services
            ? data.services.split(',').map(s => s.trim())
            : [];

        const groupOptions = groups.map(g => `
            <option value="${g.id}" data-group-name="${g.group_name}" ${Number(data?.group_id) === Number(g.id) ? 'selected' : ''}>
                ${g.group_name}
            </option>
        `).join('');

        const serviceCheckboxes = services.map(s => {
            const isChecked = selectedServices.includes(s.sname);
            return `
                <div class="form-check">
                    <input 
                        type="checkbox"
                        class="form-check-input t-service-checkbox"
                        id="service-${s.id}"
                        value="${s.sname}"
                        ${isChecked ? 'checked' : ''}
                    >
                    <label class="form-check-label" for="service-${s.id}">
                        ${s.sname}
                    </label>
                </div>
            `;
        }).join('');

        $form.html(`
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="t-name" class="form-control" value="${data?.cname || ''}">
            </div>

            <div class="form-group">
                <label>Username</label>
                <input type="text" id="t-user" class="form-control" value="${data?.cuser || ''}">
            </div>

            <div class="form-group">
                <label>Password ${data ? '(Leave blank to keep same)' : ''}</label>
                <input type="password" id="t-pass" class="form-control">
            </div>

            <div class="form-group">
                <label>Counter Number</label>
                <input type="number" id="t-counter" class="form-control" 
                    value="${data?.cnum ?? ''}">
            </div>

            <div class="form-group">
                <label>Group</label>
                <select id="t-group" class="form-control">
                    <option value="">-- No Group --</option>
                    ${groupOptions}
                </select>
            </div>

            <div class="form-group">
                <label>Assigned Services</label>
                <div class="service-checkbox-wrapper" style="max-height:200px;overflow-y:auto;">
                    ${serviceCheckboxes}
                </div>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="t-active"
                        ${Number(data?.cstatus) === 1 ? 'checked' : ''}>
                    Is Active
                </label>
            </div>
        `);

    }).fail(() => {
        showMsg('error', 'Failed to load groups or services');
    });
    }else if (type === 'accounts') {
        $form.html(`
            <div class="form-group">
                <label>Name</label>
                <input type="text" id="ac-name" class="form-control" value="${data?.name || ''}">
            </div>

            <div class="form-group">
                <label>Username</label>
                <input type="text" id="ac-user" class="form-control" value="${data?.username || ''}">
            </div>

            <div class="form-group">
                <label>Password ${data ? '(Leave blank to keep same)' : ''}</label>
                <input type="password" id="ac-pass" class="form-control">
            </div>

            <div class="form-group">
                <label>Role</label>
              ${(() => {
                    const roles = ['superadmin', 'admin', 'user'];
                    return `
                        <select id="ac-role" class="form-control">
                            ${roles.map(role => `
                                <option value="${role}" 
                                    ${data?.role === role ? 'selected' : ''}>
                                    ${role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                            `).join('')}
                        </select>
                    `;
                })()}
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="ac-active"
                        ${Number(data?.status) === 1 ? 'checked' : ''}>
                    Is Active
                </label>
            </div>
        `);
    }  else if (type === 'groups') {
        $form.html(`
            <div class="form-group">
                <label>Group Name</label>
                <input type="text" id="g-name" class="form-control" value="${data?.group_name || ''}">
            </div>
        `);
    }
    $('#modal-overlay').show();
    $('#save-btn').off('click').on('click', saveItem);
}

// & ===== SAVE ITEM (CREATE/EDIT) =====
function saveItem() {

    if (currentTab === 'services') {

        const payload = {
            name: $('#s-name').val().trim(),
            shortSname: $('#s-name-display').val().trim(),
            sub_sname: $('#sub-name-display').val().trim(),
            prefix: $('#s-prefix').val().trim(),
            priority_prefix: $('#s-priority').val().trim(),
            cutoff_time: $('#s-cutoff').val(),
            is_active: $('#s-active').is(':checked') ? 1 : 0
        };

        const url = editId ? `/api/admin/services/${editId}` : '/api/admin/services';
        const method = editId ? 'PUT' : 'POST';

        $.ajax({
            url,
            method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: () => {
                $('#modal-overlay').hide();
                loadServices();
                showMsg('success', 'Service saved successfully');
            }
        });
    }

    else if (currentTab === 'tellers') {

        const name = $('#t-name').val().trim();
        const username = $('#t-user').val().trim();
        const rawCounter = $('#t-counter').val();
        const rawPassword = $('#t-pass').val();
        const rawGroup = $('#t-group').val();
        const groupName = $('#t-group option:selected').data('group-name') || 'None';

        const selectedServices = $('.t-service-checkbox:checked')
            .map(function () {
                return $(this).val();
            })
            .get();

            
        if (!username) {
            showMsg('error', 'Username is required');
            return;
        }
        if (!name) {
            showMsg('error', 'Name is required');
            return;
        }
        if (!rawCounter) {
            showMsg('error', 'Counter number is required');
            return;
        }

        const payload = {
            name,
            username,
            services: selectedServices.join(','), // keep DB compatible
            group_id: rawGroup ? parseInt(rawGroup, 10) : null,
            groupName: groupName,
            counter_number: rawCounter ? parseInt(rawCounter, 10) : null,
            is_active: $('#t-active').is(':checked') ? 1 : 0
        };

        // Only send password if provided
        if (rawPassword && rawPassword.trim() !== '') {
            payload.password = rawPassword.trim();
        }

        const url = editId
            ? `/api/admin/tellers/${editId}`
            : '/api/admin/tellers';

        const method = editId ? 'PUT' : 'POST';

        $.ajax({
            url,
            method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: () => {
                $('#modal-overlay').hide();
                loadTellers();
                showMsg('success', 'Teller saved successfully');
            },
            error: (xhr) => {
                console.error(xhr.responseText);
                showMsg('error', 'Failed to save teller');
            }
        });
    }

    else if (currentTab === 'accounts') {

        const rawname = $('#ac-name').val().trim();
        const rawusername = $('#ac-user').val().trim();
        const rawrole = $('#ac-role').val();
        const rawPassword = $('#ac-pass').val();
        const rawactive = $('#ac-active').is(':checked') ? 1 : 0;
            
        if (!rawusername) {
            showMsg('error', 'Username is required');
            return;
        }
        if (!rawname) {
            showMsg('error', 'Name is required');
            return;
        }
        if (!rawrole) {
            showMsg('error', 'Role is required');
            return;
        }

        const payload = {
            name: rawname,
            username: rawusername,
            role: rawrole,
            is_active: rawactive
        };

        // Only send password if provided
        if (rawPassword && rawPassword.trim() !== '') {
            payload.password = rawPassword.trim();
        }

        const url = editId
            ? `/api/admin/accounts/${editId}`
            : '/api/admin/accounts';

        const method = editId ? 'PUT' : 'POST';

        $.ajax({
            url,
            method,
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: () => {
                $('#modal-overlay').hide();
                loadAccounts();
                showMsg('success', 'Account saved successfully');
            },
            error: (xhr) => {
                console.error(xhr.responseText);
                showMsg('error', 'Failed to save account');
            }
        });
    }

    else if (currentTab === 'groups') {

        const name = $('#g-name').val().trim();
        if (!name) {
            showMsg('error', 'Group name is required');
            return;
        }

        $.ajax({
            url: '/api/admin/groups',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name }),
            success: () => {
                $('#modal-overlay').hide();
                loadGroups();
                showMsg('success', 'Group created successfully');
            }
        });
    }
}

// ^ UTILITY FUNCTIONS 
function formatDateTime(isoString) {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
// ^ LOGOUT
function logout() {
    $.post('/api/logout', function () {
        window.location.href = '/admin';
    });
}