let latestLiveTellers = [];
let lastAvgServiceTime = [];
// Dashboard Module for Admin Panel
let currentTrendView = 'day';
let overviewPeriodData = null;

$(document).on('click', '#hourlyBtn', function () {
    $('#dailyBtn, #monthlyBtn').removeClass('active');
    $(this).addClass('active');
    currentTrendView = 'day';
    renderSelectedPeriodTrend();
});

$(document).on('click', '#dailyBtn', function () {
    $('#hourlyBtn, #monthlyBtn').removeClass('active');
    $(this).addClass('active');
    currentTrendView = 'week';
    renderSelectedPeriodTrend();
});

$(document).on('click', '#monthlyBtn', function () {
    $('#hourlyBtn, #dailyBtn').removeClass('active');
    $(this).addClass('active');
    currentTrendView = 'month';
    renderSelectedPeriodTrend();
});

// & ===== DASHBOARD =====
function loadDashboard() {
    loadLiveDashboard();
    // Refresh every 30 seconds
    if (window.dashboardInterval) clearInterval(window.dashboardInterval);
    window.dashboardInterval = setInterval(loadLiveDashboard, 30000);
}

// & ===== LIVE DASHBOARD =====
function loadLiveDashboard() {
    const now = new Date();
    $('#last-updated').text(now.toLocaleTimeString());
    const $banner = $('#overview-loading-banner');
    $banner.removeClass('loaded').addClass('is-loading');
    $('#overview-loading-text').text('Synchronizing queue intelligence & analytics…');

    const livePromise = $.get('/api/admin/dashboard/live', function(data) {
        // 1. Stats Cards
        if (data.stats) {
            $('#live-total, #live-total-ov').text(data.stats.total_tickets || 0);
            $('#live-queue').text(data.stats.queue_length || 0);
            $('#live-served, #live-served-ov').text(data.stats.queue_served || 0);
            $('#live-avgserving').text(data.stats.avg_service_time ? Math.round(data.stats.avg_service_time) + 'm' : '0m');
            const turnaround = data.stats.avg_turnaround ? Math.round(data.stats.avg_turnaround) + 'm' : '0m';
            $('#live-turnaround').text(turnaround);
            $('#live-avgwaiting').text(data.stats.avg_wait_time ? Math.round(data.stats.avg_wait_time) + 'm' : '0m');
        }

        // Calculate total serving right now across services
        let totalServingNow = 0;
        if (data.services && data.services.length > 0) {
            totalServingNow = data.services.reduce((acc, s) => acc + Number(s.serving_count || 0), 0);
        }
        $('#live-serving-ov').text(totalServingNow);

        // 2. Service Live Board (Update both #service-live-grid and #overview-service-table)
        const $serviceGrid = $('#service-live-grid tbody').empty();
        const $ovServiceGrid = $('#overview-service-table tbody').empty();

        if (data.services && data.services.length > 0) {
            // Sort: Serving first, then Waiting/Queueing, then Completed/Idle
            data.services.sort((a, b) => {
                const aServing = Number(a.serving_count || 0);
                const bServing = Number(b.serving_count || 0);
                const aWaiting = Number(a.waiting_count || 0);
                const bWaiting = Number(b.waiting_count || 0);

                if (aServing > 0 && bServing === 0) return -1;
                if (bServing > 0 && aServing === 0) return 1;
                if (aServing > 0 && bServing > 0) {
                    if (bServing !== aServing) return bServing - aServing;
                    return bWaiting - aWaiting;
                }

                if (aWaiting > 0 && bWaiting === 0) return -1;
                if (bWaiting > 0 && aWaiting === 0) return 1;
                if (aWaiting > 0 && bWaiting > 0) return bWaiting - aWaiting;

                const aCompleted = Number(a.completed_count || 0);
                const bCompleted = Number(b.completed_count || 0);
                if (bCompleted !== aCompleted) return bCompleted - aCompleted;
                return (a.shortSname || a.sname || '').localeCompare(b.shortSname || b.sname || '');
            });

            data.services.forEach(s => {
                let statusClass = 'status-ok';
                let statusText = 'Idle';
                let indicatorClass = 'idle';

                if (s.serving_count > 0) {
                    if (s.waiting_count > 10) {
                        statusClass = 'status-critical';
                        statusText = 'Queueing / Serving';
                        indicatorClass = 'queueing';
                    } else if (s.waiting_count > 5) {
                        statusClass = 'status-busy';
                        statusText = 'Busy / Serving';
                        indicatorClass = 'busy';
                    } else {
                        statusClass = 'status-ok';
                        statusText = 'Serving';
                        indicatorClass = 'serving';
                    }
                } else if (s.waiting_count > 0) {
                    if (s.waiting_count > 10) {
                        statusClass = 'status-critical';
                        statusText = 'Queueing (Idle)';
                        indicatorClass = 'queueing';
                    } else if (s.waiting_count > 5) {
                        statusClass = 'status-busy';
                        statusText = 'Busy (Idle)';
                        indicatorClass = 'busy';
                    } else {
                        statusClass = 'status-ok';
                        statusText = 'Waiting (Idle)';
                        indicatorClass = 'idle';
                    }
                } else {
                    statusClass = 'status-ok';
                    statusText = 'Idle';
                    indicatorClass = 'idle';
                }

                const rowHtml = `
                    <tr class="${statusClass}">
                        <td><strong>${s.shortSname || s.sname}</strong></td>
                        <td>
                            <span class="status-indicator ${indicatorClass}">
                                ${statusText}
                            </span>
                        </td>
                        <td>${s.waiting_count || 0}</td>
                        <td>${s.serving_count || 0}</td>
                        <td>${s.completed_count || 0}</td>
                        <td>
                            ${s.avg_wait_time ? Math.round(s.avg_wait_time) + ' min' : '-'}
                        </td>
                    </tr>
                `;
                $serviceGrid.append(rowHtml);
                $ovServiceGrid.append(rowHtml);
            });
        } else {
            const emptyHtml = '<tr><td colspan="6" style="text-align:center" class="text-muted">No active services found today.</td></tr>';
            $serviceGrid.html(emptyHtml);
            $ovServiceGrid.html(emptyHtml);
        }

        // 3. Teller Live List (Update #overview-teller-table)
        latestLiveTellers = data.tellers || [];
        const $tellerList = $('#teller-live-list').empty();
        const $ovTellerList = $('#overview-teller-table tbody').empty();

        if (data.tellers && data.tellers.length > 0) {
            // Sort: Busy / Serving first, then Highest Served Today, then Counter Number
            data.tellers.sort((a, b) => {
                const aBusy = (a.status_code === 'busy' || Boolean(a.serving_ticket)) ? 1 : 0;
                const bBusy = (b.status_code === 'busy' || Boolean(b.serving_ticket)) ? 1 : 0;
                if (bBusy !== aBusy) return bBusy - aBusy;

                const aServed = Number(a.served_today || 0);
                const bServed = Number(b.served_today || 0);
                if (bServed !== aServed) return bServed - aServed;

                return Number(a.cnum || 0) - Number(b.cnum || 0);
            });

            createCounterVelocityChart(data.tellers, lastAvgServiceTime);

            data.tellers.forEach(t => {
                const isServing = (t.status_code === 'busy' || Boolean(t.serving_ticket));
                const statusClass = isServing ? 'busy' : 'idle';
                const rowClass = isServing ? ' class="row-active-serving"' : '';
                const rowHtml = `
                    <tr${rowClass}>
                        <td><strong>${t.cname}</strong></td>
                        <td>Counter ${t.cnum}</td>
                        <td><span class="status-indicator ${statusClass}">${t.status}</span></td>
                        <td>${t.served_today || 0}</td>
                        <td>${t.avg_service_time ? Math.round(t.avg_service_time) + ' min' : '-'}</td>
                        <td>${t.avg_turnaround_time ? Math.round(t.avg_turnaround_time) + ' min' : '-'}</td>
                    </tr>
                `;
                $tellerList.append(rowHtml);
                $ovTellerList.append(rowHtml);
            });
        } else {
            const emptyHtml = '<tr><td colspan="6" style="text-align:center" class="text-muted">No tellers logged in currently.</td></tr>';
            $tellerList.append(emptyHtml);
            $ovTellerList.append(emptyHtml);
            createCounterVelocityChart([], lastAvgServiceTime);
        }
    });

    const insightsPromise = $.get('/api/admin/analytics/insights', renderOperationalInsights);

    const flowPromise = $.get('/api/admin/analytics/live-flow', function (data) {
        createLiveTicketFlowChart(data.tickets || []);
        createLiveTellerFlowChart(data.tellers || []);
    });

    // 4. Historical Charts (Refresh less often? For now, refresh with dashboard)
    const overviewPromise = $.get('/api/admin/analytics/overview', function(stats) {
        lastAvgServiceTime = stats.avgServiceTime || [];
        createServiceChart(stats.byService);
        createStatusChart(stats.byStatus);
        createCounterVelocityChart(latestLiveTellers, stats.avgServiceTime);
    });

    const periodPromise = $.get('/api/admin/analytics/period-overview', renderPeriodOverview);

    $.when(livePromise, insightsPromise, flowPromise, overviewPromise, periodPromise).always(function (liveRes) {
        const liveData = Array.isArray(liveRes) ? liveRes[0] : (liveRes || {});
        const totalToday = Number(liveData?.stats?.total_tickets || 0);
        const activeSvcCount = Array.isArray(liveData?.services) ? liveData.services.length : 0;
        const summaryMsg = `Overview ready · ${totalToday.toLocaleString()} ticket${totalToday === 1 ? '' : 's'} & ${activeSvcCount} active service${activeSvcCount === 1 ? '' : 's'} loaded`;
        $('#overview-loading-text').text(summaryMsg);
        $('#overview-sync-status').text(`${totalToday.toLocaleString()} tickets today`);
        $banner.removeClass('is-loading').addClass('loaded');
    });
}

