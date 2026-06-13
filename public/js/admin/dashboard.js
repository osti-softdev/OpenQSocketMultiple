// Dashboard Module for Admin Panel
let currentTrendView = 'hourly';

$(document).on('click', '#hourlyBtn', function () {
    $('#dailyBtn').removeClass('active');
    $(this).addClass('active');
    $('#trendTitle').text('Ticket Trends (Today)');
    currentTrendView = 'hourly';

    $.get('/api/admin/analytics/hourly', function(data) {
        createHourlyChart(data);
    });
});

$(document).on('click', '#dailyBtn', function () {
    $('#hourlyBtn').removeClass('active');
    $(this).addClass('active');
    $('#trendTitle').text('Ticket Trends (Current Month)');
    currentTrendView = 'daily';

    $.get('/api/admin/analytics/daily', function(data) {
        createDailyChart(data);
    });
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

    // 4. Historical Charts (Refresh less often? For now, refresh with dashboard)
    $.get('/api/admin/analytics/overview', function(stats) {
        createServiceChart(stats.byService);
        createStatusChart(stats.byStatus);
    });
    
    if (currentTrendView === 'hourly') {
    $.get('/api/admin/analytics/hourly', function(data) {
        createHourlyChart(data);
    });
    } else {
        $.get('/api/admin/analytics/daily', function(data) {
            createDailyChart(data);
        });
    }
}

function createServiceChart(data) {
    const ctx = getCanvas('serviceChart');
    if (!ctx) return;
    
    if (charts.sname) charts.sname.destroy();
    
    charts.sname = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(d => d.sname),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: [
                    '#667eea', '#764ba2', '#f093fb', '#4facfe',
                    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function createStatusChart(data) {
    const ctx = getCanvas('statusChart');
    if (!ctx) return;

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

    const palette = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#858796', '#5a5c69', '#6610f2', '#e83e8c', '#fd7e14'
    ];

    charts.status = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d =>
                d.status.charAt(0).toUpperCase() + d.status.slice(1)
            ),
            datasets: [{
                label: 'Total Tickets',
                data: data.map(d => d.count),
                backgroundColor: data.map((d, i) =>
                    statusColors[d.status.toLowerCase()] || 
                    palette[i % palette.length]
                ),
                borderRadius: 6,
                barThickness: 20
            }]
        },
        options: {
            indexAxis: 'y',   // Horizontal bars
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
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

    if (charts.hourly) charts.hourly.destroy();

    const hourSlots = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const hourLabels = hourSlots.map(h => h + ':00');

    // Identify all unique services in the hourly data
    const serviceNames = [...new Set(data.map(d => d.sname || 'General'))];
    
    const palette = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#6610f2', '#fd7e14', '#e83e8c', '#20c997', '#858796'
    ];

    const datasets = serviceNames.map((svc, idx) => {
        const color = palette[idx % palette.length];
        return {
            label: svc,
            data: hourSlots.map(h => {
                const hourData = data.filter(d => d.hour === h && (d.sname || 'General') === svc);
                return hourData.reduce((sum, d) => sum + d.count, 0);
            }),
            borderColor: color,
            backgroundColor: color + '1a', // Light transparent fill
            borderWidth: 2,
            fill: serviceNames.length === 1, // Only fill if it's a single series
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: color
        };
    });

    charts.hourly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hourLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}
function createDailyChart(data) {
    const ctx = getCanvas('hourlyChart');
    if (!ctx) return;

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
        ...new Set(data.map(d => d.sname || 'General'))
    ];

    const palette = [
        '#4e73df',
        '#1cc88a',
        '#36b9cc',
        '#f6c23e',
        '#e74a3b',
        '#6610f2',
        '#fd7e14',
        '#e83e8c',
        '#20c997',
        '#858796'
    ];

    const datasets = serviceNames.map((svc, idx) => {
        const color = palette[idx % palette.length];

        return {
            label: svc,
            data: dayLabels.map(day => {
                const row = data.filter(
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
            backgroundColor: color + '1a',
            borderWidth: 2,
            tension: 0.4,
            fill: serviceNames.length === 1,
            pointRadius: 4
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
                title: {
                    display: true,
                    text: 'Current Month Ticket Trend'
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Day of Month'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
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
