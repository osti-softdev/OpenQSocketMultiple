$(document).ready(function () {
    // Request system configurations
    socket.emit("getsysconfigs");

    // Receive system configuration data
    socket.on("systemConfigs", function (res) {
        const data = res.data || {};
        const db = data.db || {};

        console.log("System Configs:", data);

        // Database size
        $(".settdbdatadbsize").text(db.formatted || "N/A");

        // Data retention days
        $(".settdataretention").val(data.databaseRetentionDays || 0);

        // SMS feature (checkbox + label)
        const smsEnabled = data.smsType === "1" || data.smsType === 1 || data.smsType === true;
        $(".settdbdatasmsfeature").prop("checked", smsEnabled);
        $(".settdbdatasmsfeaturelabel").text(smsEnabled ? "ON" : "OFF");

        // Counter display (checkbox + label)
        const counterEnabled = data.counterDisplay === "1" || data.counterDisplay === 1 || data.counterDisplay === true;
        $(".settdbdatacounter").prop("checked", counterEnabled);
        $(".settdbdatacounterlabel").text(counterEnabled ? "ON" : "OFF");

        // System type (radio buttons by value)
        const sysType = (data.systemType || "").toUpperCase();
        $(".settdbdatasystemtype").each(function () {
            const val = $(this).val().toUpperCase();
            $(this).prop("checked", val === sysType);
        });
    });
});
