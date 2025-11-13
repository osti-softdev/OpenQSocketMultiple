// --- Called Tickets Popup with Queue ---
let voiceConfig = {
	voice: 0,
	voice_rate: 1,
	voice_pitch: 1,
	voice_volume: 1,
	bell_volume: 1,
};
let voices = [];
let ticketQueue = [];
let isProcessing = false;
let activeTicketIds = new Set();

// --- 1️⃣ Notify server immediately when client starts ---
socket.emit("clientReady", { status: "ready", time: new Date().toISOString() });

// --- 2️⃣ Get available voices ---
window.speechSynthesis.onvoiceschanged = () => {
	voices = window.speechSynthesis.getVoices();
};

// --- Voice config updates ---
socket.on("voiceConfigUpdate", (config) => {
	voiceConfig = { ...voiceConfig, ...config };
});

// --- 3️⃣ Called Tickets Update ---
socket.on("calledTicketsUpdate", (calledList) => {
	if (!calledList || !calledList.length) return;

	calledList.forEach((ticket) => {
		if (activeTicketIds.has(ticket.id)) return;
		ticketQueue.push(ticket);
		activeTicketIds.add(ticket.id);
	});

	processQueue();
});

async function processQueue() {
	if (isProcessing || ticketQueue.length === 0) return;

	isProcessing = true;
	const ticket = ticketQueue.shift();

	// Show popup
	showPopup(ticket);

	// --- 4️⃣ Notify server that the ticket is being processed right away ---
	socket.emit("updateCalledTicket", {
		id: ticket.id,
		status: "processing",
		counter_hist: "Topline",
	});

	// Speak the ticket twice, then continue
	speakTicketTwice(ticket, () => {
		hidePopup();

		activeTicketIds.delete(ticket.id);
		isProcessing = false;
		processQueue();
	});
}

function showPopup(ticketData) {
	const videoElement = $("#dep")[0];
	const audioElement = $("#audio")[0];

	if (videoElement && !videoElement.paused) videoElement.pause();
	let ticks = ticketData.sname.replace("_"," ");
	$("#popup").show();
	$("#counterpop").text(ticks);
	$("#ticketpop").text(`${ticketData.service}-${ticketData.ticket}`);

	// if (audioElement) {
	// 	audioElement.currentTime = 0;
	// 	audioElement.volume = voiceConfig.bell_volume || 1;
	// 	audioElement.play();
	// }
}

function hidePopup() {
	const videoElement = $("#dep")[0];
	$("#popup").hide();
	$("#ticketpop").text("");
	$("#counterpop").text("");

	if (videoElement && videoElement.readyState >= 3) videoElement.play();
}

function speakTicketTwice(ticketData, onFinish) {
	const synth = window.speechSynthesis;
	if (!voices.length) voices = synth.getVoices();

	const audioElement = $("#audio")[0];
	if (audioElement) audioElement.volume = voiceConfig.bell_volume || 1;

	const serviceCleaned = ticketData.service.replace(/-/g, " ");
	const serviceSeparated = serviceCleaned.split("").join(", ");
	let ticks = ticketData.sname.replace("_"," ");

	const msg = new SpeechSynthesisUtterance(
		`Now serving, ${serviceSeparated}${ticketData.ticket}, ${ticks}`
	);
	msg.voice = voices[voiceConfig.voice] || voices[0];
	msg.pitch = voiceConfig.voice_pitch || 1;
	msg.rate = voiceConfig.voice_rate || 1;
	msg.volume = voiceConfig.voice_volume || 1;

	let speakCount = 0;

	msg.onstart = () => {
		if (audioElement) {
			audioElement.currentTime = 0;
			audioElement.play();
		}
	};

	msg.onend = () => {
		speakCount++;
		if (speakCount < 2) {
			synth.speak(msg);
		} else {
			if (typeof onFinish === "function") onFinish();
		}
	};

	synth.speak(msg);
}
