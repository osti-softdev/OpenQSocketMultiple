$(document).ready(function () {
 // Request all services
socket.emit("getservices");

// Receive services data
socket.on("adminServices", function(res) {
    const $container = $(".settservicesdata");
    $container.empty();

    // Append column headers first
    const $headerRow = $("<div>", { class: "service-header" }).append(
        $("<span>", { text: "Service", class: "header-col" }),
        $("<span>", { text: "Reg", class: "header-col" }),
        $("<span>", { text: "Prio", class: "header-col" }),
        $("<span>", { text: "Short Name", class: "header-col" }),
        $("<span>", { text: "Status", class: "header-col" }),
        $("<span>", { text: "Sched", class: "header-col" })
    );
    $container.append($headerRow);

    // Sort rows by ID ascending
    const sortedData = res.data.sort((a, b) => a.id - b.id);

    $.each(sortedData, function(_, service) {
        const $row = $("<div>", { class: "service-rowData", "data-id": service.id });

        // sname input
        const $snameInput = $("<input>", {
            type: "text",
            class: "sname-input",
            value: service.sname
        });
        // regular input
        const $regularInput = $("<input>", {
            type: "text",
            class: "regular-input",
            value: service.regular
        });
        // piority input
        const $priorityInput = $("<input>", {
            type: "text",
            class: "piority-input",
            value: service.priority
        });
        // Short name input
        const $shortName = $("<input>", {
            type: "text",
            class: "regular-input",
            value: service.shortSname
        });
        // status checkbox
        const $statusCheckbox = $("<input>", {
            type: "checkbox",
            class: "status-checkbox",
            checked: service.status == 1
        });
        // sched button
        const $schedInput = $("<input>", {
            type: "time",
            placeHolder: "sched",
            class: "sched-btn",
            value: service.sched
        });
        // status label
        const $statusLabel = $("<span>", {
            class: "status-label",
            text: service.status == 1 ? "On" : "Off"
        });
        // Update label text when checkbox changes
        $statusCheckbox.on("change", function() {
            $statusLabel.text($(this).is(":checked") ? "On" : "Off");
        
            // UPDATE DATABASE
            const updatedService = {
                id: service.id,
                sname: $snameInput.val(),
                shortSname: $shortName.val(),
                regular: $regularInput.val(),
                priority: $priorityInput.val(),
                status: $statusCheckbox.is(":checked") ? 1 : 0,
                sched: $schedInput.val()
            };
            socket.emit("updateServices", updatedService);
        });
        $snameInput.on("change", function() {
            $statusLabel.text($(this).is(":checked") ? "On" : "Off");
        
            // UPDATE DATABASE
            const updatedService = {
                id: service.id,
                sname: $snameInput.val(),
                shortSname: $shortName.val(),
                regular: $regularInput.val(),
                priority: $priorityInput.val(),
                status: $statusCheckbox.is(":checked") ? 1 : 0,
                sched: $schedInput.val()
            };
            socket.emit("updateServices", updatedService);
        });
        $shortName.on("change", function() {
            $statusLabel.text($(this).is(":checked") ? "On" : "Off");
        
            // UPDATE DATABASE
            const updatedService = {
                id: service.id,
                sname: $snameInput.val(),
                shortSname: $shortName.val(),
                regular: $regularInput.val(),
                priority: $priorityInput.val(),
                status: $statusCheckbox.is(":checked") ? 1 : 0,
                sched: $schedInput.val()
            };
            socket.emit("updateServices", updatedService);
        });
        $regularInput.on("change", function() {
            $statusLabel.text($(this).is(":checked") ? "On" : "Off");
        
            // UPDATE DATABASE
            const updatedService = {
                id: service.id,
                sname: $snameInput.val(),
                shortSname: $shortName.val(),
                regular: $regularInput.val(),
                priority: $priorityInput.val(),
                status: $statusCheckbox.is(":checked") ? 1 : 0,
                sched: $schedInput.val()
            };
            socket.emit("updateServices", updatedService);
        });
         $priorityInput.on("change", function() {
            $statusLabel.text($(this).is(":checked") ? "On" : "Off");
        
            // UPDATE DATABASE
            const updatedService = {
                id: service.id,
                sname: $snameInput.val(),
                shortSname: $shortName.val(),
                regular: $regularInput.val(),
                priority: $priorityInput.val(),
                status: $statusCheckbox.is(":checked") ? 1 : 0,
                sched: $schedInput.val()
            };
            socket.emit("updateServices", updatedService);
        });
        $schedInput.on("change", function() {
            $statusLabel.text($(this).is(":checked") ? "On" : "Off");
        
            // UPDATE DATABASE
            const updatedService = {
                id: service.id,
                sname: $snameInput.val(),
                shortSname: $shortName.val(),
                regular: $regularInput.val(),
                priority: $priorityInput.val(),
                status: $statusCheckbox.is(":checked") ? 1 : 0,
                sched: $schedInput.val()
            };
            socket.emit("updateServices", updatedService);
        });

        $row.append(
            $snameInput,
            $regularInput,
            $priorityInput,
            $shortName,
            $("<div>", { class: "status-wrap" }).append($statusCheckbox, $statusLabel),
            $schedInput
        );

        $container.append($row);
    });
});

// Response after update
socket.on("servicesgather", function(res) {
    console.log(res.message);
});
});