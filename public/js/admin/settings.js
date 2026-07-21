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

    if (typeof canAccessAdminSetting !== 'function' || canAccessAdminSetting('displayaudio')) {
        loadDisplayAudioSettings();
    }
    if (typeof canAccessAdminSetting !== 'function' || canAccessAdminSetting('configuration')) {
        loadSystemConfiguration();
    }
    loadSMSConfig();
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

let displayAudioConfig = {
    voice_enabled: true,
    voice: '',
    voice_uri: '',
    voice_name: '',
    voice_rate: 1,
    voice_pitch: 1,
    voice_volume: 0.8,
    bell_volume: 0.7,
    ad_volume: 0.5
};
let displayAudioVoices = [];
let selectedDisplayVoiceUri = '';
let displayBellTestAudio = null;
let displayAdTestTimer = null;

function clampAudioValue(value, minimum, maximum, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.min(maximum, Math.max(minimum, numeric)) : fallback;
}

function setAudioTestStatus(title, detail, state = 'ready') {
    const $status = $('#audio-test-status');
    $status.attr('data-state', state);
    $status.find('strong').text(title);
    $status.find('small').text(detail);
}

function updateDisplayAudioLabels() {
    const percent = value => `${Math.round(clampAudioValue(value, 0, 1, 0) * 100)}%`;
    $('#display-voice-volume-value').text(percent($('#display-voice-volume').val()));
    $('#display-bell-volume-value').text(percent($('#display-bell-volume').val()));
    $('#display-ad-volume-value').text(percent($('#display-ad-volume').val()));
    $('#display-voice-rate-value').text(`${clampAudioValue($('#display-voice-rate').val(), 0.5, 2, 1).toFixed(2)}×`);
    $('#display-voice-pitch-value').text(clampAudioValue($('#display-voice-pitch').val(), 0, 2, 1).toFixed(2));

    const enabled = $('#display-voice-enabled').is(':checked');
    $('#display-voice-enabled-label').text(enabled ? 'Enabled' : 'Disabled');
    $('#displayaudio-settab').toggleClass('voice-disabled', !enabled);
}

function findConfiguredDisplayVoice() {
    const configuredUri = selectedDisplayVoiceUri || displayAudioConfig.voice_uri || displayAudioConfig.voice;
    const configuredName = displayAudioConfig.voice_name || displayAudioConfig.voice;
    let selected = displayAudioVoices.find(voice => voice.voiceURI === configuredUri || voice.name === configuredName);
    const legacyIndex = Number(displayAudioConfig.voice);
    if (!selected && Number.isInteger(legacyIndex) && legacyIndex >= 0) selected = displayAudioVoices[legacyIndex];
    return selected || displayAudioVoices.find(voice => voice.default) || displayAudioVoices[0] || null;
}

function selectDisplayVoice(voiceUri) {
    selectedDisplayVoiceUri = voiceUri;
    $('input[name="display-voice-option"]').filter(function () {
        return this.value === voiceUri;
    }).prop('checked', true);
    $('#display-voice-list .display-voice-option').each(function () {
        const selected = $(this).find('input[type="radio"]').is(':checked');
        $(this).toggleClass('selected', selected);
        $(this).find('.voice-select-btn').text(selected ? 'Selected' : 'Select').toggleClass('btn-primary', selected).toggleClass('btn-secondary', !selected);
    });
}

function renderDisplayVoiceList() {
    const $list = $('#display-voice-list').empty();
    $('#display-voice-count').text(`${displayAudioVoices.length} ${displayAudioVoices.length === 1 ? 'voice' : 'voices'}`);

    if (!displayAudioVoices.length) {
        $list.append($('<div class="audio-empty-state"></div>').text('No speech voices are available in this browser. Install a system voice, then refresh this page.'));
        return;
    }

    const configured = findConfiguredDisplayVoice();
    selectedDisplayVoiceUri = configured?.voiceURI || '';

    displayAudioVoices.forEach((voice, index) => {
        const id = `display-voice-${index}`;
        const selected = voice.voiceURI === selectedDisplayVoiceUri;
        const $row = $('<label class="display-voice-option"></label>').toggleClass('selected', selected).attr('for', id);
        const $radio = $('<input type="radio" name="display-voice-option">').attr({ id, value: voice.voiceURI }).prop('checked', selected);
        const $copy = $('<span class="voice-option-copy"></span>');
        const $title = $('<span class="voice-option-title"></span>').append($('<strong></strong>').text(voice.name));
        if (voice.default) $title.append('<em>Default</em>');
        const detail = [voice.lang || 'Unknown language', voice.localService ? 'Local' : 'Online'].join(' · ');
        $copy.append($title, $('<small></small>').text(detail));
        const $button = $('<button type="button" class="btn voice-select-btn"></button>')
            .addClass(selected ? 'btn-primary' : 'btn-secondary')
            .text(selected ? 'Selected' : 'Select')
            .on('click', event => { event.preventDefault(); selectDisplayVoice(voice.voiceURI); });
        $radio.on('change', () => selectDisplayVoice(voice.voiceURI));
        $row.append($radio, $copy, $button);
        $list.append($row);
    });
}

