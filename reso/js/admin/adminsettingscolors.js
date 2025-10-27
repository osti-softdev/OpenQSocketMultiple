socket.on("DisplayUpdated", (config) => {
    $(".time_color").val(config.time_color);
    $(".time_shadow").val(config.time_shadow);
    $(".date_color").val(config.date_color);
    $(".nowserve_color").val(config.nowserve_color);
    $(".nowserve_text_color").val(config.nowserve_text_color);
    $(".service_color").val(config.service_color);
    $(".service_text_color").val(config.service_text_color);
    $(".counter_color").val(config.counter_color);
    $(".counter_text_color").val(config.counter_text_color);
    $(".ticket_color").val(config.ticket_color);
    $(".ticket_text_color").val(config.ticket_text_color);
    $(".popup_ticket_color").val(config.popup_ticket_color);
    $(".popup_service_color").val(config.popup_service_color);
    $(".kiosk_footer_color").val(config.kiosk_footer_color);
    $(".kiosk_footer_text_color").val(config.kiosk_footer_text_color);
    $(".kiosk_footer_text_shadow_color").val(config.kiosk_footer_text_shadow_color);
    $(".kiosk_regular_service_color").val(config.kiosk_regular_service_color);
    $(".kiosk_priority_service_color").val(config.kiosk_priority_service_color);
    $(".kiosk_service_shadow_color").val(config.kiosk_service_shadow_color);
    $(".kiosk_back_color").val(config.kiosk_back_color);
    $(".kiosk_back_text_color").val(config.kiosk_back_text_color);
});

$(".colorsettingIdclass").on("change", function () {
		console.log("input");
		const configKey = $(this).data("colorkey");
		let value = $(this).val();

        if(configKey ){

        }
});