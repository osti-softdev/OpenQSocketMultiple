$(document).ready(function () {
    $(".reportbtn").click(function () {
        showExportPopup();
    });

    function showExportPopup() {
        const authUser = JSON.parse(localStorage.getItem("authUser"));
        if (!authUser) {
            Swal.fire("Error", "User session not found. Please log in again.", "error");
            return;
        }
        const cnum = authUser.cnum;
        const cname = authUser.cname;

        // Set default date to Today
        const today = new Date().toISOString().split('T')[0];

        // *** FIX: Capture dates in closure vars — preConfirm only fires for Confirm, NOT Deny ***
        let capturedDateFrom = today;
        let capturedDateTo = today;

        Swal.fire({
            title: 'Export File',
            html: `
          <div style="text-align:left">
            <label for="dateFrom">Date From:</label>
            <input type="date" id="dateFrom" class="swal2-input" value="${today}" style="margin-bottom:10px">
            <br>
            <label for="dateTo">Date To:</label>
            <input type="date" id="dateTo" class="swal2-input" value="${today}">
          </div>
        `,
            icon: 'question',
            showConfirmButton: true,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Export Excel',
            denyButtonText: 'Export PDF',
            cancelButtonText: 'Cancel',
            showCloseButton: true,
            didOpen: () => {
                // Keep closure vars updated as user changes the dates
                document.getElementById('dateFrom').addEventListener('change', (e) => {
                    capturedDateFrom = e.target.value;
                });
                document.getElementById('dateTo').addEventListener('change', (e) => {
                    capturedDateTo = e.target.value;
                });
            },
            preDeny: () => {
                // Capture dates when PDF button clicked (Deny fires preDeny, not preConfirm)
                capturedDateFrom = document.getElementById('dateFrom').value;
                capturedDateTo = document.getElementById('dateTo').value;
                return true; // allow the dialog to close
            },
            preConfirm: () => {
                capturedDateFrom = document.getElementById('dateFrom').value;
                capturedDateTo = document.getElementById('dateTo').value;
                return true;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                exportExcel(cnum, cname, capturedDateFrom, capturedDateTo);
            } else if (result.isDenied) {
                exportPDF(cnum, cname, capturedDateFrom, capturedDateTo);
            }
        });
    }

    function exportExcel(cnum, cname, datefrom, dateto) {
        Swal.fire({ title: 'Generating Excel Report...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        socket.once("tellerDetailsData", function (res) {
            try {
                console.log("📥 Received Excel Data:", res);
                generateExcel(res, cnum, cname, datefrom, dateto);
            } catch (err) {
                console.error("❌ Excel Gen Error:", err);
                Swal.fire("Error", "Failed to generate Excel file: " + err.message, "error");
            }
        });
        socket.emit("requestTellerDetails", { cnum, cname, datefrom, dateto });
    }

    function exportPDF(cnum, cname, datefrom, dateto) {
        Swal.fire({ title: 'Generating PDF Report...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        socket.once("tellerDetailsData", async function (res) {
            try {
                console.log("📥 Received PDF Data:", res);
                if (!res || !res.historyRows || res.historyRows.length === 0) {
                    Swal.fire("Empty", "No transactions found for the selected date range.", "info");
                    return;
                }
                await generatePDF(res, cnum, cname, datefrom, dateto);
            } catch (err) {
                console.error("❌ PDF Gen Error:", err);
                Swal.fire("Error", "Failed to generate PDF file: " + err.message, "error");
            }
        });
        socket.emit("requestTellerDetails", { cnum, cname, datefrom, dateto });
    }
});

async function generateOffscreenChart(chartType, data, options) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const cw = options.width || 600;
        const ch = options.height || 300;
        canvas.width = cw;
        canvas.height = ch;
        canvas.style.position = 'absolute';
        canvas.style.left = '-9999px';
        canvas.style.visibility = 'hidden';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // Strip width/height — those are canvas attributes, not Chart.js options
        const { width, height, ...chartOptions } = options;

        // Ensure datalabels plugin is registered for this chart instance
        const plugins = [];
        if (window.ChartDataLabels) {
            Chart.register(window.ChartDataLabels);
        }

        const myChart = new Chart(ctx, {
            type: chartType,
            data: data,
            options: { ...chartOptions, animation: { duration: 0 } },
            plugins: plugins
        });

        // Give Chart.js enough time to fully render labels before capture
        setTimeout(() => {
            const imgBase64 = canvas.toDataURL("image/png");
            myChart.destroy();
            document.body.removeChild(canvas);
            resolve(imgBase64);
        }, 600);
    });
}

