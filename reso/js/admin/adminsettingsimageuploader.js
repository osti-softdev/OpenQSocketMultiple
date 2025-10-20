function formatFilename(filename, maxLength = 45) {
  if (filename.length > maxLength) {
    return filename.substring(0, maxLength - 3) + "...";
  }
  return filename;
}

function previewImage(fileInputId, filenameId, buttonId) {
  let file = $(fileInputId)[0].files[0];
  if (!file) return;

  // 🔹 Update filename text (truncate) + tooltip with full name
  $(filenameId)
    .text(formatFilename(file.name))
    .attr("title", file.name);

  // 🔹 Mark button red (file selected but not uploaded yet)
  $(buttonId).css("background-color", "red");

  let reader = new FileReader();
  reader.onload = function (e) {
    let img = new Image();
    img.src = e.target.result;

    img.onload = function () {
      Swal.fire({
        title: "Image Preview",
        html: `
          <div style="max-height:75vh; overflow:auto; text-align:center;">
            <img src="${img.src}" 
                 style="max-width:100%; max-height:70vh; border-radius:10px;">
          </div>
        `,
        width: "50%",   // 🔹 Always fixed at 50%
        showCloseButton: true,
        confirmButtonText: "OK",
      });
    };
  };
  reader.readAsDataURL(file);
}

function uploadImage(fileInputId, endpoint, statusId, buttonId, filenameId) {
  let file = $(fileInputId)[0].files[0];
  if (!file) {
    Swal.fire("Error", "Please select a PNG file.", "error");
    return;
  }

  let formData = new FormData();
  formData.append("image", file);

  $.ajax({
    url: endpoint,
    type: "POST",
    data: formData,
    contentType: false,
    processData: false,
    success: function (response) {
      Swal.fire({
        icon: "success",
        title: "Upload Successful",
        text: response,
        width: "40%"
      });

      // 🔹 Reset UI after success
      $(fileInputId).val(""); // clear input
      $(filenameId).text("No file chosen").attr("title", ""); // reset filename
      $(statusId).text(""); // clear status
      $(buttonId).css("background-color", ""); // reset button color
    },
    error: function (xhr) {
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: xhr.responseText,
        width: "40%"
      });
      $(statusId).css("color", "red").text("Upload failed: " + xhr.responseText);

      // 🔹 Keep button red if failed
      $(buttonId).css("background-color", "red");
    }
  });
}

$(function () {
  // Auto-preview when file selected
  $("#bannerFile").on("change", function () {
    previewImage("#bannerFile", "#bannerFilename", "#uploadBanner");
  });

  $("#bgFile").on("change", function () {
    previewImage("#bgFile", "#bgFilename", "#uploadBg");
  });

  // Upload buttons
  $("#uploadBanner").on("click", function (e) {
    e.preventDefault();
    uploadImage("#bannerFile", "/upload-banner", "#bannerStatus", "#uploadBanner", "#bannerFilename");
  });

  $("#uploadBg").on("click", function (e) {
    e.preventDefault();
    uploadImage("#bgFile", "/upload-bg", "#bgStatus", "#uploadBg", "#bgFilename");
  });
});
