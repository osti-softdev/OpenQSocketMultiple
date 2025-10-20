const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const { getPHDateTime } = require("../datetime");

const dbPath = path.join(rootpath, "/config/db.db");
let watcherAdded = false;
const dateRanges = new Map();

// 🔹 Keep a single shared DB connection (faster than reopening)
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) console.error("❌ DB Error:", err);
  else console.log("✅ SQLite Connected");

  // 🔹 Add indexes to avoid full table scans
  db.run("CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)");
  db.run("CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)");
  db.run("CREATE INDEX IF NOT EXISTS idx_transactions_sname ON transactions(sname)");
  db.run("CREATE INDEX IF NOT EXISTS idx_feedback_date ON feedback(date)");
  db.run("CREATE INDEX IF NOT EXISTS idx_feedback_time ON feedback(time)");
});

function allAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function gettimedatacharts(datefrom, dateto) {
  const { date: today } = getPHDateTime();
  datefrom = datefrom || today;
  dateto = dateto || today;

  const [
    hourRows,
    dateRows,
    monthRows,
    hourFeedback,
    dateFeedback,
    monthFeedback,
  ] = await Promise.all([
    allAsync(
      `
      SELECT t.sname, strftime('%H', t.time) AS hour, COUNT(*) AS count
      FROM transactions t
      JOIN services s ON t.sname = s.sname
      WHERE t.date BETWEEN ? AND ?
        AND t.status IN ('called','calling','finished')
        AND s.status != 0
      GROUP BY t.sname, hour
      ORDER BY t.sname, hour
    `,
      [datefrom, dateto]
    ),
    allAsync(
      `
      SELECT t.sname, t.date AS date, COUNT(*) AS count
      FROM transactions t
      JOIN services s ON t.sname = s.sname
      WHERE t.date BETWEEN ? AND ?
        AND t.status IN ('called','calling','finished')
        AND s.status != 0
      GROUP BY t.sname, date
      ORDER BY t.sname, date
    `,
      [datefrom, dateto]
    ),
    allAsync(
      `
      SELECT t.sname, strftime('%Y-%m', t.date) AS month, COUNT(*) AS count
      FROM transactions t
      JOIN services s ON t.sname = s.sname
      WHERE t.date BETWEEN ? AND ?
        AND t.status IN ('called','calling','finished')
        AND s.status != 0
      GROUP BY t.sname, month
      ORDER BY t.sname, month
    `,
      [datefrom, dateto]
    ),
    // feedback tables unchanged unless you want to filter feedback by services
    allAsync(
      `
      SELECT strftime('%H', time) AS hour,
             SUM(satisfied) AS satisfied,
             SUM(unsatisfied) AS unsatisfied
      FROM feedback
      WHERE date BETWEEN ? AND ?
      GROUP BY hour
      ORDER BY hour
    `,
      [datefrom, dateto]
    ),
    allAsync(
      `
      SELECT date AS date,
             SUM(satisfied) AS satisfied,
             SUM(unsatisfied) AS unsatisfied
      FROM feedback
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date
    `,
      [datefrom, dateto]
    ),
    allAsync(
      `
      SELECT strftime('%Y-%m', date) AS month,
             SUM(satisfied) AS satisfied,
             SUM(unsatisfied) AS unsatisfied
      FROM feedback
      WHERE date BETWEEN ? AND ?
      GROUP BY month
      ORDER BY month
    `,
      [datefrom, dateto]
    ),
  ]);


  // 🔹 Unique service names
  const snames = [
    ...new Set([
      ...hourRows.map((r) => r.sname),
      ...dateRows.map((r) => r.sname),
      ...monthRows.map((r) => r.sname),
    ]),
  ];

  // 🔹 Hourly transactions per service
  const hourly = snames.reduce((acc, sname) => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, "0"),
      count: 0,
    }));
    hourRows
      .filter((r) => r.sname === sname)
      .forEach((r) => {
        hours[parseInt(r.hour)] = { hour: r.hour, count: r.count };
      });
    acc[sname] = hours;
    return acc;
  }, {});

  // 🔹 Daily + Feedback alignment
  const all_dates = new Set(dateRows.map((r) => r.date));
  dateFeedback.forEach((r) => all_dates.add(r.date));
  const unique_dates = [...all_dates].sort();

  const daily = snames.reduce((acc, sname) => {
    acc[sname] = unique_dates.map((d) => ({
      date: d,
      count: dateRows.find((r) => r.sname === sname && r.date === d)?.count || 0,
    }));
    return acc;
  }, {});

  const daily_feedback = unique_dates.map((d) => ({
    date: d,
    satisfied: dateFeedback.find((r) => r.date === d)?.satisfied || 0,
    unsatisfied: dateFeedback.find((r) => r.date === d)?.unsatisfied || 0,
  }));

  // 🔹 Monthly + Feedback alignment
  const all_months = new Set(monthRows.map((r) => r.month));
  monthFeedback.forEach((r) => all_months.add(r.month));
  const unique_months = [...all_months].sort();

  const monthly = snames.reduce((acc, sname) => {
    acc[sname] = unique_months.map((m) => ({
      month: m,
      count: monthRows.find((r) => r.sname === sname && r.month === m)?.count || 0,
    }));
    return acc;
  }, {});

  const monthly_feedback = unique_months.map((m) => ({
    month: m,
    satisfied: monthFeedback.find((r) => r.month === m)?.satisfied || 0,
    unsatisfied: monthFeedback.find((r) => r.month === m)?.unsatisfied || 0,
  }));

  // 🔹 Hourly feedback fill
  const hourly_feedback = Array.from({ length: 24 }, (_, i) => ({
    hour: String(i).padStart(2, "0"),
    satisfied: 0,
    unsatisfied: 0,
  }));
  hourFeedback.forEach((r) => {
    const idx = parseInt(r.hour);
    if (!isNaN(idx)) {
      hourly_feedback[idx].satisfied = r.satisfied || 0;
      hourly_feedback[idx].unsatisfied = r.unsatisfied || 0;
    }
  });

  return {
    snames,
    hourly,
    daily,
    monthly,
    feedback: {
      hourly: hourly_feedback,
      daily: daily_feedback,
      monthly: monthly_feedback,
    },
  };
}

