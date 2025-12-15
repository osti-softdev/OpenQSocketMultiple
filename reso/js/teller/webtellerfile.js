$(document).ready(function () {
    let authUser = null;
    try {
      authUser = JSON.parse(localStorage.getItem("authUser"));
    } catch (e) {
      console.warn("Invalid authUser in localStorage, clearing it.");
      localStorage.removeItem("authUser");
    }
    setInterval(() => {
      const user = JSON.parse(localStorage.getItem("authUser"));
      if (!user || !user.cnum || !user.cuser) {
        console.warn("⚠️ Auth user missing or invalid, auto-logging out...");
        localStorage.removeItem("authUser");
        localStorage.removeItem("tellerCreds");
        window.location.href = "/312Xtellerlogin";
      }
    }, 30000); 

    if (!authUser) {
  // Not logged in at all
      window.location.href = "/312Xtellerlogin";
    } else {
      // Validate required keys before using them
      const requiredKeys = ["id", "cname", "cnum", "cuser", "group_name"];
      const hasMissing = requiredKeys.some(k => !authUser[k]);

      if (hasMissing) {
        console.warn("⚠️ Incomplete or corrupted authUser detected, logging out...");
        localStorage.removeItem("authUser");
        localStorage.removeItem("tellerCreds");
        window.location.href = "/312Xtellerlogin";
        return;
      }

      // Proceed as normal
      $(".titleHtml").text(authUser.cname);
      $(".usercounternum").text("Counter: " + authUser.cnum);

      socket.emit("gettellerservices", {
        id: authUser.id,
        cuser: authUser.cuser,
        cnum: authUser.cnum,
        cname: authUser.cname,
        group_name: authUser.group_name,
      });

      socket.emit("gettellersandgroups", {
        id: authUser.id,
        cuser: authUser.cuser,
        cnum: authUser.cnum,
        cname: authUser.cname,
        group_name: authUser.group_name,
      });
    }

    socket.on("reconnect", () => {
      const creds = JSON.parse(localStorage.getItem("tellerCreds"));
      if (creds) {
        console.log("🔁 Socket reconnected, re-authenticating...");
        socket.emit("tellerloginAttempt", creds);
      }
    });


    socket.on("calledtick", function(params) {
      // console.log("Activity Ticket: "+params.statusdata)
    })
    socket.on("updatetellersandgroups", (data) => {
      if (!data) {
        console.warn("⚠️ No teller/groups data received");
        return;
      }
      localStorage.setItem("tellerandgroupsdata", JSON.stringify(data));
      // console.log("📥 Received teller and groups data:", data);
    });



let lastCalledTicket = JSON.parse(localStorage.getItem("lastCalledTicket")) || null;
let currentCalledTicket = null; // 👈 holds the latest received data

socket.on("calledticketdata", function (data) {
  // Always store the latest data in a variable (even if null)
  currentCalledTicket = data;
  // No ticket → stop and clear
  if (!data) {
    resettimer();
    stoptimer();
    $(".servicecalled").text("");
    $(".servicecalledticket").text("");
    localStorage.removeItem("lastCalledTicket");
    lastCalledTicket = null;
    return;
  }

  // Check if the ticket changed
  const isNewTicket =
    !lastCalledTicket ||
    lastCalledTicket.ticketnum !== data.ticketnum ||
    lastCalledTicket.ticketservice !== data.ticketservice;

  if (isNewTicket) {
    // New ticket: reset and start
    resettimer();
    starttimer();
    lastCalledTicket = data;
    localStorage.setItem("lastCalledTicket", JSON.stringify(data));
  } else {
    // Same ticket: resume timer (do not reset)
    if (!timer) starttimer();
  }

  // Update UI
  $(".servicecalled").text(data.sname || "");
  $(".servicecalledticket").text(
    (data.ticketservice || "") + (data.ticketnum || "")
  );
});

//! Listen for updates from backend
socket.on("updatetellerservices", function(data) {
if (data) {
  console.log(data)
window.latestTellerData = data;
// console.log("📥 Received teller data:", data);
$(".tlrnavbtnheld p").text(`[${data.heldCount || 0}]`);
$(".tlrnavbtnrec p").text(`[${data.receivedCount || 0}]`);
if(data.receivedCount >= 1){
  $(".tlrnavbtnrec").addClass("blinkingRec");
}else{
  $(".tlrnavbtnrec").removeClass("blinkingRec");
}
$(".tlrnavbtnq p").text(`[${data.totalPending || 0}]`);
const $servicesContainer = $('.tellerdataservices');
$servicesContainer.empty(); // Clear previous services

// Loop through serviceData instead of splitting string
if (Array.isArray(data.serviceData)) {
  data.serviceData.forEach(function(serviceObj) {
    const $serviceDiv = $('<div></div>').addClass('tellerservice');

    const $servicename = $('<div></div>')
      .addClass('tellerservicename')
      .text(serviceObj.sname || "");

    const $serviceReg = $('<div></div>')
      .addClass('tellerservicereg')
      .attr('data-code', serviceObj.regular || "")
      .text(serviceObj.pendingRegular ?? "0");

    const $servicePrio = $('<div></div>')
      .addClass('tellerserviceprio')
      .attr('data-code', serviceObj.priority || "")
      .text(serviceObj.pendingPriority ?? "0");

      $serviceReg.on("click", function () {
          socket.emit("getandupdatecalledtick", {
            callingcode: "regcall",
            tickid: "",
            tickstatus: "calling",
            tickwherestatus: "pending",
            cnum: authUser.cnum,
            cname: authUser.cname,
            tickcode: $(this).attr("data-code"),
            dataadditional: "",
            group_name: authUser.group_name
          });
      });

      $servicePrio.on("click", function () {
        socket.emit("getandupdatecalledtick", {
            callingcode: "priocall",
            tickid: "",
            tickstatus: "calling",
            tickwherestatus: "pending",
            cnum: authUser.cnum,
            cname: authUser.cname,
            tickcode: $(this).attr("data-code"),
            dataadditional: "",
            group_name: authUser.group_name
          });;
      });

    $serviceDiv.append($servicename, $serviceReg, $servicePrio);
    $servicesContainer.append($serviceDiv);
  });
} else {
  console.warn("⚠️ No serviceData array in response");
}

} else {
console.warn("⚠️ No teller data received");
}
});

// When DB changes → re-request data
socket.on("reloadtellerservices", () => {
  if (authUser) {
    socket.emit("gettellerservices", {
      id: authUser.id,
      cuser: authUser.cuser,
      cnum: authUser.cnum,
      cname: authUser.cname,
    });
  }
});

// ! Click handlers for nav buttons
// 👇 On click Held button → log first held ticket
$(document).on("click", ".tlrnavbtnheld", function () {
  if (!window.latestTellerData) return;
  const rows = window.latestTellerData.heldList || [];
  if (rows.length > 0) {
    const first = rows[0];
    socket.emit("getandupdatecalledtick", {
      callingcode: "navcall",
      tickid: first.id || "",
      tickstatus: "calling",    
      tickwherestatus: "held", 
      cnum: authUser.cnum,
      cname: authUser.cname,
      tickcode: first.ticketservice,
      dataadditional: "",
      group_name: authUser.group_name
    });
  } else {
    console.log("⚠️ No held tickets available");
  }
});
// 👇 On click Pending button → log first pending ticket
$(document).on("click", ".tlrnavbtnq", function () {
  if (!window.latestTellerData) return;
  const rows = window.latestTellerData.allPendingList || [];
  if (rows.length > 0) {
    const first = rows[0];
    socket.emit("getandupdatecalledtick", {
      callingcode: "navcall",
      tickid: first.id || "",
      tickstatus: "calling",    
      tickwherestatus: "pending", 
      cnum: authUser.cnum,
      cname: authUser.cname,
      tickcode: first.ticketservice,
      dataadditional: "",
      group_name: authUser.group_name
    });
  } else {
    console.log("⚠️ No pending tickets available");
  }
});
// 👇 On click Received button → log first received ticket
$(document).on("click", ".tlrnavbtnrec", function () {
  if (!window.latestTellerData) return;
  const rows = window.latestTellerData.receivedList || [];
  if (rows.length > 0) {
    const first = rows[0];
    socket.emit("getandupdatecalledtick", {
      callingcode: "navcall",
      tickid: first.id || "",
      tickstatus: "calling",    
      tickwherestatus: "received", 
      cnum: authUser.cnum,
      cname: authUser.cname,
      tickcode: first.ticketservice,
      dataadditional: "",
      group_name: authUser.group_name,
    });
    // console.log(first.ticketservice+first.ticketnum); 
  } else {
    console.log("⚠️ No received tickets available");
  }
});

// ! HISTORY BUTTON CLICK
$(document).on("click", ".historybtn", function () {
  socket.emit("gettellershistory", {
    callingcode: "",
    tickid: "",
    tickstatus: "",
    tickwherestatus: "",
    cnum: authUser.cnum,
    cname: authUser.cname,
    tickcode: "",
    dataadditional: "",
    group_name: authUser.group_name,
  });
});

// LISTEN FOR RETURNED HISTORY DATA
socket.on("tellerhistorydata", (tickets) => {
  console.log(tickets);
    if (!tickets || !tickets.length) {
    Swal.fire({
      title: "Empty",
      text: "You haven't yet transacted any tickets!",
      icon: "warning",
      showCancelButton: false,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Okay!"
    });

    return; // stop execution to prevent errors
  }

  // Build table rows based on selected status
  const buildRows = (filterStatus) => {
    return tickets
      .filter((t) => t.status === filterStatus)
      .map((t) => {
        const historyHTML = t.history
          .map(
            (h) =>
              `<div style="padding:2px 0;">${h.time} — ${h.user} — ${h.action}</div>`
          )
          .join("");

        return `
          <tr>
            <td>${t.ticketservice}${t.ticketnum}</td>
            <td>${t.start_time}</td>
            <td>${historyHTML}</td>
          </tr>
        `;
      })
      .join("");
  };

  // Default status to display
  let currentStatus = "received";

  const popupHTML = `
    <div style="text-align:left;">
      <label style="font-weight:600;">Status</label>
      <select id="statusSelect" class="swal2-input" style="width:100%;margin-top:5px;">
        <option value="received">Received</option>
        <option value="called">Called</option>
        <option value="held">Held</option>
        <option value="finished">Finished</option>
        <option value="voided">Voided</option>
      </select>

      <hr style="margin:15px 0;">

      <table border="1" width="100%" style="border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Start Time</th>
            <th>History</th>
          </tr>
        </thead>
        <tbody id="historyTableBody">
          ${buildRows(currentStatus)}
        </tbody>
      </table>
    </div>
  `;

  Swal.fire({
    title: "Ticket History",
    html: popupHTML,
    width: 700,
    showCancelButton: false,
    confirmButtonText: "Okay",
    focusConfirm: false,
    didOpen: () => {
      const select = document.getElementById("statusSelect");

      select.value = currentStatus;

      select.addEventListener("change", (e) => {
        currentStatus = e.target.value;
        document.getElementById("historyTableBody").innerHTML =
          buildRows(currentStatus);
      });
    },
    preConfirm: () => {
      const selected = document.getElementById("statusSelect").value;
      return { status: selected };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      socket.emit("updateticketstatus", {
        status: result.value.status,
        cnum: authUser.cnum,
        cname: authUser.cname,
        group_name: authUser.group_name,
      });
    }
  });
});



// ! Right-click context menu for held list
$(document).on("contextmenu", ".tlrnavbtnheld", function (e) {
  e.preventDefault();
  e.stopPropagation(); // stop bubbling up
  if (!window.latestTellerData) return;

  const rows = window.latestTellerData.heldList || [];
  showSwalTable("Held Tickets", rows, "start_time","held");
});
// Right-click context menu for all pending list
$(document).on("contextmenu", ".tlrnavbtnq", function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (!window.latestTellerData) return;

  const rows = window.latestTellerData.allPendingList || [];
  showSwalTable("All Pending Tickets", rows, "time","pending" );
});
// Right-click context menu for received list
$(document).on("contextmenu", ".tlrnavbtnrec", function (e) {
  e.preventDefault();
  e.stopPropagation();
  if (!window.latestTellerData) return;

  const rows = window.latestTellerData.receivedList || [];
  showSwalTable("Received Tickets", rows, "start_time","received");
});

// ! Helper to render SweetAlert2 table
function showSwalTable(title, rows, timeKey, listType) {
  if (!Array.isArray(rows)) rows = [];

  rows = [...rows].sort((a, b) => {
    const t1 = normalizeTime(a[timeKey]);
    const t2 = normalizeTime(b[timeKey]);
    return t1 - t2; // earliest first
  });

  let table =
    '<table style="width:100%;border-collapse:collapse;text-align:left;">' +
    "<thead><tr>" +
    "<th style='padding:4px;border-bottom:1px solid #ccc'>Ticket</th>" +
    "<th style='padding:4px;border-bottom:1px solid #ccc'>Time</th>" +
    "<th style='padding:4px;border-bottom:1px solid #ccc'>Action</th>" +
    "</tr></thead><tbody>";

  if (rows.length === 0) {
    table +=
      "<tr><td colspan='3' style='padding:6px;text-align:center'>No records found</td></tr>";
  } else {
    rows.forEach((r) => {
      const ticketDisplay = `${r.ticketservice || ""}${r.ticketnum || ""}`;
      const timeDisplay = r[timeKey] || "";

      table +=
        "<tr>" +
        `<td style="padding:3px;">${ticketDisplay}</td>` +
        `<td style="padding:3px;">${timeDisplay}</td>` +
        `<td style="padding:3px;"><button style="cursor:pointer;padding:3px;width:100%;" class='callBtn'data-service='${r.ticketservice}'  data-id='${r.id}' data-type='${listType}'>Call</button></td>` +
        "</tr>";
    });
  }

  table += "</tbody></table>";

  const html = `<div style="max-height:200px;overflow-y:auto;scrollbar-width:thin;">${table}</div>`;
  const title2 =
    title +
    `<span id="closeSwalBtn" style="position:absolute;top:0px;right:0px;font-size:1.2rem;cursor:pointer;">❌</span>`;

  Swal.fire({
    title: title2,
    html: html,
    width: 600,
    showConfirmButton: false,
  });

  // 🔘 Event Handlers
  $(document)
    .off("click", ".callBtn")
    .on("click", ".callBtn", function () {
      const id = $(this).data("id");
      const type = $(this).data("type");
      const ticketservice = $(this).data("service");

          socket.emit("getandupdatecalledtick", {
            callingcode: "navcall",
            tickid: id || "",
            tickstatus: "calling",    
            tickwherestatus: type, 
            cnum: authUser.cnum,
            cname: authUser.cname,
            tickcode: ticketservice,
            dataadditional: "",
            group_name: authUser.group_name
          });

      Swal.close();
    });

  $(document)
    .off("click", "#closeSwalBtn")
    .on("click", "#closeSwalBtn", function () {
      Swal.close();
    });

  function normalizeTime(t) {
    if (!t) return 0;

    if (!isNaN(t) && typeof t !== "string") return Number(t);

    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
      const [h, m, s] = t.split(":").map(Number);
      const now = new Date();
      now.setHours(h, m, s || 0, 0);
      return now.getTime();
    }

    // If it's "YYYY-MM-DD HH:mm:ss" or ISO-like string
    const parsed = Date.parse(t.replace(" ", "T"));
    if (!isNaN(parsed)) return parsed;

    // Default fallback
    return 0;
  }
}

