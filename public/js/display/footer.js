// Listen for footer.json updates from server via footerwatcher
$(document).ready(async function () {
getConfig();

    socket.on("footerUpdated", () => {
        getConfig();
    });
});

function getConfig() {
    // $.ajax({
    //     url: '/api/getFooter',
    //     method: 'GET',
    //     dataType: 'json',
    //     success: function (response) {
    //     if (!response.success) {
    //         console.error('Invalid services response:', response);
    //         return;
    //     }
    //         applyConfig(response.data);
    //     },
    //     error: function (xhr, status, error) {
    //     console.error('Failed to load services:', error);
    //     }
    // });

        $.get('/api/settings', function (settings) {
            applyConfig(settings);
    });
}
// function applyConfig(config) {
//     console.log(config)
//     const section = config.ann_data || {};
//     const announcements = config.announcements_txt || {};
//     const activated = config.activated || {};

//     $("#marquee_parent").css("background-color", section.bgcolor);
//     $("#runner").css({
//         animation: `marquee ${section.speed}s linear infinite`,
//         "font-size": `${section.fontsize}px`,
//         color: section.color,
//         "font-weight": section.fontweight,
//         "text-shadow": `2px 2px 5px ${section.shadowcolorvalue}`
//     });

//     $("#runner2").css({
//         animation: `marquee ${section.speed}s linear infinite`,
//         "font-size": `${section.fontsize}px`,
//         color: section.color,
//         "font-weight": section.fontweight,
//         "text-shadow": `2px 2px 5px ${section.shadowcolorvalue}`
//     });

//     const separator = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
//     let firstann = '';

//     if (activated.ann1 == 1 && announcements.firstann) {
//         firstann += announcements.firstann;
//     }
//     if (activated.ann2 == 1 && announcements.secondann) {
//         if (firstann !== '') firstann += separator;
//         firstann += announcements.secondann;
//     }
//     if (activated.ann3 == 1 && announcements.thirdann) {
//         if (firstann !== '') firstann += separator;
//         firstann += announcements.thirdann;
//     }

//     $("#runner").html(firstann);
//     $("#runner2").html(firstann);
// }

function applyConfig(config) {

    console.log(config);

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

    $("#runner").html(announcementText);
    $("#runner2").html(announcementText);
}