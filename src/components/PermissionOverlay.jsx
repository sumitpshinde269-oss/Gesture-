/**
 * PermissionOverlay.jsx
 * =====================
 * Fullscreen overlay shown while requesting camera access.
 * Also handles the error state if permission is denied.
 *
 * Props:
 *   status {string} — 'requesting' | 'error'
 *   error  {string|null} — error message if status === 'error'
 */

import React from 'react'

export function PermissionOverlay({ status, error, onRetry }) {
  // Don't render if webcam is already active or idle
  if (status === 'active' || status === 'idle') return null

  return (
    <div className="permission-overlay" role="dialog" aria-modal="true">
      {status === 'requesting' && (
        <>
          {/* Animated camera icon */}
          <div style={{ fontSize: '4rem', animation: 'pulse-glow 1.5s ease-in-out infinite' }}>
            📷
          </div>

          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            letterSpacing: '0.1em',
            color: 'rgba(0, 255, 180, 0.9)',
            textTransform: 'uppercase',
          }}>
            Anime VFX Simulator
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '320px', lineHeight: '1.6' }}>
            Requesting camera access…
            <br />
            <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>
              Please allow camera permission in your browser.
            </span>
          </p>

          {/* Animated loading dots */}
          <LoadingDots />
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '3.5rem' }}>⚠️</div>

          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'rgba(255, 80, 80, 0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Camera Error
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '340px',
            lineHeight: '1.7',
            textAlign: 'center',
          }}>
            {error ?? 'An unknown error occurred.'}
          </p>

          <button
            id="retry-camera-btn"
            type="button"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            style={{
              marginTop: '0.5rem',
              padding: '0.6rem 1.8rem',
              background: 'rgba(0, 255, 180, 0.15)',
              border: '1px solid rgba(0, 255, 180, 0.5)',
              borderRadius: '6px',
              color: 'rgba(0, 255, 180, 0.9)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => e.target.style.background = 'rgba(0, 255, 180, 0.3)'}
            onMouseLeave={e => e.target.style.background = 'rgba(0, 255, 180, 0.15)'}
          >
            Retry
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Small animated loading indicator — three bouncing dots.
 */
function LoadingDots() {
  const dotStyle = (delay) => ({
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'rgba(0, 255, 180, 0.8)',
    margin: '0 4px',
    animation: `loadingBounce 1.2s ${delay}s ease-in-out infinite`,
  })

  return (
    <>
      <style>{`
        @keyframes loadingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={dotStyle(0)}   />
        <span style={dotStyle(0.2)} />
        <span style={dotStyle(0.4)} />
      </div>
    </>
  )
}
