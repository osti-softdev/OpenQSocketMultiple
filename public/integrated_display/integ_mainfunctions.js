let currentDisplayConfig = null;
let voiceConfig = {
    voice_enabled: true,
    voice: '',
    voice_uri: '',
    voice_name: '',
    voice_rate: 1,
    voice_pitch: 1,
    voice_volume: 0.8,
    bell_volume: 0.7
};
let voices = [];
let ticketQueue = [];
let isProcessing = false;
let activeTicketIds = new Set();

$(document).ready(function () {
    getDisplayServices();
    getCalledTickets();
});

// Socket Events
socket.on("calledticketsArrived", function () {
    getDisplayServices();
    getCalledTickets();
});

socket.on("voiceConfigUpdate", (config) => {
    voiceConfig = { ...voiceConfig, ...config };
});

if ('speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
        voices = window.speechSynthesis.getVoices();
    });
}

// --- Display Services Logic ---
async function getDisplayServices() {
    try {
        const response = await fetch('/api/getServicesDisplay', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

        const data = await response.json();
        if (!data.success) {
            console.error('Invalid services response:', data);
            return;
        }
        displayServicesCards(data.services);
    } catch (error) {
        console.error('Failed to load display services:', error.message);
    }
}

function displayServicesCards(services) {
    const $servicesList = $("#servicesDisplay");
    if (!$servicesList.length) {
        console.error('Element #servicesDisplay not found in DOM');
        return;
    }
    // Clear previous content
    $servicesList.empty();

    // Add header (kept hidden by CSS usually but we should add it to keep structure identical)
    const $headerDiv = $("<div>").addClass("service-header");
    $headerDiv.append($("<span>").addClass("tickethead").text("NOW SERVING"));
    $servicesList.append($headerDiv);

    services.forEach((service) => {
        const $rowDiv = $("<div>").addClass("service-row");
        const serviceName = service.shortSname || '—';

        const $serviceName = $("<span>")
            .addClass("service-name")
            .html(serviceName);
        // attach length as data attribute
        $serviceName.attr("data-length", serviceName.length);

        $rowDiv.append($serviceName);
        if (serviceName.length <= 16) {
            $serviceName.css("font-size", "3vw");
        }
        $rowDiv.append(
            $("<span>")
                .addClass("sub-name")
                .html(service.sub_sname || '—')
        );
        // Ticket number
        const ticketText = service.ticket || '--';
        $rowDiv.append(
            $("<span>")
                .addClass("service-ticket")
                .text(ticketText)
            ,
            $("<span>")
                .addClass("counter")
                .text(service.counter_num)
        );
        $servicesList.append($rowDiv);
    });

    setServicesDisplay(services.length);
    adjustServiceNameFont();
}

function setServicesDisplay(count) {
    // ! Counter Display Handler
    $(".counter").css({
        "display": "flex",
    });
    $(".service-ticket").css({
        "width": "75%",
    });

    if (count <= 10) {
        $(".content-container").css({
            "left": "0%",
            "width": "100%",
        });
    } else {
        $(".content-container").css({
            "top": "10%",
            "height": "83%",
            "left": "0%",
            "width": "100%",
        });
        $(".service-header").css({
            "display": "none",
        });
    }

    // ! Services Display Size Handler
    if (count === 1) {
        $(".service-row").css({
            "height": "90%",
            "width": "100%",
        });
        $(".service-name").css({
            "height": "25%",
        });
        $(".counter").css({
            "font-size": "10rem",
        });
        $(".service-ticket").css({
            "font-size": "8rem"
        });
    } else if (count === 2) {
        $(".service-row").css({
            "height": "45%",
            "width": "100%",
        });
        $(".service-name").css({
            "height": "25%",
        });
        $(".counter").css({
            "font-size": "10rem",
        });
        $(".service-ticket").css({
            "font-size": "8rem"
        });
    } else if (count === 3) {
        $(".service-row").css({
            "height": "30%",
            "width": "100%",
        });
        $(".service-name").css({
            "height": "25%",
        });
        $(".counter").css({
            "font-size": "10rem",
        });
        $(".service-ticket").css({
            "font-size": "8rem"
        });
    } else if (count === 4) {
        $(".service-row").css({
            "height": "45%",
            "width": "50%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.5rem"
        });
        $(".counter").css({
            "font-size": "5rem",
        });
        $(".service-ticket").css({
            "font-size": "5rem"
        });
    } else if (count === 5) {
        $(".service-row").css({
            "height": "30%",
            "width": "50%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.5rem"
        });
        $(".counter").css({
            "font-size": "5rem",
        });
        $(".service-ticket").css({
            "font-size": "5rem"
        });
    } else if (count === 6) {
        $(".service-row").css({
            "height": "30%",
            "width": "50%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.2rem"
        });
        $(".counter").css({
            "font-size": "5rem",
        });
        $(".service-ticket").css({
            "font-size": "4.7rem"
        });
    } else if (count === 7) {
        $(".service-row").css({
            "height": "24%",
            "width": "50%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2rem"
        });
        $(".counter").css({
            "font-size": "5rem",
        });
        $(".service-ticket").css({
            "font-size": "3.5rem"
        });
    } else if (count === 8) {
        $(".service-row").css({
            "height": "24%",
            "width": "50%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.3rem"
        });
        $(".counter").css({
            "font-size": "5rem",
        });
        $(".service-ticket").css({
            "font-size": "3.8rem"
        });
    } else if (count === 9) {
        $(".service-row").css({
            "height": "19%",
            "width": "50%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.rem"
        });
        $(".counter").css({
            "font-size": "4rem",
        });
        $(".service-ticket").css({
            "font-size": "4rem"
        });
    } else if (count === 10) {
        $(".service-row").css({
            "height": "19%",
            "width": "50%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.3rem"
        });
        $(".counter").css({
            "font-size": "4rem",
        });
        $(".service-ticket").css({
            "font-size": "4rem"
        });
    } else if (count === 11) {
        $(".service-row").css({
            "height": "24%",
            "width": "33.3%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.5rem"
        });
        $(".counter").css({
            "font-size": "6rem",
        });
        $(".service-ticket").css({
            "font-size": "5rem"
        });
    } else if (count === 12) {
        $(".service-row").css({
            "height": "24%",
            "width": "33.3%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.5rem"
        });
        $(".counter").css({
            "font-size": "6rem",
        });
        $(".service-ticket").css({
            "font-size": "5rem"
        });
    } else if (count === 13) {
        $(".service-row").css({
            "height": "19%",
            "width": "33.3%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.5rem"
        });
        $(".counter").css({
            "font-size": "6rem",
        });
        $(".service-ticket").css({
            "font-size": "5rem"
        });
    } else if (count === 14) {
        $(".service-row").css({
            "height": "18%",
            "width": "33.3%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.5rem"
        });
        $(".counter").css({
            "font-size": "6rem",
        });
        $(".service-ticket").css({
            "font-size": "5rem"
        });
    } else if (count === 15) {
        $(".service-row").css({
            "height": "18%",
            "width": "33.3%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.5rem"
        });
        $(".counter").css({
            "font-size": "6rem",
        });
        $(".service-ticket").css({
            "font-size": "5rem"
        });
    } else if (count === 16) {
        $(".service-row").css({
            "height": "23%",
            "width": "25%",
        });
        $(".service-name").css({
            "height": "25%",
            "font-size": "2.3rem"
        });
        $(".counter").css({
            "font-size": "6rem",
        });
        $(".service-ticket").css({
            "font-size": "4rem"
        });
    }
}

function adjustServiceNameFont() {
    $(".service-name").each(function () {
        const length = $(this).text().trim().length;
        let size;

        if (length <= 12) size = "2.3rem";
        else if (length <= 16) size = "2.5rem";
        else if (length <= 22) size = "2rem";
        else size = "1.5rem";

        this.style.setProperty("font-size", size, "important");
    });
}

// --- Popup & Voice Logic ---
async function getCalledTickets() {
    try {
        const response = await fetch('/api/getCallingTickets', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        if (!data.success) return;

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

async function processQueue() {
    if (isProcessing || ticketQueue.length === 0) return;

    isProcessing = true;
    const ticket = ticketQueue.shift();

    showPopup(ticket);

    // Mark as called
    fetch('/api/updateCalledTickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticket.id })
    }).catch(e => console.error("Error updating ticket", e));

    speakTicketTwice(ticket, () => {
        hidePopup();
        activeTicketIds.delete(ticket.id);
        isProcessing = false;
        processQueue();
    });
}

function showPopup(ticketData) {
    $("#popup").show();
    $("#counterpop").text("Counter " + ticketData.counter_num);
    $("#ticketpop").text(`${ticketData.service}-${ticketData.ticket}`);
}

function hidePopup() {
    $("#popup").hide();
    $("#ticketpop").text("");
    $("#counterpop").text("");
}

function speakTicketTwice(ticketData, onFinish) {
    const synth = window.speechSynthesis;
    if (!voices.length) voices = synth.getVoices();

    const audioElement = $("#audio")[0];
    if (audioElement) audioElement.volume = Math.min(1, Math.max(0, Number(voiceConfig.bell_volume ?? 0.7)));

    const playBell = () => {
        if (!audioElement) return;
        audioElement.currentTime = 0;
        audioElement.play().catch(() => { });
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
    const msg = new SpeechSynthesisUtterance(
        `Now serving, ${serviceSeparated}${ticketData.ticket}! Please proceed to counter ${ticketData.counter_num}`
    );

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
