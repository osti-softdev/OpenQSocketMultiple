const fs = require("fs");
const path = require("path");
const fsp = require("fs").promises;
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");

function setupFooterWatcheradmin(socket, io) {
	const footerPath = path.join(rootpath, "/config/footer.json");

	// Send current footer on new connection
	sendFooteradmin(socket);

	// Handle updatefooter request (reset display_update.update = 0)
	socket.on("updatefooteradmin", async () => {
		try {
			const data = await fsp.readFile(footerPath, "utf8");
			const footerData = JSON.parse(data);

			if (footerData.display_update?.update !== undefined) {
				footerData.display_update.update = 0;
			} else {
				console.warn("⚠ display_update key not found in footer.json");
			}

			await fsp.writeFile(
				footerPath,
				JSON.stringify(footerData, null, 4),
				"utf8"
			);
			console.log("✅ footer.json display_update set to 0");
			socket.emit("updatefooterSuccessadmin", footerData);
		} catch (err) {
			console.error("❌ Error updating footer.json:", err);
			socket.emit("updatefooterError", "Failed to update footer.json");
		}
	});

	// 🆕 Handle announcements update request
	socket.on("updateAnnouncementsadmin", async (footermsg) => {
		try {
			const data = await fsp.readFile(footerPath, "utf8");
			const footerData = JSON.parse(data);

			// Update announcements
			if (!footerData.announcements_txt) footerData.announcements_txt = {};
			if (footermsg.firstann !== undefined)
				footerData.announcements_txt.firstann = footermsg.firstann;
			if (footermsg.secondann !== undefined)
				footerData.announcements_txt.secondann = footermsg.secondann;
			if (footermsg.thirdann !== undefined)
				footerData.announcements_txt.thirdann = footermsg.thirdann;

			// 🆕 Update activated states
			if (footermsg.activated) {
				if (!footerData.activated) footerData.activated = {};
				if (footermsg.activated.ann1 !== undefined)
					footerData.activated.ann1 = footermsg.activated.ann1;
				if (footermsg.activated.ann2 !== undefined)
					footerData.activated.ann2 = footermsg.activated.ann2;
				if (footermsg.activated.ann3 !== undefined)
					footerData.activated.ann3 = footermsg.activated.ann3;
			}

			// 🆕 Update ann_data configs (speed, fontsize, fontweight, color, etc.)
			if (footermsg.ann_data) {
				if (!footerData.ann_data) footerData.ann_data = {};
				Object.assign(footerData.ann_data, footermsg.ann_data);
			}

			await fsp.writeFile(
				footerPath,
				JSON.stringify(footerData, null, 4),
				"utf8"
			);

			// console.log("✅ Announcements updated:", footermsg);
			// Notify all clients about update
			io.emit("footerUpdatedadmin", footerData);
			socket.emit("updateAnnouncementsSuccess", footerData);
		} catch (err) {
			console.error("❌ Error updating announcements:", err);
			socket.emit("updateAnnouncementsError", "Failed to update announcements");
		}
	});

	// Watch for changes in footer.json and broadcast
	fs.watch(footerPath, (eventType) => {
		if (eventType === "change") {
			sendFooteradmin(io);
		}
	});

	function sendFooteradmin(target) {
		fs.readFile(footerPath, "utf8", (err, data) => {
			if (err) {
				console.error("Error reading footer.json:", err);
				return;
			}
			try {
				const config = JSON.parse(data);
				target.emit("footerUpdatedadmin", config);
			} catch (parseErr) {
				console.error("Invalid footer.json format:", parseErr);
			}
		});
	}
}

module.exports = { setupFooterWatcheradmin };
