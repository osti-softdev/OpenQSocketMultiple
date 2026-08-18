$(document).ready(function () {
    console.log("login.js: Document ready, initializing Socket.IO");
    const socket = io();

    // 🔹 Auto-login if creds exist
    const savedCreds = JSON.parse(localStorage.getItem("tellerCreds"));
    if (savedCreds) {
        console.log("Found saved teller credentials, trying auto-login...");
        socket.emit("tellerloginAttempt", savedCreds);
    }

    // 🔹 Toggle password visibility
    $(".toggle-password").on("click", function () {
        const passwordInput = $("#password_teller");
        const isPassword = passwordInput.attr("type") === "password";
        passwordInput.attr("type", isPassword ? "text" : "password");
        $(this).text(isPassword ? "Hide" : "Show");
    });

    // 🔹 Handle form submit (manual login)
    $("form").on("submit", function (e) {
        e.preventDefault();
        const cnum = $("#counter_teller").val().trim();
        const cuser = $("#username_teller").val().trim();
        const cpass = $("#password_teller").val().trim();

        if (!cnum || !cuser || !cpass) {
            alert("Please enter Counter, Username and Password");
            return;
        }

        // Save plaintext creds to localStorage
        localStorage.setItem("tellerCreds", JSON.stringify({ cnum, cuser, cpass }));

        // Emit login
        socket.emit("tellerloginAttempt", { cnum, cuser, cpass });
    });

    // 🔹 On login success
    socket.on("tellerloginSuccess", ({ user }) => {
        
        // Save user info separately (no password!)
        localStorage.setItem("authUser", JSON.stringify(user));

        // Redirect to dashboard
        window.location.href = "/312XtellerWindow";
    });

    // 🔹 On login failed
    socket.on("loginFailedteller", (err) => {
        alert(err.message || "Login failed");
        localStorage.removeItem("tellerCreds"); // clear invalid creds
    });

    // 🔹 Logout handler
    $("#logoutBtn").on("click", function () {
        socket.emit("tellerlogout");
    });

    // 🔹 On logout success
    socket.on("tellerlogoutSuccess", () => {
        console.log("Logged out successfully");

        // Clear storage
        localStorage.removeItem("tellerCreds");
        localStorage.removeItem("authUser");

        // Redirect back to login page
        window.location.href = "/312Xtellerlogin";
    });
});
