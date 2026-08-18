$(document).ready(function () {
    function updateDateTime() {
      const now = new Date();

      // Format using Asia/Manila timezone
      const dateOptions = {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric"
      };
      const timeOptions = {
        timeZone: "Asia/Manila",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      };

      const formattedDate = new Intl.DateTimeFormat("en-US", dateOptions).format(now);
      const formattedTime = new Intl.DateTimeFormat("en-US", timeOptions).format(now);

      $(".date").text(formattedDate);
      $(".time").text(formattedTime);
    }

    // Initial call
    updateDateTime();
    // Update time every second
    setInterval(updateDateTime, 1000);
});