function renderPeriodOverview(data) {
    overviewPeriodData = data || {};
    ['day', 'week', 'month'].forEach(period => {
        const details = overviewPeriodData[period] || {};
        const summary = details.summary || {};
        const trend = normalizePeriodTrend(details, period);
        details.trend = trend;
        const prefix = `#period-${period}`;
        const range = period === 'day'
            ? formatPeriodDate(details.end)
            : `${formatPeriodDate(details.start)} – ${formatPeriodDate(details.end)}`;

        $(`${prefix}-range`).text(range);
        $(`${prefix}-total`).text(trend.reduce((sum, row) => sum + Number(row.total || 0), 0).toLocaleString());
        $(`${prefix}-completed`).text(trend.reduce((sum, row) => sum + Number(row.completed || 0), 0).toLocaleString());
        $(`${prefix}-not-completed`).text(trend.reduce((sum, row) => sum + Number(row.not_completed || 0), 0).toLocaleString());
        $(`${prefix}-priority`).text(`${Math.round(Number(summary.avg_service_minutes || 0))}m`);
        $(`${prefix}-wait`).text(`${Math.round(Number(summary.avg_wait_minutes || 0))}m`);
        createPeriodMiniChart(period, trend);
    });
    renderSelectedPeriodTrend();
}

function normalizePeriodTrend(details, period) {
    const sourceRows = Array.isArray(details?.trend) ? details.trend : [];
    const rowsByLabel = new Map(sourceRows.map(row => [String(row.label), row]));
    const emptyRow = label => ({ label, total: 0, completed: 0, not_completed: 0, priority: 0, avg_wait_minutes: 0 });

    if (period === 'day') {
        return Array.from({ length: 48 }, (_, index) => {
            const label = `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`;
            return { ...emptyRow(label), ...(rowsByLabel.get(label) || {}) };
        });
    }

    const start = new Date(`${details.start}T00:00:00`);
    const end = new Date(`${details.end}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return sourceRows;

    const rows = [];
    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const label = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        rows.push({ ...emptyRow(label), ...(rowsByLabel.get(label) || {}) });
    }
    return rows;
}

function formatPeriodDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatPeriodTrendLabel(value, period) {
    if (period === 'day') return formatAnalyticsTime(value);
    return formatPeriodDate(value);
}

function createPeriodMiniChart(period, rows) {
    const canvasId = `period${period.charAt(0).toUpperCase() + period.slice(1)}Chart`;
    const ctx = getCanvas(canvasId);
    if (!ctx) return;
    const key = `period_${period}`;
    const theme = getAdminChartTheme();
    const colors = { day: theme.palette[0], week: theme.palette[1], month: theme.palette[3] };
    const color = colors[period];
    if (charts[key]) charts[key].destroy();

    const pointRadius = rows.length <= 1 ? 4 : 1.5;
    const metricLine = (label, field, lineColor, fill = false) => ({
        label,
        data: rows.map(row => Number(row[field] || 0)),
        borderColor: lineColor,
        backgroundColor: fill ? `${lineColor}24` : 'transparent',
        borderWidth: field === 'total' ? 2 : 1.5,
        fill,
        tension: .38,
        pointRadius,
        pointHoverRadius: 4,
        pointHitRadius: 8
    });

    charts[key] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rows.map(row => formatPeriodTrendLabel(row.label, period)),
            datasets: [
                metricLine('Tickets', 'total', color, true),
                metricLine('Completed', 'completed', theme.palette[1]),
                metricLine('Priority', 'priority', theme.palette[2])
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: true, mode: 'nearest' },
            plugins: { legend: { display: false }, tooltip: { displayColors: true, intersect: true, mode: 'nearest' } },
            scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true }
            }
        }
    });
}

function renderSelectedPeriodTrend() {
    const details = overviewPeriodData?.[currentTrendView];
    if (!details) return;
    const titles = {
        day: 'Current Day Ticket Volume',
        week: 'Current Week Ticket Volume',
        month: 'Current Month Ticket Volume'
    };
    $('#trendTitle').text(titles[currentTrendView]);
    createOverviewPeriodTrend(details.trend || [], currentTrendView);
}

function createOverviewPeriodTrend(rows, period) {
    const ctx = getCanvas('hourlyChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();
    if (charts.hourly) charts.hourly.destroy();

    const totalGrad = ctx.createLinearGradient(0, 0, 0, 180);
    totalGrad.addColorStop(0, theme.dark ? 'rgba(96, 165, 250, 0.22)' : 'rgba(59, 130, 246, 0.16)');
    totalGrad.addColorStop(1, theme.dark ? 'rgba(96, 165, 250, 0.00)' : 'rgba(59, 130, 246, 0.00)');

    const line = (label, field, color, axis = 'y', fill = false) => ({
        label,
        data: rows.map(row => Number(row[field] || 0)),
        borderColor: color,
        backgroundColor: fill ? totalGrad : 'transparent',
        borderWidth: field === 'total' ? 1.8 : 1.4,
        fill,
        tension: 0.32,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHitRadius: 8,
        yAxisID: axis
    });

    charts.hourly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: rows.map(row => formatPeriodTrendLabel(row.label, period)),
            datasets: [
                line('Tickets', 'total', theme.palette[0], 'y', true),
                line('Completed', 'completed', theme.palette[1]),
                line('Priority', 'priority', theme.palette[2]),
                line('Avg wait (min)', 'avg_wait_minutes', theme.palette[3], 'yWait')
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: theme.muted,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 6,
                        boxHeight: 6,
                        padding: 10,
                        font: { size: 10, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: { top: 6, bottom: 6, left: 10, right: 10 },
                    cornerRadius: 8,
                    usePointStyle: true,
                    titleFont: { size: 11, weight: '700' },
                    bodyFont: { size: 10.5 }
                }
            },
            scales: {
                x: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: theme.muted, font: { size: 9 }, maxTicksLimit: 9 }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: theme.grid },
                    ticks: { color: theme.muted, font: { size: 9 }, precision: 0 }
                },
                yWait: {
                    beginAtZero: true,
                    position: 'right',
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: theme.palette[3], font: { size: 9 }, precision: 0 }
                }
            }
        }
    });
}

function renderOperationalInsights(data) {
    const summary = data?.summary || {};
    const total = Number(summary.total_tickets || 0);
    const completed = Number(summary.completed_tickets || 0);
    const priority = Number(summary.priority_tickets || 0);
    const waiting = Number(summary.waiting_tickets || 0);
    const activeServices = Number(summary.active_services || 0);
    const averageWait = Number(summary.avg_wait_minutes || 0);
    const averageService = Number(summary.avg_service_minutes || 0);
    const previous = Number(summary.previous_day_tickets || 0);
    const completionRate = total ? (completed / total) * 100 : 0;
    const priorityShare = total ? (priority / total) * 100 : 0;
    const change = previous ? ((total - previous) / previous) * 100 : (total ? 100 : 0);
    const peak = data?.peak_window;
    const busiest = data?.busiest_service;

    $('#insight-completion').text(`${completionRate.toFixed(1)}%`);
    $('#insight-completion-note').text(`${completed} of ${total} tickets finished`);
    $('#insight-priority').text(`${priorityShare.toFixed(1)}%`);
    $('#insight-priority-note').text(`${priority} priority ticket${priority === 1 ? '' : 's'} today`);
    $('#insight-peak').text(peak?.time_block ? formatAnalyticsTime(peak.time_block) : '—');
    $('#insight-peak-note').text(peak ? `${peak.ticket_count} arrivals in this window` : 'No arrivals recorded yet');
    $('#insight-service').text(busiest?.service_name || '—');
    $('#insight-service-note').text(busiest ? `${busiest.ticket_count} tickets today` : 'No service activity yet');
    $('#insight-change').text(`${change > 0 ? '+' : ''}${change.toFixed(1)}%`).toggleClass('negative', change < 0);
    $('#insight-change-note').text(`${total} today versus ${previous} yesterday`);
    $('#insight-avg-wait').text(`${Math.round(averageWait)}m`);
    $('#insight-avg-wait-note').text(averageWait > 0 ? 'Average time before service' : 'No called tickets yet');
    $('#insight-avg-service').text(`${Math.round(averageService)}m`);
    $('#insight-avg-service-note').text(averageService > 0 ? 'Average completed handling time' : 'No completed handling data');
    $('#insight-open-queue').text(waiting.toLocaleString());
    $('#insight-open-queue-note').text(`${activeServices} active service${activeServices === 1 ? '' : 's'} today`);
}

function formatAnalyticsTime(value) {
    const [hourText, minute = '00'] = String(value).split(':');
    const hour = Number(hourText);
    if (!Number.isFinite(hour)) return value;
    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function createServiceChart(data) {
    const ctx = getCanvas('serviceChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();
    const rows = Array.isArray(data) ? data : [];

    if (charts.sname) charts.sname.destroy();

    const totalCount = rows.reduce((sum, d) => sum + Number(d.count || 0), 0);

    charts.sname = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: rows.map(d => d.sname),
            datasets: [{
                data: rows.map(d => d.count),
                backgroundColor: rows.map((_, index) => theme.palette[index % theme.palette.length]),
                borderColor: theme.dark ? '#0f172a' : '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 2,
                hoverOffset: 4,
                spacing: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '58%',
            layout: { padding: 2 },
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: theme.text,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8, boxHeight: 8, padding: 10, font: { size: 11, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: { top: 5, bottom: 5, left: 8, right: 8 },
                    cornerRadius: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const val = Number(context.raw || 0);
                            const pct = totalCount > 0 ? ((val / totalCount) * 100).toFixed(1) : '0.0';
                            return ` ${context.label}: ${val} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createStatusChart(data) {
    const ctx = getCanvas('statusChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();
    const rows = Array.isArray(data) ? data : [];

    if (charts.status) {
        charts.status.destroy();
        charts.status = null;
    }

    const statusColors = {
        'waiting': '#fbbf24',
        'calling': '#3b82f6',
        'completed': '#10b981',
        'held': '#8b5cf6',
        'forwarded': '#ec4899',
        'voided': '#ef4444'
    };

    charts.status = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rows.map(d => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
            datasets: [{
                label: 'Tickets',
                data: rows.map(d => d.count),
                backgroundColor: rows.map((d, i) =>
                    statusColors[d.status.toLowerCase()] || 
                    theme.palette[i % theme.palette.length]
                ),
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 14, maxBarThickness: 18
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: { top: 5, bottom: 5, left: 8, right: 8 },
                    cornerRadius: 6,
                    displayColors: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: theme.grid, drawTicks: false },
                    ticks: {
                        stepSize: 1,
                        color: theme.muted,
                        font: { size: 9 },
                        padding: 4
                    }
                },
                y: {
                    border: { display: false },
                    ticks: { color: theme.text, font: { size: 11, weight: '600' }, padding: 4 },
                    grid: { display: false }
                }
            }
        }
    });
}

