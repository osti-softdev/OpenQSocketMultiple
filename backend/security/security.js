// ===== Security Module =====
const path = require("path");
const fs = require("fs");
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");

// --- Normalize IP helper ---
function normalizeIp(ip) {
	if (!ip) return "127.0.0.1";
	if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
	if (ip === "::1") return "127.0.0.1";
	return ip;
}

// --- Client IP helper for Socket.IO ---
function getClientIp(socket) {
	const forwarded = socket.handshake.headers["x-forwarded-for"];
	if (forwarded) return normalizeIp(forwarded.split(",")[0].trim());
	return normalizeIp(socket.handshake.address);
}

// --- Whitelist Loader ---
const whitelistFile = path.join(rootpath, "/config/allowedListip.json");
let allowedIps = [];

function loadWhitelist() {
	try {
		if (fs.existsSync(whitelistFile)) {
			const raw = fs.readFileSync(whitelistFile, "utf-8");
			allowedIps = JSON.parse(raw);
			if (!Array.isArray(allowedIps)) allowedIps = [];
			console.log("✔ Loaded IP whitelist:", allowedIps);
		} else {
			console.warn(
				"⚠ No allowedListip.json found, defaulting to localhost only"
			);
			allowedIps = ["127.0.0.1"];
		}
	} catch (err) {
		console.error("❌ Failed to load whitelist:", err.message);
		allowedIps = ["127.0.0.1"];
	}
}
loadWhitelist();

// --- Express Middleware for IP Whitelist ---
function expressIpWhitelist(appExpress) {
	appExpress.use((req, res, next) => {
		const clientIp = normalizeIp(
			req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress
		);
		if (!allowedIps.includes(clientIp)) {
			console.warn(`🚫 Blocked HTTP request from unauthorized IP: ${clientIp}`);
			return res.status(403).send("Forbidden");
		}
		next();
	});
}

// --- Socket.IO Middleware for IP Whitelist ---
function socketIoWhitelist(io) {
	io.use((socket, next) => {
		const clientIp = getClientIp(socket);
		if (!allowedIps.includes(clientIp)) {
			console.warn(
				`🚫 Blocked Socket.IO connection from unauthorized IP: ${clientIp}`
			);
			return next(new Error("Unauthorized"));
		}
		next();
	});
}

// --- Cache Control Headers ---
function setNoCacheHeaders(res) {
	res.setHeader(
		"Cache-Control",
		"no-store, no-cache, must-revalidate, private"
	);
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
}

// --- Block access to sensitive folders ---
function blockSensitiveRoutes(appExpress) {
	const blockedPatterns = [
		/^\/reso\/js/,
		/^\/reso\/css/,
		/^\/reso\/libs/,
		/^\/reso\/node/,
		/^\/reso\/html(?!\/(kiosk\.html|index\.html))/,
	];
	appExpress.use((req, res, next) => {
		if (blockedPatterns.some((pattern) => pattern.test(req.url))) {
			return res
				.status(404)
				.send("Content unavailable. Resource was not cached.");
		}
		next();
	});
}

// --- Exports ---
module.exports = {
	normalizeIp,
	getClientIp,
	setNoCacheHeaders,
	expressIpWhitelist,
	socketIoWhitelist,
	blockSensitiveRoutes,
};
