function displaytable4() {
    // 🔹 Check if DataTable already exists, then destroy it
    if ($.fn.DataTable.isDataTable('#adminTable')) {
        $('#adminTable').DataTable().clear().destroy();
    }

    // 🔹 Initialize DataTable
    let table = $('#adminTable').DataTable({
        processing: true,
        serverSide: true,
        pageLength: 10,
        responsive: true,
        language: { search: "Search records:" },
        order: [[3, 'asc']], // sort by Time
        ajax: function (data, callback, settings) {
            socket.emit("requestAdminDataforcontent4alldata", {
                start: data.start,
                length: data.length,
                order: data.order,
                search: data.search.value
            });

            // 🔸 Use socket.once to prevent multiple listeners stacking up
            socket.once("dashadmincontent4alldata", function (res) {
                callback({
                    draw: data.draw,
                    recordsTotal: res.recordsTotal,
                    recordsFiltered: res.recordsFiltered,
                    data: res.data.map(row => {
                        const historyBtn = row.history
                            ? `<button class="btn btn-sm btn-primary view-history" 
                                    data-history='${row.history}'
                                    data-sname='${row.sname}'
                                    data-ticket='${row.service + row.ticket}'>View</button>`
                            : "";

                        return [
                            row.sname,
                            row.service + row.ticket,
                            row.status,
                            row.time || "",
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

    // 🔹 Delegate history button clicks
    $('#adminTable').on('click', '.view-history', function () {
        const rawHistory = $(this).data('history');
        const sname = $(this).data('sname');
        const ticket = $(this).data('ticket');
        if (!rawHistory) return;

        const steps = rawHistory.split(";").filter(Boolean).map(item => {
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
        });
    });
