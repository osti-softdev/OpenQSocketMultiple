$(document).ready(function () {
	socket.emit("getsysconfigs");

	socket.on("systemConfigs", function (res) {
		const data = res.data || {};
		const db = data.db || {};

		console.log(data)
		const counterEnabled = data.counterDisplay == "1" || data.counterDisplay === true;
		$(".settdbdatacounter").prop("checked", counterEnabled);
		$(".settdbdatacounterlabel").text(counterEnabled ? "ON" : "OFF");
	});

	// === 🧩 Handle Changes ===


	$(".settdbdatacounter").on("change", function () {
		const checked = $(this).is(":checked");
		const value = checked ? "1" : "0";
		$(".settdbdatacounterlabel").text(checked ? "ON" : "OFF"); // 🔹 live label update
		socket.emit("updateSystemConfig", { key: "counterDisplay", value });
	});
	


	$(".settdataretention").on("input", function () {
		const value = $(this).val() || "0";
		socket.emit("updateSystemConfig", { key: "databaseRetentionDays", value });
	});



	socket.on("reloadSystem", () => {
        showMsg("warning", "System configuration updated. Application will restart.");
			socket.emit("relaunchApp");
	});
});
