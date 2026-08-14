const express = require("express");
const { requireRole } = require("../utilities/authsession");

module.exports = function setupAdsSchedulingApi(app, adsModule) {
    const rootUtil = global.BACKEND_PATH || __dirname;
    const path = require("path");
    const db = require(path.join(rootUtil, "utilities/db"));

    const requireSettingsAccess = requireRole("admin", "superadmin");
    const router = express.Router();
    router.use(express.json());
    router.use(requireSettingsAccess);

    // =========================
    // PLAYLISTS
    // =========================

    // List all playlists with their items
    router.get("/playlists", async (req, res) => {
        try {
            const playlists = await db.allAsync(`SELECT * FROM playlists ORDER BY is_default DESC, name ASC`);
            for (const p of playlists) {
                p.items = await db.allAsync(
                    `SELECT id, filename, order_index FROM playlist_items WHERE playlist_id = ? ORDER BY order_index ASC`,
                    [p.id]
                );
            }
            res.json({ success: true, playlists });
        } catch (err) {
            console.error("[ADS] Failed to list playlists:", err);
            res.status(500).json({ success: false, message: "Failed to list playlists" });
        }
    });

    // Create playlist
    router.post("/playlists", async (req, res) => {
        try {
            const { name, filenames } = req.body || {};
            if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Playlist name is required" });

            const result = await db.runAsync(`INSERT INTO playlists (name) VALUES (?)`, [name.trim()]);
            const playlistId = result.lastID;

            if (Array.isArray(filenames)) {
                for (let i = 0; i < filenames.length; i++) {
                    await db.runAsync(
                        `INSERT INTO playlist_items (playlist_id, filename, order_index) VALUES (?, ?, ?)`,
                        [playlistId, filenames[i], i]
                    );
                }
            }

            res.json({ success: true, playlistId });
        } catch (err) {
            console.error("[ADS] Failed to create playlist:", err);
            res.status(500).json({ success: false, message: "Failed to create playlist" });
        }
    });

    // Rename playlist
    router.put("/playlists/:id", async (req, res) => {
        try {
            const { name } = req.body || {};
            if (!name || !name.trim()) return res.status(400).json({ success: false, message: "Playlist name is required" });

            await db.runAsync(`UPDATE playlists SET name = ? WHERE id = ?`, [name.trim(), req.params.id]);
            res.json({ success: true });
        } catch (err) {
            console.error("[ADS] Failed to rename playlist:", err);
            res.status(500).json({ success: false, message: "Failed to rename playlist" });
        }
    });

    // Delete playlist (blocked if it's the default one, or if a schedule still points to it)
    router.delete("/playlists/:id", async (req, res) => {
        try {
            const playlist = await db.getAsync(`SELECT * FROM playlists WHERE id = ?`, [req.params.id]);
            if (!playlist) return res.status(404).json({ success: false, message: "Playlist not found" });
            if (playlist.is_default) return res.status(400).json({ success: false, message: "Cannot delete the default playlist" });

            const inUse = await db.getAsync(`SELECT id FROM schedules WHERE playlist_id = ? LIMIT 1`, [req.params.id]);
            if (inUse) return res.status(409).json({ success: false, message: "Playlist is used by a schedule — remove that schedule first" });

            await db.runAsync(`DELETE FROM playlists WHERE id = ?`, [req.params.id]);
            adsModule.refreshAds();
            res.json({ success: true });
        } catch (err) {
            console.error("[ADS] Failed to delete playlist:", err);
            res.status(500).json({ success: false, message: "Failed to delete playlist" });
        }
    });

    // Replace a playlist's items + order in one go (simplest for a drag-and-drop UI)
    router.put("/playlists/:id/items", async (req, res) => {
        try {
            const { filenames } = req.body || {};
            if (!Array.isArray(filenames)) return res.status(400).json({ success: false, message: "filenames must be an array" });

            await db.runAsync(`DELETE FROM playlist_items WHERE playlist_id = ?`, [req.params.id]);
            for (let i = 0; i < filenames.length; i++) {
                await db.runAsync(
                    `INSERT INTO playlist_items (playlist_id, filename, order_index) VALUES (?, ?, ?)`,
                    [req.params.id, filenames[i], i]
                );
            }

            adsModule.refreshAds();
            res.json({ success: true });
        } catch (err) {
            console.error("[ADS] Failed to update playlist items:", err);
            res.status(500).json({ success: false, message: "Failed to update playlist items" });
        }
    });

    // =========================
    // SCHEDULES
    // =========================

    router.get("/schedules", async (req, res) => {
        try {
            const schedules = await db.allAsync(`SELECT * FROM schedules ORDER BY priority DESC, id DESC`);
            res.json({ success: true, schedules });
        } catch (err) {
            console.error("[ADS] Failed to list schedules:", err);
            res.status(500).json({ success: false, message: "Failed to list schedules" });
        }
    });

    router.post("/schedules", async (req, res) => {
        try {
            const s = validateSchedulePayload(req.body);
            if (s.error) return res.status(400).json({ success: false, message: s.error });

            const result = await db.runAsync(
                `INSERT INTO schedules (name, type, playlist_id, video_filename, start_date, end_date, start_time, end_time, days_of_week, priority, active, color)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [s.name, s.type, s.playlist_id, s.video_filename, s.start_date, s.end_date, s.start_time, s.end_time, s.days_of_week, s.priority, s.active, s.color]
            );

            adsModule.refreshAds();
            res.json({ success: true, scheduleId: result.lastID });
        } catch (err) {
            console.error("[ADS] Failed to create schedule:", err);
            res.status(500).json({ success: false, message: "Failed to create schedule" });
        }
    });

    router.put("/schedules/:id", async (req, res) => {
        try {
            const s = validateSchedulePayload(req.body);
            if (s.error) return res.status(400).json({ success: false, message: s.error });

            await db.runAsync(
                `UPDATE schedules SET name=?, type=?, playlist_id=?, video_filename=?, start_date=?, end_date=?, start_time=?, end_time=?, days_of_week=?, priority=?, active=?, color=?
                 WHERE id = ?`,
                [s.name, s.type, s.playlist_id, s.video_filename, s.start_date, s.end_date, s.start_time, s.end_time, s.days_of_week, s.priority, s.active, s.color, req.params.id]
            );

            adsModule.refreshAds();
            res.json({ success: true });
        } catch (err) {
            console.error("[ADS] Failed to update schedule:", err);
            res.status(500).json({ success: false, message: "Failed to update schedule" });
        }
    });

    router.delete("/schedules/:id", async (req, res) => {
        try {
            await db.runAsync(`DELETE FROM schedules WHERE id = ?`, [req.params.id]);
            adsModule.refreshAds();
            res.json({ success: true });
        } catch (err) {
            console.error("[ADS] Failed to delete schedule:", err);
            res.status(500).json({ success: false, message: "Failed to delete schedule" });
        }
    });

    // Quick toggle without sending the whole payload back
    router.patch("/schedules/:id/active", async (req, res) => {
        try {
            const { active } = req.body || {};
            await db.runAsync(`UPDATE schedules SET active = ? WHERE id = ?`, [active ? 1 : 0, req.params.id]);
            adsModule.refreshAds();
            res.json({ success: true });
        } catch (err) {
            console.error("[ADS] Failed to toggle schedule:", err);
            res.status(500).json({ success: false, message: "Failed to toggle schedule" });
        }
    });

    // Lets the admin preview panel show "what would be playing at this moment" without waiting
    router.get("/schedules/preview", async (req, res) => {
        try {
            const ads = await adsModule.resolveCurrentQueue();
            res.json({ success: true, ads });
        } catch (err) {
            console.error("[ADS] Failed to preview schedule:", err);
            res.status(500).json({ success: false, message: "Failed to preview schedule" });
        }
    });

    app.use("/api/ads", router);
};

function validateSchedulePayload(body) {
    const {
        name, type, playlist_id, video_filename,
        start_date, end_date, start_time, end_time,
        days_of_week, priority, active, color
    } = body || {};

    if (!name || !name.trim()) return { error: "Schedule name is required" };
    if (type !== "playlist" && type !== "video") return { error: "type must be 'playlist' or 'video'" };
    if (type === "playlist" && !playlist_id) return { error: "playlist_id is required for a playlist schedule" };
    if (type === "video" && !video_filename) return { error: "video_filename is required for a pinned video schedule" };
    if (!start_time || !end_time) return { error: "start_time and end_time are required" };

    return {
        name: name.trim(),
        type,
        playlist_id: type === "playlist" ? playlist_id : null,
        video_filename: type === "video" ? video_filename : null,
        start_date: start_date || null,
        end_date: end_date || null,
        start_time,
        end_time,
        days_of_week: Array.isArray(days_of_week) ? days_of_week.join(",") : (days_of_week || null),
        priority: Number.isFinite(Number(priority)) ? Number(priority) : 0,
        active: active === false ? 0 : 1,
        color: color || '#4f6df5'
    };
}
