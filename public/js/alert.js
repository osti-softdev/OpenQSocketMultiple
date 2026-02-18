// Helper to show auto-close messages
function showMsg(type, message) {
    Swal.fire({
        icon: type, // 'success' | 'error' | 'warning' | 'info'
        title: message,
        theme: 'auto',
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        toast: true,
        position: "top",
        // didOpen: (toast) => {
        //     toast.onmouseenter = Swal.stopTimer;
        //     toast.onmouseleave = Swal.resumeTimer;
        // }
    });
}
function showMsgForwarded(type, message) {
    Swal.fire({
        icon: type, // 'success' | 'error' | 'warning' | 'info'
        title: message,
        theme: 'auto',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        toast: true,
        position: "top",
        // didOpen: (toast) => {
        //     toast.onmouseenter = Swal.stopTimer;
        //     toast.onmouseleave = Swal.resumeTimer;
        // }
    });
}