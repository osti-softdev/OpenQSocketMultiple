$(document).ready(function () {
	// ==========================
	// SWITCH: Enable (1) or Disable (0) Feedback Lines
	// ==========================
	let withfeedback = 1; // ✅ Set to 0 to hide feedback lines

	// Color palette for bar charts (transactions)
	const colors = [
		{ border: "rgba(0, 170, 255, 1)", background: "rgba(0, 170, 255, 0.8)" },
		{ border: "rgba(255, 206, 86, 1)", background: "rgba(255, 206, 86, 0.8)" },
		{ border: "rgba(19, 58, 58, 1)", background: "rgba(19, 58, 58, 0.8)" },
		{ border: "rgba(153, 102, 255, 1)", background: "rgba(153, 102, 255, 0.8)" },
	];

	// Color palette for feedback lines
	const feedbackColors = [
		{ base: "rgba(0, 255, 0, 1)", shadow: "rgba(0, 255, 0, 0.09)" }, // Green for satisfied
		{ base: "rgba(255, 0, 0, 1)", shadow: "rgba(255, 0, 0, 0.09)" }, // Red for unsatisfied
		{ base: "rgba(0, 0, 0, 1)", shadow: "rgba(255, 0, 0, 0.09)" },
	];

	// Create gradient for feedback lines
	const createGradient = (ctx, chartArea, baseColor, shadowColor) => {
		const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
		gradient.addColorStop(0, baseColor);
		gradient.addColorStop(1, shadowColor);
		return gradient;
	};

	// Bar dataset
	const createBarDataset = (sname, data, peak, index, timeType) => {
		const peakLabel =
			timeType === "hourly"
				? `${parseInt(peak.hour) % 12 || 12}:00 ${parseInt(peak.hour) < 12 ? "AM" : "PM"}`
				: timeType === "daily"
				? peak.date
				: peak.month;
		return {
			type: "bar",
			label: `${sname} Transactions (Peak: ${peakLabel}, ${peak.count})`,
			data,
			backgroundColor: colors[index % colors.length].background,
			borderColor: colors[index % colors.length].border,
			borderWidth: 1,
		};
	};

	// Line dataset (feedback)
	const createLineDataset = (labelPrefix, data, peak, timeType, colorIndex) => {
		const peakLabel =
			timeType === "hourly"
				? `${parseInt(peak.hour) % 12 || 12}:00 ${parseInt(peak.hour) < 12 ? "AM" : "PM"}`
				: timeType === "daily"
				? peak.date
				: peak.month;
		const countKey =
			labelPrefix.toLowerCase() === "satisfied" ? "satisfied" : "unsatisfied";
		return {
			type: "line",
			label: `${labelPrefix} (Peak: ${peakLabel}, ${peak[countKey]})`,
			data,
			backgroundColor: function (context) {
				const chart = context.chart;
				const { ctx, chartArea } = chart;
				if (!chartArea) return feedbackColors[colorIndex].shadow;
				return createGradient(
					ctx,
					chartArea,
					feedbackColors[colorIndex].base,
					feedbackColors[colorIndex].shadow
				);
			},
			borderColor: feedbackColors[colorIndex].base,
			borderWidth: 2,
			fill: true,
			tension: 0.5,
			pointRadius: 4,
			pointBackgroundColor: feedbackColors[2].base,
		};
	};

	const arraysEqual = (arr1, arr2) =>
		arr1.length === arr2.length && arr1.every((val, i) => val === arr2[i]);

	const getYMax = (datasets, zoomLevel) => {
		const dataMax = Math.max(...datasets.flatMap((ds) => ds.data), 1);
		if (zoomLevel <= 1.5) return Math.ceil(dataMax / 5) * 5;
		if (zoomLevel <= 2.5) return Math.ceil(dataMax / 10) * 10;
		if (zoomLevel <= 3.5) return Math.ceil(dataMax / 15) * 15;
		return Math.ceil(dataMax / 5) * 5;
	};

	const chartConfig = (labels, datasets, title, isHourly = false) => ({
		type: "bar",
		data: { labels, datasets },
		options: {
			responsive: true,
			maintainAspectRatio: false,
			layout: { padding: 10 },
			animation: { duration: 600, easing: "easeOutQuad" },
			plugins: {
				legend: { display: true, position: "top", labels: { boxWidth: 20, padding: 10 } },
				title: { display: true, text: title, font: { size: 16 }, padding: { top: 10, bottom: 10 } },
				datalabels: {
					display: (context) =>
						context.chart.getZoomLevel() < 3 &&
						context.dataset.data[context.dataIndex] > 0,
					color: "black",
					align: "top",
					offset: 4,
					font: { weight: "bold", size: 10 },
					formatter: (value) => (value > 0 ? value : ""),
				},
				tooltip: {
					enabled: true,
					callbacks: {
						label: (context) =>
							`${context.dataset.label.split(" (")[0]}: ${context.parsed.y}`,
						title: (context) => `${context[0].label}`,
					},
				},
			},
			scales: {
				x: {
					title: { display: true, text: "Time Period" },
					ticks: {
						autoSkip: !isHourly,
						maxRotation: 45,
						minRotation: 45,
						maxTicksLimit: isHourly ? 24 : 10,
					},
				},
				y: {
					beginAtZero: true,
					title: { display: true, text: "Count" },
					suggestedMax: getYMax(datasets, 1),
				},
			},
		},
	});

	const resizeCharts = () => {
		[hourChart, dateChart, monthChart].forEach((chart) => chart && chart.resize());
	};
	$(window).resize(resizeCharts);

	socket.on("dashadmincontent3data", (admincontent3data) => {
		const { snames, hourly, daily, monthly, feedback } = admincontent3data;

		const hourLabels = Array.from({ length: 24 }, (_, i) => {
			const hour = i % 12 === 0 ? 12 : i % 12;
			const period = i < 12 ? "AM" : "PM";
			return `${hour}:00 ${period}`;
		});

		// === Hourly datasets ===
		const hourBarDatasets = snames.map((sname, index) => {
			const data = hourly[sname].map((h) => h.count);
			const peak = hourly[sname].reduce(
				(max, curr) => (curr.count > max.count ? curr : max),
				{ hour: "00", count: 0 }
			);
			return createBarDataset(sname, data, peak, index, "hourly");
		});

		let hourDatasets = [...hourBarDatasets];
		if (withfeedback) {
			const hourSatisfiedPeak = feedback.hourly.reduce(
				(max, curr) => (curr.satisfied > max.satisfied ? curr : max),
				{ hour: "00", satisfied: 0 }
			);
			const hourUnsatisfiedPeak = feedback.hourly.reduce(
				(max, curr) => (curr.unsatisfied > max.unsatisfied ? curr : max),
				{ hour: "00", unsatisfied: 0 }
			);
			const hourLineDatasets = [
				createLineDataset(
					"Satisfied",
					feedback.hourly.map((h) => h.satisfied),
					hourSatisfiedPeak,
					"hourly",
					0
				),
				createLineDataset(
					"Unsatisfied",
					feedback.hourly.map((h) => h.unsatisfied),
					hourUnsatisfiedPeak,
					"hourly",
					1
				),
			];
			hourDatasets = [...hourBarDatasets, ...hourLineDatasets];
		}

		// === Daily datasets ===
		const dateLabels = [
			...new Set(snames.flatMap((sname) => daily[sname].map((d) => d.date))),
		].sort();

		const dateBarDatasets = snames.map((sname, index) => {
			const data = daily[sname].map((d) => d.count);
			const peak = daily[sname].reduce(
				(max, curr) => (curr.count > max.count ? curr : max),
				{ date: dateLabels[0] || "", count: 0 }
			);
			return createBarDataset(sname, data, peak, index, "daily");
		});

		let dateDatasets = [...dateBarDatasets];
		if (withfeedback) {
			const dateSatisfiedPeak = feedback.daily.reduce(
				(max, curr) => (curr.satisfied > max.satisfied ? curr : max),
				{ date: "", satisfied: 0 }
			);
			const dateUnsatisfiedPeak = feedback.daily.reduce(
				(max, curr) => (curr.unsatisfied > max.unsatisfied ? curr : max),
				{ date: "", unsatisfied: 0 }
			);
			const dateLineDatasets = [
				createLineDataset(
					"Satisfied",
					feedback.daily.map((d) => d.satisfied),
					dateSatisfiedPeak,
					"daily",
					0
				),
				createLineDataset(
					"Unsatisfied",
					feedback.daily.map((d) => d.unsatisfied),
					dateUnsatisfiedPeak,
					"daily",
					1
				),
			];
			dateDatasets = [...dateBarDatasets, ...dateLineDatasets];
		}

		// === Monthly datasets ===
		const monthLabels = [
			...new Set(snames.flatMap((sname) => monthly[sname].map((m) => m.month))),
		].sort();

		const monthBarDatasets = snames.map((sname, index) => {
			const data = monthly[sname].map((m) => m.count);
			const peak = monthly[sname].reduce(
				(max, curr) => (curr.count > max.count ? curr : max),
				{ month: monthLabels[0] || "", count: 0 }
			);
			return createBarDataset(sname, data, peak, index, "monthly");
		});

		let monthDatasets = [...monthBarDatasets];
		if (withfeedback) {
			const monthSatisfiedPeak = feedback.monthly.reduce(
				(max, curr) => (curr.satisfied > max.satisfied ? curr : max),
				{ month: "", satisfied: 0 }
			);
			const monthUnsatisfiedPeak = feedback.monthly.reduce(
				(max, curr) => (curr.unsatisfied > max.unsatisfied ? curr : max),
				{ month: "", unsatisfied: 0 }
			);
			const monthLineDatasets = [
				createLineDataset(
					"Satisfied",
					feedback.monthly.map((m) => m.satisfied),
					monthSatisfiedPeak,
					"monthly",
					0
				),
				createLineDataset(
					"Unsatisfied",
					feedback.monthly.map((m) => m.unsatisfied),
					monthUnsatisfiedPeak,
					"monthly",
					1
				),
			];
			monthDatasets = [...monthBarDatasets, ...monthLineDatasets];
		}

		// === Render charts ===
		if (!hourChart) {
			const ctx = $("#timelinechart3")[0].getContext("2d");
			hourChart = new Chart(ctx, chartConfig(hourLabels, hourDatasets, "Hourly Transactions", true));
		} else {
			updateChart(hourChart, hourLabels, hourDatasets, snames);
		}

		if (!dateChart) {
			const ctx = $("#datelinechart3")[0].getContext("2d");
			dateChart = new Chart(ctx, chartConfig(dateLabels, dateDatasets, "Daily Transactions"));
		} else {
			updateChart(dateChart, dateLabels, dateDatasets, snames);
		}

		if (!monthChart) {
			const ctx = $("#monthlinechart3")[0].getContext("2d");
			monthChart = new Chart(ctx, chartConfig(monthLabels, monthDatasets, "Monthly Transactions"));
		} else {
			updateChart(monthChart, monthLabels, monthDatasets, snames);
		}
	});

	function updateChart(chart, labels, newDatasets, snames) {
		let needsUpdate = false;
		if (!arraysEqual(chart.data.labels, labels)) {
			chart.data.labels = labels;
			needsUpdate = true;
		}

		chart.data.datasets = chart.data.datasets.filter((ds) =>
			snames.some((sname) => ds.label.startsWith(sname)) ||
			(withfeedback && (ds.label.startsWith("Satisfied") || ds.label.startsWith("Unsatisfied")))
		);

		snames.forEach((sname, index) => {
			const newDataset = newDatasets.find((ds) => ds.label.startsWith(sname));
			let existing = chart.data.datasets.find((ds) => ds.label.startsWith(sname));
			if (existing) {
				existing.data = newDataset.data;
				existing.label = newDataset.label;
				existing.backgroundColor = colors[index % colors.length].background;
				existing.borderColor = colors[index % colors.length].border;
				needsUpdate = true;
			} else {
				chart.data.datasets.push({
					...newDataset,
					backgroundColor: colors[index % colors.length].background,
					borderColor: colors[index % colors.length].border,
				});
				needsUpdate = true;
			}
		});

		if (withfeedback) {
			["Satisfied", "Unsatisfied"].forEach((labelPrefix, idx) => {
				const newFeedback = newDatasets.find((ds) => ds.label.startsWith(labelPrefix));
				if (!newFeedback) return;
				let existingFeedback = chart.data.datasets.find((ds) =>
					ds.label.startsWith(labelPrefix)
				);
				if (existingFeedback) {
					existingFeedback.data = newFeedback.data;
					existingFeedback.label = newFeedback.label;
					existingFeedback.backgroundColor = newFeedback.backgroundColor;
					existingFeedback.borderColor = newFeedback.borderColor;
					needsUpdate = true;
				} else {
					chart.data.datasets.push(newFeedback);
					needsUpdate = true;
				}
			});
		}

		if (needsUpdate) chart.update();
	}
});
