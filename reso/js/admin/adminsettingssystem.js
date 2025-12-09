$(document).ready(function () {
	socket.emit("getsysconfigs");

	socket.on("systemConfigs", function (res) {
		const data = res.data || {};
		const db = data.db || {};

		console.log(data)
		const feedbackenabled = data.feedbackswitch == "1" || data.feedbackswitch === true;
		$(".settdbdatafeedbackswitch").prop("checked", feedbackenabled);
		$(".settdbdatafeedbackswitchlabel").text(feedbackenabled ? "ON" : "OFF");
		withfeedback = feedbackenabled;

		$(".settdbdatadbsize").text(db.formatted || "N/A");
		$(".settdbdataretention").val(data.databaseRetentionDays || 0);

		const smsEnabled = data.smsType == "1" || data.smsType === true;
		$(".settdbdatasmsfeature").prop("checked", smsEnabled);
		$(".settdbdatasmsfeaturelabel").text(smsEnabled ? "ON" : "OFF");

		const counterEnabled = data.counterDisplay == "1" || data.counterDisplay === true;
		$(".settdbdatacounter").prop("checked", counterEnabled);
		$(".settdbdatacounterlabel").text(counterEnabled ? "ON" : "OFF");

		const sysType = (data.systemType || "").toUpperCase();
		$(".settdbdatasystemtype").each(function () {
			const val = $(this).val().toUpperCase();
			$(this).prop("checked", val === sysType);
		});
	});

	// === 🧩 Handle Changes ===
	$(".settdbdatasmsfeature").on("change", function () {
		const checked = $(this).is(":checked");
		const value = checked ? "1" : "0";
		$(".settdbdatasmsfeaturelabel").text(checked ? "ON" : "OFF"); // 🔹 live label update
		socket.emit("updateSystemConfig", { key: "SMS", value });
	});

	$(".settdbdatacounter").on("change", function () {
		const checked = $(this).is(":checked");
		const value = checked ? "1" : "0";
		$(".settdbdatacounterlabel").text(checked ? "ON" : "OFF"); // 🔹 live label update
		socket.emit("updateSystemConfig", { key: "counterDisplay", value });
	});
	
	$(".settdbdatafeedbackswitch").on("change", function () {
		const checked = $(this).is(":checked");
		const value = checked ? "1" : "0";
		$(".settdbdatafeedbackswitchlabel").text(checked ? "ON" : "OFF"); // 🔹 live label update
		socket.emit("updateSystemConfig", { key: "feedbackswitch", value });
	});

	$(".settdataretention").on("input", function () {
		const value = $(this).val() || "0";
		socket.emit("updateSystemConfig", { key: "databaseRetentionDays", value });
	});

	$(".settdbdatasystemtype").on("change", function () {
		const value = $(this).val();
		socket.emit("updateSystemConfig", { key: "SYSTEM_TYPE", value });
	});

	socket.on("reloadSystem", () => {
        showMsg("warning", "System configuration updated. Application will restart.");
			socket.emit("relaunchApp");
	});
});
