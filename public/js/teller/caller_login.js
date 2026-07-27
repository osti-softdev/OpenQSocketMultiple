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

    function handleLoginError(xhr, responseData) {
        const data = responseData || (xhr ? xhr.responseJSON : null) || {};
        const message = data.message || data.error || 'Invalid username or password';
        $('#login-error').text(message).css('color', '#dc2626').show();
    }

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

                handleLoginError(null, response);
            },
            error: function (xhr) {
                handleLoginError(xhr);
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
