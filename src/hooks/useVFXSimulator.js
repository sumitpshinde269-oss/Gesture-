/**
 * useVFXSimulator.js — real-time hand tracking with smoothing + stable gestures.
 */

import { useEffect, useRef, useState } from 'react'
import {
  initHandTracker,
  detectHands,
  destroyHandTracker,
  isHandTrackerReady,
} from '../handTracking/handTracker.js'
import { detectGesturesFromResult } from '../gestureDetection/gestureDetector.js'
import { smoothAllHands, smoothPoint } from '../gestureDetection/landmarkSmoother.js'
import { GestureStabilizer } from '../gestureDetection/gestureStabilizer.js'
import {
  initVFXEngine,
  syncVFXCanvas,
  renderFrame,
  triggerEffectBurst,
  sustainGestureVFX,
  clearSustainedVFX,
  destroyVFXEngine,
} from '../vfxEngine/vfxEngine.js'
import { syncCanvasSize } from '../utils/canvas.js'
import { isVideoPlaying } from '../webcam/webcamEngine.js'
import { preloadVisualAssets } from '../assets/vfx/visualAssets.js'

const BOOT_RETRIES = 60
const BOOT_RETRY_MS = 80

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function getVideoEl() {
  return document.getElementById('webcam-video')
}

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
  const stabilizerRef = useRef(new GestureStabilizer())
  const smoothedHandsRef = useRef(null)
  const smoothedCenterRef = useRef(null)
  const lastHudUpdateRef = useRef(0)

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
            preloadVisualAssets().catch(() => {})
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
      stabilizerRef.current.reset()
      smoothedHandsRef.current = null
      smoothedCenterRef.current = null
      lastGestureRef.current = null
      setTrackerStatus('idle')
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
      const rawLandmarks = result?.landmarks ?? null

      // Smooth landmarks every animation frame (even when video frame is unchanged)
      smoothedHandsRef.current = smoothAllHands(
        smoothedHandsRef.current,
        rawLandmarks,
        0.62,
      )

      const smoothedResult = smoothedHandsRef.current
        ? { ...result, landmarks: smoothedHandsRef.current }
        : result

      setHandCount(smoothedHandsRef.current?.length ?? 0)

      const rawGesture = detectGesturesFromResult(smoothedResult)
      let active = stabilizerRef.current.update(rawGesture)

      if (active?.center) {
        smoothedCenterRef.current = smoothPoint(smoothedCenterRef.current, active.center, 0.48)
        active = { ...active, center: { ...smoothedCenterRef.current } }
      } else {
        smoothedCenterRef.current = null
      }

      // Update React HUD at most ~20 Hz to avoid unnecessary re-renders
      if (timestamp - lastHudUpdateRef.current > 50) {
        setGesture(active)
        lastHudUpdateRef.current = timestamp
      }

      if (active?.stable !== false && active) {
        const hs = active.handScale ?? 1
        if (active.name !== lastGestureRef.current) {
          triggerEffectBurst(active.name, active.center, hs)
          lastGestureRef.current = active.name
        }
        sustainGestureVFX(active.name, active.center, timestamp, hs)
      } else {
        if (lastGestureRef.current) clearSustainedVFX()
        lastGestureRef.current = null
      }

      renderFrame(timestamp, smoothedHandsRef.current, active)

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
