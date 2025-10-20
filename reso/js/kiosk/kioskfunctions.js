let smsSetting = null;
window.snameholder = null;
window.ticketserviceholder = null;
window.mobileno = null;

$(document).ready(function () {
    socket.on("envSMS", (data) => {
        console.log("Received from server:", data.sms);
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

    socket.on("servicesUpdate", (services) => {
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
                        <div class="service-button" data-sname="${service.sname}" data-ticketservice="${service.regular}">
                            ${service.sname}
                        </div>
                    `);
                }
                if (service.priority) {
                    $priorityServices.append(`
                        <div class="service-button" data-sname="${service.sname}" data-ticketservice="${service.priority}">
                            ${service.sname}
                        </div>
                    `);
                }
            });
        }

        // Add back button
        const backBtn = `<button class="back-btn" style="margin-top: 20px;">⬅ Back</button>`;
        $regularServices.append(backBtn);
        $priorityServices.append(backBtn);

        $(".back-btn").off("click").on("click", function () {
            $("#regularServices, #priorityServices").fadeOut(200);
            $(".category-container").fadeIn(200);
        });

        $(".service-button")
            .off("click")
            .on("click", function () {
                const sname = $(this).data("sname");
                const ticketservice = $(this).data("ticketservice");

                if(smsSetting != "1"){
                    Swal.fire({
                        title: "Processing...",
                        html: "<p>Inserting and Printing your ticket, please wait...</p>",
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => Swal.showLoading(),
                    });
                    socket.emit("newServiceTicket", { sname, ticketservice, mobile: "" });
                }else{
                    window.snameholder = sname;
                    window.ticketserviceholder = ticketservice;
                    $(".mobilemain").css("display","flex");
                }
            });
    });

    // Listen for ticket inserted
    socket.on("ticketInserted", (data) => {
        setTimeout(() => {
         Swal.fire({
            title: `<span style="font-size:40px; color:green; font-weight:bold;">Ticket Printed Successfully</span>`,
            html: `
                <div style="margin-top:20px;">
                    <span style="color:red; font-size:160px; font-weight:bold; letter-spacing:8px;">
                        ${data.ticketservice} -
                        <span style="color:black;">${data.ticketnum}</span>
                    </span>
                    <p style="font-size:28px; margin-top:20px; font-weight:600;">${data.sname}</p>
                </div>
            `,
            timer: 2000,
            width: "50%",
            allowOutsideClick: false,
            showConfirmButton: false,
            customClass: {
                popup: "my-swal-popup",
                title: "my-swal-title",
                htmlContainer: "my-swal-html",
            },
        });
            $(".mobilemain").hide();
            $("#mobileNo").val("");
            $("#regularServices, #priorityServices").fadeOut(200);
            $(".category-container").fadeIn(200);
        }, 1500);
   
    });

    // Error case
    socket.on("ticketInsertError", (errMsg) => {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: errMsg,
        });
    });
});


let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    // Runs only if no user interaction within 30 seconds
    $(".mobilemain").hide();
    $("#mobileNo").val("");
    $("#regularServices, #priorityServices").fadeOut(200);
    $(".category-container").fadeIn(200);
  }, 30000); // 30 seconds
}

// ================== GLOBAL INTERACTION HANDLER ==================
$(document).on("click touchstart keydown", function () {
  // Each interaction resets the timer
  resetInactivityTimer();
});

// Initialize timer when page loads
$(document).ready(function () {
  resetInactivityTimer();
});
