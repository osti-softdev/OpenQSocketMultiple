let services = [];
let selectedType = null;

$(document).ready(async function () {
socket.on('service_update', async function () {
        loadServices();
});

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
        serviceChecker(services);
        },
        error: function (xhr, status, error) {
        console.error('Failed to load services:', error);
        }
    });
    }
    $(".category-btn").on("click", function () {
        const category = $(this).data("categtype");
        $(".category-container").fadeOut();

        if (category === "reg") {
            $("#priorityServices").hide();
            $("#regularServices").css({ display: "flex" });
        selectedType = 0;
        } else if (category === "prio") {
            $("#regularServices").hide();
            $("#priorityServices").css({ display: "flex" });
        selectedType = 1;
        }
    });

   function loadServicesBtns(services) {
    const $regularServices = $("#regularServices");
    const $priorityServices = $("#priorityServices");
    $regularServices.empty();
    $priorityServices.empty();

    const now = new Date();

    if (services.length === 0) {
        $regularServices.append("<p>No regular services available</p>");
        $priorityServices.append("<p>No priority services available</p>");
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
            $regularServices.append(`
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

        // Priority button (independent lock check)
        if (service.priority) {
            $priorityServices.append(`
                <button class="service-button priobtn ${isLocked ? 'locked' : ''}"
                    data-sname="${service.sname}"
                    data-ticketservice="${service.priority}"
                    ${isLocked ? 'disabled' : ''}>
                    ${service.shortSname} <br>
                    ${service.sub_sname || ''}
                    ${isLocked ? `<span class="lock-label">${lockReason}</span>` : ''}
                </button>
            `);
        }
    });

    // Back button (only once)
    const backBtn = `<button class="back-btn" style="margin-top:20px;">⬅ Back</button>`;
    $regularServices.append(backBtn);
    $priorityServices.append(backBtn);

    // Back button handler
    $(".back-btn").off("click").on("click", function () {   // .off() prevents duplicate handlers
        $("#regularServices, #priorityServices").fadeOut(200);
        $(".category-container").fadeIn(200);
        selectedType = null;
    });

    // Click handler for active (non-locked) buttons only
    $(document).on("click", ".service-button:not(.locked)", function () {
        const sname = $(this).data("sname");
        const ticketservice = $(this).data("ticketservice");

        // Fetch SMS config to determine if we should show dialer
        $.get('/api/sms-config', function(config) {
            if (config.success && config.allowSms) {
                // Show Dialer UI
                showDialerModal(sname, ticketservice, config.privacyPolicy);
            } else {
                // SMS disabled, process normally
                processTicket(sname, ticketservice, null);
            }
        }).fail(function() {
            // Fallback if API fails
            processTicket(sname, ticketservice, null);
        });
    });

    function showDialerModal(sname, ticketservice, privacyPolicy) {
        let dialerHtml = `
            <div class="dialer-container">
                <div style="font-size: 14px; margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-left: 4px solid #007bff; text-align: left;">
                    <strong>Privacy Policy:</strong><br/>
                    ${privacyPolicy}
                </div>
                <input type="text" id="mobile-input" readonly placeholder="Enter Mobile Number" style="width: 100%; font-size: 28px; text-align: center; margin-bottom: 15px; padding: 15px; border-radius: 8px; border: 2px solid #ddd; letter-spacing: 2px;">
                <div class="numpad" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 300px; margin: 0 auto;">
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="1">1</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="2">2</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="3">3</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="4">4</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="5">5</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="6">6</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="7">7</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="8">8</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="9">9</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="clear">C</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="0">0</button>
                    <button class="numpad-btn btn btn-light" style="font-size:24px; padding:15px;" data-val="backspace">⌫</button>
                </div>
            </div>
        `;

        Swal.fire({
            title: "SMS Notification (Optional)",
            html: dialerHtml,
            width: '600px',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'Submit Number',
            denyButtonText: 'Submit without Number',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#28a745',
            denyButtonColor: '#6c757d',
            cancelButtonColor: '#dc3545',
            didOpen: () => {
                const input = document.getElementById('mobile-input');
                $('.numpad-btn').on('click', function() {
                    const val = $(this).data('val');
                    if (val === 'clear') {
                        input.value = '';
                    } else if (val === 'backspace') {
                        input.value = input.value.slice(0, -1);
                    } else {
                        input.value += val;
                    }
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const mobile = document.getElementById('mobile-input').value;
                if (mobile.length < 10) {
                    Swal.fire('Invalid Number', 'Please enter a valid mobile number or submit without one.', 'error').then(() => {
                        showDialerModal(sname, ticketservice, privacyPolicy);
                    });
                    return;
                }
                processTicket(sname, ticketservice, mobile);
            } else if (result.isDenied) {
                processTicket(sname, ticketservice, null);
            }
        });
    }

    function processTicket(sname, ticketservice, mobile) {
        Swal.fire({
            title: "Processing...",
            html: "<p>Inserting and Printing your ticket, please wait...</p>",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
        });

        const payload = { sname, ticketservice, selectedType, stats: "onprem" };
        if (mobile) payload.mobile = mobile;

        $.ajax({
            url: '/api/newServiceTicket',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function (response) {
                if (response.success) {
                const responseSname = response.ticket.sname?.replace(/_/g, ' ') || '';

                        Swal.fire({
                            title: `<span style="font-size:20px;color:green;font-weight:bold;">Ticket Printed Successfully</span>`,
                            html: `
                                <div style="margin-top:20px;">
                                    <span style="color:red;font-size:80px;font-weight:bold;letter-spacing:8px;">
                                        ${response.ticket.ticketservice} -
                                        <span style="color:black;">${response.ticket.ticketnum}</span>
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
                        });

                        $("#regularServices, #priorityServices").fadeOut(200);
                        $(".category-container").fadeIn(200);
                        selectedType = null;

                    } else {
                    Swal.fire('Error', response.error || 'Failed to generate ticket', 'error');
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
    }

    setServicesKiosk(services.length);
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


