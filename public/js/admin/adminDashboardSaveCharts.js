// Global function to save any Chart.js chart via socket.io
function saveChartImage(chartInstance, filename) {
  if (!chartInstance) {
    console.error("❌ No chart instance provided");
    return;
  }

  const base64Image = chartInstance.toBase64Image();
  socket.emit("saveChartImage", { imageData: base64Image, filename });
}

// Global listener for backend response
socket.on("saveChartImageResponse", function (res) {
  if (res.success) {
    console.log("✅ " + res.message);
  } else {
    console.error("❌ " + res.message);
  }
});
