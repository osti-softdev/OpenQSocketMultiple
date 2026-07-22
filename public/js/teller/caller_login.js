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

    let countdownInterval = null;

    function handleLoginError(xhr, responseData) {
        const data = responseData || (xhr ? xhr.responseJSON : null) || {};
        const retryAfter = data.retryAfter || (data.resetTime ? Math.ceil((data.resetTime - Date.now()) / 1000) : 0);

        if ((xhr && xhr.status === 429) || retryAfter > 0) {
            let secondsLeft = retryAfter > 0 ? retryAfter : 60;
            
            if (countdownInterval) clearInterval(countdownInterval);
            
            const $submitBtn = $('#login-form button[type="submit"]');
            $submitBtn.prop('disabled', true);

            function updateCountdown() {
                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    $submitBtn.prop('disabled', false);
                    $('#login-error').text('You may now try logging in again.').css('color', '#10b981').show();
                    return;
                }

                const mins = Math.floor(secondsLeft / 60);
                const secs = secondsLeft % 60;
                const timeFormatted = mins > 0 
                    ? `${mins}m ${secs < 10 ? '0' : ''}${secs}s`
                    : `${secs}s`;

                $('#login-error').html(`⚠️ Too many login attempts.<br>Login locked. Retry available in: <strong style="font-size: 1.1em;">${timeFormatted}</strong>`).css('color', '#dc2626').show();
                secondsLeft--;
            }

            updateCountdown();
            countdownInterval = setInterval(updateCountdown, 1000);
        } else {
            const message = data.message || data.error || 'Invalid username or password';
            const remaining = data.remainingAttempts !== undefined ? data.remainingAttempts : (xhr?.responseJSON?.remainingAttempts);
            
            if (remaining !== undefined && remaining !== null) {
                const attemptText = remaining === 1 ? '1 attempt remaining' : `${remaining} attempts remaining`;
                $('#login-error').html(`${message}<br><small style="opacity: 0.85;">(${attemptText})</small>`).css('color', '#dc2626').show();
            } else {
                $('#login-error').text(message).css('color', '#dc2626').show();
            }
        }
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
