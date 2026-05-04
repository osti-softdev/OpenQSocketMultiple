$(document).ready(function () {
	// --- Color palettes ---
	const colors = [
		{ border: "rgba(0, 170, 255, 1)", background: "rgba(0, 170, 255, 0.8)" },
		{ border: "rgba(255, 206, 86, 1)", background: "rgba(255, 206, 86, 0.8)" },
		{ border: "rgba(19, 58, 58, 1)", background: "rgba(19, 58, 58, 0.8)" },
		{ border: "rgba(153, 102, 255, 1)", background: "rgba(153, 102, 255, 0.8)" },
		{ border: "rgba(75, 192, 192, 1)", background: "rgba(75, 192, 192, 0.8)" },   // extra
		{ border: "rgba(255, 99, 132, 1)", background: "rgba(255, 99, 132, 0.8)" }   // extra
	];



	socket.on("dashadmindataupdate", (adminoveralldata) => {
		const serviceNames = $.map(adminoveralldata.services, (s) => s.sname);
		const calledCounts = $.map(adminoveralldata.services, (s) => s.called_count);

		// --- Build labels properly ---
		let labels = [...serviceNames];


		// Service dataset colors mapped dynamically
		const serviceBackgrounds = serviceNames.map(
			(_, i) => colors[i % colors.length].background
		);
		const serviceBorders = serviceNames.map(
			(_, i) => colors[i % colors.length].border
		);

		if (!barChartContent2) {
			const ctx = $("#barchartcontent2")[0].getContext("2d");

			barChartContent2 = new Chart(ctx, {
				type: "bar",
				data: {
					labels: labels,
					datasets: [
						{
							label: "Services",
							data: calledCounts,
							backgroundColor: serviceBackgrounds,
							borderColor: serviceBorders,
							borderWidth: 1,
						}
					],
				},
				options: {
					indexAxis: "y",
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false, position: "right" },

						title: {
							display: true,
							text: "Services Overview",
							color: "black"
						},
						datalabels: {
							color: "black",
							anchor: "center",
							align: "center",
							formatter: (value) => (value !== null ? value : "")
						}
					},
					scales: {
						x: {
							stacked: true,
							beginAtZero: true,
							title: { display: true, text: "Count", color: "black" },
							ticks: { color: "black" }
						},
						y: {
							stacked: true,
							title: { display: true, text: "Categories", color: "black" },
							ticks: { color: "black" }
						}
					}
				}
			});
		} else {
			// --- Update existing chart ---
			barChartContent2.data.labels = labels;

			// Update service dataset
			barChartContent2.data.datasets[0].data = calledCounts;
			barChartContent2.data.datasets[0].backgroundColor = serviceBackgrounds;
			barChartContent2.data.datasets[0].borderColor = serviceBorders;

			barChartContent2.update();
		}
	});


	// 	socket.on("dashadmincontent2dataaverages", (data) => {
	//     setRawAverages(data.timeAverages);
	//     setRawAveragestransactions(data.transactions);
	//     setRawAveragesfeedback(data.feedback);

	//     const $container = $(".content2-detailsAverage");
	//     $container.empty();

	//     // --- Time Averages Section ---
	//     $container.append('<div class="title">Time Details</div>');

	//     if (!data.timeAverages || data.timeAverages.length === 0) {
	//         $container.append("<p>No time average data available</p>");
	//     } else {
	//         const $cardsWrapper = $('<div class="cards-wrapper"></div>');
	//         data.timeAverages.forEach(row => {
	//             const html = `
	//                 <div class="sname-block">
	//                     <h3>${row.sname}</h3>
	//                     <div class="metric"><span>Average Waiting:</span> <span>${row.average_waiting}</span></div>
	//                     <div class="metric"><span>Serving Time:</span> <span>${row.serving_time}</span></div>
	//                     <div class="metric"><span>Turnaround Time:</span> <span>${row.turnaround_time}</span></div>
	//                 </div>
	//             `;
	//             $cardsWrapper.append(html);
	//         });
	//         $container.append($cardsWrapper);
	//     }

	//     if (withfeedback) {
	//         // --- Feedback Section ---
	//         $container.append('<div class="title">Feedback</div>');

	//         if (!data.feedback || data.feedback.length === 0) {
	//             $container.append("<p>No feedback data available</p>");
	//         } else {
	//             data.feedback.forEach(fb => {
	//                 $container.append(`
	//                     <div class="metric">
	//                         <span>${fb.date}:</span> Satisfied: ${fb.satisfied_count}, Unsatisfied: ${fb.unsatisfied_count}
	//                     </div>
	//                 `);
	//             });
	//         }
	//     }

	//     // --- Transactions Section ---
	//     $container.append('<div class="title">Transactions</div>');

	//     if (!data.transactions || data.transactions.length === 0) {
	//         $container.append("<p>No transaction data available</p>");
	//     } else {
	//         let totalTransactions = 0;
	//         let countDates = data.transactions.length;

	//         data.transactions.forEach(tr => {
	//             $container.append(`
	//                 <div class="metric">
	//                     <span>${tr.date}:</span> Total: ${tr.total_transactions}
	//                 </div>
	//             `);
	//             totalTransactions += tr.total_transactions;
	//         });

	//         // Display average per date only once at the bottom
	//         const avgPerDate = countDates ? Math.round(totalTransactions / countDates) : 0;
	//         $container.append(`
	//             <div class="metric average-per-date">
	//                 <strong>Average per Date:</strong> ${avgPerDate}
	//             </div>
	//         `);
	//     }
	// });

});