// ! ACTION BUTTONS
$(document).on("click", ".telleractbtn", function () {
  const actionId = $(this).data("actionid"); // lowercase 'id' to match HTML attribute
  const currentCalledTicket =
    JSON.parse(localStorage.getItem("lastCalledTicket")) || null;

  if (actionId === "finish") {
    if (!currentCalledTicket) {
      console.warn("⚠️ No active called ticket to finish.");
      return;
    }

    socket.emit("getandupdatecalledtick", {
      callingcode: "finish",
      tickid: currentCalledTicket.id || "",
      tickstatus: "finished",    
      tickwherestatus: "called", 
      cnum: authUser.cnum,
      cname: authUser.cname,
      tickcode: currentCalledTicket.ticketservice,
      dataadditional: "",
    });
  } else if(actionId === "recall"){
    if (!currentCalledTicket) {
      console.warn("⚠️ No active called ticket to recall.");
      return;
    }
    socket.emit("getandupdatecalledtick", {
      callingcode: "recall",
      tickid: currentCalledTicket.id || "",
      tickstatus: "calling",    
      tickwherestatus: "called", 
      cnum: authUser.cnum,
      cname: authUser.cname,
      tickcode: currentCalledTicket.ticketservice,
      dataadditional: "",
    });
  } else if (actionId === "hold") {
    if (!currentCalledTicket) {
      console.warn("⚠️ No active called ticket to hold.");
      return;
    }

    socket.emit("getandupdatecalledtick", {
      callingcode: "hold",
      tickid: currentCalledTicket.id || "",
      tickstatus: "held",    
      tickwherestatus: "called", 
      cnum: authUser.cnum,
      cname: authUser.cname,
      tickcode: currentCalledTicket.ticketservice,
      dataadditional: "",
    });
  }else if (actionId === "void") {
    if (!currentCalledTicket) {
      console.warn("⚠️ No active called ticket to void.");
      return;
    }
    custompopupset("show", "void", currentCalledTicket, authUser);
  }else if (actionId === "forward") {
    if (!currentCalledTicket) {
      console.warn("⚠️ No active called ticket to forward.");
      return;
    }
    custompopupset("show", "forward", currentCalledTicket, authUser);
    console.log("Forward Ticket:", currentCalledTicket);
  }
});
// ! Logout button
    $("#logoutBtn").on("click", function () {
      localStorage.removeItem("authUser");
      localStorage.removeItem("tellerCreds");
      window.location.href = "/312Xtellerlogin";
    });
});