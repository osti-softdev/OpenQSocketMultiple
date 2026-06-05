// Services Module for Admin Panel

// ~ ===== SERVICES =====
function loadServices() {
    $.get('/api/admin/services', function (services) {
        if(services.length === 16){
            $('#addServiceBtn').hide();
        }else{
            $('#addServiceBtn').show();
        }
        const $list = $('#services-list').empty();
        services.forEach(s => {
            $list.append(`
                <tr>
                    <td>${s.shortSname}</td>
                    <td>${s.sub_sname}</td>
                    <td>${s.regular}</td>
                    <td>${s.priority}</td>
                    <td>${s.sched || '-'}</td>
                    <td><span class="status-badge ${s.status ? 'status-active' : 'status-inactive'}">${s.status === 1 ? 'Active' : 'Inactive'}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-primary" onclick="editService(${s.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteService(${s.id})">Delete</button>
                    </td>
                </tr>
            `);
        });
    });
}

// & ===== SERVICE ACTIONS =====
function editService(id) {
    $.get('/api/admin/services', (services) => {
        const s = services.find(x => x.id === id);
        openModal('services', s);
    });
}

// & ===== DELETE SERVICE =====
async function deleteService(id) {
    const result = await Swal.fire({
        title: 'Delete this service?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusCancel: true
    });

    if (!result.isConfirmed) return;

    try {
        await $.ajax({
            url: `/api/admin/services/${id}`,
            method: 'DELETE'
        });

        await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'The service has been removed.',
            timer: 1500,
            showConfirmButton: false
        });

        loadServices();

    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete the service.'
        });
    }
}
