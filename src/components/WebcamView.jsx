/**
 * WebcamView.jsx — fullscreen mirrored webcam feed.
 */

import React from 'react'

export function WebcamView({ videoRef, isActive }) {
  return (
    <video
      ref={videoRef}
      id="webcam-video"
      className="webcam-video"
      playsInline
      muted
      autoPlay
      aria-label="Live webcam feed"
      style={{
        opacity: isActive ? 1 : 0.15,
        transition: 'opacity 0.4s ease',
      }}
    />
  )
}
