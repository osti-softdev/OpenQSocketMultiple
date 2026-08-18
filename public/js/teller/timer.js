let timer = null;   // Holds the interval ID
let seconds = 0;    // Counter

// Load saved time (if any)
if (localStorage.getItem("elapsedTime")) {
  seconds = parseInt(localStorage.getItem("elapsedTime"), 10);
  $(".servicecalledtimer").text(formatTime(seconds));
}

// Format seconds → HH:MM:SS
function formatTime(sec) {
  const hrs = String(Math.floor(sec / 3600)).padStart(2, "0");
  const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const secs = String(sec % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

// Start timer
function starttimer() {
  if (!timer) {
    timer = setInterval(function () {
      seconds++;
      $(".servicecalledtimer").text(formatTime(seconds));
      localStorage.setItem("elapsedTime", seconds); // ✅ save progress
    }, 1000);
  }
}

// Stop timer
function stoptimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  localStorage.removeItem("elapsedTime"); // ✅ clear on stop
}

// Reset timer
function resettimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  seconds = 0;
  $(".servicecalledtimer").text("00:00:00");
  localStorage.removeItem("elapsedTime"); // ✅ clear stored time
}
