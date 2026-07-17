let adQueue = [];
let currentAdIndex = 0;
let videoElement = null;
let playing = false;
let adVolume = 0;

function applyAdVolume(value) {
	adVolume = Math.min(Math.max(Number(value ?? 0), 0), 1);
	if (!videoElement) return;
	videoElement.muted = adVolume <= 0;
	videoElement.volume = adVolume;
}

socket.on('voiceConfigUpdate', config => {
	if (config && config.ad_volume !== undefined) applyAdVolume(config.ad_volume);
});

// --- Ads + Volume handler ---
socket.on("adsList", (data) => {
	if (!data || !Array.isArray(data.ads) || !data.ads.length) return;
	const oldQueue = adQueue.join(",");
	adQueue = [...data.ads];
	
	// clamp volume between 0-1
	adVolume = Math.min(Math.max(Number(data.volume ?? 0), 0), 1);

	// 🔥 update volume instantly if already playing
	if (videoElement) {
		videoElement.muted = adVolume <= 0;
		videoElement.volume = adVolume;
	}

	// Only reset index if ads changed or nothing is playing
	// if (!playing || oldQueue !== adQueue.join(",")) {
	if (oldQueue !== adQueue.join(",")) {
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
	if (videoElement) {
		videoElement.pause();
		console.log("[ADS] Video paused");
	}
}

function playvid() {
	if (videoElement && $(".video-container").is(":visible")) {
		videoElement.play().catch((err) => {
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
