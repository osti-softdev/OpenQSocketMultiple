const fs = require("fs");
const path = require("path");

const backend = global.BACKEND_PATH;
const rootpath = global.ROOT_PATH;
const { readSoundConfig } = require("../utilities/soundConfig");
const { resolveActiveSchedule } = require("../utilities/scheduleResolver");

const RECHECK_INTERVAL_MS = 15 * 1000; // re-resolve schedules every 15s

let lastLibraryList = [];   // full folder contents -> feeds the admin video library
let lastDisplayQueue = [];  // schedule-resolved queue -> feeds the public display
let voiceConfig = readSoundConfig();

// --- Setup ads module ---
function setupAds(io) {
    const rootUtil = global.BACKEND_PATH || __dirname;
    const db = require(path.join(rootUtil, "utilities/db"));
    const adsFolder = path.join(rootpath, "public", "ads");

    function existingFiles() {
        if (!fs.existsSync(adsFolder)) return [];
        return fs.readdirSync(adsFolder).filter(f => /\.(mp4|webm|ogg)$/i.test(f));
    }

    async function getPlaylistFiles(playlistId) {
        const rows = await db.allAsync(
            `SELECT filename FROM playlist_items WHERE playlist_id = ? ORDER BY order_index ASC`,
            [playlistId]
        );
        const onDisk = new Set(existingFiles());
        return rows.map(r => r.filename).filter(f => onDisk.has(f));
    }

    async function getDefaultPlaylistFiles() {
        const defaultPlaylist = await db.getAsync(`SELECT id FROM playlists WHERE is_default = 1 LIMIT 1`);
        if (!defaultPlaylist) return [];
        return getPlaylistFiles(defaultPlaylist.id);
    }

    /**
     * Figures out what should currently be playing ON THE DISPLAY:
     * 1. A pinned video or scheduled playlist active right now (highest priority wins)
     * 2. Falls back to the default playlist
     * NOTE: this is NOT the same thing as "every uploaded file" — see gatherAds().
     */
    async function resolveCurrentQueue() {
        const schedules = await db.allAsync(`SELECT * FROM schedules WHERE active = 1`);
        const winner = resolveActiveSchedule(schedules, new Date());

        if (!winner) return getDefaultPlaylistFiles();

        if (winner.type === "video") {
            const onDisk = new Set(existingFiles());
            return onDisk.has(winner.video_filename) ? [winner.video_filename] : getDefaultPlaylistFiles();
        }

        const files = await getPlaylistFiles(winner.playlist_id);
        return files.length ? files : getDefaultPlaylistFiles();
    }

    // Full folder listing — used by the admin panel's video library (adminads.js).
    // Deliberately unaffected by scheduling, so admins can always see/rename/delete
    // every uploaded file regardless of what's currently scheduled to play.
    function gatherAds() {
        return existingFiles();
    }

    async function sendStateToClient(socket) {
        voiceConfig = readSoundConfig();

        const library = gatherAds();
        const displayQueue = await resolveCurrentQueue();
        lastLibraryList = library;
        lastDisplayQueue = displayQueue;

        socket.emit("adsList", {
            ads: library,
            urls: library.map(n => `/ads/${encodeURIComponent(n)}`),
            volume: voiceConfig.ad_volume
        });
        socket.emit("displayQueue", {
            ads: displayQueue,
            urls: displayQueue.map(n => `/ads/${encodeURIComponent(n)}`),
            volume: voiceConfig.ad_volume
        });
        socket.emit("voiceConfigUpdate", voiceConfig);
    }

    async function broadcastState({ force = false } = {}) {
        voiceConfig = readSoundConfig();

        const library = gatherAds();
        const displayQueue = await resolveCurrentQueue();

        const libraryChanged = force || library.join(",") !== lastLibraryList.join(",");
        const queueChanged = force || displayQueue.join(",") !== lastDisplayQueue.join(",");

        lastLibraryList = library;
        lastDisplayQueue = displayQueue;

        if (libraryChanged) {
            io.emit("adsList", {
                ads: library,
                urls: library.map(n => `/ads/${encodeURIComponent(n)}`),
                volume: voiceConfig.ad_volume
            });
        }
        if (queueChanged) {
            io.emit("displayQueue", {
                ads: displayQueue,
                urls: displayQueue.map(n => `/ads/${encodeURIComponent(n)}`),
                volume: voiceConfig.ad_volume
            });
        }
        if (libraryChanged || queueChanged) {
            io.emit("voiceConfigUpdate", voiceConfig);
        }
    }

    // Initialize state
    broadcastState({ force: true });

    // Re-check on a timer so a schedule window starting/ending gets picked up
    // even if nobody uploads/edits anything at that exact moment.
    setInterval(() => broadcastState().catch(err => console.error("[ADS] Recheck failed:", err)), RECHECK_INTERVAL_MS);

    // Socket connection
    io.on("connection", socket => {
        console.log(`[ADS] Client connected: ${socket.id}`);
        sendStateToClient(socket).catch(err => console.error("[ADS] sendStateToClient failed:", err));

        socket.on("requestAd", () => {
            sendStateToClient(socket).catch(err => console.error("[ADS] requestAd failed:", err));
        });
        socket.on("disconnect", () => console.log(`[ADS] Client disconnected: ${socket.id}`));
    });

    // Called by videos.js after upload/rename/delete, and by the playlist/schedule
    // routes after any CRUD change.
    function refreshAds() {
        broadcastState({ force: true }).catch(err => console.error("[ADS] refreshAds failed:", err));
    }

    return { refreshAds, gatherAds, resolveCurrentQueue };
}

module.exports = { setupAds };