function refreshDisplayVoices() {
    if (!('speechSynthesis' in window)) {
        displayAudioVoices = [];
        renderDisplayVoiceList();
        return;
    }
    displayAudioVoices = window.speechSynthesis.getVoices();
    renderDisplayVoiceList();
}

function populateDisplayAudioForm(config) {
    displayAudioConfig = { ...displayAudioConfig, ...config };
    selectedDisplayVoiceUri = displayAudioConfig.voice_uri || (typeof displayAudioConfig.voice === 'string' ? displayAudioConfig.voice : '');
    $('#display-voice-enabled').prop('checked', displayAudioConfig.voice_enabled !== false);
    $('#display-voice-volume').val(clampAudioValue(displayAudioConfig.voice_volume, 0, 1, 0.8));
    $('#display-voice-rate').val(clampAudioValue(displayAudioConfig.voice_rate, 0.5, 2, 1));
    $('#display-voice-pitch').val(clampAudioValue(displayAudioConfig.voice_pitch, 0, 2, 1));
    $('#display-bell-volume').val(clampAudioValue(displayAudioConfig.bell_volume, 0, 1, 0.7));
    $('#display-ad-volume').val(clampAudioValue(displayAudioConfig.ad_volume, 0, 1, 0.5));
    $('#display-voice-message-format').val(displayAudioConfig.voice_message_format || 'Serving #serviceticket on #counternumber');
    updateDisplayAudioLabels();
    refreshDisplayVoices();
}

function loadDisplayAudioSettings() {
    return $.get('/api/admin/display-audio', populateDisplayAudioForm)
        .fail(xhr => {
            if (xhr.status !== 403) showAjaxError(xhr);
        });
}

function collectDisplayAudioConfig() {
    const voice = displayAudioVoices.find(item => item.voiceURI === selectedDisplayVoiceUri) || findConfiguredDisplayVoice();
    return {
        voice_enabled: $('#display-voice-enabled').is(':checked'),
        voice: voice?.voiceURI || displayAudioConfig.voice || '',
        voice_uri: voice?.voiceURI || displayAudioConfig.voice_uri || '',
        voice_name: voice?.name || displayAudioConfig.voice_name || '',
        voice_rate: clampAudioValue($('#display-voice-rate').val(), 0.5, 2, 1),
        voice_pitch: clampAudioValue($('#display-voice-pitch').val(), 0, 2, 1),
        voice_volume: clampAudioValue($('#display-voice-volume').val(), 0, 1, 0.8),
        bell_volume: clampAudioValue($('#display-bell-volume').val(), 0, 1, 0.7),
        ad_volume: clampAudioValue($('#display-ad-volume').val(), 0, 1, 0.5),
        voice_message_format: $('#display-voice-message-format').val().trim() || 'Serving #serviceticket on #counternumber'
    };
}

