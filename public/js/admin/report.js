// Reports Module for Admin Panel
let currentReportData = null;
let reportCharts = {};

// Initialize report page (called when tab is switched)
function initializeReportPage() {
    // Set default dates (today and 7 days ago)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    $('#report-date-from').val(formatDateForInput(sevenDaysAgo));
    $('#report-date-to').val(formatDateForInput(today));

    // Attach event listeners using event delegation
    $(document).off('click', '#generate-report-btn').on('click', '#generate-report-btn', generateReport);
    $(document).off('click', '#export-pdf-btn').on('click', '#export-pdf-btn', exportReportAsPDF);
    $(document).off('click', '#export-excel-btn').on('click', '#export-excel-btn', exportReportAsExcel);
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display
function formatDateForDisplay(date) {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

// Format minutes to readable time
function formatTime(minutes) {
    if (!minutes || minutes === null) return 'N/A';
    const mins = Math.round(minutes);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
}

// Generate report
function generateReport() {
    const dateFrom = $('#report-date-from').val();
    const dateTo = $('#report-date-to').val();

    if (!dateFrom || !dateTo) {
        Swal.fire('Error', 'Please select both From and To dates', 'error');
        return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
        Swal.fire('Error', 'From date cannot be after To date', 'error');
        return;
    }

    // Show loading
    Swal.fire({
        title: 'Generating Report...',
        html: '<p>Please wait while we compile your report</p>',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    });

    $.ajax({
        url: '/api/admin/reports/data',
        method: 'GET',
        data: { dateFrom, dateTo },
        dataType: 'json',
        success: function (data) {
            currentReportData = { ...data, dateFrom, dateTo };
            displayReportData(data);

            // Enable export buttons
            $('#export-pdf-btn').prop('disabled', false);
            $('#export-excel-btn').prop('disabled', false);

            Swal.close();
        },
        error: function (xhr) {
            console.error('❌ API Error:', xhr);
            Swal.fire('Error', 'Failed to generate report: ' + (xhr.responseJSON?.error || xhr.statusText), 'error');
        }
    });
}

// Display report data on the page
function displayReportData(data) {

    // Display Summary
    const summary = data.summary || {};
    $('#summary-total').text(summary.total_tickets || 0);
    $('#summary-completed').text(summary.completed_tickets || 0);
    $('#summary-voided').text(summary.voided_tickets || 0);
    $('#summary-avg-service').text(formatTime(summary.avg_service_time_minutes));
    $('#summary-avg-turnaround').text(formatTime(summary.avg_turnaround_time_minutes));

    // Display By Service
    displayByService(data.byService || []);

    // Display By Teller
    displayByTeller(data.byTeller || []);

    // Display By Status
    displayByStatus(data.byStatus || [], summary.total_tickets || 0);

    // Display Daily Trends
    displayDailyTrends(data.dailyTrends || []);

    // Display Detailed Transactions
    displayDetailedTransactions(data.detailedTransactions || []);

    // Display Charts
    displayTrendChart(data.detailedTransactions || []);
    displayServiceDistribChart(data.detailedTransactions || []);
    displayReportServiceAnalytics(data);

}

function displayReportServiceAnalytics(data) {
    const hourlyLabels = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);
    const dailyLabels = [...new Set((data.serviceDaily || []).map(row => row.date))].sort();
    const monthlyLabels = [...new Set((data.serviceMonthly || []).map(row => row.month))].sort();

    createReportServiceLineChart('reportHourlyServiceChart', 'hourlyService', hourlyLabels, data.serviceHourly || [], {
        labelKey: row => `${String(Number(row.hour)).padStart(2, '0')}:00`,
        valueKey: 'ticket_count',
        maxTicks: 12
    });
    createReportServiceLineChart('reportDailyServiceChart', 'dailyService', dailyLabels, data.serviceDaily || [], {
        labelKey: row => row.date,
        valueKey: 'ticket_count',
        maxTicks: 10
    });
    createReportServiceLineChart('reportMonthlyServiceChart', 'monthlyService', monthlyLabels, data.serviceMonthly || [], {
        labelKey: row => row.month,
        valueKey: 'ticket_count',
        maxTicks: 12
    });
}

function createReportServiceLineChart(canvasId, chartKey, labels, rows, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const theme = getAdminChartTheme();
    const services = [...new Set(rows.map(row => row.service_name || 'General'))];

    if (reportCharts[chartKey]) reportCharts[chartKey].destroy();

    const datasets = services.map((service, index) => {
        const color = theme.palette[index % theme.palette.length];
        return {
            label: service,
            data: labels.map(label => rows
                .filter(row => config.labelKey(row) === label && (row.service_name || 'General') === service)
                .reduce((sum, row) => sum + Number(row[config.valueKey] || 0), 0)),
            borderColor: color,
            backgroundColor: `${color}14`,
            borderWidth: 1.8,
            tension: 0.3,
            fill: services.length === 1,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 8
        };
    });

    reportCharts[chartKey] = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                    ticks: { color: theme.muted, maxTicksLimit: config.maxTicks || 10, font: { size: 9 } }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    grid: { color: theme.grid },
                    ticks: { color: theme.muted, precision: 0, font: { size: 9 }, padding: 6 }
                }
            }
        }
    });
}

