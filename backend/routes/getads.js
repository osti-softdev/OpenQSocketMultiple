const fs = require("fs");
const path = require("path");

const backend = global.BACKEND_PATH;
const rootpath = global.ROOT_PATH;
const { readSoundConfig } = require('../utilities/soundConfig');

let lastAdsList = [];
let voiceConfig = readSoundConfig();

// --- Setup ads module ---
function setupAds(io) {
    const adsFolder = path.join(rootpath, "public", "ads");
    function gatherAds() {
        if (!fs.existsSync(adsFolder)) return [];
        return fs.readdirSync(adsFolder).filter(f => /\.(mp4|webm|ogg)$/i.test(f));
    }

    function sendAdsListToClient(socket) {
        voiceConfig = readSoundConfig();
        socket.emit("adsList", {
            ads: lastAdsList,
            urls: lastAdsList.map(n => `/ads/${encodeURIComponent(n)}`),
            volume: voiceConfig.ad_volume
        });
        socket.emit('voiceConfigUpdate', voiceConfig);
    }

    // Initialize
    lastAdsList = gatherAds();
    voiceConfig = readSoundConfig();
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
        voiceConfig = readSoundConfig();
        io.emit("adsList", {
            ads: lastAdsList,
            urls: lastAdsList.map(n => `/ads/${encodeURIComponent(n)}`),
            volume: voiceConfig.ad_volume
        });
        io.emit('voiceConfigUpdate', voiceConfig);
    }

    return { refreshAds, gatherAds };
}

module.exports = { setupAds };
