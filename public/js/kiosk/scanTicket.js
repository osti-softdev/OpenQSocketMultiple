


let isProcessing = false;
let isPopupOpen = false;
let html5QrCode = null;

function startCameraScanner() {
    $("#reader").show();

    html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: 250
        },
        async function (decodedText) {

            // 🚫 HARD BLOCK: prevent re-entry
            if (isProcessing || isPopupOpen) return;

            isProcessing = true;

            try {
                // ⛔ STOP CAMERA immediately to avoid re-scanning same QR
                await html5QrCode.pause(true);

                const response = await fetch('/api/check_ticket_in', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ticketcode: decodedText
                    })
                });

                const data = await response.json();

                Swal.close();

                if (data.success) {

                    const responseSname = data.ticket.sname?.replace(/_/g, ' ') || '';

                    isPopupOpen = true;

                    Swal.fire({
                        title: `<span style="font-size:20px;color:green;font-weight:bold;">Ticket Printed Successfully</span>`,
                        html: `
                            <div style="margin-top:20px;">
                                <span style="color:red;font-size:80px;font-weight:bold;letter-spacing:8px;">
                                    ${data.ticket.ticketservice} -
                                    <span style="color:black;">${data.ticket.ticketnum}</span>
                                </span>
                                <p style="font-size:28px;margin-top:20px;font-weight:600;">
                                    ${responseSname}
                                </p>
                            </div>
                        `,
                        timer: 3000,
                        width: "50%",
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didClose: async () => {
                            // 🔓 unlock only AFTER popup closes
                            isPopupOpen = false;
                            isProcessing = false;

                            await html5QrCode.resume();
                        }
                    });

                    $("#regularServices, #priorityServices").fadeOut(200);
                    $(".category-container").fadeIn(200);
                    selectedType = null;

                } else {

                    isPopupOpen = true;

                    Swal.fire({
                        icon: "error",
                        title: "Check-in Failed",
                        text: data.error || "Unknown error",
                        confirmButtonText: "OK",
                        didClose: async () => {
                            isPopupOpen = false;
                            isProcessing = false;
                            await html5QrCode.resume();
                        }
                    });
                }

            } catch (err) {

                isPopupOpen = true;

                Swal.fire({
                    icon: "error",
                    title: "Network Error",
                    text: "Unable to reach server. Please try again.",
                    didClose: async () => {
                        isPopupOpen = false;
                        isProcessing = false;
                        await html5QrCode.resume();
                    }
                });

                console.error("Request failed:", err);
            }
        },
        function (error) {
            // ignore scan errors
        }
    );
}
// =========================================
// Image File QR Scanner
// Requires: html5-qrcode
// =========================================
function startFileScanner() {
    $("#qrFile").show();

    $("#qrFile").on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const html5QrCode = new Html5Qrcode("reader");

        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                console.log("QR Detected:", decodedText);

                // Your callback here
                onQrDetected(decodedText);
            })
            .catch(err => {
                console.error("QR Scan Failed:", err);
            });
    });
}

// =========================================
// Common callback
// =========================================
function onQrDetected(qrData) {
    alert("QR Content: " + qrData);

    // Example:
    // $.post('/scan', { qr: qrData });
}

$(document).ready(function () {
    async function checkOnlineStatus() {
        try {
            const response = await fetch("/api/checkOnlineTrue", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            if (data.isOnline) {
                $("#reader").show();
                if (data.camscan) {
                    startCameraScanner();
                } else {
                    startFileScanner();
                }
                console.log("Online ticketing is ENABLED");
            } else {
                $("#reader").hide();
                console.log("Online ticketing is DISABLED");
            }
        } catch (err) {
            console.error("Failed to check status:", err);
        }
}
checkOnlineStatus();

});
