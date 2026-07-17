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

    loadDisplayAudioSettings();
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
        ad_volume: clampAudioValue($('#display-ad-volume').val(), 0, 1, 0.5)
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
    const utterance = new SpeechSynthesisUtterance('Now serving ticket A one zero one. Please proceed to counter two.');
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
});
