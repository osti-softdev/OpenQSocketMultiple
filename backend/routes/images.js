const path = require("path");
const fs = require("fs");
const multer = require("multer");
const express = require("express");

const rootpath =
	global.outfolderPath || path.join(__dirname, "../../../outfolder");

module.exports = function setupImagesApi(appExpress, io) {
	// 🔹 Ensure images folder exists
	const imgDir = path.join(rootpath, "images");
	if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

	// Multer storage
	const imgStorage = multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, imgDir);
		},
		filename: (req, file, cb) => {
			cb(null, file.originalname); // always save with original filename
		},
	});

	const uploadImg = multer({
		storage: imgStorage,
		fileFilter: (req, file, cb) => {
			if (
				path.extname(file.originalname).toLowerCase() === ".png" &&
				file.mimetype === "image/png"
			) {
				return cb(null, true);
			}
			cb(new Error("Only PNG images are allowed"));
		},
	});

	// 🔹 Helper to notify all clients via io
	function notifyClients(message) {
		io.emit("imagesupdates", { prerefresh: true, message });
	}

	// Upload endpoint (generic)
	appExpress.post("/upload-image", uploadImg.single("image"), (req, res) => {
		if (!req.file)
			return res.status(400).send("No file uploaded or invalid format");

		const filePath = path.join(imgDir, req.file.originalname);
		const existed = fs.existsSync(filePath);

		notifyClients(
			existed
				? `Image replaced: ${req.file.filename}`
				: `Image uploaded: ${req.file.filename}`
		);

		res.send(
			existed
				? `Image replaced successfully: ${req.file.filename}`
				: `Image uploaded successfully: ${req.file.filename}`
		);
	});

	// Upload endpoint (banner.png)
	appExpress.post("/upload-banner", uploadImg.single("image"), (req, res) => {
		if (!req.file)
			return res.status(400).send("No file uploaded or invalid format");

		const filePath = path.join(imgDir, "banner.png");
		const existed = fs.existsSync(filePath);

		fs.renameSync(req.file.path, filePath);

		notifyClients(existed ? "Banner replaced" : "Banner uploaded");

		res.send(
			existed
				? "Banner image replaced successfully"
				: "Banner image uploaded successfully"
		);
	});

	// Upload endpoint (bg.png)
	appExpress.post("/upload-bg", uploadImg.single("image"), (req, res) => {
		if (!req.file)
			return res.status(400).send("No file uploaded or invalid format");

		const filePath = path.join(imgDir, "bg.png");
		const existed = fs.existsSync(filePath);

		fs.renameSync(req.file.path, filePath);

		notifyClients(existed ? "Background replaced" : "Background uploaded");

		res.send(
			existed
				? "Background image replaced successfully"
				: "Background image uploaded successfully"
		);
	});
};
