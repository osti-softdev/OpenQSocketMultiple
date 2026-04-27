$(function () {
    $(".exportbtns").on("click", async function () {
        const id = $(this).data("identifier");

        if (id === "exportCSV") {
            await generateCSV();
            return;
        }

        const { value: exportMode } = await Swal.fire({
            title: 'Select Export Data',
            input: 'select',
            inputOptions: {
                overall: 'Overall Data',
                all_services: 'All Services',
                all_counters: 'All Counters',
                specific_service: 'Specific Service',
                specific_counter: 'Specific Counter'
            },
            inputPlaceholder: 'Select an option',
            showCancelButton: true,
            confirmButtonText: 'Next',
            confirmButtonColor: '#3498db'
        });

        if (!exportMode) return;

        let exportTarget = null;
        let exportTargetName = null;

        if (exportMode === "specific_service") {
            const srvOpts = {};
            if ($.fn.DataTable.isDataTable('#adminTable3')) {
                $('#adminTable3').DataTable().rows().data().toArray().forEach(row => {
                    const sname = $("<div>").html(row[0]).text().trim();
                    srvOpts[sname] = sname;
                });
            }
            const { value: selectedSrv } = await Swal.fire({
                title: 'Select Service',
                input: 'select',
                inputOptions: srvOpts,
                showCancelButton: true
            });
            if (!selectedSrv) return;
            exportTarget = selectedSrv;
            exportTargetName = srvOpts[selectedSrv];
        } else if (exportMode === "specific_counter") {
            const ctrOpts = {};
            if ($.fn.DataTable.isDataTable('#adminTable2')) {
                $('#adminTable2').DataTable().rows().data().toArray().forEach(row => {
                    const cname = $("<div>").html(row[0]).text().trim();
                    const cnum = $("<div>").html(row[1]).text().trim();
                    ctrOpts[cnum + "|" + cname] = `${cname} (Counter ${cnum})`;
                });
            }
            const { value: selectedCtr } = await Swal.fire({
                title: 'Select Counter',
                input: 'select',
                inputOptions: ctrOpts,
                showCancelButton: true
            });
            if (!selectedCtr) return;
            exportTarget = selectedCtr;
            exportTargetName = ctrOpts[selectedCtr];
        }

        if (id === "exportPDF") {
            if (exportMode === "overall" || exportMode === "all_counters" || exportMode === "all_services") {
                const saveTasks = [];
                if (typeof barChartContent2 !== "undefined" && barChartContent2) saveTasks.push(saveChartImage(barChartContent2, "bar_chart"));
                if (typeof hourChart !== "undefined" && hourChart) saveTasks.push(saveChartImage(hourChart, "hourly_chart"));
                if (typeof dailyChart !== "undefined" && dailyChart) saveTasks.push(saveChartImage(dailyChart, "daily_chart"));
                if (typeof monthChart !== "undefined" && monthChart) saveTasks.push(saveChartImage(monthChart, "monthly_chart"));
                await Promise.all(saveTasks);
            }
            await generatePDF(exportMode, exportTarget, exportTargetName);
        } else if (id === "exportExcel") {
            generateExcel(exportMode, exportTarget, exportTargetName);
        }
    });
});

let latestRawData = [];
let latestAverages = [];
let latestAveragestransactions = [];
let latestAveragesfeedback = [];

function setRawData(data) { latestRawData = data; }
function setRawAverages(data) { latestAverages = data; }
function setRawAveragestransactions(data) { latestAveragestransactions = data; }
function setRawAveragesfeedback(data) { latestAveragesfeedback = data; }

function getValue(selector, fallback = "0") {
    let txt = $(selector).text().trim();
    if (!txt) return fallback;
    if (txt.includes(":")) return txt.split(":").pop().trim();
    return txt;
}

