
let currentDisplayConfig = null;
$(document).ready(function () {
	getDisplayServices();
});

socket.on("calledticketsArrived", function () {
	getDisplayServices();
});
// Recommended version – clean and easy to understand
async function getDisplayServices() {
	try {
		const response = await fetch('/api/getServicesDisplay', {
			method: 'GET',
			headers: {
				'Accept': 'application/json'   // tells server we expect JSON
			}
		});
		if (!response.ok) {
			throw new Error(`Server responded with status ${response.status} ${response.statusText}`);
		}
		const data = await response.json();
		if (!data.success) {
			console.error('Invalid services response from server:', data);
			return;
		}
		displayServicesCards(data.services);
	} catch (error) {
		console.error('Failed to load display services:', error.message);
	}
}

function displayServicesCards(services) {
	const $servicesList = $("#servicesDisplay");
	if (!$servicesList.length) {
		console.error('Element #servicesDisplay not found in DOM');
		return;
	}
	// Clear previous content
	$servicesList.empty();

	// Add header
	const $headerDiv = $("<div>").addClass("service-header");
	$headerDiv.append($("<span>").addClass("tickethead").text("NOW SERVING"));
	$servicesList.append($headerDiv);

	// Decide layout based on counter display mode

	services.forEach((service) => {
		const $rowDiv = $("<div>").addClass("service-row");
		const serviceName = service.shortSname || '—';

		const $serviceName = $("<span>")
			.addClass("service-name")
			.html(serviceName);
		// attach length as data attribute
		$serviceName.attr("data-length", serviceName.length);

		$rowDiv.append($serviceName);
		if (serviceName.length <= 16) {
			$serviceName.css("font-size", "3vw");
		}
		$rowDiv.append(
			$("<span>")
				.addClass("sub-name")
				.html(service.sub_sname || '—')
		);
		// Ticket number
		const ticketText = service.ticket || '--';
		$rowDiv.append(
			$("<span>")
				.addClass("service-ticket")
				.text(ticketText)
			,
			$("<span>")
				.addClass("counter")
				.text(service.counter_num)
		);
		$servicesList.append($rowDiv);
	});

	if (typeof setServicesDisplay === 'function') {
		setServicesDisplay(services.length);
	}
	adjustServiceNameFont();
	// Video control logic
	if (services.length > 10) {
		if (typeof pausevid === 'function') pausevid();
	} else {
		if (typeof playvid === 'function') playvid();
	}
}

