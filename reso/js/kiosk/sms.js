
$(document).ready(function () {
  const $mobileInput = $("#mobileNo"); // your input field

  $(".dialerbtn").on("click", function () {
    const btnval = $(this).data("dialbtn").toString().trim();
    let currentVal = $mobileInput.val();

    if (!isNaN(btnval)) {
      if (currentVal.length < 11) {
        const newVal = currentVal + btnval;

         if (newVal.length === 1) {
          if (btnval !== "0") {
             Swal.fire({
                position: "center",
                icon: "error",
                title: "Mobile number must start with 09",
                showConfirmButton: false,
                timer: 2000
            });
            return; 
          }
        }

        // --- ✅ Second digit rules ---
        if (newVal.length === 2) {
          if (!newVal.startsWith("09")) {
             Swal.fire({
                position: "center",
                icon: "error",
                title: "Mobile number must start with 09",
                showConfirmButton: false,
                timer: 2000
            });
            return;
          }
        }
        $mobileInput.val(newVal);
      } else {
      }
    } else if (btnval.toLowerCase() === "erase") {
      $mobileInput.val(currentVal.slice(0, -1));
    } else if (btnval.toLowerCase() === "check") {
      if (currentVal.length === 11 && currentVal.startsWith("09")) {
            Swal.fire({
                title: "Processing...",
                html: "<p>Inserting and Printing your ticket, please wait...</p>",
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading(),
            });
            console.log($mobileInput.val());
            socket.emit("newServiceTicket", { 
                sname: window.snameholder, 
                ticketservice: window.ticketserviceholder,
                mobile: $mobileInput.val()
            });
      } else {
        Swal.fire({
            position: "center",
            icon: "error",
            title: "❌ Invalid number. It must start with 09 and be 11 digits long.",
            showConfirmButton: false,
            timer: 2000
        });
      }
    }
  });

  $(".bitinnoprint").on('click', function(){
            Swal.fire({
                title: "Processing...",
                html: "<p>Inserting and Printing your ticket, please wait...</p>",
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading(),
            });
            socket.emit("newServiceTicket", { 
                sname: window.snameholder, 
                ticketservice: window.ticketserviceholder,
                mobile: ""
            });
        $(".mobilemain").hide();
        $("#regularServices, #priorityServices").fadeOut(200);
        $(".category-container").fadeIn(200);
  });
  $(".bitinback").on('click', function(){
        $(".mobilemain").hide();
  });
});
