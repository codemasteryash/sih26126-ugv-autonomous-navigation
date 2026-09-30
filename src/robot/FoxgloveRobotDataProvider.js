// Future Foxglove Bridge integration stub.
// Will use @foxglove/ws-protocol (CBOR binary) for ZED pointcloud/images.
import { RobotDataProvider } from './RobotDataProvider.js'
import { RobotCommandProvider } from './RobotCommandProvider.js'

export class FoxgloveRobotDataProvider extends RobotDataProvider {
  connect() { console.warn('[Foxglove stub] not implemented — set VITE_ROBOT_PROVIDER=mock'); return () => {} }
}

export class FoxgloveRobotCommandProvider extends RobotCommandProvider {
  constructor() { super(null) }
}
