/**
 * vfxEngine.js — high-visibility anime curse-energy VFX on canvas 2D.
 */

import { clamp, lerp, randomBetween } from '../utils/index.js'
import { normToCanvas } from '../utils/coordinates.js'

/** @type {CanvasRenderingContext2D | null} */
let ctx = null
/** @type {HTMLCanvasElement | null} */
let canvasEl = null
let logicalW = 0
let logicalH = 0

let particles = []
let shockwaves = []
let lightningBolts = []
/** @type {{ x: number, y: number, radius: number, rotation: number } | null} */
let activeAura = null
/** @type {{ x: number, y: number, angle: number, length: number } | null} */
let activeBeam = null
let peaceTimer = 0
let fistPulseTimer = 0
let frameCount = 0

/**
 * @param {HTMLCanvasElement} canvas
 */
export function initVFXEngine(canvas) {
  canvasEl = canvas
  syncVFXCanvas(canvas)
  ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
  particles = []
  shockwaves = []
  lightningBolts = []
  activeAura = null
  activeBeam = null
  peaceTimer = 0
  fistPulseTimer = 0
  frameCount = 0
}

/**
 * @param {HTMLCanvasElement} canvas
 */
export function syncVFXCanvas(canvas) {
  const w = canvas.clientWidth || window.innerWidth
  const h = canvas.clientHeight || window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)

  const c = canvas.getContext('2d')
  if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0)

  logicalW = w
  logicalH = h
  canvasEl = canvas
  if (!ctx && c) ctx = c

  return { width: w, height: h }
}

function toPixel(norm) {
  return normToCanvas(norm, logicalW, logicalH)
}

function spawnParticle(x, y, opts = {}) {
  particles.push({
    x,
    y,
    vx: opts.vx ?? Math.cos(opts.angle ?? randomBetween(0, Math.PI * 2)) * (opts.speed ?? 3),
    vy: opts.vy ?? Math.sin(opts.angle ?? randomBetween(0, Math.PI * 2)) * (opts.speed ?? 3),
    life: opts.life ?? 50,
    maxLife: opts.life ?? 50,
    size: opts.size ?? randomBetween(4, 10),
    color: opts.color ?? '#00ffcc',
    glow: opts.glow !== false,
  })
}

function spawnLightningFrom(origin) {
  const segments = [{ x: origin.x, y: origin.y }]
  let lx = origin.x
  let ly = origin.y
  for (let s = 0; s < 10; s++) {
    lx += randomBetween(20, 55)
    ly += randomBetween(-70, 70)
    segments.push({ x: lx, y: ly })
  }
  lightningBolts.push({
    segments,
    life: 18,
    width: randomBetween(3, 6),
    color: '#e8f4ff',
  })
}

/**
 * Burst when gesture first detected.
 */
export function triggerEffectBurst(name, normPos) {
  if (!canvasEl || !logicalW) return
  const pos = toPixel(normPos)

  if (name === 'fist') {
    shockwaves.push({ x: pos.x, y: pos.y, radius: 20, maxRadius: 200, alpha: 1, width: 6 })
    for (let i = 0; i < 55; i++) {
      spawnParticle(pos.x, pos.y, {
        speed: randomBetween(4, 14),
        life: randomBetween(25, 55),
        size: randomBetween(5, 14),
        color: randomBetween(0, 1) > 0.5 ? '#ff6622' : '#ffcc00',
      })
    }
  }

  if (name === 'peace') {
    for (let b = 0; b < 4; b++) spawnLightningFrom(pos)
  }
}

/**
 * Sustained VFX while gesture is held — called every frame.
 */
export function sustainGestureVFX(name, normPos, timestamp) {
  if (!canvasEl || !logicalW) return
  const pos = toPixel(normPos)
  frameCount += 1

  switch (name) {
    case 'open_palm':
      activeAura = {
        x: lerp(activeAura?.x ?? pos.x, pos.x, 0.35),
        y: lerp(activeAura?.y ?? pos.y, pos.y, 0.35),
        radius: 110,
        rotation: (timestamp * 0.002) % (Math.PI * 2),
      }
      if (frameCount % 3 === 0) {
        const a = randomBetween(0, Math.PI * 2)
        spawnParticle(activeAura.x, activeAura.y, {
          angle: a,
          speed: randomBetween(1, 3),
          life: 40,
          size: randomBetween(4, 9),
          color: '#00ffdd',
        })
      }
      break

    case 'fist':
      activeAura = null
      activeBeam = null
      fistPulseTimer += 1
      if (fistPulseTimer % 20 === 0) {
        shockwaves.push({ x: pos.x, y: pos.y, radius: 15, maxRadius: 160, alpha: 0.95, width: 5 })
      }
      if (frameCount % 2 === 0) {
        spawnParticle(pos.x, pos.y, {
          speed: randomBetween(2, 8),
          life: 30,
          size: randomBetween(4, 10),
          color: '#ff4400',
        })
      }
      break

    case 'peace':
      activeAura = null
      activeBeam = null
      peaceTimer += 1
      if (peaceTimer % 6 === 0) spawnLightningFrom(pos)
      break

    case 'pinch':
      activeAura = null
      activeBeam = {
        x: pos.x,
        y: pos.y,
        angle: -Math.PI / 2,
        length: Math.min(logicalW, logicalH) * 0.55,
      }
      if (frameCount % 2 === 0) {
        spawnParticle(pos.x, pos.y, {
          vx: randomBetween(-2, 2),
          vy: randomBetween(-6, -2),
          life: 20,
          size: randomBetween(3, 7),
          color: '#ff88ff',
        })
      }
      break

    default:
      break
  }
}

