/**
 * App.jsx
 */

import React, { useRef } from 'react'
import { useWebcam } from './webcam/useWebcam'
import { useVFXSimulator } from './hooks/useVFXSimulator'
import { WebcamView } from './components/WebcamView'
import { CanvasOverlay } from './components/CanvasOverlay'
import { StatusHUD } from './components/StatusHUD'
import { PermissionOverlay } from './components/PermissionOverlay'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App() {
  const canvasRef = useRef(null)

  const { videoRef, status, error, streamInfo, retryCamera } = useWebcam()
  const webcamActive = status === 'active'

  const {
    trackerStatus,
    trackerError,
    gesture,
    handCount,
    fps,
  } = useVFXSimulator({
    canvasRef,
    enabled: webcamActive,
  })

  return (
    <ErrorBoundary>
      <div id="app-root" className="scene-root">
        <div className="scene-stack">
          <div className="webcam-stage">
            <WebcamView videoRef={videoRef} isActive={webcamActive} />
          </div>

          <CanvasOverlay canvasRef={canvasRef} />

          <div className="scene-vignette" aria-hidden="true" />
          <div className="scene-chroma" aria-hidden="true" />
          <div className="scene-scanlines" aria-hidden="true" />
        </div>

        <div className="corner-bracket top-left"     aria-hidden="true" />
        <div className="corner-bracket top-right"    aria-hidden="true" />
        <div className="corner-bracket bottom-left"  aria-hidden="true" />
        <div className="corner-bracket bottom-right" aria-hidden="true" />

        <StatusHUD
          status={status}
          streamInfo={streamInfo}
          trackerStatus={trackerStatus}
          trackerError={trackerError}
          gesture={gesture}
          handCount={handCount}
          fps={fps}
        />

        <PermissionOverlay status={status} error={error} onRetry={retryCamera} />
      </div>
    </ErrorBoundary>
  )
}
