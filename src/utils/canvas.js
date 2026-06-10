/**
 * canvas.js — canvas sizing utilities (shared by overlay + VFX engine).
 */

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
