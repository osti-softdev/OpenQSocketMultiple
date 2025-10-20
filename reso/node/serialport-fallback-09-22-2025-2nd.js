const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");
const { getAllServices } = require("./db");
const { getPHDateTime } = require("./datetime");

// Store multiple ports
let ports = new Map();
let portCheckInterval = null;
let isShuttingDown = false;

async function listSerialPorts() {
	try {
		return await SerialPort.list();
	} catch (err) {
		console.error("Error listing serial ports:", err.message);
		return [];
	}
}

async function findArduinoPorts() {
	const allPorts = await listSerialPorts();
	const identifiers = [
		{ vendorId: "1A86", productId: "7523" }, // CH340
		{ vendorId: "2341", productId: "0043" }, // Arduino Uno
		{ vendorId: "2341", productId: "0001" }, // Mega
		{ vendorId: "0403", productId: "6001" }, // FT232R
		{ vendorId: "0843", productId: "5740" }, // ATmega328P
	];

	return allPorts.filter((port) => {
		return (
			(port.vendorId &&
				port.productId &&
				identifiers.some(
					(id) =>
						port.vendorId.toLowerCase() === id.vendorId.toLowerCase() &&
						port.productId.toLowerCase() === id.productId.toLowerCase()
				)) ||
			(port.manufacturer && port.manufacturer.toLowerCase().includes("arduino"))
		);
	});
}

async function cleanupSerialPorts() {
	isShuttingDown = true;

	if (portCheckInterval) {
		clearInterval(portCheckInterval);
		portCheckInterval = null;
	}

	for (let [path, { port }] of ports) {
		if (port.isOpen) {
			await new Promise((resolve) => port.close(resolve));
			console.log(`✅ Closed port ${path}`);
		}
	}
	ports.clear();
	isShuttingDown = false;
}

async function initializeSerialPort(io) {
	if (isShuttingDown) return;

	const arduinoPorts = await findArduinoPorts();
	if (arduinoPorts.length === 0) {
		if (!portCheckInterval) {
			portCheckInterval = setInterval(() => initializeSerialPort(io), 5000);
		}
		return;
	}

	for (const portInfo of arduinoPorts) {
		if (ports.has(portInfo.path)) continue; // already opened

		console.log(`🔌 Opening port: ${portInfo.path}`);
		const port = new SerialPort({
			path: portInfo.path,
			baudRate: 9600,
			autoOpen: false,
		});

		const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

		port.open((err) => {
			if (err) {
				console.error(`❌ Failed to open ${portInfo.path}:`, err.message);
				return;
			}
			console.log(`✅ Port ${portInfo.path} opened`);
		});

		parser.on("data", async (data) => {
			const key = data.trim();
			if (!/^[2-9A-Z#56]$/.test(key)) {
				console.log(`ℹ️ [${portInfo.path}] Ignored: "${key}"`);
				return;
			}

			try {
				const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
				const { date, time } = getPHDateTime();

				// === Ticket creation (2..9) ===
				if (/^[2-9]$/.test(key)) {
					const services = await getAllServices();
					const index = parseInt(key) - 2; // "2" => service[0]
					const service = services[index];

					if (!service || !service.regular) {
						db.close();
						return;
					}

					db.get(
						`SELECT MAX(ticketnum) as maxTicket FROM transactions 
             WHERE sname = ? AND ticketservice = ? AND date = ?`,
						[service.sname, service.regular, date],
						(err, row) => {
							if (err) {
								console.error("Max ticket error:", err.message);
								db.close();
								return;
							}

							const ticketNumber = row?.maxTicket ? row.maxTicket + 1 : 1;

							db.run(
								`INSERT INTO transactions (ticketnum, sname, ticketservice, status, date, time)
                 VALUES (?, ?, ?, 'pending', ?, ?)`,
								[ticketNumber, service.sname, service.regular, date, time],
								(err) => {
									if (!err) {
										const displayText = `${service.regular}${ticketNumber}`;
										if (port && port.isOpen) {
											port.write(displayText + "\n", (err) => {
												if (err) console.error("❌ Write error:", err.message);
											});
										}
									} else {
										console.error("Insert error:", err.message);
									}
									db.close();
								}
							);
						}
					);
				}

				// === Call next ticket (A=global, B..Z=service-specific) ===
				else if (/^[A-Z]$/.test(key)) {
					const startTime = time;

					if (key === "A") {
						const query = `
							UPDATE transactions 
							SET status = 'calling', start_time = ?
							WHERE id = (
								SELECT id FROM transactions 
								WHERE status = 'pending' AND date = ?
								ORDER BY date ASC, time ASC
								LIMIT 1
							)
							RETURNING ticketnum, sname, ticketservice, status
						`;
						db.get(query, [startTime, date], (err, row) => {
							if (err) {
								console.error("Update error:", err.message);
							} else if (row) {
								if (port && port.isOpen) {
									port.write(JSON.stringify(row) + "\n");
								}
							}
							db.close();
						});
					} else {
						const services = await getAllServices();
						const index = key.charCodeAt(0) - "B".charCodeAt(0); // B=0, C=1, etc
						const service = services[index];
						if (!service || !service.regular) {
							db.close();
							return;
						}

						const query = `
							UPDATE transactions 
							SET status = 'calling', start_time = ?
							WHERE id = (
								SELECT id FROM transactions 
								WHERE status = 'pending' 
								AND sname = ? AND ticketservice = ? AND date = ?
								ORDER BY date ASC, time ASC
								LIMIT 1
							)
							RETURNING ticketnum, sname, ticketservice, status
						`;
						db.get(
							query,
							[startTime, service.sname, service.regular, date],
							(err, row) => {
								if (err) {
									console.error("Update error:", err.message);
								} else if (row) {
									if (port && port.isOpen) {
										port.write(JSON.stringify(row) + "\n");
									}
								}
								db.close();
							}
						);
					}
				}

				// === Revert last called ticket (#) ===
				else if (key === "#") {
					const query = `
						UPDATE transactions 
						SET status = 'calling'
						WHERE id = (
							SELECT id FROM transactions 
							WHERE status = 'called' AND date = ?
							ORDER BY start_time DESC
							LIMIT 1
						)
						RETURNING ticketnum, sname, ticketservice, status
					`;
					db.get(query, [date], (err, row) => {
						if (err) {
							console.error("Update # error:", err.message);
						} else if (row) {
							if (port && port.isOpen) {
								port.write(JSON.stringify(row) + "\n");
							}
						}
						db.close();
					});
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

					db.run(query, params, (err) => {
						if (err) console.error("Insert feedback error:", err.message);
						db.close();
					});
				}
			} catch (err) {
				console.error("❌ Error processing key:", err.message);
			}
		});

		port.on("close", () => {
			console.log(`🔌 Port ${portInfo.path} closed`);
			ports.delete(portInfo.path);
		});

		port.on("error", (err) => {
			console.error(`❌ Port ${portInfo.path} error:`, err.message);
		});

		ports.set(portInfo.path, { port, parser });
	}
}

module.exports = { initializeSerialPort, cleanupSerialPorts };
