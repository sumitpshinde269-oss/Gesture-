/**
 * landmarkSmoother.js — exponential smoothing for jitter-free hand tracking.
 */

import { lerp } from '../utils/index.js'

/**
 * @param {Array<{x:number,y:number,z?:number}> | null} prev
 * @param {Array<{x:number,y:number,z?:number}>} curr
 * @param {number} [alpha=0.55] — 1 = no smooth, lower = smoother
 */
export function smoothLandmarks(prev, curr, alpha = 0.55) {
  if (!curr?.length) return null
  if (!prev || prev.length !== curr.length) {
    return curr.map((lm) => ({ x: lm.x, y: lm.y, z: lm.z ?? 0 }))
  }

  return curr.map((lm, i) => ({
    x: lerp(prev[i].x, lm.x, alpha),
    y: lerp(prev[i].y, lm.y, alpha),
    z: lerp(prev[i].z ?? 0, lm.z ?? 0, alpha),
  }))
}

/**
 * Smooths all hands in a detection result.
 * @param {Array<Array<{x:number,y:number,z?:number}>> | null} prevHands
 * @param {Array<Array<{x:number,y:number,z?:number}>> | null} currHands
 */
export function smoothAllHands(prevHands, currHands, alpha = 0.55) {
  if (!currHands?.length) return null

  return currHands.map((hand, i) => {
    const prev = prevHands?.[i] ?? null
    return smoothLandmarks(prev, hand, alpha)
  })
}

/**
 * Smooth palm center position between frames.
 */
export function smoothPoint(prev, curr, alpha = 0.45) {
  if (!curr) return prev
  if (!prev) return { ...curr }
  return {
    x: lerp(prev.x, curr.x, alpha),
    y: lerp(prev.y, curr.y, alpha),
  }
}
