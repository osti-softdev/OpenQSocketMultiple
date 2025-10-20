let ffmpeg;
let isProcessing = false;
let ffmpegReady = false;
// Initialize FFmpeg
async function initFFmpeg() {
	try {
		if (!window.ffmpegInstance)
			throw new Error("ffmpegInstance is not defined");
		ffmpeg = window.ffmpegInstance;

		await ffmpeg.load({
			log: true,
			corePath: window.ffmpegCoreURL,
			wasmPath: window.ffmpegWasmURL,
			workerPath: window.ffmpegMtWorkerURL,
		});
		ffmpeg.on("log", ({ message }) => {
			console.log("FFmpeg log:", message);
		});

		ffmpeg.on("progress", ({ progress }) => {
			const percent = Math.round(progress * 100);
			$("#statusMsg .progress").text(`${percent}%`);
		});

		ffmpegReady = true;
		console.log("✅ FFmpeg initialized");
		toggleFFmpegReady(true);
	} catch (err) {
		console.error("❌ Failed to initialize FFmpeg:", err);
		msg(`Failed to initialize FFmpeg: ${err.message}`, true);
	}
}
function requireFFmpegReady(callback) {
	return async function (...args) {
		if (!ffmpegReady) {
			msg("⚠ FFmpeg is still loading, please wait...", true);
			return;
		}
		return callback.apply(this, args);
	};
}

// Reinitialize FFmpeg after exit
async function reinitializeFFmpeg() {
	try {
		await ffmpeg.load({
			corePath: window.ffmpegCoreURL,
			wasmPath: window.ffmpegWasmURL,
			workerPath: window.ffmpegMtWorkerURL,
		});
		console.log("FFmpeg reinitialized successfully.");
	} catch (err) {
		console.error("Error during FFmpeg re-initialization:", err);
		msg("❌ Failed to reinitialize FFmpeg.", true);
	}
}

// Run FFmpeg task
async function runFFmpeg(args) {
	if (isProcessing) {
		msg("⚠ A process is already running. Please wait.", true);
		return null;
	}

	isProcessing = true;
	toggleProcessingState(true);

	try {
		console.log("🎬 Running FFmpeg with args:", args);
		await ffmpeg.exec(args);
		console.log("✅ FFmpeg process completed");
		msg("✅ Process completed");
	} catch (err) {
		console.error("❌ FFmpeg error:", err);
		msg(`FFmpeg error: ${err.message}`, true);
	} finally {
		isProcessing = false;
		toggleProcessingState(false);
	}
}
function toggleProcessingState(disabled) {
	$(".processBtn")
		.prop("disabled", disabled)
		.css("filter", disabled ? "brightness(50%)" : "brightness(100%)");

	if (disabled) {
		$.notify("Processing, please wait...", { className: "warn" });
	} else {
		$.notify("Ready for next process", { className: "success" });
	}
}
function toggleFFmpegReady(ready) {
	$(".processBtn")
		.prop("disabled", !ready)
		.css("filter", ready ? "brightness(100%)" : "brightness(30%)");

	// if (ready) {
	//     $.notify("✅ FFmpeg is ready", { className: "success" });
	// } else {
	//     $.notify("⚠ Initializing FFmpeg...", { className: "warn" });
	// }
}
// Utility: get current video file
async function getCurrentVideoFile() {
	const currentVideo = adminAdsQueue[adminCurrentIndex];
	if (!currentVideo) {
		msg("⚠ No video selected.", true);
		return null;
	}
	const response = await fetch(filenameToUrl(currentVideo));
	const blob = await response.blob();
	return new File([blob], currentVideo);
}

// Utility: get video details
function getVideoDetails(file) {
	return new Promise((resolve) => {
		const video = document.createElement("video");
		video.preload = "metadata";
		video.src = URL.createObjectURL(file);
		video.onloadedmetadata = () => {
			const duration = video.duration.toFixed(2);
			const width = video.videoWidth;
			const height = video.videoHeight;
			URL.revokeObjectURL(video.src);
			resolve({ duration, width, height });
		};
	});
}

// Show file details
async function showFileDetails(file, resetProgress = true) {
	const details = await getVideoDetails(file);
	$("#statusMsg")
		.html(
			`
        🎬 <b>${file.name}</b><br>
        🕒 Duration: ${details.duration}s<br>
        📐 Resolution: ${details.width}x${details.height}<br>
        <span class="progress">${resetProgress ? "Ready" : ""}</span>
    `
		)
		.css("color", "inherit");
}
// Save processed video
async function saveProcessedVideo(blob, outputName) {
	const formData = new FormData();
	formData.append("video", blob, outputName);
	try {
		const res = await fetch("/upload-video", {
			method: "POST",
			body: formData,
		});
		if (!res.ok) throw new Error(await res.text());

		msg(`✅ Saved: ${outputName}`);
		lastUploadedFile = outputName;
		socket.emit("requestAd");
	} catch (err) {
		msg(`❌ Save failed: ${err.message}`, true);
	}
}

