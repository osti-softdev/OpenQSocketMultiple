let smsSetting = null;
window.snameholder = null;
window.ticketserviceholder = null;
window.mobileno = null;
window.cachedServices = [];
window.serviceSchedCheckerStarted = false;
window.currentDisplayConfig = {}; // <-- ADDED TO STORE COLORS

$(document).ready(function () {

    socket.on("imagesupdates", (data) => {
        if (data.prerefresh) {
            window.location.reload();
        }
    });

    socket.on("envSMS", (data) => {
        smsSetting = data.sms;
    });

    $(".category-btn").on("click", function () {
        const category = $(this).data("categtype");
        $(".category-container").fadeOut();

        if (category === "reg") {
            $("#priorityServices").hide();
            $("#regularServices").css({ display: "flex" });
        } else if (category === "prio") {
            $("#regularServices").hide();
            $("#priorityServices").css({ display: "flex" });
        }
    });

    socket.on("servicesUpdate2", (services) => {
        const $regularServices = $("#regularServices");
        const $priorityServices = $("#priorityServices");
        $regularServices.empty();
        $priorityServices.empty();

        if (services.length === 0) {
            $regularServices.append("<p>No regular services available</p>");
            $priorityServices.append("<p>No priority services available</p>");
        } else {
            services.forEach((service) => {
                if (service.regular) {
                    $regularServices.append(`
                        <div class="service-button regbtn"
                            data-sname="${service.sname}"
                            data-ticketservice="${service.regular}">
                            ${service.shortSname}
                            <span class="cutoff-text" style="display:none;color:red;">Cut Off</span>
                        </div>
                    `);
                }
                if (service.priority) {
                    $priorityServices.append(`
                        <div class="service-button priobtn"
                            data-sname="${service.sname}"
                            data-ticketservice="${service.priority}">
                            ${service.shortSname}
                            <span class="cutoff-text" style="display:none;color:red;">Cut Off</span>
                        </div>
                    `);
                }
            });
        }

        const backBtn = `<button class="back-btn" style="margin-top:20px;">⬅ Back</button>`;
        $regularServices.append(backBtn);
        $priorityServices.append(backBtn);

        $(".back-btn").off("click").on("click", function () {
            $("#regularServices, #priorityServices").fadeOut(200);
            $(".category-container").fadeIn(200);
        });

        $(".service-button").off("click").on("click", function () {
            const sname = $(this).data("sname");
            const ticketservice = $(this).data("ticketservice");

            if (smsSetting != "1") {
                Swal.fire({
                    title: "Processing...",
                    html: "<p>Inserting and Printing your ticket, please wait...</p>",
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => Swal.showLoading(),
                });
                socket.emit("newServiceTicket", { sname, ticketservice, mobile: "" });
            } else {
                window.snameholder = sname;
                window.ticketserviceholder = ticketservice;
                $(".mobilemain").css("display", "flex");
            }
        });

        setServicesKiosk(services.length);
        window.cachedServices = services;

        updateServiceAvailability();

        if (!window.serviceSchedCheckerStarted) {
            window.serviceSchedCheckerStarted = true;
            setInterval(updateServiceAvailability, 30000);
        }
    });

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

    socket.on("ticketInserted", (data) => {
        setTimeout(() => {
            Swal.fire({
                title: `<span style="font-size:20px;color:green;font-weight:bold;">Ticket Printed Successfully</span>`,
                html: `
                <div style="margin-top:20px;">
                    <span style="color:red;font-size:80px;font-weight:bold;letter-spacing:8px;">
                        ${data.ticketservice} -
                        <span style="color:black;">${data.ticketnum}</span>
                    </span>
                    <p style="font-size:28px;margin-top:20px;font-weight:600;">${data.sname}</p>
                </div>
            `,
                timer: 2000,
                width: "50%",
                allowOutsideClick: false,
                showConfirmButton: false,
            });

            $(".mobilemain").hide();
            $("#mobileNo").val("");
            $("#regularServices, #priorityServices").fadeOut(200);
            $(".category-container").fadeIn(200);

        }, 1500);
    });

    socket.on("ticketInsertError", (errMsg) => {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: errMsg,
        });
    });

});


socket.on("DisplayUpdated", (config) => {
    applyDisplayConfig(config);
});

// ================== SERVICE SCHEDULE CHECKER ==================
function updateServiceAvailability() {
    if (!window.cachedServices || window.cachedServices.length === 0) return;

    const now = new Date();
    const currentPHTime = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(now);

    const [curHour, curMin] = currentPHTime.split(":").map(Number);
    const curTotalMinutes = curHour * 60 + curMin;

    window.cachedServices.forEach((service) => {
        if (!service.sched) return;

        const [schedHour, schedMin] = service.sched.split(":").map(Number);
        const schedTotalMinutes = schedHour * 60 + schedMin;

        const selector = `.service-button[data-sname="${service.sname}"]`;
        const $btn = $(selector);
        const $cutOffText = $btn.find(".cutoff-text");

        const isPrio = $btn.hasClass("priobtn");

        if (schedTotalMinutes <= curTotalMinutes) {
            // Disable
            $btn.addClass("disabled").css({
                opacity: "0.5",
                pointerEvents: "none",
                filter: "grayscale(80%)",
                color: isPrio
                    ? window.currentDisplayConfig.kiosk_priority_service_color
                    : window.currentDisplayConfig.kiosk_regular_service_color
            });
            $cutOffText.show();
        } else {
            // Enable
            $btn.removeClass("disabled").css({
                opacity: "1",
                pointerEvents: "auto",
                filter: "none",
                color: isPrio
                    ? window.currentDisplayConfig.kiosk_priority_service_color
                    : window.currentDisplayConfig.kiosk_regular_service_color
            });
            $cutOffText.hide();
        }
    });
}

// ================== DISPLAY CONFIG APPLY ==================
function applyDisplayConfig(config) {

    window.currentDisplayConfig = config; // <-- store colors globally

    $(".time").css({
        "color": config.time_color,
        "text-shadow": `2px 2px 5px ${config.time_shadow}`,
    });

    $(".date").css({
        "color": config.date_color
    });

    $(".regbtn").css({
        "color": config.kiosk_regular_service_color,
        "text-shadow": `2px 2px 5px ${config.kiosk_service_shadow_color}`,
    });

    $(".priobtn").css({
        "color": config.kiosk_priority_service_color,
        "text-shadow": `2px 2px 5px ${config.kiosk_service_shadow_color}`,
    });

    $(".footercont").css({
        "color": config.kiosk_footer_text_color,
        "background-color": config.kiosk_footer_color,
        "text-shadow": `2px 2px 5px ${config.kiosk_footer_text_shadow_color}`,
    });

    $(".back-btn").css({
        "color": config.kiosk_back_text_color,
        "background-color": config.kiosk_back_color,
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
