const { execFile } = require("child_process");

let argumentprevious = "";
const rootpath = global.ROOT_PATH;

function executephp(
    ticket,
    count,
    shortSname,
    subsname,
    sub_service = ""
) {
    const args = [
        `${ticket}`,
        `${count}`,
        `${shortSname || ""}`,
        `${subsname || ""}`,
        `${sub_service || ""}`
    ];

    const argument = JSON.stringify(args);

    if (argument !== argumentprevious) {
        execFile(
            "php",
            [
                `${rootpath}/public/printer/print.php`,
                ...args
            ],
            (error, stdout, stderr) => {
                argumentprevious = argument;

                if (error) {
                    console.error("PHP Error:", error);
                    return;
                }

                if (stderr) {
                    console.error("PHP STDERR:", stderr);
                }

                if (stdout) {
                    console.log("PHP STDOUT:", stdout);
                }
            }
        );
    } else {
        console.log("Duplicate argument detected, skipping PHP execution.");
    }
}

module.exports = { executephp };