// reso/node/servicesDisplay.js
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const { getPHDateTime } = require("./datetime");

const dbPath = path.join(rootpath, "/config/db.db");
let watcherAdded = false;
/**
 * Fetch all services with their latest ticket (filtered by today & status)
 */
async function getServicesWithLatestTicket() {
	const { date } = getPHDateTime();

	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) return reject(err);
		});

		const query = `
    WITH ranked_transactions AS (
        SELECT
            sname,
            ticketservice,
            ticketnum,
            status,
            ROW_NUMBER() OVER (
                PARTITION BY sname
                ORDER BY start_time DESC, ticketnum DESC
            ) AS rn
        FROM transactions
        WHERE date = ?
          AND status IN ('calling','finished','called','held','received','voided')
    )
    SELECT 
        s.sname,
        rt.ticketservice,
        rt.ticketnum,
        rt.status
    FROM services s
    LEFT JOIN ranked_transactions rt
        ON s.sname = rt.sname
       AND rt.rn = 1
    WHERE s.status = 1
    ORDER BY s.sname;
`;


		db.all(query, [date], (err, rows) => {
			db.close();
			if (err) return reject(err);

			const services = rows.map((row) => ({
				sname: row.sname,
				ticket:
					row.ticketservice && row.ticketnum
						? `${row.ticketservice}${row.ticketnum}`
						: "--",
				status: row.status || null,
			}));

			resolve(services);
		});
	});
}

/**
 * Setup watcher for services display updates
 */
function setupServicesDisplayWatcher(socket, io) {
	sendServicesDisplay(socket);

	if (!watcherAdded) {
		fs.watchFile(dbPath, { interval: 500 }, async () => {
			await sendServicesDisplay(io);
		});
		watcherAdded = true;
	}
	async function sendServicesDisplay(target) {
		try {
			const services = await getServicesWithLatestTicket();
			target.emit("servicesDisplayUpdate", services);
		} catch (err) {
			console.error("❌ Error fetching services display:", err);
			target.emit("servicesDisplayUpdate", []);
		}
	}
}

module.exports = { setupServicesDisplayWatcher };