export function clearSustainedVFX() {
  activeAura = null
  activeBeam = null
  peaceTimer = 0
  fistPulseTimer = 0
}

function drawCurseAura(aura, t) {
  if (!ctx) return
  const pulse = Math.sin(t * 0.008) * 20
  const r = aura.radius + pulse

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  const outer = ctx.createRadialGradient(aura.x, aura.y, r * 0.1, aura.x, aura.y, r)
  outer.addColorStop(0, 'rgba(0, 255, 220, 0.95)')
  outer.addColorStop(0.35, 'rgba(0, 180, 255, 0.55)')
  outer.addColorStop(0.7, 'rgba(120, 0, 255, 0.25)')
  outer.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = outer
  ctx.beginPath()
  ctx.arc(aura.x, aura.y, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)'
  ctx.lineWidth = 4
  ctx.shadowColor = '#00ffcc'
  ctx.shadowBlur = 24
  ctx.beginPath()
  ctx.arc(aura.x, aura.y, r * 0.72, 0, Math.PI * 2)
  ctx.stroke()

  // Rotating curse-energy arcs
  for (let i = 0; i < 3; i++) {
    const start = aura.rotation + (i * Math.PI * 2) / 3
    ctx.strokeStyle = `rgba(180, 100, 255, ${0.7 + Math.sin(t * 0.01 + i) * 0.2})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(aura.x, aura.y, r * 0.85, start, start + Math.PI * 0.6)
    ctx.stroke()
  }

  ctx.restore()
}

function drawShockwave(sw) {
  if (!ctx) return
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.strokeStyle = `rgba(255, 140, 30, ${sw.alpha})`
  ctx.lineWidth = sw.width ?? 4
  ctx.shadowColor = '#ff8800'
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawLightning(bolt) {
  if (!ctx || bolt.segments.length < 2) return
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.strokeStyle = bolt.color
  ctx.lineWidth = bolt.width
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = 28
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y)
  for (let i = 1; i < bolt.segments.length; i++) {
    ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y)
  }
  ctx.stroke()
  ctx.restore()
}

function drawBeam(beam) {
  if (!ctx) return
  const endX = beam.x + Math.cos(beam.angle) * beam.length
  const endY = beam.y + Math.sin(beam.angle) * beam.length

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  const grad = ctx.createLinearGradient(beam.x, beam.y, endX, endY)
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.3, 'rgba(200, 100, 255, 0.95)')
  grad.addColorStop(1, 'rgba(100, 0, 255, 0)')
  ctx.strokeStyle = grad
  ctx.lineWidth = 10
  ctx.shadowColor = '#cc66ff'
  ctx.shadowBlur = 30
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(beam.x, beam.y)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255, 200, 255, 0.9)'
  ctx.shadowBlur = 16
  ctx.beginPath()
  ctx.arc(beam.x, beam.y, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawParticle(p) {
  if (!ctx) return
  const alpha = clamp(p.life / p.maxLife, 0, 1)
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = alpha
  ctx.fillStyle = p.color
  if (p.glow) {
    ctx.shadowColor = p.color
    ctx.shadowBlur = 16
  }
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function drawHandLandmarks(handLandmarks) {
  if (!ctx || !handLandmarks?.length) return

  for (const hand of handLandmarks) {
    for (const lm of hand) {
      const p = toPixel(lm)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = 'rgba(0, 255, 200, 0.85)'
      ctx.shadowColor = '#00ffcc'
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
}

/**
 * @param {number} timestamp
 * @param {Array<Array<{x:number,y:number}>> | null} [handLandmarks]
 */
export function renderFrame(timestamp, handLandmarks = null) {
  if (!ctx || !canvasEl) return

  if (canvasEl.clientWidth && canvasEl.clientHeight) {
    if (logicalW !== canvasEl.clientWidth || logicalH !== canvasEl.clientHeight) {
      syncVFXCanvas(canvasEl)
    }
  }

  ctx.clearRect(0, 0, logicalW, logicalH)

  if (activeAura) drawCurseAura(activeAura, timestamp)

  for (const sw of shockwaves) drawShockwave(sw)
  for (const bolt of lightningBolts) drawLightning(bolt)
  if (activeBeam) drawBeam(activeBeam)
  for (const p of particles) drawParticle(p)
  if (handLandmarks) drawHandLandmarks(handLandmarks)

  particles = particles.filter((p) => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.06
    p.life -= 1
    return p.life > 0
  })

  shockwaves = shockwaves.filter((sw) => {
    sw.radius += 8
    sw.alpha *= 0.9
    return sw.alpha > 0.04 && sw.radius < sw.maxRadius
  })

  lightningBolts = lightningBolts.filter((b) => {
    b.life -= 1
    return b.life > 0
  })
}

export function destroyVFXEngine() {
  particles = []
  shockwaves = []
  lightningBolts = []
  activeAura = null
  activeBeam = null
  ctx = null
  canvasEl = null
  logicalW = 0
  logicalH = 0
}

// Legacy exports kept for compatibility
export function triggerEffect(name, normPos) {
  triggerEffectBurst(name, normPos)
  sustainGestureVFX(name, normPos, performance.now())
}

export function updateEffectAnchor(normPos, gestureName) {
  sustainGestureVFX(gestureName, normPos, performance.now())
}
