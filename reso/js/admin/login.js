$(document).ready(function () {
	console.log("login.js: Document ready, initializing Socket.IO");
	const socket = io();

	$(".toggle-password").on("click", function () {
		const passwordInput = $("#password");
		const isPassword = passwordInput.attr("type") === "password";
		passwordInput.attr("type", isPassword ? "text" : "password");
		$(this).text(isPassword ? "Hide" : "Show");
	});

	$("form").on("submit", function (e) {
		e.preventDefault();
		const username = $("#username").val().trim();
		const password = $("#password").val().trim();

		if (!username || !password) {
			alert("Please enter both username and password");
			return;
		}

		socket.emit("loginAttempt", { username, password });
	});

	socket.on("loginSuccess", ({ token, user }) => {
		console.log("login.js: Login success, setting cookie");

		// Call backend to set cookie
		fetch("/setAuthCookie", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token }),
		}).then(() => {
			// Save user info locally for dashboard.js
			localStorage.setItem("authUser", JSON.stringify(user));

			// Now cookie is set, redirect works
			window.location.href = "/312xdashboard";
		});
	});
	socket.on("loginFailed", (err) => {
		alert(err.message || "Login failed");
	});

	var granimInstance = new Granim({
		element: "#canvas-bg",
		direction: "top-bottom",
		isPausedWhenNotInView: false,
		states: {
			"default-state": {
				gradients: [
					["#ff9966", "#ff5e62"],
					["#00F260", "#0575E6"],
					["#052783", "#041b31"], // fixed hex
					["#f7971e", "#ffd200"],
					["#6a11cb", "#2575fc"],
					["#e55d87", "#5fc3e4"],
					["#c94b4b", "#4b134f"],
				],
				loop: true,
				transitionSpeed: 6000,
			},
		},
	});
});
