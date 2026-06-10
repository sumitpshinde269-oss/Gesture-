/**
 * gestureDetector.js
 * ==================
 * Real-time hand gesture classification using geometric finger analysis.
 * Uses fingertip–PIP–MCP angles, hand-scale-normalized pinch, and score voting.
 */

import { clamp, distance } from '../utils/index.js'
import { getHandCenter, getHandScale } from '../utils/scaling.js'

// MediaPipe hand landmark indices
const WRIST = 0
const THUMB_CMC = 1
const THUMB_MCP = 2
const THUMB_IP = 3
const THUMB_TIP = 4
const INDEX_MCP = 5
const INDEX_PIP = 6
const INDEX_TIP = 8
const MIDDLE_MCP = 9
const MIDDLE_PIP = 10
const MIDDLE_TIP = 12
const RING_MCP = 13
const RING_PIP = 14
const RING_TIP = 16
const PINKY_MCP = 17
const PINKY_PIP = 18
const PINKY_TIP = 20

const GESTURES = {
  open_palm: 'Open Palm',
  fist: 'Fist',
  peace: 'Peace Sign',
  pinch: 'Pinch',
}

const SCORE_THRESHOLD = 0.52

/**
 * Finger extended: tip is farther from MCP than PIP is, and tip–PIP segment is long enough.
 */
function isFingerExtended(lm, tip, pip, mcp) {
  const tipToPip = distance(lm[tip], lm[pip])
  const pipToMcp = distance(lm[pip], lm[mcp])
  const tipToMcp = distance(lm[tip], lm[mcp])
  const tipToWrist = distance(lm[tip], lm[WRIST])
  const pipToWrist = distance(lm[pip], lm[WRIST])

  return tipToPip > pipToMcp * 0.72 && tipToMcp > pipToMcp * 1.05 && tipToWrist > pipToWrist * 1.01
}

/**
 * Finger curled: tip is close to MCP (folded).
 */
function isFingerCurled(lm, tip, pip, mcp) {
  const tipToMcp = distance(lm[tip], lm[mcp])
  const pipToMcp = distance(lm[pip], lm[mcp])
  return tipToMcp < pipToMcp * 1.15
}

function isThumbExtended(lm) {
  const tipToIp = distance(lm[THUMB_TIP], lm[THUMB_IP])
  const ipToMcp = distance(lm[THUMB_IP], lm[THUMB_MCP])
  const tipToWrist = distance(lm[THUMB_TIP], lm[WRIST])
  const ipToWrist = distance(lm[THUMB_IP], lm[WRIST])
  return tipToIp > ipToMcp * 0.65 && tipToWrist > ipToWrist * 1.02
}

function isThumbCurled(lm) {
  const tipToMcp = distance(lm[THUMB_TIP], lm[THUMB_MCP])
  const ipToMcp = distance(lm[THUMB_IP], lm[THUMB_MCP])
  return tipToMcp < ipToMcp * 1.25
}

/**
 * @param {Array<{x:number,y:number,z?:number}>} lm
 */
function analyzeFingers(lm) {
  return {
    thumb: {
      extended: isThumbExtended(lm),
      curled: isThumbCurled(lm),
    },
    index: {
      extended: isFingerExtended(lm, INDEX_TIP, INDEX_PIP, INDEX_MCP),
      curled: isFingerCurled(lm, INDEX_TIP, INDEX_PIP, INDEX_MCP),
    },
    middle: {
      extended: isFingerExtended(lm, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP),
      curled: isFingerCurled(lm, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP),
    },
    ring: {
      extended: isFingerExtended(lm, RING_TIP, RING_PIP, RING_MCP),
      curled: isFingerCurled(lm, RING_TIP, RING_PIP, RING_MCP),
    },
    pinky: {
      extended: isFingerExtended(lm, PINKY_TIP, PINKY_PIP, PINKY_MCP),
      curled: isFingerCurled(lm, PINKY_TIP, PINKY_PIP, PINKY_MCP),
    },
  }
}

