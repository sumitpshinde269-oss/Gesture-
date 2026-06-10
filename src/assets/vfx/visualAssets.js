/**
 * visualAssets.js — preloads SVG VFX sprites (failures are non-fatal).
 */

import auraRuneUrl from './aura-rune.svg?url'
import curseSigilUrl from './curse-sigil.svg?url'
import lightningCoreUrl from './lightning-core.svg?url'
import blastRingUrl from './blast-ring.svg?url'

/** @type {Record<string, HTMLImageElement | null>} */
const cache = {
  auraRune: null,
  curseSigil: null,
  lightningCore: null,
  blastRing: null,
}

let loadPromise = null

function loadImage(key, url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      cache[key] = img
      resolve(img)
    }
    img.onerror = () => {
      console.warn(`[visualAssets] failed to load ${key}`)
      resolve(null)
    }
    img.src = url
  })
}

/** Preload all VFX sprite assets. Never rejects. */
export function preloadVisualAssets() {
  if (!loadPromise) {
    loadPromise = Promise.all([
      loadImage('auraRune', auraRuneUrl),
      loadImage('curseSigil', curseSigilUrl),
      loadImage('lightningCore', lightningCoreUrl),
      loadImage('blastRing', blastRingUrl),
    ]).then(() => true)
  }
  return loadPromise
}

export function getVisualAsset(name) {
  return cache[name] ?? null
}

export function drawSprite(ctx, img, x, y, size, rotation, alpha = 1) {
  if (!img?.complete) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.drawImage(img, -size / 2, -size / 2, size, size)
  ctx.restore()
}
