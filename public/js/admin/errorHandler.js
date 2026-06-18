// XHRHANDLING 
function showAjaxError(xhr) {
    let title = 'Error';

    switch (xhr.status) {
        case 401:
            title = 'Unauthorized';
            break;

        case 403:
            title = 'Access Denied';
            break;

        case 404:
            title = 'Not Found';
            break;

        case 500:
            title = 'Database Error';
            break;

        default:
            title = 'Error';
    }

    Swal.fire({
        icon: 'error',
        title,
        text: xhr.responseJSON?.error || 'Operation failed.'
    });
}