/**
 * StatusHUD.jsx
 */

import React from 'react'

const GESTURE_HINTS = {
  open_palm: 'Curse Aura',
  fist: 'Blast',
  peace: 'Lightning',
  pinch: 'Energy Beam',
}

export function StatusHUD({
  status,
  streamInfo,
  trackerStatus,
  trackerError,
  gesture,
  handCount,
  fps,
}) {
  if (status !== 'active') return null

  const confidencePct = gesture ? Math.round((gesture.confidence ?? 0) * 100) : 0
  const isStable = gesture?.stable !== false

  return (
    <div className="status-hud" role="status" aria-live="polite">
      <div className="status-hud__title">
        <span className="status-dot" aria-hidden="true" />
        HAND TRACKING LIVE
      </div>

      <div className="status-hud__row status-hud__stats">
        HANDS {handCount} · {fps || '—'} FPS
        {trackerStatus === 'ready' && ' · TRACKER ✓'}
      </div>

      {trackerStatus === 'loading' && (
        <div className="status-hud__row status-hud__muted">Initializing tracker…</div>
      )}

      {trackerStatus === 'error' && (
        <div className="status-hud__row status-hud__error">
          {trackerError ?? 'Tracker failed'}
        </div>
      )}

      {gesture ? (
        <div className={`status-hud__gesture status-hud__gesture--${gesture.name}`}>
          <div className="status-hud__gesture-row">
            <span>{isStable ? gesture.label.replace('…', '') : 'Detecting…'}</span>
            <span className="status-hud__confidence">{confidencePct}%</span>
          </div>
          <div className="status-hud__confidence-bar">
            <div
              className="status-hud__confidence-fill"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="status-hud__gesture-hint">
            {isStable ? GESTURE_HINTS[gesture.name] : 'Hold gesture steady…'}
          </span>
        </div>
      ) : (
        handCount > 0 && (
          <div className="status-hud__row status-hud__muted">
            Hand detected — show a gesture
          </div>
        )
      )}

      <div className="status-hud__legend">
        🖐 Palm · ✊ Fist · ✌ Peace · 🤏 Pinch
      </div>
    </div>
  )
}
