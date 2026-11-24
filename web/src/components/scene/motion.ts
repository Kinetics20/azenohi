// A near-horizon view magnifies surface travel; keep the detailed landscape calm.
export const EARTH_PERIOD = 630;
export const STATION_PERIOD = 84;
export function motionAt(seconds: number) {
  return {
    earth: (seconds * Math.PI * 2) / EARTH_PERIOD,
    station: (-seconds * Math.PI * 2) / STATION_PERIOD,
    beacon: 1.6 + Math.sin(seconds * 1.3) * 0.5,
  };
}
export function shouldAnimate(
  paused: boolean,
  reduced: boolean,
  visible: boolean,
  intersecting: boolean,
) {
  return !paused && !reduced && visible && intersecting;
}
export function supportsWebGL(
  contextFactory: () => {
    getExtension(name: 'WEBGL_lose_context'): { loseContext(): void } | null;
  } | null = () => document.createElement('canvas').getContext('webgl2'),
) {
  try {
    const context = contextFactory();
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
