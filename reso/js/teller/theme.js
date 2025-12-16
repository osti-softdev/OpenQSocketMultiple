$(document).ready(function () {
  // Load saved theme (default = dark)
  let savedTheme = localStorage.getItem("theme") || "dark";

  // Apply saved theme
  $("html").removeClass("light dark").addClass(savedTheme);
  $("#theme-toggle").prop("checked", savedTheme === "light");

  // Toggle theme on change
  $("#theme-toggle").on("change", function () {
    let selected = $(this).is(":checked") ? "light" : "dark";
    localStorage.setItem("theme", selected);
    $("html").removeClass("light dark").addClass(selected);
    updateIconColors(selected);
  });

  // Initial run
  updateIconColors(savedTheme);
});

function updateIconColors(theme) {
  $("#logoutBtn i").css("color", theme === "light" ? "#333333" : "#f59300");
  $(".historybtn i").css("color", theme === "light" ? "#333333" : "#f59300");
  $(".telleractbtn i").css("color", theme === "light" ? "#51ff00ff" : "#004ef5ff");
}


function custompopupset(display, id, data, authUser) {
  const Custompopup = $(".CustomPopup");
  const cpoptitle = $(".cpoptitle");
  const cpopupbody = $(".cpopbody"); // ✅ fixed class
  const cpopupfooter = $(".cpopfooter"); // ✅ fixed class
  const ccancelbtn = $(".ccancelbtn");
  const csubmitbtn = $(".csubmitbtn");
  let html = "";

  // Show or hide popup
  if (display === "show") {
    Custompopup.css("display", "flex");
  } else if (display === "hide") {
    Custompopup.hide();
    cpoptitle.empty();
    cpopupbody.empty();
    return;
  }

  // !VOID
  if (id === "void") {
    cpoptitle.text("VOID TICKET");
    csubmitbtn.text("Void");
    const ticketDisplay = `${data.ticketservice}${data.ticketnum}`;

    html = `
      <div class="ticket-info">
        Ticket: <strong style="color:red;">${ticketDisplay}</strong>
      </div>
      <div class="reason-options">
        <label><input type="checkbox" name="reason" value="Cancelled"> Cancelled</label>
        <label><input type="checkbox" name="reason" value="No-show"> No-show</label>
        <label><input type="checkbox" name="reason" value="Incomplete"> Incomplete</label>
      </div>
      <textarea id="reason-text" class="swal2-textarea" placeholder="Type your reason"></textarea>
      <div class="errorlogtext"></div>
      `;

    cpopupbody.html(html);

    const checkboxes = cpopupbody.find('input[name="reason"]');
    const textarea = $("#reason-text");

    // ✅ Only one checkbox can be checked at a time
    checkboxes.on("change", function () {
      $('.errorlogtext').empty();
      if ($(this).is(":checked")) {
        // Uncheck others
        checkboxes.not(this).prop("checked", false);
        // Disable textarea
        textarea.prop("disabled", true).val("");
      } else {
        // If all unchecked → enable textarea
        if (checkboxes.filter(":checked").length === 0) {
          textarea.prop("disabled", false);
        }
      }
    });

    // ✅ When typing in textarea → disable all checkboxes
    textarea.on("input", function () {
      $('.errorlogtext').empty();
      const hasText = $(this).val().trim().length > 0;
      checkboxes.prop("disabled", hasText);
      if (hasText) {
        checkboxes.prop("checked", false);
      } else {
        checkboxes.prop("disabled", false);
      }
    });
  } 
  // !FORWARD
  else if (id === "forward") {
cpoptitle.text("FORWARD TICKET");
const ticketDisplay = `${data.ticketservice}${data.ticketnum}`;
csubmitbtn.text("Forward");

let html = `
  <div class="ticket-info">
    Ticket: <strong style="color:red;">${ticketDisplay}</strong>
  </div>
  <label class="counter-info">SELECT COUNTER 
    <select name="counterselect" id="counterselect">
      <option value="" disabled selected>Select Counter</option>
    </select>
  </label>
  <div class="errorlogtext"></div>
`;

cpopupbody.html(html);

const tellerAndGroupData = JSON.parse(localStorage.getItem("tellerandgroupsdata") || "{}");
const { tellers = [], groups = [] } = tellerAndGroupData;
const $counterSelect = $("#counterselect");

// Add teller options
if (tellers.length > 0) {
  const tellerGroup = $('<optgroup label="Tellers"></optgroup>');
  tellers.forEach(t => {
    tellerGroup.append(
      `<option value="${t.cnum}_n">
        ${t.cname} (${t.cnum})
      </option>`
    );
  });
  $counterSelect.append(tellerGroup);
}

// Add a visual gap between sections
if (tellers.length > 0 && groups.length > 0) {
  $counterSelect.append(`<option disabled style="width:100%;">──────────────────────────</option>`);
}

// Add group options
if (groups.length > 0) {
  const groupGroup = $('<optgroup label="Groups"></optgroup>');
  groups.forEach(g => {
    groupGroup.append(
      `<option value="${g.group_name}_g">
        ${g.group_name}
      </option>`
    );
  });
  $counterSelect.append(groupGroup);
}

// Fallback
if (tellers.length === 0 && groups.length === 0) {
  $counterSelect.append(`<option disabled>No counters/groups available</option>`);
}

  }
    const counterselect = $("#counterselect");
    counterselect.on("input", function () {
    $('.errorlogtext').empty();
    });
  // Cancel button → close popup
  ccancelbtn.off("click").on("click", function () {
    Custompopup.hide();
    cpoptitle.empty();
    cpopupbody.empty();
  });

  // ✅ Submit button
  csubmitbtn.off("click").on("click", function () {
    if (id === "void") {
    const selectedReason = cpopupbody.find('input[name="reason"]:checked').val() || "";
    const reasonText = $("#reason-text").val().trim();
    let finalReason = selectedReason || reasonText;
    const errlogtext = $(".errorlogtext");

      if (!finalReason) {
        errlogtext.text("Error: Please select or type a reason.");
        return;
      }

      socket.emit("getandupdatecalledtick", {
        callingcode: "void",
        tickid: data.id || "",
        tickstatus: "voided",    
        tickwherestatus: "called", 
        cnum: authUser.cnum,
        cname: authUser.cname,
        tickcode: data.ticketservice,
        dataadditional: finalReason,
      });

      Custompopup.hide();
      cpoptitle.empty();
      cpopupbody.empty();
    }else if (id === "forward") {
      const selectedCounter = $("#counterselect").val();
      const errlogtext = $(".errorlogtext");
      
      if (!selectedCounter) {
        errlogtext.text("Error: Please select a counter.");
        return;
      }

      console.log(selectedCounter);

      if(data.status === "held"){
        socket.emit("getandupdatecalledtick", {
          callingcode: "forward",
          tickid: data.id || "",
          tickstatus: "received",    
          tickwherestatus: "held", 
          cnum: authUser.cnum,
          cname: authUser.cname,
          tickcode: data.ticketservice,
          dataadditional: selectedCounter,
        });
      }else{
        socket.emit("getandupdatecalledtick", {
          callingcode: "forward",
          tickid: data.id || "",
          tickstatus: "received",    
          tickwherestatus: "called", 
          cnum: authUser.cnum,
          cname: authUser.cname,
          tickcode: data.ticketservice,
          dataadditional: selectedCounter,
        });
      }

      

      Custompopup.hide();
      cpoptitle.empty();
      cpopupbody.empty();
    }
  });
}
