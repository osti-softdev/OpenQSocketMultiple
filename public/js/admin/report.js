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
    // const dateFrom = $('#report-date-from').val();
    const dateFrom = "2026-01-01";
    const dateTo = $('#report-date-to').val();
    console.log('📊 Generate Report clicked - From:', dateFrom, 'To:', dateTo);

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
            console.log('✅ Report data received:', data);
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
    console.log('📈 Displaying report data...');

    // Display Summary
    const summary = data.summary || {};
    console.log('Summary:', summary);
    $('#summary-total').text(summary.total_tickets || 0);
    $('#summary-completed').text(summary.completed_tickets || 0);
    $('#summary-voided').text(summary.voided_tickets || 0);
    $('#summary-avg-service').text(formatTime(summary.avg_service_time_minutes));
    $('#summary-avg-turnaround').text(formatTime(summary.avg_turnaround_time_minutes));

    // Display By Service
    console.log('By Service:', data.byService);
    displayByService(data.byService || []);

    // Display By Teller
    console.log('By Teller:', data.byTeller);
    displayByTeller(data.byTeller || []);

    // Display By Status
    console.log('By Status:', data.byStatus);
    displayByStatus(data.byStatus || [], summary.total_tickets || 0);

    // Display Daily Trends
    console.log('Daily Trends:', data.dailyTrends);
    displayDailyTrends(data.dailyTrends || []);

    // Display Detailed Transactions
    console.log('Detailed Transactions:', data.detailedTransactions);
    displayDetailedTransactions(data.detailedTransactions || []);

    // Display Charts
    displayTrendChart(data.detailedTransactions || []);
    displayServiceDistribChart(data.detailedTransactions || []);

    console.log('✅ All report sections displayed');
}

// Display Trend Chart — one line per service
function displayTrendChart(transactions) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;

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
        .filter(tx => tx.status && tx.status.toLowerCase() === 'finished')
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
    const palette = [
        { border: '#4e73df', bg: 'rgba(78,115,223,0.08)' },
        { border: '#1cc88a', bg: 'rgba(28,200,138,0.08)' },
        { border: '#e74a3b', bg: 'rgba(231,74,59,0.08)' },
        { border: '#f6c23e', bg: 'rgba(246,194,62,0.08)' },
        { border: '#36b9cc', bg: 'rgba(54,185,204,0.08)' },
        { border: '#6610f2', bg: 'rgba(102,16,242,0.08)' },
        { border: '#fd7e14', bg: 'rgba(253,126,20,0.08)' },
        { border: '#e83e8c', bg: 'rgba(232,62,140,0.08)' },
        { border: '#20c997', bg: 'rgba(32,201,151,0.08)' },
        { border: '#6c757d', bg: 'rgba(108,117,125,0.08)' },
    ];

    const serviceNames = Object.keys(serviceCounts);
    const datasets = serviceNames.map((svc, i) => {
        const color = palette[i % palette.length];
        return {
            label: svc,
            data: serviceCounts[svc],
            borderColor: color.border,
            backgroundColor: color.bg,
            pointRadius: 2,
            pointBackgroundColor: color.border,
            pointBorderColor: color.border,
            pointHoverRadius: 4,
            pointHitRadius: 10,
            pointBorderWidth: 1.5,
            tension: 0.3,
            fill: false,
            borderWidth: 2,
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
                    grid: { display: false, drawBorder: false },
                    ticks: { maxTicksLimit: 24, font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0, font: { size: 10 } },
                    grid: {
                        color: 'rgb(234,236,244)',
                        drawBorder: false,
                        borderDash: [2]
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11 },
                        padding: 10,
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    backgroundColor: 'rgb(255,255,255)',
                    bodyColor: '#858796',
                    titleColor: '#6e707e',
                    borderColor: '#dddfeb',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    intersect: true,
                    mode: 'nearest',
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

    const baseColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#858796', '#5a5c69', '#6610f2', '#e83e8c', '#fd7e14'
    ];
    const hoverColors = [
        '#2e59d9', '#17a673', '#2c9faf', '#dda20a', '#be2617',
        '#60616f', '#373840', '#520dc2', '#d62c7a', '#e36209'
    ];

    const backgroundColors = labels.map((_, i) => baseColors[i % baseColors.length]);
    const hoverBackgroundColors = labels.map((_, i) => hoverColors[i % hoverColors.length]);

    reportCharts.serviceDistribChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Finished Tickets',
                data: data,
                backgroundColor: backgroundColors,
                hoverBackgroundColor: hoverBackgroundColors,
                borderColor: backgroundColors,
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    grid: { color: "rgb(234, 236, 244)", zeroLineColor: "rgb(234, 236, 244)", drawBorder: false, borderDash: [2], zeroLineBorderDash: [2] }
                },
                y: {
                    grid: { display: false, drawBorder: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "rgb(255,255,255)",
                    bodyColor: "#858796",
                    titleColor: '#6e707e',
                    borderColor: '#dddfeb',
                    borderWidth: 1,
                    padding: 15,
                    displayColors: false,
                }
            }
        }
    });
}

