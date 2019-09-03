$(function() {

  let tune = {};
  let boostSlider = $("#boostSlider");
  let accelerationSlider = $("#accelerationSlider");
  let gearSlider = $("#gearSlider");
  let breakSlider = $("#breakSlider");
  let drivetrainSlider = $("#drivetrainSlider")
  
  window.onload = (e) => {
    $("#container").hide();
    window.addEventListener("message", (event) => {
      let data = event.data;
      if (data !== undefined && data.type === "tunerchip-ui") {
        if (data.display === true) {
          tune = JSON.parse(data.tune);
          boostSlider.val(tune.boost);
          accelerationSlider.val(tune.acceleration);
          gearSlider.val(tune.gearchange);
          breakSlider.val(tune.breaking);
          drivetrainSlider.val(tune.drivetrain);
          $("#container").show();
        } else {
          $("#container").hide();
        }
      }
    });
  }

  // Detect when [ESC] key is clicked to close Menu
  document.onkeyup = function (data) {
    if (data.which == 27) {
      $.post("http://xgc-tunerchip/closeTuner", JSON.stringify({}));
    }
  };

  $("#saveButton").click(function () {
    $.post("http://xgc-tunerchip/saveTune", JSON.stringify(tune));
  });

  $("#defaultTuneButton").click(function () {

    // Updating on UI
    boostSlider.val(0);
    accelerationSlider.val(0);
    gearSlider.val(0);
    breakSlider.val(5);
    drivetrainSlider.val(5);

    // Updating object
    tune.boost = JSON.parse(boostSlider.val());
    tune.acceleration = JSON.parse(accelerationSlider.val());
    tune.gearchange = JSON.parse(gearSlider.val());
    tune.breaking = JSON.parse(breakSlider.val());
    tune.drivetrain = JSON.parse(drivetrainSlider.val());

  });

    $("#sportTuneButton").click(function () {

      // Updating on UI
      boostSlider.val(10);
      accelerationSlider.val(10);
      gearSlider.val(10);
      breakSlider.val(5);
      drivetrainSlider.val(5);

      // Updating object
      tune.boost = JSON.parse(boostSlider.val());
      tune.acceleration = JSON.parse(accelerationSlider.val());
      tune.gearchange = JSON.parse(gearSlider.val());
      tune.breaking = JSON.parse(breakSlider.val());
      tune.drivetrain = JSON.parse(drivetrainSlider.val());

    });


  boostSlider.on("input", (event) => {
    tune.boost = JSON.parse($(event.target).val());
  });

  accelerationSlider.on("input", (event) => {
    tune.acceleration = JSON.parse($(event.target).val());
  });

  gearSlider.on("input", (event) => {
    tune.gearchange = JSON.parse($(event.target).val());
  });

  breakSlider.on("input", (event) => {
    tune.breaking = JSON.parse($(event.target).val());
  });

  drivetrainSlider.on("input", (event) => {
    tune.drivetrain = JSON.parse($(event.target).val());
  });

});