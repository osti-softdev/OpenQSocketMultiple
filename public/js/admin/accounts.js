// Accounts Module for Admin Panel

// ~ ===== ACCOUNTS =====
function loadAccounts() {
    $.get('/api/admin/accounts', function (accounts) {
        console.log(accounts);
        const $list = $('#accounts-list').empty();
        accounts.forEach(t => {
            const isActive = Number(t.status) === 1;
            $list.append(`
                <tr>
                    <td>${t.name}</td>
                    <td>${t.username}</td>
                    <td>${t.role || 'None'}</td>
                    <td><span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editAccount(${t.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAccount(${t.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}

// & EDIT ACCOUNT
function editAccount(id) {
    $.get('/api/admin/accounts', (accounts) => {
        const t = accounts.find(x => x.id === id);
        openModal('accounts', t);
    });
}

// & ===== DELETE ACCOUNT =====
function deleteAccount(id) {
    Swal.fire({
        title: 'Delete this account?',
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
                url: `/api/admin/accounts/${id}`,
                method: 'DELETE',
                success: function () {
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'The account has been removed.',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    loadAccounts();
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete the account.'
                    });
                }
            });
        }
    });
}
