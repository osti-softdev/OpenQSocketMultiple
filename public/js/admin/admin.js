// Main Admin Module - Core Navigation and Modal Functions
let currentTab = null;
let currentAdminRole = null;
let editId = null;
let currentModalType = null;
let charts = {};

const ADMIN_ROLE_TABS = Object.freeze({
    user: ['dashboard', 'live', 'reports', 'history'],
    admin: ['dashboard', 'live', 'reports', 'history', 'services', 'tellers', 'settings'],
    superadmin: ['dashboard', 'live', 'reports', 'history', 'services', 'tellers', 'accounts', 'settings']
});

const ADMIN_ROLE_SETTINGS = Object.freeze({
    user: [],
    admin: ['advertisement', 'announcement'],
    superadmin: ['configuration', 'advertisement', 'announcement', 'displayaudio', 'images', 'smsconfig', 'systemlogs']
});

let rolePermissionsData = null;
let currentAdminSession = null;
let allSystemAccounts = [];

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
    socket.on('role_permissions_updated', function (permissions) {
        rolePermissionsData = permissions;
        if (currentAdminSession) {
            applyAdminRoleAccess(currentAdminSession.role);
        }
    });

    $('#account-perm-select').on('change', function () {
        const accId = $(this).val();
        if (!accId) {
            $('#account-perm-container').slideUp(150);
            $('#clear-account-perm-btn').hide();
            return;
        }

        $('#account-perm-container').slideDown(150);
        $('#clear-account-perm-btn').show();

        const targetAccount = allSystemAccounts.find(a => String(a.id) === String(accId));
        const accRole = targetAccount ? normalizeAdminRole(targetAccount.role) : 'admin';

        const accOverrides = (rolePermissionsData && rolePermissionsData.accounts && rolePermissionsData.accounts[accId]) || null;

        const effectiveTabs = accOverrides && Array.isArray(accOverrides.tabs)
            ? accOverrides.tabs
            : (rolePermissionsData?.[accRole]?.tabs || ADMIN_ROLE_TABS[accRole] || []);

        const effectiveSettings = accOverrides && Array.isArray(accOverrides.settings)
            ? accOverrides.settings
            : (rolePermissionsData?.[accRole]?.settings || ADMIN_ROLE_SETTINGS[accRole] || []);

        $('.perm-check-account').prop('checked', false);
        effectiveTabs.forEach(t => {
            $(`.perm-check-account[data-type="tabs"][value="${t}"]`).prop('checked', true);
        });
        effectiveSettings.forEach(s => {
            $(`.perm-check-account[data-type="settings"][value="${s}"]`).prop('checked', true);
        });
    });

    $('#clear-account-perm-btn').click(function () {
        const accId = $('#account-perm-select').val();
        if (!accId) return;

        if (rolePermissionsData && rolePermissionsData.accounts) {
            delete rolePermissionsData.accounts[accId];
        }

        $('#account-perm-select').trigger('change');
        showMsg('info', 'Account override reset to role defaults.');
    });

    $('#role-permissions-form').submit(function (e) {
        e.preventDefault();

        const accountsPayload = (rolePermissionsData && typeof rolePermissionsData.accounts === 'object')
            ? { ...rolePermissionsData.accounts }
            : {};

        const selectedAccId = $('#account-perm-select').val();
        if (selectedAccId) {
            accountsPayload[selectedAccId] = {
                tabs: $('.perm-check-account[data-type="tabs"]:checked').map((_, el) => $(el).val()).get(),
                settings: $('.perm-check-account[data-type="settings"]:checked').map((_, el) => $(el).val()).get()
            };
        }

        const payload = {
            admin: {
                tabs: $('.perm-check[data-role="admin"][data-type="tabs"]:checked').map((_, el) => $(el).val()).get(),
                settings: $('.perm-check[data-role="admin"][data-type="settings"]:checked').map((_, el) => $(el).val()).get()
            },
            user: {
                tabs: $('.perm-check[data-role="user"][data-type="tabs"]:checked').map((_, el) => $(el).val()).get(),
                settings: $('.perm-check[data-role="user"][data-type="settings"]:checked').map((_, el) => $(el).val()).get()
            },
            accounts: accountsPayload
        };

        $.ajax({
            url: '/api/admin/role-permissions',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (res) {
                if (res.success) {
                    rolePermissionsData = res.permissions;
                    showMsg('success', 'Role and Account permissions saved successfully');
                    if (currentAdminSession) applyAdminRoleAccess(currentAdminSession.role);
                }
            },
            error: function (xhr) {
                showMsg('error', xhr.responseJSON?.error || 'Failed to save role permissions');
            }
        });
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
        localStorage.setItem('admin-theme', nextTheme);
        syncThemeControl();
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
    
    updateClock();
    setInterval(updateClock, 1000);
    syncThemeControl();
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
    return $.when(
        $.get('/api/check-session-admin'),
        $.get('/api/admin/role-permissions')
    ).done(function (sessionRes, permRes) {
        const res = sessionRes[0];
        if (!res.loggedIn) {
            window.location.href = '/admin';
        } else {
            currentAdminSession = res.admin;
            rolePermissionsData = permRes[0];
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

function getEffectivePermissions() {
    if (!currentAdminSession) return { tabs: [], settings: [] };

    const role = normalizeAdminRole(currentAdminSession.role);
    const accountId = String(currentAdminSession.id || '');
    const rawUsername = String(currentAdminSession.username || '').trim();
    const lowerUsername = rawUsername.toLowerCase();

    if (role === 'superadmin') {
        return {
            tabs: ['dashboard', 'live', 'reports', 'history', 'services', 'tellers', 'accounts', 'settings'],
            settings: ['configuration', 'advertisement', 'announcement', 'displayaudio', 'images', 'smsconfig', 'systemlogs']
        };
    }

    let allowedTabs = (rolePermissionsData && rolePermissionsData[role] && rolePermissionsData[role].tabs) || ADMIN_ROLE_TABS[role] || [];
    let allowedSettings = (rolePermissionsData && rolePermissionsData[role] && rolePermissionsData[role].settings) || ADMIN_ROLE_SETTINGS[role] || [];
    let allowedActions = role === 'user' ? [] : ['services_add'];

    if (rolePermissionsData && rolePermissionsData.accounts) {
        const accs = rolePermissionsData.accounts;
        let accPerm = accs[accountId] || accs[rawUsername] || accs[lowerUsername];
        if (!accPerm) {
            const matchedKey = Object.keys(accs).find(k => String(k).trim().toLowerCase() === lowerUsername || String(k).trim() === accountId);
            if (matchedKey) accPerm = accs[matchedKey];
        }

        if (accPerm) {
            if (Array.isArray(accPerm.tabs)) allowedTabs = accPerm.tabs;
            if (Array.isArray(accPerm.settings)) allowedSettings = accPerm.settings;
            if (Array.isArray(accPerm.actions)) allowedActions = accPerm.actions;
        }
    }

    if (!allowedTabs.includes('settings')) {
        allowedSettings = [];
    }

    return { tabs: allowedTabs, settings: allowedSettings, actions: allowedActions };
}

function getAllowedAdminTabs() {
    return getEffectivePermissions().tabs;
}

function canAccessAdminTab(tab) {
    return getAllowedAdminTabs().includes(String(tab || ''));
}

function getAllowedAdminSettings() {
    return getEffectivePermissions().settings;
}

function canAccessAdminSetting(setting) {
    return getAllowedAdminSettings().includes(String(setting || ''));
}

function canAccessAdminAction(actionKey) {
    if (!currentAdminSession) return false;
    const role = normalizeAdminRole(currentAdminSession.role);
    if (role === 'superadmin') return true;
    return getEffectivePermissions().actions.includes(String(actionKey || ''));
}

function applyAdminRoleAccess(role) {
    currentAdminRole = normalizeAdminRole(role || currentAdminSession?.role);
    const { tabs: allowedTabs, settings: allowedSettings } = getEffectivePermissions();

    if (!allowedTabs.length) {
        document.documentElement.classList.remove('admin-access-pending');
        Swal.fire({ icon: 'error', title: 'Access denied', text: 'This account does not have a valid console role.' })
            .then(() => logout());
        return;
    }

    $('[data-tab]').each(function () {
        const tabKey = String($(this).data('tab') || '');
        const allowed = allowedTabs.includes(tabKey);
        $(this).toggleClass('role-restricted', !allowed).attr('aria-hidden', String(!allowed));
        if (!allowed) $(this).attr('style', 'display: none !important;'); else $(this).removeAttr('style');
    });

    $('[data-jump-tab]').each(function () {
        const tabKey = String($(this).data('jump-tab') || '');
        const allowed = allowedTabs.includes(tabKey);
        $(this).toggleClass('role-restricted', !allowed);
        if (!allowed) $(this).attr('style', 'display: none !important;'); else $(this).removeAttr('style');
    });

    $('.tab-content[id$="-tab"]').each(function () {
        const tabKey = String(this.id).replace(/-tab$/, '');
        const allowed = allowedTabs.includes(tabKey);
        $(this).toggleClass('role-restricted', !allowed);
    });

    $('.sidebar-nav .nav-section-label').each(function () {
        const hasAllowedItem = $(this)
            .nextUntil('.nav-section-label', '.nav-item')
            .toArray()
            .some(item => !item.classList.contains('role-restricted') && $(item).css('display') !== 'none');
        $(this).toggleClass('role-restricted', !hasAllowedItem);
        if (!hasAllowedItem) $(this).attr('style', 'display: none !important;'); else $(this).removeAttr('style');
    });

    const hasSettingsTab = allowedTabs.includes('settings');
    $('.settingsMenu').toggleClass('role-restricted', !hasSettingsTab);
    if (!hasSettingsTab) {
        $('.settingsMenu').attr('style', 'display: none !important;');
    } else {
        $('.settingsMenu').removeAttr('style');
    }

    $('.settingsmenubtn').each(function () {
        const settingKey = String($(this).data('settingstab') || '');
        const allowed = hasSettingsTab && allowedSettings.includes(settingKey);
        $(this).toggleClass('role-restricted', !allowed).attr('aria-hidden', String(!allowed));
        if (!allowed) {
            $(this).attr('style', 'display: none !important;');
        } else {
            $(this).removeAttr('style');
        }
    });

    $('.settabs').each(function () {
        const settingKey = String(this.id || '').replace(/-settab$/, '');
        const allowed = hasSettingsTab && allowedSettings.includes(settingKey);
        $(this).toggleClass('role-restricted', !allowed);
    });

    const activeSetting = $('.settingsmenubtn.active').data('settingstab');
    if (allowedSettings.length && (!hasSettingsTab || !allowedSettings.includes(activeSetting))) {
        settingstabs(allowedSettings[0]);
    }

    document.documentElement.classList.remove('admin-access-pending');

    const initialTab = allowedTabs.includes(currentTab) ? currentTab : allowedTabs[0];
    switchTab(initialTab);
}

// & SWITCH TABS
function switchTab(tab) {
    if (!canAccessAdminTab(tab)) {
        const allowed = getAllowedAdminTabs();
        if (allowed.length > 0) {
            return switchTab(allowed[0]);
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
        if (el) el.pause();
    }else{
        if (el) el.play();
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

    $('#tab-title').text(titles[tab] || 'Admin Console');
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
        const allowedSettings = getAllowedAdminSettings();
        if (allowedSettings.length > 0) {
            return settingstabs(allowedSettings[0]);
        }
        return false;
    }

    $('.settingsmenubtn').removeClass('active');
    $(`.settingsmenubtn[data-settingstab="${tab}"]`).addClass('active');
    $('.settabs').removeClass('activetab');
    $(`#${tab}-settab`).addClass('activetab');

    // Load data for the tab
    if (tab === 'announcement') {
    }
    else if (tab === 'advertisement') {
    }
    else if (tab === 'images'){
    }
    else if (tab === 'systemlogs'){
        if (typeof loadSystemLogs === 'function') loadSystemLogs();
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
    currentModalType = type;
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
            <div class="form-group form-group-wide">
                <label for="sub-services-display">Sub services (comma-separated)</label>
                <input type="text" id="sub-services-display" class="form-control" value="${data?.sub_services || ''}" placeholder="e.g. Sub-service 1, Sub-service 2, Sub-service 3">
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
    } else if (type === 'multiplyTeller') {
        $.get('/api/admin/tellers').done((tellers) => {
            const tellerOptions = tellers.map(t => 
                `<option value="${t.id}" data-cuser="${t.cuser}" data-cnum="${t.cnum}">${t.cname} (${t.cuser})</option>`
            ).join('');

            const checkBoxes = Array.from({length: 20}, (_, i) => i + 1).map(n => `
                <label style="margin-right: 15px; display: inline-block;">
                    <input type="checkbox" class="multiply-cnum-checkbox" value="${n}"> ${n}
                </label>
            `).join('');

            $form.html(`
                <div class="form-group">
                    <label for="multiply-base-teller">Select Base Teller</label>
                    <select id="multiply-base-teller" class="form-control" required>
                        <option value="">-- Select a Teller --</option>
                        ${tellerOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="multiply-base-username">Base Username Prefix</label>
                    <input type="text" id="multiply-base-username" class="form-control" required>
                    <small style="color: var(--text-secondary); display: block; margin-top: 5px;">The counter number will be appended to this prefix (e.g. prefix "FAS450" + counter "2" = "FAS4502").</small>
                </div>
                <div class="form-group">
                    <label>Select Counter Numbers to Create (Check all that apply)</label>
                    <div style="margin-top: 10px; max-height: 150px; overflow-y: auto; border: 1px solid var(--console-border); padding: 10px; border-radius: 4px;">
                        ${checkBoxes}
                    </div>
                </div>
            `);

            $('#multiply-base-teller').on('change', function() {
                const selected = $(this).find('option:selected');
                let cuser = selected.data('cuser') || '';
                let cnum = selected.data('cnum') || '';
                if(cuser && cnum) {
                    const suffix = String(cnum);
                    if(cuser.endsWith(suffix)) {
                        cuser = cuser.substring(0, cuser.length - suffix.length);
                    }
                }
                $('#multiply-base-username').val(cuser);
                updateCheckboxes();
            });

            const existingUsernames = tellers.map(t => String(t.cuser).toLowerCase());

            function updateCheckboxes() {
                const prefix = $('#multiply-base-username').val().trim().toLowerCase();
                $('.multiply-cnum-checkbox').each(function() {
                    const n = $(this).val();
                    const targetUsername = prefix + n;
                    if (existingUsernames.includes(targetUsername)) {
                        $(this).prop('disabled', true).prop('checked', false);
                        $(this).parent().css('opacity', '0.5');
                        $(this).parent().attr('title', 'Username already exists');
                    } else {
                        $(this).prop('disabled', false);
                        $(this).parent().css('opacity', '1');
                        $(this).parent().removeAttr('title');
                    }
                });
            }

            $('#multiply-base-username').on('input', updateCheckboxes);
        }).fail(() => {
            showMsg('error', 'Failed to load tellers');
        });
    } else if (type === 'accounts') {
        const accRole = data?.role || 'admin';
        const accId = String(data?.id || '');
        const accOverrides = (rolePermissionsData && rolePermissionsData.accounts && (rolePermissionsData.accounts[accId] || rolePermissionsData.accounts[data?.username])) || null;

        const allowedTabs = accOverrides && Array.isArray(accOverrides.tabs)
            ? accOverrides.tabs
            : (rolePermissionsData?.[accRole]?.tabs || ADMIN_ROLE_TABS[accRole] || []);

        const allowedSettings = accOverrides && Array.isArray(accOverrides.settings)
            ? accOverrides.settings
            : (rolePermissionsData?.[accRole]?.settings || ADMIN_ROLE_SETTINGS[accRole] || []);

        const allowedActions = accOverrides && Array.isArray(accOverrides.actions)
            ? accOverrides.actions
            : (accRole === 'user' ? [] : ['services_add']);

        const allTabs = [
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'live', label: 'Live Queue' },
            { id: 'reports', label: 'Reports' },
            { id: 'history', label: 'History' },
            { id: 'services', label: 'Services' },
            { id: 'tellers', label: 'Tellers' },
            { id: 'settings', label: 'Settings' }
        ];

        const allSettings = [
            { id: 'configuration', label: 'Configurations' },
            { id: 'advertisement', label: 'Advertisement' },
            { id: 'announcement', label: 'Announcement' },
            { id: 'displayaudio', label: 'Display Audio' },
            { id: 'images', label: 'Images' },
            { id: 'smsconfig', label: 'SMS Config' },
            { id: 'systemlogs', label: 'System Logs' }
        ];

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
                <select id="ac-role" class="form-control">
                    <option value="superadmin" ${accRole === 'superadmin' ? 'selected' : ''}>Superadmin</option>
                    <option value="admin" ${accRole === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="user" ${accRole === 'user' ? 'selected' : ''}>User</option>
                </select>
            </div>

            <div class="form-group form-group-wide" style="margin-top: 15px; border-top: 1px solid var(--console-border); padding-top: 15px;">
                <label style="font-weight: 600; margin-bottom: 8px; display: block;">Account Specific Permissions</label>
                
                <div style="margin-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: 600; color: var(--console-muted); display: block; margin-bottom: 6px;">Sidebar Navigation Buttons:</span>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                        ${allTabs.map(t => `
                            <label style="font-size: 13px; font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" class="ac-perm-tab" value="${t.id}" ${allowedTabs.includes(t.id) ? 'checked' : ''}> ${t.label}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: 600; color: var(--console-muted); display: block; margin-bottom: 6px;">Settings Sub-menu Items:</span>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                        ${allSettings.map(s => `
                            <label class="ac-perm-setting-label" style="font-size: 13px; font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: opacity 0.15s ease;">
                                <input type="checkbox" class="ac-perm-setting" value="${s.id}" ${allowedSettings.includes(s.id) ? 'checked' : ''}> ${s.label}
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <span style="font-size: 12px; font-weight: 600; color: var(--console-muted); display: block; margin-bottom: 6px;">Feature Buttons & Actions:</span>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                        <label style="font-size: 13px; font-weight: normal; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            <input type="checkbox" class="ac-perm-action" value="services_add" ${allowedActions.includes('services_add') ? 'checked' : ''}> Add Service Button
                        </label>
                    </div>
                </div>
            </div>

            <div class="form-group form-group-wide">
                <label class="form-toggle-label" for="ac-active">
                    <input type="checkbox" id="ac-active" ${!data || Number(data?.status) === 1 ? 'checked' : ''}>
                    <span>Account is active</span>
                </label>
            </div>
        `);

        function syncSettingsSubmenuState() {
            const isSettingsChecked = $('.ac-perm-tab[value="settings"]').is(':checked');
            $('.ac-perm-setting').prop('disabled', !isSettingsChecked);
            $('.ac-perm-setting-label').css({
                'opacity': isSettingsChecked ? '1' : '0.45',
                'pointer-events': isSettingsChecked ? 'auto' : 'none'
            });
            if (!isSettingsChecked) {
                $('.ac-perm-setting').prop('checked', false);
            }
        }

        $(document).off('change.acSettingsSync', '.ac-perm-tab[value="settings"]')
                  .on('change.acSettingsSync', '.ac-perm-tab[value="settings"]', syncSettingsSubmenuState);

        $('#ac-role').on('change', function () {
            const newRole = normalizeAdminRole($(this).val());
            if (newRole === 'superadmin') {
                $('.ac-perm-tab, .ac-perm-setting, .ac-perm-action').prop('checked', true);
            } else if (newRole === 'admin') {
                const roleTabs = rolePermissionsData?.[newRole]?.tabs || ADMIN_ROLE_TABS[newRole] || [];
                const roleSettings = rolePermissionsData?.[newRole]?.settings || ADMIN_ROLE_SETTINGS[newRole] || [];
                $('.ac-perm-tab').each(function () {
                    $(this).prop('checked', roleTabs.includes($(this).val()));
                });
                $('.ac-perm-setting').each(function () {
                    $(this).prop('checked', roleSettings.includes($(this).val()));
                });
                $('.ac-perm-action[value="services_add"]').prop('checked', true);
            } else {
                const roleTabs = rolePermissionsData?.[newRole]?.tabs || ADMIN_ROLE_TABS[newRole] || [];
                const roleSettings = rolePermissionsData?.[newRole]?.settings || ADMIN_ROLE_SETTINGS[newRole] || [];
                $('.ac-perm-tab').each(function () {
                    $(this).prop('checked', roleTabs.includes($(this).val()));
                });
                $('.ac-perm-setting').each(function () {
                    $(this).prop('checked', roleSettings.includes($(this).val()));
                });
                $('.ac-perm-action').prop('checked', false);
            }
            syncSettingsSubmenuState();
        });

        syncSettingsSubmenuState();
    }
    $('#modal-overlay').show();
    $('#save-btn').off('click').on('click', saveItem);
}

// & ===== SAVE ITEM (CREATE/EDIT) =====
function saveItem() {

    if (currentModalType === 'multiplyTeller') {
        const baseTellerId = $('#multiply-base-teller').val();
        const baseUsername = $('#multiply-base-username').val();
        const targetNumbers = $('.multiply-cnum-checkbox:checked').map(function() { return parseInt($(this).val(), 10); }).get();

        if (!baseTellerId) return showMsg('error', 'Please select a base teller');
        if (!baseUsername || baseUsername.trim() === '') return showMsg('error', 'Base username is required');
        if (targetNumbers.length === 0) return showMsg('error', 'Please select at least one counter number');

        $.ajax({
            url: '/api/admin/tellers/multiply',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ baseTellerId, baseUsername: baseUsername.trim(), targetNumbers }),
            success: () => {
                $('#modal-overlay').hide();
                if (typeof loadTellers === 'function') loadTellers();
                showMsg('success', 'Tellers multiplied successfully!');
            },
            error: (xhr) => {
                showMsg('error', xhr.responseJSON?.error || 'Failed to multiply tellers');
            }
        });
        return;
    }

    if (currentTab === 'services') {

        const payload = {
            shortSname: $('#s-name-display').val().trim(),
            sub_sname: $('#sub-name-display').val().trim(),
            sub_services: $('#sub-services-display').val().trim(),
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
            success: (res) => {
                const targetId = String(editId || res?.id || '');
                const targetUser = String(rawusername || '').trim();
                const lowerUser = targetUser.toLowerCase();
                const isSettingsChecked = $('.ac-perm-tab[value="settings"]').is(':checked');

                if (targetId || targetUser) {
                    const currentAccs = (rolePermissionsData && typeof rolePermissionsData.accounts === 'object')
                        ? { ...rolePermissionsData.accounts }
                        : {};

                    const permObj = {
                        tabs: $('.ac-perm-tab:checked').map((_, el) => $(el).val()).get(),
                        settings: isSettingsChecked
                            ? $('.ac-perm-setting:checked').map((_, el) => $(el).val()).get()
                            : [],
                        actions: $('.ac-perm-action:checked').map((_, el) => $(el).val()).get()
                    };

                    if (targetId) currentAccs[targetId] = permObj;
                    if (targetUser) currentAccs[targetUser] = permObj;
                    if (lowerUser) currentAccs[lowerUser] = permObj;

                    const permPayload = {
                        user: rolePermissionsData?.user || { tabs: ['dashboard', 'live', 'reports', 'history'], settings: [] },
                        admin: rolePermissionsData?.admin || { tabs: ['dashboard', 'live', 'reports', 'history', 'services', 'tellers', 'settings'], settings: ['advertisement', 'announcement'] },
                        accounts: currentAccs
                    };

                    $.ajax({
                        url: '/api/admin/role-permissions',
                        method: 'PUT',
                        contentType: 'application/json',
                        data: JSON.stringify(permPayload),
                        success: (pRes) => {
                            if (pRes.success) {
                                rolePermissionsData = pRes.permissions;
                                if (currentAdminSession) applyAdminRoleAccess(currentAdminSession.role);
                            }
                        }
                    });
                }

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


