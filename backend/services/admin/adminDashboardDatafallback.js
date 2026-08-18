const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const { getPHDateTime } = require('../../config/datetime');

const dbPath = path.join(rootpath, "/config/db.db");

/**
 * Fetch all services with their latest ticket (filtered by date range)
 */
async function getadmindata(datefrom, dateto) {
	const { date: today } = getPHDateTime();

	// Use today if no inputs
	datefrom = datefrom || today;
	dateto = dateto || today;

	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) return reject(err);
		});

		// Query distinct sname with sums
		const query = `
			SELECT 
				sname,
				SUM(CASE WHEN status IN ('finished','called','calling') THEN 1 ELSE 0 END) AS called_count,
				SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
				COUNT(*) AS total_count
			FROM transactions
			WHERE date BETWEEN ? AND ?
			GROUP BY sname
		`;

		db.all(query, [datefrom, dateto], (err, rows) => {
			if (err) {
				db.close();
				return reject(err);
			}

			// Compute overall sums across all sname
			const overall = rows.reduce(
				(acc, row) => {
					acc.called_count += row.called_count || 0;
					acc.pending_count += row.pending_count || 0;
					acc.total_count += row.total_count || 0;
					return acc;
				},
				{ called_count: 0, pending_count: 0, total_count: 0 }
			);

			// Fetch feedback separately
			const feedbackQuery = `
				SELECT
					SUM(CASE WHEN satisfied = 1 THEN 1 ELSE 0 END) AS satisfied,
					SUM(CASE WHEN unsatisfied = 1 THEN 1 ELSE 0 END) AS unsatisfied
				FROM feedback
				WHERE date BETWEEN ? AND ?
			`;

			db.get(feedbackQuery, [datefrom, dateto], (err, feedbackRow) => {
				db.close();
				if (err) return reject(err);

				resolve({
					services: rows || [], // per sname
					overall, // overall totals across all services
					satisfied: feedbackRow?.satisfied || 0,
					unsatisfied: feedbackRow?.unsatisfied || 0,
				});
			});
		});
	});
}

/**
 * Setup watcher for services display updates
 */
function adminoveralldatawatcher(io) {
	let lastDateFrom = null;
	let lastDateTo = null;

	io.on("connection", async (socket) => {
		// listen for client requests with date range
		socket.on("requestAdminData", async ({ datefrom, dateto } = {}) => {
			lastDateFrom = datefrom || lastDateFrom;
			lastDateTo = dateto || lastDateTo;
			await sendadmindata(socket, lastDateFrom, lastDateTo);
		});

		// default send (today only) when socket connects
		const { date: today } = getPHDateTime();
		lastDateFrom = today;
		lastDateTo = today;
		await sendadmindata(socket, lastDateFrom, lastDateTo);
	});

	fs.watchFile(dbPath, { interval: 500 }, async () => {
		// use last selected date range for updates
		await sendadmindata(io, lastDateFrom, lastDateTo);
	});

	async function sendadmindata(target, datefrom, dateto) {
		try {
			const adminoveralldata = await getadmindata(datefrom, dateto);
			target.emit("dashadmindataupdate", adminoveralldata);
		} catch (err) {
			console.error("❌ Error fetching services display:", err);
			target.emit("dashadmindataupdate", []);
		}
	}
}

module.exports = { adminoveralldatawatcher };
