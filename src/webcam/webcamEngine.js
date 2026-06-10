/**
 * webcamEngine.js
 * ===============
 * Handles all webcam-related logic.
 */

/**
 * @returns {Promise<MediaStream>}
 */
export async function requestWebcamStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('getUserMedia not supported'), { name: 'NotSupportedError' })
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      width:  { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
    audio: false,
  })
}

/**
 * Wait for video metadata with timeout.
 * @param {HTMLVideoElement} videoEl
 * @param {number} timeoutMs
 */
function waitForMetadata(videoEl, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (videoEl.readyState >= 1 && videoEl.videoWidth > 0) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Video metadata timeout'))
    }, timeoutMs)

    const onReady = () => {
      cleanup()
      resolve()
    }

    const cleanup = () => {
      clearTimeout(timeout)
      videoEl.removeEventListener('loadedmetadata', onReady)
      videoEl.removeEventListener('loadeddata', onReady)
    }

    videoEl.addEventListener('loadedmetadata', onReady, { once: true })
    videoEl.addEventListener('loadeddata', onReady, { once: true })
  })
}

/**
 * @param {HTMLVideoElement} videoEl
 * @param {MediaStream} stream
 */
export async function attachStreamToVideo(videoEl, stream) {
  videoEl.muted = true
  videoEl.playsInline = true
  videoEl.setAttribute('playsinline', '')
  videoEl.autoplay = true

  if (videoEl.srcObject !== stream) {
    videoEl.srcObject = stream
  }

  await waitForMetadata(videoEl)

  if (videoEl.paused) {
    try {
      await videoEl.play()
    } catch (playErr) {
      // One retry after a frame — common autoplay race
      await new Promise((r) => requestAnimationFrame(r))
      await videoEl.play()
    }
  }
}

/**
 * @param {HTMLVideoElement} videoEl
 */
export function isVideoPlaying(videoEl) {
  return (
    !!videoEl &&
    !!videoEl.srcObject &&
    videoEl.readyState >= 2 &&
    videoEl.videoWidth > 0 &&
    !videoEl.paused
  )
}

/**
 * @param {MediaStream | null} stream
 */
export function stopWebcamStream(stream) {
  if (!stream) return
  stream.getTracks().forEach((track) => track.stop())
}

/**
 * @param {MediaStream} stream
 */
export function getStreamInfo(stream) {
  if (!stream) return null
  const [videoTrack] = stream.getVideoTracks()
  if (!videoTrack) return null

  const settings = videoTrack.getSettings()
  return {
    width:  settings.width  ?? 0,
    height: settings.height ?? 0,
    label:  videoTrack.label ?? 'Unknown Camera',
  }
}