function testDisplayVoice() {
    if (!('speechSynthesis' in window)) {
        setAudioTestStatus('Voice testing unavailable', 'This browser does not support speech synthesis.', 'error');
        return;
    }
    const config = collectDisplayAudioConfig();
    if (!config.voice_enabled) {
        setAudioTestStatus('Voice is disabled', 'Enable voice announcements before testing.', 'warning');
        return;
    }
    const formatStr = config.voice_message_format || 'Serving #serviceticket on #counternumber';
    const testMsg = formatStr.replace(/#serviceticket/gi, 'A one zero one').replace(/#counternumber/gi, 'two');
    const utterance = new SpeechSynthesisUtterance(testMsg);
    utterance.voice = displayAudioVoices.find(voice => voice.voiceURI === config.voice_uri) || null;
    utterance.rate = config.voice_rate;
    utterance.pitch = config.voice_pitch;
    utterance.volume = config.voice_volume;
    utterance.onstart = () => setAudioTestStatus('Testing announcement voice', config.voice_name || 'System default voice', 'playing');
    utterance.onend = () => setAudioTestStatus('Voice test complete', 'The selected speech settings are ready.', 'success');
    utterance.onerror = () => setAudioTestStatus('Voice test failed', 'Try another installed system voice.', 'error');
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

function testDisplayBell() {
    if (displayBellTestAudio) {
        displayBellTestAudio.pause();
        displayBellTestAudio.currentTime = 0;
    }
    displayBellTestAudio = new Audio('/audio/chime2.mp3');
    displayBellTestAudio.volume = clampAudioValue($('#display-bell-volume').val(), 0, 1, 0.7);
    displayBellTestAudio.onplay = () => setAudioTestStatus('Testing calling bell', `${Math.round(displayBellTestAudio.volume * 100)}% volume`, 'playing');
    displayBellTestAudio.onended = () => setAudioTestStatus('Bell test complete', 'The calling chime level is ready.', 'success');
    displayBellTestAudio.play().catch(() => setAudioTestStatus('Bell test blocked', 'Allow audio playback in this browser and try again.', 'error'));
}

function testDisplayAdvertisement() {
    const player = document.getElementById('adminAdPlayer');
    if (!player?.currentSrc && typeof playByIndex === 'function' && typeof adminAdsQueue !== 'undefined' && adminAdsQueue.length) playByIndex(adminCurrentIndex || 0, true);
    if (!player?.currentSrc && !player?.src) {
        setAudioTestStatus('No advertisement selected', 'Select a video in Advertisement settings first.', 'warning');
        return;
    }
    clearTimeout(displayAdTestTimer);
    player.muted = false;
    player.volume = clampAudioValue($('#display-ad-volume').val(), 0, 1, 0.5);
    player.play()
        .then(() => {
            setAudioTestStatus('Testing advertisement audio', `${Math.round(player.volume * 100)}% volume · test stops after 6 seconds`, 'playing');
            displayAdTestTimer = setTimeout(() => {
                player.pause();
                setAudioTestStatus('Advertisement test complete', 'The video audio level is ready.', 'success');
            }, 6000);
        })
        .catch(() => setAudioTestStatus('Advertisement test blocked', 'Select a video and allow playback, then try again.', 'error'));
}

$(function () {
    $('#display-audio-form').on('submit', function (event) {
        event.preventDefault();
        const config = collectDisplayAudioConfig();
        $.ajax({
            url: '/api/admin/display-audio',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(config),
            success: response => {
                populateDisplayAudioForm(response.config || config);
                setAudioTestStatus('Audio settings saved', 'Connected lobby displays were updated immediately.', 'success');
                showMsg('success', 'Display audio settings saved');
            },
            error: showAjaxError
        });
    });

    $('#displayaudio-settab input[type="range"]').on('input', function () {
        updateDisplayAudioLabels();
        if (this.id === 'display-ad-volume') {
            const player = document.getElementById('adminAdPlayer');
            if (player) player.volume = clampAudioValue(this.value, 0, 1, 0.5);
        }
    });
    $('#display-voice-enabled').on('change', updateDisplayAudioLabels);
    $('#test-display-voice').on('click', testDisplayVoice);
    $('#test-display-bell').on('click', testDisplayBell);
    $('#test-display-ad').on('click', testDisplayAdvertisement);

    if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', refreshDisplayVoices);

    function updateConfigurationToggleLabels() {
        $('#configuration-camscan-label').text($('#configuration-camscan').is(':checked') ? 'On' : 'Off');
        $('#configuration-online-ticketing-label').text($('#configuration-online-ticketing').is(':checked') ? 'On' : 'Off');
    }

    $('#configuration-camscan, #configuration-online-ticketing').on('change', updateConfigurationToggleLabels);

    $('#configuration-port').on('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 5);
    });

    $('#system-configuration-form').on('submit', function (event) {
        event.preventDefault();
        const port = $('#configuration-port').val().trim();
        const onlineTicketExpiry = $('#configuration-expiry').val().trim();

        if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
            return showMsg('error', 'Enter a valid server port from 1 to 65535 using no more than 5 digits.');
        }

        if (!/^\d+$/.test(onlineTicketExpiry) || Number(onlineTicketExpiry) < 1 || Number(onlineTicketExpiry) > 999999) {
            return showMsg('error', 'Enter a valid online ticket expiry from 1 to 999999 minutes.');
        }

        const $button = $('#save-system-configuration').prop('disabled', true).text('Saving…');
        $.ajax({
            url: '/api/admin/configuration',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                port,
                camscan: $('#configuration-camscan').is(':checked'),
                onlineTicketExpiry,
                onlineTicketing: $('#configuration-online-ticketing').is(':checked')
            }),
            success: response => {
                populateSystemConfiguration(response.config);
                $('#configuration-save-note').text(response.restartRequired
                    ? 'Saved. Restart the application to use the new server port.'
                    : 'Saved. Toggle and expiry changes are now active.');
                showMsg('success', response.restartRequired
                    ? 'Configurations saved. Restart the application to apply the new port.'
                    : 'Configurations saved successfully.');
            },
            error: showAjaxError,
            complete: () => $button.prop('disabled', false).text('Save configurations')
        });
    });

    window.updateConfigurationToggleLabels = updateConfigurationToggleLabels;
});

