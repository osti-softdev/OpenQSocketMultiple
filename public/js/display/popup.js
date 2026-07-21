// --- Called Tickets Popup with Queue ---
let voiceConfig = {
	voice_enabled: true,
	voice: '',
	voice_uri: '',
	voice_name: '',
	voice_rate: 1,
	voice_pitch: 1,
	voice_volume: 0.8,
	bell_volume: 0.7,
	ad_volume: 0.5,
};
let voices = [];
let ticketQueue = [];
let isProcessing = false;
let activeTicketIds = new Set();

socket.on("calledticketsArrived", function() {
	getCalledTickets();
});
getCalledTickets();
async function getCalledTickets() {
    try {
        const response = await fetch('/api/getCallingTickets', {
            method: 'GET',
            headers: {
                'Accept': 'application/json' 
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Same logic as before
        if (!data.success) {
            console.error('Invalid response from server:', data);
            return;
        }

        const calledList = data.tickets || []; 

        calledList.forEach((ticket) => {
            if (activeTicketIds.has(ticket.id)) return; 

            ticketQueue.push(ticket);
            activeTicketIds.add(ticket.id);
        });

        processQueue();

    } catch (error) {
        console.error('Failed to fetch calling tickets:', error.message);
    }
}
// --- Voice config updates ---
socket.on("voiceConfigUpdate", (config) => {
	voiceConfig = { ...voiceConfig, ...config };
});

if ('speechSynthesis' in window) {
	window.speechSynthesis.addEventListener('voiceschanged', () => {
		voices = window.speechSynthesis.getVoices();
	});
}

async function processQueue() {
	if (isProcessing || ticketQueue.length === 0) return;

	isProcessing = true;
	const ticket = ticketQueue.shift();

	// Show popup
	showPopup(ticket);

	// Update tickets
	fetch('/api/updateCalledTickets', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id: ticket.id })
		})
		.then(r => r.json())
		.then(data => {
		if (data.success) {
			console.log("Ticket called successfully!");
		} else {
			console.error("Error: " + data.error);
		}
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
	if (videoElement && !videoElement.paused) videoElement.pause();
	$("#popup").show();

		$("#counterpop").text("Counter " + ticketData.counter_num);
		$("#ticketpop").text(`${ticketData.service}-${ticketData.ticket}`);	
		// $("#ticketpop").text(`${ticketData.service}-${ticketData.ticket}`);	
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
	if (audioElement) audioElement.volume = Math.min(1, Math.max(0, Number(voiceConfig.bell_volume ?? 0.7)));

	const playBell = () => {
		if (!audioElement) return;
		audioElement.currentTime = 0;
		audioElement.play().catch(() => {});
	};

	if (voiceConfig.voice_enabled === false) {
		playBell();
		setTimeout(() => {
			if (typeof onFinish === 'function') onFinish();
		}, 1200);
		return;
	}

	const serviceCleaned = ticketData.service.replace(/-/g, " ");
	const serviceSeparated = serviceCleaned.split("").join(", ");
	
	const defaultFormat = "Now serving, #serviceticket! Please proceed to counter #counternumber";
	const formatStr = voiceConfig.voice_message_format || defaultFormat;
	const ticketStr = `${serviceSeparated}${ticketData.ticket}`;
	const counterStr = ticketData.counter_num;
	const finalMsg = formatStr.replace(/#serviceticket/gi, ticketStr).replace(/#counternumber/gi, counterStr);

	const msg = new SpeechSynthesisUtterance(finalMsg);

	const configuredVoice = voices.find(voice =>
		voice.voiceURI === voiceConfig.voice_uri ||
		voice.voiceURI === voiceConfig.voice ||
		voice.name === voiceConfig.voice_name ||
		voice.name === voiceConfig.voice
	);
	const legacyVoiceIndex = Number.isInteger(Number(voiceConfig.voice)) ? Number(voiceConfig.voice) : -1;
	msg.voice = configuredVoice || voices[legacyVoiceIndex] || voices.find(voice => voice.default) || voices[0] || null;
	msg.pitch = Math.min(2, Math.max(0, Number(voiceConfig.voice_pitch ?? 1)));
	msg.rate = Math.min(2, Math.max(0.5, Number(voiceConfig.voice_rate ?? 1)));
	msg.volume = Math.min(1, Math.max(0, Number(voiceConfig.voice_volume ?? 0.8)));

	let speakCount = 0;

	msg.onstart = () => {
		playBell();
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
