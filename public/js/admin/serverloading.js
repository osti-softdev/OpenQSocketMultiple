function showServerLoading(text = "Connecting to server…") {
    Swal.fire({
        title: text,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

function hideServerLoading() {
    if (Swal.isVisible()) Swal.close();
}

$(document).ready(function () {
    // Show loading when disconnected
    socket.on("disconnect", () => {
        showServerLoading("Reconnecting to server…");
    });

    // Hide loading when connected
    socket.on("connect", () => {
        hideServerLoading();
        window.location.reload();
    });
});