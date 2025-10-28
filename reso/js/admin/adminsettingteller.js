// 🚀 Request counters and groups from backend
socket.emit("gettellers");
socket.emit("getgroupslist");

// 🎯 Handle teller list display
socket.on("tellersList", (res) => {
	const container = document.getElementById("setttellerdata");
	container.innerHTML = "";

	if (res.status === "1" && res.data.length > 0) {
		res.data.forEach((teller) => {
			const card = document.createElement("div");
			card.className = "teller-card";
			card.innerHTML = `
				<p><strong>Name:</strong> ${teller.cname}</p>
				<p><button class="edit-btn" data-id="${teller.id}">Edit</button></p>
				<p><button class="delete-btn" data-id="${teller.id}">Delete</button></p>
			`;
			container.appendChild(card);
		});

		/* =====================================================
		   🧠 Handle Edit Teller
		===================================================== */
		document.querySelectorAll(".edit-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const tellerId = e.target.dataset.id;
				const teller = res.data.find((t) => t.id == tellerId);

				// Request both services and groups in parallel
				socket.emit("getserviceslist");
				socket.emit("getgroupslist");

				const [serviceRes, groupRes] = await Promise.all([
					new Promise((resolve) => socket.once("servicesList", resolve)),
					new Promise((resolve) => socket.once("groupsList", resolve)),
				]);

				if (serviceRes.status !== "1" || groupRes.status !== "1") {
					Swal.fire("Error", "Failed to load services or groups.", "error");
					return;
				}

				const services = serviceRes.data.map((s) => s.sname);
				const groups = groupRes.data.map((g) => g.group_name);

				const selectedServices = (teller.services || "")
					.split(",")
					.map((s) => s.trim());

				// ✅ Build checkboxes for services
				const checkboxHTML = services
					.map(
						(s) => `
						<label class="service-checkbox" style="flex:1 20%;display:flex;align-items:center;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;gap:6px;margin-bottom:5px;">
							<input type="checkbox" name="services" value="${s}" 
								${selectedServices.includes(s) ? "checked" : ""}>
							<span>${s}</span>
						</label>
					`
					)
					.join("");

				// ✅ Build radio buttons for group selection
				const groupHTML = groups
					.map(
						(g) => `
						<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
							<input type="radio" name="group_name" value="${g}" ${teller.group_name === g ? "checked" : ""}>
							<span>${g}</span>
						</label>
					`
					)
					.join("");

				// ✨ SweetAlert Edit Form
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
							<label style="margin-top:10px;"><strong>Group</strong></label>
							<div style="
								border:1px solid #ddd;
								border-radius:5px;
								padding:8px;
								margin-bottom:10px;
								background:#fafafa;
							">
								${groupHTML}
							</div>
							<label style="margin-top:10px;"><strong>Services</strong></label>
							<div style="
								max-height:160px;
								overflow-y:auto;
								display:flex;
								flex-wrap:wrap;
								gap:10px;
								width:100%;
								border:1px solid #ddd;
								border-radius:5px;
								margin-top:5px;
								background:#fafafa;
							">
								${checkboxHTML}
							</div>
						</div>
					`,
					focusConfirm: false,
					showCancelButton: true,
					confirmButtonText: "💾 Save Changes",
					preConfirm: () => {
						const cname = document.getElementById("edit_cname").value.trim();
						const cuser = document.getElementById("edit_cuser").value.trim();
						const cnum = document.getElementById("edit_cnum").value.trim();
						const cpass = document.getElementById("edit_cpass").value.trim();
						let cstatus = document.getElementById("edit_cstatus").value;
						const group_name = document.querySelector('input[name="group_name"]:checked')?.value || "";
						const services = Array.from(
							document.querySelectorAll('input[name="services"]:checked')
						).map((cb) => cb.value);

						if (!cname || !cuser || !group_name) {
							Swal.showValidationMessage("⚠️ Name, Username, and Group are required");
							return false;
						}

						return { cname, cuser, cnum, cpass, cstatus, services, group_name };
					},
				});

				if (formValues) socket.emit("updateTeller", { id: teller.id, ...formValues });
			});
		});

		/* =====================================================
		   🗑️ Handle Delete Teller
		===================================================== */
		document.querySelectorAll(".delete-btn").forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				const tellerId = e.target.dataset.id;
				const teller = res.data.find((t) => t.id == tellerId);

				const result = await Swal.fire({
					title: "Delete Teller?",
					text: `Are you sure you want to delete "${teller.cname}"?`,
					icon: "warning",
					showCancelButton: true,
					confirmButtonColor: "#d33",
					cancelButtonColor: "#3085d6",
					confirmButtonText: "Yes, delete it",
				});

				if (result.isConfirmed) socket.emit("deleteTeller", { id: teller.id });
			});
		});

		/* =====================================================
		   ➕ Add Teller Button
		===================================================== */
		document.querySelector(".addTellerbtn").addEventListener("click", async () => {
			socket.emit("getserviceslist");
			socket.emit("getgroupslist");

			const [serviceRes, groupRes] = await Promise.all([
				new Promise((resolve) => socket.once("servicesList", resolve)),
				new Promise((resolve) => socket.once("groupsList", resolve)),
			]);

			if (serviceRes.status !== "1" || groupRes.status !== "1") {
				Swal.fire("Error", "Failed to load services or groups.", "error");
				return;
			}

			const services = serviceRes.data.map((s) => s.sname);
			const groups = groupRes.data.map((g) => g.group_name);

			const checkboxHTML = services
				.map(
					(s) => `
					<label class="service-checkbox" style="flex:1 20%;display:flex;align-items:center;gap:6px;margin-bottom:5px;">
						<input type="checkbox" name="services" value="${s}">
						<span>${s}</span>
					</label>
				`
				)
				.join("");

			const groupHTML = groups
				.map(
					(g) => `
					<label style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
						<input type="radio" name="group_name" value="${g}">
						<span>${g}</span>
					</label>
				`
				)
				.join("");

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
						<label style="margin-top:10px;"><strong>Group</strong></label>
						<div style="
							border:1px solid #ddd;
							border-radius:5px;
							padding:8px;
							margin-bottom:10px;
							background:#fafafa;
						">
							${groupHTML}
						</div>
						<label style="margin-top:10px;"><strong>Services</strong></label>
						<div style="
							max-height:160px;
							overflow-y:auto;
							display:flex;
							flex-wrap:wrap;
							gap:10px;
							width:100%;
							border:1px solid #ddd;
							border-radius:5px;
							margin-top:5px;
							background:#fafafa;
						">
							${checkboxHTML}
						</div>
					</div>
				`,
				focusConfirm: false,
				showCancelButton: true,
				confirmButtonText: "✅ Add Teller",
				preConfirm: () => {
					const cname = document.getElementById("new_cname").value.trim();
					const cnum = document.getElementById("new_cnum").value.trim();
					const cuser = document.getElementById("new_cuser").value.trim();
					const cpass = document.getElementById("new_cpass").value.trim();
					const cstatus = document.getElementById("new_cstatus").value;
					const group_name = document.querySelector('input[name="group_name"]:checked')?.value || "";
					const services = Array.from(
						document.querySelectorAll('input[name="services"]:checked')
					).map((cb) => cb.value);

					if (!cname || !cuser || !cpass || !group_name) {
						Swal.showValidationMessage("⚠️ Name, Username, Password, and Group are required");
						return false;
					}

					return { cname, cnum, cuser, cpass, cstatus, services, group_name };
				},
			});

			if (formValues) socket.emit("addTeller", formValues);
		});
	} else {
		container.innerHTML = "<p>No counters found.</p>";
	}
});

/* =====================================================
   ✅ Listen for backend responses
===================================================== */
socket.on("tellerUpdateResult", (res) => {
	Swal.fire(res.status === "1" ? "Success" : "Error", res.message, res.status === "1" ? "success" : "error");
	if (res.status === "1") socket.emit("gettellers");
});

socket.on("tellerDeleteResult", (res) => {
	Swal.fire(res.status === "1" ? "Deleted!" : "Error", res.message, res.status === "1" ? "success" : "error");
	if (res.status === "1") socket.emit("gettellers");
});

socket.on("tellerAddResult", (res) => {
	Swal.fire(res.status === "1" ? "Success" : "Error", res.message, res.status === "1" ? "success" : "error");
	if (res.status === "1") socket.emit("gettellers");
});
