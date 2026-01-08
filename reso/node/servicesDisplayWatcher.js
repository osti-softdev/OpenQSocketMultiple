// reso/node/servicesDisplay.js
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const { getPHDateTime } = require("./datetime");
const { loadConfig } = require("./envconfig");
const dbPath = path.join(rootpath, "/config/db.db");
let watcherAdded = false;
/**
 * Fetch all services with their latest ticket (filtered by today & status)
 */
// ! Original function (before revision) TICKET DISPLAYED ON ITS SERVICE ONLY
// async function getServicesWithLatestTicket() {
// 	const { date } = getPHDateTime();

// 	return new Promise((resolve, reject) => {
// 		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
// 			if (err) return reject(err);
// 		});

// 		const query = `
//     WITH ranked_transactions AS (
//         SELECT
//             sname,
//             ticketservice,
//             ticketnum,
// 			counter_num,
// 			counter_group,
// 			sgroup,
// 			counter_user,
//             status,
//             ROW_NUMBER() OVER (
//                 PARTITION BY sname
//                 ORDER BY start_time DESC, ticketnum DESC
//             ) AS rn
//         FROM transactions
//         WHERE date = ?
//           AND status IN ('calling','finished','called','held','received','voided')
//     )
//     SELECT 
//         s.sname,
//         s.shortSname,
//         rt.ticketservice,
//         rt.ticketnum,
//         rt.counter_num,
// 		rt.counter_group,
// 		rt.sgroup,
// 		rt.counter_user,
//         rt.status
//     FROM services s
//     LEFT JOIN ranked_transactions rt
//         ON s.sname = rt.sname
//        AND rt.rn = 1
//     WHERE s.status = 1
//     ORDER BY id;
// `;


// 		db.all(query, [date], (err, rows) => {
// 			db.close();
// 			if (err) return reject(err);

// 			const services = rows.map((row) => ({
// 				sname: row.sname,
// 				shortSname: row.shortSname,
// 				ticket:
// 					row.ticketservice && row.ticketnum
// 						? `${row.ticketservice}-${row.ticketnum}`
// 						: "--",
// 				status: row.status || null,
// 				counter_num: row.counter_num || null,
// 				counter_group: row.counter_group || null,
// 				sgroup: row.sgroup || null,
// 				counter_user: row.counter_user || null,
// 			}));

// 			resolve(services);
// 		});
// 	});
// }

// ! Revised function to ensure latest transaction per sgroup

async function getServicesWithLatestTicket() {
    const { date } = getPHDateTime();

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(err);
        });

        // 1️⃣ Get all active services
        const servicesQuery = `
            SELECT sname, shortSname
            FROM services
            WHERE status = 1
            ORDER BY id;
        `;

        // 2️⃣ Get latest transaction PER sgroup
        const transactionsQuery = `
            WITH ranked AS (
                SELECT
                    ticketservice,
                    ticketnum,
                    counter_num,
                    counter_group,
                    sgroup,
                    counter_user,
                    status,
                    ROW_NUMBER() OVER (
                        PARTITION BY sgroup
                        ORDER BY start_time DESC, ticketnum DESC
                    ) AS rn
                FROM transactions
                WHERE date = ?
                  AND status IN ('calling','finished','called','held','voided')
            )
            SELECT *
            FROM ranked
            WHERE rn = 1;
        `;

        db.all(servicesQuery, [], (err, servicesRows) => {
            if (err) {
                db.close();
                return reject(err);
            }

            db.all(transactionsQuery, [date], (err, transactionRows) => {
                db.close();
                if (err) return reject(err);

                // 3️⃣ Map transactions by sgroup for fast lookup
                const txMap = {};
                transactionRows.forEach(tx => {
                    txMap[tx.sgroup] = tx;
                });

                // 4️⃣ Merge: service.sname === transaction.sgroup
                const services = servicesRows.map(service => {
                    const tx = txMap[service.sname] || null;

                    return {
                        sname: service.sname,
                        shortSname: service.shortSname,
                        ticket: tx && tx.ticketservice && tx.ticketnum
                            ? `${tx.ticketservice}-${tx.ticketnum}`
                            : "--",
                        status: tx ? tx.status : null,
                        counter_num: tx ? tx.counter_num : null,
                        counter_group: tx ? tx.counter_group : null,
                        sgroup: tx ? tx.sgroup : null,
                        counter_user: tx ? tx.counter_user : null
                    };
                });

                resolve(services);
            });
        });
    });
}

/**
 * Setup watcher for services display updates
 */
function setupServicesDisplayWatcher(socket, io) {
	const config = loadConfig();
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
			target.emit("servicesDisplayUpdate", {
				counterDisplay: config.MainServer.counterDisplay, // ✅ included
				services, // ✅ include services list
			});
		} catch (err) {
			console.error("❌ Error fetching services display:", err);
			target.emit("servicesDisplayUpdate", {
				counterDisplay: config.MainServer.counterDisplay, // ✅ still send config
				services: [],
			});
		}
	}

}

module.exports = { setupServicesDisplayWatcher };
