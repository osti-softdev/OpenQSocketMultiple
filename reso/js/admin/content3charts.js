$(document).ready(function () {
	// Color palette for bar charts (transactions)
	const colors = [
		{ border: "rgba(0, 170, 255, 1)", background: "rgba(0, 170, 255, 0.8)" },
		{ border: "rgba(255, 206, 86, 1)", background: "rgba(255, 206, 86, 0.8)" },
		{ border: "rgba(19, 58, 58, 1)", background: "rgba(19, 58, 58, 0.8)" },
		{
			border: "rgba(153, 102, 255, 1)",
			background: "rgba(153, 102, 255, 0.8)",
		},
	];

	// Color palette for feedback lines (base colors for gradients)
	const feedbackColors = [
		{ base: "rgba(0, 255, 0, 1)", shadow: "rgba(0, 255, 0, 0.09)" }, // Green for satisfied, shadow fades to transparent
		{ base: "rgba(255, 0, 0, 1)", shadow: "rgba(255, 0, 0, 0.09)" }, // Red for unsatisfied, shadow fades to transparent
		{ base: "rgba(0, 0, 0, 1)", shadow: "rgba(255, 0, 0, 0.09)" }, // Red for unsatisfied, shadow fades to transparent
	];

	// Helper function to create a gradient for lines
	const createGradient = (ctx, chartArea, baseColor, shadowColor) => {
		const gradient = ctx.createLinearGradient(
			0,
			chartArea.top,
			0,
			chartArea.bottom
		);
		gradient.addColorStop(0, baseColor); // Top: solid base color (line)
		gradient.addColorStop(1, shadowColor); // Bottom: fully transparent
		return gradient;
	};

	// Helper function to create a bar dataset
	const createBarDataset = (sname, data, peak, index, timeType) => {
		const peakLabel =
			timeType === "hourly"
				? `${parseInt(peak.hour) % 12 || 12}:00 ${
						parseInt(peak.hour) < 12 ? "AM" : "PM"
				  }`
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

	// Helper function to create a line dataset with gradient
	const createLineDataset = (labelPrefix, data, peak, timeType, colorIndex) => {
		const peakLabel =
			timeType === "hourly"
				? `${parseInt(peak.hour) % 12 || 12}:00 ${
						parseInt(peak.hour) < 12 ? "AM" : "PM"
				  }`
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
				if (!chartArea) return feedbackColors[colorIndex].shadow; // Fallback
				return createGradient(
					ctx,
					chartArea,
					feedbackColors[colorIndex].base,
					feedbackColors[colorIndex].shadow
				);
			},
			borderColor: feedbackColors[colorIndex].base, // Solid line color
			borderWidth: 2,
			fill: true,
			tension: 0.5,
			pointRadius: 4,
			pointBackgroundColor: feedbackColors[2].base,
		};
	};

	// Helper function to check if arrays are equal
	const arraysEqual = (arr1, arr2) => {
		if (arr1.length !== arr2.length) return false;
		return arr1.every((val, i) => val === arr2[i]);
	};

	// Helper function to determine y-axis max based on zoom level
	const getYMax = (datasets, zoomLevel) => {
		const dataMax = Math.max(...datasets.flatMap((ds) => ds.data), 1);
		if (zoomLevel <= 1.5) return Math.ceil(dataMax / 5) * 5;
		if (zoomLevel <= 2.5) return Math.ceil(dataMax / 10) * 10;
		if (zoomLevel <= 3.5) return Math.ceil(dataMax / 15) * 15;
		return Math.ceil(dataMax / 5) * 5;
	};

	// Chart configuration
	const chartConfig = (labels, datasets, title, isHourly = false) => ({
		type: "bar",
		data: { labels, datasets },
		options: {
			responsive: true,
			maintainAspectRatio: false,
			layout: {
				padding: 10,
			},
			animation: {
				duration: 600,
				easing: "easeOutQuad",
			},
			plugins: {
				legend: {
					display: true,
					position: "top",
					labels: { boxWidth: 20, padding: 10 },
				},
				title: {
					display: true,
					text: title,
					font: { size: 16 },
					padding: { top: 10, bottom: 10 },
				},
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
				zoom: {
					zoom: {
						wheel: { enabled: true, speed: 0.1 },
						pinch: { enabled: true, threshold: 10 },
						drag: {
							enabled: true,
							backgroundColor: "rgba(0,0,0,0.1)",
							borderColor: "rgba(0,0,0,0.3)",
							borderWidth: 1,
						},
						mode: "xy",
					},
					pan: {
						enabled: true,
						mode: "xy",
						threshold: 5,
					},
					limits: {
						x: {
							min: 0,
							max: labels.length - 1,
							minRange: isHourly ? 4 : 2,
						},
						y: {
							min: 0,
							max: Math.max(...datasets.flatMap((ds) => ds.data), 1) * 1.2,
						},
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
					ticks: {
						callback: function (value) {
							const zoomLevel = this.chart.getZoomLevel();
							const yMax = getYMax(this.chart.data.datasets, zoomLevel);
							const step = zoomLevel <= 1.5 ? 1 : zoomLevel <= 2.5 ? 2 : 3;
							return value % step === 0 && value <= yMax ? value : null;
						},
					},
					suggestedMax: getYMax(datasets, 1),
				},
			},
		},
	});

	// Handle window resize to ensure responsiveness
	const resizeCharts = () => {
		[hourChart, dateChart, monthChart].forEach((chart) => {
			if (chart) {
				chart.resize();
			}
		});
	};
	$(window).resize(resizeCharts);

	// Socket event listener for data updates
	socket.on("dashadmincontent3data", (admincontent3data) => {
		const { snames, hourly, daily, monthly, feedback } = admincontent3data;

		// Hour labels (24-hour format with AM/PM)
		const hourLabels = Array.from({ length: 24 }, (_, i) => {
			const hour = i % 12 === 0 ? 12 : i % 12;
			const period = i < 12 ? "AM" : "PM";
			return `${hour}:00 ${period}`;
		});

		// Hour bar datasets
		const hourBarDatasets = snames.map((sname, index) => {
			const data = hourly[sname].map((h) => h.count);
			const peak = hourly[sname].reduce(
				(max, curr) => (curr.count > max.count ? curr : max),
				{ hour: "00", count: 0 }
			);
			return createBarDataset(sname, data, peak, index, "hourly");
		});

		// Hour line datasets for feedback
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
		const hourDatasets = [...hourBarDatasets, ...hourLineDatasets];

		// Date labels and bar datasets
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

		// Date line datasets for feedback
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
		const dateDatasets = [...dateBarDatasets, ...dateLineDatasets];

		// Month labels and bar datasets
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

		// Month line datasets for feedback
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
		const monthDatasets = [...monthBarDatasets, ...monthLineDatasets];

		// Update or initialize charts
		if (!hourChart) {
			const ctx = $("#timelinechart3")[0].getContext("2d");
			hourChart = new Chart(
				ctx,
				chartConfig(
					hourLabels,
					hourDatasets,
					"Hourly Transactions by Service with Feedback",
					true
				)
			);
			const resetButton = $("<button>", {
				id: "resetHourChart",
				text: "Reset",
				class: "btn btn-secondary",
				style:
					"position:absolute;top:0%;left:0%;display:flex;justify-content:center;align-items:center;width:20%;height:5%;z-index:100;margin:10px;padding:5px 10px;",
			});
			$("#timelinechart3").parent().prepend(resetButton);
			resetButton.on("click", () => {
				hourChart.resetZoom();
			});
		} else {
			updateChart(hourChart, hourLabels, hourDatasets, snames);
		}

		if (!dateChart) {
			const ctx = $("#datelinechart3")[0].getContext("2d");
			dateChart = new Chart(
				ctx,
				chartConfig(
					dateLabels,
					dateDatasets,
					"Daily Transactions by Service with Feedback"
				)
			);

			const resetButton = $("<button>", {
				id: "resetDateChart",
				text: "Reset",
				class: "btn btn-secondary",
				style:
					"position:absolute;top:0%;left:0%;display:flex;justify-content:center;align-items:center;width:20%;height:5%;z-index:100;margin:10px;padding:5px 10px;",
			});
			$("#datelinechart3").parent().prepend(resetButton);
			resetButton.on("click", () => {
				dateChart.resetZoom();
			});
		} else {
			updateChart(dateChart, dateLabels, dateDatasets, snames);
		}

		if (!monthChart) {
			const ctx = $("#monthlinechart3")[0].getContext("2d");
			monthChart = new Chart(
				ctx,
				chartConfig(
					monthLabels,
					monthDatasets,
					"Monthly Transactions by Service with Feedback"
				)
			);
			const resetButton = $("<button>", {
				id: "resetMonthChart",
				text: "Reset",
				class: "btn btn-secondary",
				style:
					"position:absolute;top:0%;left:0%;display:flex;justify-content:center;align-items:center;width:20%;height:5%;z-index:100;margin:10px;padding:5px 10px;",
			});
			$("#monthlinechart3").parent().prepend(resetButton);
			resetButton.on("click", () => {
				monthChart.resetZoom();
			});
		} else {
			updateChart(monthChart, monthLabels, monthDatasets, snames);
		}
	});

	// Helper function to update chart data selectively
function updateChart(chart, labels, newDatasets, snames) {
  let needsUpdate = false;

  // Update labels
  if (!arraysEqual(chart.data.labels, labels)) {
    chart.data.labels = labels;
    chart.options.plugins.zoom.limits.x.max = labels.length - 1;
    needsUpdate = true;
  }

  // Remove old service datasets
  chart.data.datasets = chart.data.datasets.filter(
    (ds) =>
      snames.some((sname) => ds.label.startsWith(sname)) ||
      ds.label.startsWith("Satisfied") ||
      ds.label.startsWith("Unsatisfied")
  );

  // --- Update/Add service bar datasets ---
  snames.forEach((sname, index) => {
    const newDataset = newDatasets.find((ds) => ds.label.startsWith(sname));
    let existingDataset = chart.data.datasets.find((ds) =>
      ds.label.startsWith(sname)
    );

    if (existingDataset) {
      existingDataset.data = newDataset.data;
      existingDataset.label = newDataset.label;
      // ✅ Force colors like chart2.js
      existingDataset.backgroundColor = colors[index % colors.length].background;
      existingDataset.borderColor = colors[index % colors.length].border;
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

  // --- Update/Add feedback datasets ---
  ["Satisfied", "Unsatisfied"].forEach((labelPrefix, idx) => {
    const newFeedback = newDatasets.find((ds) =>
      ds.label.startsWith(labelPrefix)
    );
    let existingFeedback = chart.data.datasets.find((ds) =>
      ds.label.startsWith(labelPrefix)
    );

    if (existingFeedback) {
      existingFeedback.data = newFeedback.data;
      existingFeedback.label = newFeedback.label;
      // ✅ Always reapply gradient function (not just keep old string)
      existingFeedback.backgroundColor = newFeedback.backgroundColor;
      existingFeedback.borderColor = newFeedback.borderColor;
      needsUpdate = true;
    } else {
      chart.data.datasets.push(newFeedback);
      needsUpdate = true;
    }
  });

  // Update chart scaling if changed
  if (needsUpdate) {
    chart.options.scales.y.suggestedMax = getYMax(
      chart.data.datasets,
      chart.getZoomLevel()
    );
    chart.options.scales.y.ticks.callback = function (value) {
      const zoomLevel = this.chart.getZoomLevel();
      const yMax = getYMax(this.chart.data.datasets, zoomLevel);
      const step = zoomLevel <= 1.5 ? 1 : zoomLevel <= 2.5 ? 2 : 3;
      return value % step === 0 && value <= yMax ? value : null;
    };
    chart.options.plugins.zoom.limits.y.max =
      Math.max(...chart.data.datasets.flatMap((ds) => ds.data), 1) * 1.2;
  
	// --- Keep legend order: services first (snames order), then feedback ---
chart.data.datasets.sort((a, b) => {
  const serviceIndexA = snames.findIndex((s) => a.label.startsWith(s));
  const serviceIndexB = snames.findIndex((s) => b.label.startsWith(s));

  if (serviceIndexA !== -1 && serviceIndexB !== -1) {
    return serviceIndexA - serviceIndexB; // both are services
  }
  if (serviceIndexA !== -1) return -1; // a = service, b = feedback
  if (serviceIndexB !== -1) return 1;  // b = service, a = feedback

  // Both feedback → keep "Satisfied" before "Unsatisfied"
  if (a.label.startsWith("Satisfied")) return -1;
  if (b.label.startsWith("Satisfied")) return 1;
  return 0;
});

	  chart.update();
  }
}

});
