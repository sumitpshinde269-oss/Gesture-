/**
 * StatusHUD.jsx
 * =============
 * Heads-Up Display shown in the top-left corner.
 */

import React from 'react'

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

  return (
    <div className="status-hud" role="status" aria-live="polite">
      <div>
        <span className="status-dot" aria-hidden="true" />
        WEBCAM LIVE
      </div>

      {streamInfo && (
        <div>{streamInfo.width} × {streamInfo.height}</div>
      )}

      {streamInfo?.label && (
        <div style={{ opacity: 0.6, fontSize: '0.65rem' }}>
          {streamInfo.label.length > 30
            ? streamInfo.label.slice(0, 30) + '…'
            : streamInfo.label}
        </div>
      )}

      <div style={{ opacity: 0.7 }}>
        HANDS: {handCount} · FPS: {fps || '—'}
      </div>

      {trackerStatus === 'loading' && (
        <div style={{ opacity: 0.6 }}>Loading hand tracker…</div>
      )}

      {trackerStatus === 'ready' && (
        <div style={{ opacity: 0.6 }}>HAND TRACKING ✓</div>
      )}

      {trackerStatus === 'error' && (
        <div style={{ opacity: 0.8, color: 'rgba(255, 120, 80, 0.9)' }}>
          Tracker: {trackerError ?? 'failed'}
        </div>
      )}

      {gesture && (
        <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'rgba(0, 255, 220, 0.95)' }}>
          GESTURE: {gesture.label}
        </div>
      )}

      <div style={{ opacity: 0.45, marginTop: '4px', fontSize: '0.65rem' }}>
        Palm=Aura · Fist=Blast · Peace=Lightning · Pinch=Beam
      </div>
    </div>
  )
}
