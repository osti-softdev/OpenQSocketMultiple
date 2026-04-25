function initAdminTable(tableId) {
    // destroy if exists
    if ($.fn.DataTable.isDataTable(tableId)) {
        $(tableId).DataTable().clear().destroy();
    }

    return $(tableId).DataTable({
        processing: true,
        serverSide: true,
        pageLength: 10,
        responsive: true,
        language: { search: "Search records:" },
        order: [[5, 'desc']], // date column index (adjust if needed)

        ajax: function (data, callback) {
            // emit request
            socket.emit("requestAdminDataforcontent4alldata", {
                start: data.start,
                length: data.length,
                order: data.order,
                search: data.search.value
            });

            // IMPORTANT: use ONCE
            socket.once("dashadmincontent4alldata", function (res) {
                callback({
                    draw: data.draw,
                    recordsTotal: res.recordsTotal,
                    recordsFiltered: res.recordsFiltered,
                    data: res.data.map(row => {
                        const safeHistory = row.history
                            ? encodeURIComponent(JSON.stringify(row.history))
                            : "";

                        const historyBtn = row.history
                            ? `<button class="btn btn-sm btn-primary view-history" 
                                    data-history="${safeHistory}"
                                    data-sname="${row.sname}"
                                    data-ticket="${row.service + row.ticket}">
                                    View
                               </button>`
                            : "";

                        const snameseprate = row.sname?.replace(/_/g, " ") || "";

                        return [
                            snameseprate,
                            row.service + row.ticket,
                            row.status,
                            row.start_time || "",
                            row.end_time || "",
                            row.date,
                            historyBtn
                        ];
                    })
                });
            });
        }
    });
}

function displaytable4() {
    initAdminTable('#adminTable');
    initTellerTable('#adminTable2');
}

function initTellerTable(tableId) {
    if ($.fn.DataTable.isDataTable(tableId)) {
        $(tableId).DataTable().clear().destroy();
    }

    return $(tableId).DataTable({
        processing: true,
        serverSide: true,
        pageLength: 10,
        responsive: true,
        language: { search: "Search records:" },
        order: [[0, 'asc']], // default order by cname

        ajax: function (data, callback) {
            const datefrom = $('#startDate').val();
            const dateto = $('#endDate').val();

            socket.emit("requestAdminDataforcontent2tellers", {
                start: data.start,
                length: data.length,
                order: data.order,
                search: data.search.value,
                datefrom: datefrom,
                dateto: dateto
            });

            socket.once("dashadmincontent2tellers", function (res) {
                callback({
                    draw: data.draw,
                    recordsTotal: res.recordsTotal,
                    recordsFiltered: res.recordsFiltered,
                    data: res.data.map(row => {
                        return [
                            row.cname || "",
                            row.cnum || "",
                            row.total_served || 0,
                            row.total_voided || 0,
                            row.avg_serving_time || "00:00:00",
                            row.avg_waiting_time || "00:00:00",
                            `<button class="btn btn-sm btn-info view-teller-details" 
                                     data-cnum="${row.cnum}"
                                     data-cname="${row.cname}">
                                     View Details
                                </button>`
                        ];
                    })
                });
            });
        }
    });
}
    // 🔹 Delegate history button clicks (Use document to catch clicks inside SweetAlert modal too)
    $(document).on('click', '.view-history', function () {
        const rawHistory = $(this).data('history');
        const sname = $(this).data('sname');
        const ticket = $(this).data('ticket');
        const isFromTeller = $(this).data('from-teller');

        if (!rawHistory) return;

        let historyString = decodeURIComponent(rawHistory);
        try { historyString = JSON.parse(historyString); } catch(e){}

        const steps = historyString.split(";").filter(Boolean).map(item => {
            const clean = item.replace(/[\[\]]/g, "");
            const [time, actor, action] = clean.split("-");
            return { time, actor, action };
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

    // 🔹 Delegate view teller details clicks
    $('#adminTable2').on('click', '.view-teller-details', function () {
        const cnum = $(this).data('cnum');
        const cname = $(this).data('cname');
        const datefrom = $('#startDate').val();
        const dateto = $('#endDate').val();

        socket.emit("requestTellerDetails", { cnum, cname, datefrom, dateto });

        socket.once("tellerDetailsData", function (res) {
            const chartData = res.chartData || [];
            const pieData = res.pieData || [];
            const historyRows = res.historyRows || [];

            let historyHtml = historyRows.map(r => {
                const safeHistory = r.history ? encodeURIComponent(JSON.stringify(r.history)) : "";
                const historyBtn = r.history
                    ? `<button class="btn btn-sm btn-primary view-history" style="border-radius:20px; font-size:12px; font-weight:bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2); transition: all 0.3s ease;"
                            data-history="${safeHistory}"
                            data-sname="${r.sname}"
                            data-ticket="${r.service + r.ticket}"
                            data-from-teller="true">
                            View History
                       </button>`
                    : "";
                
                const sname_str = r.sname?.replace(/_/g, " ") || "";
                let statusBadge = r.status;
                if(r.status === 'finished') statusBadge = `<span style="background:#28a745; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">Finished</span>`;
                if(r.status === 'voided') statusBadge = `<span style="background:#dc3545; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">Voided</span>`;
                if(r.status === 'called' || r.status === 'calling') statusBadge = `<span style="background:#17a2b8; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">Serving</span>`;

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
                       <h3 style="margin:0; font-size:22px; color: #2c3e50; font-weight:700;">
                          Teller: <span style="color: #2980b9;">${cname}</span> 
                          <span style="font-size:14px; background:#e74c3c; color:white; padding:4px 8px; border-radius:12px; vertical-align:middle; margin-left:8px;">Counter ${cnum}</span>
                       </h3>
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
                        <div style="max-height: 300px; overflow-y: auto;">
                            <table style="width: 100%; text-align: left; font-size: 13px; border-collapse: collapse;">
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
                confirmButtonText: '<i class="fa fa-times"></i> Close Dashboard',
                confirmButtonColor: '#34495e',
                customClass: {
                    popup: 'teller-dashboard-popup'
                },
                didOpen: () => {
                    // Initialize Line Chart
                    const ctx = document.getElementById('tellerDetailsChart').getContext('2d');
                    const labels = chartData.map(d => d.date);
                    const served = chartData.map(d => d.served);
                    const voided = chartData.map(d => d.voided);

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
                                legend: { display: true, position: 'top', labels: { usePointStyle: true, boxWidth: 8 } }
                            },
                            scales: {
                                x: { grid: { display: false } },
                                y: { beginAtZero: true, grid: { borderDash: [5, 5], color: '#ecf0f1' }, suggestedMax: Math.max(...served, ...voided) + 5 }
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
                                }
                            }
                        },
                        plugins: [alwaysShowPieLabels]
                    });
                }
            };
            
            // Store globally so history view can restore it
            window.currentTellerDetailsSwal = swalConfig;
            Swal.fire(swalConfig);
        });
    });
