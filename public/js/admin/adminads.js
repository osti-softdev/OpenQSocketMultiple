// ! --- Admin Ads Player ---
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
        const $row = $(`<div class="adsitem"></div>`);
        const $labelCont = $(`<div class="labelCont">${name}</div>`);
        const $buttonCont = $('<div class="btnCont"></div>');
        const $rename = $('<button class="rename-btn">Rename</button>');
        const $delete = $('<button class="delete-btn">Delete</button>');

        // Play on title click
        $row.on("click", function () {
            playByIndex(idx, true);
            // Use jQuery this (function() scope)
            $(this).addClass('active').siblings().removeClass('active');
        });

        // Rename
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
                showMsg("success", `Renamed to ${newName}`);
            } catch (err) {
                console.error(err);
                showMsg("error", `Rename failed: ${err.message}`);
            }
        });

        // Delete
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
                showMsg("success", `Deleted ${name}`);
            } catch (err) {
                console.error(err);
                showMsg("error", `Delete failed: ${err.message}`);
            }
        });

        // Append buttons
        $buttonCont.append($rename, $delete);
        $row.append($labelCont, $buttonCont);

        // Mark active
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

socket.on('voiceConfigUpdate', config => {
	if (!config || config.ad_volume === undefined) return;
	adminVolume = Math.min(Math.max(Number(config.ad_volume), 0), 1);
	if (adminVideoEl) {
		adminVideoEl.prop('muted', adminVolume <= 0);
		adminVideoEl.prop('volume', adminVolume);
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
		const $form = $(this).closest("#videoUploadForm");
		const $label = $form.find(".file-label");
		const $button = $form.find(".adsupload");

		if (file) {
			showMsg("info",`File: ${file.name}\nClick Upload`);
			$label.attr("title", file.name);
			$button
				.attr("title", `Upload ${file.name}`)
				.attr("aria-label", `Upload selected video ${file.name}`)
				.addClass("blink-red");
		} else {
			$label.attr("title", "Choose a video file");
			$button
				.attr("title", "Upload Video")
				.attr("aria-label", "Upload video")
				.removeClass("blink-red");
		}
	});

	$("#videoUploadForm").on("submit", function (e) {
    e.preventDefault();

    const $button = $(".adsupload");
    const file = $("#videoFile").prop("files")[0];
    const $uploadText = $("#uploadText");
    const $uploadFill = $("#uploadBarFill");

    if (!file) return msg("Pick a video first.", true);

    lastUploadedFile = file.name;

    const fd = new FormData();
    fd.append("video", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload-video", true);

    // Upload progress
    xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            $uploadText.text(`Uploading: ${percent}%`);
            $uploadFill.css("width", percent + "%");
        }
    };

    xhr.onload = function () {
        if (xhr.status === 200) {
            showMsg("success", "File successfully uploaded");
            $button
                .attr("title", "Upload Video")
                .attr("aria-label", "Upload video")
                .removeClass("blink-red");
            $("#videoFile").val("");
            $uploadText.text("Upload complete!");
            $uploadFill.css("width", "100%");
            setTimeout(() => { 
                $uploadText.text(""); 
                $uploadFill.css("width", "0%"); 
            }, 2000);
            socket.emit("requestAd");
        } else {
            console.error(xhr.responseText);
            $uploadText.text(`Upload failed: ${xhr.responseText}`);
            showMsg("error", "Failed to upload file");
            $uploadFill.css("width", "0%");
        }
    };

    xhr.onerror = function () {
        $uploadText.text("Upload failed due to network error.");
        showMsg("error", "Upload failed due to network error.");
        $uploadFill.css("width", "0%");
    };

    xhr.send(fd);

    // Initial state
    $uploadText.text(`Uploading ${file.name}: 0%`);
    $uploadFill.css("width", "0%");
});

});
