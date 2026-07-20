// Main Admin Module - Core Navigation and Modal Functions
let currentTab = null;
let currentAdminRole = null;
let editId = null;
let charts = {};

const ADMIN_ROLE_TABS = Object.freeze({
    user: ['dashboard', 'live', 'reports', 'history'],
    admin: ['dashboard', 'live', 'reports', 'history', 'services', 'tellers', 'settings'],
    superadmin: ['dashboard', 'live', 'reports', 'history', 'services', 'tellers', 'accounts', 'settings']
});

const ADMIN_ROLE_SETTINGS = Object.freeze({
    user: [],
    admin: ['advertisement', 'announcement'],
    superadmin: ['configuration', 'advertisement', 'announcement', 'displayaudio', 'images', 'smsconfig', 'fontsizes']
});

$(document).ready(function () {
    configureAdminChartHover();
    initAdminAppearance();
    checkAdmin();

    // & NAVIGATION 
    $('.nav-item').click(function () {
        const tab = $(this).data('tab');
        switchTab(tab);
    });
    $(document).on('click', '[data-jump-tab]', function () {
        switchTab($(this).data('jump-tab'));
    });
    $('.settingsmenubtn').click(function () {
        const tab = $(this).data('settingstab');
        settingstabs(tab);
    });
    socket.on('service_update', async function (data) {
        if (currentTab === 'services') loadServices();
    });
    const liveTicketEvents = [
        'ticket_called',
        'ticket-called',
        'ticket_completed',
        'ticket_held',
        'ticket_forwarded',
        'ticket_voided',
        'calledticketsArrived',
        'new_ticket',
        'new-ticket'
    ];
    liveTicketEvents.forEach(eventName => socket.on(eventName, scheduleAdminRealtimeRefresh));
    socket.on('teller_assignment_updated', scheduleAdminRealtimeRefresh);
});

function scheduleAdminRealtimeRefresh() {
    clearTimeout(window.adminRealtimeRefreshTimer);
    window.adminRealtimeRefreshTimer = setTimeout(() => {
        if (currentTab === 'dashboard' || currentTab === 'live') {
            loadLiveDashboard();
        } else if (currentTab === 'history') {
            const search = typeof historyState !== 'undefined' ? historyState.search : '';
            const page = typeof historyState !== 'undefined' ? historyState.page : 1;
            loadTicketHistory(search, page);
        } else if (currentTab === 'tellers') {
            loadTellers();
        }
    }, 160);
}

function configureAdminChartHover() {
    if (!window.Chart?.defaults) return;
    Chart.defaults.interaction.mode = 'nearest';
    Chart.defaults.interaction.intersect = true;
    Chart.defaults.plugins.tooltip.mode = 'nearest';
    Chart.defaults.plugins.tooltip.intersect = true;
}