function createHourlyChart(data) {
    const ctx = getCanvas('hourlyChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();
    const rows = Array.isArray(data) ? data : [];

    if (charts.hourly) charts.hourly.destroy();

    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2).toString().padStart(2, '0');
        return `${hour}:${i % 2 ? '30' : '00'}`;
    });
    const timeLabels = timeSlots.map(formatAnalyticsTime);

    // Identify all unique services in the hourly data
    const serviceNames = [...new Set(rows.map(d => d.sname || 'General'))];

    const datasets = serviceNames.map((svc, idx) => {
        const color = theme.palette[idx % theme.palette.length];
        return {
            label: svc,
            data: timeSlots.map(slot => {
                const [hour, minute] = slot.split(':');
                const hourData = rows.filter(d => d.hour === hour && String(d.minute_block || '00') === minute && (d.sname || 'General') === svc);
                return hourData.reduce((sum, d) => sum + d.count, 0);
            }),
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 1.8,
            fill: serviceNames.length === 1,
            tension: 0.36,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHitRadius: 12,
            pointBackgroundColor: color,
            pointBorderColor: theme.dark ? '#152238' : '#ffffff',
            pointBorderWidth: 2
        };
    });

    charts.hourly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { color: theme.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, font: { size: 11, weight: '600' } }
                },
                tooltip: {
                    mode: 'nearest',
                    intersect: true,
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    usePointStyle: true
                }
            },
            scales: {
                x: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: theme.text, maxTicksLimit: 12, font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: theme.grid },
                    ticks: {
                        stepSize: 1,
                        color: theme.text,
                        padding: 8
                    }
                }
            }
        }
    });
}

