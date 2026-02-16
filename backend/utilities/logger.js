// reso/node/utils/logger.js
const fs = require("fs");
const path = require("path");

// Ensure log directory exists
const rootpath =
	global.ROOT_PATH;
const logDir = path.join(rootpath,"public","logs");
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
// reso/node/utils/logger.js
// ... (keep the rest of your file the same)

function getCallerInfo() {
    const err = new Error();
    const stackLines = err.stack ? err.stack.split('\n') : [];

    // We usually want to skip:
    // 0: Error
    // 1: getCallerInfo()
    // 2: the override wrapper (console.log / console.error)
    // → start looking from index ~3 and go deeper

    const SKIP_PATTERNS = [
        /at\s+(?:Error\.)?getCallerInfo/,           // this function
        /at\s+console\.(log|error|info|warn)/,      // your override
        /\/utils\/logger\.js/,                      // this logger file
        /node:internal\//,                          // node internals
        /node_modules\//,                           // dependencies
        /<anonymous>/,
        /at eval/,
        /at runMicrotasks/,
        /at processTicksAndRejections/,
        /at async /
    ];

    for (let i = 3; i < stackLines.length; i++) {   // start from ~3, go deep if needed
        const line = stackLines[i].trim();

        // Skip lines we don't care about
        if (SKIP_PATTERNS.some(pattern => pattern.test(line))) {
            continue;
        }

        // Try both common formats
        let match = line.match(/\((.+?):(\d+):(\d+)\)$/);
        if (!match) {
            match = line.match(/at\s+(?:async\s+)?(?:.+?\s+)?\((.+?):(\d+):(\d+)\)$/);
        }
        if (!match) {
            match = line.match(/at\s+(?:async\s+)?(.+?):(\d+):(\d+)$/);
        }

        if (match) {
            let filePath = match[1];
            const lineNum = match[2];
            // const colNum  = match[3];   // you can include column if you want

            // Clean up messy paths
            if (filePath.startsWith('file://')) {
                filePath = filePath.replace(/^file:\/\//, '');
            }

            // Make relative to project root (your global.ROOT_PATH)
            let relativePath = filePath;
            try {
                relativePath = path.relative(rootpath, filePath);
                if (relativePath.startsWith('..') || relativePath === '') {
                    relativePath = path.basename(filePath); // fallback
                }
            } catch (e) {
                // ignore — use original
            }

            return `${relativePath}:${lineNum}`;
        }
    }

    return "unknown-location";
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
