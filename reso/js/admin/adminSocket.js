$(document).ready(function () {
	// Initialize chart variable
	let barChartContent2 = null;

	// Socket event listener
	socket.on("dashadmindataupdate", (adminoveralldata) => {
		if (Object.keys(adminoveralldata).length === 0) {
			console.warn("No data returned for the selected date range");
			return;
		}

		// Update top stats
		$(".content2totalcount").html(
			`Total Transactions: <span>${adminoveralldata.overall.total_count || 0}</span>`
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



		// 🔹 Dynamically build the overcount data section
		const $container = $(".dash-content1");
		$container.empty(); // clear existing

		// Append each service dynamically
		if (adminoveralldata.services && adminoveralldata.services.length > 0) {
			adminoveralldata.services.forEach((srv) => {
				$container.append(`
					<div class="overcounts" data-ovrcnt="${srv.sname}">
						${srv.sname} <span class="overcountdata">${srv.called_count || 0}</span>
					</div>
				`);
			});
		}


		
	});
});
