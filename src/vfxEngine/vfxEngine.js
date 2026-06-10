/**
 * vfxEngine.js — anime curse-energy VFX with visual assets + dynamic scaling.
 */

import { clamp, lerp, randomBetween } from '../utils/index.js'
import { normToCanvas } from '../utils/coordinates.js'
import { getViewportScale, scaleValue } from '../utils/scaling.js'
import { HAND_CONNECTIONS, FINGER_TIPS } from '../gestureDetection/gestureDetector.js'
import {
  preloadVisualAssets,
  getVisualAsset,
  drawSprite,
} from '../assets/vfx/visualAssets.js'

/** @type {CanvasRenderingContext2D | null} */
let ctx = null
/** @type {HTMLCanvasElement | null} */
let canvasEl = null
let logicalW = 0
let logicalH = 0
let viewportScale = 1

let particles = []
let shockwaves = []
let lightningBolts = []
/** @type {{ x: number, y: number, radius: number, rotation: number, handScale: number } | null} */
let activeAura = null
/** @type {{ x: number, y: number, angle: number, length: number, handScale: number } | null} */
let activeBeam = null
let peaceTimer = 0
let fistPulseTimer = 0
let frameCount = 0

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
  preloadVisualAssets().catch(() => {})
}

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
  viewportScale = getViewportScale(w, h)
  canvasEl = canvas
  if (!ctx && c) ctx = c

  return { width: w, height: h, viewportScale }
}

function toPixel(norm) {
  return normToCanvas(norm, logicalW, logicalH)
}

function eff(base, handScale = 1) {
  return scaleValue(base, viewportScale, handScale)
}

function spawnParticle(x, y, opts = {}) {
  const hs = opts.handScale ?? 1
  particles.push({
    x,
    y,
    vx: opts.vx ?? Math.cos(opts.angle ?? randomBetween(0, Math.PI * 2)) * (opts.speed ?? 3) * viewportScale,
    vy: opts.vy ?? Math.sin(opts.angle ?? randomBetween(0, Math.PI * 2)) * (opts.speed ?? 3) * viewportScale,
    life: opts.life ?? 50,
    maxLife: opts.life ?? 50,
    size: opts.size ?? eff(6, hs),
    color: opts.color ?? '#00ffcc',
    glow: opts.glow !== false,
  })
}

function spawnLightningFrom(origin, handScale = 1) {
  const reach = eff(55, handScale)
  const segments = [{ x: origin.x, y: origin.y }]
  let lx = origin.x
  let ly = origin.y
  for (let s = 0; s < 10; s++) {
    lx += randomBetween(reach * 0.35, reach)
    ly += randomBetween(-reach * 1.2, reach * 1.2)
    segments.push({ x: lx, y: ly })
  }
  lightningBolts.push({
    segments,
    life: 22,
    width: eff(4, handScale),
    color: '#eef6ff',
    handScale,
  })
}

export function triggerEffectBurst(name, normPos, handScale = 1) {
  if (!canvasEl || !logicalW) return
  const pos = toPixel(normPos)

  if (name === 'fist') {
    shockwaves.push({
      x: pos.x,
      y: pos.y,
      radius: eff(24, handScale),
      maxRadius: eff(220, handScale),
      alpha: 1,
      width: eff(7, handScale),
    })
    for (let i = 0; i < 60; i++) {
      spawnParticle(pos.x, pos.y, {
        speed: randomBetween(4, 16),
        life: randomBetween(28, 60),
        size: eff(randomBetween(5, 16), handScale),
        color: randomBetween(0, 1) > 0.5 ? '#ff6622' : '#ffdd44',
        handScale,
      })
    }
  }

  if (name === 'peace') {
    for (let b = 0; b < 5; b++) spawnLightningFrom(pos, handScale)
  }
}

