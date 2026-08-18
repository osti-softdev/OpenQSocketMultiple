function getPHDateTime() {
	const now = new Date();

	// Use Asia/Manila time
	const options = { timeZone: "Asia/Manila" };
	const year = now.toLocaleString("en-US", { ...options, year: "numeric" });
	const month = now.toLocaleString("en-US", { ...options, month: "2-digit" });
	const day = now.toLocaleString("en-US", { ...options, day: "2-digit" });

	// YYYY-MM-DD
	const date = `${year}-${month}-${day}`;

	// HH:mm:ss (24h)
	const time = now.toLocaleString("en-US", {
		...options,
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});

	return { date, time };
}

module.exports = { getPHDateTime };