// 🔹 Socket integration
function admincontent3chartsdata(socket, io) {
  const { date: today } = getPHDateTime();

  socket.on("requestAdminDataforcontent3", async ({ datefrom, dateto } = {}) => {
    datefrom = datefrom || today;
    dateto = dateto || today;
    dateRanges.set(socket.id, { from: datefrom, to: dateto });
    await sendadmindataforcontent3(socket, datefrom, dateto);
  });

  socket.on("disconnect", () => {
    dateRanges.delete(socket.id);
    // console.log("🔌 Client disconnected");
  });

  if (!watcherAdded) {
    fs.watchFile(dbPath, { interval: 500 }, async () => {
  for (const [sid, range] of dateRanges) {
    const s = io.sockets.sockets.get(sid);
    if (s) {
      try {
        const data = await gettimedatacharts(range.from, range.to); // ✅ use range
        s.emit("dashadmincontent3data", data); // ✅ correct target
      } catch (err) {
        console.error("❌ Error fetching charts:", err);
        s.emit("dashadmincontent3data", {
          snames: [],
          hourly: {},
          daily: {},
          monthly: {},
          feedback: { hourly: [], daily: [], monthly: [] },
        });
      }
    }
  }
});
    watcherAdded = true;
  }
}

async function sendadmindataforcontent3(target, datefrom, dateto) {
  try {
    const data = await gettimedatacharts(datefrom, dateto);
    target.emit("dashadmincontent3data", data);
  } catch (err) {
    console.error("❌ Error fetching charts:", err);
    target.emit("dashadmincontent3data", {
      snames: [],
      hourly: {},
      daily: {},
      monthly: {},
      feedback: { hourly: [], daily: [], monthly: [] },
    });
  }
}

module.exports = { admincontent3chartsdata };
