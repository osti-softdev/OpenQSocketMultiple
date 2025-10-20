// reso/node/queue.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");

const { getAllServices } = require("./db");
const { getPHDateTime } = require("./datetime");

// Helper: promisified DB operations
function dbGet(db, sql, params = []) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
	});
}
function dbRun(db, sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) return reject(err);
			resolve({ lastID: this.lastID, changes: this.changes });
		});
	});
}

function setupKeyApi(io) {
	const router = express.Router();

	// POST: { "key": "2" }
	router.post("/key", async (req, res) => {
		const key = decodeURIComponent(String(req.body?.key || "").trim());
		if (!key) return res.status(400).json({ ok: false, error: "NO_KEY" });

		const result = await handleKey(key, io);
		return res.json(result);
	});

	// GET: /api/key/2 or /api/key/%23
	router.get("/key/:key", async (req, res) => {
		const key = decodeURIComponent(String(req.params.key || "").trim());
		if (!key) return res.status(400).json({ ok: false, error: "NO_KEY" });

		const result = await handleKey(key, io);
		return res.json(result);
	});

	return router;
}

async function handleKey(key, io) {
	const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
	const { date, time } = getPHDateTime();

	try {
		// === Ticket creation (keys 2,3,4) ===
		if (["2", "3", "4"].includes(key)) {
			const services = await getAllServices();
			const index = parseInt(key, 10) - 2;
			const service = services[index];

			if (!service || !service.regular) {
				db.close();
				return { ok: false, error: "NO_SERVICE" };
			}

			const row = await dbGet(
				db,
				`SELECT MAX(ticketnum) as maxTicket FROM transactions 
           WHERE sname = ? AND ticketservice = ? AND date = ?`,
				[service.sname, service.regular, date]
			);

			const ticketNumber = row?.maxTicket ? row.maxTicket + 1 : 1;

			await dbRun(
				db,
				`INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time)
           VALUES (?, ?, ?, 'pending', ?, ?)`,
				[ticketNumber, service.sname, service.regular, date, time]
			);

			db.close();

			const displayText = `${service.regular}${ticketNumber}`;
			io.emit("ticket:new", {
				ticketnum: ticketNumber,
				sname: service.sname,
				prefix: service.regular,
				displayText,
				date,
				time,
			});

			return { ok: true, action: "NEW_TICKET", displayText };
		}

		// === Call next ticket (A,B,C,D) ===
		else if (["A", "B", "C", "D"].includes(key)) {
			const startTime = time;

			if (key === "A") {
				// global next pending
				const pending = await dbGet(
					db,
					`SELECT id FROM transactions WHERE status = 'pending' AND date = ? 
           ORDER BY date ASC, time ASC LIMIT 1`,
					[date]
				);
				if (!pending) {
					db.close();
					return { ok: false, error: "NO_PENDING" };
				}

				await dbRun(
					db,
					`UPDATE transactions SET status = 'calling', start_time = ? WHERE id = ?`,
					[startTime, pending.id]
				);

				const row = await dbGet(
					db,
					`SELECT ticketnum, sname, ticketservice, status FROM transactions WHERE id = ?`,
					[pending.id]
				);

				db.close();
				io.emit("ticket:calling", row);
				return { ok: true, action: "CALLING", row };
			} else {
				// service-specific (B,C,D)
				const services = await getAllServices();
				const map = { B: 2, C: 3, D: 4 };
				const index = map[key] - 2;
				const service = services[index];
				if (!service || !service.regular) {
					db.close();
					return { ok: false, error: "NO_SERVICE" };
				}

				const pending = await dbGet(
					db,
					`SELECT id FROM transactions WHERE status = 'pending' AND sname = ? AND ticketservice = ? AND date = ? 
           ORDER BY date ASC, time ASC LIMIT 1`,
					[service.sname, service.regular, date]
				);
				if (!pending) {
					db.close();
					return { ok: false, error: "NO_PENDING" };
				}

				await dbRun(
					db,
					`UPDATE transactions SET status = 'calling', start_time = ? WHERE id = ?`,
					[startTime, pending.id]
				);

				const row = await dbGet(
					db,
					`SELECT ticketnum, sname, ticketservice, status FROM transactions WHERE id = ?`,
					[pending.id]
				);

				db.close();
				io.emit("ticket:calling", row);
				return { ok: true, action: "CALLING", row };
			}
		}

		// === Revert last called ticket (#) ===
		else if (key === "#") {
			const called = await dbGet(
				db,
				`SELECT id FROM transactions WHERE status = 'called' AND date = ? 
         ORDER BY start_time DESC LIMIT 1`,
				[date]
			);
			if (!called) {
				db.close();
				return { ok: false, error: "NO_CALLED" };
			}

			await dbRun(
				db,
				`UPDATE transactions SET status = 'calling' WHERE id = ?`,
				[called.id]
			);

			const row = await dbGet(
				db,
				`SELECT ticketnum, sname, ticketservice, status, start_time FROM transactions WHERE id = ?`,
				[called.id]
			);

			db.close();
			io.emit("ticket:revert", row);
			return { ok: true, action: "REVERT", row };
		}

		// === Feedback (5,6) ===
		else if (["5", "6"].includes(key)) {
			let query, params;
			if (key === "5") {
				query = `INSERT INTO feedback (satisfied, date, time) VALUES (1, ?, ?)`;
				params = [date, time];
			} else {
				query = `INSERT INTO feedback (unsatisfied, date, time) VALUES (1, ?, ?)`;
				params = [date, time];
			}

			await dbRun(db, query, params);
			db.close();
			io.emit("feedback:new", { key, date, time });
			return { ok: true, action: "FEEDBACK", key };
		}

		// === Ignore others ===
		else {
			db.close();
			return { ok: true, action: "IGNORED", key };
		}
	} catch (err) {
		try {
			db.close();
		} catch (e) {}
		return { ok: false, error: err.message };
	}
}

module.exports = { setupKeyApi, handleKey };
