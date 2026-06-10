/**
 * App.jsx
 * =======
 * Root application component for the Anime VFX Simulator.
 */

import React, { useRef } from 'react'
import { useWebcam } from './webcam/useWebcam'
import { useVFXSimulator } from './hooks/useVFXSimulator'
import { WebcamView } from './components/WebcamView'
import { CanvasOverlay } from './components/CanvasOverlay'
import { StatusHUD } from './components/StatusHUD'
import { PermissionOverlay } from './components/PermissionOverlay'

export default function App() {
  const canvasRef = useRef(null)

  const { videoRef, status, error, streamInfo } = useWebcam()

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
    <div
      id="app-root"
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <WebcamView videoRef={videoRef} isActive={webcamActive} />

      <CanvasOverlay canvasRef={canvasRef} />

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

      <PermissionOverlay status={status} error={error} />
    </div>
  )
}