// Display Trend Chart — one line per service
function displayTrendChart(transactions) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();

    if (reportCharts.trendChart) {
        reportCharts.trendChart.destroy();
    }

    const intervalLabels = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            intervalLabels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }
    const numIntervals = intervalLabels.length;

    const serviceCounts = {};

    (transactions || [])
        .filter(tx => tx.status && ['finished', 'completed'].includes(tx.status.toLowerCase()))
        .forEach(tx => {
            const svc = tx.service_name || tx.service_code || 'Unknown';
            if (!serviceCounts[svc]) {
                serviceCounts[svc] = new Array(numIntervals).fill(0);
            }
            if (tx.time) {
                const parts = tx.time.split(':');
                if (parts.length >= 2) {
                    const h = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    if (!isNaN(h) && !isNaN(m)) {
                        const idx = (h * 2) + (m >= 30 ? 1 : 0);
                        if (idx >= 0 && idx < numIntervals) {
                            serviceCounts[svc][idx]++;
                        }
                    }
                }
            }
        });

    const serviceNames = Object.keys(serviceCounts);
    const datasets = serviceNames.map((svc, i) => {
        const color = theme.palette[i % theme.palette.length];
        return {
            label: svc,
            data: serviceCounts[svc],
            borderColor: color,
            backgroundColor: color + '14',
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHitRadius: 8,
            tension: 0.3,
            fill: false,
            borderWidth: 1.8
        };
    });

    const displayLabels = intervalLabels.map(t => {
        let [h, m] = t.split(':');
        h = parseInt(h, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    });

    reportCharts.trendChart = new Chart(ctx, {
        type: 'line',
        data: { labels: displayLabels, datasets },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: theme.muted, maxTicksLimit: 10, font: { size: 9 } }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    ticks: { color: theme.muted, precision: 0, font: { size: 9 }, padding: 6 },
                    grid: { color: theme.grid }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: theme.muted,
                        boxWidth: 6,
                        boxHeight: 6,
                        font: { size: 9.5, weight: '600' },
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    bodyColor: theme.text,
                    titleColor: theme.heading,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: { top: 6, bottom: 6, left: 10, right: 10 },
                    cornerRadius: 8,
                    usePointStyle: true
                }
            }
        }
    });
}