function createMonthlyChart(data) {
    const ctx = getCanvas('hourlyChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();
    const rows = Array.isArray(data) ? data : [];
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const services = [...new Set(rows.map(row => row.sname || 'General'))];

    if (charts.hourly) charts.hourly.destroy();

    const datasets = services.map((service, index) => {
        const color = theme.palette[index % theme.palette.length];
        return {
            label: service,
            data: labels.map((_, monthIndex) => rows
                .filter(row => Number(row.month) === monthIndex + 1 && (row.sname || 'General') === service)
                .reduce((sum, row) => sum + Number(row.count || 0), 0)),
            borderColor: color,
            backgroundColor: `${color}20`,
            borderWidth: 2.5,
            tension: 0.36,
            fill: services.length === 1,
            pointRadius: 2,
            pointHoverRadius: 5
        };
    });

    charts.hourly = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: buildAnalyticsLineOptions(theme, 12)
    });
}

function createLiveTicketFlowChart(rows) {
    const context = getCanvas('liveTicketFlowChart');
    if (!context) return;
    const theme = getAdminChartTheme();
    const slots = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
    const totals = slots.map(slot => rows.filter(row => row.time_block === slot).reduce((sum, row) => sum + Number(row.count || 0), 0));
    const gradient = context.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, theme.dark ? 'rgba(110,140,255,.38)' : 'rgba(79,109,245,.32)');
    gradient.addColorStop(1, 'rgba(79,109,245,0)');

    if (charts.liveTickets) charts.liveTickets.destroy();
    $('#market-ticket-total').text(totals.reduce((sum, count) => sum + count, 0));

    charts.liveTickets = new Chart(context, {
        type: 'line',
        data: {
            labels: slots.map(formatAnalyticsTime),
            datasets: [{
                label: 'Ticket arrivals',
                data: totals,
                borderColor: theme.palette[0],
                backgroundColor: gradient,
                borderWidth: 2.5,
                tension: 0.28,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 12
            }]
        },
        options: buildMarketChartOptions(theme)
    });
}

