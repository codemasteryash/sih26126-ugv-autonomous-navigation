// Command provider interface: all UI commands flow through here.
/**
 * Commands: startMission, pause, resume, abort, reset, eStop, clearEStop, setMode, setGoal
 * Each returns { accepted:boolean, reason?:string }
 */
export class RobotCommandProvider {
  constructor(dataProvider) { this.data = dataProvider }
  startMission() { return { accepted: false, reason: 'not implemented' } }
  pause() { return { accepted: false, reason: 'not implemented' } }
  resume() { return { accepted: false, reason: 'not implemented' } }
  abort() { return { accepted: false, reason: 'not implemented' } }
  reset() { return { accepted: false, reason: 'not implemented' } }
  eStop() { return { accepted: false, reason: 'not implemented' } }
  clearEStop() { return { accepted: false, reason: 'not implemented' } }
  setGoal() { return { accepted: false, reason: 'not implemented' } }
}
