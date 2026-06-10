/**
 * Maps MediaPipe normalized landmarks to canvas pixel coordinates.
 *
 * MediaPipe reads the raw (unmirrored) video frame. The video and canvas are
 * both displayed with CSS scaleX(-1), so we draw using raw landmark coords —
 * the CSS mirror aligns VFX with the mirrored webcam the user sees.
 */
export function landmarkToCanvas(landmark, canvasWidth, canvasHeight) {
  if (!landmark || !canvasWidth || !canvasHeight) {
    return { x: 0, y: 0 }
  }
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight,
  }
}

export function normToCanvas(norm, canvasWidth, canvasHeight) {
  return landmarkToCanvas(norm, canvasWidth, canvasHeight)
}