function createLiveTellerFlowChart(rows) {
    const context = getCanvas('liveTellerFlowChart');
    if (!context) return;
    const theme = getAdminChartTheme();
    const slots = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
    const tellers = [...new Set(rows.map(row => row.teller_name || 'Unassigned'))];
    const datasets = tellers.map((teller, index) => {
        const color = theme.palette[(index + 1) % theme.palette.length];
        return {
            label: teller,
            data: slots.map(slot => rows
                .filter(row => row.time_block === slot && (row.teller_name || 'Unassigned') === teller)
                .reduce((sum, row) => sum + Number(row.count || 0), 0)),
            borderColor: color,
            backgroundColor: `${color}16`,
            borderWidth: 2,
            tension: 0.28,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 10
        };
    });

    if (charts.liveTellers) charts.liveTellers.destroy();
    $('#market-served-total').text(rows.reduce((sum, row) => sum + Number(row.count || 0), 0));

    charts.liveTellers = new Chart(context, {
        type: 'line',
        data: { labels: slots.map(formatAnalyticsTime), datasets },
        options: buildMarketChartOptions(theme)
    });
}

function buildMarketChartOptions(theme) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    color: theme.muted,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    boxWidth: 6,
                    boxHeight: 6,
                    padding: 10,
                    font: { size: 9.5, weight: '600' }
                }
            },
            tooltip: {
                backgroundColor: theme.tooltipBackground,
                titleColor: theme.heading,
                bodyColor: theme.text,
                borderColor: theme.tooltipBorder,
                borderWidth: 1,
                padding: { top: 6, bottom: 6, left: 10, right: 10 },
                cornerRadius: 8,
                usePointStyle: true
            }
        },
        scales: {
            x: {
                border: { display: false },
                grid: { display: false },
                ticks: { color: theme.muted, maxTicksLimit: 10, font: { size: 9 } }
            },
            y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: theme.grid },
                ticks: { color: theme.muted, precision: 0, font: { size: 9 }, padding: 6 }
            }
        }
    };
}

