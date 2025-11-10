// --- Admin Ads Player ---
let adminAdsQueue = [];
let adminCurrentIndex = 0;
let adminVideoEl = null;
let adminPlaying = false;
let adminVolume = 0.5;
let lastUploadedFile = null; // track latest uploaded file

const $adsList = $("#adsList");
const $status = $("#statusMsg");

function msg(t, isErr = false) {
	$status.text(t).css("color", isErr ? "#d33" : "inherit");
	setTimeout(() => $status.text(""), 5000);
}

function filenameToUrl(name) {
	return `/ads/${encodeURIComponent(name)}`;
}

function renderAdsList() {
	$adsList.empty();

	if (!adminAdsQueue.length) {
		$adsList.append(
			$('<div style="padding:12px;opacity:.7;">No videos in /ads folder.</div>')
		);
		return;
	}

	adminAdsQueue.forEach((name, idx) => {
		const $row = $(`<div class="ad-item">${name}</div>`);
		const $rename = $('<button class="rename-btn">Rename</button>');
		const $delete = $('<button class="delete-btn">Delete</button>');

		// play on title click
		$row.on("click", () => {
			playByIndex(idx, true);
		});

		// rename
		$rename.on("click", async (e) => {
			e.stopPropagation();
			const ext = name.substring(name.lastIndexOf("."));
			const base = name.slice(0, -ext.length);

			const { value: newBase } = await Swal.fire({
				title: "Rename video",
				input: "text",
				inputLabel: "Enter new name (without extension):",
				inputValue: base,
				showCancelButton: true,
				confirmButtonText: "Rename",
			});

			if (!newBase) return;
			const newName = `${newBase}${ext}`;
			if (newName === name) return;

			try {
				const res = await fetch("/rename-video", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ oldName: name, newName }),
				});
				if (!res.ok) throw new Error(await res.text());
        		showMsg("success",`Renamed to ${newName}`);
				socket.emit("requestAd");
			} catch (err) {
				console.error(err);
        		showMsg("error",`Rename failed: ${err.message}`);

			}
		});

		// delete
		$delete.on("click", async (e) => {
			e.stopPropagation();

			const result = await Swal.fire({
				title: "Are you sure?",
				text: `Delete "${name}"?`,
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#3085d6",
				confirmButtonText: "Yes, delete it!",
			});

			if (!result.isConfirmed) return;

			try {
				const res = await fetch(`/delete-video/${encodeURIComponent(name)}`, {
					method: "DELETE",
				});
				if (!res.ok) throw new Error(await res.text());
        		showMsg("success",`Deleted ${name}`);

				socket.emit("requestAd");
			} catch (err) {
				console.error(err);
        		showMsg("error",`Delete failed: ${err.message}`);
			}
		});

		$row.append($rename, $delete);
		if (idx === adminCurrentIndex) $row.addClass("active");
		$adsList.append($row);
	});
}

function markActive() {
	const rows = $adsList.children(".ad-item");
	rows.removeClass("active");
	if (adminCurrentIndex >= 0 && adminCurrentIndex < rows.length) {
		rows.eq(adminCurrentIndex).addClass("active");
	}
}

function ensureVideoEl() {
	if (!adminVideoEl) {
		adminVideoEl = $("#adminAdPlayer");
		adminVideoEl.prop("muted", adminVolume <= 0);
		adminVideoEl.prop("volume", Math.max(0, Math.min(1, adminVolume)));
		adminVideoEl.on("ended", onEnded);
	}
}

function playByIndex(idx, userInitiated = false) {
	if (!adminAdsQueue.length) return;
	adminCurrentIndex = (idx + adminAdsQueue.length) % adminAdsQueue.length;

	ensureVideoEl();

	const name = adminAdsQueue[adminCurrentIndex];
	const url = filenameToUrl(name);

	adminVideoEl.attr("src", url);

	if (userInitiated) {
		adminVideoEl.prop("muted", adminVolume <= 0);
		adminVideoEl.prop("volume", Math.max(0, Math.min(1, adminVolume)));
	}

	const p = adminVideoEl.get(0).play();
	if (p && typeof p.catch === "function") {
		p.catch((e) => console.warn("Autoplay blocked or error:", e.message));
	}
	adminPlaying = true;
	markActive();
}

function onEnded() {
	if (!adminPlaying) return;
	playByIndex(adminCurrentIndex + 1, false);
}

// --- Socket.IO ads + volume updates ---
socket.on("adsList", (payload) => {
	if (!payload || !Array.isArray(payload.ads)) return;

	const prev = adminAdsQueue.join(",");
	adminAdsQueue = [...payload.ads];

	adminVolume = Math.min(Math.max(payload.volume || 0, 0), 1);
	if (adminVideoEl) {
		adminVideoEl.prop("muted", adminVolume <= 0);
		adminVideoEl.prop("volume", adminVolume);
	}

	// re-render list
	renderAdsList();

	// --- Selection logic ---
	if (!adminAdsQueue.length) return;

	// if just uploaded, auto-select it
	if (lastUploadedFile && adminAdsQueue.includes(lastUploadedFile)) {
		adminCurrentIndex = adminAdsQueue.indexOf(lastUploadedFile);
		lastUploadedFile = null; // reset
		playByIndex(adminCurrentIndex, true);
	} else {
		// otherwise: if playing keep index, else fallback to first
		if (!adminPlaying || prev !== adminAdsQueue.join(",")) {
			adminCurrentIndex = 0;
			playByIndex(adminCurrentIndex, true);
		} else {
			markActive();
		}
	}
});

// --- Buttons & Upload ---
$(function () {
	socket.emit("requestAd");
	setTimeout(() => {
		if (!adminAdsQueue.length) socket.emit("requestAd");
	}, 2000);
	$("#startAdminAds").on("click", () => {
		if (!adminAdsQueue.length) return msg("No videos to play.", true);
		playByIndex(adminCurrentIndex || 0, true);
	});

	$("#refreshAdsBtn").on("click", () => socket.emit("requestAd"));

	$("#videoFile").on("change", function () {
		const file = this.files[0];
		const $label = $(".file-label");
		const $button = $(".adsupload");

		if (file) {
			showMsg("info",`File: ${file.name}\nClick Upload`);


			$label.attr("title", file.name);
			$button.attr("title", file.name).addClass("blink-red");
		} else {
			$button.attr("title", "").removeClass("blink-red");
		}
	});

	$("#uploadForm").on("submit", async (e) => {
		e.preventDefault();
		const $button = $(".adsupload");
		const file = $("#videoFile").prop("files")[0];
		if (!file) return msg("Pick a video first.", true);

		const fd = new FormData();
		fd.append("video", file);
		lastUploadedFile = file.name;

		try {
			const res = await fetch("/upload-video", { method: "POST", body: fd });
			if (!res.ok) throw new Error(await res.text());
			$button.removeClass("blink-red");
			$("#videoFile").val("");
			
        showMsg("success","File successfully uploaded");

			socket.emit("requestAd");
		} catch (err) {
			console.error(err);
        showMsg("error","Failed to upload file");

		}
	});
});
