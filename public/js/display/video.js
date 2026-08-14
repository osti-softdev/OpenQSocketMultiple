// /js/display/video.js
// Handles ad rotation on the display screen.
// Listens for "adsList" (queue + volume) and "voiceConfigUpdate" (volume only)
// from getads.js over Socket.io, then plays the videos back-to-back in a loop.

(function () {
	"use strict";

	const AD_ELEMENT_ID = "dep";
	const CONTAINER_SELECTOR = ".video-container";

	let adQueue = [];
	let currentAdIndex = 0;
	let adVolume = 0;
	let videoElement = null;
	let containerElement = null;

	// --- Element helpers (cached, since #dep never changes) ---
	function getVideoElement() {
		if (!videoElement) videoElement = document.getElementById(AD_ELEMENT_ID);
		return videoElement;
	}

	function getContainerElement() {
		if (!containerElement) containerElement = document.querySelector(CONTAINER_SELECTOR);
		return containerElement;
	}

	function isContainerVisible() {
		const el = getContainerElement();
		return !!el && $(el).is(":visible");
	}

	// --- Volume ---
	function applyAdVolume(value) {
		adVolume = Math.min(Math.max(Number(value ?? 0), 0), 1);
		const el = getVideoElement();
		if (!el) return;
		el.muted = adVolume <= 0;
		el.volume = adVolume;
	}

	// --- Playback ---
	function attemptPlay(el, fileName, retry = true) {
		if (!el) return;
		el.play().catch(err => {
			console.warn(`[ADS] Autoplay blocked for "${fileName}", retrying...`, err);
			if (retry) setTimeout(() => attemptPlay(el, fileName, false), 300);
		});
	}

	function loadAd(fileName) {
		const el = getVideoElement();
		if (!el || !fileName) return;

		el.src = `/ads/${encodeURIComponent(fileName)}`;
		el.autoplay = true;
		el.playsInline = true;
		el.muted = adVolume <= 0;
		el.volume = adVolume;
		el.load();
		attemptPlay(el, fileName);
	}

	function playNextAd() {
		if (!adQueue.length) return;

		if (currentAdIndex >= adQueue.length) currentAdIndex = 0; // loop back
		const adFile = adQueue[currentAdIndex++];

		console.log(`[ADS] Playing: ${adFile} (volume ${adVolume})`);
		loadAd(adFile);

		const el = getVideoElement();
		el.onended = () => {
			console.log(`[ADS] Finished: ${adFile}`);
			playNextAd();
		};
		el.onerror = () => {
			console.warn(`[ADS] Failed to load "${adFile}", skipping to next`);
			playNextAd();
		};
	}

	function pausevid() {
		const el = getVideoElement();
		if (el) {
			el.pause();
			console.log("[ADS] Video paused");
		}
	}

	function playvid() {
		const el = getVideoElement();
		if (el && isContainerVisible()) {
			attemptPlay(el, adQueue[currentAdIndex - 1] || "");
			console.log("[ADS] Video playing");
		}
	}

	// --- Socket handlers ---
	socket.on("voiceConfigUpdate", config => {
		if (config && config.ad_volume !== undefined) applyAdVolume(config.ad_volume);
	});

	// "displayQueue" carries the schedule-resolved active queue (pinned video or
	// active playlist, falling back to the default playlist). This is distinct
	// from "adsList", which is the full admin video library and is NOT what
	// should be played on the display.
	socket.on("displayQueue", data => {
		if (!data || !Array.isArray(data.ads) || !data.ads.length) return;

		const incomingQueue = data.ads.join(",");
		const queueChanged = incomingQueue !== adQueue.join(",");

		adQueue = [...data.ads];
		applyAdVolume(data.volume);

		// Only restart from the top if the queue actually changed
		if (queueChanged) {
			currentAdIndex = 0;
			playNextAd();
		}
	});

	// --- Pause/resume when the ad slot is hidden (e.g. behind the ticket popup) ---
	function initVisibilityObserver() {
		const container = getContainerElement();
		if (!container) return;

		const observer = new MutationObserver(() => {
			const el = getVideoElement();
			if (!el) return;
			if (isContainerVisible()) attemptPlay(el, adQueue[currentAdIndex - 1] || "");
			else el.pause();
		});

		observer.observe(container, { attributes: true, attributeFilter: ["style", "class"] });
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initVisibilityObserver);
	} else {
		initVisibilityObserver();
	}

	// Exposed for other display scripts (popup.js, indexSocket.js, etc.)
	window.pausevid = pausevid;
	window.playvid = playvid;
})();