function populateSystemConfiguration(config) {
    if (!config) return;
    $('#configuration-port').val(config.port ?? '');
    $('#configuration-expiry').val(config.onlineTicketExpiry ?? '');
    $('#configuration-camscan').prop('checked', config.camscan === true);
    $('#configuration-online-ticketing').prop('checked', config.onlineTicketing === true);
    if (typeof window.updateConfigurationToggleLabels === 'function') window.updateConfigurationToggleLabels();
}

function loadSystemConfiguration() {
    return $.get('/api/admin/configuration', populateSystemConfiguration)
        .fail(xhr => {
            if (xhr.status !== 403) showAjaxError(xhr);
        });
}

// Image Upload logic
function setupImageUpload(inputId, thumbnailId, statusId, type) {
    $(inputId).on('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            Swal.fire('Error', 'Only PNG, JPG, and JPEG images are allowed.', 'error');
            $(inputId).val('');
            return;
        }

        let warningText = '';
        if (type === 'banner') {
            warningText = 'For best display quality, banner images should be 3840x216 px or 1920x108px.';
        } else if (type === 'bg') {
            warningText = 'For best display quality, background images should be 1920x1080 px.';
        }

        Swal.fire({
            title: 'Continue upload?',
            text: warningText,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, upload it'
        }).then((result) => {
            if (result.isConfirmed) {
                $(statusId).text('Converting & Uploading...').css('color', 'orange');

                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        const dataUrl = canvas.toDataURL('image/png');
                        
                        // Update thumbnail immediately
                        $(thumbnailId).attr('src', dataUrl);

                        // Send to backend
                        $.ajax({
                            url: '/api/admin/upload-image',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ type: type, data: dataUrl }),
                            success: function(res) {
                                $(statusId).text('Uploaded successfully').css('color', 'green');
                                $(thumbnailId).attr('src', '/images/' + res.filename + '?v=' + new Date().getTime());
                                setTimeout(() => $(statusId).text(''), 3000);
                            },
                            error: function(err) {
                                console.error(err);
                                $(statusId).text('Upload failed').css('color', 'red');
                                Swal.fire('Error', 'Failed to upload image.', 'error');
                            }
                        });
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                $(inputId).val(''); // Clear selection if cancelled
            }
        });
    });
}

$(document).ready(function() {
    setupImageUpload('#bannerUpload', '#bannerThumbnail', '#bannerUploadStatus', 'banner');
    setupImageUpload('#bgUpload', '#bgThumbnail', '#bgUploadStatus', 'bg');
});

window.previewFullImage = function(imagePath) {
    const url = imagePath + '?v=' + new Date().getTime();
    Swal.fire({
        imageUrl: url,
        imageAlt: 'Preview',
        width: '80%',
        showConfirmButton: false,
        showCloseButton: true,
        background: '#1a1a1a',
        customClass: {
            image: 'modal-full-image'
        }
    });
};

