const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { getPHDateTime } = require("../datetime");

const rootpath = global.outfolderPath || path.join(__dirname, "../../outfolder");
const dbPath = path.join(rootpath, "/config/db.db");

function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return (+parts[0] || 0) * 3600 + (+parts[1] || 0) * 60 + (+parts[2] || 0);
}

async function getServicesData(start, length, order, search, datefrom, dateto) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    let where = "WHERE 1=1";
    let params = [];
    if (search) {
      where += ` AND (sname LIKE ? OR shortSname LIKE ?)`;
      params = [`%${search}%`, `%${search}%`];
    }

    db.all(`SELECT id, sname,regular, priority, shortSname FROM services ${where} AND status = 1`, params, (err, servicesList) => {
      if (err) { db.close(); return reject(err); }

      db.all(`SELECT sname as t_sname, time, start_time, end_time, status, history, counter_num FROM transactions WHERE date BETWEEN ? AND ?`, [datefrom, dateto], (err, transactions) => {
        db.close();
        if (err) return reject(err);

        servicesList.forEach(s => {
          s.total_served = 0;
          s.total_voided = 0;
          let tellersSet = new Set();
          let totalServingSecs = 0, servingCount = 0;
          let totalWaitingSecs = 0, waitingCount = 0;
          let totalTurnaroundSecs = 0, turnaroundCount = 0;

          transactions.forEach(t => {
            if (t.t_sname !== s.sname) return;

            let hStr = t.history || '';

            if (!hStr && t.status !== 'unserved') {
              // Try to construct basic history if empty but has data
              if (t.status === 'finished') hStr = `[${t.start_time}-Teller-Called];[${t.end_time}-Teller-Finished]`;
              else if (t.status === 'voided') hStr = `[${t.time}-Teller-Voided]`;
              else if (t.status === 'called' || t.status === 'calling') hStr = `[${t.time}-Teller-Called]`;
            }

            if (!hStr) {
              if (t.status === 'unserved') {
                // Not served or voided
              } else if (t.status === 'voided') {
                s.total_voided++;
              } else if (t.status === 'finished') {
                s.total_served++;
              }
              return;
            }

            const steps = hStr.split(';').filter(Boolean).map(item => {
              const clean = item.replace(/[\[\]]/g, '');
              const parts = clean.split('-');
              return { time: parts[0], actor: parts[1], action: parts[2] };
            });

            const calledStep = steps.find(st => st.action === 'Called');
            if (calledStep) {
              s.total_served++;
              tellersSet.add(calledStep.actor);

              const calledTime = calledStep.time;
              const calledIndex = steps.indexOf(calledStep);
              const endStep = steps.slice(calledIndex + 1).find(st => ['Finished', 'Forwarded', 'Held'].includes(st.action));

              if (endStep) {
                const sSecs = timeToSeconds(endStep.time) - timeToSeconds(calledTime);
                if (sSecs >= 0) { totalServingSecs += sSecs; servingCount++; }
              }

              if (t.time) {
                const wSecs = timeToSeconds(calledTime) - timeToSeconds(t.time);
                if (wSecs >= 0) { totalWaitingSecs += wSecs; waitingCount++; }
              }
            } else if (steps.some(st => st.action === 'Voided')) {
              s.total_voided++;
            }
          });

          let myTransactions = transactions.filter(t => t.t_sname === s.sname);
          for (let i = 0; i < myTransactions.length - 1; i++) {
            let curr = myTransactions[i];
            let next = myTransactions[i + 1];

            // Extract curr end_time
            let currEndStep = curr.history ? curr.history.split(';').filter(Boolean).map(item => {
              const parts = item.replace(/[\[\]]/g, '').split('-');
              return { time: parts[0], actor: parts[1], action: parts[2] };
            }).find(st => ['Finished', 'Forwarded', 'Held'].includes(st.action)) : null;

            // Extract next start_time
            let nextStartStep = next.history ? next.history.split(';').filter(Boolean).map(item => {
              const parts = item.replace(/[\[\]]/g, '').split('-');
              return { time: parts[0], actor: parts[1], action: parts[2] };
            }).find(st => st.action === 'Called') : null;

            if (currEndStep && nextStartStep) {
              let diff = Math.abs(timeToSeconds(nextStartStep.time) - timeToSeconds(currEndStep.time));
              totalTurnaroundSecs += diff;
              turnaroundCount++;
            }
          }

          const avgServing = servingCount > 0 ? totalServingSecs / servingCount : 0;
          const avgWaiting = waitingCount > 0 ? totalWaitingSecs / waitingCount : 0;
          const avgTurnaround = turnaroundCount > 0 ? totalTurnaroundSecs / turnaroundCount : 0;

          const toStr = (secs) => {
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const sec = Math.floor(secs % 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
          };

          s.avg_serving_time = toStr(avgServing);
          s.avg_waiting_time = toStr(avgWaiting);
          s.avg_turnaround_time = toStr(avgTurnaround);
          s.serving_tellers = Array.from(tellersSet).join(', ');
        });

        const columns = ["sname", "initials", "total_served", "total_voided", "serving_tellers", "avg_serving_time", "avg_turnaround_time", "avg_waiting_time"];
        const orderCol = columns[order[0].column] || "sname";
        const orderDir = order[0].dir === "desc" ? -1 : 1;

        servicesList.sort((a, b) => {
          let valA = a[orderCol];
          let valB = b[orderCol];
          if (valA < valB) return -1 * orderDir;
          if (valA > valB) return 1 * orderDir;
          return 0;
        });

        const recordsFiltered = servicesList.length;
        const data = servicesList.slice(start, start + length);

        resolve({ recordsTotal: servicesList.length, recordsFiltered, data });
      });
    });
  });
}

