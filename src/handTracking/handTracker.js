/**
 * handTracker.js
 * ==============
 * MediaPipe Hand Landmarker integration for real-time hand tracking.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/** @type {HandLandmarker | null} */
let landmarker = null
let lastVideoTime = -1
/** @type {import('@mediapipe/tasks-vision').HandLandmarkerResult | null} */
let lastResult = null

async function createLandmarker(delegate) {
  const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate,
    },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
}

/**
 * Initializes the MediaPipe hand landmarker.
 * @param {HTMLVideoElement} videoEl - Webcam video element (used for dimension hints)
 * @returns {Promise<void>}
 */
export async function initHandTracker(videoEl) {
  if (landmarker) return

  try {
    landmarker = await createLandmarker('GPU')
  } catch (gpuErr) {
    console.warn('[HandTracker] GPU delegate failed, falling back to CPU:', gpuErr)
    landmarker = await createLandmarker('CPU')
  }

  lastVideoTime = -1
  lastResult = null
  void videoEl
}

/**
 * Detects hands in the current video frame.
 * @param {HTMLVideoElement} videoEl
 * @returns {import('@mediapipe/tasks-vision').HandLandmarkerResult | null}
 */
export function detectHands(videoEl) {
  if (!landmarker || !videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
    return lastResult
  }

  const now = performance.now()
  if (videoEl.currentTime === lastVideoTime && lastResult) {
    return lastResult
  }
  lastVideoTime = videoEl.currentTime

  lastResult = landmarker.detectForVideo(videoEl, now)
  return lastResult
}

/**
 * Releases hand tracker resources.
 */
export function destroyHandTracker() {
  if (landmarker) {
    landmarker.close()
    landmarker = null
  }
  lastVideoTime = -1
  lastResult = null
}

export function isHandTrackerReady() {
  return landmarker !== null
}
