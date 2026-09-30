// RobotDataProvider interface (JSDoc). UI depends on this, not on mock/ROS directly.
/**
 * @typedef {{x:number,y:number,yaw:number,v:number,w:number,confidence:number}} PoseMsg
 * @typedef {{v:number,w:number,headingDeg:number,battery:number,latencyMs:number,locConfidence:number,pose:PoseMsg}} TelemetryMsg
 * @typedef {{id:string,label:string,confidence:number,distM:number,angle:number}} DetectionMsg
 * @typedef {{x:number,y:number,r:number,kind:string,label:string}} ObstacleMsg
 * Provider must emit NORMALIZED UI models (never raw ROS messages).
 * Methods: connect(), disconnect(), onSnapshot(cb) returns unsubscribe.
 */
export class RobotDataProvider {
  connect() { throw new Error('not implemented') }
  disconnect() {}
  onSnapshot() { return () => {} }
}
