/**
 * ticketHistoryHelper.js
 * Utility to parse transaction history and accurately credit all tellers who
 * called, served, forwarded, or finished tickets, regardless of assigned service or group.
 */

function parseTimeToSec(tStr) {
    if (!tStr || typeof tStr !== 'string') return null;
    const parts = tStr.trim().split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const s = parts.length === 3 && !isNaN(parts[2]) ? parts[2] : 0;
        return parts[0] * 3600 + parts[1] * 60 + s;
    }
    return null;
}


function parseHistory(historyStr) {
    if (!historyStr || typeof historyStr !== 'string') return [];
    const entries = historyStr.split(';').map(s => s.trim()).filter(Boolean);
    const events = [];
    for (const entry of entries) {
        const clean = entry.replace(/[\[\]]/g, '').trim();
        if (!clean) continue;
        const parts = clean.split('-');
        if (parts.length >= 4) {
            events.push({
                time: parts[0].trim(),
                actor: parts[1].trim(),
                counterNum: parts[2].trim(),
                action: parts.slice(3).join('-').trim()
            });
        } else if (parts.length === 3) {
            events.push({
                time: parts[0].trim(),
                actor: parts[1].trim(),
                counterNum: null,
                action: parts[2].trim()
            });
        }
    }
    return events;
}

/**
 * Extracts the journey sequence of tellers who called/served the ticket.
 * E.g., "TELLER 7 → TELLER 2 → TELLER 3"
 */
function extractTellerJourney(historyStr, fallbackName) {
    const events = parseHistory(historyStr);
    const tellers = [];
    const seen = new Set();

    for (const ev of events) {
        if (!ev.actor || ev.actor.toLowerCase() === 'kiosk') continue;
        const act = (ev.action || '').toLowerCase();
        // Any call or finish/forward action indicates teller interaction
        if (['called', 'recalled', 'resumed', 'forwarded', 'finished', 'autofinished', 'held'].includes(act)) {
            const name = ev.actor.trim();
            // Add if not immediately the same as last (to avoid duplicate TELLER 1 → TELLER 1 on recall)
            if (tellers.length === 0 || tellers[tellers.length - 1] !== name) {
                tellers.push(name);
            }
        }
    }

    if (tellers.length > 0) {
        return tellers.join(' → ');
    }

    if (fallbackName && fallbackName.toLowerCase() !== 'kiosk') {
        return fallbackName.trim();
    }

    return 'Unassigned';
}

/**
 * Extracts teller handling data from a single transaction.
 * Returns Map<tellerIdentifier, { tellerName, counterNum, hasServed, durationMinutes, isCompleted, isVoided }>
 */
function extractTellersFromTransaction(tx, todayDate) {
    const events = parseHistory(tx.history);
    const tellers = new Map();

    function getOrCreateTeller(key, name, counterNum) {
        const normKey = String(key || name || '').trim().toLowerCase();
        if (!normKey || normKey === 'kiosk') return null;
        if (!tellers.has(normKey)) {
            tellers.set(normKey, {
                key: normKey,
                tellerName: (name || key).trim(),
                counterNum: counterNum ? String(counterNum).trim() : null,
                hasServed: false,
                isCompleted: false,
                isVoided: false,
                actions: [],
                durationMinutes: 0
            });
        }
        const t = tellers.get(normKey);
        if (counterNum && !t.counterNum) t.counterNum = String(counterNum).trim();
        if (name && (!t.tellerName || t.tellerName === t.counterNum)) t.tellerName = name.trim();
        return t;
    }

    // Process all events from history
    for (const ev of events) {
        if (!ev.actor || ev.actor.toLowerCase() === 'kiosk') continue;
        const teller = getOrCreateTeller(ev.actor, ev.actor, ev.counterNum);
        if (teller) {
            teller.actions.push(ev);
        }
    }

    // Also consider final teller columns if present
    const finalTellerUser = tx.counter_user || tx.teller_name;
    if (finalTellerUser && finalTellerUser.toLowerCase() !== 'kiosk') {
        getOrCreateTeller(finalTellerUser, finalTellerUser, tx.counter_num);
    } else if (tx.teller_id) {
        getOrCreateTeller(`id_${tx.teller_id}`, `Counter ${tx.counter_num || tx.teller_id}`, tx.counter_num);
    }

    // Determine effective status
    const statusLower = String(tx.status || '').toLowerCase();
    const isFinished = statusLower === 'finished';
    const isVoided = ['void', 'voided'].includes(statusLower) || (todayDate && tx.date < todayDate && !isFinished);

    for (const [key, teller] of tellers.entries()) {
        let sessionStartSec = null;
        let servedAny = false;
        let totalSec = 0;

        for (const ev of teller.actions) {
            const act = (ev.action || '').toLowerCase();
            const sec = parseTimeToSec(ev.time);

            if (['called', 'recalled', 'resumed'].includes(act)) {
                sessionStartSec = sec;
                servedAny = true;
            } else if (['forwarded', 'finished', 'autofinished', 'held', 'voided'].includes(act)) {
                servedAny = true;
                if (sessionStartSec !== null && sec !== null && sec >= sessionStartSec) {
                    const diffSec = sec - sessionStartSec;
                    if (diffSec <= 43200) { // <= 12 hours check
                        totalSec += diffSec;
                    }
                    sessionStartSec = null;
                }
            }
        }

        teller.hasServed = servedAny || teller.actions.length > 0;

        // If no explicit actions in history but this teller was recorded as final teller
        if (!servedAny && (tx.counter_user || tx.teller_id)) {
            teller.hasServed = true;
            if (tx.start_time && tx.end_time) {
                const sSec = parseTimeToSec(tx.start_time);
                const eSec = parseTimeToSec(tx.end_time);
                if (sSec !== null && eSec !== null && eSec >= sSec) {
                    totalSec = eSec - sSec;
                }
            }
        }

        teller.durationMinutes = totalSec / 60.0;
        teller.isCompleted = isFinished;
        teller.isVoided = isVoided;
    }

    return tellers;
}

