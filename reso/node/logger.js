// reso/node/utils/logger.js
const fs = require("fs");
const path = require("path");

// Ensure log directory exists
const rootpath =
	global.ROOT_PATH;
const logDir = path.join(rootpath, "logs");
fs.mkdirSync(logDir, { recursive: true });

// Create log file streams
const errorLogStream = fs.createWriteStream(path.join(logDir, "error.log"), {
	flags: "a",
});
const infoLogStream = fs.createWriteStream(path.join(logDir, "logs.log"), {
	flags: "a",
});

// Custom consoles
const errorConsole = new console.Console({
	stdout: process.stdout,
	stderr: errorLogStream,
});
const infoConsole = new console.Console({
	stdout: infoLogStream,
	stderr: process.stderr,
});

// Helper: Get filename and line number from stack
function getCallerInfo() {
	const err = new Error();
	const stack = err.stack.split("\n");
	const callerLine = stack[3] || stack[2] || "";
	const match = callerLine.match(/\((.*):(\d+):(\d+)\)/);
	if (match) {
		const [, file, line] = match;
		return `${path.relative(rootpath, file)}:${line}`;
	}
	return "unknown";
}

// Delete logs.log if older than 1 month
function cleanupLogsLog() {
	const filePath = path.join(logDir, "logs.log");
	if (!fs.existsSync(filePath)) return;

	const stats = fs.statSync(filePath);
	const now = Date.now();
	const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

	if (now - stats.mtimeMs > oneMonth) {
		fs.unlink(filePath, (err) => {
			if (err) {
				console.error("Failed to delete logs.log:", err);
			} else {
				console.log("Deleted logs.log because it was older than 1 month.");
			}
		});
	}
}

// Override default logging behavior
function setupLogger() {
	// Clean up logs.log on startup
	cleanupLogsLog();

	console.error = (...args) => {
		const timestamp = new Date().toISOString();
		const callerInfo = getCallerInfo();
		const logMessage = `❌ ${timestamp} [${callerInfo}]`;
		errorConsole.error(logMessage, ...args);
		process.stderr.write(`${logMessage} ${args.join(" ")}\n`);
	};

	console.log = (...args) => {
		const timestamp = new Date().toISOString();
		const callerInfo = getCallerInfo();
		const logMessage = `✔ ${timestamp} [${callerInfo}]`;
		process.stdout.write(`${logMessage} ${args.join(" ")}\n`);
		infoConsole.log(logMessage, ...args);
	};

	console.log("Logger initialized at:", logDir);
}

module.exports = { setupLogger };
