// Variables
let isGuiOpen = false;
let defaultVehicleValues = [];
let currentVehicle = [];
let ESX = null;

emit("esx:getSharedObject", (obj) => ESX = obj);

RegisterCommand("tuner", () => {
  emit("xgc-tuner:openTuner")
});

RegisterNetEvent("xgc-tuner:openTuner")
AddEventHandler("xgc-tuner:openTuner", () => {
  if (isGuiOpen) return;
  let ped = GetPlayerPed(-1);
  let vehicle = GetVehiclePedIsUsing(ped);

  // Lets check if they're the driver
  if (GetPedInVehicleSeat(vehicle, -1) === ped) {
    let vehiclePlate = GetVehicleNumberPlateText(vehicle);
    let alreadyExist = defaultVehicleValues.findIndex(e => e.plate === vehiclePlate);

    if (alreadyExist < 0) {
      
      // Set the default values (for UI)
      currentVehicle.push({
        plate: vehiclePlate,
        boost: 0,
        acceleration: 0,
        gearchange: 0,
        braking: 5,
        drivetrain: 5,
      });

      defaultVehicleValues.push({
        plate: vehiclePlate,
        fInitialDriveForce: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce"),
        fClutchChangeRateScaleUpShift: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fClutchChangeRateScaleUpShift"),
        fClutchChangeRateScaleDownShift: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fClutchChangeRateScaleDownShift"),
        fBrakeBiasFront: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fBrakeBiasFront"),
        fDriveBiasFront: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveBiasFront"),
        fInitialDragCoeff: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDragCoeff"),
        fLowSpeedTractionLossMult: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fLowSpeedTractionLossMult"),
        fDriveInertia: GetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveInertia"),
      });

    }
    
    let tuneSettings = currentVehicle.find(e => e.plate === vehiclePlate);
    openTunerHud(tuneSettings)

  }

});



function openTunerHud(data) {
  isGuiOpen = true;
  SetNuiFocus(true, true);
  SendNuiMessage(JSON.stringify({ type: "tunerchip-ui", display: true, tune: JSON.stringify(data) }));
}

function applyTune(data) {
  let { boost, acceleration, gearchange, braking, drivetrain, plate } = data; 
  let index = currentVehicle.findIndex(e => e.plate === plate);
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));

  currentVehicle[index].boost = boost;
  currentVehicle[index].acceleration = acceleration;
  currentVehicle[index].gearchange = gearchange;
  currentVehicle[index].braking = braking;
  currentVehicle[index].drivetrain = drivetrain;

  // Gear change section
  if (gearchange !== 0) {
    let defScale = defaultVehicleValues[index].fClutchChangeRateScaleUpShift
    let newScaleUp = defScale + gearchange;
    let newScaleDown = defScale + gearchange;
    let newDrag = (gearchange / 50) + defaultVehicleValues[index].fInitialDragCoeff;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fClutchChangeRateScaleUpShift", newScaleUp)
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fClutchChangeRateScaleDownShift", newScaleDown)
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDragCoeff", newDrag)
  } else {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fClutchChangeRateScaleUpShift", defaultVehicleValues[index].fClutchChangeRateScaleUpShift)
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fClutchChangeRateScaleDownShift", defaultVehicleValues[index].fClutchChangeRateScaleDownShift)
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDragCoeff", defaultVehicleValues[index].fInitialDragCoeff)
  }

  // Drive train section
  if (drivetrain === 5) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveBiasFront", defaultVehicleValues[index].fDriveBiasFront)
  } else {
    let newDriveTrain = drivetrain / 10;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveBiasFront", newDriveTrain);
  }

  // Braking section
  if (braking === 5) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fBrakeBiasFront", defaultVehicleValues[index].fBrakeBiasFront)
  } else {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fBrakeBiasFront", braking / 10)
  }

  // Acceleration and boost section 
  if (boost === 0) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", defaultVehicleValues[index].fInitialDriveForce);
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fLowSpeedTractionLossMult", defaultVehicleValues[index].fLowSpeedTractionLossMult);
  } else {
    let newBoost = (boost / 200) * defaultVehicleValues[index].fInitialDriveForce + defaultVehicleValues[index].fInitialDriveForce;
    let newLoss = (boost / 20) * defaultVehicleValues[index].fLowSpeedTractionLossMult + defaultVehicleValues[index].fLowSpeedTractionLossMult;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", newBoost);
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fLowSpeedTractionLossMult", newLoss);
  }

  if (acceleration === 0 && boost === 0) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveInertia", defaultVehicleValues[index].fDriveInertia)
  } else {
    let newBoost = (acceleration / 200) * defaultVehicleValues[index].fInitialDriveForce + defaultVehicleValues[index].fInitialDriveForce;
    let newInter = (acceleration / 30) * defaultVehicleValues[index].fDriveInertia - defaultVehicleValues[index].fDriveInertia;
    if (newInter < 0.5) newInter = 0.5;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", newBoost);
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveInertia", newInter);
  };
}

// Close the tuner
function closeGUI() {
  isGuiOpen = false;
  SetNuiFocus(false, false);
  SendNuiMessage(JSON.stringify({ type: "tunerchip-ui", display: false }));
  ESX.UI.Menu.CloseAll() // This is incase you're using default or modified ESX Menu inventory.
}

// Close tuner callback
RegisterNuiCallbackType("closeTuner");
on("__cfx_nui:closeTuner", (data, cb) => {
  closeGUI()
  cb("ok")
});

// Save tune callback
RegisterNuiCallbackType("saveTune");
on("__cfx_nui:saveTune", (data, cb) => {
  applyTune(data);
  closeGUI()
  cb("ok")
});