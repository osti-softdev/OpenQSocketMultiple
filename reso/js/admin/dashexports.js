$(function () {
    $(".exportbtns").on("click", async function () {
        const id = $(this).data("identifier");
        const saveTasks = [];

        if (id === "exportCSV") {
            generateCSV();
        } else if (id === "exportPDF") {
            if (typeof barChartContent2 !== "undefined" && barChartContent2) saveTasks.push(saveChartImage(barChartContent2, "bar_chart"));
            if (typeof hourChart !== "undefined" && hourChart) saveTasks.push(saveChartImage(hourChart, "hourly_chart"));
            if (typeof dailyChart !== "undefined" && dailyChart) saveTasks.push(saveChartImage(dailyChart, "daily_chart"));
            if (typeof monthChart !== "undefined" && monthChart) saveTasks.push(saveChartImage(monthChart, "monthly_chart"));

            await Promise.all(saveTasks);
            await generatePDF();
        } else if (id === "exportExcel") {
            generateExcel();
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
// ---------------- DYNAMIC OVRCOUNT SCANNER ----------------
function getAllOvrCnt() {
    const result = {};

    $("[data-ovrcnt]").each(function () {
        const key = $(this).data("ovrcnt");
        const value = $(this).text().trim() || $(this).val() || "0";
        result[key] = value;
    });

    return result;
}
// ---------------- CSV EXPORT ----------------
function generateCSV() {
    let csvContent = "";
    const today = new Date().toLocaleDateString();

    // --- Overview Section ---
    const totalCount    = getValue(".content2totalcount", "0");
    const totalRated    = getValue(".content2totalrated", "0");
    const totalServed   = getValue(".content2totalserved", "0");
    const totalUnserved = getValue(".content2totalunserved", "0");
    const mostService   = getValue(".content2commonservice", "None");
    const mostRating    = getValue(".content2commonrating", "None");

    csvContent += "Overview\n";
    if(withfeedback){
        csvContent += ["Total Transactions","Total Rated","Total Served","Total Unserved","Most Service","Most Rating"].join(",") + "\n";
        csvContent += [totalCount,totalRated,totalServed,totalUnserved,mostService,mostRating].map(c=>`"${c}"`).join(",") + "\n\n";
    }else{
         csvContent += ["Total Transactions","Total Served","Total Unserved","Most Service"].join(",") + "\n";
        csvContent += [totalCount,totalServed,totalUnserved,mostService].map(c=>`"${c}"`).join(",") + "\n\n";
    }
    
    // ---------------- Dynamic Service Details ----------------
    const ovrCnt = getAllOvrCnt();

    csvContent += "Service Details\n";
    csvContent += Object.keys(ovrCnt).map(k => `"${k}"`).join(",") + "\n";
    csvContent += Object.values(ovrCnt).map(v => `"${v}"`).join(",") + "\n\n";

    if(withfeedback){
        // --- Feedback Section ---
        if (latestAveragesfeedback && latestAveragesfeedback.length > 0) {
            csvContent += "Feedback\n";
            csvContent += ["Date","Satisfied","Unsatisfied"].join(",") + "\n";
            latestAveragesfeedback.forEach(fb => {
                csvContent += [fb.date, fb.satisfied_count || 0, fb.unsatisfied_count || 0].map(c=>`"${c}"`).join(",") + "\n";
            });
            csvContent += "\n";
        }
    }
    
    // --- Transactions Avg/Date Section ---
   // --- Transactions Avg/Date Section ---
if (latestAveragestransactions && latestAveragestransactions.length > 0) {
    csvContent += "Transactions Avg/Date\n";
    csvContent += ["Date","Total"].join(",") + "\n";

    let totalTransactions = 0;
    let countDates = latestAveragestransactions.length;

    // List all transactions with totals but no avg
    latestAveragestransactions.forEach(tr => {
        csvContent += [tr.date, tr.total_transactions || 0].map(c=>`"${c}"`).join(",") + "\n";
        totalTransactions += tr.total_transactions || 0;
    });

    // Add the overall average per date only once
    const avgPerDate = countDates ?  Math.round(totalTransactions / countDates) : 0;
    csvContent += `,"Average per Date","${avgPerDate}"\n\n`;
}


    // --- Time Averages Section ---
    if (latestAverages && latestAverages.length > 0) {
        const headers = ["Service","Average Waiting","Serving Time","Turnaround Time"];
        csvContent += "Time Averages\n";
        csvContent += headers.join(",") + "\n";
        latestAverages.forEach(row => {
            csvContent += [row.sname || "", row.average_waiting || "", row.serving_time || "", row.turnaround_time || ""]
                .map(c=>`"${c}"`).join(",") + "\n";
        });
    }

    // --- Transactions Section ---
    if (latestRawData && latestRawData.length > 0) {
        const headers = ["Service Name","Ticket","Status","Time","Start Time","End Time","Date","History"];
        csvContent += "\nTransactions\n";
        csvContent += headers.join(",") + "\n";
        latestRawData.forEach(row => {
            csvContent += [
                row.sname || "",
                (row.service || "") + (row.ticket || ""),
                row.status || "",
                row.time || "",
                row.start_time || "",
                row.end_time || "",
                row.date || "",
                row.history || ""
            ].map(c=>`"${String(c).replace(/"/g, '""')}"`).join(",") + "\n";
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
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const today = new Date().toLocaleDateString();

    pdf.setFontSize(20);
    pdf.text("OpenQ Management System", 105, 18, { align: "center" });
    pdf.setFontSize(12);
    pdf.text(`Generated Report – ${today}`, 105, 26, { align: "center" });

    const chartFiles = [
        "/images/charts/bar_chart.png",
        "/images/charts/hourly_chart.png",
        "/images/charts/daily_chart.png",
        "/images/charts/monthly_chart.png"
    ];

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
            yPos += imgHeight + 15;
        } catch (e) {
            console.warn("Chart load failed:", f, e);
        }
    }

    // ------------------ OVERVIEW ------------------
    const totalCount = getValue(".content2totalcount", "0");
    const totalRated = getValue(".content2totalrated", "0");
    const totalServed = getValue(".content2totalserved", "0");
    const totalUnserved = getValue(".content2totalunserved", "0");
    const mostService = getValue(".content2commonservice", "None");
    const mostRating = getValue(".content2commonrating", "None");

    if (yPos + 50 > 270) {
        pdf.addPage();
        yPos = 30;
    }

    pdf.text("Overview", 14, yPos);

    let overviewHead, overviewBody;

    if (withfeedback) {
        overviewHead = [["Total Transactions","Total Rated","Total Served","Total Unserved","Most Service","Most Rating"]];
        overviewBody = [[totalCount,totalRated,totalServed,totalUnserved,mostService,mostRating]];
    } else {
        overviewHead = [["Total Transactions","Total Served","Total Unserved","Most Service"]];
        overviewBody = [[totalCount,totalServed,totalUnserved,mostService]];
    }

    pdf.autoTable({
        startY: yPos + 5,
        head: overviewHead,
        body: overviewBody,
        theme: "grid",
        styles: { fontSize: 10, halign: "center" },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    // ------------------ SERVICE DETAILS (DYNAMIC) ------------------
    const ovrCnt = getAllOvrCnt(); // dynamic scanner

    pdf.text("Service Details", 14, pdf.lastAutoTable.finalY + 12);

    pdf.autoTable({
        startY: pdf.lastAutoTable.finalY + 18,
        head: [Object.keys(ovrCnt)],
        body: [Object.values(ovrCnt)],
        theme: "grid",
        styles: { fontSize: 10, halign: "center" },
        headStyles: { fillColor: [39, 174, 96], textColor: 255 }
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
            head: [["Date","Satisfied","Unsatisfied"]],
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

    // ------------------ TIME AVERAGES ------------------
    const averages = [];
    $(".content2-detailsAverage .sname-block").each(function () {
        averages.push([
            $(this).find("h3").text().trim(),
            $(this).find(".metric:eq(0) span:last").text().trim(),
            $(this).find(".metric:eq(1) span:last").text().trim(),
            $(this).find(".metric:eq(2) span:last").text().trim()
        ]);
    });

    if (averages.length) {
        if (yPos + 50 > 270) {
            pdf.addPage();
            yPos = 30;
        }

        pdf.text("Time Averages", 14, yPos);

        pdf.autoTable({
            startY: yPos + 6,
            head: [["Service","Avg Waiting","Avg Serving","Avg Turnaround"]],
            body: averages,
            theme: "grid",
            styles: { fontSize: 10, halign: "center" },
            headStyles: { fillColor: [142, 68, 173], textColor: 255 }
        });

        yPos = pdf.lastAutoTable.finalY + 20;
    }

    // ------------------ TRANSACTIONS TABLE ------------------
    if (yPos + 50 > 270) {
        pdf.addPage();
        yPos = 30;
    }

    pdf.text("Transactions", 14, yPos);

    const table = $('#adminTable').DataTable();

    const head = table.columns().header().toArray().map(th => $(th).text().trim());
    const body = table.rows().data().toArray().map(row =>
        row.map(c => $("<div>").html(c).text().replace(/\s+/g, " ").trim())
    );

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

    pdf.save(`OpenQ_Report_${today}.pdf`);
}

// ---------------- EXCEL EXPORT ----------------
async function generateExcel() {
    const wb = XLSX.utils.book_new();
    wb.Props = { 
        Title: "OpenQ Report",
        Author: "OpenQ System",
        CreatedDate: new Date()
    };

    const today = new Date().toLocaleDateString();

    // ------------------ OVERVIEW SHEET ------------------
    const overviewSheetData = [];

    overviewSheetData.push(["--- Overview ---"]);

    let overviewHead, overviewBody;

    if (withfeedback) {
        overviewHead = [
            "Total Transactions",
            "Total Rated",
            "Total Served",
            "Total Unserved",
            "Most Service",
            "Most Rating"
        ];

        overviewBody = [
            getValue(".content2totalcount", "0"),
            getValue(".content2totalrated", "0"),
            getValue(".content2totalserved", "0"),
            getValue(".content2totalunserved", "0"),
            getValue(".content2commonservice", "None"),
            getValue(".content2commonrating", "None")
        ];

    } else {
        overviewHead = [
            "Total Transactions",
            "Total Served",
            "Total Unserved",
            "Most Service"
        ];

        overviewBody = [
            getValue(".content2totalcount", "0"),
            getValue(".content2totalserved", "0"),
            getValue(".content2totalunserved", "0"),
            getValue(".content2commonservice", "None")
        ];
    }

    overviewSheetData.push(overviewHead);
    overviewSheetData.push(overviewBody);
    overviewSheetData.push([]);

    // ------------------ SERVICE DETAILS (Dynamic) ------------------
    const ovrCnt = getAllOvrCnt();
    overviewSheetData.push(["--- Service Details ---"]);
    overviewSheetData.push(Object.keys(ovrCnt));
    overviewSheetData.push(Object.values(ovrCnt));
    overviewSheetData.push([]);

    // ------------------ TIME AVERAGES ------------------
    if (latestAverages && latestAverages.length) {
        overviewSheetData.push(["--- Time Averages ---"]);
        overviewSheetData.push(["Service","Average Waiting","Serving Time","Turnaround Time"]);

        latestAverages.forEach(r => {
            overviewSheetData.push([
                r.sname || "",
                r.average_waiting || "",
                r.serving_time || "",
                r.turnaround_time || ""
            ]);
        });

        overviewSheetData.push([]);
    }

    // Add Overview sheet
    wb.SheetNames.push("Overview");
    wb.Sheets["Overview"] = XLSX.utils.aoa_to_sheet(overviewSheetData);

    // ------------------ FEEDBACK SHEET ------------------
    if (withfeedback && latestAveragesfeedback && latestAveragesfeedback.length) {
        const feedbackData = [["Date","Satisfied","Unsatisfied"]];

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
   if (latestAveragestransactions && latestAveragestransactions.length) {
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

    // ------------------ RAW TRANSACTIONS SHEET ------------------
    if (latestRawData && latestRawData.length) {
        const rawData = [["Service Name","Ticket","Status","Time","Start Time","End Time","Date","History"]];

        latestRawData.forEach(r => {
            rawData.push([
                r.sname || "",
                (r.service || "") + (r.ticket || ""),
                r.status || "",
                r.time || "",
                r.start_time || "",
                r.end_time || "",
                r.date || "",
                r.history || ""
            ]);
        });

        wb.SheetNames.push("Transactions");
        wb.Sheets["Transactions"] = XLSX.utils.aoa_to_sheet(rawData);
    }

    // ------------------ SAVE FILE ------------------
    XLSX.writeFile(wb, `OpenQ_Report_${today}.xlsx`);
}
