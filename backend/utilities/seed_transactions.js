const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../config/db.db');
const db = new sqlite3.Database(dbPath);

const startDate = new Date('2024-01-01T00:00:00');
const endDate = new Date();
const TOTAL_DAYS = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomTimeUntil530() {
    const hour = randomInt(8, 17);
    const minute = hour === 17 ? randomInt(0, 30) : randomInt(0, 59);
    const second = randomInt(0, 59);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function addTime(timeStr, minutesToAdd) {
    let [h, m, s] = timeStr.split(':').map(Number);
    m += minutesToAdd;
    h += Math.floor(m / 60);
    m = m % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

async function runSeeder() {
    console.log('Starting seeder...');
    
    // Clear transactions and forwarded_tickets
    await new Promise((res, rej) => db.run('DELETE FROM transactions', err => err ? rej(err) : res()));
    await new Promise((res, rej) => db.run('DELETE FROM forwarded_tickets', err => err ? rej(err) : res()));
    await new Promise((res, rej) => db.run("DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'forwarded_tickets')", err => err ? rej(err) : res()));
    
    console.log('Cleared existing transactions data.');

    // Fetch and log table info to debug schema issues
    const columns = await new Promise((res, rej) => db.all("PRAGMA table_info(transactions)", (err, rows) => err ? rej(err) : res(rows)));
    console.log("ACTUAL TRANSACTIONS COLUMNS:", columns.map(c => c.name).join(", "));

    // Fetch master data
    const services = await new Promise((res, rej) => db.all('SELECT * FROM services', (err, rows) => err ? rej(err) : res(rows)));
    const tellers = await new Promise((res, rej) => db.all('SELECT * FROM counters', (err, rows) => err ? rej(err) : res(rows)));
    const tellerGroups = await new Promise((res, rej) => db.all('SELECT * FROM counter_groups', (err, rows) => err ? rej(err) : res(rows)));

    if (!services.length || !tellers.length) {
        console.error('No services or counters found! Please configure them in the admin panel first.');
        process.exit(1);
    }

    console.log(`Found ${services.length} services and ${tellers.length} tellers.`);

    const records = [];
    const forwardedRecords = [];

    let txId = 1;
    let d = 0;
    
    const todayStr = formatDate(new Date());
    let currentDate = new Date(startDate);

    while (true) {
        const dateStr = formatDate(currentDate);

        // Generate between 300 and 450 tickets per day
        const ticketsToday = randomInt(300, 450);

        // Ticket counters per service
        const serviceTicketCounts = {};
        services.forEach(s => serviceTicketCounts[s.id] = 1);

        for (let i = 0; i < ticketsToday; i++) {
            // Select random service
            const service = services[randomInt(0, services.length - 1)];
            const isPriority = Math.random() < 0.2; // 20% priority
            
            const ticketservice = isPriority ? service.priority : service.regular;
            const ticketnum = serviceTicketCounts[service.id]++;

            const genTime = generateRandomTimeUntil530(); // generated between 8:00 AM and 5:30 PM
            
            // Randomly select a teller to handle this ticket initially
            const teller = tellers[randomInt(0, tellers.length - 1)];

            // Journey type
            const r = Math.random();
            let journey = 'finished'; // 70%
            if (r > 0.95) journey = 'void'; // 5%
            else if (r > 0.85) journey = 'held'; // 10%
            else if (r > 0.70) journey = 'forwarded'; // 15%

            let status = 'finished';
            let start_time = addTime(genTime, randomInt(5, 60)); // called 5-60 mins later
            let end_time = null;
            let counter_num = teller.cnum || 1;
            let counter_user = teller.cname || 'teller';
            let counter_group = teller.group_id || 1;
            let teller_id = teller.id;
            let history = `[${start_time}-${teller.cname}-${counter_num}-Called]\n`;
            let forwarded_from = null;
            let forwarded_to = null;

            if (journey === 'void') {
                status = 'void';
                end_time = addTime(start_time, randomInt(1, 3));
                history += `[${end_time}-${teller.cname}-${counter_num}-Voided]\n`;
            } else if (journey === 'held') {
                // called -> held -> called again -> finished
                status = 'finished';
                let held_time = addTime(start_time, randomInt(1, 5));
                history += `[${held_time}-${teller.cname}-${counter_num}-Held]\n`;
                let recall_time = addTime(held_time, randomInt(10, 60));
                history += `[${recall_time}-${teller.cname}-${counter_num}-Called]\n`;
                end_time = addTime(recall_time, randomInt(3, 15));
                history += `[${end_time}-${teller.cname}-${counter_num}-Finished]\n`;
            } else if (journey === 'forwarded') {
                status = 'finished';
                let forward_time = addTime(start_time, randomInt(2, 10));
                
                // Select another teller for forwarding
                const otherTellers = tellers.filter(t => t.id !== teller.id);
                const toTeller = otherTellers.length ? otherTellers[randomInt(0, otherTellers.length - 1)] : teller;
                
                forwarded_from = teller.id;
                forwarded_to = toTeller.id;
                
                history += `[${forward_time}-${teller.cname}-${counter_num}-Forwarded]\n`;
                
                forwardedRecords.push({
                    ticket_id: txId,
                    from_teller_id: teller.id,
                    to_teller_id: toTeller.id,
                    to_group_id: null,
                    note: 'Sample forwarded note',
                    forwarded_at: `${dateStr} ${forward_time}`
                });

                let receive_time = addTime(forward_time, randomInt(5, 20));
                let receive_counter = toTeller.cnum || 2;
                history += `[${receive_time}-${toTeller.cname}-${receive_counter}-Called]\n`;
                
                end_time = addTime(receive_time, randomInt(3, 15));
                history += `[${end_time}-${toTeller.cname}-${receive_counter}-Finished]\n`;
                
                counter_num = receive_counter; // Ends up at this counter
                counter_user = toTeller.cname || 'teller';
                counter_group = toTeller.group_id || 1;
                teller_id = toTeller.id;
            } else {
                // normal finished
                end_time = addTime(start_time, randomInt(3, 15));
                history += `[${end_time}-${teller.cname}-${counter_num}-Finished]\n`;
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
        
        if (d % 10 === 0) console.log(`Generated data up to ${dateStr}...`);
        
        if (dateStr === todayStr) {
            break;
        }
        currentDate.setDate(currentDate.getDate() + 1);
        d++;
    }

    console.log(`Total tickets generated: ${records.length}`);
    console.log(`Total forwarded tickets: ${forwardedRecords.length}`);

    // Insert records in chunks to avoid overwhelming sqlite limits
    const CHUNK_SIZE = 1000;
    
    await new Promise((res, rej) => db.run('BEGIN TRANSACTION', err => err ? rej(err) : res()));

    try {
        // Insert in chunks to avoid overwhelming the event loop and sqlite
        const CHUNK_SIZE = 40; // 40 rows * 20 params = 800 params (sqlite max is 999)
        
        let insertedCount = 0;
        for (let i = 0; i < records.length; i += CHUNK_SIZE) {
            const chunk = records.slice(i, i + CHUNK_SIZE);
            const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
            const params = [];
            for (const r of chunk) {
                params.push(r.id, r.ticketnum, r.sname, r.ticketservice, r.status, r.date, r.time, r.start_time, r.end_time, r.history, r.priority, r.ticket_secret, r.mobile, r.mobile_records, r.counter_num, r.forwarded_from, r.forwarded_to, r.teller_id, r.counter_user, r.counter_group);
            }
            
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO transactions (id, ticketnum, sname, ticketservice, status, date, time, start_time, end_time, history, priority, ticket_secret, mobile, mobile_records, counter_num, forwarded_from, forwarded_to, teller_id, counter_user, counter_group) VALUES ${placeholders}`, params, function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            insertedCount += chunk.length;
            if (insertedCount % 10000 === 0 || insertedCount === records.length) {
                console.log(`Inserted ${insertedCount} / ${records.length} transactions...`);
            }
        }

        console.log(`Transactions insertion done.`);

        // Check if forwarded_tickets table exists
        const hasForwardedTickets = await new Promise(res => db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='forwarded_tickets'", (err, row) => res(!!row)));
        
        if (hasForwardedTickets && forwardedRecords.length > 0) {
            for (let i = 0; i < forwardedRecords.length; i += 100) {
                const chunk = forwardedRecords.slice(i, i + 100);
                const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
                const params = [];
                for (const f of chunk) {
                    params.push(f.ticket_id, f.from_teller_id, f.to_teller_id, f.to_group_id, f.note, f.forwarded_at);
                }
                await new Promise((resolve, reject) => {
                    db.run(`INSERT INTO forwarded_tickets (ticket_id, from_teller_id, to_teller_id, to_group_id, note, forwarded_at) VALUES ${placeholders}`, params, function(err) {
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

    db.close();
}

runSeeder().catch(err => {
    console.error(err);
    process.exit(1);
});
