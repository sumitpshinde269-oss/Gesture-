/**
 * useWebcam.js — manages webcam lifecycle with callback-ref attachment.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  requestWebcamStream,
  attachStreamToVideo,
  stopWebcamStream,
  getStreamInfo,
  isVideoPlaying,
} from '../webcam/webcamEngine'

const ATTACH_RETRIES = 40
const ATTACH_RETRY_MS = 50

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useWebcam() {
  const videoElRef = useRef(null)
  const streamRef = useRef(null)
  const attachGenRef = useRef(0)

  const [status, setStatus] = useState('requesting')
  const [error, setError] = useState(null)
  const [streamInfo, setStreamInfo] = useState(null)

  const tryAttach = useCallback(async (videoEl, stream, gen) => {
    if (!videoEl || !stream || gen !== attachGenRef.current) return false
    await attachStreamToVideo(videoEl, stream)
    if (gen !== attachGenRef.current) return false
    if (!isVideoPlaying(videoEl)) return false
    setStreamInfo(getStreamInfo(stream))
    setStatus('active')
    setError(null)
    return true
  }, [])

  /** Callback ref — attaches stream the instant <video> mounts */
  const setVideoRef = useCallback((node) => {
    videoElRef.current = node
    const stream = streamRef.current
    if (!node || !stream) return
    const gen = attachGenRef.current
    tryAttach(node, stream, gen).catch((err) => {
      console.error('[useWebcam] callback-ref attach failed:', err)
    })
  }, [tryAttach])

  useEffect(() => {
    let cancelled = false
    let localStream = null
    const gen = ++attachGenRef.current

    async function startWebcam() {
      setStatus('requesting')
      setError(null)

      try {
        localStream = await requestWebcamStream()
        if (cancelled) {
          stopWebcamStream(localStream)
          return
        }

        streamRef.current = localStream

        // Retry until video element exists and is playing
        for (let i = 0; i < ATTACH_RETRIES; i++) {
          if (cancelled || gen !== attachGenRef.current) return

          const el = videoElRef.current ?? document.getElementById('webcam-video')
          if (el) {
            const ok = await tryAttach(el, localStream, gen)
            if (ok) return
          }
          await delay(ATTACH_RETRY_MS)
        }

        throw Object.assign(new Error('Could not attach stream to video element'), {
          name: 'AttachError',
        })
      } catch (err) {
        if (cancelled || gen !== attachGenRef.current) return

        let message = 'Could not access webcam.'
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          message = 'Camera permission denied. Please allow access and refresh.'
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'No camera found. Please connect a webcam and refresh.'
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Camera is in use by another application. Close other apps using the camera and retry.'
        } else if (err.name === 'AttachError') {
          message = 'Camera stream received but video failed to start. Please refresh.'
        }

        stopWebcamStream(localStream)
        streamRef.current = null
        setError(message)
        setStatus('error')
        console.error('[useWebcam] Error:', err)
      }
    }

    startWebcam()

    return () => {
      cancelled = true
      attachGenRef.current += 1
      const stream = streamRef.current
      streamRef.current = null
      setTimeout(() => {
        if (!streamRef.current) stopWebcamStream(stream)
      }, 250)
    }
  }, [tryAttach])

  return { videoRef: setVideoRef, status, error, streamInfo }
}
