const { execFile } = require("child_process");
const path = require("path");

let argumentprevious = "";
const rootpath =
	global.ROOT_PATH;

function executephp(
	ticket,
	count,
	service_name,
) {
	const argument = `${ticket},${count},${service_name}`;

	return new Promise((resolve, reject) => {
		if (argument === argumentprevious) {
			console.log("Duplicate argument detected, skipping PHP execution.");
			resolve({ skipped: true });
			return;
		}

		const printScript = path.join(rootpath, "public", "printer", "print.php");

		execFile("php", [printScript, argument], (error, stdout, stderr) => {
			if (error) {
				reject(new Error(stderr || error.message));
				return;
			}

			argumentprevious = argument;
			resolve({ stdout, stderr });
		});
	});
}

module.exports = { executephp };
