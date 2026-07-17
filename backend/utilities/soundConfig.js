const fs = require('fs');
const path = require('path');

const configPath = path.join(global.BACKEND_PATH || path.join(__dirname, '..'), 'config', 'soundandvoice.json');

const DEFAULT_SOUND_CONFIG = Object.freeze({
    voice_enabled: true,
    voice: '',
    voice_uri: '',
    voice_name: '',
    voice_rate: 1,
    voice_pitch: 1,
    voice_volume: 0.8,
    bell_volume: 0.7,
    ad_volume: 0.5
});

function clamp(value, minimum, maximum, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.min(maximum, Math.max(minimum, numeric)) : fallback;
}

function normalizeSoundConfig(input = {}) {
    const legacyVoice = typeof input.voice === 'number' ? input.voice : String(input.voice || '').trim();
    return {
        voice_enabled: input.voice_enabled === undefined
            ? DEFAULT_SOUND_CONFIG.voice_enabled
            : input.voice_enabled === true || input.voice_enabled === 1 || input.voice_enabled === '1',
        voice: legacyVoice,
        voice_uri: String(input.voice_uri || (typeof legacyVoice === 'string' ? legacyVoice : '')).trim().slice(0, 500),
        voice_name: String(input.voice_name || '').trim().slice(0, 200),
        voice_rate: clamp(input.voice_rate, 0.5, 2, DEFAULT_SOUND_CONFIG.voice_rate),
        voice_pitch: clamp(input.voice_pitch, 0, 2, DEFAULT_SOUND_CONFIG.voice_pitch),
        voice_volume: clamp(input.voice_volume, 0, 1, DEFAULT_SOUND_CONFIG.voice_volume),
        bell_volume: clamp(input.bell_volume, 0, 1, DEFAULT_SOUND_CONFIG.bell_volume),
        ad_volume: clamp(input.ad_volume, 0, 1, DEFAULT_SOUND_CONFIG.ad_volume)
    };
}

function ensureSoundConfig() {
    const directory = path.dirname(configPath);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(DEFAULT_SOUND_CONFIG, null, 2), 'utf8');
    }
}

function readSoundConfig() {
    ensureSoundConfig();
    try {
        return normalizeSoundConfig(JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch (error) {
        console.warn('[AUDIO] Invalid sound configuration, using defaults:', error.message);
        return { ...DEFAULT_SOUND_CONFIG };
    }
}

function writeSoundConfig(input) {
    ensureSoundConfig();
    const normalized = normalizeSoundConfig(input);
    const temporaryPath = `${configPath}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(normalized, null, 2), 'utf8');
    fs.renameSync(temporaryPath, configPath);
    return normalized;
}

module.exports = {
    DEFAULT_SOUND_CONFIG,
    normalizeSoundConfig,
    readSoundConfig,
    writeSoundConfig
};
