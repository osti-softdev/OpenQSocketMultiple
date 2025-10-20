const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { getPHDateTime } = require("../datetime");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");
let watcherAdded = false;
const dateRanges = new Map();

// 🔹 Keep one shared DB connection (faster than opening/closing every time)
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
	if (err) console.error("❌ DB Error:", err);
	else console.log("✅ SQLite Connected");

	// 🔹 Add indexes for performance
	db.run("CREATE INDEX IF NOT EXISTS idx_trans_date ON transactions(date)");
	db.run("CREATE INDEX IF NOT EXISTS idx_trans_status ON transactions(status)");
	db.run("CREATE INDEX IF NOT EXISTS idx_trans_sname ON transactions(sname)");
	db.run("CREATE INDEX IF NOT EXISTS idx_feedback_date ON feedback(date)");
	db.run("CREATE INDEX IF NOT EXISTS idx_feedback_satisfied ON feedback(satisfied)");
	db.run("CREATE INDEX IF NOT EXISTS idx_feedback_unsatisfied ON feedback(unsatisfied)");
});

function allAsync(query, params = []) {
	return new Promise((resolve, reject) => {
		db.all(query, params, (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
}

// --- Fetch time averages per service, feedback counts, and transaction averages per date
async function getAdminData(datefrom, dateto) {
	const { date: today } = getPHDateTime();
	datefrom = datefrom || today;
	dateto = dateto || today;

	const timeAveragesQuery = `
	SELECT 
		sname,
		printf('%02d:%02d:%02d',
			AVG(strftime('%s', start_time) - strftime('%s', time)) / 3600,
			(AVG(strftime('%s', start_time) - strftime('%s', time)) / 60) % 60,
			AVG(strftime('%s', start_time) - strftime('%s', time)) % 60
		) AS average_waiting,
		printf('%02d:%02d:%02d',
			AVG(strftime('%s', end_time) - strftime('%s', start_time)) / 3600,
			(AVG(strftime('%s', end_time) - strftime('%s', start_time)) / 60) % 60,
			AVG(strftime('%s', end_time) - strftime('%s', start_time)) % 60
		) AS serving_time,
		printf('%02d:%02d:%02d',
			AVG(strftime('%s', start_time) - strftime('%s', prev_end_time)) / 3600,
			(AVG(strftime('%s', start_time) - strftime('%s', prev_end_time)) / 60) % 60,
			AVG(strftime('%s', start_time) - strftime('%s', prev_end_time)) % 60
		) AS turnaround_time
	FROM (
		SELECT 
			t.*,
			LAG(end_time) OVER (PARTITION BY t.sname ORDER BY t.start_time) AS prev_end_time
		FROM transactions t
		JOIN services s ON t.sname = s.sname
		WHERE t.date BETWEEN ? AND ? AND s.status != 0
	) sub
	WHERE start_time IS NOT NULL AND end_time IS NOT NULL
	GROUP BY sname
	ORDER BY sname;
`;


	const feedbackQuery = `
		SELECT 
			date,
			SUM(CASE WHEN satisfied = 1 THEN 1 ELSE 0 END) AS satisfied_count,
			SUM(CASE WHEN unsatisfied = 1 THEN 1 ELSE 0 END) AS unsatisfied_count
		FROM feedback
		WHERE date BETWEEN ? AND ?
		GROUP BY date
		ORDER BY date;
	`;

	const transactionsQuery = `
	SELECT 
		date,
		COUNT(*) AS total_transactions,
		(SELECT AVG(cnt) FROM (
			SELECT COUNT(*) AS cnt
			FROM transactions t
			JOIN services s ON t.sname = s.sname
			WHERE t.date BETWEEN ? AND ? 
			  AND t.status IN ('finished', 'called', 'calling','voided')
			  AND s.status != 0
			GROUP BY t.date
		)) AS average_count_per_date
	FROM transactions t
	JOIN services s ON t.sname = s.sname
	WHERE t.date BETWEEN ? AND ? 
	  AND t.status IN ('finished', 'called', 'calling','voided')
	  AND s.status != 0
	GROUP BY date
	ORDER BY date;
`;

	// 🔹 Run queries in parallel (faster)
	const [timeRows, feedbackRows, transactionRows] = await Promise.all([
		allAsync(timeAveragesQuery, [datefrom, dateto]),
		allAsync(feedbackQuery, [datefrom, dateto]),
		allAsync(transactionsQuery, [datefrom, dateto, datefrom, dateto]),
	]);

	return {
		timeAverages: timeRows,
		feedback: feedbackRows,
		transactions: transactionRows,
	};
}

// --- Socket handler
function admincontent2averages(socket, io) {
	const { date: today } = getPHDateTime();

	socket.on("requestAdminDataforcontent2averages", async ({ datefrom, dateto } = {}) => {
		datefrom = datefrom || today;
		dateto = dateto || today;
		dateRanges.set(socket.id, { from: datefrom, to: dateto });
		await sendadmindataforcontent2averages(socket, datefrom, dateto);
	});

	socket.on("disconnect", () => {
		dateRanges.delete(socket.id);
		// console.log("🔌 Client disconnected, removed date range");
	});

	if (!watcherAdded) {
		fs.watchFile(dbPath, { interval: 1000 }, async () => {
			for (const [sid, range] of dateRanges) {
				const s = io.sockets.sockets.get(sid);
				if (s) {
					try {
						await sendadmindataforcontent2averages(s, range.from, range.to);
					} catch (err) {
						console.error(`❌ Error fetching for socket ${sid}:`, err);
					}
				}
			}
		});
		watcherAdded = true;
	}

	async function sendadmindataforcontent2averages(target, datefrom, dateto) {
		try {
			const data = await getAdminData(datefrom, dateto);
			target.emit("dashadmincontent2dataaverages", data);
		} catch (err) {
			console.error("❌ Error fetching admin data:", err);
			target.emit("dashadmincontent2dataaverages", {
				timeAverages: [],
				feedback: [],
				transactions: [],
			});
		}
	}
}

module.exports = { admincontent2averages };
