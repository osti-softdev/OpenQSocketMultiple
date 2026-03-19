const path = require("path");
const fs = require("fs");
const multer = require("multer");
const express = require("express");

const rootpath = global.ROOT_PATH;

module.exports = function setupVideosApi(app, adsModule) {
    // Serve ads statically
    app.use(
        "/ads",
        express.static(path.join(rootpath, "/public/ads"), {
            etag: false,
            lastModified: false,
            setHeaders: (res, filePath) => {
                if (filePath.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
                else if (filePath.endsWith(".webm")) res.setHeader("Content-Type", "video/webm");
                else if (filePath.endsWith(".ogg")) res.setHeader("Content-Type", "video/ogg");
                else res.setHeader("Content-Type", "application/octet-stream");

                res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
                res.setHeader("Pragma", "no-cache");
                res.setHeader("Expires", "0");
            }
        })
    );

    app.use(
    "/ads",
        express.static(path.join(rootpath, "/public/ads"), {
            maxAge: "30d",
            immutable: true,
            setHeaders: (res, filePath) => {
                if (filePath.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
                else if (filePath.endsWith(".webm")) res.setHeader("Content-Type", "video/webm");
                else if (filePath.endsWith(".ogg")) res.setHeader("Content-Type", "video/ogg");
            }
        })
    );


    // Multer setup
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(rootpath, "public/ads");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const videoPath = path.join(rootpath, "public/ads", file.originalname);
            if (fs.existsSync(videoPath)) return cb(new Error("Video already exists"));
            cb(null, file.originalname);
        }
    });

    const upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
            const types = /mp4|webm|ogg/;
            const ext = types.test(path.extname(file.originalname).toLowerCase());
            const mime = types.test(file.mimetype);
            if (ext && mime) return cb(null, true);
            cb(new Error("Only MP4, WebM, or Ogg videos allowed"));
        }
    });

    // Upload
    app.post("/upload-video", upload.single("video"), (req, res) => {
        if (!req.file) return res.status(400).send("No file uploaded or invalid format");
        adsModule.refreshAds();
        res.send(`Video uploaded successfully: ${req.file.filename}`);
        adsModule.refreshAds();
    });

    // Rename
    app.put("/rename-video", express.json(), (req, res) => {
        const { oldName, newName } = req.body || {};
        if (!oldName || !newName) return res.status(400).send("oldName and newName required");

        const src = path.join(rootpath, "public/ads", oldName);
        const dst = path.join(rootpath, "public/ads", newName);

        if (!fs.existsSync(src)) return res.status(404).send("Source file not found");
        if (fs.existsSync(dst)) return res.status(409).send("A file with the new name already exists");

        try {
            fs.renameSync(src, dst);
            adsModule.refreshAds();
            res.send("OK");
            adsModule.refreshAds();
        } catch (e) {
            console.error(e);
            res.status(500).send("Rename failed");
        }
    });

    // Delete
    app.delete("/delete-video/:videoName", (req, res) => {
        const videoPath = path.join(rootpath, "public/ads", req.params.videoName);
        fs.unlink(videoPath, err => {
            if (err) return res.status(500).send("Failed to delete video");
            adsModule.refreshAds();
            res.send(`Video ${req.params.videoName} deleted successfully`);
            adsModule.refreshAds();
        });
    });

    // List videos (optional)
    app.get("/ads", (req, res) => {
        const dir = path.join(rootpath, "public/ads");
        fs.readdir(dir, (err, files) => {
            if (err) return res.status(500).send("Unable to retrieve videos");
            res.json(files.filter(f => /\.(mp4|webm|ogg)$/i.test(f)));
        });
    });
};
