// Variables
let isGuiOpen = false;
let defaultVehicleValues = [];
let currentVehicleTable = [];
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
      currentVehicleTable.push({
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
    
    let tuneSettings = currentVehicleTable.find(e => e.plate === vehiclePlate);
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
  let index = currentVehicleTable.findIndex(e => e.plate === plate);
  currentVehicleTable[index].boost = boost;
  currentVehicleTable[index].acceleration = acceleration;
  currentVehicleTable[index].gearchange = gearchange;
  currentVehicleTable[index].braking = braking;
  currentVehicleTable[index].drivetrain = drivetrain;

  applyBoost(boost, acceleration, plate);
  applyGearChange(gearchange, plate);
  applyBrakes(braking, plate);
  applyDriveTrain(drivetrain, plate);
}

function applyGearChange(gearchange, plate) {
  let index = currentVehicleTable.findIndex(e => e.plate === plate);  
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));
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
}

function applyDriveTrain(drivetrain, plate) {
  let index = currentVehicleTable.findIndex(e => e.plate === plate);
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));

  if (drivetrain === 5) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveBiasFront", defaultVehicleValues[index].fDriveBiasFront)
  } else {
    let newDriveTrain = drivetrain / 10;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveBiasFront", newDriveTrain);
  }

}

function applyBrakes(braking, plate) {
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));
  let index = defaultVehicleValues.findIndex(e => e.plate === plate)
  if (braking === 5) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fBrakeBiasFront", defaultVehicleValues[index].fBrakeBiasFront)
  } else {
    let newbraking = braking / 10;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fBrakeBiasFront", newbraking)
  }
}

function applyBoost(boost, acceleration, plate) {

  // Reused Variables
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));
  let index = defaultVehicleValues.findIndex(e => e.plate === plate)

  // Lets check if it's default value
  if (boost === 0) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", defaultVehicleValues[index].fInitialDriveForce);
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fLowSpeedTractionLossMult", defaultVehicleValues[index].fLowSpeedTractionLossMult);
  } else {
    let defBoost = defaultVehicleValues[index].fInitialDriveForce;
    let defLoss = defaultVehicleValues[index].fLowSpeedTractionLossMult;
    let newBoost = (boost / 200) * defBoost + defBoost;
    let newLoss = (boost / 20) * defLoss + defLoss;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", newBoost);
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fLowSpeedTractionLossMult", newLoss);
  }

  if (acceleration === 0 && boost === 0) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveInertia", defaultVehicleValues[index].fDriveInertia)
  } else {
    let defBoost = defaultVehicleValues[index].fInitialDriveForce;
    let defInter = defaultVehicleValues[index].fDriveInertia;
    let newBoost = (acceleration / 200) * defBoost + defBoost;
    let newInter = (acceleration / 30) * defInter - defInter;

    if (newInter < 0.5) {
      newInter = 0.5;
    }

    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", newBoost);
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveInertia", newInter);
  };
}

function closeTuneGui() {
  isGuiOpen = false;
  SetNuiFocus(false, false);
  SendNuiMessage(JSON.stringify({ type: "tunerchip-ui", display: false }));
  ESX.UI.Menu.CloseAll() // This is incase you're using default or modified ESX Menu inventory.
}



// Close tuner callback
RegisterNuiCallbackType("closeTuner");
on("__cfx_nui:closeTuner", (data, cb) => {
  closeTuneGui()
  cb("ok")
});

// Save tune callback
RegisterNuiCallbackType("saveTune");
on("__cfx_nui:saveTune", (data, cb) => {
  applyTune(data);
  closeTuneGui()
  cb("ok")
});