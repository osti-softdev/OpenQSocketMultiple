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

async function getTellersData(start, length, order, search, datefrom, dateto) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    let where = "WHERE 1=1";
    let params = [];
    if (search) {
      where += ` AND (cname LIKE ? OR cnum LIKE ?)`;
      params = [`%${search}%`, `%${search}%`];
    }

    db.all(`SELECT id, cname, cnum FROM counters ${where}`, params, (err, counters) => {
      if (err) { db.close(); return reject(err); }

      db.all(`SELECT time, start_time, end_time, status, history, counter_num FROM transactions WHERE date BETWEEN ? AND ?`, [datefrom, dateto], (err, transactions) => {
        db.close();
        if (err) return reject(err);

        counters.forEach(c => {
            c.total_served = 0;
            c.total_voided = 0;
            let totalServingSecs = 0, servingCount = 0;
            let totalWaitingSecs = 0, waitingCount = 0;
            let totalTurnaroundSecs = 0, turnaroundCount = 0;

            transactions.forEach(t => {
                let hStr = t.history || '';
                if (!hStr && t.counter_num == c.cnum) {
                    if (t.status === 'finished') hStr = `[${t.start_time}-${c.cname}-Called];[${t.end_time}-${c.cname}-Finished]`;
                    else if (t.status === 'voided') hStr = `[${t.time}-${c.cname}-Voided]`;
                    else hStr = `[${t.time}-${c.cname}-Called]`;
                }

                if (!hStr) return;

                const steps = hStr.split(';').filter(Boolean).map(item => {
                    const clean = item.replace(/[\[\]]/g, '');
                    const parts = clean.split('-');
                    return { time: parts[0], actor: parts[1], action: parts[2] };
                });

                const calledIndex = steps.findIndex(s => s.actor === c.cname && s.action === 'Called');
                if (calledIndex !== -1) {
                    c.total_served++;
                    
                    const calledTime = steps[calledIndex].time;
                    const endStep = steps.slice(calledIndex + 1).find(s => s.actor === c.cname && ['Finished', 'Forwarded', 'Held'].includes(s.action));
                    if (endStep) {
                        const sSecs = timeToSeconds(endStep.time) - timeToSeconds(calledTime);
                        if (sSecs >= 0) { totalServingSecs += sSecs; servingCount++; }
                    }

                    if (t.time) {
                        const wSecs = timeToSeconds(calledTime) - timeToSeconds(t.time);
                        if (wSecs >= 0) { totalWaitingSecs += wSecs; waitingCount++; }
                    }
                }

                if (steps.some(s => s.actor === c.cname && s.action === 'Voided')) {
                    c.total_voided++;
                }
            });

            let myTransactions = transactions.filter(t => t.history && t.history.includes(c.cname));
            for(let i=0; i < myTransactions.length - 1; i++){
                let curr = myTransactions[i];
                let next = myTransactions[i+1];
                
                // Extract curr end_time for this teller
                let currEndStep = curr.history ? curr.history.split(';').filter(Boolean).map(item => {
                    const parts = item.replace(/[\[\]]/g, '').split('-');
                    return { time: parts[0], actor: parts[1], action: parts.slice(2).join('-') };
                }).find(s => s.actor === c.cname && (s.action.startsWith('Finish') || s.action.startsWith('AutoFinish') || s.action.startsWith('Forward') || s.action.startsWith('Held'))) : null;

                // Extract next start_time for this teller
                let nextStartStep = next.history ? next.history.split(';').filter(Boolean).map(item => {
                    const parts = item.replace(/[\[\]]/g, '').split('-');
                    return { time: parts[0], actor: parts[1], action: parts.slice(2).join('-') };
                }).find(s => s.actor === c.cname && s.action === 'Called') : null;

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
                const s = Math.floor(secs % 60);
                return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
            };
            
            c.avg_serving_time = toStr(avgServing);
            c.avg_waiting_time = toStr(avgWaiting);
            c.avg_turnaround_time = toStr(avgTurnaround);
        });

        const columns = ["cname", "cnum", "total_served", "total_voided", "avg_serving_time", "avg_turnaround_time", "avg_waiting_time"];
        const orderCol = columns[order[0].column] || "cname";
        const orderDir = order[0].dir === "desc" ? -1 : 1;
        
        counters.sort((a, b) => {
            let valA = a[orderCol];
            let valB = b[orderCol];
            if (valA < valB) return -1 * orderDir;
            if (valA > valB) return 1 * orderDir;
            return 0;
        });

        const recordsFiltered = counters.length;
        const data = counters.slice(start, start + length);
        
        resolve({ recordsTotal: counters.length, recordsFiltered, data });
      });
    });
  });
}

