const socket = io();
socket.on("imagesupdates", (data) => {
	console.log("Image update event:", data);

	if (data.prerefresh) {
		window.location.reload();
	}
});
// --- Services Display ---
socket.on("servicesDisplayUpdate", (services) => {
	const $servicesList = $("#servicesDisplay");
	$servicesList.empty();
	console.log("Updating services display:", services);
	const $headerDiv = $("<div>").addClass("service-header");
	$headerDiv.append($("<span>").addClass("tickethead").text("NOW SERVING"));
	$servicesList.append($headerDiv);

	services.forEach((service) => {
		const $rowDiv = $("<div>").addClass("service-row");
		$rowDiv.append($("<span>").addClass("service-name").text(service.sname));
		$rowDiv.append($("<span>").addClass("service-ticket").text(service.ticket));
		$servicesList.append($rowDiv);
	});
});

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
