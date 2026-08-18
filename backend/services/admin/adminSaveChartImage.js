const fs = require("fs");
const path = require("path");

const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");
const imagePath = path.join(rootpath, "/images/charts");

// Ensure images folder exists
if (!fs.existsSync(imagePath)) {
	fs.mkdirSync(imagePath, { recursive: true });
}

function admincontentSaveChartImage(socket, io) {
	/**
	 * Listen for incoming base64 chart images from frontend
	 * Expected payload: { imageData: string, filename: string }
	 */
	socket.on("saveChartImage", ({ imageData, filename }) => {
		try {
			if (!imageData || !filename) {
				socket.emit("saveChartImageResponse", {
					success: false,
					message: "Missing imageData or filename",
				});
				return;
			}

			// Strip base64 prefix if present
			const base64Data = imageData.replace(/^data:image\/png;base64,/, "");

			const filePath = path.join(imagePath, `${filename}.png`);

			// Overwrite existing file with new one
			fs.writeFileSync(filePath, base64Data, "base64");

			// console.log(`✅ Chart image saved (replaced if existed): ${filePath}`);
			socket.emit("saveChartImageResponse", {
				success: true,
				message: `Chart saved as ${filename}.png`,
			});
		} catch (err) {
			console.error("❌ Error saving chart image:", err);
			socket.emit("saveChartImageResponse", {
				success: false,
				message: "Error saving chart image",
			});
		}
	});
}

module.exports = { admincontentSaveChartImage };