function initAdminAppearance() {
    const $root = $(document.documentElement);
    const $themeButton = $('#themeToggle');

    $('.sidebar .nav-item').each(function () {
        const label = $(this).find('.nav-copy strong').text().trim();
        if (label) $(this).attr('title', label).attr('aria-label', label);
    });

    function updateClock() {
        const now = new Date();
        $('#console-date').text(now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
        $('#console-time').text(now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
    }

    function syncThemeControl() {
        const isDark = $root.attr('data-theme') === 'dark';
        $themeButton.attr('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
        $themeButton.attr('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }

    $('#themeToggle').off('click.adminTheme').on('click.adminTheme', function () {
        const nextTheme = $root.attr('data-theme') === 'dark' ? 'light' : 'dark';
        $root.attr('data-theme', nextTheme);
        localStorage.setItem('openqAdminTheme', nextTheme);
        syncThemeControl();

        if (currentTab === 'dashboard' || currentTab === 'live') loadLiveDashboard();
        if (currentTab === 'reports' && currentReportData) {
            displayReportData(currentReportData);
        }
    });

    $('#sidebarCollapse').off('click.adminLayout').on('click.adminLayout', function () {
        $root.toggleClass('compact-sidebar');
        const compact = $root.hasClass('compact-sidebar');
        localStorage.setItem('openqAdminCompact', compact);
        $(this).attr('title', compact ? 'Expand navigation' : 'Collapse navigation');
        $(this).attr('aria-label', compact ? 'Expand navigation' : 'Collapse navigation');
        setTimeout(() => window.dispatchEvent(new Event('resize')), 220);
    });

    $('#fullscreenToggle').off('click.adminFullscreen').on('click.adminFullscreen', async function () {
        try {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
            else await document.exitFullscreen();
        } catch (error) {
            console.warn('Fullscreen mode is unavailable:', error);
        }
    });

    document.addEventListener('fullscreenchange', () => {
        $('#fullscreenToggle').toggleClass('active', Boolean(document.fullscreenElement));
    });

    $('#sidebarCollapse')
        .attr('title', $root.hasClass('compact-sidebar') ? 'Expand navigation' : 'Collapse navigation')
        .attr('aria-label', $root.hasClass('compact-sidebar') ? 'Expand navigation' : 'Collapse navigation');
    syncThemeControl();
    updateClock();
    window.adminClockInterval = window.adminClockInterval || setInterval(updateClock, 30000);
}

function getAdminChartTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    return {
        dark,
        text: dark ? '#a9b7cc' : '#667085',
        heading: dark ? '#edf3fb' : '#172033',
        grid: dark ? 'rgba(148, 163, 184, .13)' : 'rgba(100, 116, 139, .12)',
        tooltipBackground: dark ? '#111c2e' : '#ffffff',
        tooltipBorder: dark ? '#2b3b55' : '#dfe6ef',
        palette: ['#5b8cff', '#22c7a9', '#f7b955', '#a879f7', '#f36f8b', '#35b9e9', '#ff8c5a', '#9db05d']
    };
}

// & MODAL CLOSE
$('.close-modal').click(() => $('#modal-overlay').hide());

// & HISTORY SEARCH INPUT
$('#history-search').on('input', function() {
    const search = $(this).val();
    clearTimeout(window.historySearchTimer);
    window.historySearchTimer = setTimeout(() => loadTicketHistory(search, 1), 280);
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
    return $.get('/api/check-session-admin', function (res) {
        if (!res.loggedIn) {
            window.location.href = '/admin';
        } else {
            const displayName = res.admin.username || 'Administrator';
            $('#current-user').text(displayName);
            $('.user-avatar').text(displayName.charAt(0).toUpperCase());
            applyAdminRoleAccess(res.admin.role);
        }
    }).fail(() => {
        window.location.href = '/admin';
    });
}

function normalizeAdminRole(role) {
    return String(role || '').trim().toLowerCase();
}

function getAllowedAdminTabs(role = currentAdminRole) {
    return ADMIN_ROLE_TABS[normalizeAdminRole(role)] || [];
}

function canAccessAdminTab(tab, role = currentAdminRole) {
    return getAllowedAdminTabs(role).includes(String(tab || ''));
}

function getAllowedAdminSettings(role = currentAdminRole) {
    return ADMIN_ROLE_SETTINGS[normalizeAdminRole(role)] || [];
}

function canAccessAdminSetting(setting, role = currentAdminRole) {
    return getAllowedAdminSettings(role).includes(String(setting || ''));
}

function applyAdminRoleAccess(role) {
    currentAdminRole = normalizeAdminRole(role);
    const allowedTabs = getAllowedAdminTabs();

    if (!allowedTabs.length) {
        document.documentElement.classList.remove('admin-access-pending');
        Swal.fire({ icon: 'error', title: 'Access denied', text: 'This account does not have a valid console role.' })
            .then(() => logout());
        return;
    }

    $('[data-tab]').each(function () {
        const allowed = canAccessAdminTab($(this).data('tab'));
        $(this).toggleClass('role-restricted', !allowed).attr('aria-hidden', String(!allowed));
    });

    $('[data-jump-tab]').each(function () {
        $(this).toggleClass('role-restricted', !canAccessAdminTab($(this).data('jump-tab')));
    });

    $('.tab-content[id$="-tab"]').each(function () {
        const tab = String(this.id).replace(/-tab$/, '');
        $(this).toggleClass('role-restricted', !canAccessAdminTab(tab));
    });

    $('.sidebar-nav .nav-section-label').each(function () {
        const hasAllowedItem = $(this)
            .nextUntil('.nav-section-label', '.nav-item')
            .toArray()
            .some(item => !item.classList.contains('role-restricted'));
        $(this).toggleClass('role-restricted', !hasAllowedItem);
    });

    $('.settingsMenu').toggleClass('role-restricted', !canAccessAdminTab('settings'));

    $('.settingsmenubtn').each(function () {
        const allowed = canAccessAdminSetting($(this).data('settingstab'));
        $(this).toggleClass('role-restricted', !allowed).attr('aria-hidden', String(!allowed));
    });

    $('.settabs').each(function () {
        const setting = String(this.id || '').replace(/-settab$/, '');
        $(this).toggleClass('role-restricted', !canAccessAdminSetting(setting));
    });

    const activeSetting = $('.settingsmenubtn.active').data('settingstab');
    const allowedSettings = getAllowedAdminSettings();
    if (allowedSettings.length && !canAccessAdminSetting(activeSetting)) {
        settingstabs(allowedSettings[0]);
    }

    document.documentElement.classList.remove('admin-access-pending');

    const initialTab = canAccessAdminTab(currentTab) ? currentTab : allowedTabs[0];
    switchTab(initialTab);
}

// & SWITCH TABS
function switchTab(tab) {
    if (!canAccessAdminTab(tab)) {
        if (currentAdminRole) {
            Swal.fire({ icon: 'warning', title: 'Access denied', text: 'Your account role cannot open this workspace.' });
        }
        return false;
    }

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
        'dashboard': 'Operations Overview',
        'live': 'Live Queue Preview',
        'reports': 'Reports & Exports',
        'history': 'Ticket History',
        'services': 'Service Management',
        'tellers': 'Teller Management',
        'accounts': 'Account Management',
        'settings': 'Display & Media Settings'
    };

    $('#tab-title').text(titles[tab]);
    if(tab !== 'settings'){
        $('.settingsMenu').slideUp(100);
    }
    
    // Load data for the tab
    if (tab === 'dashboard' || tab === 'live') loadDashboard();
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
    else if (tab === 'settings') {
        $('.settingsMenu').slideDown(200);
        const activeSetting = $('.settingsmenubtn.active').data('settingstab');
        if (!canAccessAdminSetting(activeSetting)) settingstabs(getAllowedAdminSettings()[0]);
        loadSettings();
    }

    return true;
}

function refreshCurrentTab() {
    const refreshers = {
        dashboard: loadDashboard,
        live: loadLiveDashboard,
        reports: () => typeof initializeReportPage === 'function' && initializeReportPage(),
        history: () => loadTicketHistory($('#history-search').val() || ''),
        services: loadServices,
        tellers: loadTellers,
        accounts: loadAccounts,
        settings: loadSettings
    };

    if (refreshers[currentTab]) refreshers[currentTab]();
}

function settingstabs(tab) {
    if (!canAccessAdminTab('settings') || !canAccessAdminSetting(tab)) {
        if (currentAdminRole) {
            Swal.fire({ icon: 'warning', title: 'Access denied', text: 'Your account role cannot open this setting.' });
        }
        return false;
    }

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
    else if (tab === 'displayaudio') {
        loadDisplayAudioSettings();
    }
    else if (tab === 'configuration') {
        loadSystemConfiguration();
    }

    return true;
}

// & ===== MODAL FUNCTIONS =====
function serviceKeyFromDisplay(value) {
    return String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'SERVICE';
}

function openModal(type = currentTab, data = null) {
    editId = data ? data.id : null;

    const $form = $('#admin-form');
    $form.empty();

    $('#modal-title').text((data ? 'Edit ' : 'Add ') + type.slice(0, -1));

    if (type === 'services') {
        const initialDisplayName = data?.shortSname || '';
        const initialKey = serviceKeyFromDisplay(initialDisplayName);
        $form.html(`
            <div class="form-group form-group-wide service-name-field">
                <label for="s-name-display">Service name</label>
                <input type="text" id="s-name-display" class="form-control" value="${initialDisplayName}" autocomplete="off" required>
                <div class="generated-service-key">
                    <span>Automatic service key</span>
                    <code id="s-name-preview">${initialKey}</code>
                </div>
            </div>
            <div class="form-group">
                <label for="sub-name-display">Sub name display</label>
                <input type="text" id="sub-name-display" class="form-control" value="${data?.sub_sname || ''}">
            </div>
            <div class="form-group">
                <label for="s-prefix">Regular ticket prefix</label>
                <input type="text" id="s-prefix" class="form-control" value="${data?.regular || ''}">
            </div>
            <div class="form-group">
                <label for="s-priority">Priority ticket prefix</label>
                <input type="text" id="s-priority" class="form-control" value="${data?.priority || ''}">
            </div>
            <div class="form-group">
                <label for="s-cutoff">Cutoff time</label>
                <input type="time" id="s-cutoff" class="form-control" value="${data?.sched || ''}">
            </div>
            <div class="form-group form-group-wide">
                <label class="form-toggle-label" for="s-active">
                    <input type="checkbox" id="s-active" ${!data || Number(data.status) === 1 ? 'checked' : ''}>
                    <span>Service is active</span>
                </label>
            </div>
        `);
        $('#s-name-display').on('input', function () {
            $('#s-name-preview').text(serviceKeyFromDisplay(this.value));
        });
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
                <label for="t-group">Routing service group</label>
                <select id="t-group" class="form-control">
                    <option value="">-- Select a service group --</option>
                    ${groupOptions}
                </select>
            </div>

            <div class="form-group">
                <label>Assigned services</label>
                <div class="service-checkbox-wrapper" style="max-height:200px;overflow-y:auto;">
                    ${serviceCheckboxes}
                </div>
            </div>

            <div class="form-group">
                <label class="form-toggle-label" for="t-active">
                    <input type="checkbox" id="t-active"
                        ${Number(data?.cstatus) === 1 ? 'checked' : ''}>
                    <span>Teller is active</span>
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
                <label class="form-toggle-label" for="ac-active">
                    <input type="checkbox" id="ac-active"
                        ${Number(data?.status) === 1 ? 'checked' : ''}>
                    <span>Account is active</span>
                </label>
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
            shortSname: $('#s-name-display').val().trim(),
            sub_sname: $('#sub-name-display').val().trim(),
            prefix: $('#s-prefix').val().trim(),
            priority_prefix: $('#s-priority').val().trim(),
            cutoff_time: $('#s-cutoff').val(),
            is_active: $('#s-active').is(':checked') ? 1 : 0
        };

        if (!payload.shortSname) {
            showMsg('error', 'Service name is required');
            return;
        }

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
            },
            error: (xhr) => {
                showMsg(
                    'error',
                    xhr.responseJSON?.error || 'Operation Failed.'
                );
            }
        });
    }

    else if (currentTab === 'tellers') {

        const name = $('#t-name').val().trim();
        const username = $('#t-user').val().trim();
        const rawCounter = $('#t-counter').val();
        const rawPassword = $('#t-pass').val();
        const rawGroup = $('#t-group').val();
        const groupName = $('#t-group option:selected').data('group-name') || null;

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
            group_name: groupName,
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
                showMsg(
                    'error',
                    xhr.responseJSON?.error || 'Operation Failed.'
                );
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
                showMsg(
                    'error',
                    xhr.responseJSON?.error || 'Operation Failed.'
                );
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


