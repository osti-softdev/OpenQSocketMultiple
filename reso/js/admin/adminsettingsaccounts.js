$(function () {
	// Custom clearer border style for Swal inputs
	const swalInputStyle = `
		<style>
			.swal2-input, .swal2-select {
				border: 2px solid #4a91e29f !important;
				border-radius: 6px !important;
				box-shadow: none !important;
				transition: border-color 0.3s, box-shadow 0.3s;
			}
			.swal2-input:focus, .swal2-select:focus {
				border-color: #007bff !important;
				box-shadow: 0 0 5px rgba(0, 123, 255, 0.6) !important;
				outline: none !important;
			}
		</style>
	`;
	$("head").append(swalInputStyle);

	socket.on("adminaccounts", (res) => {
		const accounts = res.data || [];
		$(".accsettingdata").empty();

		accounts.forEach((acc) => {
			const $accountDiv = $(`
				<span class="account-item" data-id="${acc.id}">
					<p><strong>Name:</strong> ${acc.name}</p>
					<p><strong>Role:</strong> ${acc.role}</p>
					<p><strong>Status:</strong> ${acc.status === 1 ? "Active" : "Inactive"}</p>
					<button class="accedit-btn">Edit</button>
					<button class="accdelete-btn">Delete</button>
				</span>
			`);
			$(".accsettingdata").append($accountDiv);
		});
	});

	socket.on("accountsgather", (msg) => {
		const isSuccess = msg.status === "1";
        showMsg(isSuccess ? "success" : "error", res.message);
	});

	socket.emit("getaccounts");

	// Create new account
	$(document).on("click", ".settcreateaccount", function () {
		Swal.fire({
			title: "Create Account",
			html: `
			<div style="text-align:left;">
				<label for="swal-new-name"><strong>Name:</strong></label>
				<input id="swal-new-name" class="swal2-input" placeholder="Enter full name">

				<label for="swal-new-username"><strong>Username:</strong></label>
				<input id="swal-new-username" class="swal2-input" placeholder="Enter username">

				<label for="swal-new-password"><strong>Password:</strong></label>
				<div style="display:flex; align-items:center; gap:5px;">
					<input id="swal-new-password" class="swal2-input" type="password" placeholder="Enter password" style="flex:1;">
					<button type="button" id="toggle-new-pass" class="swal2-confirm swal2-styled" style="background:#555;">🙈</button>
				</div>

				<label for="swal-new-role"><strong>Role:</strong></label>
				<select id="swal-new-role" class="swal2-input">
					<option value="superadmin">Superadmin</option>
					<option value="admin">Admin</option>
					<option value="user">User</option>
				</select>

				<div style="margin-top:10px; display:flex; align-items:center; gap:6px;">
					<label for="swal-new-status"><strong>Status:</strong></label>
					<input type="checkbox" id="swal-new-status" checked>
					<label id="swal-new-status-label"><strong>Active</strong></label>
				</div>
			</div>
		`,
			showCancelButton: true,
			confirmButtonText: "Create",
			focusConfirm: false,
			didOpen: () => {
				// Toggle password
				$("#toggle-new-pass").on("click", function () {
					const $pwd = $("#swal-new-password");
					if ($pwd.attr("type") === "password") {
						$pwd.attr("type", "text");
						$(this).text("🙉");
					} else {
						$pwd.attr("type", "password");
						$(this).text("🙈");
					}
				});

				// Update status label
				$("#swal-new-status").on("change", function () {
					$("#swal-new-status-label").text(
						$(this).is(":checked") ? "Active" : "Inactive"
					);
				});
			},
			preConfirm: () => {
				return {
					name: $("#swal-new-name").val(),
					username: $("#swal-new-username").val(),
					password: $("#swal-new-password").val(),
					role: $("#swal-new-role").val(),
					status: $("#swal-new-status").is(":checked") ? 1 : 0,
				};
			},
		}).then((result) => {
			if (result.isConfirmed) {
				socket.emit("createaccount", result.value);
			}
		});
	});

	// Edit button
	$(document).on("click", ".accedit-btn", function () {
		const id = $(this).closest(".account-item").data("id");

		socket.emit("getaccounts");
		socket.once("adminaccounts", (res) => {
			const accounts = res.data || [];
			const acc = accounts.find((a) => a.id === id);
			if (!acc) return;

			Swal.fire({
				title: "Edit Account",
				html: `
					<div style="text-align:left;">
						<label for="swal-name"><strong>Name:</strong></label>
						<input id="swal-name" class="swal2-input" value="${acc.name}">

						<label for="swal-username"><strong>Username:</strong></label>
						<input id="swal-username" class="swal2-input" value="${acc.username}">

						<label for="swal-password"><strong>Password:</strong></label>
						<div style="display:flex; align-items:center; gap:5px;">
							<input id="swal-password" class="swal2-input" type="password" value="${
								acc.password
							}" style="flex:1;">
							<button type="button" id="toggle-pass" class="swal2-confirm swal2-styled" style="background:#555;">🙈</button>
						</div>

						<label for="swal-role"><strong>Role:</strong></label>
						<select id="swal-role" class="swal2-input">
							<option value="superadmin" ${
								acc.role === "superadmin" ? "selected" : ""
							}>Superadmin</option>
							<option value="admin" ${acc.role === "admin" ? "selected" : ""}>Admin</option>
							<option value="user" ${acc.role === "user" ? "selected" : ""}>User</option>
						</select>

						<div style="margin-top:10px; display:flex; align-items:center; gap:6px;">
							<label for="swal-status"><strong>Status:</strong></label>
							<input type="checkbox" id="swal-status" ${acc.status === 1 ? "checked" : ""}>
							<label id="swal-status-label"><strong>${
								acc.status === 1 ? "Active" : "Inactive"
							}</strong></label>
						</div>
					</div>
				`,
				showCancelButton: true,
				confirmButtonText: "Save",
				focusConfirm: false,
				didOpen: () => {
					// Show/Hide password toggle
					$("#toggle-pass").on("click", function () {
						const $pwd = $("#swal-password");
						if ($pwd.attr("type") === "password") {
							$pwd.attr("type", "text");
							$(this).text("🙉");
						} else {
							$pwd.attr("type", "password");
							$(this).text("🙈");
						}
					});

					// Update label when checkbox changes
					$("#swal-status").on("change", function () {
						$("#swal-status-label").text(
							$(this).is(":checked") ? "Active" : "Inactive"
						);
					});
				},
				preConfirm: () => {
					return {
						id: acc.id,
						name: $("#swal-name").val(),
						username: $("#swal-username").val(),
						password: $("#swal-password").val(),
						role: $("#swal-role").val(),
						status: $("#swal-status").is(":checked") ? 1 : 0,
					};
				},
			}).then((result) => {
				if (result.isConfirmed) {
					socket.emit("updateaccount", result.value);
				}
			});
		});
	});

	// Delete button
	$(document).on("click", ".accdelete-btn", function () {
		const id = $(this).closest(".account-item").data("id");

		Swal.fire({
			title: "Delete Account?",
			text: "This action cannot be undone!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Yes, delete it",
			cancelButtonText: "Cancel",
		}).then((result) => {
			if (result.isConfirmed) {
				socket.emit("deleteaccount", { id });
			}
		});
	});
});
