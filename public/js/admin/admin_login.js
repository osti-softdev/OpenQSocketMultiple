let currentAdmin = null;

$(document).ready(function () {
    checkSession();

    // Login form handler
    $('#login-form').submit(function (e) {
        e.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        $.ajax({
            url: '/api/loginAdmin',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password }),
            success: function (response) {
                 if (response.success) {
                    currentAdmin = response.admin;
                    window.location.href = '/admin/dashboard';
                } else {
                    $('#login-error').text(response.message);
                }
            },
            error: function (xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.message : 'Login failed';
                $('#login-error').text(error).show();
            }
        });
    });

    function checkSession() {
    $.ajax({
        url: '/api/check-session-admin',
        method: 'GET',
        success: function (response) {
            if (response.loggedIn) {
                currentAdmin = response.admin;
                window.location.href = '/admin/dashboard';
            } else {    
                // Not logged in, stay on login page
            }
        }
    });
}
});