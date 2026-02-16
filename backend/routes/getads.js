const fs = require("fs");
const path = require("path");

const backend = global.BACKEND_PATH;
const rootpath = global.ROOT_PATH;

let lastAdsList = [];
let voiceConfig = { voice: 0, ad_volume: 0.5 };

// --- Setup ads module ---
function setupAds(io) {
    const adsFolder = path.join(rootpath, "public", "ads");
    const configFolder = path.join(backend, "config");
    const soundandvoice = path.join(configFolder, "soundandvoice.json");
    const defaultConfig = { voice: 0, ad_volume: 0.5 };

    function ensureConfigFile() {
        if (!fs.existsSync(configFolder)) fs.mkdirSync(configFolder, { recursive: true });
        if (!fs.existsSync(soundandvoice)) fs.writeFileSync(soundandvoice, JSON.stringify(defaultConfig, null, 2), "utf8");
    }

    function gatherAds() {
        if (!fs.existsSync(adsFolder)) return [];
        return fs.readdirSync(adsFolder).filter(f => /\.(mp4|webm|ogg)$/i.test(f));
    }

    function loadVoiceConfig() {
        ensureConfigFile();
        try {
            const raw = fs.readFileSync(soundandvoice, "utf8");
            const config = JSON.parse(raw);
            return { voice: config.voice ?? 0, ad_volume: config.ad_volume ?? 0.5 };
        } catch (err) {
            console.warn("[ADS] Invalid JSON, using defaults");
            return defaultConfig;
        }
    }

    function sendAdsListToClient(socket) {
        socket.emit("adsList", {
            ads: lastAdsList,
            urls: lastAdsList.map(n => `/ads/${encodeURIComponent(n)}`),
            volume: voiceConfig.ad_volume
        });
    }

    // Initialize
    lastAdsList = gatherAds();
    voiceConfig = loadVoiceConfig();
    io.emit("adsList", {
        ads: lastAdsList,
        urls: lastAdsList.map(n => `/ads/${encodeURIComponent(n)}`),
        volume: voiceConfig.ad_volume
    });

    // Socket connection
    io.on("connection", socket => {
        console.log(`[ADS] Client connected: ${socket.id}`);
        sendAdsListToClient(socket);

        socket.on("requestAd", () => sendAdsListToClient(socket));
        socket.on("disconnect", () => console.log(`[ADS] Client disconnected: ${socket.id}`));
    });

    // Expose helper to refresh ads list
    function refreshAds() {
        lastAdsList = gatherAds();
        io.emit("adsList", {
            ads: lastAdsList,
            urls: lastAdsList.map(n => `/ads/${encodeURIComponent(n)}`),
            volume: voiceConfig.ad_volume
        });
    }

    return { refreshAds, gatherAds };
}

module.exports = { setupAds };
