// 🚀 Initial Requests
socket.emit("gettellers");
socket.emit("getgroupslist");

// =====================================================
// 🎯 Event Delegation for Teller List
// =====================================================
const tellerContainer = document.getElementById("setttellerdata");

tellerContainer.addEventListener("click", async (e) => {
    const btn = e.target;
    const tellerId = btn.dataset.id;
    if (!tellerId) return;

    const teller = currentTellers.find(t => t.id == tellerId);
    if (!teller) return;

    // 🧠 Edit Teller
    if (btn.classList.contains("edit-btn")) {
        await openEditTellerPopup(teller);
    }

    // 🗑️ Delete Teller
    if (btn.classList.contains("delete-btn")) {
        const result = await Swal.fire({
            title: "Delete Teller?",
            text: `Are you sure you want to delete "${teller.cname}"?`,
            icon: "warning",
            theme: 'auto',
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it",
        });
        if (result.isConfirmed) socket.emit("deleteTeller", { id: teller.id });
    }
});

// ➕ Add Teller Button (attach once)
document.querySelector(".addTellerbtn").addEventListener("click", openAddTellerPopup);

// ➕ Edit Teller Group Button (attach once)
document.querySelector(".EdittellerGroup").addEventListener("click", async () => {
    socket.emit("getgroupslist");
    const res = await new Promise((resolve) => socket.once("groupsList", resolve));
    if (res.status !== "1") return Swal.fire("Error", "No groups found.", "error");
    renderGroupPopup(res.data);
});

// =====================================================
// 🔄 Current tellers cache
// =====================================================
let currentTellers = [];

// =====================================================
// 🔄 Render Tellers List
// =====================================================
socket.on("tellersList", (res) => {
    currentTellers = res.data || [];
    if (!currentTellers.length) {
        tellerContainer.innerHTML = "<p>No counters found.</p>";
        return;
    }

    tellerContainer.innerHTML = currentTellers.map(teller => `
        <div class="teller-card">
            <p><strong>Name:</strong> ${teller.cname}</p>
            <p><button class="edit-btn" data-id="${teller.id}">Edit</button></p>
            <p><button class="delete-btn" data-id="${teller.id}">Delete</button></p>
        </div>
    `).join("");
});

// =====================================================
// 🧩 Groups Popup (delegation inside popup)
// =====================================================
function renderGroupPopup(groups) {
    const groupListHTML = groups.map(g => `
        <div class="group-item" data-id="${g.id}" style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;">
            <span>${g.group_name}</span>
            <div style="display:flex;gap:6px;">
                <button class="edit-btn" data-name="${g.group_name}" style="background:#007bff;color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;">Edit</button>
                <button class="del-btn" style="background:#dc3545;color:#fff;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;">Delete</button>
            </div>
        </div>
    `).join("") || "<p style='color:#777'>No groups yet.</p>";

    Swal.fire({
        title: "🧩 Manage Groups",
        width: 600,
        theme: 'auto',
        showCancelButton: false,
        showConfirmButton: false,
        html: `
            <div style="text-align:left">
                <label><strong>Add New Group</strong></label>
                <div style="display:flex;gap:6px;margin-bottom:10px;">
                    <input id="new_group_input" class="swal2-input" placeholder="Enter group name" style="flex:1;">
                    <button id="save_group_btn" class="swal2-confirm swal2-styled" style="width:auto;">Save</button>
                </div>
                <hr>
                <div id="group_list_container" style="max-height:250px;overflow-y:auto;padding-right:5px;">
                    ${groupListHTML}
                </div>
                <hr>
                <div style="text-align:right;">
                    <button id="close_popup" class="swal2-cancel swal2-styled" style="background:#6c757d;">Close</button>
                </div>
            </div>`,
        didOpen: () => {
            const popup = Swal.getPopup();
            if (!popup) return;

            const saveBtn = popup.querySelector("#save_group_btn");
            const closeBtn = popup.querySelector("#close_popup");
            const container = popup.querySelector("#group_list_container");

            // Add new group
            saveBtn.addEventListener("click", () => {
                const val = popup.querySelector("#new_group_input")?.value.trim();
                if (!val) return Swal.showValidationMessage("Group name is required");
                socket.emit("addGroup", val);
            });

            // Close popup
            closeBtn.addEventListener("click", () => Swal.close());

            // Delegate edit/delete inside popup
            container.addEventListener("click", (e) => {
                const groupItem = e.target.closest(".group-item");
                if (!groupItem) return;
                const id = groupItem.dataset.id;

                if (e.target.classList.contains("edit-btn")) {
                    const oldName = e.target.dataset.name;
                    Swal.fire({
                        title: "Edit Group",
                        input: "text",
                        theme: 'auto',
                        inputValue: oldName,
                        showCancelButton: true,
                        confirmButtonText: "Save",
                        preConfirm: (value) => {
                            if (!value.trim()) return Swal.showValidationMessage("Name required");
                            socket.emit("updateGroup", { id, group_name: value.trim() });
                        },
                    });
                }

                if (e.target.classList.contains("del-btn")) {
                    Swal.fire({
                        title: "Delete Group?",
                        text: "This action cannot be undone.",
                        icon: "warning",
                        theme: 'auto',
                        showCancelButton: true,
                        confirmButtonText: "Delete",
                        confirmButtonColor: "#d33",
                        preConfirm: () => socket.emit("deleteGroup", id),
                    });
                }
            });
        },
    });
}

