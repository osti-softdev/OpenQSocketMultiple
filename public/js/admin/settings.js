// Settings Module for Admin Panel

// ~ ===== SETTINGS =====
function loadSettings() {
    $.get('/api/settings', function (settings) {
        // Announcement 1
        $('#setting-announcement').val(settings.announcement?.value ?? '');
        $('#setting-announcement-status').prop('checked', settings.announcement?.status === 1);
        $('#annstats').text(settings.announcement?.status === 1 ? 'Active' : 'Inactive');

        // Announcement 2
        $('#setting-announcement2').val(settings.announcement2?.value ?? '');
        $('#setting-announcement-status2').prop('checked', settings.announcement2?.status === 1);
        $('#annstats2').text(settings.announcement2?.status === 1 ? 'Active' : 'Inactive');

        // Announcement 3
        $('#setting-announcement3').val(settings.announcement3?.value ?? '');
        $('#setting-announcement-status3').prop('checked', settings.announcement3?.status === 1);
        $('#annstats3').text(settings.announcement3?.status === 1 ? 'Active' : 'Inactive');

        function isValidHex(val) {
            return /^#[0-9a-fA-F]{6}$/.test(val);
        }

        // Form 2
        $('#setting-announcement-bgcolor').val(isValidHex(settings.annbgcolor?.value) ? settings.annbgcolor.value : '#000000');
        $('#setting-announcement-textcolor').val(isValidHex(settings.anntextcolor?.value) ? settings.anntextcolor.value : '#ffffff');
        $('#setting-announcement-speed').val(settings.annspeed?.value || 1);
        $('.speedlbl').text(settings.annspeed?.value + "s" || 1);
    });
}

// & ===== SAVE SETTINGS =====
function saveSettings(param) {

    if (param === 'form1') {
        const payload = {
            announcement: {
                value: $('#setting-announcement').val(),
                status: $('#setting-announcement-status').is(':checked') ? 1 : 0
            },

            announcement2: {
                value: $('#setting-announcement2').val(),
                status: $('#setting-announcement-status2').is(':checked') ? 1 : 0
            },

            announcement3: {
                value: $('#setting-announcement3').val(),
                status: $('#setting-announcement-status3').is(':checked') ? 1 : 0
            }
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
    }else{
        const payload = {
            annbgcolor: $('#setting-announcement-bgcolor').val(),
            anntextcolor: $('#setting-announcement-textcolor').val(),
            annspeed: $('#setting-announcement-speed').val()
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
}
