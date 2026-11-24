import type * as FiberModule from '@react-three/fiber';
import { act, render, screen } from '@testing-library/react';
import { flushGlobalEffects } from '@react-three/fiber';
import { create } from '@react-three/test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'three';
import type { ReactNode } from 'react';
import SpaceCanvas, { SceneObjects } from './SpaceCanvas';
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
const textures = [new Texture(), new Texture(), new Texture(), new Texture()];
vi.mock('@react-three/fiber', async (original) => {
  const actual = await original<typeof FiberModule>();
  return {
    ...actual,
    useLoader: () => textures,
    Canvas: ({ frameloop }: { children: ReactNode; frameloop: string }) => (
      <div data-testid="frame-loop">{frameloop}</div>
    ),
  };
});
describe('React Three Fiber integration', () => {
  it('selects an active or demand frame loop', () => {
    const onReady = vi.fn<() => void>(),
      onFailure = vi.fn<() => void>();
    const view = render(<SpaceCanvas active onReady={onReady} onFailure={onFailure} />);
    expect(screen.getByTestId('frame-loop')).toHaveTextContent('always');
    view.rerender(<SpaceCanvas active={false} onReady={onReady} onFailure={onFailure} />);
    expect(screen.getByTestId('frame-loop')).toHaveTextContent('demand');
  });
  it.each([false, true])(
    'animates and disposes real objects for compact=%s, keeping them fixed when paused',
    async (compact) => {
      vi.stubGlobal('matchMedia', () => ({ matches: compact }));
      const onReady = vi.fn<() => void>(),
        onFailure = vi.fn<() => void>();
      const renderer = await create(
        <SceneObjects active onReady={onReady} onFailure={onFailure} />,
      );
      expect(onReady).not.toHaveBeenCalled();
      act(() => flushGlobalEffects('after', 0));
      expect(onReady).toHaveBeenCalledOnce();
      act(() => flushGlobalEffects('after', 16));
      expect(onReady).toHaveBeenCalledOnce();
      const group = renderer.scene.instance;
      const earth = group.getObjectByName('Earth')!;
      const clouds = group.getObjectByName('Cloud layer')!;
      const station = group.getObjectByName('Orbital station')!;
      const y = earth.rotation.y;
      const s = station.rotation.y;
      await renderer.advanceFrames(4, 0.02);
      expect(earth.rotation.y).toBeGreaterThan(y);
      expect(clouds.rotation.y).toBeGreaterThan(earth.rotation.y);
      expect(station.rotation.y).toBeLessThan(s);
      await renderer.update(
        <SceneObjects active={false} onReady={onReady} onFailure={onFailure} />,
      );
      const stopped = earth.rotation.y;
      const cloudsStopped = clouds.rotation.y;
      await renderer.advanceFrames(4, 0.02);
      expect(earth.rotation.y).toBe(stopped);
      expect(clouds.rotation.y).toBe(cloudsStopped);
      await renderer.unmount();
    },
  );
});