function buildAnalyticsLineOptions(theme, maxTicks = 14) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
            legend: { position: 'bottom', labels: { color: theme.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, font: { size: 11, weight: '600' } } },
            tooltip: { mode: 'nearest', intersect: true, backgroundColor: theme.tooltipBackground, titleColor: theme.heading, bodyColor: theme.text, borderColor: theme.tooltipBorder, borderWidth: 1, padding: 12, usePointStyle: true }
        },
        scales: {
            x: { border: { display: false }, grid: { display: false }, ticks: { color: theme.text, maxTicksLimit: maxTicks, font: { size: 10 } } },
            y: { beginAtZero: true, border: { display: false }, grid: { color: theme.grid }, ticks: { color: theme.text, precision: 0, stepSize: 1, padding: 8 } }
        }
    };
}
function createDailyChart(data) {
    const ctx = getCanvas('hourlyChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();
    const rows = Array.isArray(data) ? data : [];

    if (charts.hourly) {
        charts.hourly.destroy();
    }

    const now = new Date();

    const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
    ).getDate();

    const dayLabels = Array.from(
        { length: daysInMonth },
        (_, i) => (i + 1).toString()
    );

    const serviceNames = [
        ...new Set(rows.map(d => d.sname || 'General'))
    ];

    const datasets = serviceNames.map((svc, idx) => {
        const color = theme.palette[idx % theme.palette.length];

        return {
            label: svc,
            data: dayLabels.map(day => {
                const row = rows.filter(
                    d =>
                        Number(d.day) === Number(day) &&
                        (d.sname || 'General') === svc
                );

                return row.reduce(
                    (sum, r) => sum + Number(r.count),
                    0
                );
            }),
            borderColor: color,
            backgroundColor: color + '20',
            borderWidth: 2.5,
            tension: 0.36,
            fill: serviceNames.length === 1,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHitRadius: 12
        };
    });

    charts.hourly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: theme.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, font: { size: 11, weight: '600' } }
                },
                tooltip: {
                    mode: 'nearest',
                    intersect: true,
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    usePointStyle: true
                }
            },
            scales: {
                x: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: theme.text, maxTicksLimit: 16, font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: theme.grid },
                    ticks: {
                        stepSize: 1,
                        color: theme.text,
                        padding: 8
                    }
                }
            }
        }
    });
}

