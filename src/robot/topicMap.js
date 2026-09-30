// Central topic map — ONLY file allowed to name ROS topics (future use).
// UI components must never import topic strings.
export const TOPIC_MAP = {
  pose: 'VITE_ROS_POSE_TOPIC',
  path: 'VITE_ROS_PATH_TOPIC',
  costmap: 'VITE_ROS_COSTMAP_TOPIC',
  detections: 'VITE_ROS_DETECTIONS_TOPIC',
  pointcloud: 'VITE_ROS_CLOUD_TOPIC',
  image: 'VITE_ROS_IMAGE_TOPIC',
}

export function topicFor(key) {
  return import.meta.env[TOPIC_MAP[key]] || `/ugv/${key}`
}