// Display Service Distribution Chart
function displayServiceDistribChart(transactions) {
    const ctx = document.getElementById('serviceDistribChart');
    if (!ctx) return;
    const theme = getAdminChartTheme();

    if (reportCharts.serviceDistribChart) {
        reportCharts.serviceDistribChart.destroy();
    }

    const finishedTx = (transactions || []).filter(tx => tx.status && (tx.status.toLowerCase() === 'finished' || tx.status.toLowerCase() === 'completed'));

    const serviceCounts = {};
    finishedTx.forEach(tx => {
        const srv = tx.service_name || tx.service_code || 'Unknown';
        serviceCounts[srv] = (serviceCounts[srv] || 0) + 1;
    });

    const labels = Object.keys(serviceCounts);
    const data = Object.values(serviceCounts);
    const totalFinished = data.reduce((sum, v) => sum + Number(v || 0), 0);

    const backgroundColors = labels.map((_, i) => theme.palette[i % theme.palette.length]);

    reportCharts.serviceDistribChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Finished Tickets',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: theme.dark ? '#0f172a' : '#ffffff',
                borderWidth: 2,
                hoverBorderWidth: 2,
                hoverOffset: 4,
                spacing: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            cutout: '58%',
            layout: { padding: 4 },
            plugins: {
                legend: {
                    display: true,
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
                            const pct = totalFinished > 0 ? ((val / totalFinished) * 100).toFixed(1) : '0.0';
                            return ` ${context.label}: ${val} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

const reportPagination = {
    service: { data: [], page: 1, limit: 10 },
    teller: { data: [], page: 1, limit: 10 },
    daily: { data: [], page: 1, limit: 10 }
};

function renderPaginatedTable(key, tbodySelector, renderRowFn) {
    const state = reportPagination[key];
    const tbody = $(tbodySelector);
    tbody.empty();
    
    $(`#pagination-${key}`).remove();

    if (!state.data || state.data.length === 0) {
        const colSpan = key === "daily" ? 5 : 6;
    tbody.append(`<tr><td colspan="${colSpan}" class="text-center" style="padding: 20px;">No data available</td></tr>`);
        return;
    }

    const totalPages = Math.ceil(state.data.length / state.limit);
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const start = (state.page - 1) * state.limit;
    const end = Math.min(start + state.limit, state.data.length);
    const pageData = state.data.slice(start, end);

    pageData.forEach(renderRowFn);

    if (totalPages > 1) {
        let paginationHtml = `<div id="pagination-${key}" class="pagination-controls" style="display:flex; justify-content:flex-end; gap:5px; margin-top:15px; padding-bottom: 10px; padding-right: 15px;">`;
        paginationHtml += `<button class="btn btn-sm ${state.page === 1 ? 'btn-secondary' : 'btn-primary'}" ${state.page === 1 ? 'disabled' : ''} onclick="changeReportPage('${key}', ${state.page - 1})" style="padding: 5px 10px; font-size: 12px; cursor: pointer; border-radius: 4px;">Prev</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= state.page - 2 && i <= state.page + 2)) {
                paginationHtml += `<button class="btn btn-sm ${i === state.page ? 'btn-primary' : 'btn-secondary'}" onclick="changeReportPage('${key}', ${i})" style="padding: 5px 10px; font-size: 12px; cursor: pointer; border-radius: 4px;">${i}</button>`;
            } else if (i === state.page - 3 || i === state.page + 3) {
                paginationHtml += `<span style="padding: 5px;">...</span>`;
            }
        }
        
        paginationHtml += `<button class="btn btn-sm ${state.page === totalPages ? 'btn-secondary' : 'btn-primary'}" ${state.page === totalPages ? 'disabled' : ''} onclick="changeReportPage('${key}', ${state.page + 1})" style="padding: 5px 10px; font-size: 12px; cursor: pointer; border-radius: 4px;">Next</button>`;
        paginationHtml += '</div>';

        tbody.closest('.table-containerrep').after(paginationHtml);
    }
}

window.changeReportPage = function(key, newPage) {
    reportPagination[key].page = newPage;
    if (key === 'service') displayByService();
    else if (key === 'teller') displayByTeller();
    else if (key === 'daily') displayDailyTrends();
};

// Display tickets by service
function displayByService(services) {
    if (services) {
        reportPagination.service.data = services;
        reportPagination.service.page = 1;
    }
    
    renderPaginatedTable('service', '#reports-by-service', service => {
        const row = `
            <tr>
                <td>${service.service_name || service.service_code || 'N/A'}</td>
                <td style="text-align: center;">${service.ticket_count || 0}</td>
                <td style="text-align: center;">${service.completed || 0}</td>
                <td style="text-align: center;">${service.voided || 0}</td>
                <td style="text-align: center;">${service.pending || 0}</td>
                <td style="text-align: center;">${formatTime(service.avg_service_time_minutes)}</td>
            </tr>
        `;
        $('#reports-by-service').append(row);
    });
}

// Display performance by teller
function displayByTeller(tellers) {
    if (tellers) {
        reportPagination.teller.data = tellers;
        reportPagination.teller.page = 1;
    }
    
    renderPaginatedTable('teller', '#reports-by-teller', teller => {
        const row = `
            <tr>
                <td>${teller.teller_name || 'N/A'}</td>
                <td style="text-align: center;">${teller.counter_number || 'N/A'}</td>
                <td style="text-align: center;">${teller.tickets_served || 0}</td>
                <td style="text-align: center;">${teller.completed || 0}</td>
                <td style="text-align: center;">${teller.voided || 0}</td>
                <td style="text-align: center;">${formatTime(teller.avg_service_time_minutes)}</td>
            </tr>
        `;
        $('#reports-by-teller').append(row);
    });
}

// Display tickets by status
function displayByStatus(statuses, total) {
    const tbody = $('#reports-by-status');
    tbody.empty();

    if (!statuses || statuses.length === 0) {
        console.warn('No status data to display');
        tbody.append('<tr><td colspan="3" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    statuses.forEach(status => {
        const percentage = total > 0 ? ((status.count / total) * 100).toFixed(1) : 0;
        const row = `
            <tr>
                <td><span class="status-badge status-${status.status}">${status.status.toUpperCase()}</span></td>
                <td style="text-align: center;">${status.count || 0}</td>
                <td style="text-align: center;">${percentage}%</td>
            </tr>
        `;
        tbody.append(row);
    });
}

// Display daily trends
function displayDailyTrends(trends) {
    if (trends) {
        reportPagination.daily.data = trends;
        reportPagination.daily.page = 1;
    }
    
    renderPaginatedTable('daily', '#reports-daily-trends', trend => {
        const row = `
            <tr>
                <td>${trend.date}</td>
                <td style="text-align: center;">${trend.daily_tickets || 0}</td>
                <td style="text-align: center;">${trend.daily_completed || 0}</td>
                <td style="text-align: center;">${trend.daily_voided || 0}</td>
                <td style="text-align: center;">${formatTime(trend.daily_avg_service_time)}</td>
            </tr>
        `;
        $('#reports-daily-trends').append(row);
    });
}

// Display detailed transactions
function displayDetailedTransactions(transactions) {
    const tbody = $('#reports-detailed-transactions');
    tbody.empty();

    if (!transactions || transactions.length === 0) {
        console.warn('No transaction data to display');
        tbody.append('<tr><td colspan="7" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    const maxRows = Math.min(100, transactions.length);

    for (let i = 0; i < maxRows; i++) {
        const tx = transactions[i];
        const statusLabel = (tx.status || 'N/A').toUpperCase();
        const voidNote = tx.void_reason
            ? `<br><small style="font-size:10px;opacity:0.75;">${tx.void_reason}</small>`
            : '';
        const row = `
            <tr>
                <td>${tx.date || 'N/A'}</td>
                <td>${tx.time || 'N/A'}</td>
                <td>${tx.service_name || tx.service_code || 'N/A'}</td>
                <td><span class="status-badge status-${tx.status}">${statusLabel}</span>${voidNote}</td>
                <td>${tx.teller_name || 'N/A'}</td>
                <td style="text-align: center;">${formatTime(tx.service_time_minutes)}</td>
                <td style="text-align: center;">${formatTime(tx.turnaround_time_minutes)}</td>
            </tr>
        `;
        tbody.append(row);
    }

    if (transactions.length > 100) {
        tbody.append(`<tr><td colspan="7" style="text-align: center; padding: 12px; font-style: italic; color: #999;">Showing 100 of ${transactions.length} transactions</td></tr>`);
    }
}

// Export report as PDF
// ============================================================
// EXECUTIVE EXPORT ENGINE: PDF & EXCEL (WARM PALETTE & BANNER)
// ============================================================

// Preload & cache banner image as Base64 for PDF header
let _cachedBannerData = null;
function getBannerImageBase64() {
    if (_cachedBannerData) return Promise.resolve(_cachedBannerData);
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function () {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                _cachedBannerData = {
                    dataUrl: canvas.toDataURL('image/png'),
                    width: canvas.width,
                    height: canvas.height,
                    ratio: (canvas.width / (canvas.height || 1)) || 4.7
                };
                resolve(_cachedBannerData);
            } catch (err) {
                console.warn('Banner canvas conversion error:', err);
                resolve(null);
            }
        };
        img.onerror = function () {
            console.warn('Could not load /images/banner.png');
            resolve(null);
        };
        img.src = '/images/banner.png?v=' + Date.now();
    });
}

// Helper to snapshot a chart canvas cleanly on white background
function getChartSnapshot(chartKey) {
    let source = null;
    if (chartKey === 'trendChart') source = document.getElementById('trendChart');
    else if (chartKey === 'serviceDistribChart') source = document.getElementById('serviceDistribChart');
    else if (chartKey === 'hourlyService') source = document.getElementById('reportHourlyServiceChart');
    else if (chartKey === 'dailyService') source = document.getElementById('reportDailyServiceChart');
    else if (chartKey === 'monthlyService') source = document.getElementById('reportMonthlyServiceChart');

    if (!source || !source.width || !source.height) {
        const chart = reportCharts && reportCharts[chartKey];
        source = chart && chart.canvas;
    }
    if (!source || !source.width || !source.height) return null;

    try {
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, 0, 0);
        return { data: canvas.toDataURL('image/png', 1), width: canvas.width, height: canvas.height };
    } catch (err) {
        console.warn('Chart snapshot error for ' + chartKey + ':', err);
        return null;
    }
}

// EXPORT AS PDF
async function exportReportAsPDF() {
    if (!currentReportData) {
        Swal.fire('Error', 'Please generate a report first', 'error');
        return;
    }

    try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            throw new Error('jsPDF library is not loaded');
        }

        const banner = await getBannerImageBase64();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 12;
        const contentWidth = pageWidth - (margin * 2);
        const generatedAt = new Date().toLocaleString();

        // Warm Executive Color Palette
        const colors = {
            navy: [10, 18, 32],         // #0a1220 - Dark Executive Navy
            slate: [22, 32, 48],        // #162030 - Dark Text
            royal: [30, 58, 138],       // #1e3a8a - Warm Royal Accent
            gold: [180, 115, 30],       // #b4731e - Bronze Gold Accent
            amber: [194, 120, 3],       // #c27803 - Warm Amber
            green: [16, 120, 80],       // #107850 - Forest Emerald
            terracotta: [185, 56, 38],  // #b93826 - Warm Brick
            surface: [243, 239, 230],   // #f3efe6 - Warm Surface
            parchment: [249, 247, 242], // #f9f7f2 - Soft Warm White
            border: [207, 197, 176],    // #cfc5b0 - Warm Border
            muted: [112, 106, 96]       // #706a60 - Warm Muted Text
        };

        const summary = currentReportData.summary || {};
        const services = currentReportData.byService || [];
        const tellers = currentReportData.byTeller || [];
        const statuses = currentReportData.byStatus || [];
        const dailyTrends = currentReportData.dailyTrends || [];
        const transactions = currentReportData.detailedTransactions || [];

        const totalTickets = Number(summary.total_tickets || 0);
        const completedTickets = Number(summary.completed_tickets || 0);
        const voidedTickets = Number(summary.voided_tickets || 0);
        const pendingTickets = Number(summary.pending_tickets || 0);
        const completionRate = totalTickets ? (completedTickets / totalTickets) * 100 : 0;
        const voidRate = totalTickets ? (voidedTickets / totalTickets) * 100 : 0;

        const busiestService = [...services].sort((a, b) => Number(b.ticket_count || 0) - Number(a.ticket_count || 0))[0];
        const topTeller = [...tellers].sort((a, b) => Number(b.completed || 0) - Number(a.completed || 0))[0];
        const peakDay = [...dailyTrends].sort((a, b) => Number(b.daily_tickets || 0) - Number(a.daily_tickets || 0))[0];
        const averageDailyVolume = dailyTrends.length
            ? dailyTrends.reduce((sum, row) => sum + Number(row.daily_tickets || 0), 0) / dailyTrends.length
            : 0;

        // Running Header (Pages 2+)
        const drawRunningHeader = (sectionNumber, title, subtitle) => {
            const currentWidth = doc.internal.pageSize.getWidth();
            
            // Top Warm Dual Accent Bar
            doc.setFillColor(...colors.navy);
            doc.rect(0, 0, currentWidth, 3.5, 'F');
            doc.setFillColor(...colors.gold);
            doc.rect(0, 3.5, currentWidth, 1.2, 'F');

            // Draw compact header banner logo on top-right if available
            if (banner && banner.dataUrl) {
                const logoW = 38;
                const logoH = logoW / (banner.ratio || 4.7);
                doc.addImage(banner.dataUrl, 'PNG', currentWidth - margin - logoW, 7, logoW, logoH, undefined, 'FAST');
            }

            // Section Kicker & Title
            doc.setTextColor(...colors.gold);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text(sectionNumber ? `OPENQ AUDIT / ${sectionNumber}` : 'OPENQ OPERATIONS REPORT', margin, 12);

            doc.setTextColor(...colors.navy);
            doc.setFontSize(15);
            doc.text(title, margin, 19);

            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(subtitle, margin, 24.5);

            // Warm Divider Line
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.3);
            doc.line(margin, 27, currentWidth - margin, 27);
        };

        // Uniform Equal-Size Chart Card (EQUAL HEIGHT & WIDTH)
        const drawEqualChartCard = (chartKey, title, note, badgeText, yPos) => {
            const cardHeight = 104; // EXACT EQUAL HEIGHT FOR ALL CHARTS
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, yPos, contentWidth, cardHeight, 3, 3, 'FD');

            // Card Header
            doc.setTextColor(...colors.navy);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.text(title, margin + 6, yPos + 7.5);

            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.text(note, margin + 6, yPos + 12.5);

            // Badge Pill on Top Right
            if (badgeText) {
                doc.setFillColor(...colors.surface);
                doc.setDrawColor(...colors.border);
                doc.roundedRect(margin + contentWidth - 28, yPos + 4, 22, 6, 2, 2, 'FD');
                doc.setTextColor(...colors.gold);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6.5);
                doc.text(badgeText.toUpperCase(), margin + contentWidth - 17, yPos + 8, { align: 'center' });
            }

            // Render Chart Image centered in drawing area
            const img = getChartSnapshot(chartKey);
            const drawAreaX = margin + 4;
            const drawAreaY = yPos + 16;
            const maxW = contentWidth - 8;
            const maxH = cardHeight - 20;

            if (!img) {
                doc.setTextColor(...colors.muted);
                doc.setFontSize(8);
                doc.text('Chart visual preview unavailable for this dataset.', margin + (contentWidth / 2), yPos + (cardHeight / 2), { align: 'center' });
                return;
            }

            const scale = Math.min(maxW / img.width, maxH / img.height);
            const imgW = img.width * scale;
            const imgH = img.height * scale;
            const imgX = drawAreaX + ((maxW - imgW) / 2);
            const imgY = drawAreaY + ((maxH - imgH) / 2);

            doc.addImage(img.data, 'PNG', imgX, imgY, imgW, imgH, undefined, 'FAST');
        };

        // Table Theme for AutoTable
        const tableTheme = {
            theme: 'grid',
            margin: { left: margin, right: margin, bottom: 15 },
            headStyles: {
                fillColor: colors.navy,
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 8,
                cellPadding: 3,
                halign: 'left',
                lineColor: colors.navy,
                lineWidth: 0.2
            },
            bodyStyles: {
                textColor: colors.slate,
                fontSize: 7.5,
                cellPadding: 2.8,
                lineColor: colors.border,
                lineWidth: 0.2
            },
            alternateRowStyles: { fillColor: colors.parchment },
            styles: { overflow: 'linebreak', valign: 'middle' }
        };

        // ==========================================
        // PAGE 1: COVER & EXECUTIVE SUMMARY
        // ==========================================
        // Top Banner Image (Refined, balanced proportion)
        let bannerHeight = 26;
        if (banner && banner.dataUrl) {
            const bannerWidth = 125;
            bannerHeight = bannerWidth / (banner.ratio || 4.7);
            const bannerX = (pageWidth - bannerWidth) / 2;
            doc.addImage(banner.dataUrl, 'PNG', bannerX, 8, bannerWidth, bannerHeight, undefined, 'FAST');
        } else {
            const bannerWidth = 125;
            const bannerX = (pageWidth - bannerWidth) / 2;
            doc.setFillColor(...colors.navy);
            doc.roundedRect(bannerX, 8, bannerWidth, 24, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('OPENQ QUEUE INTELLIGENCE', pageWidth / 2, 23, { align: 'center' });
        }

        const headerTopY = 8 + bannerHeight + 6;
        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text('QUEUE OPERATIONS & PERFORMANCE REPORT', pageWidth / 2, headerTopY, { align: 'center' });

        doc.setTextColor(...colors.muted);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.text(`Audit range: ${currentReportData.dateFrom} to ${currentReportData.dateTo}  •  Exported: ${generatedAt}`, pageWidth / 2, headerTopY + 5.2, { align: 'center' });

        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.35);
        doc.line(margin, headerTopY + 8.5, margin + contentWidth, headerTopY + 8.5);

        // 6 Executive Metric Cards
        const cardGap = 5;
        const cardWidth = (contentWidth - (cardGap * 2)) / 3;
        const cardY1 = headerTopY + 12;
        const cardY2 = cardY1 + 25;

        const drawMetricCard = (x, y, width, label, value, note, accent) => {
            doc.setFillColor(...colors.surface);
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.25);
            doc.roundedRect(x, y, width, 22, 2.5, 2.5, 'FD');
            doc.setFillColor(...accent);
            doc.roundedRect(x, y, 2.2, 22, 1.1, 1.1, 'F');

            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.text(String(label).toUpperCase(), x + 6, y + 6.5);

            doc.setTextColor(...colors.navy);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12.5);
            doc.text(String(value), x + 6, y + 14.5);

            if (note) {
                doc.setTextColor(...colors.muted);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.2);
                doc.text(String(note), x + 6, y + 19);
            }
        };

        drawMetricCard(margin, cardY1, cardWidth, 'Total tickets', totalTickets.toLocaleString(), 'Total arrivals', colors.royal);
        drawMetricCard(margin + cardWidth + cardGap, cardY1, cardWidth, 'Completed', completedTickets.toLocaleString(), 'Successfully served', colors.green);
        drawMetricCard(margin + ((cardWidth + cardGap) * 2), cardY1, cardWidth, 'Voided / dropped', voidedTickets.toLocaleString(), 'Cancelled / no show', colors.terracotta);

        drawMetricCard(margin, cardY2, cardWidth, 'Completion rate', `${completionRate.toFixed(1)}%`, 'Finished vs total', colors.green);
        drawMetricCard(margin + cardWidth + cardGap, cardY2, cardWidth, 'Avg handling time', formatTime(summary.avg_service_time_minutes), 'Active service duration', colors.gold);
        drawMetricCard(margin + ((cardWidth + cardGap) * 2), cardY2, cardWidth, 'Avg turnaround time', formatTime(summary.avg_turnaround_time_minutes), 'Total queue journey', colors.amber);

        // Executive Operational Highlights Box
        const scoreY = cardY2 + 26;
        doc.setFillColor(...colors.surface);
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.25);
        doc.roundedRect(margin, scoreY, contentWidth, 54, 3, 3, 'FD');

        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Operational Highlights & Audit Scorecard', margin + 6, scoreY + 9);

        const scoreItems = [
            ['Busiest Department', busiestService ? `${busiestService.service_name || busiestService.service_code}: ${Number(busiestService.ticket_count || 0).toLocaleString()} tickets` : 'No records'],
            ['Top Performing Staff', topTeller ? `${topTeller.teller_name || 'Unassigned'}: ${Number(topTeller.completed || 0).toLocaleString()} completed (${topTeller.tickets_served ? ((Number(topTeller.completed || 0) / Number(topTeller.tickets_served)) * 100).toFixed(1) : '100'}%)` : 'No records'],
            ['Peak Operating Day', peakDay ? `${peakDay.date}: ${Number(peakDay.daily_tickets || 0).toLocaleString()} tickets` : 'No records'],
            ['Daily Average Volume', `${averageDailyVolume.toFixed(1)} tickets per recorded day`],
            ['Pending Backlog', `${pendingTickets.toLocaleString()} tickets in queue (${totalTickets ? ((pendingTickets / totalTickets) * 100).toFixed(1) : '0.0'}%)`],
            ['Void / Drop Rate', `${voidRate.toFixed(1)}% of total queue registrations`]
        ];

        scoreItems.forEach((item, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            const x = margin + 6 + (col * (contentWidth / 2));
            const y = scoreY + 18 + (row * 11);

            doc.setTextColor(...colors.gold);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.8);
            doc.text(item[0].toUpperCase(), x, y);

            doc.setTextColor(...colors.navy);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.2);
            doc.text(doc.splitTextToSize(item[1], (contentWidth / 2) - 10)[0], x, y + 4.5);
        });

        // Top Services Summary Table
        const topSvcY = scoreY + 59;
        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Primary Service Demand Overview', margin, topSvcY);

        const topServices = [...services]
            .sort((a, b) => Number(b.ticket_count || 0) - Number(a.ticket_count || 0))
            .slice(0, 5)
            .map(s => [
                s.service_name || s.service_code || 'N/A',
                Number(s.ticket_count || 0).toLocaleString(),
                Number(s.completed || 0).toLocaleString(),
                Number(s.ticket_count || 0) ? `${((Number(s.completed || 0) / Number(s.ticket_count || 0)) * 100).toFixed(1)}%` : '0.0%',
                formatTime(s.avg_service_time_minutes)
            ]);

        if (topServices.length) {
            doc.autoTable({
                ...tableTheme,
                head: [['Service Department', 'Total Tickets', 'Completed', 'Completion %', 'Avg Handling']],
                body: topServices,
                startY: topSvcY + 4,
                columnStyles: {
                    0: { cellWidth: contentWidth * 0.44 },
                    1: { cellWidth: contentWidth * 0.14, halign: 'center' },
                    2: { cellWidth: contentWidth * 0.14, halign: 'center' },
                    3: { cellWidth: contentWidth * 0.14, halign: 'center' },
                    4: { cellWidth: contentWidth * 0.14, halign: 'center' }
                }
            });
        }

        // ==========================================
        // PAGE 2: PRIMARY VISUAL ANALYTICS (EQUAL CHARTS)
        // ==========================================
        doc.addPage();
        drawRunningHeader('02', 'Primary Visual Analytics', 'Ticket movement volume and completed service demand distribution');
        // Chart 1: Ticket volume trend (EQUAL SIZE: 186mm x 104mm)
        drawEqualChartCard('trendChart', 'Ticket Volume Trend Movement', 'Completed tickets in 30-minute intervals across services', 'Timeline', 31);
        // Chart 2: Service distribution (EQUAL SIZE: 186mm x 104mm)
        drawEqualChartCard('serviceDistribChart', 'Service Demand Distribution', 'Share of completed service tickets across departments', 'Distribution', 142);

        // ==========================================
        // PAGE 3: SERVICE DEMAND ANALYTICS (EQUAL CHARTS)
        // ==========================================
        doc.addPage();
        drawRunningHeader('03', 'Service Demand Time Profiles', 'Comparative service workload across hourly, daily, and monthly resolutions');
        // Chart 3: Hourly Profile (EQUAL SIZE: 186mm x 104mm)
        drawEqualChartCard('hourlyService', 'Hourly Arrival Profile by Service', 'Ticket arrivals grouped by hour of the day (00:00–23:00)', 'Hourly', 31);
        // Chart 4: Daily Trend (EQUAL SIZE: 186mm x 104mm)
        drawEqualChartCard('dailyService', 'Daily Operating Trend by Service', 'Calendar demand volume across the selected report period', 'Daily', 142);

        // ==========================================
        // PAGE 4: PERFORMANCE BY SERVICE TABLE
        // ==========================================
        doc.addPage();
        drawRunningHeader('04', 'Performance by Service Department', `${services.length} department record${services.length === 1 ? '' : 's'} included in audit`);
        const serviceRows = services.map(s => {
            const t = Number(s.ticket_count || 0);
            const c = Number(s.completed || 0);
            const rate = t ? `${((c / t) * 100).toFixed(1)}%` : '0.0%';
            return [
                s.service_name || s.service_code || 'N/A',
                t.toLocaleString(),
                c.toLocaleString(),
                Number(s.voided || 0).toLocaleString(),
                Number(s.pending || 0).toLocaleString(),
                rate,
                formatTime(s.avg_service_time_minutes)
            ];
        });

        if (serviceRows.length) {
            doc.autoTable({
                ...tableTheme,
                head: [['Service Department', 'Total', 'Completed', 'Voided', 'Pending', 'Completion %', 'Avg Handling']],
                body: serviceRows,
                startY: 33,
                columnStyles: {
                    0: { cellWidth: contentWidth * 0.36 },
                    1: { cellWidth: contentWidth * 0.10, halign: 'center' },
                    2: { cellWidth: contentWidth * 0.11, halign: 'center' },
                    3: { cellWidth: contentWidth * 0.10, halign: 'center' },
                    4: { cellWidth: contentWidth * 0.10, halign: 'center' },
                    5: { cellWidth: contentWidth * 0.11, halign: 'center' },
                    6: { cellWidth: contentWidth * 0.12, halign: 'center' }
                }
            });
        }

        // ==========================================
        // PAGE 5: PERFORMANCE BY TELLER TABLE
        // ==========================================
        doc.addPage();
        drawRunningHeader('05', 'Staff Throughput & Counter Performance', `${tellers.length} teller record${tellers.length === 1 ? '' : 's'} included in audit`);
        const tellerRows = tellers.map(t => {
            const s = Number(t.tickets_served || 0);
            const c = Number(t.completed || 0);
            const rate = s ? `${((c / s) * 100).toFixed(1)}%` : '100.0%';
            return [
                t.teller_name || 'N/A',
                t.counter_number || 'N/A',
                s.toLocaleString(),
                c.toLocaleString(),
                Number(t.voided || 0).toLocaleString(),
                rate,
                formatTime(t.avg_service_time_minutes)
            ];
        });

        if (tellerRows.length) {
            doc.autoTable({
                ...tableTheme,
                head: [['Teller Name', 'Counter', 'Served', 'Completed', 'Voided', 'Efficiency', 'Avg Handling']],
                body: tellerRows,
                startY: 33,
                columnStyles: {
                    0: { cellWidth: contentWidth * 0.34 },
                    1: { cellWidth: contentWidth * 0.12, halign: 'center' },
                    2: { cellWidth: contentWidth * 0.11, halign: 'center' },
                    3: { cellWidth: contentWidth * 0.11, halign: 'center' },
                    4: { cellWidth: contentWidth * 0.10, halign: 'center' },
                    5: { cellWidth: contentWidth * 0.11, halign: 'center' },
                    6: { cellWidth: contentWidth * 0.11, halign: 'center' }
                }
            });
        }

        // ==========================================
        // PAGE 6: STATUS & DAILY OPERATING TRENDS
        // ==========================================
        doc.addPage();
        drawRunningHeader('06', 'Operational Status & Daily Breakdown', 'Overall status distribution and chronological day-to-day audit');

        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Ticket Outcome & Status Breakdown', margin, 35);

        const statusRows = statuses.map(st => [
            String(st.status || 'N/A').replace(/_/g, ' ').toUpperCase(),
            Number(st.count || 0).toLocaleString(),
            totalTickets ? `${((Number(st.count || 0) / totalTickets) * 100).toFixed(1)}%` : '0.0%'
        ]);

        if (statusRows.length) {
            doc.autoTable({
                ...tableTheme,
                head: [['Status Category', 'Ticket Count', 'Share of Volume']],
                body: statusRows,
                startY: 39,
                tableWidth: contentWidth,
                columnStyles: {
                    0: { cellWidth: contentWidth * 0.52 },
                    1: { cellWidth: contentWidth * 0.24, halign: 'center' },
                    2: { cellWidth: contentWidth * 0.24, halign: 'center' }
                }
            });
        }

        let dailyY = Math.max((doc.lastAutoTable?.finalY || 39) + 12, 95);
        if (dailyY > 215) {
            doc.addPage();
            drawRunningHeader('06B', 'Daily Operating Breakdown', 'Chronological daily performance records');
            dailyY = 35;
        }

        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Day-by-Day Queue Performance', margin, dailyY);

        const dailyRows = dailyTrends.map(t => [
            t.date || 'N/A',
            Number(t.daily_tickets || 0).toLocaleString(),
            Number(t.daily_completed || 0).toLocaleString(),
            Number(t.daily_voided || 0).toLocaleString(),
            formatTime(t.daily_avg_service_time)
        ]);

        if (dailyRows.length) {
            doc.autoTable({
                ...tableTheme,
                head: [['Date', 'Total Registrations', 'Completed', 'Voided', 'Avg Handling']],
                body: dailyRows,
                startY: dailyY + 4,
                tableWidth: contentWidth,
                columnStyles: {
                    0: { cellWidth: contentWidth * 0.28 },
                    1: { cellWidth: contentWidth * 0.18, halign: 'center' },
                    2: { cellWidth: contentWidth * 0.18, halign: 'center' },
                    3: { cellWidth: contentWidth * 0.18, halign: 'center' },
                    4: { cellWidth: contentWidth * 0.18, halign: 'center' }
                }
            });
        }

        // Running Footer with Page Numbers on Every Page
        const pageCount = doc.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
            doc.setPage(p);
            doc.setDrawColor(...colors.border);
            doc.setLineWidth(0.3);
            doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(`OpenQ Operations & Audit Report  •  Range: ${currentReportData.dateFrom} to ${currentReportData.dateTo}`, margin, pageHeight - 6.5);
            doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
        }

        doc.save(`OpenQ_Report_${currentReportData.dateFrom}_to_${currentReportData.dateTo}.pdf`);
        Swal.fire('Success', 'Executive PDF Report exported successfully', 'success');
        return doc;
    } catch (error) {
        console.error('PDF export error:', error);
        Swal.fire('Error', 'Failed to export PDF: ' + error.message, 'error');
    }
}

// EXPORT AS EXCEL (PROFESSIONAL MULTI-SHEET WORKBOOK)
function exportReportAsExcel() {
    if (!currentReportData) {
        Swal.fire('Error', 'Please generate a report first', 'error');
        return;
    }

    try {
        if (!window.XLSX) {
            throw new Error('XLSX library is not loaded');
        }

        const wb = XLSX.utils.book_new();
        const now = new Date().toLocaleString();
        const summary = currentReportData.summary || {};
        const total = Number(summary.total_tickets || 0);
        const completed = Number(summary.completed_tickets || 0);
        const voided = Number(summary.voided_tickets || 0);
        const pending = Number(summary.pending_tickets || 0);
        const completionRate = total ? (completed / total) * 100 : 0;
        const voidRate = total ? (voided / total) * 100 : 0;

        const services = currentReportData.byService || [];
        const tellers = currentReportData.byTeller || [];
        const dailyTrends = currentReportData.dailyTrends || [];
        const statuses = currentReportData.byStatus || [];
        const transactions = currentReportData.detailedTransactions || [];

        const busiestService = [...services].sort((a, b) => Number(b.ticket_count || 0) - Number(a.ticket_count || 0))[0];
        const topTeller = [...tellers].sort((a, b) => Number(b.completed || 0) - Number(a.completed || 0))[0];
        const peakDay = [...dailyTrends].sort((a, b) => Number(b.daily_tickets || 0) - Number(a.daily_tickets || 0))[0];

        // 1. Executive Summary Sheet
        const summaryRows = [
            ['OPENQ QUEUE OPERATIONS & PERFORMANCE REPORT'],
            ['Comprehensive Management Audit & Operational Analytics'],
            [],
            ['Report Period:', `${currentReportData.dateFrom} to ${currentReportData.dateTo}`],
            ['Generated On:', now],
            ['Total Records:', total],
            [],
            ['EXECUTIVE KEY PERFORMANCE INDICATORS', '', ''],
            ['Metric Description', 'Value', 'Unit / Operational Context'],
            ['Total Tickets Registered', total, 'All customer queue arrivals'],
            ['Completed Tickets', completed, 'Successfully served to completion'],
            ['Voided / Cancelled Tickets', voided, 'No-shows or cancelled visits'],
            ['Pending in Queue', pending, 'Active backlog'],
            ['Overall Completion Rate', `${completionRate.toFixed(1)}%`, 'Finished vs total registered'],
            ['Overall Void / Drop Rate', `${voidRate.toFixed(1)}%`, 'Cancelled proportion'],
            ['Average Handling Time', (summary.avg_service_time_minutes || 0).toFixed(2), 'Minutes of active service'],
            ['Average Turnaround Time', (summary.avg_turnaround_time_minutes || 0).toFixed(2), 'Minutes total lobby journey'],
            [],
            ['OPERATIONAL HIGHLIGHTS & SCORECARD', '', ''],
            ['Highlight Category', 'Details', 'Volume / Context'],
            ['Busiest Service Department', busiestService ? (busiestService.service_name || busiestService.service_code) : 'N/A', busiestService ? Number(busiestService.ticket_count || 0) : 0],
            ['Top Performing Staff / Teller', topTeller ? topTeller.teller_name : 'N/A', topTeller ? `${Number(topTeller.completed || 0).toLocaleString()} completed (${topTeller.tickets_served ? ((Number(topTeller.completed || 0) / Number(topTeller.tickets_served)) * 100).toFixed(1) : '100'}%)` : 'N/A'],
            ['Peak Operating Volume Date', peakDay ? peakDay.date : 'N/A', peakDay ? Number(peakDay.daily_tickets || 0) : 0]
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
        summarySheet['!cols'] = [{ wch: 38 }, { wch: 24 }, { wch: 36 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

        // 2. Service Performance Sheet
        const serviceRows = [
            ['SERVICE DEPARTMENT AUDIT & PERFORMANCE BREAKDOWN'],
            [`Period: ${currentReportData.dateFrom} to ${currentReportData.dateTo}`],
            [],
            ['Service Department', 'Service Code', 'Total Tickets', 'Completed', 'Voided', 'Pending', 'Completion Rate (%)', 'Avg Handling (min)']
        ];
        services.forEach(s => {
            const t = Number(s.ticket_count || 0);
            const c = Number(s.completed || 0);
            const rate = t ? ((c / t) * 100).toFixed(1) : '0.0';
            serviceRows.push([
                s.service_name || 'N/A',
                s.service_code || 'N/A',
                t,
                c,
                Number(s.voided || 0),
                Number(s.pending || 0),
                rate + '%',
                Number((s.avg_service_time_minutes || 0).toFixed(2))
            ]);
        });
        const serviceSheet = XLSX.utils.aoa_to_sheet(serviceRows);
        serviceSheet['!cols'] = [{ wch: 32 }, { wch: 16 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, serviceSheet, 'Service Performance');

        // 3. Teller Throughput Sheet
        const tellerRows = [
            ['STAFF THROUGHPUT & COUNTER PERFORMANCE'],
            [`Period: ${currentReportData.dateFrom} to ${currentReportData.dateTo}`],
            [],
            ['Teller Name', 'Counter', 'Tickets Served', 'Completed', 'Voided', 'Completion Rate (%)', 'Avg Handling (min)']
        ];
        tellers.forEach(t => {
            const s = Number(t.tickets_served || 0);
            const c = Number(t.completed || 0);
            const rate = s ? ((c / s) * 100).toFixed(1) : '100.0';
            tellerRows.push([
                t.teller_name || 'N/A',
                t.counter_number ? 'Counter ' + t.counter_number : 'N/A',
                s,
                c,
                Number(t.voided || 0),
                rate + '%',
                Number((t.avg_service_time_minutes || 0).toFixed(2))
            ]);
        });
        const tellerSheet = XLSX.utils.aoa_to_sheet(tellerRows);
        tellerSheet['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, tellerSheet, 'Teller Throughput');

        // 4. Daily Operating Trends Sheet
        const trendRows = [
            ['DAILY OPERATING BREAKDOWN & CHRONOLOGY'],
            [`Period: ${currentReportData.dateFrom} to ${currentReportData.dateTo}`],
            [],
            ['Date', 'Day of Week', 'Total Registrations', 'Completed', 'Voided', 'Avg Handling (min)']
        ];
        dailyTrends.forEach(d => {
            let dayName = 'N/A';
            if (d.date) {
                const dateObj = new Date(d.date + 'T00:00:00');
                if (!isNaN(dateObj.getTime())) {
                    dayName = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                }
            }
            trendRows.push([
                d.date || 'N/A',
                dayName,
                Number(d.daily_tickets || 0),
                Number(d.daily_completed || 0),
                Number(d.daily_voided || 0),
                Number((d.daily_avg_service_time || 0).toFixed(2))
            ]);
        });
        const trendsSheet = XLSX.utils.aoa_to_sheet(trendRows);
        trendsSheet['!cols'] = [{ wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, trendsSheet, 'Daily Trends');

        // 5. Status Breakdown Sheet
        const statusRows = [
            ['TICKET OUTCOME & STATUS DISTRIBUTION'],
            [`Period: ${currentReportData.dateFrom} to ${currentReportData.dateTo}`],
            [],
            ['Status Category', 'Display Label', 'Total Tickets', 'Share of Volume (%)']
        ];
        statuses.forEach(st => {
            const count = Number(st.count || 0);
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            statusRows.push([
                st.status || 'N/A',
                String(st.status || 'N/A').replace(/_/g, ' ').toUpperCase(),
                count,
                pct + '%'
            ]);
        });
        const statusSheet = XLSX.utils.aoa_to_sheet(statusRows);
        statusSheet['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, statusSheet, 'Status Distribution');

        // Write file
        XLSX.writeFile(wb, `OpenQ_Report_${currentReportData.dateFrom}_to_${currentReportData.dateTo}.xlsx`);
        Swal.fire('Success', 'Executive Excel Workbook exported successfully', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        Swal.fire('Error', 'Failed to export Excel: ' + error.message, 'error');
    }
}
