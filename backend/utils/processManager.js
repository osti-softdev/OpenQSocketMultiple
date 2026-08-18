const fs = require("fs");
const os = require("os");
const { closeDb } = require("../db/db");

function isProcessRunning(pid) {
    try {
        if (os.platform() === "win32") {
            const { execSync } = require("child_process");
            const result = execSync(
                `tasklist /FI "PID eq ${pid}" /FO CSV`,
                { encoding: "utf-8" }
            );
            return result.toLowerCase().includes("node.exe");
        } else {
            process.kill(pid, 0);
            const cmdlinePath = `/proc/${pid}/cmdline`;
            if (fs.existsSync(cmdlinePath)) {
                const cmdline = fs.readFileSync(cmdlinePath, "utf-8");
                return cmdline.includes("node") && cmdline.includes("index.js");
            }
            return false;
        }
    } catch (err) {
        return false;
    }
}

function checkAndHandleExistingInstance(pidFile) {
    if (fs.existsSync(pidFile)) {
        const pid = parseInt(fs.readFileSync(pidFile, "utf-8"), 10);
        if (isNaN(pid)) {
            console.warn(`Invalid PID in ${pidFile}. Removing file.`);
            fs.unlinkSync(pidFile);
            return false;
        }
        if (isProcessRunning(pid)) {
            console.error(`Process ${pid} is already running. Exiting.`);
            return true;
        } else {
            console.log(`Stale PID ${pid} found in ${pidFile}. Removing file.`);
            fs.unlinkSync(pidFile);
        }
    }
    return false;
}

function writePidFile(pidFile) {
    try {
        fs.writeFileSync(pidFile, process.pid.toString(), "utf-8");
        console.log(`Wrote PID ${process.pid} to ${pidFile}`);
    } catch (err) {
        console.error(`Failed to write PID file: ${err.message}`);
    }
}

async function gracefulShutdown(signal, server, pidFile, smstype, cleanupGPIO) {
    console.log(`Received ${signal}. Shutting down server...`);

    try {
        if (fs.existsSync(pidFile)) {
            fs.unlinkSync(pidFile);
            console.log(`Removed PID file ${pidFile}`);
        }
        closeDb();

        // Cleanup services
        const { cleanupGSMPorts } = require("../services/smsService");
        if (smstype == 1) await cleanupGSMPorts();
        if (cleanupGPIO) await cleanupGPIO();

        await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
        });

        console.log("✅ Shutdown complete");
    } catch (err) {
        console.error("❌ Error during shutdown:", err.message);
    }
}

function setupProcessHandlers(server, pidFile, smstype, cleanupGPIO) {
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM", server, pidFile, smstype, cleanupGPIO));
    process.on("SIGINT", () => gracefulShutdown("SIGINT", server, pidFile, smstype, cleanupGPIO));

    process.on("uncaughtException", (err) => {
        console.error("Uncaught Exception:", err.message);
        gracefulShutdown("UNCAUGHT_EXCEPTION", server, pidFile, smstype, cleanupGPIO);
    });

    process.on("unhandledRejection", (reason, promise) => {
        console.error("Unhandled Rejection at:", promise, "reason:", reason);
        gracefulShutdown("UNHANDLED_REJECTION", server, pidFile, smstype, cleanupGPIO);
    });
}

module.exports = {
    checkAndHandleExistingInstance,
    writePidFile,
    setupProcessHandlers,
    gracefulShutdown
};