// ~ ===== SMS CONFIGURATION =====
function loadSMSConfig() {
    $.get('/api/admin/sms-config', function (data) {
        if (data.success) {
            $('#setting-allowsms').prop('checked', data.allowSms);
            $('#setting-branch').val(data.branch);
            $('#setting-serial-port').val(data.serialPort || 'COM3');
            $('#setting-serial-baudrate').val(data.serialBaudrate || 9600);
            $('#setting-privacy').val(data.privacyPolicy);
            $('#setting-call-gap').val(data.callRangeGap || 0);
            
            if (data.sms_messages) {
                $('#setting-msg-generate').val(data.sms_messages.generate?.message || '');
                $('#setting-msg-call').val(data.sms_messages.call?.message || '');
                $('#setting-msg-forward').val(data.sms_messages.forward?.message || '');
                $('#setting-msg-hold').val(data.sms_messages.hold?.message || '');
                $('#setting-msg-void').val(data.sms_messages.void?.message || '');
                $('#setting-msg-finish').val(data.sms_messages.finish?.message || '');
                $('#setting-msg-nearly').val(data.sms_messages.nearly_called?.message || '');
            }
        }
    }).fail(function () {
        console.error('Failed to load SMS configuration');
    });
}

$(document).on('submit', '#sms-config-form', function (e) {
    e.preventDefault();
    const sms_messages = {
        "generate": { "type": "generate", "message": $('#setting-msg-generate').val() },
        "call": { "type": "call", "message": $('#setting-msg-call').val() },
        "forward": { "type": "forward", "message": $('#setting-msg-forward').val() },
        "hold": { "type": "hold", "message": $('#setting-msg-hold').val() },
        "void": { "type": "void", "message": $('#setting-msg-void').val() },
        "finish": { "type": "finish", "message": $('#setting-msg-finish').val() },
        "nearly_called": { "type": "nearly_called", "message": $('#setting-msg-nearly').val() }
    };

    const payload = {
        allowSms: $('#setting-allowsms').is(':checked'),
        branch: $('#setting-branch').val(),
        serialPort: $('#setting-serial-port').val(),
        serialBaudrate: parseInt($('#setting-serial-baudrate').val(), 10) || 9600,
        privacyPolicy: $('#setting-privacy').val(),
        callRangeGap: $('#setting-call-gap').val(),
        sms_messages: sms_messages
    };

    $.ajax({
        url: '/api/admin/sms-config',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: () => {
            if (typeof showMsg === 'function') {
                showMsg('success', 'SMS Configuration saved successfully!');
            } else {
                alert('SMS Configuration saved successfully!');
            }
        },
        error: (xhr) => {
            console.error(xhr.responseText);
            if (typeof showMsg === 'function') {
                showMsg('error', 'Failed to save SMS Configuration');
            } else {
                alert('Failed to save SMS Configuration');
            }
        }
    });
});

// ~ ===== SYSTEM LOGS =====
function loadSystemLogs() {
    $.get('/api/admin/logs/error', function(data) {
        const lines = data.split('\n').filter(l => l.trim());
        const reversed = lines.reverse().join('\n');
        $('#error-log-viewer').text(reversed || 'No error logs found.');
    }).fail(function() {
        $('#error-log-viewer').text('Failed to load error logs.');
    });

    $.get('/api/admin/logs/system', function(data) {
        $('#system-log-viewer').text(data || 'No system logs found.');
    }).fail(function() {
        $('#system-log-viewer').text('Failed to load system logs.');
    });
}

async function clearLog(type) {
    const logTitle = type === 'error' ? 'Error Logs' : 'System Logs';
    const result = await Swal.fire({
        title: `Clear ${logTitle}?`,
        text: 'Are you sure you want to clear these logs? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, clear logs',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
    });

    if (!result.isConfirmed) return;

    try {
        await $.ajax({
            url: '/api/admin/logs/' + type,
            method: 'DELETE'
        });
        await Swal.fire({
            icon: 'success',
            title: 'Cleared!',
            text: `${logTitle} cleared successfully.`,
            timer: 1500,
            showConfirmButton: false
        });
        loadSystemLogs();
    } catch(err) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to clear logs.'
        });
    }
}

async function exportLog(type) {
    const logTitle = type === 'error' ? 'Error Logs' : 'System Logs';
    const { value: format } = await Swal.fire({
        title: `Export ${logTitle}`,
        text: 'Select the export file format:',
        input: 'select',
        inputOptions: {
            'log': '.log (Raw Log File)',
            'txt': '.txt (Plain Text File)',
            'csv': '.csv (CSV Document)'
        },
        inputValue: 'log',
        showCancelButton: true,
        confirmButtonText: 'Download Log',
        cancelButtonText: 'Cancel'
    });

    if (format) {
        window.location.href = `/api/admin/logs/export/${type}?format=${format}`;
    }
}

$(document).on('click', '.settingsmenubtn[data-settingstab="systemlogs"]', function() {
    loadSystemLogs();
});
