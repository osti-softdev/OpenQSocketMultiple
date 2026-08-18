const { settupsettingsaccounts } = require("../services/admin/adminsettingsaccounts");
const { admincontent3chartsdata } = require("../services/admin/adminDashboardcontent3chartsdata");
const { admincontent2averages } = require("../services/admin/adminDashboardcontent2averages");
const { admincontent4alldata } = require("../services/admin/adminDashboardcontent4");
const { adminoveralldatawatcher } = require("../services/admin/adminDashboardData");
const { setupFooterWatcheradmin } = require("../services/admin/footerwatcheradmin");
const { setupColorWatcheradmin } = require("../services/admin/colorswatcheradmin");
const { setupAdminTeller } = require("../services/admin/adminsettingsteller");
const { setupAds } = require("../services/getads");
const { setupFooterWatcher } = require("../services/footerwatcher");
const { setupdisplaycolorwatcher } = require("../services/colorwatcher");
const { handleGetAllServices } = require("../services/getallservices");
const { setupServicesDisplayWatcher } = require("../services/servicesDisplayWatcher");
const { setupSoundSettingsAdmin } = require("../services/admin/adminvoiceandvolume");
const { admincontentSaveChartImage } = require("../services/admin/adminSaveChartImage");
const { settupsettingsservices } = require("../services/admin/adminsettingservices");
const { setupsystemconfigurations } = require("../services/admin/adminsettingssystem");
const { setupLoginSocket } = require("../services/admin/adminlogin");
const { initializeGSM } = require("../services/smsService");
const { setupCalledTicketsWatcher } = require("../services/calledTicketsWatcher");
const { setupLoginSocketteller } = require("../services/teller/tellerlogin");
const { setupTellerWatcher } = require("../services/teller/tellerserviceswatcher");
const { initializeWindowedKiosk } = require("../services/kiosk/kiosk");
const { getClientIp } = require("../security/security");
const fs = require("fs");
const { exec } = require("child_process");

function setupSockets(io, smstype, pidFile) {
    io.on("connection", (socket) => {
        const clientId = socket.id;
        const ip = getClientIp(socket);
        console.log(`🔌 Client connected: ${clientId} | IP: ${ip}`);

        try {
            settupsettingsaccounts(socket, io);
            admincontent3chartsdata(socket, io);
            admincontent2averages(socket, io);
            admincontent4alldata(socket, io);
            adminoveralldatawatcher(socket, io);
            setupFooterWatcheradmin(socket, io);
            setupColorWatcheradmin(socket, io);
            setupAdminTeller(socket, io);
            setupAds(socket, io);
            setupFooterWatcher(socket, io);
            setupdisplaycolorwatcher(socket, io);
            handleGetAllServices(socket);
            setupServicesDisplayWatcher(socket, io);
            setupSoundSettingsAdmin(socket, io);
            admincontentSaveChartImage(socket, io);
            settupsettingsservices(socket, io);
            setupsystemconfigurations(socket, io);
            setupLoginSocket(socket, io);

            socket.on("relaunchApp", async () => {
                console.log("♻️ Relaunch command received via socket");
                try {
                    const exePath = process.execPath;
                    console.log(`Relaunching app from path: ${exePath}`);
                    
                    if (!fs.existsSync(pidFile)) {
                        console.error(`PID file not found: ${pidFile}`);
                        process.exit(1);
                    }

                    const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
                    if (isNaN(pid)) {
                        console.error(`Invalid PID in ${pidFile}`);
                        process.exit(1);
                    }

                    console.log(`Stopping process ${pid}...`);

                    if (process.platform === 'win32') {
                        exec(`taskkill /PID ${pid} /F`, (err, stdout, stderr) => {
                            if (err) {
                                console.error('Failed to stop process:', err.message);
                                process.exit(1);
                            }
                            try { fs.unlinkSync(pidFile); } catch(e) {}
                            console.log('Stopped.');
                        });
                    } else {
                        try {
                            process.kill(pid, 'SIGTERM');
                            try { fs.unlinkSync(pidFile); } catch(e) {}
                            console.log('Stopped.');
                        } catch (err) {
                            console.error('Failed to stop process:', err.message);
                            process.exit(1);
                        }
                    }
                } catch (err) {
                    console.error("❌ Failed to relaunch app:", err.message);
                }
            });

            if (smstype == 1) {
                initializeGSM(io);
            }

            setupCalledTicketsWatcher(socket, io);
            setupLoginSocketteller(socket);
            setupTellerWatcher(socket, io);
            initializeWindowedKiosk(socket, io);

        } catch (err) {
            console.error(`Error in Socket.IO connection handler: ${err.message}`);
            socket.emit("error", { message: "Server error during initialization" });
            socket.disconnect(true);
        }

        socket.on("error", (err) => {
            console.error(`Socket error for client ${clientId}: ${err.message}`);
        });

        socket.on("disconnect", () => {
            console.log(`🔌 Client disconnected: ${clientId} | IP: ${ip}`);
        });
    });
}

module.exports = { setupSockets };