function calcPerformanceStats(historyRows, chartData) {
    function timeToMs(t) {
        if (!t) return null;
        const parts = t.split(':');
        if (parts.length < 2) return null;
        return ((+parts[0] || 0) * 3600 + (+parts[1] || 0) * 60 + (+parts[2] || 0)) * 1000;
    }
    function fmtDuration(ms) {
        if (!ms || ms <= 0) return 'N/A';
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    const totalServed = (chartData || []).reduce((sum, d) => sum + (d.served || 0), 0);
    const totalVoided = (chartData || []).reduce((sum, d) => sum + (d.voided || 0), 0);

    let totalServingMs = 0, servingCount = 0;
    let totalTurnaroundMs = 0, turnaroundCount = 0;

    (historyRows || []).forEach(r => {
        const startMs = timeToMs(r.start_time);
        const endMs = timeToMs(r.end_time);
        if (startMs !== null && endMs !== null && endMs > startMs) {
            totalServingMs += endMs - startMs;
            servingCount++;
        }
        const queueMs = timeToMs(r.time);
        if (queueMs !== null && endMs !== null && endMs > queueMs) {
            totalTurnaroundMs += endMs - queueMs;
            turnaroundCount++;
        }
    });

    return {
        totalServed,
        totalVoided,
        avgServing: fmtDuration(servingCount ? Math.round(totalServingMs / servingCount) : 0),
        avgTurnaround: fmtDuration(turnaroundCount ? Math.round(totalTurnaroundMs / turnaroundCount) : 0)
    };
}

// Builds a per-date breakdown table from chartData + historyRows
function calcDailyStats(historyRows, chartData) {
    function timeToMs(t) {
        if (!t) return null;
        const parts = t.split(':');
        if (parts.length < 2) return null;
        return ((+parts[0] || 0) * 3600 + (+parts[1] || 0) * 60 + (+parts[2] || 0)) * 1000;
    }
    function fmtDuration(ms) {
        if (!ms || ms <= 0) return 'N/A';
        const s = Math.floor(ms / 1000);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    // Group historyRows by date for time calculations
    const dateTimeMap = {};
    (historyRows || []).forEach(r => {
        const d = r.date || 'Unknown';
        if (!dateTimeMap[d]) dateTimeMap[d] = { servingMs: 0, servingN: 0, turnaroundMs: 0, turnaroundN: 0 };
        const startMs = timeToMs(r.start_time);
        const endMs = timeToMs(r.end_time);
        if (startMs !== null && endMs !== null && endMs > startMs) {
            dateTimeMap[d].servingMs += endMs - startMs;
            dateTimeMap[d].servingN++;
        }
        const queueMs = timeToMs(r.time);
        if (queueMs !== null && endMs !== null && endMs > queueMs) {
            dateTimeMap[d].turnaroundMs += endMs - queueMs;
            dateTimeMap[d].turnaroundN++;
        }
    });

    return (chartData || []).map(d => {
        const t = dateTimeMap[d.date] || {};
        return {
            date: d.date,
            served: d.served || 0,
            voided: d.voided || 0,
            avgServing: fmtDuration(t.servingN ? Math.round(t.servingMs / t.servingN) : 0),
            avgTurnaround: fmtDuration(t.turnaroundN ? Math.round(t.turnaroundMs / t.turnaroundN) : 0)
        };
    });
}

async function generatePDF(specificData, cnum, cname, datefrom, dateto) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const today = new Date().toISOString().split('T')[0];

    pdf.setFontSize(20);
    pdf.text("OpenQ Management System", 105, 18, { align: "center" });
    pdf.setFontSize(12);

    let specificLineChartImg = null;
    let specificPieChartImg = null;

    // --- Safe Chart Generation ---
    try {
        if (specificData && specificData.chartData && specificData.chartData.length) {
            const lineLabels = specificData.chartData.map(d => String(d.date));
            const lineServed = specificData.chartData.map(d => Number(d.served || 0));
            const lineVoided = specificData.chartData.map(d => Number(d.voided || 0));

            specificLineChartImg = await generateOffscreenChart('line', {
                labels: lineLabels,
                datasets: [
                    { label: 'Served', data: lineServed, borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.2)', fill: true, tension: 0.3, pointRadius: 5, pointHoverRadius: 7 },
                    { label: 'Voided', data: lineVoided, borderColor: '#e74c3c', backgroundColor: 'rgba(231, 76, 60, 0.2)', fill: true, tension: 0.3, pointRadius: 5, pointHoverRadius: 7 }
                ]
            }, {
                responsive: false,
                maintainAspectRatio: false,
                width: 900, height: 400,
                plugins: {
                    legend: { display: true, position: 'top' },
                    datalabels: {
                        display: true,
                        align: 'top',
                        anchor: 'end',
                        color: '#333',
                        font: { size: 11, weight: 'bold' },
                        formatter: (value) => value > 0 ? value : ''
                    }
                },
                scales: {
                    x: { ticks: { font: { size: 10 } } },
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } }
                }
            });
        }
    } catch (e) { console.error("Line Chart Error:", e); }

    try {
        if (specificData && specificData.pieData && specificData.pieData.length) {
            const pieLabels = specificData.pieData.map(d => String(d.service || d.teller || "Unknown"));
            const pieCounts = specificData.pieData.map(d => Number(d.count || 0));
            const pieTotal = pieCounts.reduce((s, v) => s + v, 0);
            const pieColors = ['#1abc9c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c', '#34495e', '#16a085', '#27ae60', '#2980b9'];

            specificPieChartImg = await generateOffscreenChart('doughnut', {
                labels: pieLabels,
                datasets: [{
                    data: pieCounts,
                    backgroundColor: pieColors
                }]
            }, {
                responsive: false,
                maintainAspectRatio: false,
                cutout: '55%',
                width: 700, height: 380,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { font: { size: 12 }, padding: 16, boxWidth: 14 }
                    },
                    datalabels: {
                        display: true,
                        color: '#fff',
                        font: { size: 12, weight: 'bold' },
                        formatter: (value) => {
                            if (!pieTotal || value === 0) return '';
                            const pct = Math.round((value / pieTotal) * 100);
                            return `${value}\n(${pct}%)`;
                        }
                    }
                }
            });
        }
    } catch (e) { console.error("Pie Chart Error:", e); }

    // --- Performance Stats ---
    const stats = calcPerformanceStats(specificData.historyRows, specificData.chartData);

    pdf.text(`Teller Performance Report`, 105, 26, { align: "center" });

    // Summary table at top
    let customY = 32;
    pdf.autoTable({
        startY: customY,
        head: [],
        body: [
            ['Report Period', `${datefrom || 'N/A'}  →  ${dateto || 'N/A'}`],
            ['Teller Name', String(cname)],
            ['Counter Number', String(cnum)],
            ['Total Served', String(stats.totalServed)],
            ['Total Voided / Unserved', String(stats.totalVoided)],
            ['Avg. Serving Time', String(stats.avgServing)],
            ['Avg. Turnaround Time', String(stats.avgTurnaround)]
        ],
        theme: 'grid',
        styles: { fontSize: 9, halign: 'left' },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255, cellWidth: 70 },
            1: { cellWidth: 110 }
        }
    });
    customY = pdf.lastAutoTable.finalY + 10;

    // --- Line chart: full width ---
    if (specificLineChartImg) {
        if (customY + 55 > 270) { pdf.addPage(); customY = 20; }
        pdf.addImage(specificLineChartImg, 'PNG', 14, customY, 180, 80);
        customY += 85;
    }
    // --- Pie chart: full width, below the line chart ---
    if (specificPieChartImg) {
        if (customY + 55 > 270) { pdf.addPage(); customY = 20; }
        pdf.addImage(specificPieChartImg, 'PNG', 14, customY, 180, 80);
        customY += 20;
    }

    if (specificData && specificData.historyRows && specificData.historyRows.length) {
        console.log("📄 Generating Table for PDF. First Row Data:", specificData.historyRows[0]);

        // --- Always start tables on page 2 so charts fill page 1 ---
        pdf.addPage();
        customY = 20;

        // --- Daily Breakdown Table ---
        const dailyRows = calcDailyStats(specificData.historyRows, specificData.chartData);
        if (dailyRows.length) {
            pdf.setFontSize(10);
            pdf.text("Daily Breakdown", 14, customY);
            pdf.autoTable({
                startY: customY + 4,
                head: [["Date", "Served", "Voided / Unserved", "Avg. Serving Time", "Avg. Turnaround Time"]],
                body: dailyRows.map(r => [
                    String(r.date),
                    String(r.served),
                    String(r.voided),
                    String(r.avgServing),
                    String(r.avgTurnaround)
                ]),
                theme: "grid",
                styles: { fontSize: 8, halign: "center" },
                headStyles: { fillColor: [39, 174, 96], textColor: 255 }
            });
            customY = pdf.lastAutoTable.finalY + 10;
        }

        // --- Transactions Table ---
        if (customY + 40 > 270) { pdf.addPage(); customY = 20; }
        pdf.setFontSize(10);
        pdf.text("Transactions", 14, customY);

        const head = [["Date", "Ticket", "Service", "Start Time", "End Time", "Queue Time", "Status"]];
        const body = specificData.historyRows.map(r => [
            String(r.date || ""),
            String((r.service || "") + (r.ticket || "")),
            String(r.sname || ""),
            String(r.start_time || ""),
            String(r.end_time || ""),
            String(r.time || ""),
            String(r.status || "")
        ]);

        if (typeof pdf.autoTable === 'function') {
            pdf.autoTable({
                startY: customY + 4,
                head: head,
                body: body,
                theme: "striped",
                styles: { fontSize: 8, halign: "center" },
                headStyles: { fillColor: [231, 76, 60], textColor: 255 }
            });
        } else {
            console.error("❌ autoTable plugin NOT found on pdf instance");
        }
    }

    pdf.save(`OpenQ_TellerReport_${cname}_${today}.pdf`);
    Swal.close();
}

