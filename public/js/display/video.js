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
		// Guard against playing with no valid source
		if (!el.currentSrc && !el.getAttribute("src")) return;

		const playPromise = el.play();
		if (playPromise !== undefined) {
			playPromise.catch(err => {
				if (err.name === "NotAllowedError") {
					console.warn(`[ADS] Autoplay blocked for "${fileName || 'video'}", retrying muted...`, err);
					el.muted = true;
					if (retry) {
						setTimeout(() => attemptPlay(el, fileName, false), 300);
					}
				} else if (err.name === "AbortError") {
					// Expected when video load or pause interrupts play()
				} else if (err.name === "NotSupportedError") {
					console.warn(`[ADS] Video source not supported for "${fileName || 'video'}"`, err);
				} else {
					console.warn(`[ADS] Play error for "${fileName || 'video'}":`, err);
				}
			});
		}
	}

	function loadAd(fileName) {
		const el = getVideoElement();
		if (!el || !fileName) return;

		el.src = `/ads/${encodeURIComponent(fileName)}`;
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
		if (el) {
			el.onended = () => {
				console.log(`[ADS] Finished: ${adFile}`);
				playNextAd();
			};
			el.onerror = () => {
				console.warn(`[ADS] Failed to load "${adFile}", skipping to next`);
				setTimeout(() => playNextAd(), 1000);
			};
		}
	}

	function pausevid() {
		const el = getVideoElement();
		if (el && !el.paused) {
			el.pause();
			console.log("[ADS] Video paused");
		}
	}

	function playvid() {
		const el = getVideoElement();
		if (!el || !isContainerVisible()) return;

		if (!adQueue.length) return;

		const hasValidSource = !!(el.currentSrc || el.getAttribute("src"));
		if (!hasValidSource) {
			playNextAd();
			return;
		}

		if (el.paused) {
			const currentFile = adQueue[currentAdIndex - 1] || adQueue[0] || "";
			attemptPlay(el, currentFile);
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
		if (!data || !Array.isArray(data.ads)) return;

		applyAdVolume(data.volume);

		if (!data.ads.length) {
			adQueue = [];
			currentAdIndex = 0;
			pausevid();
			const el = getVideoElement();
			if (el) {
				el.removeAttribute("src");
				el.load();
			}
			return;
		}

		const incomingQueue = data.ads.join(",");
		const queueChanged = incomingQueue !== adQueue.join(",");

		adQueue = [...data.ads];

		const el = getVideoElement();
		const hasValidSource = el && !!(el.currentSrc || el.getAttribute("src"));

		// Restart or start if queue changed or if nothing is loaded yet
		if (queueChanged || !hasValidSource) {
			currentAdIndex = 0;
			if (isContainerVisible()) {
				playNextAd();
			}
		}
	});

	// --- Pause/resume when the ad slot is hidden (e.g. behind the ticket popup) ---
	function initVisibilityObserver() {
		const container = getContainerElement();
		if (!container) return;

		const observer = new MutationObserver(() => {
			const el = getVideoElement();
			if (!el) return;
			if (isContainerVisible()) {
				if (adQueue.length) {
					const hasValidSource = !!(el.currentSrc || el.getAttribute("src"));
					if (!hasValidSource) {
						playNextAd();
					} else if (el.paused) {
						const currentFile = adQueue[currentAdIndex - 1] || adQueue[0] || "";
						attemptPlay(el, currentFile);
					}
				}
			} else {
				if (!el.paused) {
					el.pause();
				}
			}
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