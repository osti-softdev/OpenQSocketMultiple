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

// ---------------- CSV EXPORT ----------------
function generateCSV() {
    let csvContent = "";
    const today = new Date().toLocaleDateString();
    // --- Overview Section ---
    const totalCount    = getValue(".content2totalcount", "0");
    // const totalRated    = getValue(".content2totalrated", "0");
    const totalServed   = getValue(".content2totalserved", "0");
    const totalUnserved = getValue(".content2totalunserved", "0");
    const mostService   = getValue(".content2commonservice", "None");
    // const mostRating    = getValue(".content2commonrating", "None");

    csvContent += "Overview\n";
    // csvContent += ["Total Transactions","Total Rated","Total Served","Total Unserved","Most Service","Most Rating"].join(",") + "\n";
    csvContent += ["Total Transactions","Total Served","Total Unserved","Most Service"].join(",") + "\n";
    // csvContent += [totalCount,totalRated,totalServed,totalUnserved,mostService,mostRating].map(c=>`"${c}"`).join(",") + "\n\n";
    csvContent += [totalCount,totalServed,totalUnserved,mostService].map(c=>`"${c}"`).join(",") + "\n\n";

    // --- Service Details Section ---
    const overCar        = getValue("[data-ovrcnt='carwash']", "0");
    const overMotor      = getValue("[data-ovrcnt='motorwash']", "0");
    const overHelmet     = getValue("[data-ovrcnt='helmetwash']", "0");
    // const overSatisfied  = getValue("[data-ovrcnt='satisfied']", "0");
    // const overUnsatisfied= getValue("[data-ovrcnt='unsatisfied']", "0");

    csvContent += "Service Details\n";
    // csvContent += ["Carwash","Motorwash","Helmetwash","Satisfied","Unsatisfied"].join(",") + "\n";
    // csvContent += [overCar, overMotor, overHelmet, overSatisfied, overUnsatisfied].map(c=>`"${c}"`).join(",") + "\n\n";
    csvContent += ["Carwash","Motorwash","Helmetwash"].join(",") + "\n";
    csvContent += [overCar, overMotor, overHelmet,].map(c=>`"${c}"`).join(",") + "\n\n";

    // --- Feedback Section ---
    // if (latestAveragesfeedback && latestAveragesfeedback.length > 0) {
    //     csvContent += "Feedback\n";
    //     csvContent += ["Date","Satisfied","Unsatisfied"].join(",") + "\n";
    //     latestAveragesfeedback.forEach(fb => {
    //         csvContent += [fb.date, fb.satisfied_count || 0, fb.unsatisfied_count || 0].map(c=>`"${c}"`).join(",") + "\n";
    //     });
    //     csvContent += "\n";
    // }

    // --- Transactions Avg/Date Section ---
    if (latestAveragestransactions && latestAveragestransactions.length > 0) {
        csvContent += "Transactions Avg/Date\n";
        csvContent += ["Date","Total","Avg/Date"].join(",") + "\n";
        latestAveragestransactions.forEach(tr => {
            csvContent += [tr.date, tr.total_transactions || 0, Math.round(tr.average_count_per_date || 0)].map(c=>`"${c}"`).join(",") + "\n";
        });
        csvContent += "\n";
    }

    // --- Time Averages Section ---
    if (latestAverages && latestAverages.length > 0) {
        const headers = ["Service","Average Waiting","Serving Time","Turnaround Time"];
        csvContent += "Time Averages\n";
        csvContent += headers.join(",") + "\n";
        latestAverages.forEach(row => {
            csvContent += [row.sname || "", row.average_waiting || "", row.serving_time || "", row.turnaround_time || ""].map(c=>`"${c}"`).join(",") + "\n";
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

    // --- Charts ---
    const chartFiles = ["/images/charts/bar_chart.png","/images/charts/hourly_chart.png","/images/charts/daily_chart.png","/images/charts/monthly_chart.png"];
    let yPos = 40, imgWidth = 170, imgHeight = 60;

    async function getBase64Image(url) {
        const res = await fetch(url); const blob = await res.blob();
        return new Promise(resolve => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result); reader.readAsDataURL(blob); });
    }

    pdf.setFontSize(14); pdf.text("Charts", 14, yPos - 5);
    for (let f of chartFiles) {
        try {
            const imgData = await getBase64Image(f);
            if (yPos + imgHeight > 270) { pdf.addPage(); yPos = 30; }
            pdf.addImage(imgData, "PNG", 20, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 15;
        } catch (e) { console.warn("⚠️ Could not load chart:", f, e); }
    }

    // --- Overview + Service Details ---
    const totalCount = getValue(".content2totalcount","0"), totalRated = getValue(".content2totalrated","0");
    // const totalServed = getValue(".content2totalserved","0"), totalUnserved = getValue(".content2totalunserved","0");
    const mostService = getValue(".content2commonservice","None"), mostRating = getValue(".content2commonrating","None");

    const overCar = getValue("[data-ovrcnt='carwash']","0"), overMotor = getValue("[data-ovrcnt='motorwash']","0");
    const overHelmet = getValue("[data-ovrcnt='helmetwash']","0"), overSatisfied = getValue("[data-ovrcnt='satisfied']","0");
    // const overUnsatisfied = getValue("[data-ovrcnt='unsatisfied']","0");

    if (yPos + 60 > 270) { pdf.addPage(); yPos = 30; }

    pdf.text("Overview",14,yPos);
    // pdf.autoTable({ startY:yPos+5, head:[["Total Transactions","Total Rated","Total Served","Total Unserved","Most Service","Most Rating"]], body:[[totalCount,totalRated,totalServed,totalUnserved,mostService,mostRating]], theme:"grid", styles:{fontSize:10,halign:"center"}, headStyles:{fillColor:[41,128,185],textColor:255} });
    pdf.autoTable({ startY:yPos+5, head:[["Total Transactions","Total Served","Total Unserved","Most Service"]], body:[[totalCount,totalServed,totalUnserved,mostService]], theme:"grid", styles:{fontSize:10,halign:"center"}, headStyles:{fillColor:[41,128,185],textColor:255} });

    pdf.text("Service Details",14,pdf.lastAutoTable.finalY+12);
    // pdf.autoTable({ startY: pdf.lastAutoTable.finalY+18, head:[["Carwash","Motorwash","Helmetwash","Satisfied","Unsatisfied"]], body:[[overCar,overMotor,overHelmet,overSatisfied,overUnsatisfied]], theme:"grid", styles:{fontSize:10,halign:"center"}, headStyles:{fillColor:[39,174,96],textColor:255} });
    pdf.autoTable({ startY: pdf.lastAutoTable.finalY+18, head:[["Carwash","Motorwash","Helmetwash"]], body:[[overCar,overMotor,overHelmet]], theme:"grid", styles:{fontSize:10,halign:"center"}, headStyles:{fillColor:[39,174,96],textColor:255} });

    yPos = pdf.lastAutoTable.finalY + 20;

    // --- Feedback Table ---
    // if (latestAveragesfeedback && latestAveragesfeedback.length) {
    //     const feedbackData = latestAveragesfeedback.map(fb => [fb.date, fb.satisfied_count||0, fb.unsatisfied_count||0]);
    //     pdf.text("Feedback",14,yPos);
    //     pdf.autoTable({ startY:yPos+6, head:[["Date","Satisfied","Unsatisfied"]], body:feedbackData, theme:"grid", styles:{fontSize:10,halign:"center"}, headStyles:{fillColor:[241,196,15],textColor:0} });
    //     yPos = pdf.lastAutoTable.finalY+20;
    // }

    // --- Transactions Avg/Date Table ---
    if (latestAveragestransactions && latestAveragestransactions.length) {
        const transactionsData = latestAveragestransactions.map(tr => [tr.date, tr.total_transactions||0, Math.round(tr.average_count_per_date||0)]);
        pdf.text("Transactions Avg/Date",14,yPos);
        pdf.autoTable({ startY:yPos+6, head:[["Date","Total","Avg/Date"]], body:transactionsData, theme:"grid", styles:{fontSize:10,halign:"center"}, headStyles:{fillColor:[231,76,60],textColor:255} });
        yPos = pdf.lastAutoTable.finalY+20;
    }

    // --- Time Averages ---
    const averages = [];
    $(".content2-detailsAverage .sname-block").each(function () {
        averages.push([
            $(this).find("h3").text().trim(),
            $(this).find(".metric:eq(0) span:last").text().trim(),
            $(this).find(".metric:eq(1) span:last").text().trim(),
            $(this).find(".metric:eq(2) span:last").text().trim()
        ]);
    });
    if (averages.length) { if (yPos+50>270){pdf.addPage();yPos=30;} pdf.text("Time Averages",14,yPos); pdf.autoTable({ startY:yPos+6, head:[["Service","Avg Waiting","Avg Serving","Avg Turnaround"]], body:averages, theme:"grid", styles:{fontSize:10,halign:"center"}, headStyles:{fillColor:[142,68,173],textColor:255} }); yPos=pdf.lastAutoTable.finalY+20; }

    // --- Transactions ---
    if (yPos + 50 > 270) { pdf.addPage(); yPos = 30; }
    pdf.text("Transactions",14,yPos);
    const table = $('#adminTable').DataTable();
    const head = table.columns().header().toArray().map(th => $(th).text().trim());
    const body = table.rows().data().toArray().map(r => r.map(c => $("<div>").html(c).text().replace(/\s+/g," ").trim()));
    if (head.length && body.length) pdf.autoTable({ startY:yPos+6, head:[head], body:body, theme:"striped", styles:{fontSize:8,halign:"center"}, headStyles:{fillColor:[231,76,60],textColor:255}, didDrawPage:function(){ pdf.setFontSize(8); pdf.text("Page "+pdf.internal.getNumberOfPages(), pdf.internal.pageSize.width-20, pdf.internal.pageSize.height-10); } });
    pdf.save(`OpenQ_Report_${today}.pdf`);
}

// ---------------- EXCEL EXPORT ----------------
async function generateExcel() {
    const wb = XLSX.utils.book_new();
    wb.Props = { Title:"OpenQ Report", Author:"OpenQ System", CreatedDate:new Date() };
    const today = new Date().toLocaleDateString();

    // --- Overview Sheet ---
    const overviewSheetData = [];
    overviewSheetData.push(["--- Overview ---"]);
    // overviewSheetData.push(["Total Transactions","Total Rated","Total Served","Total Unserved","Most Service","Most Rating"]);
    overviewSheetData.push(["Total Transactions","Total Served","Total Unserved","Most Service"]);
    overviewSheetData.push([getValue(".content2totalcount","0"),getValue(".content2totalrated","0"),getValue(".content2totalserved","0"),getValue(".content2totalunserved","0"),getValue(".content2commonservice","None"),getValue(".content2commonrating","None")]);
    overviewSheetData.push([]);
    overviewSheetData.push(["--- Service Details ---"]);
    overviewSheetData.push(["Carwash","Motorwash","Helmetwash","Satisfied","Unsatisfied"]);
    overviewSheetData.push([getValue("[data-ovrcnt='carwash']","0"),getValue("[data-ovrcnt='motorwash']","0"),getValue("[data-ovrcnt='helmetwash']","0"),getValue("[data-ovrcnt='satisfied']","0"),getValue("[data-ovrcnt='unsatisfied']","0")]);
    overviewSheetData.push([]);

    // Add sheets for Feedback
    if (latestAveragesfeedback && latestAveragesfeedback.length) {
        const feedbackData = [["Date","Satisfied","Unsatisfied"]];
        latestAveragesfeedback.forEach(fb => feedbackData.push([fb.date, fb.satisfied_count||0, fb.unsatisfied_count||0]));
        wb.SheetNames.push("Feedback");
        wb.Sheets["Feedback"] = XLSX.utils.aoa_to_sheet(feedbackData);
    }

    // Add sheets for Transactions Avg
    if (latestAveragestransactions && latestAveragestransactions.length) {
        const transactionsData = [["Date","Total","Avg/Date"]];
        latestAveragestransactions.forEach(tr => transactionsData.push([tr.date, tr.total_transactions||0, Math.round(tr.average_count_per_date||0)]));
        wb.SheetNames.push("Transactions Avg");
        wb.Sheets["Transactions Avg"] = XLSX.utils.aoa_to_sheet(transactionsData);
    }

    // Add Time Averages to Overview sheet
    if (latestAverages && latestAverages.length) {
        overviewSheetData.push(["--- Time Averages ---"]);
        overviewSheetData.push(["Service","Average Waiting","Serving Time","Turnaround Time"]);
        latestAverages.forEach(r => overviewSheetData.push([r.sname||"",r.average_waiting||"",r.serving_time||"",r.turnaround_time||""]));
    }

    // Add Overview sheet
    wb.SheetNames.push("Overview");
    wb.Sheets["Overview"] = XLSX.utils.aoa_to_sheet(overviewSheetData);

    // Add Transactions sheet
    if (latestRawData && latestRawData.length) {
        const transactionsData = [["Service Name","Ticket","Status","Time","Start Time","End Time","Date","History"]];
        latestRawData.forEach(r => transactionsData.push([r.sname||"", (r.service||"")+(r.ticket||""), r.status||"", r.time||"", r.start_time||"", r.end_time||"", r.date||"", r.history||""]));
        wb.SheetNames.push("Transactions");
        wb.Sheets["Transactions"] = XLSX.utils.aoa_to_sheet(transactionsData);
    }

    XLSX.writeFile(wb,`OpenQ_Report_${today}.xlsx`);
}
