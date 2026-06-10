/**
 * ErrorBoundary.jsx — prevents blank screen on runtime errors.
 */

import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="permission-overlay">
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h1 style={{ color: '#ff6666', fontSize: '1.2rem' }}>App Error</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', maxWidth: 420, lineHeight: 1.6 }}>
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.5rem',
              padding: '0.6rem 1.8rem',
              background: 'rgba(0, 255, 180, 0.15)',
              border: '1px solid rgba(0, 255, 180, 0.5)',
              borderRadius: '6px',
              color: 'rgba(0, 255, 180, 0.9)',
              cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
