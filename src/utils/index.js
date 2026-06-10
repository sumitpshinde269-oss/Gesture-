/**
 * utils/index.js
 * ==============
 * General-purpose utility functions used across the app.
 *
 * Keep this file lightweight — only pure helper functions,
 * no imports from React or browser APIs.
 */

/**
 * Clamps a number between a minimum and maximum value.
 * Useful for keeping values within canvas bounds.
 *
 * @param {number} value - The value to clamp
 * @param {number} min   - Lower bound
 * @param {number} max   - Upper bound
 * @returns {number}
 *
 * @example
 *   clamp(150, 0, 100) → 100
 *   clamp(-5,  0, 100) → 0
 *   clamp(42,  0, 100) → 42
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linearly interpolates between two values.
 * Great for smooth animations and transitions.
 *
 * @param {number} a   - Start value
 * @param {number} b   - End value
 * @param {number} t   - Interpolation factor (0 = a, 1 = b)
 * @returns {number}
 *
 * @example
 *   lerp(0, 100, 0.5) → 50
 *   lerp(0, 100, 0.1) → 10
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Generates a random number between min (inclusive) and max (exclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

/**
 * Converts degrees to radians.
 * Required for canvas arc/rotation operations.
 *
 * @param {number} deg - Angle in degrees
 * @returns {number}   - Angle in radians
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180
}

/**
 * Returns the distance between two 2D points.
 * Useful for detecting hand proximity or gesture zones.
 *
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
export function distance(a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Formats a number of bytes into a human-readable string.
 * For debugging memory usage in dev tools.
 *
 * @param {number} bytes
 * @returns {string}  e.g. "1.23 MB"
 */
export function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