/**
 * Aggregates teller performance for dashboard and reports.
 * Matches tellers by counter id, cname, cuser, or cnum.
 * Returns an array of teller performance records.
 */
function aggregateTellerMetrics(counters, transactions, todayDate) {
    // Build counter lookup maps
    const tellerStats = new Map();

    (counters || []).forEach(c => {
        const id = c.id;
        tellerStats.set(id, {
            id: c.id,
            teller_id: c.id,
            cname: c.cname || `Counter ${c.cnum || c.id}`,
            cnum: c.cnum,
            cuser: c.cuser || '',
            teller_name: c.cname || `Counter ${c.cnum || c.id}`,
            counter_number: c.cnum,
            group_name: c.group_name || '',
            services: c.services || '',
            tickets_served: 0,
            completed: 0,
            voided: 0,
            served_today: 0,
            total_service_minutes: 0,
            total_turnaround_minutes: 0,
            turnaround_count: 0,
            serving_ticket: null,
            status: 'Idle',
            status_code: 'idle',
            _matchedTicketIds: new Set()
        });
    });

    // Helper to find counter by teller key/cname/cuser/cnum/id
    function findCounterForTeller(tellerInfo, tx) {
        const nameLower = String(tellerInfo.tellerName || '').toLowerCase().trim();
        const keyLower = String(tellerInfo.key || '').toLowerCase().trim();
        const numStr = tellerInfo.counterNum ? String(tellerInfo.counterNum).trim() : null;

        // 1. Direct counter lookup
        for (const [id, stat] of tellerStats.entries()) {
            if (tx.teller_id && Number(tx.teller_id) === id && (nameLower === String(stat.cname).toLowerCase() || nameLower === String(stat.cuser).toLowerCase() || numStr === String(stat.cnum))) {
                return stat;
            }
            if (String(stat.cname).toLowerCase() === nameLower || String(stat.cuser).toLowerCase() === nameLower || String(stat.cname).toLowerCase() === keyLower || String(stat.cuser).toLowerCase() === keyLower) {
                return stat;
            }
            if (numStr && String(stat.cnum) === numStr) {
                return stat;
            }
        }

        // 2. Fallback to teller_id from transaction if matches counter id
        if (tx.teller_id && tellerStats.has(Number(tx.teller_id))) {
            return tellerStats.get(Number(tx.teller_id));
        }

        // 3. Fallback counter num from transaction
        if (tx.counter_num) {
            for (const stat of tellerStats.values()) {
                if (String(stat.cnum) === String(tx.counter_num)) {
                    return stat;
                }
            }
        }

        return null;
    }

    // Process transactions
    (transactions || []).forEach(tx => {
        const tellersInTx = extractTellersFromTransaction(tx, todayDate);
        const ticketTurnaroundMinutes = (tx.status === 'finished' && tx.start_time && tx.end_time)
            ? (() => {
                const s = parseTimeToSec(tx.time || tx.start_time);
                const e = parseTimeToSec(tx.end_time);
                return (s !== null && e !== null && e >= s) ? (e - s) / 60.0 : null;
            })()
            : null;

        // Check if ticket is currently active (calling/called)
        const isCalling = ['calling', 'called'].includes(String(tx.status || '').toLowerCase());
        const ticketCode = (tx.ticketservice || '') + (tx.ticketnum || '');

        for (const [key, tInfo] of tellersInTx.entries()) {
            if (!tInfo.hasServed) continue;

            const stat = findCounterForTeller(tInfo, tx);
            if (!stat) continue;

            // Only count ticket once per teller even if recalled/resumed
            if (!stat._matchedTicketIds.has(tx.id)) {
                stat._matchedTicketIds.add(tx.id);
                stat.tickets_served += 1;
                stat.served_today += 1;

                if (tInfo.isCompleted) {
                    stat.completed += 1;
                } else if (tInfo.isVoided) {
                    stat.voided += 1;
                }

                if (tInfo.durationMinutes > 0) {
                    stat.total_service_minutes += tInfo.durationMinutes;
                }

                if (ticketTurnaroundMinutes !== null) {
                    stat.total_turnaround_minutes += ticketTurnaroundMinutes;
                    stat.turnaround_count += 1;
                }
            }

            // Check if this teller is currently serving this ticket
            if (isCalling && !stat.serving_ticket) {
                // If this teller was the one who called it or tx.teller_id matches
                const lastEvent = tInfo.actions[tInfo.actions.length - 1];
                if ((lastEvent && ['called', 'recalled', 'resumed'].includes(lastEvent.action.toLowerCase())) ||
                    Number(tx.teller_id) === stat.id ||
                    String(tx.counter_num) === String(stat.cnum)) {
                    stat.serving_ticket = ticketCode;
                    stat.status = `Serving ${ticketCode}`;
                    stat.status_code = 'busy';
                }
            }
        }
    });

    // Finalize averages
    const result = [];
    for (const stat of tellerStats.values()) {
        delete stat._matchedTicketIds;
        stat.avg_service_time = stat.tickets_served > 0 ? (stat.total_service_minutes / stat.tickets_served) : 0;
        stat.avg_service_time_minutes = stat.avg_service_time;
        stat.avg_turnaround_time = stat.turnaround_count > 0 ? (stat.total_turnaround_minutes / stat.turnaround_count) : 0;
        result.push(stat);
    }

    return result;
}

