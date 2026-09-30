// Future ROS 2 integration stub — do NOT implement in mock phase.
// Will use `roslib` + rosbridge_server. Must implement same surface as MockRobotDataProvider.
import { RobotDataProvider } from './RobotDataProvider.js'
import { RobotCommandProvider } from './RobotCommandProvider.js'

export class RosRobotDataProvider extends RobotDataProvider {
  connect() { console.warn('[ROS stub] RosRobotDataProvider not implemented — set VITE_ROBOT_PROVIDER=mock'); return () => {} }
}

export class RosRobotCommandProvider extends RobotCommandProvider {
  constructor() { super(null) }
}
