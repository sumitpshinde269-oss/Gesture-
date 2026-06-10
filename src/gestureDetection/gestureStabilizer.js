/**
 * gestureStabilizer.js — temporal filtering so gestures don't flicker frame-to-frame.
 */

const CONFIRM_FRAMES = 2
const RELEASE_FRAMES = 5

export class GestureStabilizer {
  constructor(confirmFrames = CONFIRM_FRAMES, releaseFrames = RELEASE_FRAMES) {
    this.confirmFrames = confirmFrames
    this.releaseFrames = releaseFrames
    this.confirmed = null
    this.candidate = null
    this.confirmCount = 0
    this.releaseCount = 0
  }

  /**
   * @param {{ name: string, label: string, confidence: number, center: object, handScale: number, landmarks: array, fingerState?: object } | null} raw
   */
  update(raw) {
    if (!raw) {
      this.releaseCount += 1
      this.confirmCount = 0
      this.candidate = null
      if (this.releaseCount >= this.releaseFrames) {
        this.confirmed = null
      }
      return this.confirmed
    }

    this.releaseCount = 0

    if (this.candidate?.name === raw.name) {
      this.confirmCount += 1
      this.candidate = raw
    } else {
      this.candidate = raw
      this.confirmCount = 1
    }

    if (this.confirmCount >= this.confirmFrames) {
      this.confirmed = {
        ...this.candidate,
        stable: true,
        holdFrames: (this.confirmed?.holdFrames ?? 0) + 1,
      }
    } else if (this.confirmed?.name === raw.name) {
      // Same gesture, still building re-confirm — keep showing last confirmed
      this.confirmed = {
        ...this.confirmed,
        center: raw.center,
        handScale: raw.handScale,
        landmarks: raw.landmarks,
        confidence: raw.confidence,
        fingerState: raw.fingerState,
        stable: true,
        holdFrames: (this.confirmed.holdFrames ?? 0) + 1,
      }
    } else {
      // Transitioning — show candidate as "detecting" with reduced confidence
      return {
        ...raw,
        stable: false,
        label: `${raw.label}…`,
      }
    }

    return this.confirmed
  }

  reset() {
    this.confirmed = null
    this.candidate = null
    this.confirmCount = 0
    this.releaseCount = 0
  }
}
