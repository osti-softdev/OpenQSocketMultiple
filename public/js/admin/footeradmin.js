// Listen for footer.json updates from server via footerwatcher
socket.on("footerUpdatedadmin", (config) => {
	applyConfigadmin(config);
});

// Function to apply configuration changes
function applyConfigadmin(config) {
	const section = config.ann_data || {};
	const announcements = config.announcements_txt || {};
	const activated = config.activated || {};
	const displayUpdate = config.display_update || {};

	// * Initialize Current Configurations
	$("#firstmsg").val(announcements.firstann);
	$("#secondmsg").val(announcements.secondann);
	$("#thirdmsg").val(announcements.thirdann);

	// Set checkboxes based on config
	$("#activateann1").prop("checked", activated.ann1 == "1");
	$("#activateann2").prop("checked", activated.ann2 == "1");
	$("#activateann3").prop("checked", activated.ann3 == "1");

	// Set label text
	$(".activatemsgconfiglabel1").text(activated.ann1 == "1" ? "Show" : "Hide");
	$(".activatemsgconfiglabel2").text(activated.ann2 == "1" ? "Show" : "Hide");
	$(".activatemsgconfiglabel3").text(activated.ann3 == "1" ? "Show" : "Hide");

	$(".labelforactivate1").css({
		"background-color":
			activated.ann1 == "1" ? "rgba(0, 255, 81, 0.507)" : "red",
	});
	$(".labelforactivate2").css({
		"background-color":
			activated.ann2 == "1" ? "rgba(0, 255, 81, 0.507)" : "red",
	});
	$(".labelforactivate3").css({
		"background-color":
			activated.ann3 == "1" ? "rgba(0, 255, 81, 0.507)" : "red",
	});

	// ! Input configurations setting of values
	$(".speedtext").text(section.speed);
    $(".annspeed").val(section.speed);

	$(".fontsizetext").text(section.fontsize + "px");
    $(".annfontsize").val(section.fontsize);

	$(".fontweighttext").text(section.fontweight);
    $(".annfontweight").val(section.fontweight);
       
	$(".colortext").text(section.color);
    $(".anncolor").val(section.color);

	$(".bgcolortext").text(section.bgcolor);
    $(".annbgcolor").val(section.bgcolor);

	$(".shadowcolortext").text(section.shadowcolorvalue);
    $(".shadowcolor").val(section.shadowcolorvalue);

	if (displayUpdate.update === 1) {
		socket.emit("updatefooteradmin");
		socket.once("updatefooterSuccessadmin", () => {
			window.location.reload();
		});
		socket.once("updatefooterError", (errMsg) => {
			console.error("Footer update failed:", errMsg);
		});
	}
	const scaleFactor = 918 / 1080; // or 0.85

	$("#marquee_parentadmin").css("background-color", section.bgcolor);
	$("#runneradmin").css({
		animation: `marqueeadmin ${section.speed}s linear infinite`,
		"font-size": `${parseInt(section.fontsize) * scaleFactor}px`,
		color: section.color,
		"font-weight": section.fontweight,
		"text-shadow": `2px 2px 5px ${section.shadowcolorvalue}`,
	});

	const separator =
		"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
	let firstann = "";

	if (activated.ann1 == 1 && announcements.firstann) {
		firstann += announcements.firstann;
	}
	if (activated.ann2 == 1 && announcements.secondann) {
		if (firstann !== "") firstann += separator;
		firstann += announcements.secondann;
	}
	if (activated.ann3 == 1 && announcements.thirdann) {
		if (firstann !== "") firstann += separator;
		firstann += announcements.thirdann;
	}

	$("#runneradmin").html(firstann);
}
$(document).ready(function () {
	// Save messages
	$(".savemsgconfig").on("click", function () {
		const msgconfig = $(this).data("msgconfig");

		let footermsg = {};
		if (msgconfig === 1) {
			footermsg.firstann = $("#firstmsg").val();
		} else if (msgconfig === 2) {
			footermsg.secondann = $("#secondmsg").val();
		} else if (msgconfig === 3) {
			footermsg.thirdann = $("#thirdmsg").val();
		}

		// console.log("Sending announcement update:", footermsg);

		socket.emit("updateAnnouncementsadmin", footermsg);

		socket.once("updateAnnouncementsSuccess", (newConfig) => {
			// console.log("✅ Announcements updated successfully", newConfig);
			applyConfigadmin(newConfig);
		});

		socket.once("updateAnnouncementsError", (errMsg) => {
			console.error("❌ Update failed:", errMsg);
		});
	});

	// Toggle activators (checkboxes)
	$(".activatemsgconfig").on("change", function () {
		const activator = $(this).data("activateconfig");
		const isChecked = $(this).is(":checked") ? "1" : "0";

		let footeractivator = { activated: {} };
		if (activator === 1) {
			footeractivator.activated.ann1 = isChecked;
		} else if (activator === 2) {
			footeractivator.activated.ann2 = isChecked;
		} else if (activator === 3) {
			footeractivator.activated.ann3 = isChecked;
		}

		// console.log("Sending activator update:", footeractivator);
		socket.emit("updateAnnouncementsadmin", footeractivator);

		socket.once("updateAnnouncementsSuccess", (newConfig) => {
			// console.log("✅ Activator updated successfully", newConfig);
			applyConfigadmin(newConfig);
		});

		socket.once("updateAnnouncementsError", (errMsg) => {
			console.error("❌ Update failed:", errMsg);
		});
	});

	// Handle ALL announcement config inputs
	$(".commonanninput").on("change", function () {
		console.log("input");
		const configKey = $(this).data("anninputsconfig");
		let value = $(this).val();

		// Normalize specific values
		if (configKey === "fontsize") {
			value = Math.min(200, Math.max(30, parseInt(value) || 30));
			$(this).val(value);
			$(".fontsizetext").text(value + "px");
		} 
		else if (configKey === "fontweight") {
			value = parseInt(value) || 400;
			$(".fontweighttext").text(value);
		} 
		else if (configKey === "speed") {
			value = Math.max(1, Math.min(200, parseInt(value) || 10));
			$(this).val(value);
			$(".speedtext").text(value);
		}
		else if (configKey === "color") {
			$(".colortext").text(value);
		}
		else if (configKey === "bgcolor") {
			$(".bgcolortext").text(value);
		}
		else if (configKey === "shadowcolorvalue") {
			$(".shadowcolortext").text(value);
		}

		// Build ann_data object
		let footerconfigs = { ann_data: {} };
		footerconfigs.ann_data[configKey] = value;

		// Send update to server
		socket.emit("updateAnnouncementsadmin", footerconfigs);

		socket.on("updateAnnouncementsSuccess", (newConfig) => {
			applyConfigadmin(newConfig);
		});

		socket.on("updateAnnouncementsError", (errMsg) => {
			console.error("❌ Update failed:", errMsg);
		});

	});

	// ! display config values 
	// Speed
    $(".speedtext").text($(".annspeed").val());
    $(".annspeed").on("input", function() {
        $(".speedtext").text($(this).val());
    });

    // Font-size (30–200px)
    $(".annfontsize").on("input", function() {
        let val = Math.min(200, Math.max(30, $(this).val())); 
        $(this).val(val);
        $(".fontsizetext").text(val + "px");
    });

    // Font-weight (100–900 step 100)
   $(".fontweighttext").text($(".annfontweight").val());
    $(".annfontweight").on("change", function() {
        $(".fontweighttext").text($(this).val());
    });

    // Colors → show hex
    $(".anncolor").on("input", function() {
        $(".colortext").text($(this).val());
    }).trigger("input");

    $(".annbgcolor").on("input", function() {
        $(".bgcolortext").text($(this).val());
    }).trigger("input");

    $(".shadowcolor").on("input", function() {
        $(".shadowcolortext").text($(this).val());
    }).trigger("input");
});