// Display tickets by service
function displayByService(services) {
    console.log('🔧 displayByService called with:', services);
    const tbody = $('#reports-by-service');
    tbody.empty();

    if (!services || services.length === 0) {
        console.warn('No service data to display');
        tbody.append('<tr><td colspan="6" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    console.log(`Adding ${services.length} service rows`);
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
    console.log('✅ Service table populated');
}

// Display performance by teller
function displayByTeller(tellers) {
    console.log('🔧 displayByTeller called with:', tellers);
    const tbody = $('#reports-by-teller');
    tbody.empty();

    if (!tellers || tellers.length === 0) {
        console.warn('No teller data to display');
        tbody.append('<tr><td colspan="6" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    console.log(`Adding ${tellers.length} teller rows`);
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
    console.log('✅ Teller table populated');
}

// Display tickets by status
function displayByStatus(statuses, total) {
    console.log('🔧 displayByStatus called with:', statuses);
    const tbody = $('#reports-by-status');
    tbody.empty();

    if (!statuses || statuses.length === 0) {
        console.warn('No status data to display');
        tbody.append('<tr><td colspan="3" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    console.log(`Adding ${statuses.length} status rows`);
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
    console.log('✅ Status table populated');
}

// Display daily trends
function displayDailyTrends(trends) {
    console.log('🔧 displayDailyTrends called with:', trends);
    const tbody = $('#reports-daily-trends');
    tbody.empty();

    if (!trends || trends.length === 0) {
        console.warn('No trend data to display');
        tbody.append('<tr><td colspan="5" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    console.log(`Adding ${trends.length} trend rows`);
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
    console.log('✅ Trends table populated');
}

// Display detailed transactions
function displayDetailedTransactions(transactions) {
    console.log('🔧 displayDetailedTransactions called with:', transactions);
    const tbody = $('#reports-detailed-transactions');
    tbody.empty();

    if (!transactions || transactions.length === 0) {
        console.warn('No transaction data to display');
        tbody.append('<tr><td colspan="7" class="text-center" style="padding: 20px;">No data available</td></tr>');
        return;
    }

    const maxRows = Math.min(100, transactions.length);
    console.log(`Adding ${maxRows} transaction rows (out of ${transactions.length})`);

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
    console.log('✅ Transactions table populated');
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
        let yPosition = 15;
        const margin = 10;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const checkPageBreak = () => {
            if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 15;
            }
        };

        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('TRANSACTION REPORT', margin, yPosition);
        yPosition += 8;

        // Date range
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Report Period: ${currentReportData.dateFrom} to ${currentReportData.dateTo}`, margin, yPosition);
        yPosition += 8;
        doc.setDrawColor(150);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        // Summary Section
        checkPageBreak();
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('1. SUMMARY STATISTICS', margin, yPosition);
        yPosition += 8;

        const summary = currentReportData.summary || {};
        const summaryData = [
            ['Metric', 'Value'],
            ['Total Tickets', (summary.total_tickets || 0).toString()],
            ['Completed Tickets', (summary.completed_tickets || 0).toString()],
            ['Pending Tickets', (summary.pending_tickets || 0).toString()],
            ['Avg Service Time', formatTime(summary.avg_service_time_minutes)],
            ['Avg Turnaround Time', formatTime(summary.avg_turnaround_time_minutes)]
        ];

        doc.autoTable({
            head: [summaryData[0]],
            body: summaryData.slice(1),
            startY: yPosition,
            margin: margin,
            theme: 'striped',
            headStyles: { fillColor: [100, 100, 150], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 240, 250] }
        });

        yPosition = (doc.lastAutoTable?.finalY || yPosition + 30) + 10;

        // By Service
        checkPageBreak();
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('2. PERFORMANCE BY SERVICE', margin, yPosition);
        yPosition += 8;

        const serviceData = (currentReportData.byService || []).map(s => [
            s.service_name || s.service_code || 'N/A',
            (s.ticket_count || 0).toString(),
            (s.completed || 0).toString(),
            (s.pending || 0).toString(),
            formatTime(s.avg_service_time_minutes)
        ]);

        doc.autoTable({
            head: [['Service Name', 'Total Tickets', 'Completed', 'Pending', 'Avg Time']],
            body: serviceData,
            startY: yPosition,
            margin: margin,
            theme: 'striped',
            headStyles: { fillColor: [100, 100, 150], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 240, 250] }
        });

        yPosition = (doc.lastAutoTable?.finalY || yPosition + 30) + 10;

        // By Teller
        checkPageBreak();
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('3. PERFORMANCE BY TELLER', margin, yPosition);
        yPosition += 8;

        const tellerData = (currentReportData.byTeller || []).map(t => [
            t.teller_name || 'N/A',
            t.counter_number || 'N/A',
            (t.tickets_served || 0).toString(),
            (t.completed || 0).toString(),
            formatTime(t.avg_service_time_minutes)
        ]);

        doc.autoTable({
            head: [['Teller Name', 'Counter', 'Served', 'Completed', 'Avg Time']],
            body: tellerData,
            startY: yPosition,
            margin: margin,
            theme: 'striped',
            headStyles: { fillColor: [100, 100, 150], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 240, 250] }
        });

        yPosition = (doc.lastAutoTable?.finalY || yPosition + 30) + 10;

        // By Status
        checkPageBreak();
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('4. TICKET STATUS DISTRIBUTION', margin, yPosition);
        yPosition += 8;

        const totalTickets = currentReportData.summary?.total_tickets || 0;
        const statusData = (currentReportData.byStatus || []).map(s => {
            const percentage = totalTickets > 0 ? ((s.count / totalTickets) * 100).toFixed(1) : '0';
            return [
                s.status.charAt(0).toUpperCase() + s.status.slice(1),
                (s.count || 0).toString(),
                percentage + '%'
            ];
        });

        doc.autoTable({
            head: [['Status', 'Count', 'Percentage']],
            body: statusData,
            startY: yPosition,
            margin: margin,
            theme: 'striped',
            headStyles: { fillColor: [100, 100, 150], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 240, 250] }
        });

        // Daily Trends
        yPosition = (doc.lastAutoTable?.finalY || yPosition + 30) + 10;
        checkPageBreak();
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('5. DAILY TRENDS', margin, yPosition);
        yPosition += 8;

        const trendsData = (currentReportData.dailyTrends || []).map(t => [
            t.date,
            (t.daily_tickets || 0).toString(),
            (t.daily_completed || 0).toString(),
            formatTime(t.daily_avg_service_time)
        ]);

        doc.autoTable({
            head: [['Date', 'Daily Tickets', 'Completed', 'Avg Time']],
            body: trendsData,
            startY: yPosition,
            margin: margin,
            theme: 'striped',
            headStyles: { fillColor: [100, 100, 150], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [240, 240, 250] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 30 },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'center' }
            }
        });

        // Detailed Transactions (on separate pages)
        const transactions = currentReportData.detailedTransactions || [];
        if (transactions.length > 0) {
            doc.addPage();
            yPosition = 15;
            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.text('6. DETAILED TRANSACTION LOG', margin, yPosition);
            yPosition += 8;

            doc.setFontSize(9);
            doc.text(`Total Transactions: ${transactions.length}`, margin, yPosition);
            yPosition += 8;

            const txnData = transactions.slice(0, 300).map(tx => [
                tx.date || 'N/A',
                tx.time || 'N/A',
                tx.service_name || tx.service_code || 'N/A',
                (tx.status || 'N/A').charAt(0).toUpperCase() + (tx.status || 'N/A').slice(1),
                tx.teller_name || 'N/A',
                formatTime(tx.service_time_minutes),
                formatTime(tx.turnaround_time_minutes)
            ]);

            doc.autoTable({
                head: [['Date', 'Time', 'Service', 'Status', 'Teller', 'Service Time', 'Turnaround']],
                body: txnData,
                startY: yPosition,
                margin: margin,
                theme: 'striped',
                headStyles: { fillColor: [100, 100, 150], textColor: 255, fontStyle: 'bold', fontSize: 8 },
                bodyStyles: { fontSize: 7 },
                alternateRowStyles: { fillColor: [240, 240, 250] },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 16 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 18 },
                    4: { cellWidth: 22 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 20 }
                }
            });
        }

        // Footer with timestamp
        const timestamp = new Date().toLocaleString();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generated on ${timestamp}`, margin, pageHeight - 5);

        // Save PDF
        doc.save(`report_${currentReportData.dateFrom}_to_${currentReportData.dateTo}.pdf`);
        Swal.fire('Success', 'PDF exported successfully', 'success');
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
