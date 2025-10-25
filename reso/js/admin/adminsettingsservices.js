$(document).ready(function () {
 // Request all services
socket.emit("getservices");

// Receive services data
socket.on("adminServices", function(res) {
    const $container = $(".settservicesdata");
    $container.empty();

    // Append column headers first
    const $headerRow = $("<div>", { class: "service-header" }).append(
        $("<span>", { text: "Service Name", class: "header-col" }),
        $("<span>", { text: "Ticket Letter", class: "header-col" }),
        $("<span>", { text: "Status", class: "header-col" }),
        // $("<span>", { text: "Action", class: "header-col" })
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

        // status checkbox
        const $statusCheckbox = $("<input>", {
            type: "checkbox",
            class: "status-checkbox",
            checked: service.status == 1
        });

        // status label
        const $statusLabel = $("<span>", {
            class: "status-label",
            text: service.status == 1 ? "Active" : "Inactive"
        });

        // Update label text when checkbox changes
        $statusCheckbox.on("change", function() {
            $statusLabel.text($(this).is(":checked") ? "Active" : "Inactive");
        
            // UPDATE DATABASE
            const updatedService = {
                id: service.id,
                sname: $snameInput.val(),
                regular: $regularInput.val(),
                status: $statusCheckbox.is(":checked") ? 1 : 0
            };
            socket.emit("updateServices", updatedService);
        });

        // // save button
        // const $saveBtn = $("<button>", {
        //     text: "Save",
        //     class: "save-btn"
        // }).on("click", function() {
        //     const updatedService = {
        //         id: service.id,
        //         sname: $snameInput.val(),
        //         regular: $regularInput.val(),
        //         status: $statusCheckbox.is(":checked") ? 1 : 0
        //     };
        //     socket.emit("updateServices", updatedService);
        // });

        $row.append(
            $snameInput,
            $regularInput,
            $("<div>", { class: "status-wrap" }).append($statusCheckbox, $statusLabel),
        );

        $container.append($row);
    });
});

// Response after update
socket.on("servicesgather", function(res) {
    console.log(res.message);
});
});