// /node/kioskHandler.js
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");
const { getPHDateTime } = require('../../config/datetime');
const { executephp } = require("../printer");
const { getAllServices } = require('../../db/db');
const { sendTemplateSMS } = require("../smsService");
const { loadConfig } = require('../../config/envconfig');
const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");
let watcherAdded = false;

function initializeWindowedKiosk(socket, io) {
	const config = loadConfig(io);

	let smsType = config?.MainServer?.sms
	sendToAllKiosks(socket);
	if (!watcherAdded) {
		fs.watchFile(dbPath, { interval: 500 }, async () => {
			await sendToAllKiosks(io);
		});
		watcherAdded = true;
	}

	socket.on("newServiceTicket", (service) => {
		const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
			if (err) {
				console.error("DB open error:", err.message);
				socket.emit("ticketInsertError", "Database connection failed");
				return;
			}
		});

		const { sname, ticketservice, mobile } = service;
		const { date, time } = getPHDateTime();

		db.get(
			`SELECT MAX(ticketnum) as maxTicket FROM transactions 
			 WHERE sname = ? AND ticketservice = ? AND date = ?`,
			[sname, ticketservice, date],
			(err, row) => {
				if (err) {
					console.error("Max ticket error:", err.message);
					socket.emit("ticketInsertError", "Failed to get ticket number");
					db.close();
					return;
				}

				const nextTicket = (row?.maxTicket || 0) + 1;
				const history = `[${time}-Topline-Inserted]`;

				db.run(
					`INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time, history, mobile)
					 VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
					[nextTicket, sname, ticketservice, date, time, history, mobile],
					async (insertErr) => {
						if (insertErr) {
							console.error("Insert error:", insertErr.message);
							socket.emit("ticketInsertError", "Failed to insert ticket");
						} else {
							executephp(ticketservice, nextTicket, sname);
							socket.emit("ticketInserted", {
								ticketnum: nextTicket,
								sname,
								ticketservice,
							});
						}
						db.close();
						if (smsType != 0) {
							if (mobile && mobile.trim() !== "") {
								try {
									await sendTemplateSMS("New Ticket", {
										counter: "",
										mobile,
										ticket: ticketservice + nextTicket,
										service: sname,
									});
								} catch (smsErr) {
									console.error(`❌ Failed to send SMS to ${mobile}:`, smsErr.message);
								}
							}
						}
					}
				);
			}
		);
	});
}

async function sendToAllKiosks(io) {
	try {
		const services = await getAllServices();
		io.emit("servicesUpdate2", services);
	} catch (err) {
		console.error("❌ Error fetching services:", err);
		io.emit("servicesUpdate2", []);
	}
}

module.exports = { initializeWindowedKiosk };