export function sustainGestureVFX(name, normPos, timestamp, handScale = 1) {
  if (!canvasEl || !logicalW) return
  const pos = toPixel(normPos)
  frameCount += 1

  switch (name) {
    case 'open_palm':
      activeAura = {
        x: lerp(activeAura?.x ?? pos.x, pos.x, 0.38),
        y: lerp(activeAura?.y ?? pos.y, pos.y, 0.38),
        radius: eff(130, handScale),
        rotation: (timestamp * 0.0022) % (Math.PI * 2),
        handScale,
      }
      if (frameCount % 2 === 0) {
        spawnParticle(activeAura.x, activeAura.y, {
          angle: randomBetween(0, Math.PI * 2),
          speed: randomBetween(1, 4),
          life: 45,
          size: eff(randomBetween(5, 11), handScale),
          color: randomBetween(0, 1) > 0.5 ? '#00ffdd' : '#c084fc',
          handScale,
        })
      }
      break

    case 'fist':
      activeAura = null
      activeBeam = null
      fistPulseTimer += 1
      if (fistPulseTimer % 18 === 0) {
        shockwaves.push({
          x: pos.x,
          y: pos.y,
          radius: eff(18, handScale),
          maxRadius: eff(180, handScale),
          alpha: 0.95,
          width: eff(6, handScale),
        })
      }
      if (frameCount % 2 === 0) {
        spawnParticle(pos.x, pos.y, {
          speed: randomBetween(2, 10),
          life: 32,
          size: eff(randomBetween(5, 12), handScale),
          color: '#ff5500',
          handScale,
        })
      }
      break

    case 'peace':
      activeAura = null
      activeBeam = null
      peaceTimer += 1
      if (peaceTimer % 5 === 0) spawnLightningFrom(pos, handScale)
      break

    case 'pinch':
      activeAura = null
      activeBeam = {
        x: pos.x,
        y: pos.y,
        angle: -Math.PI / 2,
        length: Math.min(logicalW, logicalH) * 0.58 * handScale,
        handScale,
      }
      if (frameCount % 2 === 0) {
        spawnParticle(pos.x, pos.y, {
          vx: randomBetween(-3, 3) * viewportScale,
          vy: randomBetween(-8, -2) * viewportScale,
          life: 22,
          size: eff(randomBetween(4, 9), handScale),
          color: '#f0abfc',
          handScale,
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
  const pulse = Math.sin(t * 0.009) * eff(24, aura.handScale)
  const r = aura.radius + pulse

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  const outer = ctx.createRadialGradient(aura.x, aura.y, r * 0.08, aura.x, aura.y, r)
  outer.addColorStop(0, 'rgba(0, 255, 230, 1)')
  outer.addColorStop(0.3, 'rgba(0, 200, 255, 0.65)')
  outer.addColorStop(0.65, 'rgba(160, 80, 255, 0.35)')
  outer.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = outer
  ctx.beginPath()
  ctx.arc(aura.x, aura.y, r, 0, Math.PI * 2)
  ctx.fill()

  const rune = getVisualAsset('auraRune')
  if (rune) {
    drawSprite(ctx, rune, aura.x, aura.y, r * 2.1, aura.rotation, 0.82)
    drawSprite(ctx, rune, aura.x, aura.y, r * 1.5, -aura.rotation * 1.4, 0.45)
  }

  const sigil = getVisualAsset('curseSigil')
  if (sigil) {
    drawSprite(ctx, sigil, aura.x, aura.y, r * 0.85, aura.rotation * 0.6, 0.55 + Math.sin(t * 0.006) * 0.2)
  }

  ctx.strokeStyle = 'rgba(0, 255, 210, 0.95)'
  ctx.lineWidth = eff(4, aura.handScale)
  ctx.shadowColor = '#00ffcc'
  ctx.shadowBlur = eff(28, aura.handScale)
  ctx.beginPath()
  ctx.arc(aura.x, aura.y, r * 0.74, 0, Math.PI * 2)
  ctx.stroke()

  for (let i = 0; i < 4; i++) {
    const start = aura.rotation + (i * Math.PI * 2) / 4
    ctx.strokeStyle = `rgba(200, 120, 255, ${0.75 + Math.sin(t * 0.012 + i) * 0.2})`
    ctx.lineWidth = eff(3, aura.handScale)
    ctx.beginPath()
    ctx.arc(aura.x, aura.y, r * 0.88, start, start + Math.PI * 0.55)
    ctx.stroke()
  }

  ctx.restore()
}

function drawShockwave(sw) {
  if (!ctx) return
  const ring = getVisualAsset('blastRing')
  if (ring && sw.radius < sw.maxRadius * 0.6) {
    drawSprite(ctx, ring, sw.x, sw.y, sw.radius * 2.2, 0, sw.alpha * 0.7)
  }

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.strokeStyle = `rgba(255, 150, 40, ${sw.alpha})`
  ctx.lineWidth = sw.width ?? eff(5)
  ctx.shadowColor = '#ff8800'
  ctx.shadowBlur = eff(24)
  ctx.beginPath()
  ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawLightning(bolt) {
  if (!ctx || bolt.segments.length < 2) return

  const core = getVisualAsset('lightningCore')
  if (core && bolt.segments.length > 0) {
    const s0 = bolt.segments[0]
    drawSprite(ctx, core, s0.x, s0.y, eff(72, bolt.handScale ?? 1), 0, bolt.life / 22)
  }

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.strokeStyle = bolt.color
  ctx.lineWidth = bolt.width
  ctx.shadowColor = '#ffffff'
  ctx.shadowBlur = eff(32, bolt.handScale ?? 1)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
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
  grad.addColorStop(0.25, 'rgba(220, 130, 255, 0.98)')
  grad.addColorStop(0.7, 'rgba(140, 50, 255, 0.5)')
  grad.addColorStop(1, 'rgba(80, 0, 200, 0)')
  ctx.strokeStyle = grad
  ctx.lineWidth = eff(12, beam.handScale)
  ctx.shadowColor = '#dd88ff'
  ctx.shadowBlur = eff(36, beam.handScale)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(beam.x, beam.y)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  const sigil = getVisualAsset('curseSigil')
  if (sigil) {
    drawSprite(ctx, sigil, beam.x, beam.y, eff(48, beam.handScale), performance.now() * 0.003, 0.75)
  }

  ctx.fillStyle = 'rgba(255, 230, 255, 1)'
  ctx.shadowBlur = eff(20, beam.handScale)
  ctx.beginPath()
  ctx.arc(beam.x, beam.y, eff(16, beam.handScale), 0, Math.PI * 2)
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
    ctx.shadowBlur = eff(18)
  }
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

const GESTURE_COLORS = {
  open_palm: '#00ffdd',
  fist: '#ff6622',
  peace: '#93c5fd',
  pinch: '#e879f9',
}

/**
 * Live hand skeleton + gesture label overlay.
 * @param {Array<Array<{x:number,y:number}>> | null} handLandmarks
 * @param {{ name: string, label: string, confidence: number, center: object, fingerState?: object, stable?: boolean } | null} gesture
 */
export function drawHandTrackingOverlay(handLandmarks, gesture = null) {
  if (!ctx || !handLandmarks?.length) return

  const accent = gesture?.name ? GESTURE_COLORS[gesture.name] : '#00ffcc'

  for (const hand of handLandmarks) {
    // Skeleton lines
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.45)'
    ctx.lineWidth = eff(2)
    ctx.lineCap = 'round'
    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = toPixel(hand[a])
      const pb = toPixel(hand[b])
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
      ctx.stroke()
    }
    ctx.restore()

    // Joint dots — extended fingertips glow brighter
    for (let i = 0; i < hand.length; i++) {
      const p = toPixel(hand[i])
      const isTip = FINGER_TIPS.includes(i)
      const tipToFinger = { 4: 'thumb', 8: 'index', 12: 'middle', 16: 'ring', 20: 'pinky' }
      const fingerKey = tipToFinger[i]
      const isExtended = fingerKey && gesture?.fingerState?.[fingerKey]?.extended

      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = isExtended ? accent : isTip ? 'rgba(255,255,255,0.85)' : 'rgba(0,255,200,0.55)'
      ctx.shadowColor = isExtended ? accent : '#00ffcc'
      ctx.shadowBlur = isExtended ? eff(16) : eff(8)
      ctx.beginPath()
      ctx.arc(p.x, p.y, isTip ? eff(isExtended ? 8 : 5) : eff(3), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  // Floating gesture badge at palm
  if (gesture?.center) {
    const p = toPixel(gesture.center)
    const pct = Math.round((gesture.confidence ?? 0) * 100)
    const label = gesture.stable !== false ? gesture.label : `${gesture.label}`

    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.font = `bold ${eff(13)}px 'Segoe UI', sans-serif`
    const text = `${label}  ${pct}%`
    const pad = eff(8)
    const tw = ctx.measureText(text).width
    const bw = tw + pad * 2
    const bh = eff(26)

    ctx.fillStyle = 'rgba(0, 10, 20, 0.72)'
    ctx.strokeStyle = accent
    ctx.lineWidth = eff(2)
    ctx.shadowColor = accent
    ctx.shadowBlur = eff(14)
    const bx = p.x - bw / 2
    const by = p.y - eff(55)
    ctx.beginPath()
    ctx.roundRect(bx, by, bw, bh, eff(6))
    ctx.fill()
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.fillStyle = accent
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, p.x, by + bh / 2)
    ctx.restore()
  }
}

/** @deprecated use drawHandTrackingOverlay */
export function drawHandLandmarks(handLandmarks) {
  drawHandTrackingOverlay(handLandmarks, null)
}

export function renderFrame(timestamp, handLandmarks = null, gesture = null) {
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
  if (handLandmarks) drawHandTrackingOverlay(handLandmarks, gesture)

  particles = particles.filter((p) => {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.06 * viewportScale
    p.life -= 1
    return p.life > 0
  })

  shockwaves = shockwaves.filter((sw) => {
    sw.radius += 9 * viewportScale
    sw.alpha *= 0.88
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
  viewportScale = 1
}

export function triggerEffect(name, normPos, handScale = 1) {
  triggerEffectBurst(name, normPos, handScale)
  sustainGestureVFX(name, normPos, performance.now(), handScale)
}

export function updateEffectAnchor(normPos, gestureName, handScale = 1) {
  sustainGestureVFX(gestureName, normPos, performance.now(), handScale)
}
