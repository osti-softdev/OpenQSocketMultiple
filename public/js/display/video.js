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

	// Use existing hardcoded video element
	videoElement = document.getElementById("dep");


	videoElement.src = `/ads/${encodedFile}`;
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
