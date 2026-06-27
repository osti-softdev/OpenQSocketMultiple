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
        let capturedDateFrom = today;
        let capturedDateTo = today;

        function fetchAndRenderDashboard() {
            Swal.fire({ title: 'Loading Dashboard...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            requestTellerDetails(capturedDateFrom, capturedDateTo)
                .done(function (res) {
                    renderDashboard(res);
                })
                .fail(function (xhr) {
                    const message = xhr.responseJSON?.message || 'Failed to load report data.';
                    Swal.fire("Error", message, "error");
                });
        }

        function renderDashboard(res) {
            const chartData = res.chartData || [];
            const pieData = res.pieData || [];
            const historyRows = res.historyRows || [];
            const stats = calcPerformanceStats(historyRows, chartData);

            let historyHtml = historyRows.map(r => {
                const sname_str = r.sname?.replace(/_/g, " ") || "";
                let statusBadge = r.status;
                if (r.status === 'finished') statusBadge = `<span style="background:#28a745; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">Finished</span>`;
                if (r.status === 'voided') statusBadge = `<span style="background:#dc3545; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">Voided</span>`;
                if (r.status === 'called' || r.status === 'calling') statusBadge = `<span style="background:#17a2b8; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">Serving</span>`;

                const safeHistory = r.history ? encodeURIComponent(JSON.stringify(r.history)) : "";
                const historyBtn = r.history
                    ? `<button class="btn btn-sm btn-primary view-history" style="border-radius:20px; font-size:12px; font-weight:bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease; color: white; padding: 4px 10px; cursor: pointer;"
                                data-history="${safeHistory}"
                                data-sname="${r.sname}"
                                data-ticket="${r.service + r.ticket}"
                                data-from-teller="true">
                                View History
                           </button>`
                    : "";

                return `
                        <tr style="border-bottom: 1px solid #e0e0e0; transition: background 0.3s;" onmouseover="this.style.background='#f4f6f9'" onmouseout="this.style.background='transparent'">
                            <td style="padding:10px;">${sname_str}</td>
                            <td style="padding:10px; font-weight:bold; color:#333;">${r.service + r.ticket}</td>
                            <td style="padding:10px;">${statusBadge}</td>
                            <td style="padding:10px; color:#555;">${r.start_time || "-"}</td>
                            <td style="padding:10px; color:#555;">${r.end_time || "-"}</td>
                            <td style="padding:10px; color:#555;">${r.date}</td>
                            <td style="padding:10px;">${historyBtn}</td>
                        </tr>
                    `;
            }).join("");

            let html = `
                    <div style="font-family: 'Inter', sans-serif;">
                        <div style="text-align:center; margin-bottom:20px; padding: 15px; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                           <div style="display:flex; justify-content:center; gap:20px; margin-bottom:10px;">
                               <label>Date From: <input type="date" id="dashDateFrom" value="${capturedDateFrom}" style="padding:4px; border-radius:4px; border:1px solid #ccc;"></label>
                               <label>Date To: <input type="date" id="dashDateTo" value="${capturedDateTo}" style="padding:4px; border-radius:4px; border:1px solid #ccc;"></label>
                           </div>
                           <h3 style="margin:0; font-size:22px; color: #2c3e50; font-weight:700;">
                              Teller: <span style="color: #2980b9;">${cname}</span> 
                              <span style="font-size:14px; background:#e74c3c; color:white; padding:4px 8px; border-radius:12px; vertical-align:middle; margin-left:8px;">Counter ${cnum}</span>
                           </h3>
                        </div>
                        
                        <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 25px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 120px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center; border: 1px solid #eee;">
                                <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600;">Total Served</div>
                                <div style="font-size: 24px; color: #2ecc71; font-weight: bold; margin-top: 5px;">${stats.totalServed}</div>
                            </div>
                            <div style="flex: 1; min-width: 120px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center; border: 1px solid #eee;">
                                <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600;">Total Voided</div>
                                <div style="font-size: 24px; color: #e74c3c; font-weight: bold; margin-top: 5px;">${stats.totalVoided}</div>
                            </div>
                            <div style="flex: 1; min-width: 120px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center; border: 1px solid #eee;">
                                <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600;">Avg Serving</div>
                                <div style="font-size: 20px; color: #3498db; font-weight: bold; margin-top: 5px;">${stats.avgServing}</div>
                            </div>
                            <div style="flex: 1; min-width: 120px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center; border: 1px solid #eee;">
                                <div style="font-size: 12px; color: #7f8c8d; text-transform: uppercase; font-weight: 600;">Avg Turn-around</div>
                                <div style="font-size: 20px; color: #f39c12; font-weight: bold; margin-top: 5px;">${stats.avgTurnaround}</div>
                            </div>
                        </div>

                        <div style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; margin-bottom: 25px;">
                            <div style="flex: 1 1 55%; min-width:300px; height: 280px; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
                                <h4 style="margin-top:0; font-size:14px; color:#7f8c8d; text-align:left; margin-bottom:10px;">Performance Overview</h4>
                                <div style="height: 230px;"><canvas id="tellerDetailsChart"></canvas></div>
                            </div>
                            <div style="flex: 1 1 40%; min-width:250px; height: 280px; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
                                <h4 style="margin-top:0; font-size:14px; color:#7f8c8d; text-align:left; margin-bottom:10px;">Services Handled</h4>
                                <div style="height: 230px; position:relative;"><canvas id="tellerPieChart"></canvas></div>
                            </div>
                        </div>

                        <div style="background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee; overflow:hidden;">
                            <h4 style="margin:0; padding:15px; font-size:15px; background:#f8f9fa; color:#34495e; text-align:left; border-bottom: 1px solid #eee;">Recent Transactions</h4>
                            <div style="max-height: 300px; overflow-y: auto; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                                <table style="width: 100%; min-width: 600px; text-align: left; font-size: 13px; border-collapse: collapse;">
                                    <thead style="background: #ffffff; position: sticky; top: 0; z-index: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                        <tr>
                                            <th style="padding: 12px 10px; color:#7f8c8d; font-weight:600; text-transform:uppercase; font-size:11px;">Service</th>
                                            <th style="padding: 12px 10px; color:#7f8c8d; font-weight:600; text-transform:uppercase; font-size:11px;">Ticket</th>
                                            <th style="padding: 12px 10px; color:#7f8c8d; font-weight:600; text-transform:uppercase; font-size:11px;">Status</th>
                                            <th style="padding: 12px 10px; color:#7f8c8d; font-weight:600; text-transform:uppercase; font-size:11px;">Start</th>
                                            <th style="padding: 12px 10px; color:#7f8c8d; font-weight:600; text-transform:uppercase; font-size:11px;">End</th>
                                            <th style="padding: 12px 10px; color:#7f8c8d; font-weight:600; text-transform:uppercase; font-size:11px;">Date</th>
                                            <th style="padding: 12px 10px; color:#7f8c8d; font-weight:600; text-transform:uppercase; font-size:11px;">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${historyHtml || '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#95a5a6; font-style:italic;">No recent transactions found.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;

            const swalConfig = {
                html: html,
                width: 950,
                showConfirmButton: true,
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: '<i class="fa fa-times"></i> Close',
                denyButtonText: 'Export PDF',
                cancelButtonText: 'Export Excel',
                confirmButtonColor: '#34495e',
                denyButtonColor: '#e74c3c',
                cancelButtonColor: '#1f7a4d',
                customClass: {
                    popup: 'teller-dashboard-popup'
                },
                didOpen: () => {
                    document.getElementById('dashDateFrom').addEventListener('change', (e) => {
                        capturedDateFrom = e.target.value;
                        fetchAndRenderDashboard();
                    });
                    document.getElementById('dashDateTo').addEventListener('change', (e) => {
                        capturedDateTo = e.target.value;
                        fetchAndRenderDashboard();
                    });

                    // Initialize Line Chart
                    const ctx = document.getElementById('tellerDetailsChart').getContext('2d');
                    const labels = chartData.map(d => d.date);
                    const served = chartData.map(d => d.served);
                    const voided = chartData.map(d => d.voided);
                    const maxTickets = Math.max(0, ...served, ...voided);

                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: 'Served',
                                    data: served,
                                    borderColor: '#3498db',
                                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                    pointBackgroundColor: '#3498db',
                                    pointRadius: 4,
                                    fill: true,
                                    tension: 0.3
                                },
                                {
                                    label: 'Voided',
                                    data: voided,
                                    borderColor: '#e74c3c',
                                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                                    pointBackgroundColor: '#e74c3c',
                                    pointRadius: 4,
                                    fill: true,
                                    tension: 0.3
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
                                datalabels: { display: false } // disable datalabels inside UI charts if present globally
                            },
                            scales: {
                                x: { grid: { display: false } },
                                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#ecf0f1' }, suggestedMax: maxTickets + 5 }
                            }
                        }
                    });

                    // Custom plugin for pie labels
                    const alwaysShowPieLabels = {
                        id: 'alwaysShowPieLabels',
                        afterDraw: (chart) => {
                            const ctx = chart.ctx;
                            ctx.font = "bold 14px Inter, sans-serif";
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "#ffffff";

                            chart.data.datasets.forEach((dataset, i) => {
                                const meta = chart.getDatasetMeta(i);
                                meta.data.forEach((arc, index) => {
                                    const data = dataset.data[index];
                                    if (data > 0) {
                                        const centerPoint = arc.tooltipPosition();
                                        ctx.shadowColor = "rgba(0,0,0,0.5)";
                                        ctx.shadowBlur = 4;
                                        ctx.fillText(data, centerPoint.x, centerPoint.y);
                                        ctx.shadowBlur = 0; // reset
                                    }
                                });
                            });
                        }
                    };

                    // Initialize Pie Chart
                    const ctxPie = document.getElementById('tellerPieChart').getContext('2d');
                    const pieLabels = pieData.map(d => d.service);
                    const pieCounts = pieData.map(d => d.count);

                    const pieColors = ['#1abc9c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c', '#34495e', '#16a085', '#27ae60', '#2980b9'];

                    new Chart(ctxPie, {
                        type: 'doughnut',
                        data: {
                            labels: pieLabels.length ? pieLabels : ['No Data'],
                            datasets: [{
                                data: pieCounts.length ? pieCounts : [1],
                                backgroundColor: pieCounts.length ? pieColors : ['#ecf0f1'],
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '65%',
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'right',
                                    labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
                                },
                                datalabels: { display: false }
                            }
                        },
                        plugins: [alwaysShowPieLabels]
                    });
                }
            };

            window.currentTellerDetailsSwal = swalConfig;

            Swal.fire(swalConfig).then((result) => {
                if (result.isDenied) {
                    exportPDF(cnum, cname, capturedDateFrom, capturedDateTo);
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    exportExcel(cnum, cname, capturedDateFrom, capturedDateTo);
                }
            });
        }

        fetchAndRenderDashboard();
    }

    // 🔹 Delegate history button clicks (Use document to catch clicks inside SweetAlert modal too)
    $(document).on('click', '.view-history', function () {
        const rawHistory = $(this).data('history');
        const sname = $(this).data('sname');
        const ticket = $(this).data('ticket');
        const isFromTeller = $(this).data('from-teller');

        if (!rawHistory) return;

        let historyString = decodeURIComponent(rawHistory);
        try { historyString = JSON.parse(historyString); } catch (e) { }

        const steps = historyString.split(";").filter(Boolean).map(item => {
            const clean = item.replace(/[\[\]]/g, "");
            const parts = clean.split("-");
            return { time: parts[0], actor: parts[1], action: parts.slice(2).join("-") };
        });

        let html = `
                <div style="text-align:center; margin-bottom:12px; font-size:16px; font-weight:bold;">
                   <span style="color: blue;">${sname}</span> — Ticket <span style="color:red;">${ticket}</span>
                </div>
                <div style="text-align:left;font-size:14px;">`;

        steps.forEach((s) => {
            html += `
                    <div style="margin:8px 0;display:flex;align-items:center;">
                        <span style="font-weight:bold;color:#007bff;">${s.time}</span>
                        <span style="margin:0 6px;">➡️</span>
                        <span><i class="fa fa-user"></i> ${s.actor}</span>
                        <span style="margin:0 6px;">➜</span>
                        <span><i class="fa fa-flag-checkered"></i> ${s.action}</span>
                    </div>
                `;
        });
        html += `</div>`;

        Swal.fire({
            title: 'Ticket Journey',
            html: html,
            width: 600,
            confirmButtonText: 'Close'
        }).then(() => {
            if (isFromTeller && window.currentTellerDetailsSwal) {
                Swal.fire(window.currentTellerDetailsSwal);
            }
        });
    });

    function exportExcel(cnum, cname, datefrom, dateto) {
        Swal.fire({ title: 'Generating Excel Report...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        requestTellerDetails(datefrom, dateto)
            .done(function (res) {
                try {
                    console.log("Received Excel Data:", res);
                    generateExcel(res, cnum, cname, datefrom, dateto);
                } catch (err) {
                    console.error("Excel Gen Error:", err);
                    Swal.fire("Error", "Failed to generate Excel file: " + err.message, "error");
                }
            })
            .fail(function (xhr) {
                const message = xhr.responseJSON?.message || 'Failed to load report data.';
                Swal.fire("Error", message, "error");
            });
    }

    function exportPDF(cnum, cname, datefrom, dateto) {
        Swal.fire({ title: 'Generating PDF Report...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        requestTellerDetails(datefrom, dateto)
            .done(async function (res) {
                try {
                    console.log("Received PDF Data:", res);
                    if (!res || !res.historyRows || res.historyRows.length === 0) {
                        Swal.fire("Empty", "No transactions found for the selected date range.", "info");
                        return;
                    }
                    await generatePDF(res, cnum, cname, datefrom, dateto);
                } catch (err) {
                    console.error("PDF Gen Error:", err);
                    Swal.fire("Error", "Failed to generate PDF file: " + err.message, "error");
                }
            })
            .fail(function (xhr) {
                const message = xhr.responseJSON?.message || 'Failed to load report data.';
                Swal.fire("Error", message, "error");
            });
    }
});

function requestTellerDetails(datefrom, dateto) {
    return $.ajax({
        url: '/api/teller/report-data',
        method: 'GET',
        data: { datefrom, dateto }
    });
}

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
    const pdfTableMargin = { left: 14, right: 14 };
    const pdfTableWidth = 182;

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
                margin: pdfTableMargin,
                tableWidth: pdfTableWidth,
                styles: { fontSize: 7.5, halign: "center", cellPadding: 1.5, overflow: "linebreak" },
                headStyles: { fillColor: [39, 174, 96], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 34 },
                    1: { cellWidth: 24 },
                    2: { cellWidth: 38 },
                    3: { cellWidth: 43 },
                    4: { cellWidth: 43 }
                }
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
                margin: pdfTableMargin,
                tableWidth: pdfTableWidth,
                styles: { fontSize: 7.5, halign: "center", cellPadding: 1.4, overflow: "linebreak" },
                headStyles: { fillColor: [231, 76, 60], textColor: 255 },
                columnStyles: {
                    0: { cellWidth: 24 },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 42 },
                    3: { cellWidth: 24 },
                    4: { cellWidth: 24 },
                    5: { cellWidth: 24 },
                    6: { cellWidth: 22 }
                }
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