// Display messages
function msg(message, isError = false) {
	const $msgBox = $("#statusMsg");
	$msgBox
		.text(message)
		.css("color", isError ? "red" : "green")
		.show();
}
// --- Main ---
$(document).ready(async () => {
	toggleFFmpegReady(false);
	await initFFmpeg();

	// --- Trim Video ---
	$("#trimBtn").on(
		"click",
		requireFFmpegReady(async () => {
			$("#statusMsg").slideDown(200);
			const start = parseFloat($("#trimStart").val());
			const end = parseFloat($("#trimEnd").val());
			const file = await getCurrentVideoFile();
			if (!file) return;

			await showFileDetails(file, false); // do not reset to Ready

			if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
				msg("⚠ Invalid trim values.", true);
				return;
			}

			const inputName = "input.mp4";
			const outputName = `trimmed_${file.name}`;
			await ffmpeg.writeFile(inputName, await window.fetchFile(file));
			await runFFmpeg([
				"-i",
				inputName,
				"-ss",
				start.toString(),
				"-to",
				end.toString(),
				"-c",
				"copy",
				outputName,
			]);

			const data = await ffmpeg.readFile(outputName);
			const blob = new Blob([data.buffer], { type: "video/mp4" });
			await saveProcessedVideo(blob, outputName);
		})
	);

	// --- Rotate Video ---
	$("#rotateBtn").on(
		"click",
		requireFFmpegReady(async () => {
			$("#statusMsg").slideDown(200);
			const angle = parseInt($("#rotateAngle").val());
			const file = await getCurrentVideoFile();
			if (!file) return;

			await showFileDetails(file, false);

			const inputName = "input.mp4";
			const outputName = `rotated_${file.name}`;
			await ffmpeg.writeFile(inputName, await window.fetchFile(file));

			let rotateFilter = "transpose=0";
			if (angle === 90) rotateFilter = "transpose=1";
			else if (angle === 180) rotateFilter = "transpose=1,transpose=1";
			else if (angle === 270) rotateFilter = "transpose=2";

			await runFFmpeg([
				"-i",
				inputName,
				"-vf",
				rotateFilter,
				"-c:a",
				"copy",
				outputName,
			]);

			const data = await ffmpeg.readFile(outputName);
			const blob = new Blob([data.buffer], { type: "video/mp4" });
			await saveProcessedVideo(blob, outputName);
		})
	);

	// --- Mute Video ---
	$("#muteBtn").on(
		"click",
		requireFFmpegReady(async () => {
			$("#statusMsg").slideDown(200);
			const file = await getCurrentVideoFile();
			if (!file) return;

			await showFileDetails(file, false);

			const inputName = "input.mp4";
			const outputName = `muted_${file.name}`;
			await ffmpeg.writeFile(inputName, await window.fetchFile(file));
			await runFFmpeg(["-i", inputName, "-an", "-c:v", "copy", outputName]);

			const data = await ffmpeg.readFile(outputName);
			const blob = new Blob([data.buffer], { type: "video/mp4" });
			await saveProcessedVideo(blob, outputName);
		})
	);

	// --- Resize Video ---
	$("#resizeBtn").on(
		"click",
		requireFFmpegReady(async () => {
			$("#statusMsg").slideDown(200);
			const resolution = $("#resizePreset").val();
			const file = await getCurrentVideoFile();
			if (!file) return;

			await showFileDetails(file, false);

			const inputName = "input.mp4";
			const outputName = `resized_${file.name}`;
			await ffmpeg.writeFile(inputName, await window.fetchFile(file));
			await runFFmpeg([
				"-i",
				inputName,
				"-vf",
				`scale=${resolution}`,
				"-c:a",
				"copy",
				outputName,
			]);

			const data = await ffmpeg.readFile(outputName);
			const blob = new Blob([data.buffer], { type: "video/mp4" });
			await saveProcessedVideo(blob, outputName);
		})
	);

	// --- Convert Video ---
	$("#convertBtn").on(
		"click",
		requireFFmpegReady(async () => {
			$("#statusMsg").slideDown(200);
			const file = await getCurrentVideoFile();
			if (!file) return;

			await showFileDetails(file, false);

			const inputName = "input.mp4";
			const outputName = `converted_${file.name.replace(/\.[^/.]+$/, "")}.mp4`;
			await ffmpeg.writeFile(inputName, await window.fetchFile(file));
			await runFFmpeg([
				"-i",
				inputName,
				"-c:v",
				"libx264",
				"-c:a",
				"aac",
				"-f",
				"mp4",
				outputName,
			]);

			const data = await ffmpeg.readFile(outputName);
			const blob = new Blob([data.buffer], { type: "video/mp4" });
			await saveProcessedVideo(blob, outputName);
		})
	);

	// --- Screenshot ---
	$("#screenshotBtn").on(
		"click",
		requireFFmpegReady(async () => {
			$("#statusMsg").slideDown(200);
			const file = await getCurrentVideoFile();
			if (!file) return;

			await showFileDetails(file, false);

			const inputName = "input.mp4";
			const outputName = `screenshot_${file.name.replace(/\.[^/.]+$/, "")}.png`;
			await ffmpeg.writeFile(inputName, await window.fetchFile(file));
			await runFFmpeg([
				"-i",
				inputName,
				"-vframes",
				"1",
				"-f",
				"image2",
				outputName,
			]);

			const data = await ffmpeg.readFile(outputName);
			const blob = new Blob([data.buffer], { type: "image/png" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = outputName;
			a.click();
			URL.revokeObjectURL(url);

			msg("📸 Screenshot saved.");
		})
	);

	// --- Show / Hide details ---
	$("#adsshowdetails").on("click", () => $("#statusMsg").show(100));
	$("#adshidedetails").on("click", () => $("#statusMsg").hide(100));

	$("#statusMsg").draggable();
});