function getAllTransactionsData() {
    return new Promise((resolve) => {
        socket.once("dashadmincontent4alldata", function (res) {
            resolve(res.data || []);
        });
        socket.emit("requestAdminDataforcontent4alldata", {
            start: 0,
            length: -1,
            order: [{ column: 6, dir: "desc" }],
            search: ""
        });
    });
}
// ---------------- DYNAMIC OVRCOUNT SCANNER ----------------
function getAllOvrCnt() {
    const result = {};

    $("[data-ovrcnt]").each(function () {
        const key = $(this).data("ovrcnt");
        let value = $(this).find(".overcountdata").text().trim();
        if (!value) {
            value = $(this).text().trim() || $(this).val() || "0";
        }
        result[key] = value;
    });

    return result;
}
// ---------------- CSV EXPORT ----------------
async function generateCSV() {
    let csvContent = "";
    const today = new Date().toLocaleDateString();

    // --- Overview Section ---
    const totalCount = getValue(".content2totalcount", "0");
    const totalRated = getValue(".content2totalrated", "0");
    const totalServed = getValue(".content2totalserved", "0");
    const totalUnserved = getValue(".content2totalunserved", "0");
    const mostService = getValue(".content2commonservice", "None");
    const mostRating = getValue(".content2commonrating", "None");

    csvContent += "Overview\n";
    if (withfeedback) {
        csvContent += ["Total Transactions", "Total Rated", "Total Served", "Total Unserved", "Most Service", "Most Rating"].join(",") + "\n";
        csvContent += [totalCount, totalRated, totalServed, totalUnserved, mostService, mostRating].map(c => `"${c}"`).join(",") + "\n\n";
    } else {
        csvContent += ["Total Transactions", "Total Served", "Total Unserved", "Most Service"].join(",") + "\n";
        csvContent += [totalCount, totalServed, totalUnserved, mostService].map(c => `"${c}"`).join(",") + "\n\n";
    }


    if (withfeedback) {
        // --- Feedback Section ---
        if (latestAveragesfeedback && latestAveragesfeedback.length > 0) {
            csvContent += "Feedback\n";
            csvContent += ["Date", "Satisfied", "Unsatisfied"].join(",") + "\n";
            latestAveragesfeedback.forEach(fb => {
                csvContent += [fb.date, fb.satisfied_count || 0, fb.unsatisfied_count || 0].map(c => `"${c}"`).join(",") + "\n";
            });
            csvContent += "\n";
        }
    }

    // --- Transactions Avg/Date Section ---
    // --- Transactions Avg/Date Section ---
    if (latestAveragestransactions && latestAveragestransactions.length > 0) {
        csvContent += "Transactions Avg/Date\n";
        csvContent += ["Date", "Total"].join(",") + "\n";

        let totalTransactions = 0;
        let countDates = latestAveragestransactions.length;

        // List all transactions with totals but no avg
        latestAveragestransactions.forEach(tr => {
            csvContent += [tr.date, tr.total_transactions || 0].map(c => `"${c}"`).join(",") + "\n";
            totalTransactions += tr.total_transactions || 0;
        });

        // Add the overall average per date only once
        const avgPerDate = countDates ? Math.round(totalTransactions / countDates) : 0;
        csvContent += `,"Average per Date","${avgPerDate}"\n\n`;
    }


    // --- Time Averages Section ---
    if (latestAverages && latestAverages.length > 0) {
        const headers = ["Service", "Average Waiting", "Serving Time", "Turnaround Time"];
        csvContent += "Time Averages\n";
        csvContent += headers.join(",") + "\n";
        latestAverages.forEach(row => {
            csvContent += [row.sname || "", row.average_waiting || "", row.serving_time || "", row.turnaround_time || ""]
                .map(c => `"${c}"`).join(",") + "\n";
        });
    }

    // --- Transactions Section ---
    const allTxData = await getAllTransactionsData();
    if (allTxData && allTxData.length > 0) {
        const headers = ["Service Name", "Ticket", "Status", "Time", "Start Time", "End Time", "Date", "History"];
        csvContent += "\nTransactions\n";
        csvContent += headers.join(",") + "\n";
        allTxData.forEach(row => {
            csvContent += [
                row.sname || "",
                (row.service || "") + (row.ticket || ""),
                row.status || "",
                row.time || "",
                row.start_time || "",
                row.end_time || "",
                row.date || "",
                row.history || ""
            ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(",") + "\n";
        });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `OpenQ_Report_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ---------------- PDF EXPORT ----------------
function getSpecificExportData(mode, target) {
    return new Promise((resolve) => {
        const datefrom = $('#startDate').val();
        const dateto = $('#endDate').val();

        if (mode === "specific_counter") {
            socket.once("tellerDetailsData", function (res) { resolve(res); });
            const [cnum, cname] = target.split("|");
            socket.emit("requestTellerDetails", { cnum, cname, datefrom, dateto });
        } else if (mode === "specific_service") {
            socket.once("serviceDetailsData", function (res) { resolve(res); });
            socket.emit("requestServiceDetails", { sname: target, datefrom, dateto });
        } else {
            resolve(null);
        }
    });
}

async function generateOffscreenChart(chartType, data, options) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = options.width || 600;
        canvas.height = options.height || 300;
        canvas.style.position = 'absolute';
        canvas.style.visibility = 'hidden';
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const myChart = new Chart(ctx, {
            type: chartType,
            data: data,
            options: { ...options, animation: { duration: 0 } }
        });

        setTimeout(() => {
            const imgBase64 = canvas.toDataURL("image/png");
            myChart.destroy();
            document.body.removeChild(canvas);
            resolve(imgBase64);
        }, 300);
    });
}

async function generatePDF(mode = "overall", target = null, targetName = null) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const today = new Date().toLocaleDateString();

    pdf.setFontSize(20);
    pdf.text("OpenQ Management System", 105, 18, { align: "center" });
    pdf.setFontSize(12);

    if (mode === "specific_counter" || mode === "specific_service") {
        Swal.fire({ title: 'Generating Report...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const specificData = await getSpecificExportData(mode, target);

        let specificLineChartImg = null;
        let specificPieChartImg = null;

        if (specificData && specificData.chartData) {
            const lineLabels = specificData.chartData.map(d => d.date);
            const lineServed = specificData.chartData.map(d => d.served);
            const lineVoided = specificData.chartData.map(d => d.voided);

            specificLineChartImg = await generateOffscreenChart('line', {
                labels: lineLabels,
                datasets: [
                    {
                        label: 'Served',
                        data: lineServed,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Voided',
                        data: lineVoided,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.2)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            }, { responsive: false, maintainAspectRatio: false, width: 900, height: 400 });
        }

        if (specificData && specificData.pieData) {
            const pieLabels = specificData.pieData.map(d => d.service || d.teller || "Unknown");
            const pieCounts = specificData.pieData.map(d => d.count);

            const pieColors = ['#1abc9c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#e74c3c', '#34495e', '#16a085', '#27ae60', '#2980b9'];

            specificPieChartImg = await generateOffscreenChart('doughnut', {
                labels: pieLabels.length ? pieLabels : ['No Data'],
                datasets: [{
                    data: pieCounts.length ? pieCounts : [1],
                    backgroundColor: pieCounts.length ? pieColors : ['#ecf0f1']
                }]
            }, { responsive: false, maintainAspectRatio: false, cutout: '65%', width: 400, height: 400 });
        }

        Swal.close();

        pdf.text(`Performance Report`, 105, 26, { align: "center" });

        let customY = 35;

        // --- ADDED TEXT SUMMARY FOR SPECIFIC COUNTER / SERVICE ---
        const dateFrom = $('#startDate').val() || today;
        const dateTo = $('#endDate').val() || today;

        let totalServed = 0, totalVoided = 0;
        if (specificData && specificData.chartData) {
            specificData.chartData.forEach(d => {
                totalServed += d.served || 0;
                totalVoided += d.voided || 0;
            });
        }

        function timeToSeconds(timeStr) {
            if (!timeStr) return 0;
            const parts = timeStr.split(':');
            return (+parts[0] || 0) * 3600 + (+parts[1] || 0) * 60 + (+parts[2] || 0);
        }

        let tServing = 0, cServing = 0;
        let tWaiting = 0, cWaiting = 0;
        let tTurnaround = 0, cTurnaround = 0;

        if (specificData && specificData.historyRows) {
            specificData.historyRows.forEach(r => {
                let sSecs = -1, wSecs = -1;
                if (r.start_time && r.end_time) {
                    sSecs = timeToSeconds(r.end_time) - timeToSeconds(r.start_time);
                    if (sSecs >= 0) { tServing += sSecs; cServing++; }
                }
                if (r.time && r.start_time) {
                    wSecs = timeToSeconds(r.start_time) - timeToSeconds(r.time);
                    if (wSecs >= 0) { tWaiting += wSecs; cWaiting++; }
                }
            });

            // Turn-around time: end_time of current row and start_time of next row
            for(let i = 0; i < specificData.historyRows.length - 1; i++) {
                let curr = specificData.historyRows[i];
                let next = specificData.historyRows[i+1];
                if (curr.end_time && next.start_time) {
                    let diff = Math.abs(timeToSeconds(next.start_time) - timeToSeconds(curr.end_time));
                    tTurnaround += diff;
                    cTurnaround++;
                }
            }
        }

        const toStr = (secs) => {
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = Math.floor(secs % 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        pdf.setFontSize(11);
        const nameLabel = mode === "specific_counter" ? "Counter Name/Number" : "Service Name/ID";
        pdf.text(`${nameLabel}: ${targetName || "N/A"} (${target})`, 15, customY); customY += 7;
        pdf.text(`Dates: ${dateFrom} to ${dateTo}`, 15, customY); customY += 7;
        pdf.text(`Total Served: ${totalServed}`, 15, customY); customY += 7;
        pdf.text(`Total Unserved / Voided: ${totalVoided}`, 15, customY); customY += 7;
        pdf.text(`Avg. Serving Time: ${cServing ? toStr(tServing / cServing) : "00:00:00"}`, 15, customY); customY += 7;
        pdf.text(`Avg. Waiting Time: ${cWaiting ? toStr(tWaiting / cWaiting) : "00:00:00"}`, 15, customY); customY += 7;
        pdf.text(`Avg. Turn-around Time: ${cTurnaround ? toStr(tTurnaround / cTurnaround) : "00:00:00"}`, 15, customY); customY += 15;
        // ---------------------------------------------------------

        if (specificLineChartImg) {
            pdf.addImage(specificLineChartImg, 'PNG', 15, customY, 180, 80);
            customY += 90;
        }
        if (specificPieChartImg) {
            if (customY + 80 > 270) { pdf.addPage(); customY = 20; }
            pdf.addImage(specificPieChartImg, 'PNG', 65, customY, 80, 80);
            customY += 90;
        }

        if (specificData && specificData.historyRows && specificData.historyRows.length) {
            if (customY + 40 > 270) { pdf.addPage(); customY = 20; }
            pdf.text("Transactions", 14, customY);
            const head = [["Ticket", "Service", "Start Time", "End Time", "Time", "Status"]];
            const body = specificData.historyRows.map(r => [
                (r.service || "") + (r.ticket || ""),
                r.sname || "",
                r.start_time || "",
                r.end_time || "",
                r.time || "",
                r.status || ""
            ]);
            pdf.autoTable({
                startY: customY + 6,
                head: head,
                body: body,
                theme: "striped",
                styles: { fontSize: 8, halign: "center" },
                headStyles: { fillColor: [231, 76, 60], textColor: 255 }
            });
        }

        pdf.save(`OpenQ_Report_${target}_${today}.pdf`);
        return;
    }

    pdf.text(`Generated Report (${mode.replace('_', ' ')}) – ${today}`, 105, 26, { align: "center" });

    let yPos = 40;
    const imgWidth = 170, imgHeight = 60;

    async function getBase64Image(url) {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    if (["overall", "all_counters", "all_services"].includes(mode)) {
        const chartFiles = [
            "/images/charts/bar_chart.png",
            "/images/charts/hourly_chart.png",
            "/images/charts/daily_chart.png",
            "/images/charts/monthly_chart.png"
        ];

        pdf.setFontSize(14);
        pdf.text("Charts", 14, yPos - 5);

        for (const f of chartFiles) {
            try {
                const imgData = await getBase64Image(f);
                if (yPos + imgHeight > 270) {
                    pdf.addPage();
                    yPos = 30;
                }
                pdf.addImage(imgData, "PNG", 20, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10;
            } catch (e) {
                console.warn("Chart load failed:", f, e);
            }
        }
    }

    if (mode === "overall") {
        // ------------------ OVERVIEW ------------------
        const totalCount = getValue(".content2totalcount", "0");
        const totalRated = getValue(".content2totalrated", "0");
        const totalServed = getValue(".content2totalserved", "0");
        const totalVoided = getValue(".content2totalvoided", "0");
        const totalUnserved = getValue(".content2totalunserved", "0");
        const mostService = getValue(".content2commonservice", "None");
        const mostRating = getValue(".content2commonrating", "None");

        if (yPos + 50 > 270) {
            pdf.addPage();
            yPos = 30;
        }

        pdf.text("Overview", 14, yPos);

        let overviewHead, overviewBody;
        
        // Fetch all transactions early to calculate global averages
        const globalTxData = await getAllTransactionsData();
        let gServing = 0, cgServing = 0, gWaiting = 0, cgWaiting = 0, gTurnaround = 0, cgTurnaround = 0;
        function timeToSec(timeStr) {
            if (!timeStr) return 0;
            const parts = timeStr.split(':');
            return (+parts[0] || 0) * 3600 + (+parts[1] || 0) * 60 + (+parts[2] || 0);
        }
        if (globalTxData) {
            globalTxData.forEach(r => {
                if (r.start_time && r.end_time) {
                    let s = timeToSec(r.end_time) - timeToSec(r.start_time);
                    if (s >= 0) { gServing += s; cgServing++; }
                }
                if (r.time && r.start_time) {
                    let w = timeToSec(r.start_time) - timeToSec(r.time);
                    if (w >= 0) { gWaiting += w; cgWaiting++; }
                }
            });

            for(let i=0; i < globalTxData.length - 1; i++){
                let curr = globalTxData[i];
                let next = globalTxData[i+1];
                if (curr.end_time && next.start_time) {
                    let diff = Math.abs(timeToSec(next.start_time) - timeToSec(curr.end_time));
                    gTurnaround += diff;
                    cgTurnaround++;
                }
            }
        }
        const formatSecs = (secs) => {
            const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
            return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        };
        const avgGlobalServing = cgServing ? formatSecs(gServing / cgServing) : "00:00:00";
        const avgGlobalWaiting = cgWaiting ? formatSecs(gWaiting / cgWaiting) : "00:00:00";
        const avgGlobalTurnaround = cgTurnaround ? formatSecs(gTurnaround / cgTurnaround) : "00:00:00";

        if (withfeedback) {
            overviewHead = [["Total Transactions", "Total Rated", "Total Served", "Total Voided", "Total Unserved", "Most Service", "Most Rating"]];
            overviewBody = [[totalCount, totalRated, totalServed, totalVoided, totalUnserved, mostService, mostRating]];
        } else {
            overviewHead = [["Total Transactions", "Total Served", "Total Voided", "Total Unserved", "Most Service"]];
            overviewBody = [[totalCount, totalServed, totalVoided, totalUnserved, mostService]];
        }
        
        pdf.autoTable({
            startY: yPos + 5,
            head: overviewHead,
            body: overviewBody,
            theme: "grid",
            styles: { fontSize: 10, halign: "center" },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });
        
        const avgHead = [["Avg. Serving Time", "Avg. Turn-around Time", "Avg. Waiting Time"]];
        const avgBody = [[avgGlobalServing, avgGlobalTurnaround, avgGlobalWaiting]];
        
        pdf.autoTable({
            startY: pdf.lastAutoTable.finalY + 5,
            head: avgHead,
            body: avgBody,
            theme: "grid",
            styles: { fontSize: 10, halign: "center" },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        yPos = pdf.lastAutoTable.finalY + 20;


        // ------------------ FEEDBACK TABLE ------------------
        if (withfeedback && latestAveragesfeedback?.length) {
            const feedbackData = latestAveragesfeedback.map(fb => [
                fb.date,
                fb.satisfied_count || 0,
                fb.unsatisfied_count || 0
            ]);

            pdf.text("Feedback", 14, yPos);

            pdf.autoTable({
                startY: yPos + 6,
                head: [["Date", "Satisfied", "Unsatisfied"]],
                body: feedbackData,
                theme: "grid",
                styles: { fontSize: 10, halign: "center" },
                headStyles: { fillColor: [241, 196, 15], textColor: 0 }
            });

            yPos = pdf.lastAutoTable.finalY + 20;
        }

        // ------------------ TRANSACTIONS AVG/DATE ------------------
        if (latestAveragestransactions?.length) {
            // Prepare body without Avg/Date
            const transactionsBody = latestAveragestransactions.map(tr => [
                tr.date,
                tr.total_transactions || 0
            ]);

            // Calculate overall average per date
            const totalTransactions = latestAveragestransactions.reduce((sum, tr) => sum + (tr.total_transactions || 0), 0);
            const countDates = latestAveragestransactions.length;
            const avgPerDate = countDates ? Math.round(totalTransactions / countDates) : 0;

            pdf.text("Transactions Avg/Date", 14, yPos);

            pdf.autoTable({
                startY: yPos + 6,
                head: [["Date", "Total"]],
                body: transactionsBody,
                theme: "grid",
                styles: { fontSize: 10, halign: "center" },
                headStyles: { fillColor: [231, 76, 60], textColor: 255 }
            });

            // Add average per date as a single row below the table
            pdf.autoTable({
                startY: pdf.lastAutoTable.finalY + 4,
                head: [["Average per Date", avgPerDate]],
                theme: "grid",
                styles: { fontSize: 10, halign: "center" },
                headStyles: { fillColor: [41, 128, 185], textColor: 255 }
            });

            yPos = pdf.lastAutoTable.finalY + 20;
        }
    }

    // ------------------ TELLER PERFORMANCE ------------------
    if ((mode === "overall" || mode === "all_counters") && $.fn.DataTable.isDataTable('#adminTable2')) {
        if (yPos + 50 > 270) { pdf.addPage(); yPos = 30; }
        pdf.text("Teller Performance", 14, yPos);
        const tellerTable = $('#adminTable2').DataTable();
        let tellerHead = tellerTable.columns().header().toArray().map(th => $(th).text().trim());
        tellerHead.pop(); // Remove "Details" button
        let tellerBody = tellerTable.rows().data().toArray().map(row => {
            let newRow = [...row];
            newRow.pop(); // Remove button
            return newRow.map(c => $("<div>").html(c).text().replace(/\s+/g, " ").trim());
        });
        if (tellerHead.length && tellerBody.length) {
            pdf.autoTable({
                startY: yPos + 6,
                head: [tellerHead],
                body: tellerBody,
                theme: "grid",
                styles: { fontSize: 8, halign: "center" },
                headStyles: { fillColor: [142, 68, 173], textColor: 255 }
            });
            yPos = pdf.lastAutoTable.finalY + 20;
        }
    }

    // ------------------ SERVICE PERFORMANCE ------------------
    if ((mode === "overall" || mode === "all_services") && $.fn.DataTable.isDataTable('#adminTable3')) {
        if (yPos + 50 > 270) { pdf.addPage(); yPos = 30; }
        pdf.text("Service Performance", 14, yPos);
        const serviceTable = $('#adminTable3').DataTable();
        let serviceHead = serviceTable.columns().header().toArray().map(th => $(th).text().trim());
        serviceHead.pop(); // Remove "Details" button
        let serviceBody = serviceTable.rows().data().toArray().map(row => {
            let newRow = [...row];
            newRow.pop(); // Remove button
            return newRow.map(c => $("<div>").html(c).text().replace(/\s+/g, " ").trim());
        });
        if (serviceHead.length && serviceBody.length) {
            pdf.autoTable({
                startY: yPos + 6,
                head: [serviceHead],
                body: serviceBody,
                theme: "grid",
                styles: { fontSize: 8, halign: "center" },
                headStyles: { fillColor: [46, 204, 113], textColor: 255 }
            });
            yPos = pdf.lastAutoTable.finalY + 20;
        }
    }

    // ------------------ TRANSACTIONS TABLE ------------------
    if ((mode === "overall" || mode === "all_services" || mode === "all_counters")) {
        const allTxData = await getAllTransactionsData();
        if (allTxData && allTxData.length > 0) {
            if (yPos + 50 > 270) { pdf.addPage(); yPos = 30; }
            pdf.text("Transactions", 14, yPos);

            let head = ["Service Name", "Ticket", "Status", "Time", "Start Time", "End Time", "Date"];
            let body = allTxData.map(r => [
                r.sname || "",
                (r.service || "") + (r.ticket || ""),
                r.status || "",
                r.time || "",
                r.start_time || "",
                r.end_time || "",
                r.date || ""
            ]);

            if (head.length && body.length) {
                pdf.autoTable({
                    startY: yPos + 6,
                    head: [head],
                    body: body,
                    theme: "striped",
                    styles: { fontSize: 8, halign: "center" },
                    headStyles: { fillColor: [231, 76, 60], textColor: 255 },
                    didDrawPage: function () {
                        pdf.setFontSize(8);
                        pdf.text("Page " + pdf.internal.getNumberOfPages(),
                            pdf.internal.pageSize.width - 20,
                            pdf.internal.pageSize.height - 10
                        );
                    }
                });
            }
        }
    }

    pdf.save(`OpenQ_Report_${mode}_${today}.pdf`);
    Swal.close();
}



// ---------------- EXCEL EXPORT ----------------
async function generateExcel(mode = "overall", target = null, targetName = null) {
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: `OpenQ Report - ${mode}`,
        Author: "OpenQ System",
        CreatedDate: new Date()
    };

    const today = new Date().toLocaleDateString();

    if (mode === "specific_counter" || mode === "specific_service") {
        Swal.fire({ title: 'Generating Report...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const specificData = await getSpecificExportData(mode, target);
        Swal.close();

        if (specificData) {
            // 1. Overview Sheet
            const dateFrom = $('#startDate').val() || today;
            const dateTo = $('#endDate').val() || today;
            const nameLabel = mode === "specific_counter" ? "Counter Name/Number" : "Service Name/ID";

            const overviewSheetData = [
                ["--- Overview ---"],
                [nameLabel, `${targetName || "N/A"} (${target})`],
                ["Dates From", dateFrom],
                ["Dates To", dateTo],
                []
            ];
            let totalServed = 0, totalVoided = 0;
            if (specificData.chartData) {
                specificData.chartData.forEach(d => {
                    totalServed += d.served || 0;
                    totalVoided += d.voided || 0;
                });
            }

            function timeToSeconds(timeStr) {
                if (!timeStr) return 0;
                const parts = timeStr.split(':');
                return (+parts[0] || 0) * 3600 + (+parts[1] || 0) * 60 + (+parts[2] || 0);
            }
            let tServing = 0, cServing = 0, tWaiting = 0, cWaiting = 0, tTurnaround = 0, cTurnaround = 0;
            if (specificData.historyRows) {
                specificData.historyRows.forEach(r => {
                    let sSecs = -1, wSecs = -1;
                    if (r.start_time && r.end_time) {
                        sSecs = timeToSeconds(r.end_time) - timeToSeconds(r.start_time);
                        if (sSecs >= 0) { tServing += sSecs; cServing++; }
                    }
                    if (r.time && r.start_time) {
                        wSecs = timeToSeconds(r.start_time) - timeToSeconds(r.time);
                        if (wSecs >= 0) { tWaiting += wSecs; cWaiting++; }
                    }
                });

                for(let i = 0; i < specificData.historyRows.length - 1; i++) {
                    let curr = specificData.historyRows[i];
                    let next = specificData.historyRows[i+1];
                    if (curr.end_time && next.start_time) {
                        let diff = Math.abs(timeToSeconds(next.start_time) - timeToSeconds(curr.end_time));
                        tTurnaround += diff;
                        cTurnaround++;
                    }
                }
            }
            const toStr = (secs) => {
                const h = Math.floor(secs / 3600);
                const m = Math.floor((secs % 3600) / 60);
                const s = Math.floor(secs % 60);
                return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
            };

            overviewSheetData.push(["Total Served", "Total Voided", "Average Serving Time", "Average Waiting Time", "Average Turn-around Time"]);
            overviewSheetData.push([
                totalServed, 
                totalVoided, 
                cServing ? toStr(tServing / cServing) : "00:00:00", 
                cWaiting ? toStr(tWaiting / cWaiting) : "00:00:00",
                cTurnaround ? toStr(tTurnaround / cTurnaround) : "00:00:00"
            ]);
            wb.SheetNames.push("Overview");
            wb.Sheets["Overview"] = XLSX.utils.aoa_to_sheet(overviewSheetData);

            // 2. Daily Breakdown Sheet
            if (specificData.chartData && specificData.chartData.length) {
                const chartRawData = [["Date", "Served", "Voided"]];
                specificData.chartData.forEach(d => {
                    chartRawData.push([d.date, d.served, d.voided]);
                });
                wb.SheetNames.push("Daily Breakdown");
                wb.Sheets["Daily Breakdown"] = XLSX.utils.aoa_to_sheet(chartRawData);
            }

            // 3. Distribution Sheet
            if (specificData.pieData && specificData.pieData.length) {
                const pieRawData = mode === "specific_counter" ? [["Service", "Count"]] : [["Teller", "Count"]];
                specificData.pieData.forEach(d => {
                    pieRawData.push([d.service || d.teller || "Unknown", d.count]);
                });
                wb.SheetNames.push("Distribution");
                wb.Sheets["Distribution"] = XLSX.utils.aoa_to_sheet(pieRawData);
            }

            // 4. Transactions Sheet
            if (specificData.historyRows && specificData.historyRows.length) {
                const rawData = [["Ticket", "Service", "Start Time", "End Time", "Time", "Status"]];
                specificData.historyRows.forEach(r => {
                    rawData.push([
                        (r.service || "") + (r.ticket || ""),
                        r.sname || "",
                        r.start_time || "",
                        r.end_time || "",
                        r.time || "",
                        r.status || ""
                    ]);
                });
                wb.SheetNames.push("Transactions");
                wb.Sheets["Transactions"] = XLSX.utils.aoa_to_sheet(rawData);
            }
        }

        if (!wb.SheetNames.length) {
            wb.SheetNames.push("Data");
            wb.Sheets["Data"] = XLSX.utils.aoa_to_sheet([["No data available for " + (targetName || target)]]);
        }

        XLSX.writeFile(wb, `OpenQ_Report_${target}_${today}.xlsx`);
        return;
    }

    if (mode === "overall" || mode === "all_services" || mode === "all_counters") {

        // ------------------ OVERVIEW SHEET ------------------
        const overviewSheetData = [];

        overviewSheetData.push(["--- Overview ---"]);

        let overviewHead, overviewBody;

        if (withfeedback) {
            overviewHead = [
                "Total Transactions",
                "Total Rated",
                "Total Served",
                "Total Voided",
                "Total Unserved",
                "Most Service",
                "Most Rating"
            ];

            overviewBody = [
                getValue(".content2totalcount", "0"),
                getValue(".content2totalrated", "0"),
                getValue(".content2totalserved", "0"),
                getValue(".content2totalvoided", "0"),
                getValue(".content2totalunserved", "0"),
                getValue(".content2commonservice", "None"),
                getValue(".content2commonrating", "None")
            ];

        } else {
            overviewHead = [
                "Total Transactions",
                "Total Served",
                "Total Voided",
                "Total Unserved",
                "Most Service"
            ];

            overviewBody = [
                getValue(".content2totalcount", "0"),
                getValue(".content2totalserved", "0"),
                getValue(".content2totalvoided", "0"),
                getValue(".content2totalunserved", "0"),
                getValue(".content2commonservice", "None")
            ];
        }

        if (mode === "overall") {
            overviewSheetData.push(overviewHead);
            overviewSheetData.push(overviewBody);
            overviewSheetData.push([]);
            
            const globalTxData = await getAllTransactionsData();
            let gServing = 0, cgServing = 0, gWaiting = 0, cgWaiting = 0, gTurnaround = 0, cgTurnaround = 0;
            function timeToSec(timeStr) {
                if (!timeStr) return 0;
                const parts = timeStr.split(':');
                return (+parts[0] || 0) * 3600 + (+parts[1] || 0) * 60 + (+parts[2] || 0);
            }
            if (globalTxData) {
                globalTxData.forEach(r => {
                    if (r.start_time && r.end_time) {
                        let s = timeToSec(r.end_time) - timeToSec(r.start_time);
                        if (s >= 0) { gServing += s; cgServing++; }
                    }
                    if (r.time && r.start_time) {
                        let w = timeToSec(r.start_time) - timeToSec(r.time);
                        if (w >= 0) { gWaiting += w; cgWaiting++; }
                    }
                });

                for(let i=0; i < globalTxData.length - 1; i++){
                    let curr = globalTxData[i];
                    let next = globalTxData[i+1];
                    if (curr.end_time && next.start_time) {
                        let diff = Math.abs(timeToSec(next.start_time) - timeToSec(curr.end_time));
                        gTurnaround += diff;
                        cgTurnaround++;
                    }
                }
            }
            const formatSecs = (secs) => {
                const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60);
                return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
            };
            const avgGlobalServing = cgServing ? formatSecs(gServing / cgServing) : "00:00:00";
            const avgGlobalWaiting = cgWaiting ? formatSecs(gWaiting / cgWaiting) : "00:00:00";
            const avgGlobalTurnaround = cgTurnaround ? formatSecs(gTurnaround / cgTurnaround) : "00:00:00";
            
            overviewSheetData.push(["Avg. Serving Time", "Avg. Turn-around Time", "Avg. Waiting Time"]);
            overviewSheetData.push([avgGlobalServing, avgGlobalTurnaround, avgGlobalWaiting]);

            // Add Overview sheet
            wb.SheetNames.push("Overview");
            wb.Sheets["Overview"] = XLSX.utils.aoa_to_sheet(overviewSheetData);
        }

        // ------------------ TELLER PERFORMANCE SHEET ------------------
        if ((mode === "overall" || mode === "all_counters") && $.fn.DataTable.isDataTable('#adminTable2')) {
            const tellerTable = $('#adminTable2').DataTable();
            let tellerHead = tellerTable.columns().header().toArray().map(th => $(th).text().trim());
            tellerHead.pop();
            let tellerBody = tellerTable.rows().data().toArray().map(row => {
                let newRow = [...row];
                newRow.pop();
                return newRow.map(c => $("<div>").html(c).text().replace(/\s+/g, " ").trim());
            });

            if (tellerHead.length && tellerBody.length) {
                wb.SheetNames.push("Teller Performance");
                wb.Sheets["Teller Performance"] = XLSX.utils.aoa_to_sheet([tellerHead, ...tellerBody]);
            }
        }

        // ------------------ SERVICE PERFORMANCE SHEET ------------------
        if ((mode === "overall" || mode === "all_services") && $.fn.DataTable.isDataTable('#adminTable3')) {
            const serviceTable = $('#adminTable3').DataTable();
            let serviceHead = serviceTable.columns().header().toArray().map(th => $(th).text().trim());
            serviceHead.pop();
            let serviceBody = serviceTable.rows().data().toArray().map(row => {
                let newRow = [...row];
                newRow.pop();
                return newRow.map(c => $("<div>").html(c).text().replace(/\s+/g, " ").trim());
            });

            if (serviceHead.length && serviceBody.length) {
                wb.SheetNames.push("Service Performance");
                wb.Sheets["Service Performance"] = XLSX.utils.aoa_to_sheet([serviceHead, ...serviceBody]);
            }
        }

        // ------------------ FEEDBACK SHEET ------------------
        if (mode === "overall" && withfeedback && latestAveragesfeedback && latestAveragesfeedback.length) {
            const feedbackData = [["Date", "Satisfied", "Unsatisfied"]];

            latestAveragesfeedback.forEach(fb => {
                feedbackData.push([
                    fb.date,
                    fb.satisfied_count || 0,
                    fb.unsatisfied_count || 0
                ]);
            });

            wb.SheetNames.push("Feedback");
            wb.Sheets["Feedback"] = XLSX.utils.aoa_to_sheet(feedbackData);
        }

        // ------------------ TRANSACTIONS AVERAGE SHEET ------------------
        // ------------------ TRANSACTIONS AVERAGE SHEET ------------------
        if (mode === "overall" && latestAveragestransactions && latestAveragestransactions.length) {
            const tData = [["Date", "Total"]]; // Remove Avg/Date from each row

            let totalTransactions = 0;
            const countDates = latestAveragestransactions.length;

            // Add all transactions with totals
            latestAveragestransactions.forEach(tr => {
                tData.push([
                    tr.date,
                    tr.total_transactions || 0
                ]);
                totalTransactions += tr.total_transactions || 0;
            });

            // Calculate overall average per date
            const avgPerDate = countDates ? (totalTransactions / countDates) : 0;

            // Add a single row for Avg/Date at the bottom
            tData.push(["Average per Date", avgPerDate]);

            wb.SheetNames.push("Transactions Avg");
            wb.Sheets["Transactions Avg"] = XLSX.utils.aoa_to_sheet(tData);
        }

        // ------------------ TRANSACTIONS SHEET ------------------
        if ((mode === "overall" || mode === "all_services" || mode === "all_counters")) {
            const allTxData = await getAllTransactionsData();
            if (allTxData && allTxData.length > 0) {
                let trHead = ["Service Name", "Ticket", "Status", "Time", "Start Time", "End Time", "Date", "History"];
                let trBody = allTxData.map(r => [
                    r.sname || "",
                    (r.service || "") + (r.ticket || ""),
                    r.status || "",
                    r.time || "",
                    r.start_time || "",
                    r.end_time || "",
                    r.date || "",
                    r.history || ""
                ]);

                if (trHead.length && trBody.length) {
                    wb.SheetNames.push("Transactions");
                    wb.Sheets["Transactions"] = XLSX.utils.aoa_to_sheet([trHead, ...trBody]);
                }
            }
        }

        // ------------------ SAVE FILE ------------------
        XLSX.writeFile(wb, `OpenQ_Report_${mode}_${today}.xlsx`);
    }
}