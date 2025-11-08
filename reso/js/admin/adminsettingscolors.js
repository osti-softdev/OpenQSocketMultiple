        socket.emit("updatecoloradmin");
// ✅ Listen for configuration updates from server
socket.on("ColorUpdatedadmin", (config) => {
    const displayUpdate = config.display_update || {};
    console.log("✅ Color configuration updated successfully.");

    if (displayUpdate.update === 1) {
        socket.emit("updatecoloradmin");
        socket.once("updatecolorSuccessadmin", () => {
            window.location.reload();
        });
        socket.once("updatecolorError", (errMsg) => {
            console.error("Color update failed:", errMsg);
        });
    }

    // ✅ Apply colors to inputs
    const colorKeys = [
        "time_color", "time_shadow", "date_color", "nowserve_color",
        "nowserve_text_color", "service_color", "service_text_color",
        "counter_color", "counter_text_color", "ticket_color",
        "ticket_text_color", "popup_ticket_color", "popup_service_color",
        "kiosk_footer_color", "kiosk_footer_text_color",
        "kiosk_footer_text_shadow_color", "kiosk_regular_service_color",
        "kiosk_priority_service_color", "kiosk_service_shadow_color",
        "kiosk_back_color", "kiosk_back_text_color"
    ];

    colorKeys.forEach(key => {
        if (config[key] !== undefined) {
            $(`.${key}`).val(config[key]);
        }
    });
});

// ✅ Handle color picker changes
$(".colorsettingIdclass").on("change", function () {
    const configKey = $(this).data("colorkey");
    const value = $(this).val();

    // ✅ Send update request to server directly
    const colorconfigs = {};
    colorconfigs[configKey] = value;

    socket.emit("updateColorconfigadmin", colorconfigs);
});

socket.on("updateColorconfigError", (errMsg) => {
    console.error("❌ Update failed:", errMsg);
});
