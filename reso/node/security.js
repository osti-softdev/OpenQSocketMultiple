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

// --- Exports ---
module.exports = {
	getClientIp,
};
