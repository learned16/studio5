export const MIN_SCALE = 0.2;
export const MAX_SCALE = 4;
export const FIT_PADDING = 34;

export function clampScale(scale, minScale = MIN_SCALE, maxScale = MAX_SCALE) {
  return Math.min(maxScale, Math.max(minScale, scale));
}

export function fitDocumentInSurface({
  documentWidth,
  documentHeight,
  surfaceWidth,
  surfaceHeight,
  padding = FIT_PADDING,
}) {
  const scale = Math.min(
    (surfaceWidth - padding * 2) / documentWidth,
    (surfaceHeight - padding * 2) / documentHeight,
  );
  return {
    scale,
    x: (surfaceWidth - documentWidth * scale) / 2,
    y: (surfaceHeight - documentHeight * scale) / 2,
  };
}

export function zoomViewportAt(
  viewport,
  factor,
  focalPoint,
  minScale = MIN_SCALE,
  maxScale = MAX_SCALE,
) {
  const scale = clampScale(viewport.scale * factor, minScale, maxScale);
  const ratio = scale / viewport.scale;
  return {
    scale,
    x: focalPoint.x - (focalPoint.x - viewport.x) * ratio,
    y: focalPoint.y - (focalPoint.y - viewport.y) * ratio,
  };
}

export function panViewport(viewport, delta) {
  return {
    scale: viewport.scale,
    x: viewport.x + delta.x,
    y: viewport.y + delta.y,
  };
}

export function viewPointToDocument(viewPoint, viewport, rect) {
  return {
    x: (viewPoint.x - rect.left - viewport.x) / viewport.scale,
    y: (viewPoint.y - rect.top - viewport.y) / viewport.scale,
  };
}

export function documentPointToView(
  documentPoint,
  viewport,
  rect = { left: 0, top: 0 },
) {
  return {
    x: rect.left + viewport.x + documentPoint.x * viewport.scale,
    y: rect.top + viewport.y + documentPoint.y * viewport.scale,
  };
}

export function createPinchState({ first, second, viewport }) {
  return {
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    center: {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    },
    scale: viewport.scale,
    x: viewport.x,
    y: viewport.y,
  };
}

export function updatePinchViewport(
  pinchState,
  { first, second, minScale = MIN_SCALE, maxScale = MAX_SCALE },
) {
  const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
  const center = {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
  const scale = clampScale(
    pinchState.scale * (distance / pinchState.distance),
    minScale,
    maxScale,
  );
  const ratio = scale / pinchState.scale;
  return {
    scale,
    x: center.x - (pinchState.center.x - pinchState.x) * ratio,
    y: center.y - (pinchState.center.y - pinchState.y) * ratio,
  };
}