async function getServiceDetails(sname, datefrom, dateto) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    const rowsQuery = `
      SELECT sname, ticketnum AS ticket, ticketservice AS service, status, start_time, end_time, date, time, history, counter_num
      FROM transactions
      WHERE date BETWEEN ? AND ?
        AND sname = ?
      ORDER BY date DESC, time DESC
    `;

    db.all(rowsQuery, [datefrom, dateto, sname], (err, rows) => {
      db.close();
      if (err) return reject(err);

      let chartMap = {};
      let pieMap = {};
      let historyRows = [];

      rows.forEach(t => {
        let hStr = t.history || '';
        if (!hStr && t.status !== 'unserved') {
          if (t.status === 'finished') hStr = `[${t.start_time}-Teller-Called];[${t.end_time}-Teller-Finished]`;
          else if (t.status === 'voided') hStr = `[${t.time}-Teller-Voided]`;
          else if (t.status === 'called' || t.status === 'calling') hStr = `[${t.time}-Teller-Called]`;
        }

        if (!hStr) return;

        const steps = hStr.split(';').filter(Boolean).map(item => {
          const clean = item.replace(/[\[\]]/g, '');
          const parts = clean.split('-');
          return { time: parts[0], actor: parts[1], action: parts[2] };
        });

        const calledStep = steps.find(s => s.action === 'Called');
        const isVoided = steps.some(s => s.action === 'Voided');
        const isServed = calledStep !== undefined;

        if (isServed || isVoided) {
          if (!chartMap[t.date]) chartMap[t.date] = { date: t.date, served: 0, voided: 0 };
          if (isServed) chartMap[t.date].served++;
          if (isVoided) chartMap[t.date].voided++;

          if (isServed) {
            const actor = calledStep.actor || 'Unknown';
            if (!pieMap[actor]) pieMap[actor] = 0;
            pieMap[actor]++;
          }

          let updatedStartTime = t.start_time;
          let updatedEndTime = t.end_time;

          if (isServed) {
            updatedStartTime = calledStep.time;
            const calledIndex = steps.indexOf(calledStep);
            const endStep = steps.slice(calledIndex + 1).find(s => ['Finished', 'Forwarded', 'Held'].includes(s.action));
            if (endStep) updatedEndTime = endStep.time;
            else updatedEndTime = '';
          }

          historyRows.push({
            sname: t.sname,
            ticket: t.ticket,
            service: t.service,
            status: t.status,
            start_time: updatedStartTime,
            end_time: updatedEndTime,
            time: t.time,
            date: t.date,
            history: hStr
          });
        }
      });

      const chartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));
      const pieData = Object.keys(pieMap).map(k => ({ teller: k, count: pieMap[k] }));

      resolve({ chartData, pieData, historyRows: historyRows.slice(0, 50) });
    });
  });
}

function admincontent3services(socket, io) {
  socket.on("requestAdminDataforcontent3services", async ({ start = 0, length = 10, order = [{ column: 0, dir: "asc" }], search = "", datefrom, dateto }) => {
    try {
      const { date: today } = getPHDateTime();
      datefrom = datefrom || today;
      dateto = dateto || today;

      const result = await getServicesData(start, length, order, search, datefrom, dateto);
      socket.emit("dashadmincontent3services", result);
    } catch (err) {
      console.error("❌ Error fetching services data:", err);
      socket.emit("dashadmincontent3services", { recordsTotal: 0, recordsFiltered: 0, data: [] });
    }
  });

  socket.on("requestServiceDetails", async ({ sname, datefrom, dateto }) => {
    try {
      const { date: today } = getPHDateTime();
      datefrom = datefrom || today;
      dateto = dateto || today;

      const result = await getServiceDetails(sname, datefrom, dateto);
      socket.emit("serviceDetailsData", result);
    } catch (err) {
      console.error("❌ Error fetching service details:", err);
      socket.emit("serviceDetailsData", { chartData: [], historyRows: [] });
    }
  });
}

module.exports = { admincontent3services };
