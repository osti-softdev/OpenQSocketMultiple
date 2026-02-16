$(document).ready(function () {
    
    console.log("Teller login page loaded (jQuery + HTTP version)");

    // ─── 1. Auto-fill saved counter & username (NOT password!) ────────────────
    var savedAutoFill = localStorage.getItem("tellerAutoFill");
    if (savedAutoFill) {
        try {
            var creds = JSON.parse(savedAutoFill);
            $("#counter_teller").val(creds.cnum || "");
            $("#username_teller").val(creds.cuser || "");
            console.log("Auto-filled counter and username from localStorage");
        } catch (e) {
            console.warn("Invalid autofill data → removing");
            localStorage.removeItem("tellerAutoFill");
        }
    }

    // ─── 2. Password visibility toggle ────────────────────────────────────────
    $(".toggle-password").on("click", function () {
        var $input = $("#password_teller");
        var isPassword = $input.attr("type") === "password";

        $input.attr("type", isPassword ? "text" : "password");
        $(this).text(isPassword ? "Hide" : "Show");
    });

    // ─── 3. Form submit → send login request via fetch ────────────────────────
    $("form").on("submit", function (e) {
        e.preventDefault();

        var cnum  = $("#counter_teller").val().trim();
        var cuser = $("#username_teller").val().trim();
        var cpass = $("#password_teller").val().trim();

        if (!cnum || !cuser || !cpass) {
            alert("Please enter Counter, Username and Password");
            return;
        }

        // Save only safe fields for next time (NO PASSWORD stored!)
        localStorage.setItem("tellerAutoFill", JSON.stringify({ 
            cnum: cnum, 
            cuser: cuser 
        }));

        var loginData = {
            cnum: cnum,
            cuser: cuser,
            cpass: cpass
        };

        // Show loading state (optional - you can add a spinner)
        // $("button[type=submit]").prop("disabled", true).text("Logging in...");

        $.ajax({
            url: "/api/trialAttempLogin",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(loginData),
            xhrFields: {
                withCredentials: true          // Important: sends & receives cookies
            },
            success: function (response) {
                if (response.success) {
                    // Save sanitized user data (no password)
                    localStorage.setItem("authUser", JSON.stringify(response.user));

                    console.log("Login successful → redirecting");
                    window.location.href = "/312XtellerWindow";
                } else {
                    alert(response.error || "Login failed. Please check your credentials.");
                    // Optional: clear autofill after several failed attempts
                    // localStorage.removeItem("tellerAutoFill");
                }
            },
            error: function (xhr, status, error) {
                console.error("Login request failed:", status, error);
                
                if (xhr.status === 0) {
                    alert("Cannot connect to server. Check your internet connection.");
                } else if (xhr.status === 401 || xhr.status === 400) {
                    alert("Invalid credentials. Please try again.");
                } else {
                    alert("Server error occurred. Please try again later.");
                }
            },
            complete: function () {
                // Re-enable button if you disabled it
                // $("button[type=submit]").prop("disabled", false).text("Login");
            }
        });
    });

    // ─── 4. Logout button (place this in dashboard or shared script) ──────────
    $("#logoutBtn").on("click", function () {
        $.ajax({
            url: "/api/logout",
            type: "POST",
            xhrFields: {
                withCredentials: true
            },
            success: function (response) {
                if (response.success) {
                    console.log("Logout successful");
                    localStorage.removeItem("authUser");
                    localStorage.removeItem("tellerAutoFill"); // optional
                    window.location.href = "/312Xtellerlogin";
                } else {
                    alert("Logout failed. Please try again.");
                }
            },
            error: function () {
                alert("Cannot logout right now. Please check your connection.");
            }
        });
    });

    // ─── Optional: Check if already logged in (on page load) ──────────────────
    function checkLoginStatus() {
        $.ajax({
            url: "/api/check-login",
            type: "GET",
            xhrFields: {
                withCredentials: true
            },
            success: function (response) {
                if (response.success) {
                    // User is already logged in
                    if (window.location.pathname.includes("tellerlogin")) {
                        // On login page but logged in → redirect to dashboard
                        window.location.href = "/312XtellerWindow";
                    }
                    // You can also update UI with response.user if needed
                }
            },
            error: function () {
                // Silent fail - normal if not logged in
            }
        });
    }

    // Run check on page load
    checkLoginStatus();

});