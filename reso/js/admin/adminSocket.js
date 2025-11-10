$(document).ready(function () {
	// Initialize chart variable
	let barChartContent2 = null;
	let unsatisfiedcount = 0;
	let satisfiedcount = 0;
	let lastUnsatisfied = 0;
	let lastSatisfied = 0;

	// Socket event listener
	socket.on("dashadmindataupdate", (adminoveralldata) => {
		if (Object.keys(adminoveralldata).length === 0) {
			console.warn("No data returned for the selected date range");
			return;
		}

		let satisfiedholder = adminoveralldata.satisfied ?? 0;
		let unsatisfiedholder = adminoveralldata.unsatisfied ?? 0;

		// ✅ Check if unsatisfied increased
		if (unsatisfiedholder > lastUnsatisfied) {
			unsatisfiedcount++;
			if (unsatisfiedcount >= 10) {
        	showMsg("warning", "⚠ Warning: Unsatisfied Rating is Rising");

				unsatisfiedcount = 0;
			}
		}

		// ✅ Check if satisfied increased
		if (satisfiedholder > lastSatisfied) {
			satisfiedcount++;
			if (satisfiedcount >= 10) {
        	showMsg("success", "✅ Great! Satisfied Rating is Rising");
				satisfiedcount = 0;
			}
		}

		// Update last values for next check
		lastUnsatisfied = unsatisfiedholder;
		lastSatisfied = satisfiedholder;

		// Update top stats
		$(".content2totalcount").html(
			`Total Transactions: <span>${adminoveralldata.overall.total_count || 0}</span>`
		);
		$(".content2totalrated").html(
			`Total Rated: <span>${
				(adminoveralldata.satisfied || 0) + (adminoveralldata.unsatisfied || 0)
			}</span>`
		);
		$(".content2totalserved").html(
			`Total Served: <span>${adminoveralldata.overall.called_count || 0}</span>`
		);
		$(".content2totalvoided").html(
			`Total Voided: <span>${adminoveralldata.overall.voided_count || 0}</span>`
		);
		$(".content2totalunserved").html(
			`Total Unserved: <span>${adminoveralldata.overall.pending_count || 0}</span>`
		);

		// 🔹 Find most used service
		let mostService = "None";
		let maxServiceCount = 0;
		if (adminoveralldata.services && adminoveralldata.services.length > 0) {
			adminoveralldata.services.forEach((srv) => {
				if ((srv.called_count || 0) > maxServiceCount) {
					maxServiceCount = srv.called_count;
					mostService = srv.sname || "Unknown";
				}
			});
		}
		$(".content2commonservice").html(
			`Most Service:<span>${mostService} (${maxServiceCount})</span>`
		);

		// 🔹 Find most rating
		const satisfied = adminoveralldata.satisfied || 0;
		const unsatisfied = adminoveralldata.unsatisfied || 0;
		let mostRating =
			satisfied > unsatisfied
				? `Satisfied (${satisfied})`
				: unsatisfied > satisfied
				? `Unsatisfied (${unsatisfied})`
				: `Equal (${satisfied})`;

		$(".content2commonrating").html(`Most Rating: <span>${mostRating}</span>`);

		// 🔹 Dynamically build the overcount data section
		const $container = $(".dash-content1");
		$container.empty(); // clear existing

		// Append each service dynamically
		if (adminoveralldata.services && adminoveralldata.services.length > 0) {
			adminoveralldata.services.forEach((srv) => {
				$container.append(`
					<div class="overcounts">
						${srv.sname} <span class="overcountdata">${srv.called_count || 0}</span>
					</div>
				`);
			});
		}

		// Append feedback counts
		$container.append(`
			<div class="overcounts">😊 Satisfied <span class="overcountdata">${adminoveralldata.satisfied ?? 0}</span></div>
			<div class="overcounts">😔 Unsatisfied <span class="overcountdata">${adminoveralldata.unsatisfied ?? 0}</span></div>
		`);
	});
});