/**
 * Extracts 30-minute block teller throughput from transactions for live flow analytics.
 * Returns array: [ { time_block: '08:00', teller_name: 'TELLER 1', count: 3 }, ... ]
 */
function extractTellerFlowBlocks(transactions, counters) {
    const counterLookup = new Map();
    (counters || []).forEach(c => {
        counterLookup.set(String(c.cname || '').toLowerCase(), c.cname);
        counterLookup.set(String(c.cuser || '').toLowerCase(), c.cname);
        counterLookup.set(String(c.cnum || ''), c.cname);
        counterLookup.set(c.id, c.cname);
    });

    function resolveTellerName(rawName, counterNum) {
        if (!rawName) return 'Unassigned';
        const key = String(rawName).toLowerCase();
        if (counterLookup.has(key)) return counterLookup.get(key);
        if (counterNum && counterLookup.has(String(counterNum))) return counterLookup.get(String(counterNum));
        return rawName;
    }

    const flowCounts = new Map(); // key: `${time_block}|${teller_name}` -> count

    (transactions || []).forEach(tx => {
        const events = parseHistory(tx.history);
        const processedSessions = new Set();

        for (const ev of events) {
            if (!ev.actor || ev.actor.toLowerCase() === 'kiosk') continue;
            const act = (ev.action || '').toLowerCase();
            // A teller produces throughput when they finish or forward a ticket
            if (['finished', 'autofinished', 'forwarded'].includes(act) && ev.time) {
                const parts = ev.time.split(':').map(Number);
                if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    const hour = String(parts[0]).padStart(2, '0');
                    const minuteBlock = parts[1] < 30 ? '00' : '30';
                    const timeBlock = `${hour}:${minuteBlock}`;
                    const tellerName = resolveTellerName(ev.actor, ev.counterNum);
                    const flowKey = `${timeBlock}|${tellerName}`;

                    if (!processedSessions.has(flowKey + `|${tx.id}`)) {
                        processedSessions.add(flowKey + `|${tx.id}`);
                        flowCounts.set(flowKey, (flowCounts.get(flowKey) || 0) + 1);
                    }
                }
            }
        }

        // If no events in history but transaction is finished and has end_time
        if (events.length === 0 && tx.status === 'finished' && tx.end_time) {
            const parts = tx.end_time.split(':').map(Number);
            if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const hour = String(parts[0]).padStart(2, '0');
                const minuteBlock = parts[1] < 30 ? '00' : '30';
                const timeBlock = `${hour}:${minuteBlock}`;
                const tellerName = resolveTellerName(tx.counter_user || tx.teller_name, tx.counter_num);
                const flowKey = `${timeBlock}|${tellerName}`;
                flowCounts.set(flowKey, (flowCounts.get(flowKey) || 0) + 1);
            }
        }
    });

    const result = [];
    for (const [key, count] of flowCounts.entries()) {
        const [time_block, teller_name] = key.split('|');
        result.push({ time_block, teller_name, count });
    }

    result.sort((a, b) => a.time_block.localeCompare(b.time_block) || a.teller_name.localeCompare(b.teller_name));
    return result;
}

module.exports = {
    parseTimeToSec,
    parseHistory,
    extractTellerJourney,
    extractTellersFromTransaction,
    aggregateTellerMetrics,
    extractTellerFlowBlocks
};
