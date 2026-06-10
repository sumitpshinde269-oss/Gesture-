/**
 * scaling.js — viewport + hand-size dynamic scaling for VFX placement.
 */

import { clamp, distance } from './index.js'

export const BASE_VIEWPORT = 1080

/** Scale factor from viewport (1.0 at 1080p short edge). */
export function getViewportScale(width, height) {
  if (!width || !height) return 1
  return Math.min(width, height) / BASE_VIEWPORT
}

/**
 * Hand openness scale from palm span (wrist → middle MCP).
 * @param {Array<{x:number,y:number,z?:number}> | null} landmarks
 */
export function getHandScale(landmarks) {
  if (!landmarks || landmarks.length < 21) return 1
  const palmSpan = distance(landmarks[0], landmarks[9])
  return clamp(palmSpan / 0.11, 0.7, 1.85)
}

/** Palm centroid from key landmarks. */
export function getHandCenter(landmarks) {
  if (!landmarks || landmarks.length < 21) return null
  const ids = [0, 5, 9, 13, 17]
  let x = 0
  let y = 0
  for (const i of ids) {
    x += landmarks[i].x
    y += landmarks[i].y
  }
  return { x: x / ids.length, y: y / ids.length }
}

/** Bounding box center + size in normalized coords. */
export function getHandBounds(landmarks) {
  if (!landmarks?.length) return null
  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0
  for (const lm of landmarks) {
    minX = Math.min(minX, lm.x)
    minY = Math.min(minY, lm.y)
    maxX = Math.max(maxX, lm.x)
    maxY = Math.max(maxY, lm.y)
  }
  return {
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function scaleValue(base, viewportScale, handScale = 1) {
  return base * viewportScale * handScale
}

export function getEffectScale(viewportW, viewportH, landmarks) {
  return {
    viewport: getViewportScale(viewportW, viewportH),
    hand: getHandScale(landmarks),
    combined: getViewportScale(viewportW, viewportH) * getHandScale(landmarks),
  }
}
