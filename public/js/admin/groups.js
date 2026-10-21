// Groups Module for Admin Panel

// ~ ===== GROUPS =====
function loadGroups() {
    $.get('/api/admin/groups', function (groups) {
        const $list = $('#groups-list').empty();
        groups.forEach(g => {
            $list.append(`
                <tr>
                    <td>${g.id || '-'}</td>
                    <td><strong>${g.group_name}</strong></td>
                    <td>${g.active_tellers || 0}</td>
                    <td><span class="badge badge-info">${g.received || 0}</span></td>
                    <td><span class="badge badge-primary">${g.served || 0}</span></td>
                    <td><span class="badge badge-warning">${g.forwarded || 0}</span></td>
                    <td><span class="badge badge-success">${g.completed || 0}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-danger" onclick="deleteGroup(${g.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}

// & ===== DELETE GROUP =====
function deleteGroup(id) {
    Swal.fire({
        title: 'Delete this group?',
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
                url: `/api/admin/groups/${id}`,
                method: 'DELETE',
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The group has been removed.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadGroups();
                },
                error: showAjaxError
            });
        }
    });
}