async function getTellerDetails(cnum, cname, datefrom, dateto) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) return reject(err);
    });

    const rowsQuery = `
      SELECT sname, ticketnum AS ticket, ticketservice AS service, status, start_time, end_time, date, time, history, counter_num
      FROM transactions
      WHERE date BETWEEN ? AND ?
        AND (counter_num = ? OR history LIKE ?)
      ORDER BY date DESC, time DESC
    `;
    const searchName = '%' + cname + '%';
    
    db.all(rowsQuery, [datefrom, dateto, cnum, searchName], (err, rows) => {
      db.close();
      if (err) return reject(err);

      let chartMap = {};
      let pieMap = {};
      let historyRows = [];

      rows.forEach(t => {
          let hStr = t.history || '';
          if (!hStr && t.counter_num == cnum) {
              if (t.status === 'finished') hStr = `[${t.start_time}-${cname}-Called];[${t.end_time}-${cname}-Finished]`;
              else if (t.status === 'voided') hStr = `[${t.time}-${cname}-Voided]`;
              else hStr = `[${t.time}-${cname}-Called]`;
          }

          if (!hStr) return;

          // FIX: use parts.slice(2).join('-') so actions like "Void(No-show)" or "Forwarded(TELLER)" are captured fully
          const steps = hStr.split(';').filter(Boolean).map(item => {
              const clean = item.replace(/[\[\]]/g, '');
              const parts = clean.split('-');
              return { time: parts[0], actor: parts[1], action: parts.slice(2).join('-') };
          });

          // FIX: count ALL "Called" occurrences by this teller (not just the first)
          const calledSteps = steps.filter(s => s.actor === cname && s.action === 'Called');
          // FIX: match all Void variants (Voided, Void(No-show), etc.)
          const voidedSteps = steps.filter(s => s.actor === cname && s.action.startsWith('Void'));

          const calledCount = calledSteps.length;
          const voidedCount = voidedSteps.length;

          if (calledCount > 0 || voidedCount > 0) {
              if (!chartMap[t.date]) chartMap[t.date] = { date: t.date, served: 0, voided: 0 };
              // FIX: add ALL calls, not just 1 per ticket
              chartMap[t.date].served += calledCount;
              chartMap[t.date].voided += voidedCount;

              if (calledCount > 0) {
                  const s = (t.sname || '').replace(/_/g, ' ');
                  if (!pieMap[s]) pieMap[s] = 0;
                  // FIX: count all calls for this service, not just 1
                  pieMap[s] += calledCount;
              }

              // Use first Called step for start time
              const firstCalledIdx = steps.findIndex(s => s.actor === cname && s.action === 'Called');
              let updatedStartTime = t.start_time;
              let updatedEndTime = t.end_time;

              if (firstCalledIdx !== -1) {
                  updatedStartTime = steps[firstCalledIdx].time;
                  // FIX: use startsWith to match AutoFinished, Forwarded(TELLER), etc.
                  const endStep = steps.slice(firstCalledIdx + 1).find(s =>
                      s.actor === cname && (
                          s.action.startsWith('Finish') ||
                          s.action.startsWith('AutoFinish') ||
                          s.action.startsWith('Forward') ||
                          s.action.startsWith('Held')
                      )
                  );
                  updatedEndTime = endStep ? endStep.time : '';
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
                  history: hStr,
                  calledCount,
                  voidedCount
              });
          }
      });

      const chartData = Object.values(chartMap).sort((a,b) => a.date.localeCompare(b.date));
      const pieData = Object.keys(pieMap).map(k => ({ service: k, count: pieMap[k] }));
      
      resolve({ chartData, pieData, historyRows: historyRows.slice(0, 100) });
    });
  });
}

function admincontent2tellers(socket, io) {
  socket.on("requestAdminDataforcontent2tellers", async ({ start=0, length=10, order=[{column:0,dir:"asc"}], search="", datefrom, dateto }) => {
    try {
      const { date: today } = getPHDateTime();
      datefrom = datefrom || today;
      dateto = dateto || today;

      const result = await getTellersData(start, length, order, search, datefrom, dateto);
      socket.emit("dashadmincontent2tellers", result);
    } catch (err) {
      console.error("❌ Error fetching teller data:", err);
      socket.emit("dashadmincontent2tellers", { recordsTotal: 0, recordsFiltered: 0, data: [] });
    }
  });

  socket.on("requestTellerDetails", async ({ cnum, cname, datefrom, dateto }) => {
    try {
      const { date: today } = getPHDateTime();
      datefrom = datefrom || today;
      dateto = dateto || today;

      console.log(`📊 Fetching teller details for ${cname} (C#${cnum}) from ${datefrom} to ${dateto}`);
      const result = await getTellerDetails(cnum, cname, datefrom, dateto);
      console.log(`✅ Found ${result.historyRows.length} history rows for ${cname}`);
      socket.emit("tellerDetailsData", result);
    } catch (err) {
      console.error("❌ Error fetching teller details:", err);
      socket.emit("tellerDetailsData", { chartData: [], historyRows: [] });
    }
  });
}

module.exports = { admincontent2tellers };
