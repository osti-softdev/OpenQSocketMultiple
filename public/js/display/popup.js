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
	console.log(voices)
	const audioElement = $("#audio")[0];
	if (audioElement) audioElement.volume = voiceConfig.bell_volume || 1;

	const serviceCleaned = ticketData.service.replace(/-/g, " ");
	const serviceSeparated = serviceCleaned.split("").join(", ");
	let ticks = ticketData.sname.replace("_"," ");

	let msg = null;
	
	
		msg = new SpeechSynthesisUtterance(
			// `Now serving, ${serviceSeparated}${ticketData.ticket}, Please proceed to counter ${ticketData.counter_num}`
			`Now serving, ${serviceSeparated}${ticketData.ticket}! Please proceed to counter ${ticketData.counter_num}`
		);
	
	msg.voice = voices[4];
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
