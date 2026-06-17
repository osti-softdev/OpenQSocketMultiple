let services = [];
let selectedType = null;

$(document).ready(async function () {
socket.on('service_update', async function () {
        loadServices();
});
clearSessionAndReload();
   await loadServices();

   async function loadServices() {
    $.ajax({
        url: '/api/services',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
        if (!response.success || !Array.isArray(response.data)) {
            console.error('Invalid services response:', response);
            return;
        }
        services = response.data;  
        loadServicesBtns(services);
        },
        error: function (xhr, status, error) {
        console.error('Failed to load services:', error);
        }
    });
    }

   function loadServicesBtns(services) {
    const $servicesbox = $(".service-container");
    $servicesbox.empty();

    const now = new Date();

    if (services.length === 0) {
        $servicesbox.append("<p>No regular services available</p>");
        return;
    }

    services.forEach((service) => {
        // ── Decide lock status PER service ────────────────────────────────
        let isLocked = false;
        let lockReason = "";

        if (service.sched) {
            const [hours, minutes] = service.sched.split(':').map(Number);
            const cutoff = new Date(now);           // ← important: copy current date
            cutoff.setHours(hours, minutes, 0, 0);

            if (now > cutoff) {
                isLocked = true;
                lockReason = "Cutoff reached";
            }
        }

        // Regular button
        if (service.regular) {
            $servicesbox.append(`
                <button class="service-button regbtn ${isLocked ? 'locked' : ''}"
                    data-sname="${service.sname}"
                    data-ticketservice="${service.regular}"
                    ${isLocked ? 'disabled' : ''}>
                    ${service.shortSname} <br>
                    ${service.sub_sname || ''}
                    ${isLocked ? `<span class="lock-label">${lockReason}</span>` : ''}
                </button>
            `);
            }
        });

    // Click handler for active (non-locked) buttons only
    $(".service-button:not(.locked)").on("click", function () {
        const sname = $(this).data("sname");
        const ticketservice = $(this).data("ticketservice");

        Swal.fire({
            title: "Processing...",
            html: "<p>Inserting and Printing your ticket, please wait...</p>",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
        });

        $.ajax({
            url: '/api/newServiceTicket',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ sname, ticketservice, selectedType, stats: "online" }),
            success: function (response) {
                    if (response.success) {
                console.log(response.ticket.expiryMinutes)

                        const responseSname = response.ticket.sname?.replace(/_/g, ' ') || '';
                        const expiryTime = new Date(new Date().getTime() + response.ticket.expiryMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        Swal.fire({
                            title: "Ticket Issued",
                            width: "500px",
                            html: `
                                <div id="ticket-to-print" style="border: 2px dashed #333; padding: 20px; background: white; text-align: center; color: black;">
                                    <h2 style="margin: 0;">${responseSname}</h2>
                                    <p style="font-size: 1.2rem; margin: 5px 0;">Service: ${response.ticket.ticketservice}</p>
                                    <div style="font-size: 3rem; font-weight: bold; color: red; margin: 10px 0;">${response.ticket.ticketservice}${response.ticket.ticketnum}</div>
                                    <img src="${response.ticket.qrCode}" alt="QR" style="width: 180px; height: 180px;">
                                   <div><strong>Generated:</strong> ${formatTo12Hour(response.ticket.time)}</div>
                                    <div style="margin-top: 15px; font-weight: bold;">Expiry: ${expiryTime}</div>
                                </div>

                                <button id="download-btn" style="margin-top: 20px; padding: 12px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                    📥 Download Full Ticket
                                </button>
                            `,
                            didRender: () => {
                                // Add click listener to the download button inside the Swal
                                document.getElementById('download-btn').addEventListener('click', function() {
                                    html2canvas(document.querySelector("#ticket-to-print")).then(canvas => {
                                        const link = document.createElement('a');
                                        link.download = `Ticket_${response.ticket.ticketnum}.png`;
                                        link.href = canvas.toDataURL("image/png");
                                        link.click();
                                    });
                                });
                            },
                            confirmButtonText: 'Close',
                            allowOutsideClick: false
                        }).then(() => {
                            $("#servicesbox, #priorityServices").fadeOut(200);
                            $(".category-container").fadeIn(200);
                            selectedType = null;
                        });
                    }
                },
            error: function (xhr) {
                const errorMsg = xhr.responseJSON?.error || 'Failed to generate ticket';
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errorMsg,
                });
            }
        });
    });

    setServicesKiosk(services.length);
}

function formatTo12Hour(timeStr) {
    // expects "HH:MM" or "HH:MM:SS"
    const [hourStr, minute] = timeStr.split(':');

    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';

    hour = hour % 12;
    hour = hour ? hour : 12; // 0 becomes 12

    return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
}
    function setServicesKiosk(count) {
        if (count > 0 && count <= 6) {
            $(".service-button").css({ "height": "40%" });
        } else if (count > 6 && count <= 9) {
            $(".service-button").css({ "height": "30%" });
        } else if (count > 9 && count <= 12) {
            $(".service-button").css({ "width": "23%", "height": "30%" });
        } else if (count > 12) {
            $(".service-button").css({ "width": "23%", "height": "23%" });
        }
    }
});

function clearSessionAndReload() {
    // 1. Clear all cookies for current domain
    document.cookie.split(";").forEach(function (c) {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });

    // 2. Clear localStorage & sessionStorage (optional but recommended)
    localStorage.clear();
    sessionStorage.clear();

    // 3. Force reload WITHOUT cache
    window.location.reload(true);
}

