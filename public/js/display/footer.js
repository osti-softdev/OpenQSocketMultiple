// Listen for announcement updates from server via socket
$(document).ready(async function () {
    getConfig();

    socket.on("footerUpdated", () => {
        getConfig();
    });
});

function getConfig() {
    $.get('/api/settings', function (settings) {
        applyConfig(settings);
    });
}

function applyConfig(config) {
    const separator = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    let announcementText = '';

    // announcement 1
    if (config.announcement && Number(config.announcement.status) === 1 && config.announcement.value) {
        announcementText += config.announcement.value;
    }

    // announcement 2
    if (config.announcement2 && Number(config.announcement2.status) === 1 && config.announcement2.value) {
        if (announcementText !== '') announcementText += separator;
        announcementText += config.announcement2.value;
    }

    // announcement 3
    if (config.announcement3 && Number(config.announcement3.status) === 1 && config.announcement3.value) {
        if (announcementText !== '') announcementText += separator;
        announcementText += config.announcement3.value;
    }

    $("#marquee_parent").css("background-color", config.annbgcolor.value);
    $("#runner").css({
        animation: `marquee ${config.annspeed.value}s linear infinite`,
        color: config.anntextcolor.value,
    });

    $("#runner2").css({
        animation: `marquee ${config.annspeed.value}s linear infinite`,
        color: config.anntextcolor.value,
    });


    $("#runner").html(announcementText);
    $("#runner2").html(announcementText);
}