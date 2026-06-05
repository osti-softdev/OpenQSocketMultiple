// Main Admin Module - Core Navigation and Modal Functions
let currentTab = 'dashboard';
let editId = null;
let charts = {};

$(document).ready(function () {
    checkAdmin();

    // Initialize report page date inputs and buttons if report.js is loaded
    if (typeof initializeReportPage === 'function') {
        initializeReportPage();
    }

    // & NAVIGATION 
    $('.nav-item').click(function () {
        const tab = $(this).data('tab');
        switchTab(tab);
    });
    $('.settingsmenubtn').click(function () {
        const tab = $(this).data('settingstab');
        settingstabs(tab);
    });
    socket.on('service_update', async function (data) {
        if (currentTab === 'services') loadServices();
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
    saveSettings('form1');
});
$('#settings-form2').submit(function (e) {
    e.preventDefault();
    saveSettings('form2');
});

$('.statuscheckbox').on('change', function () {
    const label = $(this).next('span');
    if ($(this).is(':checked')) {
        label.text('Active');
    } else {
        label.text('Inactive');
    }
});

$('#setting-announcement-speed').on('change', function () {
    const label = $(this).next('span');
    label.text($(this).val()+"s");
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
    if(tab !== 'settings'){
        $('.settingsMenu').slideUp(100);
    }
    
    // Load data for the tab
    if (tab === 'dashboard') loadDashboard();
    else if (tab === 'reports') {
        // Initialize report page with default dates
        if (typeof initializeReportPage === 'function') {
            initializeReportPage();
        }
    }
    else if (tab === 'history') loadTicketHistory();
    else if (tab === 'services') loadServices();
    else if (tab === 'tellers') loadTellers();
    else if (tab === 'accounts') loadAccounts();
    else if (tab === 'groups') loadGroups();
    else if (tab === 'settings') {
        $('.settingsMenu').slideDown(200);
        loadSettings();
    }
}

function settingstabs(tab) {
    $('.settingsmenubtn').removeClass('active');
    $(`.settingsmenubtn[data-settingstab="${tab}"]`).addClass('active');
    $('.settabs').removeClass('activetab');
    $(`#${tab}-settab`).addClass('activetab');
    console.log(tab)
    // Load data for the tab
    if (tab === 'announcement') {
    }
    else if (tab === 'advertisement') {
    }
    else if (tab === 'images'){
    }
    else if (tab === 'fontsizes'){
    }
}

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
            services: selectedServices.join(','),
            group_id: rawGroup ? parseInt(rawGroup, 10) : null,
            groupName: groupName,
            counter_number: rawCounter ? parseInt(rawCounter, 10) : null,
            is_active: $('#t-active').is(':checked') ? 1 : 0
        };

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