// =====================================================
// 🔄 Socket Listeners for Groups
// =====================================================
["groupAddResult","groupUpdateResult","groupDeleteResult"].forEach(event => {
    socket.on(event, async (res) => {
        if (res.status === "1") {
            socket.emit("getgroupslist");
            const refreshed = await new Promise(resolve => socket.once("groupsList", resolve));
            renderGroupPopup(refreshed.data);
            showMsg("success", res.message);
        } else {
            showMsg("error", res.message);
        }
    });
});

// =====================================================
// 🔄 Socket Listeners for Tellers
// =====================================================
["tellerAddResult","tellerUpdateResult","tellerDeleteResult"].forEach(event => {
    socket.on(event, (res) => {
        showMsg(res.status === "1" ? "success" : "error", res.message);
        if (res.status === "1") socket.emit("gettellers");
    });
});

// =====================================================
// 🧠 Helper functions for Teller Popups
// =====================================================
async function openAddTellerPopup() {
    socket.emit("getserviceslist");
    socket.emit("getgroupslist");

    const [serviceRes, groupRes] = await Promise.all([
        new Promise(resolve => socket.once("servicesList", resolve)),
        new Promise(resolve => socket.once("groupsList", resolve))
    ]);

    if (serviceRes.status !== "1" || groupRes.status !== "1") {
        return Swal.fire("Error", "Failed to load services or groups.", "error");
    }

    const services = serviceRes.data.map(s => s.sname);
    const groups = groupRes.data.map(g => g.group_name);

    const checkboxHTML = services.map(s => `
        <label style="flex:1 20%;display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <input type="checkbox" name="services" value="${s}">
            <span>${s}</span>
        </label>`).join("");

    const groupHTML = groups.map(g => `
        <label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <input type="radio" name="group_name" value="${g}">
            <span>${g}</span>
        </label>`).join("");

    const { value: formValues } = await Swal.fire({
        title: "➕ Add New Teller",
        width: 600,
        html: `
        <div style="text-align:left">
            <label><strong>Name</strong></label>
            <input id="new_cname" class="swal2-input" placeholder="Name">
            <br>
            <label><strong>Counter Number</strong></label>
            <input id="new_cnum" class="swal2-input" placeholder="Counter Number">
            <br>
            <label><strong>Username</strong></label>
            <input id="new_cuser" class="swal2-input" placeholder="Username">
            <br>
            <label><strong>Password</strong></label>
            <input id="new_cpass" class="swal2-input" placeholder="Password">
            <br>
            <label><strong>Status</strong></label>
            <select id="new_cstatus" class="swal2-select" style="width:50%;padding:8px;border-radius:5px;border:1px solid #ccc;">
                <option value="1" selected>Active</option>
                <option value="0">Inactive</option>
            </select>
            <br>
            <label><strong>Group</strong></label>
            <div style="border:1px solid #ddd;border-radius:5px;padding:8px;background:#fafafa;">
                ${groupHTML}
            </div>
            <label><strong>Services</strong></label>
            <div style="max-height:160px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:10px;border:1px solid #ddd;border-radius:5px;background:#fafafa;">
                ${checkboxHTML}
            </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: "✅ Add Teller",
        preConfirm: () => {
            const cname = document.getElementById("new_cname").value.trim();
            const cnum = document.getElementById("new_cnum").value.trim();
            const cuser = document.getElementById("new_cuser").value.trim();
            const cpass = document.getElementById("new_cpass").value.trim();
            const cstatus = document.getElementById("new_cstatus").value;
            const group_name = document.querySelector('input[name="group_name"]:checked')?.value || "";
            const services = Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);

            if (!cname || !cuser || !cpass || !group_name) {
                Swal.showValidationMessage("⚠️ Name, Username, Password, and Group are required");
                return false;
            }

            return { cname, cnum, cuser, cpass, cstatus, services, group_name };
        },
    });

    if (formValues) socket.emit("addTeller", formValues);
}

async function openEditTellerPopup(teller) {
    socket.emit("getserviceslist");
    socket.emit("getgroupslist");

    const [serviceRes, groupRes] = await Promise.all([
        new Promise(resolve => socket.once("servicesList", resolve)),
        new Promise(resolve => socket.once("groupsList", resolve))
    ]);

    if (serviceRes.status !== "1" || groupRes.status !== "1") {
        return Swal.fire("Error", "Failed to load services or groups.", "error");
    }

    const services = serviceRes.data.map(s => s.sname);
    const groups = groupRes.data.map(g => g.group_name);
    const selectedServices = (teller.services || "").split(",").map(s => s.trim());

    const checkboxHTML = services.map(s => `
        <label style="flex:1 20%;display:flex;align-items:center;gap:6px;margin-bottom:5px;">
            <input type="checkbox" name="services" value="${s}" ${selectedServices.includes(s) ? "checked" : ""}>
            <span>${s}</span>
        </label>`).join("");

    const groupHTML = groups.map(g => `
        <label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <input type="radio" name="group_name" value="${g}" ${teller.group_name === g ? "checked" : ""}>
            <span>${g}</span>
        </label>`).join("");

    const { value: formValues } = await Swal.fire({
        title: `Edit Teller`,
        width: 600,
        html: `
        <div style="text-align:left">
            <label><strong>Name</strong></label>
            <input id="edit_cname" class="swal2-input" value="${teller.cname}">
            <br>
            <label><strong>Counter Number</strong></label>
            <input id="edit_cnum" class="swal2-input" value="${teller.cnum}">
            <br>
            <label><strong>Username</strong></label>
            <input id="edit_cuser" class="swal2-input" value="${teller.cuser}">
            <br>
            <label><strong>Password</strong></label>
            <input id="edit_cpass" class="swal2-input" value="${teller.cpass}">
            <br>
            <label><strong>Status</strong></label>
            <select id="edit_cstatus" class="swal2-select" style="width:50%;padding:8px;border-radius:5px;border:1px solid #ccc;">
                <option value="1" ${teller.cstatus == "1" ? "selected" : ""}>Active</option>
                <option value="0" ${teller.cstatus == "0" ? "selected" : ""}>Inactive</option>
            </select>
            <br>
            <label><strong>Group</strong></label>
            <div style="max-height:160px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:10px;border:1px solid #ddd;border-radius:5px;background:#fafafa;>
                ${groupHTML}
            </div>
            <br>
            <label><strong>Services</strong></label>
            <div style="max-height:160px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:10px;border:1px solid #ddd;border-radius:5px;background:#fafafa;">
                ${checkboxHTML}
            </div>
        </div>`,
        showCancelButton: true,
        confirmButtonText: "💾 Save Changes",
        preConfirm: () => {
            const cname = document.getElementById("edit_cname").value.trim();
            const cnum = document.getElementById("edit_cnum").value.trim();
            const cuser = document.getElementById("edit_cuser").value.trim();
            const cpass = document.getElementById("edit_cpass").value.trim();
            const cstatus = document.getElementById("edit_cstatus").value;
            const group_name = document.querySelector('input[name="group_name"]:checked')?.value || "";
            const services = Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);

            if (!cname || !cuser || !group_name) {
                Swal.showValidationMessage("⚠️ Name, Username, and Group are required");
                return false;
            }

            return { id: teller.id, cname, cnum, cuser, cpass, cstatus, services, group_name };
        },
    });

    if (formValues) socket.emit("updateTeller", formValues);
}

// Helper to show auto-close messages
function showMsg(type, message) {
    Swal.fire({
        icon: type, // 'success' | 'error' | 'warning' | 'info'
        title: message,
        showConfirmButton: false,
        timer: 1500,
        toast: true,
        position: "top",
    });
}
