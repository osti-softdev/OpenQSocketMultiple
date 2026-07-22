const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../backend/config/db.db');
const db = new sqlite3.Database(dbPath);

const startDate = new Date('2024-01-01T00:00:00');
const endDate = new Date();

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTimeUntil530() {
    const hour = randomInt(8, 16); // 8 AM to 4 PM start times
    const minute = randomInt(0, 59);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function addTime(timeStr, minutesToAdd) {
    let [h, m, s] = timeStr.split(':').map(Number);
    m += minutesToAdd;
    h += Math.floor(m / 60);
    m = m % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function runSeeder() {
    console.log('Starting realistic queue seeder...');

    await new Promise((res, rej) => db.run('DELETE FROM transactions', err => err ? rej(err) : res()));
    await new Promise((res, rej) => db.run('DELETE FROM forwarded_tickets', err => err ? rej(err) : res()));
    await new Promise((res, rej) => db.run("DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'forwarded_tickets')", err => err ? rej(err) : res()));

    console.log('Cleared existing transactions data.');

    const services = await new Promise((res, rej) => db.all('SELECT * FROM services', (err, rows) => err ? rej(err) : res(rows)));
    const tellers = await new Promise((res, rej) => db.all('SELECT * FROM counters', (err, rows) => err ? rej(err) : res(rows)));

    if (!services.length || !tellers.length) {
        console.error('No services or counters found!');
        process.exit(1);
    }

    const records = [];
    const forwardedRecords = {};
    let txId = 1;
    let d = 0;

    const todayStr = formatDate(new Date());
    let currentDate = new Date(startDate);

    while (true) {
        const dateStr = formatDate(currentDate);
        const isToday = dateStr === todayStr;

        // Fewer tickets for past days to keep DB size reasonable, more for today
        const ticketsToday = isToday ? randomInt(150, 200) : randomInt(50, 100);

        const serviceTicketCounts = {};
        services.forEach(s => serviceTicketCounts[s.id] = 1);

        for (let i = 0; i < ticketsToday; i++) {
            const service = services[randomInt(0, services.length - 1)];
            const isPriority = Math.random() < 0.2;
            const ticketservice = isPriority ? service.priority : service.regular;
            const ticketnum = serviceTicketCounts[service.id]++;
            const genTime = generateRandomTimeUntil530();

            // Randomly select a sequence of events for this ticket
            let currentTime = genTime;
            let history = '';

            // Helper to append history without trailing semicolons if not needed, or just append with semicolon.
            // The real app uses history || ';' || ?
            // So we will just separate them by ';'
            const addHistory = (entry) => {
                if (history === '') history = entry;
                else history += ';' + entry;
            };

            let status = 'pending';
            let start_time = null;
            let end_time = null;

            let currentTeller = tellers[randomInt(0, tellers.length - 1)];
            let counter_num = null;
            let counter_user = null;
            let counter_group = null;
            let teller_id = null;
            let forwarded_from = null;
            let forwarded_to = null;

            // Should this ticket be left in an incomplete state if it's today?
            const leaveIncomplete = isToday && Math.random() < 0.3; // 30% of today's tickets are unfinished
            const targetState = leaveIncomplete ? randomInt(1, 4) : 5;
            // 1: pending, 2: calling/called, 3: held, 4: received (forwarded), 5: finished/voided

            if (targetState === 1) {
                // Stays pending
            } else {
                // Step 1: Called
                currentTime = addTime(currentTime, randomInt(5, 30));
                start_time = currentTime;
                teller_id = currentTeller.id;
                counter_num = currentTeller.cnum || 1;
                counter_user = currentTeller.cname || 'teller';
                counter_group = currentTeller.group_name || 'GENERAL';
                addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Called]`);
                status = 'calling';

                if (targetState === 2) {
                    // Stays called
                } else {
                    // Decide journey: finish, void, hold, or forward multiple times
                    const journeyR = Math.random();
                    if (journeyR < 0.1) {
                        // Voided immediately
                        status = 'void';
                        currentTime = addTime(currentTime, randomInt(1, 3));
                        end_time = currentTime;
                        addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Voided]`);
                    } else if (journeyR < 0.3) {
                        // Held and recalled
                        currentTime = addTime(currentTime, randomInt(2, 5));
                        addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Held]`);
                        status = 'held';

                        if (targetState === 3) {
                            // Stays held
                        } else {
                            currentTime = addTime(currentTime, randomInt(10, 40));
                            addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Called]`);
                            status = 'calling';

                            currentTime = addTime(currentTime, randomInt(5, 15));
                            addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Finished]`);
                            end_time = currentTime;
                            status = 'finished';
                        }
                    } else if (journeyR < 0.6) {
                        // Forwarded (maybe multiple times)
                        let numForwards = randomInt(1, 3); // Forwarded between tellers a couple times
                        for (let f = 0; f < numForwards; f++) {
                            currentTime = addTime(currentTime, randomInt(2, 8));

                            const otherTellers = tellers.filter(t => t.id !== currentTeller.id);
                            const toTeller = otherTellers.length ? otherTellers[randomInt(0, otherTellers.length - 1)] : currentTeller;

                            addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Forwarded]`);

                            // Instead of pushing multiple records for the same ticket, 
                            // we just overwrite the map entry to keep the latest forward info.
                            forwardedRecords[txId] = {
                                ticket_id: txId,
                                from_teller_id: currentTeller.id,
                                to_teller_id: toTeller.id,
                                to_group_id: null,
                                note: 'Transferred for further processing',
                                forwarded_at: `${dateStr} ${currentTime}`
                            };

                            forwarded_from = currentTeller.id;
                            forwarded_to = toTeller.id;
                            status = 'received';

                            // Update current teller context for the NEXT step
                            currentTeller = toTeller;
                            counter_num = toTeller.cnum || 1;
                            counter_user = toTeller.cname || 'teller';
                            counter_group = toTeller.group_name || 'GENERAL';
                            teller_id = toTeller.id;

                            // If this is the last forward and we want it to stay received
                            if (f === numForwards - 1 && targetState === 4) {
                                break;
                            }

                            // Next teller calls it
                            currentTime = addTime(currentTime, randomInt(5, 20));
                            addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Called]`);
                            status = 'calling';
                            start_time = currentTime; // Update start_time for the new teller session
                        }

                        if (status === 'calling') {
                            currentTime = addTime(currentTime, randomInt(5, 20));
                            addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Finished]`);
                            end_time = currentTime;
                            status = 'finished';
                        }

                    } else {
                        // Normal finish
                        currentTime = addTime(currentTime, randomInt(3, 15));
                        addHistory(`[${currentTime}-${currentTeller.cname}-${counter_num}-Finished]`);
                        end_time = currentTime;
                        status = 'finished';
                    }
                }
            }

            records.push({
                id: txId++,
                ticketnum,
                sname: service.sname || service.name,
                ticketservice,
                status,
                date: dateStr,
                time: genTime,
                start_time,
                end_time,
                history,
                priority: isPriority ? 1 : 0,
                ticket_secret: Math.random().toString(36).substring(2, 10).toUpperCase(),
                mobile: null,
                mobile_records: null,
                counter_num,
                forwarded_from,
                forwarded_to,
                teller_id,
                counter_user,
                counter_group
            });
        }

        if (d % 10 === 0 || isToday) console.log(`Generated data up to ${dateStr}${isToday ? ' (Today)' : ''}...`);

        if (isToday) break;
        currentDate.setDate(currentDate.getDate() + 1);
        d++;
    }

    console.log(`Total tickets generated: ${records.length}`);
    console.log(`Total forwarded tickets: ${Object.keys(forwardedRecords).length}`);

    await new Promise((res, rej) => db.run('BEGIN TRANSACTION', err => err ? rej(err) : res()));

    try {
        const CHUNK_SIZE = 40;

        let insertedCount = 0;
        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            const params = [];
            for (const r of chunk) {
                params.push(r.id, r.ticketnum, r.sname, r.ticketservice, r.status, r.date, r.time, r.start_time, r.end_time, r.history, r.priority, r.ticket_secret, r.mobile, r.mobile_records, r.counter_num, r.forwarded_from, r.forwarded_to, r.teller_id, r.counter_user, r.counter_group);
            }

            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO transactions (id, ticketnum, sname, ticketservice, status, date, time, start_time, end_time, history, priority, ticket_secret, mobile, mobile_records, counter_num, forwarded_from, forwarded_to, teller_id, counter_user, counter_group) VALUES ${placeholders}`, params, function (err) {
                    if (err) reject(err);
                    else resolve();
                });
            });

            insertedCount += chunk.length;
            if (insertedCount % 10000 === 0 || insertedCount === records.length) {
                console.log(`Inserted ${insertedCount} / ${records.length} transactions...`);
            }
        }

        const hasForwardedTickets = await new Promise(res => db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='forwarded_tickets'", (err, row) => res(!!row)));

        const fRecordsArray = Object.values(forwardedRecords);
        if (hasForwardedTickets && fRecordsArray.length > 0) {
            for (let i = 0; i < fRecordsArray.length; i += 100) {
                const chunk = fRecordsArray.slice(i, i + 100);
                const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
                const params = [];
                for (const f of chunk) {
                    params.push(f.ticket_id, f.from_teller_id, f.to_teller_id, f.to_group_id, f.note, f.forwarded_at);
                }
                await new Promise((resolve, reject) => {
                    db.run(`INSERT INTO forwarded_tickets (ticket_id, from_teller_id, to_teller_id, to_group_id, note, forwarded_at) VALUES ${placeholders}`, params, function (err) {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        }

        await new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res()));
        console.log('Successfully inserted all records!');
        process.exit(0);
    } catch (e) {
        console.error('Error during insert:', e);
        await new Promise(res => db.run('ROLLBACK', res));
        process.exit(1);
    }
}

runSeeder().catch(err => {
    console.error(err);
    process.exit(1);
});