// socket.on("DisplayUpdated", (config) => {
//     applyDisplayConfig(config);
// });

// ================== DISPLAY CONFIG APPLY ==================
function applyDisplayConfig(config) {

    window.currentDisplayConfig = config; // <-- store colors globally

    $(".time").css({
        "color": window.currentDisplayConfig.time_color,
        "text-shadow": `2px 2px 5px ${window.currentDisplayConfig.time_shadow}`,
    });

    $(".date").css({
        "color": window.currentDisplayConfig.date_color
    });

    $(".regbtn").css({
        "color": window.currentDisplayConfig.kiosk_regular_service_color,
        "text-shadow": `2px 2px 5px ${window.currentDisplayConfig.kiosk_service_shadow_color}`,
    });

    $(".priobtn").css({
        "color": window.currentDisplayConfig.kiosk_priority_service_color,
        "text-shadow": `2px 2px 5px ${window.currentDisplayConfig.kiosk_service_shadow_color}`,
    });

    $(".footercont").css({
        "color": window.currentDisplayConfig.kiosk_footer_text_color,
        "background-color": window.currentDisplayConfig.kiosk_footer_color,
        "text-shadow": `2px 2px 5px ${window.currentDisplayConfig.kiosk_footer_text_shadow_color}`,
    });

    $(".back-btn").css({
        "color": window.currentDisplayConfig.kiosk_back_text_color,
        "background-color": window.currentDisplayConfig.kiosk_back_color,
    });

    if (config.display_update?.update === 1) {
        socket.emit("updateDisplay");
        socket.once("updatedisplaySuccess", () => {
            window.location.reload();
        });
    }
}

// ================== INACTIVITY TIMER ==================
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        $(".mobilemain").hide();
        $("#mobileNo").val("");
        $("#regularServices, #priorityServices").fadeOut(200);
        $(".category-container").fadeIn(200);
    }, 30000);
}

$(document).on("click touchstart keydown", resetInactivityTimer);

$(document).ready(resetInactivityTimer);

// Global interval ID for service checker
let serviceCheckerInterval = null;

function serviceChecker(services) {
    // Clear any existing interval to avoid duplicates
    if (serviceCheckerInterval !== null) {
        clearInterval(serviceCheckerInterval);
    }

    // Check every second (1000ms)
    serviceCheckerInterval = setInterval(function() {
        const now = new Date();
        services.forEach((service) => {
            if (service.sched) {
                const [hours, minutes] = service.sched.split(':').map(Number);
                const cutoff = new Date(now);
                cutoff.setHours(hours, minutes, 0, 0);
                const isLocked = now > cutoff;

                $(`.service-button[data-sname="${service.sname}"]`).each(function () {
                    if (isLocked) {
                        $(this).addClass("locked").attr("disabled", true);
                        if ($(this).find(".lock-label").length === 0) {
                            $(this).append('<span class="lock-label">Cutoff reached</span>');
                        }
                    } else {
                        $(this).removeClass("locked").attr("disabled", false);
                        $(this).find(".lock-label").remove();
                    }
                });
            }
        });
    }, 1000); // Check every 1 second
}

