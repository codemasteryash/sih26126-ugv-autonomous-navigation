// Autonomy state machine: single source of truth for allowed transitions.
// IDLE -> INITIALIZING -> LOCALIZING -> READY -> NAVIGATING ⇄ OBSTACLE_DETECTED -> REPLANNING
// PAUSED from NAVIGATING/REPLANNING/OBSTACLE_DETECTED. ERROR from any. EMERGENCY_STOP overrides all.

export const AUTONOMY_STATES = [
  'IDLE', 'INITIALIZING', 'LOCALIZING', 'READY', 'NAVIGATING',
  'OBSTACLE_DETECTED', 'REPLANNING', 'PAUSED', 'GOAL_REACHED', 'ERROR', 'EMERGENCY_STOP',
]

const TRANSITIONS = {
  IDLE: ['INITIALIZING', 'ERROR', 'EMERGENCY_STOP'],
  INITIALIZING: ['LOCALIZING', 'ERROR', 'EMERGENCY_STOP', 'IDLE'],
  LOCALIZING: ['READY', 'ERROR', 'EMERGENCY_STOP', 'IDLE'],
  READY: ['NAVIGATING', 'ERROR', 'EMERGENCY_STOP', 'IDLE'],
  NAVIGATING: ['OBSTACLE_DETECTED', 'PAUSED', 'GOAL_REACHED', 'ERROR', 'EMERGENCY_STOP', 'IDLE'],
  OBSTACLE_DETECTED: ['REPLANNING', 'PAUSED', 'ERROR', 'EMERGENCY_STOP'],
  REPLANNING: ['NAVIGATING', 'PAUSED', 'ERROR', 'EMERGENCY_STOP'],
  PAUSED: ['NAVIGATING', 'REPLANNING', 'ERROR', 'EMERGENCY_STOP', 'IDLE'],
  GOAL_REACHED: ['IDLE', 'INITIALIZING', 'EMERGENCY_STOP'],
  ERROR: ['IDLE', 'INITIALIZING', 'EMERGENCY_STOP'],
  EMERGENCY_STOP: ['IDLE'],
}

export function canTransition(from, to) {
  if (to === 'EMERGENCY_STOP') return from !== 'EMERGENCY_STOP'
  return (TRANSITIONS[from] || []).includes(to)
}

export const STATE_META = {
  IDLE: { color: '#7d8ea6', label: 'IDLE' },
  INITIALIZING: { color: '#22d3ee', label: 'INITIALIZING' },
  LOCALIZING: { color: '#22d3ee', label: 'LOCALIZING' },
  READY: { color: '#22d3ee', label: 'READY' },
  NAVIGATING: { color: '#34d399', label: 'NAVIGATING' },
  OBSTACLE_DETECTED: { color: '#fbbf24', label: 'OBSTACLE DETECTED' },
  REPLANNING: { color: '#a78bfa', label: 'REPLANNING' },
  PAUSED: { color: '#fbbf24', label: 'PAUSED' },
  GOAL_REACHED: { color: '#34d399', label: 'GOAL REACHED' },
  ERROR: { color: '#f87171', label: 'ERROR' },
  EMERGENCY_STOP: { color: '#ef4444', label: 'EMERGENCY STOP' },
}
