let voices = [];
let pendingSettings = null;

// 🔊 Speak helper
function speak(text, voiceIndex = 0, volume = 1, rate = 1, pitch = 1) {
	if (!voices.length) return;
	const utter = new SpeechSynthesisUtterance(text);
	utter.voice = voices[voiceIndex] || voices[0];
	utter.volume = volume;
	utter.rate = rate;
	utter.pitch = pitch;
	speechSynthesis.speak(utter);
}

// 📋 Load voices into <select>
function loadVoices() {
	voices = speechSynthesis.getVoices();
	const $select = $("#selectadminvoice");
	$select.empty();

	voices.forEach((v, i) => {
		$("<option>").val(i).text(`${v.name} (${v.lang})`).appendTo($select);
	});

	// 🔄 Apply pending settings if they arrived before voices were ready
	if (pendingSettings) {
		applySettings(pendingSettings);
		pendingSettings = null;
	}
}

// Reload voices when available
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();
// 🔢 Normalize slider value to percent
function normalizeToPercent(value, min, max) {
	if (value == null) return 0;
	const percent = ((value - min) / (max - min)) * 100;
	return Math.round(Math.min(Math.max(percent, 0), 100)); // clamp 0–100
}

// 🎚 Apply settings to UI
function applySettings(settings) {
	$("#selectadminvoice").val(settings.voice);
	$("#adminvoicevolume").val(settings.voice_volume);
	$("#adminvoicerate").val(settings.voice_rate);
	$("#adminvoicepitch").val(settings.voice_pitch);
	$("#adminadsvolume").val(settings.ad_volume);
	$("#adminbellvolume").val(settings.bell_volume);

	// Show numeric values
	$("#voiceRateVal").text(
		normalizeToPercent(settings.voice_rate, 0.1, 3) + "%"
	);
	$("#voicePitchVal").text(
		normalizeToPercent(settings.voice_pitch, 0, 2) + "%"
	);
	$("#voiceVolVal").text(normalizeToPercent(settings.voice_volume, 0, 1) + "%");
	$("#adsVolVal").text(normalizeToPercent(settings.ad_volume, 0, 1) + "%");
	$("#bellVolVal").text(normalizeToPercent(settings.bell_volume, 0, 1) + "%");
	// Show selected voice name
	if (voices.length > 0 && voices[settings.voice]) {
		$("#currentVoiceName").text(` → ${voices[settings.voice].name}`);
	} else {
		$("#currentVoiceName").text("");
	}
}

// 🎚 Sync settings from server
socket.on("soundSettingsUpdated", (settings) => {
	if (!voices.length) {
		// Voices not ready yet → save for later
		pendingSettings = settings;
	} else {
		applySettings(settings);
	}
});

$(document).ready(function () {
	socket.emit("updateSoundSettings");
});

// 🎤 Auto-preview when selecting voice
$(document).on("change", "#selectadminvoice", function () {
	const voiceIndex = parseInt($(this).val());
	const volume = parseFloat($("#adminvoicevolume").val());
	const rate = 1;
	const pitch = 1;

	// reset the sliders visually
	$("#adminvoicerate").val(rate).trigger("input");
	$("#adminvoicepitch").val(pitch).trigger("input");

	// update backend
	socket.emit("updateSoundSettings", {
		voice: voiceIndex,
		voice_rate: rate,
		voice_pitch: pitch,
	});

	// Update label
	if (voices[voiceIndex]) {
		$("#currentVoiceName").text(` → ${voices[voiceIndex].name}`);
	}

	// preview speech
	speak(
		`Hello, I am ${voices[voiceIndex].name}`,
		voiceIndex,
		volume,
		rate,
		pitch
	);
});

// 🔊 Button to test custom text
$(document).on("click", "#tryVoiceBtn", function () {
	const text = $("#tryVoiceText").val() || "Hello, this is a test voice.";
	const voiceIndex = parseInt($("#selectadminvoice").val());
	const rate = parseFloat($("#adminvoicerate").val());
	const pitch = parseFloat($("#adminvoicepitch").val());
	const volume = parseFloat($("#adminvoicevolume").val());
	speak(text, voiceIndex, volume, rate, pitch);
});

// 🎚 Sliders update server + show live values
function updateVoicePreview() {
	const voiceIndex = parseInt($("#selectadminvoice").val());
	const volume = parseFloat($("#adminvoicevolume").val());
	const rate = parseFloat($("#adminvoicerate").val());
	const pitch = parseFloat($("#adminvoicepitch").val());

	// Stop any ongoing speech
	speechSynthesis.cancel();

	// Speak a short sample
	if (voices[voiceIndex]) {
		speak(`Hello?, Hi!`, voiceIndex, volume, rate, pitch);
	}
}

// Rate slider
$("#adminvoicerate").on("change", function () {
	const val = parseFloat($(this).val());
	socket.emit("updateSoundSettings", { voice_rate: val });
	updateVoicePreview();
});

// Pitch slider
$("#adminvoicepitch").on("change", function () {
	const val = parseFloat($(this).val());
	socket.emit("updateSoundSettings", { voice_pitch: val });
	updateVoicePreview();
});

// Volume slider
$("#adminvoicevolume").on("change", function () {
	const val = parseFloat($(this).val());
	socket.emit("updateSoundSettings", { voice_volume: val });
	updateVoicePreview();
});

// Ads volume (no speech preview needed)
$("#adminadsvolume").on("change", function () {
	const val = parseFloat($(this).val());
	socket.emit("updateSoundSettings", { ad_volume: val });
});

// Bell volume (no speech preview needed)
$("#adminbellvolume").on("change", function () {
	const val = parseFloat($(this).val());
	socket.emit("updateSoundSettings", { bell_volume: val });
});

// ! ON INPUTS
function updateSliderDisplay(selector, target) {
	const $slider = $(selector);
	const min = parseFloat($slider.attr("min")) || 0;
	const max = parseFloat($slider.attr("max")) || 1;

	$slider.on("input", function () {
		const val = parseFloat(this.value);
		const percent = Math.round(((val - min) / (max - min)) * 100);
		$(target).text(percent + "%");
	});

	// trigger initial display
	$slider.trigger("input");
}

// Voice Rate (0.1–3 → %)
updateSliderDisplay("#adminvoicerate", "#voiceRateVal");

// Voice Pitch (0–2 → %)
updateSliderDisplay("#adminvoicepitch", "#voicePitchVal");

// Voice Volume (0–1 → %)
updateSliderDisplay("#adminvoicevolume", "#voiceVolVal");

// Ads Volume (0–1 → %)
updateSliderDisplay("#adminadsvolume", "#adsVolVal");

// Bell Volume (0–1 → %)
updateSliderDisplay("#adminbellvolume", "#bellVolVal");
