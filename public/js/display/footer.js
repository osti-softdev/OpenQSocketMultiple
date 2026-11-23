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
    const activeAnnouncements = [];

    // announcement 1
    if (config.announcement && Number(config.announcement.status) === 1 && config.announcement.value) {
        activeAnnouncements.push(config.announcement.value);
    }

    // announcement 2
    if (config.announcement2 && Number(config.announcement2.status) === 1 && config.announcement2.value) {
        activeAnnouncements.push(config.announcement2.value);
    }

    // announcement 3
    if (config.announcement3 && Number(config.announcement3.status) === 1 && config.announcement3.value) {
        activeAnnouncements.push(config.announcement3.value);
    }

    // Trailing separator ensures equal spacing between the end of #runner and the start of #runner2
    const announcementText = activeAnnouncements.length > 0
        ? activeAnnouncements.join(separator) + separator
        : '';

    const bgColor = config?.annbgcolor?.value || 'transparent';
    const textColor = config?.anntextcolor?.value || '#ffffff';
    const speed = Math.max(1, Number(config?.annspeed?.value) || 41);

    $("#marquee_parent").css("background-color", bgColor);

    const $runners = $("#runner, #runner2");
    $runners.css("animation", "none");
    $runners.html(announcementText);
    $runners.css("color", textColor);

    // Force synchronous reflow so both identical runners start the animation on the exact same frame
    const marqueeEl = document.getElementById("marquee");
    if (marqueeEl) {
        void marqueeEl.offsetWidth;
    }

    $runners.css("animation", `marquee ${speed}s linear infinite`);
}
