// ===== Security Module =====
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto.scryptSync("openq-super-secret-key-2026", "salt-openq", 32);
const IV_LENGTH = 16;

const JWT_SECRET = process.env.OPENQ_JWT_SECRET || "openq-jwt-secret-key-2026-san-pedro";
const SESSION_SECRET = process.env.OPENQ_SESSION_SECRET || "asdasdasd-wejjks9qweqewe-cdvfretvert-asdrace323c23-c234234cf3324234-2026asds";
const BCRYPT_ROUNDS = 10;

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

function isBcryptHash(value) {
	return typeof value === "string" && /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

async function hashPassword(plainPassword) {
	const normalized = String(plainPassword ?? "");
	if (!normalized) return "";
	if (isBcryptHash(normalized)) return normalized;
	return bcrypt.hash(normalized, BCRYPT_ROUNDS);
}

async function verifyAndUpgradePassword(plainInput, storedPassword, upgradeCallback) {
	const input = String(plainInput ?? "");
	const stored = String(storedPassword ?? "");
	if (!input || !stored) return false;

	if (isBcryptHash(stored)) {
		return bcrypt.compare(input, stored);
	}

	if (input !== stored) {
		return false;
	}

	if (typeof upgradeCallback === "function") {
		try {
			const upgradedHash = await bcrypt.hash(input, BCRYPT_ROUNDS);
			await upgradeCallback(upgradedHash);
		} catch (err) {
			console.error("[Security] Auto-upgrade password hash failed:", err.message);
		}
	}

	return true;
}

function securityHeaders(req, res, next) {
	res.setHeader("X-Content-Type-Options", "nosniff");
	res.setHeader("X-Frame-Options", "SAMEORIGIN");
	res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
	next();
}

function encrypt(text) {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
	let encrypted = cipher.update(String(text));
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
	const textParts = String(text).split(":");
	if (textParts.length < 2) throw new Error("Invalid token format");
	const iv = Buffer.from(textParts.shift(), "hex");
	const encryptedText = Buffer.from(textParts.join(":"), "hex");
	const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}

// --- Exports ---
module.exports = {
	normalizeIp,
	getClientIp,
	JWT_SECRET,
	SESSION_SECRET,
	isBcryptHash,
	hashPassword,
	verifyAndUpgradePassword,
	securityHeaders,
	encrypt,
	decrypt
};
