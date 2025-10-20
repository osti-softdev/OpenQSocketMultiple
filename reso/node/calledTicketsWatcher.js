const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const { getPHDateTime } = require("./datetime");

// Paths
const dbPath = path.join(rootpath, "/config/db.db");
const voicePath = path.join(rootpath, "/config/soundandvoice.json");

// --- Get latest calling ticket ---
async function getCallingTickets() {
	const { date } = getPHDateTime();

	return new Promise((resolve, reject) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
			if (err) return reject(err);
		});

		const query = `
            SELECT id, sname, ticketservice AS service, ticketnum AS ticket,
                   counter_num, counter_user
            FROM transactions
            WHERE status = 'calling'
              AND date = ?
            ORDER BY start_time ASC;
        `;

		db.all(query, [date], (err, rows) => {
			db.close();
			if (err) return reject(err);
			resolve(rows);
		});
	});
}

// --- Update ticket to "called" and append counter history ---
async function updateCalledTicket(id, counterHist, identifierType) {
	const { time } = getPHDateTime();
	console.log(identifierType);
	if(identifierType != "WINDOWED_APPLICATION"){
		const entry = `[${time}-${counterHist}-Called]`;
		const finishEntry = `[${time}-${counterHist}-AutoFinished]`;

		return new Promise((resolve, reject) => {
			const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
				if (err) return reject(err);
			});

			db.serialize(() => {
				// 1. Get sname for current ticket
				db.get(`SELECT sname FROM transactions WHERE id = ?`, [id], (err, row) => {
					if (err) {
						db.close();
						return reject(err);
					}
					if (!row) {
						db.close();
						return resolve(false);
					}
					const sname = row.sname;

					// 2. Begin transaction
					db.run("BEGIN TRANSACTION");

					// 3. Finish previous "called" ticket of same sname
					const finishPrev = `
						UPDATE transactions
						SET status = 'finished',
							end_time = ?,
							history = CASE
								WHEN history IS NULL OR history = '' THEN ?
								ELSE history || ';' || ?
							END
						WHERE sname = ?
						AND status = 'called'
						AND id <> ?;
					`;

					db.run(finishPrev, [time, finishEntry, finishEntry, sname, id], function (err) {
						if (err) {
							db.run("ROLLBACK");
							db.close();
							return reject(err);
						}

						// 4. Update current ticket → "called"
						const updateCurrent = `
							UPDATE transactions
							SET history = CASE
								WHEN history IS NULL OR history = '' THEN ?
								ELSE history || ';' || ?
							END,
								status = 'called',
								start_time = ?
							WHERE id = ?;
						`;

						db.run(updateCurrent, [entry, entry, time, id], function (err2) {
							if (err2) {
								db.run("ROLLBACK");
								db.close();
								return reject(err2);
							}

							// 5. Commit
							db.run("COMMIT", (commitErr) => {
								db.close();
								if (commitErr) return reject(commitErr);
								// We return true if either previous or current was updated
								resolve(true);
							});
						});
					});
				});
			});
		});
	}else if(identifierType === "WINDOWED_APPLICATION"){
		return new Promise((resolve, reject) => {
			const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
				if (err) return reject(err);
			});

			db.serialize(() => {
				// 1. Get sname for current ticket
				db.get(`SELECT sname, counter_num, counter_user FROM transactions WHERE id = ?`, [id], (err, row) => {
					if (err) {
						db.close();
						return reject(err);
					}
					if (!row) {
						db.close();
						return resolve(false);
					}
					const sname = row.sname;
					const cnum = row.counter_num;
					const cname = row.counter_user;

					// 2. Begin transaction
					db.run("BEGIN TRANSACTION");

					// 3. Finish previous "called" ticket of same sname
					const finishPrev = `
						UPDATE transactions
						SET status = 'finished',
							end_time = ?
						WHERE sname = ?
						AND (status = 'called' OR status = 'calling')
						AND counter_user = ? AND counter_num = ?
						AND id <> ?;
					`;

					db.run(finishPrev, [time, sname,cname,cnum, id], function (err) {
						if (err) {
							db.run("ROLLBACK");
							db.close();
							return reject(err);
						}

						// 4. Update current ticket → "called"
						const updateCurrent = `
							UPDATE transactions
							SET status = 'called',
								start_time = ?
							WHERE id = ?;
						`;

						db.run(updateCurrent, [time, id], function (err2) {
							if (err2) {
								db.run("ROLLBACK");
								db.close();
								return reject(err2);
							}

							// 5. Commit
							db.run("COMMIT", (commitErr) => {
								db.close();
								if (commitErr) return reject(commitErr);
								// We return true if either previous or current was updated
								resolve(true);
							});
						});
					});
				});
			});
		});
	}
	
}

// --- Read voice.json ---
function readVoiceConfig() {
	try {
		const data = fs.readFileSync(voicePath, "utf8");
		return JSON.parse(data);
	} catch (err) {
		console.error("❌ Error reading voice.json:", err);
		return { voice: 0 }; // default
	}
}

// --- Setup all watchers ---
function setupCalledTicketsWatcher(io, identifierType) {
	io.on("connection", async (socket) => {
		// Send latest calling ticket immediately
		await sendCalledTickets(socket);

		// Send voice config immediately
		socket.emit("voiceConfigUpdate", readVoiceConfig());

		// Handle client request to update a ticket
		socket.on("updateCalledTicket", async (data) => {
			const { id, counter_hist } = data;
			try {
				const updated = await updateCalledTicket(id, counter_hist, identifierType);
				if (updated) {
					// console.log(`✅ Ticket ${id} updated to 'called'`);
					await sendCalledTickets(io);
				} else {
					// console.warn(`⚠️ Ticket ${id} not updated`);
				}
			} catch (err) {
				console.error(`❌ Error updating ticket ${id}:`, err);
			}
		});
	});

	// Watch DB for calling ticket changes
	fs.watchFile(dbPath, { interval: 500 }, async () => {
		await sendCalledTickets(io);
	});

	// Watch voice.json for changes
	fs.watchFile(voicePath, { interval: 500 }, () => {
		const config = readVoiceConfig();
		io.emit("voiceConfigUpdate", config);
		// console.log("🔊 Voice config updated:", config);
	});

	async function sendCalledTickets(target) {
		try {
			const calledTickets = await getCallingTickets();
			target.emit("calledTicketsUpdate", calledTickets);
		} catch (err) {
			console.error("❌ Error fetching called tickets:", err);
			target.emit("calledTicketsUpdate", []);
		}
	}
}

module.exports = { setupCalledTicketsWatcher };
