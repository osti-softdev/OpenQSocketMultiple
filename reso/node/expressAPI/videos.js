const path = require("path");
const fs = require("fs");
const multer = require("multer");
const express = require("express");
const rootpath =
    global.outfolderPath || path.join(__dirname, "../../../outfolder");
    
module.exports = function setupVideosApi(appExpress) {
  // Static serve
  // appExpress.use(
  //   "/ads",
  //   express.static(path.join(rootpath, "ads"), {
  //     etag: false,
  //     lastModified: false,
  //     setHeaders: (res, filePath) => {
  //       if (filePath.endsWith(".mp4")) {
  //         res.setHeader("Content-Type", "video/mp4");
  //       } else if (filePath.endsWith(".webm")) {
  //         res.setHeader("Content-Type", "video/webm");
  //       } else if (filePath.endsWith(".ogg")) {
  //         res.setHeader("Content-Type", "video/ogg");
  //       } else {
  //         res.setHeader("Content-Type", "application/octet-stream");
  //       }
  //       res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  //       res.setHeader("Pragma", "no-cache");
  //       res.setHeader("Expires", "0");
  //     },
  //   })
  // );

  // List videos
  appExpress.get("/ads", (req, res) => {
    const videoDir = path.join(rootpath, "ads");
    fs.readdir(videoDir, (err, files) => {
      if (err) return res.status(500).send("Unable to retrieve videos");
      res.json(files.filter((f) => /\.(mp4|webm|ogg|mkv|avi|mov|flv|wmv)$/i.test(f)));
    });
  });

  // Multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(rootpath, "ads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const videoPath = path.join(rootpath, "ads", file.originalname);
      if (fs.existsSync(videoPath)) return cb(new Error("Video already exists"));
      cb(null, file.originalname);
    },
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const filetypes = /mp4|webm|ogg/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);
      if (extname && mimetype) return cb(null, true);
      cb(new Error("Only MP4, WebM, or Ogg video files are allowed"));
    },
  });

  // Upload video
  appExpress.post("/upload-video", upload.single("video"), (req, res) => {
    if (!req.file) return res.status(400).send("No file uploaded or invalid format");
    res.send(`Video uploaded successfully: ${req.file.filename}`);
  });

  // Rename video
  appExpress.put("/rename-video", express.json(), (req, res) => {
    const { oldName, newName } = req.body || {};
    if (!oldName || !newName) return res.status(400).send("oldName and newName required");

    const src = path.join(rootpath, "ads", oldName);
    const dst = path.join(rootpath, "ads", newName);
    if (!fs.existsSync(src)) return res.status(404).send("Source file not found");
    if (fs.existsSync(dst)) return res.status(409).send("A file with the new name already exists");

    try {
      fs.renameSync(src, dst);
      res.send("OK");
    } catch (e) {
      console.error(e);
      res.status(500).send("Rename failed");
    }
  });

  // Delete video
  appExpress.delete("/delete-video/:videoName", (req, res) => {
    const videoPath = path.join(rootpath, "ads", req.params.videoName);
    fs.unlink(videoPath, (err) => {
      if (err) return res.status(500).send("Failed to delete video");
      res.send(`Video ${req.params.videoName} deleted successfully`);
    });
  });
};
