const { getAllServices } = require("./db");

async function handleGetAllServices(socket) {
	try {
		const services = await getAllServices();
		socket.emit("servicesUpdate", services);
		// console.log("✅ Services fetched successfully");
	} catch (err) {
		console.error("❌ Error fetching services:", err);
		socket.emit("servicesUpdate", []);
	}
}

module.exports = { handleGetAllServices };
