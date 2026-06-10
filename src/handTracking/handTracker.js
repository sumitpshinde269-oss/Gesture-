/**
 * handTracker.js — MediaPipe hand landmarker tuned for responsive tracking.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const WASM_BASE = '/mediapipe/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/** @type {HandLandmarker | null} */
let landmarker = null
let lastVideoTime = -1
/** @type {import('@mediapipe/tasks-vision').HandLandmarkerResult | null} */
let lastResult = null
let frameTimestamp = 0

async function createLandmarker(delegate) {
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE)
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.45,
    minHandPresenceConfidence: 0.45,
    minTrackingConfidence: 0.55,
  })
}

export async function initHandTracker(videoEl) {
  if (landmarker) return

  try {
    landmarker = await createLandmarker('GPU')
  } catch {
    landmarker = await createLandmarker('CPU')
  }

  lastVideoTime = -1
  lastResult = null
  frameTimestamp = 0
  void videoEl
}

export function detectHands(videoEl) {
  if (!landmarker || !videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
    return lastResult
  }

  frameTimestamp += 1
  const now = performance.now()

  // Re-use cached result only within the same video frame (avoid duplicate MediaPipe calls)
  if (videoEl.currentTime !== lastVideoTime) {
    lastVideoTime = videoEl.currentTime
    lastResult = landmarker.detectForVideo(videoEl, now)
  }

  return lastResult
}

export function destroyHandTracker() {
  if (landmarker) {
    landmarker.close()
    landmarker = null
  }
  lastVideoTime = -1
  lastResult = null
  frameTimestamp = 0
}

export function isHandTrackerReady() {
  return landmarker !== null
}
