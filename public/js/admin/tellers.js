// Tellers Module for Admin Panel

// ~ ===== TELLERS =====
function loadTellers() {
    $.get('/api/admin/tellers', function (tellers) {
        const $list = $('#tellers-list').empty();
        tellers.forEach(t => {
            const isActive = Number(t.cstatus) === 1;
            $list.append(`
                <tr>
                    <td>${t.cname}</td>
                    <td>${t.cnum}</td>
                    <td>${t.group_name || 'None'}</td>
                    <td>${t.services}</td>
                    <td><span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editTeller(${t.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTeller(${t.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}

// & EDIT TELLER
function editTeller(id) {
    $.get('/api/admin/tellers', (tellers) => {
        const t = tellers.find(x => x.id === id);
        openModal('tellers', t);
    });
}

// & ===== DELETE TELLER =====
function deleteTeller(id) {
    Swal.fire({
        title: 'Delete this teller?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `/api/admin/tellers/${id}`,
                method: 'DELETE',
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The teller has been removed.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadTellers();
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete the teller.'
                    });
                }
            });
        }
    });
}
