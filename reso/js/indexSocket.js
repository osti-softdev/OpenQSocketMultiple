const socket = io();
socket.on("imagesupdates", (data) => {
	console.log("Image update event:", data);

	if (data.prerefresh) {
		window.location.reload();
	}
});

let counterDisplayer = 1;
// --- Services Display ---
socket.on("servicesDisplayUpdate", (data) => {
	const { counterDisplay: newCounterDisplay, services } = data || {};
		counterDisplayer = newCounterDisplay || 0;
	const $servicesList = $("#servicesDisplay");
	$servicesList.empty();
	console.log("Updating services display:", services);
	const $headerDiv = $("<div>").addClass("service-header");
	$headerDiv.append($("<span>").addClass("tickethead").text("NOW SERVING"));
	$servicesList.append($headerDiv);

	if(counterDisplayer != 1){
		services.forEach((service) => {
			console.log("Rendering service:", service);
			const $rowDiv = $("<div>").addClass("service-row");
			$rowDiv.append($("<span>").addClass("service-name").text(service.sname));
			$rowDiv.append($("<span>").addClass("service-ticket").text(service.ticket));
			$servicesList.append($rowDiv);
		});
	}else{
		services.forEach((service) => {
				console.log("Rendering service:", service);
				const $rowDiv = $("<div>").addClass("service-row");
				$rowDiv.append($("<span>").addClass("service-name").text(service.sname));
				$rowDiv.append($("<span>").addClass("service-ticket").text(service.ticket));
				$rowDiv.append($("<span>").addClass("counter").text(service.counter_num));
				$servicesList.append($rowDiv);
		});
	}

	setServicesDisplay(services.length);
});

function setServicesDisplay(count) {
	if (count <= 6) {
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
				"width": "80%",
			});
		}
		$(".service-row").css({
			"height": "30%",
			"width": "50%",
		});
		$(".service-name").css({
			"height": "25%",
			"width": "100%",
			
		});
	}else if (count > 6 && count <= 10) {
		
	}else if(count > 10) {
	}

}

let adQueue = [];
let currentAdIndex = 0;
let videoElement = null;
let playing = false;
let adVolume = 0;

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
	const container = $(".ad-slot").empty();

	videoElement = $("<video>")
		.attr({
			class: "ad-video",
			id: "dep",
			src: `/ads/${encodedFile}`,
			autoplay: true,
			playsinline: true,
		})
		.prop("controls", false)
		.prop("muted", adVolume === 0)
		.prop("volume", adVolume)
		.css({ width: "100%", height: "100%" })
		.on("ended", () => {
			console.log(`[ADS] Finished: ${adFile}`);
			playNextAd();
		})
		.on("play", function () {
			if (adVolume > 0) {
				setTimeout(() => {
					this.muted = false;
					this.volume = adVolume;
				}, 100);
			} else {
				this.muted = true;
				this.volume = 0;
			}
		});

	container.append(videoElement);
}
