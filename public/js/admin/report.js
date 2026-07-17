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
            backgroundColor: `${color}18`,
            borderWidth: 2.25,
            tension: 0.32,
            fill: services.length === 1,
            pointRadius: labels.length > 35 ? 0 : 2,
            pointHoverRadius: 5,
            pointHitRadius: 10
        };
    });

    reportCharts[chartKey] = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: true },
            plugins: {
                legend: { position: 'bottom', labels: { color: theme.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 7, padding: 14, font: { size: 10, weight: '600' } } },
                tooltip: { mode: 'nearest', intersect: true, backgroundColor: theme.tooltipBackground, titleColor: theme.heading, bodyColor: theme.text, borderColor: theme.tooltipBorder, borderWidth: 1, padding: 12, usePointStyle: true }
            },
            scales: {
                x: { border: { display: false }, grid: { display: false }, ticks: { color: theme.text, maxTicksLimit: config.maxTicks, font: { size: 9 } } },
                y: { beginAtZero: true, border: { display: false }, grid: { color: theme.grid }, ticks: { color: theme.text, precision: 0, stepSize: 1, padding: 8 } }
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

    // Build 30-minute interval labels (00:00 → 23:30)
    const intervalLabels = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            intervalLabels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }
    const numIntervals = intervalLabels.length; // 48

    // Collect unique service names and per-service counts (finished tickets only)
    const serviceCounts = {}; // { serviceName: [0,0,...] (48 slots) }

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

    // Palette — extended for many services
    const serviceNames = Object.keys(serviceCounts);
    const datasets = serviceNames.map((svc, i) => {
        const color = theme.palette[i % theme.palette.length];
        return {
            label: svc,
            data: serviceCounts[svc],
            borderColor: color,
            backgroundColor: color + '18',
            pointRadius: 0,
            pointBackgroundColor: color,
            pointBorderColor: theme.dark ? '#152238' : '#ffffff',
            pointHoverRadius: 5,
            pointHitRadius: 10,
            pointBorderWidth: 2,
            tension: 0.36,
            fill: false,
            borderWidth: 2.5,
        };
    });

    // Convert labels to 12-hour format for display
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
            interaction: { mode: 'nearest', intersect: true },
            scales: {
                x: {
                    border: { display: false },
                    grid: { display: false },
                    ticks: { color: theme.text, maxTicksLimit: 12, font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    border: { display: false },
                    ticks: { color: theme.text, precision: 0, font: { size: 10 }, padding: 8 },
                    grid: { color: theme.grid }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: theme.text,
                        boxWidth: 8,
                        font: { size: 11, weight: '600' },
                        padding: 16,
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
                    padding: 12,
                    displayColors: true,
                    intersect: true,
                    mode: 'nearest',
                    usePointStyle: true,
                    caretPadding: 10
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

    // Filter finished/completed
    const finishedTx = (transactions || []).filter(tx => tx.status && (tx.status.toLowerCase() === 'finished' || tx.status.toLowerCase() === 'completed'));

    // Group by service
    const serviceCounts = {};
    finishedTx.forEach(tx => {
        const srv = tx.service_name || tx.service_code || 'Unknown';
        serviceCounts[srv] = (serviceCounts[srv] || 0) + 1;
    });

    const labels = Object.keys(serviceCounts);
    const data = Object.values(serviceCounts);

    const backgroundColors = labels.map((_, i) => theme.palette[i % theme.palette.length]);

    reportCharts.serviceDistribChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Finished Tickets',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: theme.dark ? '#111c2e' : '#ffffff',
                borderWidth: 4,
                hoverBorderWidth: 4,
                hoverOffset: 8,
                spacing: 2
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            layout: { padding: 8 },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: theme.text,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 8,
                        padding: 14,
                        font: { size: 10, weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackground,
                    bodyColor: theme.text,
                    titleColor: theme.heading,
                    borderColor: theme.tooltipBorder,
                    borderWidth: 1,
                    padding: 15,
                    displayColors: true,
                    usePointStyle: true,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((sum, value) => sum + Number(value || 0), 0);
                            const value = Number(context.raw || 0);
                            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
                            return ` ${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Display tickets by service
function displayByService(services) {
    const tbody = $('#reports-by-service');
    tbody.empty();

    if (!services || services.length === 0) {
        console.warn('No service data to display');
        tbody.append('<tr><td colspan="6" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    services.forEach((service, idx) => {
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
        tbody.append(row);
    });
}

// Display performance by teller
function displayByTeller(tellers) {
    const tbody = $('#reports-by-teller');
    tbody.empty();

    if (!tellers || tellers.length === 0) {
        console.warn('No teller data to display');
        tbody.append('<tr><td colspan="6" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    tellers.forEach(teller => {
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
        tbody.append(row);
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
    const tbody = $('#reports-daily-trends');
    tbody.empty();

    if (!trends || trends.length === 0) {
        console.warn('No trend data to display');
        tbody.append('<tr><td colspan="5" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    trends.forEach(trend => {
        const row = `
            <tr>
                <td>${trend.date}</td>
                <td style="text-align: center;">${trend.daily_tickets || 0}</td>
                <td style="text-align: center;">${trend.daily_completed || 0}</td>
                <td style="text-align: center;">${trend.daily_voided || 0}</td>
                <td style="text-align: center;">${formatTime(trend.daily_avg_service_time)}</td>
            </tr>
        `;
        tbody.append(row);
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
function exportReportAsPDF() {
    if (!currentReportData) {
        Swal.fire('Error', 'Please generate a report first', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 11;
        const contentWidth = pageWidth - (margin * 2);
        const generatedAt = new Date().toLocaleString();
        const colors = {
            navy: [20, 32, 54],
            primary: [79, 109, 245],
            cyan: [17, 168, 199],
            green: [11, 166, 120],
            amber: [228, 155, 33],
            red: [225, 79, 101],
            purple: [139, 107, 232],
            muted: [100, 116, 139],
            border: [220, 228, 239],
            soft: [246, 248, 252]
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
        const topTeller = [...tellers].sort((a, b) => Number(b.tickets_served || 0) - Number(a.tickets_served || 0))[0];
        const peakDay = [...dailyTrends].sort((a, b) => Number(b.daily_tickets || 0) - Number(a.daily_tickets || 0))[0];
        const averageDailyVolume = dailyTrends.length
            ? dailyTrends.reduce((sum, row) => sum + Number(row.daily_tickets || 0), 0) / dailyTrends.length
            : 0;

        const drawPageHeader = (title, subtitle, sectionNumber) => {
            const currentWidth = doc.internal.pageSize.getWidth();
            doc.setFillColor(...colors.primary);
            doc.rect(0, 0, currentWidth, 4, 'F');
            doc.setTextColor(...colors.primary);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(sectionNumber ? `OPENQ REPORT / ${sectionNumber}` : 'OPENQ OPERATIONS REPORT', margin, 13);
            doc.setTextColor(...colors.navy);
            doc.setFontSize(18);
            doc.text(title, margin, 23);
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.text(subtitle, margin, 29);
            doc.setDrawColor(...colors.border);
            doc.line(margin, 33, currentWidth - margin, 33);
        };

        const drawMetricCard = (x, y, width, label, value, accent) => {
            doc.setFillColor(...colors.soft);
            doc.setDrawColor(...colors.border);
            doc.roundedRect(x, y, width, 25, 2.5, 2.5, 'FD');
            doc.setFillColor(...accent);
            doc.roundedRect(x, y, 2.2, 25, 1.1, 1.1, 'F');
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.text(String(label).toUpperCase(), x + 6, y + 8);
            doc.setTextColor(...colors.navy);
            doc.setFontSize(14);
            doc.text(String(value), x + 6, y + 18);
        };

        const chartSnapshot = chartKey => {
            const chart = reportCharts[chartKey];
            const source = chart?.canvas;
            if (!source || !source.width || !source.height) return null;
            chart.stop?.();
            chart.update?.('none');
            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            const context = canvas.getContext('2d');
            context.fillStyle = getAdminChartTheme().dark ? '#111c2e' : '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(source, 0, 0);
            return { data: canvas.toDataURL('image/png', 1), width: canvas.width, height: canvas.height };
        };

        const drawChartCard = (chartKey, title, note, x, y, width, height) => {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colors.border);
            doc.roundedRect(x, y, width, height, 3, 3, 'FD');
            doc.setTextColor(...colors.navy);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(title, x + 5, y + 8);
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.8);
            doc.text(note, x + 5, y + 13);
            const image = chartSnapshot(chartKey);
            if (!image) {
                doc.setTextColor(...colors.muted);
                doc.setFontSize(8);
                doc.text('Chart unavailable for this report range.', x + (width / 2), y + (height / 2), { align: 'center' });
                return;
            }
            const maxWidth = width - 8;
            const maxHeight = height - 20;
            const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
            const imageWidth = image.width * scale;
            const imageHeight = image.height * scale;
            doc.addImage(image.data, 'PNG', x + ((width - imageWidth) / 2), y + 17 + ((maxHeight - imageHeight) / 2), imageWidth, imageHeight, undefined, 'FAST');
        };

        const tableTheme = {
            theme: 'grid',
            margin: { left: margin, right: margin, bottom: 15 },
            headStyles: { fillColor: colors.navy, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 2.8 },
            bodyStyles: { textColor: colors.navy, fontSize: 7.5, cellPadding: 2.5, lineColor: colors.border, lineWidth: .2 },
            alternateRowStyles: { fillColor: colors.soft },
            styles: { overflow: 'linebreak', valign: 'middle' }
        };

        // Page 1: executive summary
        drawPageHeader('Queue Performance Report', `${currentReportData.dateFrom} to ${currentReportData.dateTo} / Generated ${generatedAt}`);
        const cardGap = 5;
        const cardWidth = (contentWidth - (cardGap * 2)) / 3;
        drawMetricCard(margin, 40, cardWidth, 'Total tickets', totalTickets.toLocaleString(), colors.primary);
        drawMetricCard(margin + cardWidth + cardGap, 40, cardWidth, 'Completed', completedTickets.toLocaleString(), colors.green);
        drawMetricCard(margin + ((cardWidth + cardGap) * 2), 40, cardWidth, 'Voided', voidedTickets.toLocaleString(), colors.red);
        drawMetricCard(margin, 70, cardWidth, 'Completion rate', `${completionRate.toFixed(1)}%`, colors.cyan);
        drawMetricCard(margin + cardWidth + cardGap, 70, cardWidth, 'Avg service', formatTime(summary.avg_service_time_minutes), colors.purple);
        drawMetricCard(margin + ((cardWidth + cardGap) * 2), 70, cardWidth, 'Avg turnaround', formatTime(summary.avg_turnaround_time_minutes), colors.amber);

        doc.setFillColor(...colors.soft);
        doc.setDrawColor(...colors.border);
        doc.roundedRect(margin, 103, contentWidth, 59, 3, 3, 'FD');
        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Executive analytics', margin + 6, 113);
        const analytics = [
            ['Busiest service', busiestService ? `${busiestService.service_name || busiestService.service_code}: ${Number(busiestService.ticket_count || 0).toLocaleString()} tickets` : 'No service activity'],
            ['Top teller', topTeller ? `${topTeller.teller_name || 'Unassigned'}: ${Number(topTeller.tickets_served || 0).toLocaleString()} served` : 'No teller activity'],
            ['Peak day', peakDay ? `${peakDay.date}: ${Number(peakDay.daily_tickets || 0).toLocaleString()} tickets` : 'No daily trend data'],
            ['Daily average', `${averageDailyVolume.toFixed(1)} tickets per recorded day`],
            ['Open / pending', `${pendingTickets.toLocaleString()} tickets (${totalTickets ? ((pendingTickets / totalTickets) * 100).toFixed(1) : '0.0'}% of volume)`],
            ['Void rate', `${voidRate.toFixed(1)}% of all tickets`]
        ];
        analytics.forEach((row, index) => {
            const column = index % 2;
            const line = Math.floor(index / 2);
            const x = margin + 6 + (column * (contentWidth / 2));
            const y = 124 + (line * 11);
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.text(row[0].toUpperCase(), x, y);
            doc.setTextColor(...colors.navy);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text(doc.splitTextToSize(row[1], (contentWidth / 2) - 12)[0], x, y + 4.2);
        });

        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Top services by demand', margin, 174);
        const topServices = [...services]
            .sort((a, b) => Number(b.ticket_count || 0) - Number(a.ticket_count || 0))
            .slice(0, 6)
            .map(service => [
                service.service_name || service.service_code || 'N/A',
                Number(service.ticket_count || 0).toLocaleString(),
                Number(service.completed || 0).toLocaleString(),
                `${Number(service.ticket_count || 0) ? ((Number(service.completed || 0) / Number(service.ticket_count || 0)) * 100).toFixed(1) : '0.0'}%`,
                formatTime(service.avg_service_time_minutes)
            ]);
        if (topServices.length) {
            doc.autoTable({
                ...tableTheme,
                head: [['Service', 'Tickets', 'Completed', 'Completion', 'Avg service']],
                body: topServices,
                startY: 179,
                columnStyles: { 0: { cellWidth: 62 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } }
            });
        } else {
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.text('No service records are available for the selected period.', margin, 184);
        }

        // Page 2: primary charts
        doc.addPage();
        drawPageHeader('Visual Analytics', 'Ticket movement and completed-service distribution', '02');
        drawChartCard('trendChart', 'Ticket volume trend', 'Completed tickets in 30-minute intervals by service', margin, 40, contentWidth, 105);
        drawChartCard('serviceDistribChart', 'Service distribution', 'Share of completed tickets by service', margin, 151, contentWidth, 116);

        // Page 3: service demand charts
        doc.addPage();
        drawPageHeader('Service Demand Analytics', 'Hourly, daily, and monthly service volume comparison', '03');
        drawChartCard('hourlyService', 'Hourly profile by service', 'Ticket arrivals grouped by hour of day', margin, 40, contentWidth, 72);
        drawChartCard('dailyService', 'Daily profile by service', 'Calendar trend across the selected report range', margin, 117, contentWidth, 72);
        drawChartCard('monthlyService', 'Monthly profile by service', 'Long-range service demand movement', margin, 194, contentWidth, 72);

        // Page 4: service table
        doc.addPage();
        drawPageHeader('Performance by Service', `${services.length} service record${services.length === 1 ? '' : 's'} in this report`, '04');
        const serviceRows = services.map(service => [
            service.service_name || service.service_code || 'N/A',
            Number(service.ticket_count || 0).toLocaleString(),
            Number(service.completed || 0).toLocaleString(),
            Number(service.voided || 0).toLocaleString(),
            Number(service.pending || 0).toLocaleString(),
            formatTime(service.avg_service_time_minutes)
        ]);
        if (serviceRows.length) doc.autoTable({ ...tableTheme, head: [['Service', 'Total', 'Completed', 'Voided', 'Pending', 'Avg service']], body: serviceRows, startY: 39, columnStyles: { 0: { cellWidth: 60 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } } });

        // Page 5: teller table
        doc.addPage();
        drawPageHeader('Performance by Teller', `${tellers.length} teller record${tellers.length === 1 ? '' : 's'} in this report`, '05');
        const tellerRows = tellers.map(teller => [
            teller.teller_name || 'N/A',
            teller.counter_number || 'N/A',
            Number(teller.tickets_served || 0).toLocaleString(),
            Number(teller.completed || 0).toLocaleString(),
            Number(teller.voided || 0).toLocaleString(),
            formatTime(teller.avg_service_time_minutes)
        ]);
        if (tellerRows.length) doc.autoTable({ ...tableTheme, head: [['Teller', 'Counter', 'Served', 'Completed', 'Voided', 'Avg service']], body: tellerRows, startY: 39, columnStyles: { 0: { cellWidth: 55 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' } } });

        // Page 6: status and daily trends
        doc.addPage();
        drawPageHeader('Status and Daily Trends', 'Outcome distribution and day-to-day operating performance', '06');
        const statusRows = statuses.map(status => [
            String(status.status || 'N/A').replace(/_/g, ' ').toUpperCase(),
            Number(status.count || 0).toLocaleString(),
            `${totalTickets ? ((Number(status.count || 0) / totalTickets) * 100).toFixed(1) : '0.0'}%`
        ]);
        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Ticket status distribution', margin, 42);
        if (statusRows.length) doc.autoTable({ ...tableTheme, head: [['Status', 'Count', 'Share']], body: statusRows, startY: 47, tableWidth: 90, columnStyles: { 0: { cellWidth: 45 }, 1: { halign: 'center' }, 2: { halign: 'center' } } });
        let dailyStart = Math.max((doc.lastAutoTable?.finalY || 47) + 13, 100);
        if (dailyStart > 220) {
            doc.addPage();
            drawPageHeader('Daily Trends', 'Day-to-day operating performance', '06B');
            dailyStart = 42;
        }
        doc.setTextColor(...colors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Daily performance', margin, dailyStart);
        const dailyRows = dailyTrends.map(trend => [
            trend.date || 'N/A',
            Number(trend.daily_tickets || 0).toLocaleString(),
            Number(trend.daily_completed || 0).toLocaleString(),
            Number(trend.daily_voided || 0).toLocaleString(),
            formatTime(trend.daily_avg_service_time)
        ]);
        if (dailyRows.length) doc.autoTable({ ...tableTheme, head: [['Date', 'Tickets', 'Completed', 'Voided', 'Avg service']], body: dailyRows, startY: dailyStart + 5, columnStyles: { 0: { cellWidth: 40 }, 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } } });

        // Final section: detailed transaction log
        if (transactions.length) {
            doc.addPage();
            drawPageHeader('Detailed Transaction Log', `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} / first 500 exported`, '07');
            const transactionRows = transactions.slice(0, 500).map(transaction => [
                transaction.date || 'N/A',
                transaction.time || 'N/A',
                transaction.service_name || transaction.service_code || 'N/A',
                String(transaction.status || 'N/A').replace(/_/g, ' '),
                transaction.teller_name || 'N/A',
                formatTime(transaction.service_time_minutes),
                formatTime(transaction.turnaround_time_minutes)
            ]);
            doc.autoTable({
                ...tableTheme,
                head: [['Date', 'Time', 'Service', 'Status', 'Teller', 'Handling', 'Turnaround']],
                body: transactionRows,
                startY: 39,
                headStyles: { ...tableTheme.headStyles, fontSize: 7 },
                bodyStyles: { ...tableTheme.bodyStyles, fontSize: 6.6, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 15 }, 2: { cellWidth: 35 }, 3: { cellWidth: 22 }, 4: { cellWidth: 32 }, 5: { cellWidth: 22 }, 6: { cellWidth: 23 } }
            });
        }

        // Consistent footer and page numbering on every page.
        const pageCount = doc.getNumberOfPages();
        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
            doc.setPage(pageNumber);
            const width = doc.internal.pageSize.getWidth();
            const height = doc.internal.pageSize.getHeight();
            doc.setDrawColor(...colors.border);
            doc.line(margin, height - 11, width - margin, height - 11);
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.8);
            doc.text(`OpenQ Operations / ${currentReportData.dateFrom} to ${currentReportData.dateTo}`, margin, height - 6);
            doc.text(`Page ${pageNumber} of ${pageCount}`, width - margin, height - 6, { align: 'right' });
        }

        doc.save(`report_${currentReportData.dateFrom}_to_${currentReportData.dateTo}.pdf`);
        Swal.fire('Success', 'PDF exported successfully', 'success');
        return doc;
    } catch (error) {
        console.error('PDF export error:', error);
        Swal.fire('Error', 'Failed to export PDF: ' + error.message, 'error');
    }
}

// Export report as Excel
function exportReportAsExcel() {
    if (!currentReportData) {
        Swal.fire('Error', 'Please generate a report first', 'error');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        const now = new Date().toLocaleString();

        // Summary sheet with header
        const summaryData = [
            ['TRANSACTION REPORT SUMMARY'],
            ['Generated on:', now],
            ['Report Period:', currentReportData.dateFrom + ' to ' + currentReportData.dateTo],
            [],
            ['Metric', 'Value'],
            ['Total Tickets', currentReportData.summary?.total_tickets || 0],
            ['Completed Tickets', currentReportData.summary?.completed_tickets || 0],
            ['Pending Tickets', currentReportData.summary?.pending_tickets || 0],
            ['Avg Service Time (minutes)', (currentReportData.summary?.avg_service_time_minutes || 0).toFixed(2)],
            ['Avg Turnaround Time (minutes)', (currentReportData.summary?.avg_turnaround_time_minutes || 0).toFixed(2)]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['A1'].font = { bold: true, size: 14 };
        summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        // By Service sheet
        const serviceData = [
            ['Service', 'Total Tickets', 'Completed', 'Pending', 'Avg Service Time']
        ];
        (currentReportData.byService || []).forEach(s => {
            serviceData.push([
                s.service_name || s.service_code || 'N/A',
                s.ticket_count || 0,
                s.completed || 0,
                s.pending || 0,
                (s.avg_service_time_minutes || 0).toFixed(2)
            ]);
        });
        const serviceSheet = XLSX.utils.aoa_to_sheet(serviceData);
        serviceSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, serviceSheet, 'By Service');

        // By Teller sheet
        const tellerData = [
            ['Teller Name', 'Counter', 'Tickets Served', 'Completed', 'Avg Service Time']
        ];
        (currentReportData.byTeller || []).forEach(t => {
            tellerData.push([
                t.teller_name || 'N/A',
                t.counter_number || 'N/A',
                t.tickets_served || 0,
                t.completed || 0,
                (t.avg_service_time_minutes || 0).toFixed(2)
            ]);
        });
        const tellerSheet = XLSX.utils.aoa_to_sheet(tellerData);
        tellerSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, tellerSheet, 'By Teller');

        // By Status sheet
        const statusData = [
            ['Status', 'Count', 'Percentage']
        ];
        const totalTickets = currentReportData.summary?.total_tickets || 0;
        (currentReportData.byStatus || []).forEach(s => {
            const percentage = totalTickets > 0 ? ((s.count / totalTickets) * 100).toFixed(1) : 0;
            statusData.push([
                s.status,
                s.count || 0,
                percentage + '%'
            ]);
        });
        const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
        statusSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, statusSheet, 'By Status');

        // Daily Trends sheet
        const trendsData = [
            ['Date', 'Daily Tickets', 'Completed', 'Avg Service Time']
        ];
        (currentReportData.dailyTrends || []).forEach(t => {
            trendsData.push([
                t.date,
                t.daily_tickets || 0,
                t.daily_completed || 0,
                (t.daily_avg_service_time || 0).toFixed(2)
            ]);
        });
        const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
        trendsSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, trendsSheet, 'Daily Trends');

        // Detailed Transactions sheet (full data)
        const detailedData = [
            ['DETAILED TRANSACTION LOG'],
            ['Generated on:', now],
            ['Report Period:', currentReportData.dateFrom + ' to ' + currentReportData.dateTo],
            [],
            ['Date', 'Time', 'Service Code', 'Service Name', 'Status', 'Teller Name', 'Counter', 'Service Time (min)', 'Turnaround Time (min)']
        ];
        (currentReportData.detailedTransactions || []).forEach(tx => {
            detailedData.push([
                tx.date || 'N/A',
                tx.time || 'N/A',
                tx.service_code || 'N/A',
                tx.service_name || 'N/A',
                tx.status || 'N/A',
                tx.teller_name || 'N/A',
                'N/A',
                (tx.service_time_minutes || 0).toFixed(2),
                (tx.turnaround_time_minutes || 0).toFixed(2)
            ]);
        });
        const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
        detailedSheet['A1'].font = { bold: true, size: 12 };
        detailedSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, detailedSheet, 'Transactions');

        // Save Excel file
        XLSX.writeFile(wb, `report_${currentReportData.dateFrom}_to_${currentReportData.dateTo}.xlsx`);
        Swal.fire('Success', 'Excel file exported successfully', 'success');
    } catch (error) {
        console.error('Excel export error:', error);
        Swal.fire('Error', 'Failed to export Excel: ' + error.message, 'error');
    }
}
