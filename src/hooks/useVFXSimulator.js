/**
 * useVFXSimulator.js — hand tracking + gesture → VFX render loop.
 */

import { useEffect, useRef, useState } from 'react'
import {
  initHandTracker,
  detectHands,
  destroyHandTracker,
  isHandTrackerReady,
} from '../handTracking/handTracker.js'
import { detectGesturesFromResult } from '../gestureDetection/gestureDetector.js'
import {
  initVFXEngine,
  syncVFXCanvas,
  renderFrame,
  triggerEffectBurst,
  sustainGestureVFX,
  clearSustainedVFX,
  destroyVFXEngine,
} from '../vfxEngine/vfxEngine.js'
import { syncCanvasSize } from '../components/CanvasOverlay.jsx'
import { isVideoPlaying } from '../webcam/webcamEngine.js'

const BOOT_RETRIES = 60
const BOOT_RETRY_MS = 80

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function getVideoEl() {
  return document.getElementById('webcam-video')
}

/**
 * @param {{ canvasRef: React.RefObject<HTMLCanvasElement | null>, enabled: boolean }} opts
 */
export function useVFXSimulator({ canvasRef, enabled }) {
  const [trackerStatus, setTrackerStatus] = useState('idle')
  const [trackerError, setTrackerError] = useState(null)
  const [gesture, setGesture] = useState(null)
  const [handCount, setHandCount] = useState(0)
  const [fps, setFps] = useState(0)

  const rafRef = useRef(null)
  const lastGestureRef = useRef(null)
  const fpsFramesRef = useRef(0)
  const fpsLastTimeRef = useRef(performance.now())

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function boot() {
      setTrackerStatus('loading')
      setTrackerError(null)

      for (let attempt = 0; attempt < BOOT_RETRIES; attempt++) {
        if (cancelled) return

        const video = getVideoEl()
        const canvas = canvasRef.current

        if (video && canvas && isVideoPlaying(video)) {
          try {
            syncCanvasSize(canvas)
            initVFXEngine(canvas)
            syncVFXCanvas(canvas)
            await initHandTracker(video)
            if (cancelled) return
            setTrackerStatus('ready')
            return
          } catch (err) {
            if (cancelled) return
            console.error('[useVFXSimulator] init failed:', err)
            setTrackerError(err?.message ?? 'Hand tracker failed to load')
            setTrackerStatus('error')
            return
          }
        }

        await delay(BOOT_RETRY_MS)
      }

      if (!cancelled) {
        setTrackerError('Video or canvas not ready — check camera permission')
        setTrackerStatus('error')
      }
    }

    boot()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      destroyHandTracker()
      destroyVFXEngine()
      setTrackerStatus('idle')
      lastGestureRef.current = null
    }
  }, [enabled, canvasRef])

  useEffect(() => {
    if (!enabled || trackerStatus !== 'ready') return

    let running = true

    function loop(timestamp) {
      if (!running) return

      const video = getVideoEl()
      const canvas = canvasRef.current

      if (!video || !canvas || !isHandTrackerReady() || !isVideoPlaying(video)) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const result = detectHands(video)
      const landmarks = result?.landmarks ?? null
      setHandCount(landmarks?.length ?? 0)

      const detected = detectGesturesFromResult(result)
      setGesture(detected)

      if (detected) {
        if (detected.name !== lastGestureRef.current) {
          triggerEffectBurst(detected.name, detected.center)
          lastGestureRef.current = detected.name
        }
        sustainGestureVFX(detected.name, detected.center, timestamp)
      } else {
        if (lastGestureRef.current) clearSustainedVFX()
        lastGestureRef.current = null
      }

      renderFrame(timestamp, landmarks)

      fpsFramesRef.current += 1
      const elapsed = timestamp - fpsLastTimeRef.current
      if (elapsed >= 1000) {
        setFps(Math.round((fpsFramesRef.current * 1000) / elapsed))
        fpsFramesRef.current = 0
        fpsLastTimeRef.current = timestamp
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [enabled, trackerStatus, canvasRef])

  return { trackerStatus, trackerError, gesture, handCount, fps }
}
