// Fault injector flags read by sim engine.
export const faults = {
  connectionLost: false,
  slamDegraded: false,
  perceptionLost: false,
  lowBattery: false,
}

export function setFault(key, val) {
  if (key in faults) faults[key] = val
}

export function clearFaults() {
  faults.connectionLost = false
  faults.slamDegraded = false
  faults.perceptionLost = false
  faults.lowBattery = false
}
