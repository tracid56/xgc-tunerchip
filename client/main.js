// Variables
let isGuiOpen = false;
let defaultVehicleValues = [];
let currentVehicleTable = [];

if (!config.disableCommand) {
  RegisterCommand("tuner", () => {
    emit("xgc-tuner:openTuner")
  });
}

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

      let defaultTuneSettings = {
        plate: vehiclePlate,
        boost: 0,
        acceleration: 0,
        gearchange: 0,
        breaking: 5,
        drivetrain: 5,
      }

      currentVehicleTable.push(defaultTuneSettings);

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
  let { boost, acceleration, gearchange, breaking, drivetrain, plate } = data; 
  let index = currentVehicleTable.findIndex(e => e.plate === plate);
  currentVehicleTable[index].boost = boost;
  currentVehicleTable[index].acceleration = acceleration;
  currentVehicleTable[index].gearchange = gearchange;
  currentVehicleTable[index].breaking = breaking;
  currentVehicleTable[index].drivetrain = drivetrain;

  applyBoost(boost, acceleration, plate);
  applyGearChange(gearchange, plate);
  applyBreaks(breaking, plate);
  applyDriveTrain(drivetrain, plate);
}

function applyGearChange(gearchange, plate) {
  let index = currentVehicleTable.findIndex(e => e.plate === plate);  
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));
  if (gearchange !== 0) {
    let newScaleUp = defaultVehicleValues[index].fClutchChangeRateScaleUpShift + gearchange;
    let newScaleDown = defaultVehicleValues[index].fClutchChangeRateScaleUpShift + gearchange;
    let newDrag = defaultVehicleValues[index].fInitialDragCoeff + (gearchange / 50);
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
  if (drivetrain !== 5) {
    let newDriveTrain = (drivetrain / 10)
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveBiasFront", newDriveTrain)
  } else {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveBiasFront", defaultVehicleValues[index].fDriveBiasFront)
  }
}

function applyBreaks(breaking, plate) {
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));
  let index = defaultVehicleValues.findIndex(e => e.plate === plate)
  if (breaking !== 5) {
    let newBreaking = (breaking /10);
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fBrakeBiasFront", newBreaking)
  } else {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fBrakeBiasFront", defaultVehicleValues[index].fBrakeBiasFront)
  }
}

function applyBoost(boost, acceleration, plate) {
  let vehicle = GetVehiclePedIsUsing(GetPlayerPed(-1));
  let index = defaultVehicleValues.findIndex(e => e.plate === plate)

  if (boost === 0) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", defaultVehicleValues[index].fInitialDriveForce)
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fLowSpeedTractionLossMult", defaultVehicleValues[index].fLowSpeedTractionLossMult)
  }

  let defBoost = defaultVehicleValues[index].fInitialDriveForce;
  let defTrac = defaultVehicleValues[index].fLowSpeedTractionLossMult;
  let newBoost = defBoost + defBoost * (boost / 200)
  let newTraction = defTrac - defTrac * (boost / 20);

  SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", newBoost);
  SetVehicleHandlingFloat(vehicle, "CHandlingData", "fLowSpeedTractionLossMult", newTraction);


  if (acceleration === 0 && boost === 0) {
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveInertia", defaultVehicleValues[index].fDriveInertia)
  } else {
    let defaultBoost = GetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce");
    let newForce = (defaultBoost + defaultBoost) * (acceleration / 200);

    let newInteria = defaultVehicleValues[index].fDriveInertia - defaultVehicleValues[index].fDriveInertia * (acceleration / 30);

    if (newInteria < 0.5) newInteria = 0.5;
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fInitialDriveForce", newForce)
    SetVehicleHandlingFloat(vehicle, "CHandlingData", "fDriveInertia", newInteria)

  }
}

function closeTuneGui() {
  isGuiOpen = false;
  SetNuiFocus(false, false);
  SendNuiMessage(JSON.stringify({ type: "tunerchip-ui", display: false }));
}


RegisterNuiCallbackType("closeTuner");
on("__cfx_nui:closeTuner", (data, cb) => {
  closeTuneGui()
  cb("ok")
});

RegisterNuiCallbackType("saveTune");
on("__cfx_nui:saveTune", (data, cb) => {
  applyTune(data);
  closeTuneGui()
  cb("ok")
});