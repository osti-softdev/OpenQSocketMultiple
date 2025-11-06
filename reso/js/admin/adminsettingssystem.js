$(document).ready(function () {
 // Request all services
socket.emit("getdbsize");

// Receive services data
socket.on("dbsizeapi", function(res) {
    console.log("Database Size:", res.data);
    $(".settdbdatadbsize").text(res.data.formatted);
    });
});