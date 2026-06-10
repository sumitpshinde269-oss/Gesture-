/**
 * CanvasOverlay.jsx
 */

import React, { useEffect } from 'react'
import { syncCanvasSize } from '../utils/canvas.js'

export { syncCanvasSize }

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
    <div className="vfx-stage" aria-hidden="true">
      <canvas
        ref={canvasRef}
        id="vfx-canvas"
        className="vfx-canvas"
        aria-label="VFX effects overlay canvas"
      />
    </div>
  )
}
