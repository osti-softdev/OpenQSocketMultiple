// & ===== GLOBAL TABLE SORTING =====
// Click any table header to sort that column (asc -> desc -> asc ...).
// Works for dynamically rendered tables and re-applies after data refreshes.
(function () {
    const sortState = new WeakMap(); // table -> { index, dir }
    const observers = new WeakMap(); // table -> MutationObserver

    function cellText(td) {
        if (!td) return '';
        const explicit = td.getAttribute('data-sort');
        return (explicit !== null ? explicit : td.textContent).replace(/\s+/g, ' ').trim();
    }

    function parseValue(text) {
        if (text === '' || text === '-' || text === '—' || text.toLowerCase() === 'n/a') {
            return { type: 'empty', v: null };
        }
        // numbers, percentages, durations like "12 min", "3m", "1,200"
        const num = text.replace(/,/g, '').match(/^-?\d+(\.\d+)?(?=\s*(%|m|min|mins|s|h)?$)/i);
        if (num) return { type: 'num', v: parseFloat(num[0]) };
        // dates / times (require a digit and a date-ish separator)
        if (/\d/.test(text) && /[-\/:,]|\b(am|pm|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text)) {
            const t = Date.parse(text);
            if (!isNaN(t)) return { type: 'date', v: t };
        }
        // leading number in text (e.g. "Counter 3", "T12")
        return { type: 'text', v: text.toLowerCase() };
    }

    function compare(a, b) {
        if (a.type === 'empty' && b.type === 'empty') return 0;
        if (a.type === 'empty') return 1;   // empties always last
        if (b.type === 'empty') return -1;
        if (a.type === b.type && a.type !== 'text') return a.v - b.v;
        return String(a.v).localeCompare(String(b.v), undefined, { numeric: true, sensitivity: 'base' });
    }

    function getBody(table) {
        return table.tBodies && table.tBodies[0];
    }

    function isDataRow(tr) {
        return !Array.from(tr.cells).some(c => c.colSpan > 1);
    }

    function applySort(table) {
        const state = sortState.get(table);
        const tbody = getBody(table);
        if (!state || !tbody) return;

        const obs = observers.get(table);
        if (obs) obs.disconnect();

        const rows = Array.from(tbody.rows);
        const dataRows = rows.filter(isDataRow);
        if (dataRows.length > 1) {
            const keyed = dataRows.map((tr, i) => ({
                tr, i, key: parseValue(cellText(tr.cells[state.index]))
            }));
            keyed.sort((a, b) => {
                let r = compare(a.key, b.key);
                if (a.key.type !== 'empty' && b.key.type !== 'empty') r *= state.dir;
                return r || a.i - b.i;
            });
            keyed.forEach(k => tbody.appendChild(k.tr));
            // keep colspan/placeholder rows at the bottom
            rows.filter(r => !isDataRow(r)).forEach(r => tbody.appendChild(r));
        }

        if (obs) obs.observe(tbody, { childList: true });
    }

    function updateIndicators(table) {
        const state = sortState.get(table);
        const ths = table.tHead ? table.tHead.querySelectorAll('th') : [];
        ths.forEach((th, i) => {
            th.classList.remove('sort-asc', 'sort-desc');
            th.removeAttribute('aria-sort');
            if (state && state.index === i) {
                th.classList.add(state.dir === 1 ? 'sort-asc' : 'sort-desc');
                th.setAttribute('aria-sort', state.dir === 1 ? 'ascending' : 'descending');
            }
        });
    }

    function watch(table) {
        if (observers.has(table)) return;
        const tbody = getBody(table);
        if (!tbody) return;
        const obs = new MutationObserver(() => applySort(table));
        observers.set(table, obs);
        obs.observe(tbody, { childList: true });
    }

    function isSortable(th) {
        if (th.hasAttribute('data-nosort')) return false;
        if (th.querySelector('input[type="checkbox"]')) return false;
        return th.textContent.trim() !== '';
    }

    function markSortable(root) {
        (root || document).querySelectorAll('table thead th').forEach(th => {
            if (isSortable(th)) th.classList.add('sortable');
        });
    }

    document.addEventListener('click', function (e) {
        const th = e.target.closest && e.target.closest('table thead th');
        if (!th || !isSortable(th)) return;
        const table = th.closest('table');
        if (!table || !table.closest('.content')) return;
        // ignore when clicking an interactive control inside the header
        if (e.target.closest('button, a, input, select')) return;

        const index = Array.from(th.parentElement.children).indexOf(th);
        const prev = sortState.get(table);
        const dir = prev && prev.index === index ? -prev.dir : 1;
        sortState.set(table, { index, dir });

        watch(table);
        applySort(table);
        updateIndicators(table);
    });

    document.addEventListener('DOMContentLoaded', function () {
        markSortable(document);
    });
    // Tables inserted later (modals, dynamic tabs)
    new MutationObserver(function (muts) {
        muts.forEach(m => m.addedNodes.forEach(n => {
            if (n.nodeType === 1 && (n.matches('table') || n.querySelector('table'))) markSortable(n);
        }));
    }).observe(document.documentElement, { childList: true, subtree: true });

    window.markSortableTables = markSortable;
})();