function countExtended(fingers) {
  return ['index', 'middle', 'ring', 'pinky'].filter((f) => fingers[f].extended).length
}

function countCurled(fingers) {
  return ['index', 'middle', 'ring', 'pinky', 'thumb'].filter((f) => fingers[f].curled).length
}

/**
 * Score each gesture 0–1 from finger geometry.
 */
function scoreGestures(lm, fingers, handScale) {
  const pinchDist = distance(lm[THUMB_TIP], lm[INDEX_TIP])
  const pinchThreshold = clamp(0.065 * (1 / handScale), 0.04, 0.1)
  const indexMiddleSpread = distance(lm[INDEX_TIP], lm[MIDDLE_TIP])

  const pinchScore = clamp(
    1 - pinchDist / pinchThreshold,
    0,
    1,
  ) * (fingers.middle.curled ? 1 : 0.5) * (fingers.ring.curled ? 1 : 0.6)

  const peaceScore =
    (fingers.index.extended ? 0.35 : 0) +
    (fingers.middle.extended ? 0.35 : 0) +
    (fingers.ring.curled ? 0.15 : 0) +
    (fingers.pinky.curled ? 0.15 : 0) +
    (indexMiddleSpread > 0.035 ? 0.1 : 0) +
    (!fingers.thumb.extended ? 0.05 : 0)

  const extendedCount = countExtended(fingers)
  const curledCount = countCurled(fingers)

  const fistScore =
    (curledCount >= 4 ? 0.5 : curledCount * 0.12) +
    (extendedCount === 0 ? 0.45 : 0) +
    (!fingers.thumb.extended ? 0.05 : 0)

  const palmScore =
    (extendedCount >= 3 ? 0.35 + (extendedCount - 3) * 0.15 : extendedCount * 0.1) +
    (fingers.index.extended ? 0.15 : 0) +
    (fingers.middle.extended ? 0.15 : 0) +
    (fingers.ring.extended ? 0.12 : 0) +
    (fingers.pinky.extended ? 0.12 : 0) +
    (pinchDist > pinchThreshold * 1.5 ? 0.1 : 0)

  return {
    pinch: clamp(pinchScore, 0, 1),
    peace: clamp(peaceScore, 0, 1),
    fist: clamp(fistScore, 0, 1),
    open_palm: clamp(palmScore, 0, 1),
  }
}

/**
 * @param {Array<{x:number,y:number,z?:number}>} landmarks
 * @param {'Left'|'Right'|string} [handedness]
 */
export function detectGesture(landmarks, handedness = '') {
  if (!landmarks || landmarks.length < 21) return null

  const handScale = getHandScale(landmarks)
  const fingers = analyzeFingers(landmarks)
  const scores = scoreGestures(landmarks, fingers, handScale)

  let bestName = null
  let bestScore = 0
  for (const [name, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestName = name
    }
  }

  if (!bestName || bestScore < SCORE_THRESHOLD) return null

  const center = getHandCenter(landmarks)

  return {
    name: bestName,
    label: GESTURES[bestName],
    confidence: Math.round(bestScore * 100) / 100,
    center,
    handScale,
    landmarks,
    fingerState: fingers,
    scores,
    handedness,
  }
}

/**
 * @param {import('@mediapipe/tasks-vision').HandLandmarkerResult | null} result
 */
export function detectGesturesFromResult(result) {
  if (!result?.landmarks?.length) return null

  let best = null
  for (let i = 0; i < result.landmarks.length; i++) {
    const handedness =
      result.handedness?.[i]?.[0]?.categoryName ??
      result.handednesses?.[i]?.[0]?.categoryName ??
      ''
    const g = detectGesture(result.landmarks[i], handedness)
    if (g && (!best || g.confidence > best.confidence)) best = g
  }
  return best
}

export { GESTURES, analyzeFingers }

/** Skeleton connections for visual overlay */
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

export const FINGER_TIPS = [4, 8, 12, 16, 20]