function getCanvas(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (el.offsetParent === null) return null; // hidden
    return el.getContext('2d');
}


// & Counter Throughput & Velocity Chart (Below Current Day Ticket Volume)
function createCounterVelocityChart(tellers, avgServiceTime) {
    const ctx = getCanvas('counterVelocityChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();

    if (charts.counterVelocity) {
        charts.counterVelocity.destroy();
        charts.counterVelocity = null;
    }

    const tellerList = Array.isArray(tellers) ? tellers : [];
    const activeTellers = tellerList.filter(t => (Number(t.served_today || 0) > 0 || t.status_code === 'busy' || Boolean(t.serving_ticket)));
    const displayList = activeTellers.length > 0 ? activeTellers : tellerList.slice(0, 6);

    let labels = [];
    let data = [];
    let backgroundColors = [];
    let avgTimes = [];
    let statuses = [];

    if (displayList.length > 0) {
        $('#counterChartTitle').text('Counter Throughput & Velocity');
        const sorted = [...displayList].sort((a, b) => {
            const aBusy = (a.status_code === 'busy' || Boolean(a.serving_ticket)) ? 1 : 0;
            const bBusy = (b.status_code === 'busy' || Boolean(b.serving_ticket)) ? 1 : 0;
            if (bBusy !== aBusy) return bBusy - aBusy;
            return Number(b.served_today || 0) - Number(a.served_today || 0);
        });

        labels = sorted.map(t => {
            const isServing = (t.status_code === 'busy' || Boolean(t.serving_ticket));
            return isServing ? ('● ' + (t.cname || ('Counter ' + t.cnum))) : (t.cname || ('Counter ' + t.cnum));
        });
        data = sorted.map(t => Number(t.served_today || 0));
        avgTimes = sorted.map(t => t.avg_service_time ? Math.round(t.avg_service_time) + 'm' : '—');
        statuses = sorted.map(t => t.status || (t.status_code === 'busy' ? 'Serving' : 'Idle'));
        backgroundColors = sorted.map(t => {
            if (t.status_code === 'busy' || Boolean(t.serving_ticket)) return theme.palette[1]; // Vibrant Emerald
            if (Number(t.served_today || 0) > 0) return theme.palette[0]; // Navy / Blue
            return theme.muted + '44';
        });
    } else if (Array.isArray(avgServiceTime) && avgServiceTime.length > 0) {
        $('#counterChartTitle').text('Department Handling Speed (Minutes)');
        labels = avgServiceTime.map(s => s.sname || 'General');
        data = avgServiceTime.map(s => Math.round(Number(s.avg_minutes || 0) * 10) / 10);
        avgTimes = data.map(d => d + 'm');
        statuses = labels.map(() => 'Avg Handling Duration');
        backgroundColors = labels.map((_, i) => theme.palette[i % theme.palette.length]);
    } else {
        $('#counterChartTitle').text('Counter Throughput & Velocity');
        labels = ['Awaiting counter activity'];
        data = [0];
        backgroundColors = [theme.muted + '40'];
    }

    charts.counterVelocity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets Served',
                data: data,
                backgroundColor: backgroundColors,
                borderRadius: 4,
                borderSkipped: false,
                barThickness: 14, maxBarThickness: 18
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: { top: 6, bottom: 6, left: 10, right: 10 },
                    cornerRadius: 6,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            const idx = context.dataIndex;
                            const val = context.raw || 0;
                            const avg = avgTimes[idx] || '—';
                            const st = statuses[idx] || '';
                            return ' Served: ' + val + ' tickets | Handling: ' + avg + ' | ' + st;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: theme.grid, drawTicks: false },
                    ticks: {
                        stepSize: 1,
                        color: theme.muted,
                        font: { size: 9 },
                        precision: 0
                    }
                },
                y: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: theme.text, font: { size: 11, weight: '600' },
                        padding: 4
                    }
                }
            }
        }
    });
}
