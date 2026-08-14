// utilities/scheduleResolver.js
// Pure logic: given the list of schedule rows and "now", decide which one
// (if any) should be controlling the display right now. No DB/IO in here
// on purpose, so it can be unit tested and reused server-side or client-side.

/**
 * @param {Array} schedules - rows from the `schedules` table
 * @param {Date} now
 * @returns {object|null} the winning schedule row, or null if nothing matches
 *   (caller should fall back to the default playlist)
 */
function resolveActiveSchedule(schedules, now = new Date()) {
    const currentDate = formatDate(now);      // 'YYYY-MM-DD'
    const currentTime = formatTime(now);       // 'HH:MM:SS'
    const currentDay = now.getDay();           // 0 (Sun) - 6 (Sat)

    const candidates = (schedules || []).filter(s => {
        if (!s.active) return false;

        if (s.start_date && currentDate < s.start_date) return false;
        if (s.end_date && currentDate > s.end_date) return false;

        if (s.days_of_week) {
            const days = String(s.days_of_week)
                .split(",")
                .map(d => parseInt(d, 10))
                .filter(d => !Number.isNaN(d));
            if (days.length && !days.includes(currentDay)) return false;
        }

        return isWithinTimeWindow(currentTime, s.start_time, s.end_time);
    });

    if (!candidates.length) return null;

    // Highest priority wins. On a tie, a pinned single video beats a whole
    // playlist (it's the more specific/deliberate override).
    candidates.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (a.type === b.type) return 0;
        return a.type === "video" ? -1 : 1;
    });

    return candidates[0];
}

/**
 * Handles overnight windows too, e.g. start "22:00:00" end "02:00:00"
 * means "active from 10pm through 2am the next day".
 */
function isWithinTimeWindow(current, start, end) {
    if (!start || !end) return true;
    if (start <= end) {
        return current >= start && current <= end;
    }
    // wraps past midnight
    return current >= start || current <= end;
}

function formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatTime(d) {
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(n => String(n).padStart(2, "0"))
        .join(":");
}

module.exports = { resolveActiveSchedule, isWithinTimeWindow };
