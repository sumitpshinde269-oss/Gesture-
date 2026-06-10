/**
 * gestureDetector.js — hand gesture classification from MediaPipe landmarks.
 */

import { distance } from '../utils/index.js'

const WRIST = 0
const THUMB_TIP = 4
const THUMB_IP = 3
const INDEX_TIP = 8
const INDEX_PIP = 6
const MIDDLE_TIP = 12
const MIDDLE_PIP = 10
const RING_TIP = 16
const RING_PIP = 14
const PINKY_TIP = 20
const PINKY_PIP = 18

const GESTURES = {
  open_palm: 'Open Palm',
  fist: 'Fist',
  peace: 'Peace Sign',
  pinch: 'Pinch',
}

function isFingerExtended(lm, tipIdx, pipIdx) {
  const tipDist = distance(lm[tipIdx], lm[WRIST])
  const pipDist = distance(lm[pipIdx], lm[WRIST])
  return tipDist > pipDist * 1.02
}

function isThumbExtended(lm) {
  return distance(lm[THUMB_TIP], lm[WRIST]) > distance(lm[THUMB_IP], lm[WRIST]) * 1.01
}

/**
 * @param {Array<{x:number,y:number,z:number}>} landmarks
 */
export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null

  const indexUp = isFingerExtended(landmarks, INDEX_TIP, INDEX_PIP)
  const middleUp = isFingerExtended(landmarks, MIDDLE_TIP, MIDDLE_PIP)
  const ringUp = isFingerExtended(landmarks, RING_TIP, RING_PIP)
  const pinkyUp = isFingerExtended(landmarks, PINKY_TIP, PINKY_PIP)
  const thumbUp = isThumbExtended(landmarks)

  const pinchDist = distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP])
  const isPinch = pinchDist < 0.08 && !middleUp && !ringUp

  let name = null
  let confidence = 0.75

  // Order matters — most specific first
  if (isPinch) {
    name = 'pinch'
    confidence = 0.92
  } else if (indexUp && middleUp && !ringUp && !pinkyUp) {
    name = 'peace'
    confidence = 0.88
  } else if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
    name = 'fist'
    confidence = 0.85
  } else if (indexUp && middleUp && (ringUp || pinkyUp)) {
    name = 'open_palm'
    confidence = 0.87
  } else if (indexUp && middleUp && ringUp && pinkyUp) {
    name = 'open_palm'
    confidence = 0.9
  }

  if (!name) return null

  const center = {
    x: (landmarks[WRIST].x + landmarks[INDEX_TIP].x + landmarks[MIDDLE_TIP].x) / 3,
    y: (landmarks[WRIST].y + landmarks[INDEX_TIP].y + landmarks[MIDDLE_TIP].y) / 3,
  }

  return { name, label: GESTURES[name], confidence, center }
}

/**
 * @param {import('@mediapipe/tasks-vision').HandLandmarkerResult | null} result
 */
export function detectGesturesFromResult(result) {
  if (!result?.landmarks?.length) return null

  let best = null
  for (const hand of result.landmarks) {
    const g = detectGesture(hand)
    if (g && (!best || g.confidence > best.confidence)) best = g
  }
  return best
}

export { GESTURES }
