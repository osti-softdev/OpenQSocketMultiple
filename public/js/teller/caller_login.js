$(document).ready(function () {
    $.ajax({
        url: '/api/check-session',
        method: 'GET',
        success: function (response) {
            if (response.loggedIn) {
                setAuthUser(response.teller);
                window.location.href = '/caller';
            }
        }
    });

    $('#login-form').submit(function (e) {
        e.preventDefault();
        $('#login-error').hide().text('');

        const username = $('#username').val();
        const password = $('#password').val();

        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password }),
            success: function (response) {
                if (response.success) {
                    setAuthUser(response.teller);
                    window.location.href = '/caller';
                    return;
                }

                $('#login-error').text(response.message || 'Login failed').show();
            },
            error: function (xhr) {
                const error = xhr.responseJSON ? xhr.responseJSON.message : 'Login failed';
                $('#login-error').text(error).show();
            }
        });
    });

    function setAuthUser(teller) {
        localStorage.setItem('authUser', JSON.stringify({
            id: teller.id,
            cname: teller.username,
            cnum: teller.counter_number
        }));
    }
});
