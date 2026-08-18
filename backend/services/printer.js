const { exec } = require("child_process");
const path = require("path");

let argumentprevious = "";
const rootpath =
	global.outfolderPath || path.join(__dirname, "../../outfolder");

function executephp(
	ticket,
	count,
	service_name,
) {
	const argument = `${ticket},${count},${service_name}`;

	if (argument !== argumentprevious) {
		exec(
			`php ${rootpath}/printer/print.php ${argument}`,
			(error, stdout, stderr) => {
				argumentprevious = argument;

				if (error) {
					console.error(`exec error: ${error}`);
					return;
				}
			}
		);
	} else {
		console.log("Duplicate argument detected, skipping PHP execution.");
	}
}

module.exports = { executephp };
