// Listen for footer.json updates from server via footerwatcher
socket.on("footerUpdated", (config) => {
    applyConfig(config);
});

// Function to apply configuration changes
function applyConfig(config) {
    const section = config.ann_data || {};
    const announcements = config.announcements_txt || {};
    const activated = config.activated || {};
    const displayUpdate = config.display_update || {};

    if (displayUpdate.update === 1) {
        socket.emit("updatefooter");
        socket.once("updatefooterSuccess", () => {
            window.location.reload();
        });
        socket.once("updatefooterError", (errMsg) => {
            console.error("Footer update failed:", errMsg);
        });
    }

    $("#marquee_parent").css("background-color", section.bgcolor);
    $("#runner").css({
        animation: `marquee ${section.speed}s linear infinite`,
        "font-size": `${section.fontsize}px`,
        color: section.color,
        "font-weight": section.fontweight,
        "text-shadow": `2px 2px 5px ${section.shadowcolorvalue}`
    });

    const separator = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    let firstann = '';

    if (activated.ann1 == 1 && announcements.firstann) {
        firstann += announcements.firstann;
    }
    if (activated.ann2 == 1 && announcements.secondann) {
        if (firstann !== '') firstann += separator;
        firstann += announcements.secondann;
    }
    if (activated.ann3 == 1 && announcements.thirdann) {
        if (firstann !== '') firstann += separator;
        firstann += announcements.thirdann;
    }

    $("#runner").html(firstann);
}