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
    // Show loading state if needed, or just silent update
    const now = new Date();
    $('#last-updated').text(now.toLocaleTimeString());

    $.get('/api/admin/dashboard/live', function(data) {
        // 1. Stats Cards
        if (data.stats) {
            $('#live-total').text(data.stats.total_tickets || 0);
            $('#live-queue').text(data.stats.queue_length || 0);
            $('#live-served').text(data.stats.queue_served || 0);
            $('#live-avgserving').text(data.stats.avg_service_time ? Math.round(data.stats.avg_service_time) + 'm' : '0m');
            const turnaround = data.stats.avg_turnaround ? Math.round(data.stats.avg_turnaround) + 'm' : '0m';
            $('#live-turnaround').text(turnaround);
            $('#live-avgwaiting').text(data.stats.avg_wait_time ? Math.round(data.stats.avg_wait_time) + 'm' : '0m');
        }

        // 2. Service Live Board
        const $serviceGrid = $('#service-live-grid tbody').empty();

        if (data.services && data.services.length > 0) {

            data.services.sort((a, b) => b.waiting_count - a.waiting_count);

            data.services.forEach(s => {

                let statusClass = 'status-ok';
                let statusText = 'Idle';
                let indicatorClass = 'idle';

                if (s.serving_count > 0) {
                    if (s.waiting_count > 10) {
                        statusClass = 'status-critical';
                        statusText = 'Queueing / Serving';
                        indicatorClass = 'queueing';
                    }
                    else if (s.waiting_count > 5) {
                        statusClass = 'status-busy';
                        statusText = 'Busy / Serving';
                        indicatorClass = 'busy';
                    }
                    else {
                        statusClass = 'status-ok';
                        statusText = 'Serving';
                        indicatorClass = 'serving';
                    }
                } else if (s.waiting_count > 0) {
                    if (s.waiting_count > 10) {
                        statusClass = 'status-critical';
                        statusText = 'Queueing (Idle)';
                        indicatorClass = 'queueing';
                    }
                    else if (s.waiting_count > 5) {
                        statusClass = 'status-busy';
                        statusText = 'Busy (Idle)';
                        indicatorClass = 'busy';
                    }
                    else {
                        statusClass = 'status-ok';
                        statusText = 'Waiting (Idle)';
                        indicatorClass = 'idle';
                    }
                } else {
                    statusClass = 'status-ok';
                    statusText = 'Idle';
                    indicatorClass = 'idle';
                }

                $serviceGrid.append(`
                    <tr class="${statusClass}">
                        <td><strong>${s.shortSname}</strong></td>
                        <td>
                            <span class="status-indicator ${indicatorClass}">
                                ${statusText}
                            </span>
                        </td>
                        <td>${s.waiting_count || 0}</td>
                        <td>${s.serving_count || 0}</td>
                        <td>${s.completed_count || 0}</td>
                        <td>
                            ${s.avg_wait_time
                                ? Math.round(s.avg_wait_time) + ' min'
                                : '-'}
                        </td>
                    </tr>
                `);

            });

        } else {

            $serviceGrid.html(`
                <tr>
                    <td colspan="6" style="text-align:center">
                        No active services found.
                    </td>
                </tr>
            `);

        }

        // 3. Teller Live List
        const $tellerList = $('#teller-live-list').empty();
        if (data.tellers && data.tellers.length > 0) {
            // console.log(data.tellers)
            data.tellers.forEach(t => {
                const statusClass = t.status_code === 'busy' ? 'busy' : 'idle';
                $tellerList.append(`
                    <tr>
                        <td><strong>${t.cname}</strong></td>
                        <td>Counter ${t.cnum}</td>
                        <td><span class="status-indicator ${statusClass}">${t.status}</span></td>
                        <td>${t.served_today || 0}</td>
                        <td>${t.avg_service_time ? Math.round(t.avg_service_time) + ' min' : '-'}</td>
                        <td>${t.avg_turnaround_time ? Math.round(t.avg_turnaround_time) + ' min' : '-'}</td>
                    </tr>
                `);
            });
        } else {
            $tellerList.append('<tr><td colspan="6" style="text-align:center">No tellers online</td></tr>');
        }
    });

    $.get('/api/admin/analytics/insights', renderOperationalInsights);

    $.get('/api/admin/analytics/live-flow', function (data) {
        createLiveTicketFlowChart(data.tickets || []);
        createLiveTellerFlowChart(data.tellers || []);
    });

    // 4. Historical Charts (Refresh less often? For now, refresh with dashboard)
    $.get('/api/admin/analytics/overview', function(stats) {
        createServiceChart(stats.byService);
        createStatusChart(stats.byStatus);
    });

    $.get('/api/admin/analytics/period-overview', renderPeriodOverview);
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

    const line = (label, field, color, axis = 'y', fill = false) => ({
        label,
        data: rows.map(row => Number(row[field] || 0)),
        borderColor: color,
        backgroundColor: fill ? `${color}20` : 'transparent',
        borderWidth: field === 'total' ? 2.5 : 2,
        fill,
        tension: .35,
        pointRadius: rows.length > 12 ? 0 : 3,
        pointHoverRadius: 5,
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
            interaction: { mode: 'nearest', intersect: true },
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: theme.text, usePointStyle: true, boxWidth: 8, padding: 12, font: { size: 9, weight: '600' } } },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    displayColors: true,
                    mode: 'nearest',
                    intersect: true
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: theme.text, maxTicksLimit: 9 } },
                y: { beginAtZero: true, grid: { color: theme.grid }, ticks: { color: theme.text, precision: 0 } },
                yWait: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: theme.palette[3], precision: 0 } }
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

    charts.sname = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: rows.map(d => d.sname),
            datasets: [{
                data: rows.map(d => d.count),
                backgroundColor: rows.map((_, index) => theme.palette[index % theme.palette.length]),
                borderColor: theme.dark ? '#152238' : '#ffffff',
                borderWidth: 4,
                hoverBorderWidth: 4,
                hoverOffset: 7,
                spacing: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            layout: { padding: 4 },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: theme.text,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 16,
                        font: { size: 11, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
                    usePointStyle: true
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
            labels: rows.map(d =>
                d.status.charAt(0).toUpperCase() + d.status.slice(1)
            ),
            datasets: [{
                label: 'Total Tickets',
                data: rows.map(d => d.count),
                backgroundColor: rows.map((d, i) =>
                    statusColors[d.status.toLowerCase()] || 
                    theme.palette[i % theme.palette.length]
                ),
                borderRadius: 9,
                borderSkipped: false,
                barThickness: 16
            }]
        },
        options: {
            indexAxis: 'y',   // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    titleColor: theme.heading,
                    bodyColor: theme.text,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: 12,
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
                        color: theme.text,
                        padding: 8
                    }
                },
                y: {
                    border: { display: false },
                    ticks: { color: theme.text, font: { size: 11, weight: '600' } },
                    grid: {
                        display: false
                    }
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
            borderWidth: 2.5,
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
    const gradient = context.createLinearGradient(0, 0, 0, 300);
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
        animation: { duration: 450 },
        interaction: { mode: 'nearest', intersect: true },
        plugins: {
            legend: { position: 'bottom', labels: { color: theme.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 14, font: { size: 10, weight: '600' } } },
            tooltip: { mode: 'nearest', intersect: true, backgroundColor: theme.tooltipBackground, titleColor: theme.heading, bodyColor: theme.text, borderColor: theme.tooltipBorder, borderWidth: 1, padding: 12, usePointStyle: true }
        },
        scales: {
            x: { border: { display: false }, grid: { display: false }, ticks: { color: theme.text, maxTicksLimit: 12, font: { size: 9 } } },
            y: { beginAtZero: true, border: { display: false }, grid: { color: theme.grid }, ticks: { color: theme.text, precision: 0, stepSize: 1, padding: 8 } }
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
