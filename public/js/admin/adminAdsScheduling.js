// /js/admin/adminAdsScheduling.js
// Playlist manager + weekly schedule calendar for the advertisement tab.
// Depends on jQuery (already loaded). No new libraries required.

(function () {
	"use strict";

	const API = "/api/ads";
	const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const HOUR_HEIGHT = 40; // px per hour row, must match $schedule-hour-height in SCSS

	let playlists = [];
	let schedules = [];
	let videoFiles = [];
	let editingPlaylistId = null;   // null = creating new
	let editingScheduleId = null;   // null = creating new
	let builderItems = [];          // filenames currently in the playlist being edited

	// ---------- API helpers ----------
	function apiGet(url) {
		return $.get(url).then(res => res);
	}
	function apiSend(method, url, data) {
		return $.ajax({
			url, method,
			contentType: "application/json",
			data: JSON.stringify(data || {})
		});
	}

	// ---------- Init ----------
	function init() {
		bindEvents();
		refreshAll();
	}

	function refreshAll() {
		return Promise.all([
			apiGet(`${API}/playlists`).then(r => { playlists = r.playlists || []; }),
			apiGet(`${API}/schedules`).then(r => { schedules = r.schedules || []; }),
			apiGet(`/ads`).then(files => { videoFiles = files || []; })
		]).then(() => {
			renderPlaylists();
			renderCalendar();
		}).catch(err => {
			console.error("[ADS-SCHEDULING] Failed to load data:", err);
		});
	}

	// ============================================================
	// PLAYLISTS
	// ============================================================
	function renderPlaylists() {
		const $list = $("#playlistsList").empty();
		if (!playlists.length) {
			$list.append(`<div class="ads-empty-state">No playlists yet. Create one to start scheduling rotations.</div>`);
			return;
		}
		playlists.forEach(p => {
			const $card = $(`
				<div class="playlist-card" data-id="${p.id}">
					<div class="playlist-card-info">
						<strong>${escapeHtml(p.name)}</strong>
						${p.is_default ? '<span class="badge badge-default">Default</span>' : ""}
						<small>${p.items.length} video${p.items.length === 1 ? "" : "s"}</small>
					</div>
					<div class="playlist-card-actions">
						<button type="button" class="btn btn-secondary btn-sm edit-playlist-btn">Edit</button>
					</div>
				</div>
			`);
			$card.find(".edit-playlist-btn").on("click", () => openPlaylistModal(p));
			$list.append($card);
		});
	}

	function openPlaylistModal(playlist) {
		editingPlaylistId = playlist ? playlist.id : null;
		builderItems = playlist ? playlist.items.map(i => i.filename) : [];

		$("#playlistModalTitle").text(playlist ? "Edit playlist" : "New playlist");
		$("#playlistNameInput").val(playlist ? playlist.name : "");
		$("#deletePlaylistBtn").toggle(!!playlist && !playlist.is_default);

		renderPlaylistBuilder();
		renderPlaylistSource();
		showModal("playlistModalOverlay");
	}

	function renderPlaylistBuilder() {
		const $list = $("#playlistBuilderList").empty();
		if (!builderItems.length) {
			$list.append(`<div class="ads-empty-state small">Drag videos here from the library below.</div>`);
			return;
		}
		builderItems.forEach((filename, index) => {
			const $item = $(`
				<div class="builder-item" draggable="true" data-index="${index}">
					<span class="drag-handle">⠿</span>
					<span class="builder-item-name">${escapeHtml(filename)}</span>
					<button type="button" class="builder-item-remove" title="Remove">&times;</button>
				</div>
			`);
			$item.find(".builder-item-remove").on("click", () => {
				builderItems.splice(index, 1);
				renderPlaylistBuilder();
			});
			attachDragReorder($item, $list);
			$list.append($item);
		});
	}

	function attachDragReorder($item, $list) {
		$item.on("dragstart", e => {
			e.originalEvent.dataTransfer.setData("text/plain", $item.data("index"));
			$item.addClass("dragging");
		});
		$item.on("dragend", () => $item.removeClass("dragging"));
		$item.on("dragover", e => e.preventDefault());
		$item.on("drop", e => {
			e.preventDefault();
			const fromIndex = Number(e.originalEvent.dataTransfer.getData("text/plain"));
			const toIndex = Number($item.data("index"));
			if (fromIndex === toIndex) return;
			const [moved] = builderItems.splice(fromIndex, 1);
			builderItems.splice(toIndex, 0, moved);
			renderPlaylistBuilder();
		});
	}

	function renderPlaylistSource() {
		const $list = $("#playlistSourceList").empty();
		if (!videoFiles.length) {
			$list.append(`<div class="ads-empty-state small">No videos uploaded yet.</div>`);
			return;
		}
		videoFiles.forEach(filename => {
			const $item = $(`
				<div class="source-item">
					<span class="source-item-name">${escapeHtml(filename)}</span>
					<button type="button" class="btn btn-secondary btn-xs add-to-playlist-btn">+ Add</button>
				</div>
			`);
			$item.find(".add-to-playlist-btn").on("click", () => {
				builderItems.push(filename);
				renderPlaylistBuilder();
			});
			$list.append($item);
		});
	}

	function savePlaylist() {
		const name = $("#playlistNameInput").val().trim();
		if (!name) return notify("Playlist name is required", "error");

		const request = editingPlaylistId
			? apiSend("PUT", `${API}/playlists/${editingPlaylistId}`, { name })
				.then(() => apiSend("PUT", `${API}/playlists/${editingPlaylistId}/items`, { filenames: builderItems }))
			: apiSend("POST", `${API}/playlists`, { name, filenames: builderItems });

		request
			.then(() => { hideModal("playlistModalOverlay"); return refreshAll(); })
			.then(() => notify("Playlist saved", "success"))
			.catch(err => notify(err.responseJSON?.message || "Failed to save playlist", "error"));
	}

	function deletePlaylist() {
		if (!editingPlaylistId) return;
		if (!confirm("Delete this playlist? Any schedule using it will need to be updated.")) return;

		apiSend("DELETE", `${API}/playlists/${editingPlaylistId}`)
			.then(() => { hideModal("playlistModalOverlay"); return refreshAll(); })
			.then(() => notify("Playlist deleted", "success"))
			.catch(err => notify(err.responseJSON?.message || "Failed to delete playlist", "error"));
	}

	// ============================================================
	// SCHEDULE CALENDAR
	// ============================================================
	function renderCalendar() {
		renderHourLabels();
		renderCalendarGrid();
	}

	function renderHourLabels() {
		const $hours = $("#scheduleHours").empty();
		for (let h = 0; h < 24; h++) {
			$hours.append(`<div class="schedule-hour-label" style="height:${HOUR_HEIGHT}px">${formatHourLabel(h)}</div>`);
		}
	}

	function renderCalendarGrid() {
		const $grid = $("#scheduleGrid").empty().css("height", HOUR_HEIGHT * 24 + "px");

		// 7 day columns with click-to-create hour cells
		const $cols = [];
		for (let day = 0; day < 7; day++) {
			const $col = $(`<div class="schedule-day-col" data-day="${day}" style="height:${HOUR_HEIGHT * 24}px"></div>`);
			for (let h = 0; h < 24; h++) {
				const $cell = $(`<div class="schedule-hour-cell" style="height:${HOUR_HEIGHT}px; display: flex; flex-direction: row; gap: 2px; padding: 2px;" data-day="${day}" data-hour="${h}"></div>`);
				$cell.on("click", () => openScheduleModal(null, { day, hour: h }));
				$col.append($cell);
			}
			$grid.append($col);
			$cols.push($col);
		}

		// Calculate blocks and place pills into the respective hour cells
		schedules.forEach(schedule => {
			const startMin = timeToMinutes(schedule.start_time);
			let endMin = timeToMinutes(schedule.end_time);
			if (endMin <= startMin) endMin = 24 * 60;
			
			const startHour = Math.floor(startMin / 60);
			const endHour = Math.ceil(endMin / 60);

			const days = schedule.days_of_week ? schedule.days_of_week.split(",").map(Number) : [0, 1, 2, 3, 4, 5, 6];
			
			const label = schedule.type === "video" ? schedule.video_filename : playlistName(schedule.playlist_id);
			const color = schedule.color || '#4f6df5';
			const opacity = schedule.active ? 1 : 0.5;

			days.forEach(day => {
				const $col = $cols[day];
				for (let h = startHour; h < endHour; h++) {
					// Cap to 23 to avoid overflow if endMin is exactly 24:00
					if (h >= 24) continue;
					const $cell = $col.find(`[data-hour="${h}"]`);
					
					const $pill = $(`
						<div class="schedule-pill" style="background-color: ${color}; opacity: ${opacity}; border-radius: 4px; flex: 1; padding: 2px 4px; color: #fff; font-size: 10px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; border: 1px solid rgba(0,0,0,0.1);" title="${escapeHtml(schedule.name)} - ${escapeHtml(label)}">
							<strong>${escapeHtml(schedule.name)}</strong>
						</div>
					`);
					
					$pill.on("click", e => {
						e.stopPropagation();
						openScheduleModal(schedule);
					});
					
					$cell.append($pill);
				}
			});
		});
	}

	function playlistName(id) {
		const p = playlists.find(pl => pl.id === id);
		return p ? p.name : "(deleted playlist)";
	}

	function openScheduleModal(schedule, prefill) {
		editingScheduleId = schedule ? schedule.id : null;

		populateSelect("#schedulePlaylistInput", playlists, p => p.id, p => p.name);
		populateSelect("#scheduleVideoInput", videoFiles, f => f, f => f);

		$("#scheduleModalTitle").text(schedule ? "Edit schedule" : "New schedule");
		$("#deleteScheduleBtn").toggle(!!schedule);

		$("#scheduleNameInput").val(schedule ? schedule.name : "");
		$("#scheduleColorInput").val(schedule ? (schedule.color || "#4f6df5") : "#4f6df5");
		$("#scheduleTypeInput").val(schedule ? schedule.type : "playlist").trigger("change");
		$("#schedulePlaylistInput").val(schedule ? schedule.playlist_id : (playlists[0] ? playlists[0].id : ""));
		$("#scheduleVideoInput").val(schedule ? schedule.video_filename : (videoFiles[0] || ""));

		const startHour = schedule ? schedule.start_time.slice(0, 5) : `${String(prefill?.hour ?? 9).padStart(2, "0")}:00`;
		const endHour = schedule ? schedule.end_time.slice(0, 5) : `${String((prefill?.hour ?? 9) + 1).padStart(2, "0")}:00`;
		$("#scheduleStartTime").val(startHour);
		$("#scheduleEndTime").val(endHour);
		$("#schedulePriority").val(schedule ? schedule.priority : 0);
		$("#scheduleStartDate").val(schedule ? (schedule.start_date || "") : "");
		$("#scheduleEndDate").val(schedule ? (schedule.end_date || "") : "");
		$("#scheduleActiveInput").prop("checked", schedule ? !!schedule.active : true);

		const activeDays = schedule && schedule.days_of_week
			? schedule.days_of_week.split(",").map(Number)
			: (prefill ? [prefill.day] : []);
		$("#scheduleDaysChecklist input[type=checkbox]").each(function () {
			$(this).prop("checked", activeDays.includes(Number($(this).val())));
		});

		showModal("scheduleModalOverlay");
	}

	function populateSelect(selector, items, valueFn, labelFn) {
		const $select = $(selector).empty();
		items.forEach(item => {
			$select.append(`<option value="${escapeHtml(String(valueFn(item)))}">${escapeHtml(labelFn(item))}</option>`);
		});
	}

	function saveSchedule() {
		const type = $("#scheduleTypeInput").val();
		const days = $("#scheduleDaysChecklist input:checked").map(function () { return Number($(this).val()); }).get();

		const payload = {
			name: $("#scheduleNameInput").val().trim(),
			color: $("#scheduleColorInput").val(),
			type,
			playlist_id: type === "playlist" ? Number($("#schedulePlaylistInput").val()) : null,
			video_filename: type === "video" ? $("#scheduleVideoInput").val() : null,
			start_time: $("#scheduleStartTime").val() + ":00",
			end_time: $("#scheduleEndTime").val() + ":00",
			priority: Number($("#schedulePriority").val()) || 0,
			days_of_week: days.length ? days : null,
			start_date: $("#scheduleStartDate").val() || null,
			end_date: $("#scheduleEndDate").val() || null,
			active: $("#scheduleActiveInput").is(":checked")
		};

		if (!payload.name) return notify("Schedule name is required", "error");
		if (type === "playlist" && !payload.playlist_id) return notify("Select a playlist", "error");
		if (type === "video" && !payload.video_filename) return notify("Select a video", "error");

		const request = editingScheduleId
			? apiSend("PUT", `${API}/schedules/${editingScheduleId}`, payload)
			: apiSend("POST", `${API}/schedules`, payload);

		request
			.then(() => { hideModal("scheduleModalOverlay"); return refreshAll(); })
			.then(() => notify("Schedule saved", "success"))
			.catch(err => notify(err.responseJSON?.message || "Failed to save schedule", "error"));
	}

	function deleteSchedule() {
		if (!editingScheduleId) return;
		if (!confirm("Delete this schedule?")) return;

		apiSend("DELETE", `${API}/schedules/${editingScheduleId}`)
			.then(() => { hideModal("scheduleModalOverlay"); return refreshAll(); })
			.then(() => notify("Schedule deleted", "success"))
			.catch(err => notify(err.responseJSON?.message || "Failed to delete schedule", "error"));
	}

	// ============================================================
	// UI helpers
	// ============================================================
	function bindEvents() {
		$("#createPlaylistBtn").on("click", () => openPlaylistModal(null));
		$("#savePlaylistBtn").on("click", savePlaylist);
		$("#deletePlaylistBtn").on("click", deletePlaylist);

		$("#createScheduleBtn").on("click", () => openScheduleModal(null, { day: new Date().getDay(), hour: 9 }));
		$("#saveScheduleBtn").on("click", saveSchedule);
		$("#deleteScheduleBtn").on("click", deleteSchedule);

		$("#scheduleTypeInput").on("change", function () {
			const isVideo = $(this).val() === "video";
			$("#scheduleVideoWrap").toggle(isVideo);
			$("#schedulePlaylistWrap").toggle(!isVideo);
		});

		$(document).on("click", "[data-close]", function () {
			hideModal($(this).data("close"));
		});
		$(".ads-modal-overlay").on("click", function (e) {
			if (e.target === this) hideModal($(this).attr("id"));
		});
	}

	function showModal(id) { $(`#${id}`).addClass("open"); }
	function hideModal(id) { $(`#${id}`).removeClass("open"); }

	function timeToMinutes(t) {
		const [h, m] = String(t).split(":").map(Number);
		return h * 60 + (m || 0);
	}

	function formatHourLabel(h) {
		const period = h < 12 ? "AM" : "PM";
		const display = h % 12 === 0 ? 12 : h % 12;
		return `${display} ${period}`;
	}

	function escapeHtml(str) {
		return $("<div>").text(str == null ? "" : str).html();
	}

	function notify(message, type) {
		// Falls back to console if sweetalert2 isn't ready for some reason
		if (window.Swal) {
			Swal.fire({ text: message, icon: type === "error" ? "error" : "success", timer: 1800, showConfirmButton: false });
		} else {
			console.log(`[ADS-SCHEDULING] ${type}: ${message}`);
		}
	}

	$(document).ready(init);
})();
