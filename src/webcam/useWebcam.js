/**
 * useWebcam.js — webcam lifecycle with retry support.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  requestWebcamStream,
  attachStreamToVideo,
  stopWebcamStream,
  getStreamInfo,
  isVideoPlaying,
} from '../webcam/webcamEngine'

const ATTACH_RETRIES = 50
const ATTACH_RETRY_MS = 80
const CAMERA_BUSY_RETRIES = 3
const CAMERA_BUSY_DELAY_MS = 600

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useWebcam() {
  const videoElRef = useRef(null)
  const streamRef = useRef(null)
  const attachGenRef = useRef(0)
  const [retryToken, setRetryToken] = useState(0)

  const [status, setStatus] = useState('requesting')
  const [error, setError] = useState(null)
  const [streamInfo, setStreamInfo] = useState(null)

  const retryCamera = useCallback(() => {
    stopWebcamStream(streamRef.current)
    streamRef.current = null
    attachGenRef.current += 1
    setError(null)
    setStatus('requesting')
    setRetryToken((n) => n + 1)
  }, [])

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

    async function acquireStream() {
      for (let attempt = 0; attempt < CAMERA_BUSY_RETRIES; attempt++) {
        try {
          return await requestWebcamStream()
        } catch (err) {
          const busy =
            err?.name === 'NotReadableError' ||
            err?.name === 'TrackStartError'
          if (!busy || attempt === CAMERA_BUSY_RETRIES - 1) throw err
          await delay(CAMERA_BUSY_DELAY_MS * (attempt + 1))
        }
      }
      return null
    }

    async function startWebcam() {
      setStatus('requesting')
      setError(null)

      try {
        localStream = await acquireStream()
        if (cancelled || !localStream) {
          stopWebcamStream(localStream)
          return
        }

        streamRef.current = localStream

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
          message = 'Camera permission denied. Click Retry and allow access.'
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          message = 'No camera found. Connect a webcam and click Retry.'
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          message = 'Camera is busy. Close other tabs/apps using the camera, then click Retry.'
        } else if (err.name === 'AttachError') {
          message = 'Camera connected but video failed to start. Click Retry.'
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
      stopWebcamStream(stream)
    }
  }, [tryAttach, retryToken])

  return { videoRef: setVideoRef, status, error, streamInfo, retryCamera }
}
