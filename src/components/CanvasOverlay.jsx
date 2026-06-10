/**
 * CanvasOverlay.jsx — fullscreen transparent VFX canvas.
 */

import React, { useEffect } from 'react'

/** @param {HTMLCanvasElement} canvas */
export function syncCanvasSize(canvas) {
  const w = canvas.clientWidth || window.innerWidth
  const h = canvas.clientHeight || window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  const pixelW = Math.round(w * dpr)
  const pixelH = Math.round(h * dpr)

  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW
    canvas.height = pixelH
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  return { width: w, height: h, dpr }
}

export function CanvasOverlay({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    syncCanvasSize(canvas)

    const observer = new ResizeObserver(() => syncCanvasSize(canvas))
    const onResize = () => syncCanvasSize(canvas)
    observer.observe(canvas)
    window.addEventListener('resize', onResize)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [canvasRef])

  return (
    <canvas
      ref={canvasRef}
      id="vfx-canvas"
      className="vfx-canvas"
      aria-label="VFX effects overlay canvas"
      aria-hidden="true"
    />
  )
}
