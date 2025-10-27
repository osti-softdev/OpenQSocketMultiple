$(document).ready(function () {
	console.log("dashboard.js: Checking JWT");
	fetch("/whoami")
		.then((res) => res.json())
		.then((user) => {
			$(".adminName").text(`${user.name} (${user.role})`);
			if (user.role === "superadmin") {
				$("#dash").show();
				$("#ann").show();
				$("#ads").show();
				$("#settings").show();
			} else if (user.role === "admin") {
				$("#dash").show();
				$("#ann").show();
				$("#ads").show();
				$("#settings").show();
				$(".settservicesupdate").css({
					"top": "0",
					"left": "0",
					"height": "100%",
					"width": "100%",
				});
				$(".settaccountcreation").hide();
				$(".setttellertupdate").hide();
				$(".settaudiosetting").hide();
				$(".settticketupdate").hide();
				$(".settimagesupdate").hide();

			} else {
				$("#dash").show();
			}
		});

	// * Jquery UI Setting
	$(document).tooltip({
		track: true,
	});
	const today = new Date();
	const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

	// Format dates as YYYY-MM-DD
	const formatDate = (date) => {
		if (!date || isNaN(date)) return "";
		let month = (date.getMonth() + 1).toString().padStart(2, "0");
		let day = date.getDate().toString().padStart(2, "0");
		return `${date.getFullYear()}-${month}-${day}`;
	};

	// Load persisted dates from localStorage or default to today
	let startDate = localStorage.getItem("startDate") || formatDate(today);
	let endDate = localStorage.getItem("endDate") || formatDate(today);

	// Set input values
	$("#startDate").val(startDate);
	$("#endDate").val(endDate);

	// Show calendar picker when clicked
	$(".daterange").on("click", function () {
		if (this.showPicker) {
			this.showPicker();
		} else {
			$(this).focus();
		}
	});

	// ! INITIALIZATION
	function initialize_dates() {
		let datefrom = startDate;
		let dateto = endDate;
		
		socket.emit("requestAdminDataforcontent2averages", { datefrom, dateto });
		socket.emit("requestAdminData", { datefrom, dateto });
		socket.emit("requestAdminDataforcontent3", { datefrom, dateto });
        socket.emit('requestAdminDataforcontent4alldata', { datefrom, dateto });
	}
	initialize_dates();
	// Request new data when user changes dates
	$("#startDate, #endDate").on("input", function () {
		let datefrom = $("#startDate").val();
		let dateto = $("#endDate").val();
		// Validate dates
		if (!datefrom || !dateto) {
			console.warn("Invalid date range selected");
			return;
		}

		// Ensure datefrom is not after dateto
		if (new Date(datefrom) > new Date(dateto)) {
			console.warn("Start date cannot be after end date");
			$("#startDate").val(dateto);
			datefrom = dateto;
		}

		// Persist to localStorage
		localStorage.setItem("startDate", datefrom);
		localStorage.setItem("endDate", dateto);

		socket.emit("requestAdminDataforcontent2averages", { datefrom, dateto });
		socket.emit("requestAdminData", { datefrom, dateto });
		socket.emit("requestAdminDataforcontent3", { datefrom, dateto });
        socket.emit('requestAdminDataforcontent4alldata', { datefrom, dateto });

	});

	// ! Admin Main Buttons
	$(".admbtnsoptions").on("click", function () {
		const page = $(this).data("page");
		localStorage.setItem("lastPage", page); // <-- Save page to localStorage
		const el = $("#adminAdPlayer")[0];
		if (page !== "advertisement") {
			el.pause();
		} else {
			el.play();
		}
		if (page === "dashboard") {
			headeradjust("revert");
			showobject(".dashboard-date-range");
			showobject(".dashboard-exports");
			showobject(".dashboard-dashboard-label");
			hideobject(".dashboard-announcement-label");
			hideobject(".dashboard-ads-label");
			hideobject(".dashboard-settings-label");
			showobject(".dashmain");
			hideobject(".annmain");
			hideobject(".adsmain");
			hideobject(".settingsmain");
			displaytable4();
			$(this).addClass("active").siblings().removeClass("active");
			let datefrom = $("#startDate").val();
			let dateto = $("#endDate").val();
		} else if (page === "announcement") {
			headeradjust("adjust");
			hideobject(".dashboard-date-range");
			hideobject(".dashboard-exports");
			showobject(".dashboard-announcement-label");
			hideobject(".dashboard-ads-label");
			hideobject(".dashboard-dashboard-label");
			hideobject(".dashboard-settings-label");
			hideobject(".dashmain");
			hideobject(".adsmain");
			showobject(".annmain");
			hideobject(".settingsmain");
			$(this).addClass("active").siblings().removeClass("active");
		} else if (page === "advertisement") {
			headeradjust("adjust");
			hideobject(".dashboard-date-range");
			hideobject(".dashboard-announcement-label");
			hideobject(".dashboard-exports");
			showobject(".dashboard-ads-label");
			hideobject(".dashboard-dashboard-label");
			hideobject(".dashboard-settings-label");
			hideobject(".dashmain");
			hideobject(".annmain");
			showobject(".adsmain");
			hideobject(".settingsmain");
			$(this).addClass("active").siblings().removeClass("active");
		} else if (page === "settings") {
			headeradjust("adjust");
			hideobject(".dashboard-date-range");
			hideobject(".dashboard-announcement-label");
			hideobject(".dashboard-exports");
			hideobject(".dashboard-ads-label");
			hideobject(".dashboard-dashboard-label");
			showobject(".dashboard-settings-label");
			hideobject(".dashmain");
			hideobject(".annmain");
			hideobject(".adsmain");
			showobject(".settingsmain");
			$(this).addClass("active").siblings().removeClass("active");
		}
	});

	 $(".content3-hourpeakchart").addClass("active");
    $(".content3btns[data-content3btnsholder='hour']").addClass("active");
	// ! Admin Content3 Buttons
	$(".content3btns").on("click", function () {
    const chartcontainer = $(this).data("content3btnsholder");

    // toggle button active state
    $(this).addClass("active").siblings().removeClass("active");

    // hide all chart containers first
    $(".content3-hourpeakchart, .content3-datepeakchart, .content3-monthpeakchart")
        .removeClass("active");

    // show only the selected one
    if (chartcontainer === "hour") {
        $(".content3-hourpeakchart").addClass("active");
    } else if (chartcontainer === "date") {
        $(".content3-datepeakchart").addClass("active");
    } else if (chartcontainer === "month") {
        $(".content3-monthpeakchart").addClass("active");
    }
});

	function headeradjust(param) {
		if(param === "adjust"){
		$(".adminbtns").addClass("activerespond");
		}else{
		$(".adminbtns").removeClass("activerespond");
		}
	}
	function hideobject(params) {
		$(params).hide();
	}
	function showobject(params) {
		$(params).css("display", "flex");
	}
	// Auto-click dashboard on load
	$(".admbtnsoptions[data-page='settings']").click();

	// --- Load last page or fallback to dashboard ---
const lastPage = localStorage.getItem("lastPage") || "dashboard";
$(`.admbtnsoptions[data-page='${lastPage}']`).click();

	$(".logoutbtn").on("click", function () {
		localStorage.clear();
		fetch("/logout", { method: "POST" }).then(() => {
			socket.emit("logout");
			window.location.replace("/312Xadmin"); // move redirect here
		});
	});

	socket.on("logoutSuccess", () => {
		window.location.replace("/312Xadmin");
	});
});
// Block Ctrl + Scroll
document.addEventListener(
	"wheel",
	function (e) {
		if (e.ctrlKey) {
			e.preventDefault();
		}
	},
	{ passive: false }
);

// Block pinch zoom
document.addEventListener(
	"touchmove",
	function (e) {
		if (e.scale !== 1) {
			e.preventDefault();
		}
	},
	{ passive: false }
);

// Block Ctrl + +/-/0
document.addEventListener("keydown", function (e) {
	if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "0")) {
		e.preventDefault();
	}
});