function setServicesDisplay(count) {
	// ! Counter Display Handler
	$(".counter").css({
		"display": "flex",
	});
	$(".service-ticket").css({
		"width": "75%",
	});
	$(".timer").css({
		"left": "66%",
		"width": "fit-content",
		"flex-direction": "row",
		"top": "1%",
	})
	if (count <= 10) {
		$(".video-container").css({
			"display": "flex",
		});
		playvid();
		$(".content-container").css({
			"left": "50%",
			"width": "50%",
		});
		$("#sub_popup").css({
			"left": "1%",
			"width": "50%",
		});
	} else {
		$(".video-container").css({
			"display": "none",
		})
		$(".content-container").css({
			"top": "10%",
			"height": "83%",
			"left": "0%",
			"width": "100%",
		})
		$("#sub_popup").css({
			"left": "0%",
			"width": "100%",
		}),
			$(".service-header").css({
				"display": "none",
			})
		$(".timer").css({
			"left": "60%",
			"top": "5%",
		})
	}

	// ! Services Display Size Handler
	if (count === 1) {
		$(".service-row").css({
			"height": "90%",
			"width": "100%",
		});
		$(".service-name").css({
			"height": "25%",
		});
		$(".counter").css({
			"font-size": "10rem",
		});
		$(".service-ticket").css({
			"font-size": "8rem"
		});
	} else if (count === 2) {
		$(".service-row").css({
			"height": "45%",
			"width": "100%",
		});
		$(".service-name").css({
			"height": "25%",
		});
		$(".counter").css({
			"font-size": "10rem",
		});
		$(".service-ticket").css({
			"font-size": "8rem"
		});
	} else if (count === 3) {
		$(".service-row").css({
			"height": "30%",
			"width": "100%",
		});
		$(".service-name").css({
			"height": "25%",
		});
		$(".counter").css({
			"font-size": "10rem",

		});
		$(".service-ticket").css({
			"font-size": "8rem"
		});
	} else if (count === 4) {
		$(".service-row").css({
			"height": "45%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "5rem",
		});
		$(".service-ticket").css({
			"font-size": "5rem"
		});
	} else if (count === 5) {
		$(".service-row").css({
			"height": "30%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "5rem",

		});
		$(".service-ticket").css({
			"font-size": "5rem"
		});
	} else if (count === 6) {
		$(".service-row").css({
			"height": "33%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.2rem"
		});
		$(".counter").css({
			"font-size": "5rem",

		});
		$(".service-ticket").css({
			"font-size": "4.7rem"
		});
	} else if (count === 7) {
		$(".service-row").css({
			"height": "24%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2rem"
		});
		$(".counter").css({
			"font-size": "5rem",

		});
		$(".service-ticket").css({
			"font-size": "3.5rem"
		});
	} else if (count === 8) {
		$(".service-row").css({
			"height": "24%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.3rem"
		});
		$(".counter").css({
			"font-size": "5rem",

		});
		$(".service-ticket").css({
			"font-size": "3.8rem"
		});
	} else if (count === 9) {
		$(".service-row").css({
			"height": "19%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.rem"
		});
		$(".counter").css({
			"font-size": "4rem",

		});
		$(".service-ticket").css({
			"font-size": "4rem"
		});
	} else if (count === 10) {
		$(".service-row").css({
			"height": "19%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.3rem"
		});
		$(".counter").css({
			"font-size": "4rem",

		});
		$(".service-ticket").css({
			"font-size": "4rem"
		});
	} else if (count === 11) {
		$(".service-row").css({
			"height": "24%",
			"width": "33.3%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "6rem",

		});
		$(".service-ticket").css({
			"font-size": "5rem"
		});
	} else if (count === 12) {
		$(".service-row").css({
			"height": "24%",
			"width": "33.3%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "6rem",

		});
		$(".service-ticket").css({
			"font-size": "5rem"
		});
	} else if (count === 13) {
		$(".service-row").css({
			"height": "19%",
			"width": "33.3%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "6rem",

		});
		$(".service-ticket").css({
			"font-size": "5rem"
		});
	} else if (count === 14) {
		$(".service-row").css({
			"height": "18%",
			"width": "33.3%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "6rem",

		});
		$(".service-ticket").css({
			"font-size": "5rem"
		});
	} else if (count === 15) {
		$(".service-row").css({
			"height": "18%",
			"width": "33.3%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "6rem",

		});
		$(".service-ticket").css({
			"font-size": "5rem"
		});
	} else if (count === 16) {
		$(".service-row").css({
			"height": "23%",
			"width": "25%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.3rem"
		});
		$(".counter").css({
			"font-size": "6rem",
		});
		$(".service-ticket").css({
			"font-size": "4rem"
		});
	}
}
// Adjust font size based on service name length
function adjustServiceNameFont() {
	$(".service-name").each(function () {

		const length = $(this).text().trim().length;

		let size;

		if (length <= 12) {
			size = "2.3rem";
		} else if (length <= 16) {
			size = "2.5rem";
		} else if (length <= 22) {
			size = "2rem";
		} else {
			size = "1.5rem";
		}

		this.style.setProperty("font-size", size, "important");
	});
}
function applyDisplayConfig(config) {
	const displayUpdate = config.display_update || {};
	if (displayUpdate.update === 1) {
		socket.emit("updateDisplay");
		socket.once("updatedisplaySuccess", () => {
			window.location.reload();
		});
		socket.once("updatedisplayError", (errMsg) => {
			console.error("Display update failed:", errMsg);
		});
	}

	$(".time").css({
		"color": config.time_color,
		"text-shadow": `2px 2px 5px ${config.time_shadow}`,
	});
	$(".date").css({
		"color": config.date_color
	});
	$(".tickethead").css({
		"color": config.nowserve_text_color,
		"background-color": config.nowserve_color,
	});
	$(".service-name").css({
		"color": config.service_text_color,
		"background-color": config.service_color,
	});
	$(".counter").css({
		"color": config.counter_text_color,
		"background-color": config.counter_color,
	});
	$(".service-ticket").css({
		"color": config.ticket_text_color,
		"background-color": config.ticket_color,
	});
	$("#ticketpop").css({
		"color": config.popup_ticket_color,
		"text-shadow": `2px 2px 5px ${config.popup_service_color}`,
	});
	$("#counterpop").css({
		"color": config.popup_service_color,
		"text-shadow": `2px 2px 5px ${config.popup_ticket_color}`,
	});
}