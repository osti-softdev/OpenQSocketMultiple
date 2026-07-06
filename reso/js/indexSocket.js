// ! ADS DISPLAY
let adQueue = [];
let currentAdIndex = 0;
let videoElement = null;
let playing = false;
let adVolume = 0;
socket.on("imagesupdates", (data) => {
	console.log("Image update event:", data);

	if (data.prerefresh) {
		window.location.reload();
	}
});

let currentDisplayConfig = null;
let counterDisplayer = null;

socket.on("DisplayUpdated", (config) => {
    currentDisplayConfig = config; // store latest config
    applyDisplayConfig(config);
});

socket.on("servicesDisplayUpdate", (data) => {
    const { counterDisplay: newCounterDisplay, services } = data || {};
    counterDisplayer = newCounterDisplay || 0;
    const $servicesList = $("#servicesDisplay");
    $servicesList.empty();

    const $headerDiv = $("<div>").addClass("service-header");
    $headerDiv.append($("<span>").addClass("tickethead").text("NOW SERVING"));
    $servicesList.append($headerDiv);

    if (counterDisplayer != 1) {
        services.forEach((service) => {
            const $rowDiv = $("<div>").addClass("service-row");
            $rowDiv.append($("<span>").addClass("service-name").html(service.shortSname));
            $rowDiv.append($("<span>").addClass("service-ticket").text(service.ticket));
            $servicesList.append($rowDiv);
        });
    } else {
        services.forEach((service) => {
            const $rowDiv = $("<div>").addClass("service-row");
            $rowDiv.append($("<span>").addClass("service-name").html(service.shortSname));
            $rowDiv.append($("<span>").addClass("service-ticket").text(service.ticket));
            $rowDiv.append($("<span>").addClass("counter").text(service.counter_num));
            $servicesList.append($rowDiv);
        });
    }

    setServicesDisplay(services.length);
	if (services.length > 10) {
		pausevid();
	} else {
		playvid();
	}
    // ✅ reapply config colors after rebuilding the DOM
    if (currentDisplayConfig) {
        applyDisplayConfig(currentDisplayConfig);
    }
});

function setServicesDisplay(count) {
	// ! Counter Display Handler
	if(counterDisplayer != 1){
		$(".counter").css({
			"display": "none",
		});
		$(".service-ticket").css({
			"width": "100%",
		}); 
	}else{
		$(".counter").css({
			"display": "flex",
		});
		$(".service-ticket").css({
			"width": "75%",
		});
	}
	if(count <= 10){
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
	}else{
		$(".video-container").css({
			"display": "none",
		})
		$(".content-container").css({
			"left": "0%",
			"width": "100%",
		})
		$("#sub_popup").css({
			"left": "0%",
			"width": "100%",
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
	}else if (count === 2) {
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
	}else if(count === 3){
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
	}else if (count === 4) {
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
	}else if(count === 5) {
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
	}else if (count === 6) {
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
	}else if (count === 7) {
		$(".service-row").css({
			"height": "23%",
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
			"font-size": "4rem"
		});
	}else if(count === 8) {
		$(".service-row").css({
			"height": "23%",
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
			"font-size": "4rem"
		});
	}else if(count === 9) {
		$(".service-row").css({
			"height": "18%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "4rem",

		});
		$(".service-ticket").css({
			"font-size": "4rem"
		});
	}else if(count === 10) {
		$(".service-row").css({
			"height": "18%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "4rem",

		});
		$(".service-ticket").css({
			"font-size": "4rem"
		});
	}else if(count === 11) {
		$(".service-row").css({
			"height": "23%",
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
	}else if(count === 12) {
		$(".service-row").css({
			"height": "23%",
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
	}else if(count === 13) {
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
	}else if(count === 14) {
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
	}else if(count === 15) {
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
	}else if(count === 16) {
		$(".service-row").css({
			"height": "23%",
			"width": "25%",
		});
		$(".service-name").css({
			"height": "25%",
			"font-size": "2.5rem"
		});
		$(".counter").css({
			"font-size": "6rem",
		});
		$(".service-ticket").css({
			"font-size": "4rem"
		});
	}
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



// --- Ads + Volume handler ---
socket.on("adsList", (data) => {
	if (!data || !Array.isArray(data.ads) || !data.ads.length) return;

	const oldQueue = adQueue.join(",");
	adQueue = [...data.ads];

	// clamp volume between 0-1
	adVolume = Math.min(Math.max(data.volume || 0, 0), 1);

	// 🔥 update volume instantly if already playing
	if (videoElement) {
		if (adVolume > 0) {
			videoElement.prop("muted", false);
			videoElement.prop("volume", adVolume);
		} else {
			videoElement.prop("muted", true);
			videoElement.prop("volume", 0);
		}
	}

	// Only reset index if ads changed or nothing is playing
	if (!playing || oldQueue !== adQueue.join(",")) {
		currentAdIndex = 0;
		playNextAd();
	}
});
function playNextAd() {
	if (!adQueue.length) return;

	if (currentAdIndex >= adQueue.length) {
		currentAdIndex = 0; // loop back
	}

	const adFile = adQueue[currentAdIndex++];
	playing = true;

	console.log(`[ADS] Playing ad: ${adFile} at volume ${adVolume}`);

	const encodedFile = encodeURIComponent(adFile);

	// Use existing hardcoded video element
		videoElement = document.getElementById("dep");

	// Stop previous playback safely
	videoElement.src = `http://192.168.1.30:12345/ads/${encodedFile}`;
	videoElement.autoplay = true;
	videoElement.playsInline = true;
	videoElement.load();
	videoElement.play().catch(() => { });

	// Volume logic
	if (adVolume > 0) {
		videoElement.muted = false;
		videoElement.volume = adVolume;
	} else {
		videoElement.muted = true;
		videoElement.volume = 0;
	}

	// Ensure autoplay actually fires  
	videoElement.play().catch(err => {
		console.warn("[ADS] Autoplay blocked, retrying...", err);
		setTimeout(() => videoElement.play(), 300);
	});

	// When finished, load next ad
	videoElement.onended = () => {
		console.log(`[ADS] Finished: ${adFile}`);
		playNextAd();
	};
}

function pausevid() {
    if (videoElement && videoElement[0]) {
        videoElement[0].pause();
        console.log("[ADS] Video paused");
    }
}

function playvid() {
    if (videoElement && videoElement[0] && $(".video-container").is(":visible")) {
        videoElement[0].play().catch((err) => {
            console.warn("[ADS] play() failed:", err);
        });
        console.log("[ADS] Video playing");
    }
}
// Automatically pause/resume based on container visibility
const observer = new MutationObserver(() => {
	if (!$(".video-container").is(":visible")) {
		videoElement.pause();
	} else {
		videoElement.play().catch(() => { });
	}
});

observer.observe(document.querySelector(".video-container"), {
	attributes: true,
	attributeFilter: ["style", "class"]
});
