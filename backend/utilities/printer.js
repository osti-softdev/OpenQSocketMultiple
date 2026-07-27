const { exec } = require("child_process");
const path = require("path");

let argumentprevious = "";
const rootpath =
	global.ROOT_PATH;

function executephp(
	ticket,
	count,
	service_name,
	sub_service = ""
) {
	const argument = `${ticket},${count},${service_name},${sub_service || ''}`;

	if (argument !== argumentprevious) {
		exec(
			`php ${rootpath}/public/printer/print.php ${argument}`,
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
