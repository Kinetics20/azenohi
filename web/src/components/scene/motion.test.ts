import { describe, expect, it, vi } from 'vitest';
import { EARTH_PERIOD, STATION_PERIOD, motionAt, shouldAnimate, supportsWebGL } from './motion';
describe('Motion and fallback policy', () => {
  it('uses independent continuous rotations with a restrained beacon', () => {
    expect(motionAt(0)).toEqual({ earth: 0, station: -0, beacon: 1.6 });
    expect(motionAt(EARTH_PERIOD).earth).toBeCloseTo(Math.PI * 2);
    expect(motionAt(STATION_PERIOD).station).toBeCloseTo(-Math.PI * 2);
    for (const time of [1, 5, 10, 100]) expect(motionAt(time).beacon).toBeGreaterThanOrEqual(1.1);
  });
  it('requires all visibility and motion permissions', () => {
    expect(shouldAnimate(false, false, true, true)).toBe(true);
    for (const values of [
      [true, false, true, true],
      [false, true, true, true],
      [false, false, false, true],
      [false, false, true, false],
    ])
      expect(shouldAnimate(values[0]!, values[1]!, values[2]!, values[3]!)).toBe(false);
  });
  it('releases its probe context and handles missing contexts or drivers', () => {
    const loseContext = vi.fn<() => void>();
    expect(supportsWebGL(() => ({ getExtension: () => ({ loseContext }) }))).toBe(true);
    expect(loseContext).toHaveBeenCalledOnce();
    expect(supportsWebGL(() => ({ getExtension: () => null }))).toBe(true);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(supportsWebGL()).toBe(false);
    expect(
      supportsWebGL(() => {
        throw new Error('Driver unavailable');
      }),
    ).toBe(false);
  });
});