function generateExcel(specificData, cnum, cname, datefrom, dateto) {
    Swal.close();
    const wb = XLSX.utils.book_new();
    const today = new Date().toISOString().split('T')[0];

    wb.Props = {
        Title: `OpenQ Teller Report - ${cname}`,
        Author: "OpenQ System",
        CreatedDate: new Date()
    };

    const stats = calcPerformanceStats(specificData ? specificData.historyRows : [], specificData ? specificData.chartData : []);

    // --- Sheet 1: Performance Summary ---
    const summaryData = [
        ['OpenQ Management System'],
        ['Teller Performance Report'],
        [],
        ['Report Period', `${datefrom || 'N/A'} to ${dateto || 'N/A'}`],
        ['Teller Name', String(cname)],
        ['Counter Number', String(cnum)],
        [],
        ['Performance Summary'],
        ['Total Served', stats.totalServed],
        ['Total Voided / Unserved', stats.totalVoided],
        ['Avg. Serving Time', stats.avgServing],
        ['Avg. Turnaround Time', stats.avgTurnaround]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 28 }, { wch: 30 }];
    wb.SheetNames.push("Summary");
    wb.Sheets["Summary"] = summarySheet;

    // --- Sheet 2: Daily Breakdown ---
    const dailyBreakdown = calcDailyStats(
        specificData ? specificData.historyRows : [],
        specificData ? specificData.chartData : []
    );
    const dailyHeader = [['Date', 'Total Served', 'Total Voided / Unserved', 'Avg. Serving Time', 'Avg. Turnaround Time']];
    const dailyRows = dailyBreakdown.map(r => [
        r.date, r.served, r.voided, r.avgServing, r.avgTurnaround
    ]);
    const dailySheet = XLSX.utils.aoa_to_sheet(dailyHeader.concat(dailyRows));
    dailySheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 22 }];
    wb.SheetNames.push("Daily Breakdown");
    wb.Sheets["Daily Breakdown"] = dailySheet;

    // --- Sheet 3: Transactions ---
    if (specificData && specificData.historyRows && specificData.historyRows.length) {
        const txHeader = [['Date', 'Ticket', 'Service', 'Start Time', 'End Time', 'Queue Time', 'Status']];
        const txRows = specificData.historyRows.map(r => [
            r.date || '',
            (r.service || '') + (r.ticket || ''),
            r.sname || '',
            r.start_time || '',
            r.end_time || '',
            r.time || '',
            r.status || ''
        ]);
        const txSheet = XLSX.utils.aoa_to_sheet(txHeader.concat(txRows));
        txSheet['!cols'] = [
            { wch: 14 }, { wch: 10 }, { wch: 22 },
            { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }
        ];
        wb.SheetNames.push("Transactions");
        wb.Sheets["Transactions"] = txSheet;
    } else {
        wb.SheetNames.push("Transactions");
        wb.Sheets["Transactions"] = XLSX.utils.aoa_to_sheet([['No transactions found for selected date range.']]);
    }

    XLSX.writeFile(wb, `OpenQ_TellerReport_${cname}_${today}.xlsx`);
}

