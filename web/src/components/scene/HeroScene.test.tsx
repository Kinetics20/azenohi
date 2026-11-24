import type * as MotionModule from './motion';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroScene, SceneBoundary } from './HeroScene';
import { supportsWebGL } from './motion';
import { mockBrowser } from '../../test/browser';
import type { SpaceProps } from './SpaceCanvas';
vi.mock('./motion', async (original) => ({
  ...(await original<typeof MotionModule>()),
  supportsWebGL: vi.fn<() => boolean>(() => true),
}));
vi.mock('./SpaceCanvas', () => ({
  default: ({ active, onReady, onFailure }: SpaceProps) => (
    <div data-testid="canvas" data-active={active}>
      <button onClick={onReady}>Scene ready</button>
      <button onClick={onFailure}>Lose context</button>
    </div>
  ),
}));
beforeEach(() => {
  mockBrowser(false);
  vi.mocked(supportsWebGL).mockReturnValue(true);
});
describe('Scene lifecycle', () => {
  it('keeps a poster while loading, then supports pause and resume', async () => {
    const user = userEvent.setup();
    const { container } = render(<HeroScene />);
    expect(container.querySelector('[data-scene]')).toHaveAttribute('data-scene', 'loading');
    await user.click(await screen.findByText('Scene ready'));
    expect(container.querySelector('[data-scene]')).toHaveAttribute('data-scene', 'ready');
    await user.click(screen.getByRole('button', { name: 'Pause animation' }));
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-active', 'false');
    await user.click(screen.getByRole('button', { name: 'Resume animation' }));
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-active', 'true');
  });
  it('keeps content visible when WebGL is unavailable', () => {
    vi.mocked(supportsWebGL).mockReturnValue(false);
    render(<HeroScene />);
    expect(screen.getByText('Still view')).toBeVisible();
    expect(screen.queryByTestId('canvas')).toBeNull();
  });
  it('reverts to the poster after context loss', async () => {
    const user = userEvent.setup();
    const { container } = render(<HeroScene />);
    await user.click(await screen.findByText('Scene ready'));
    await user.click(screen.getByText('Lose context'));
    expect(container.querySelector('[data-scene]')).toHaveAttribute('data-scene', 'fallback');
    expect(screen.queryByTestId('canvas')).toBeNull();
  });
  it('responds to visibility, viewport and preference changes and removes listeners', async () => {
    const browser = mockBrowser(false);
    const { unmount } = render(<HeroScene />);
    await screen.findByTestId('canvas');
    act(() => browser.intersect(false));
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-active', 'false');
    act(() => browser.intersect(true));
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-active', 'true');
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    await act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-active', 'false');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(() => document.dispatchEvent(new Event('visibilitychange')));
    const callback = browser.media.addEventListener.mock.calls[0]![1];
    browser.media.matches = true;
    act(() => callback(new Event('change')));
    expect(screen.getByText('Still view · reduced motion')).toBeVisible();
    browser.media.matches = false;
    act(() => callback(new Event('change')));
    await waitFor(() => expect(screen.getByTestId('canvas')).toBeInTheDocument());
    unmount();
    expect(browser.disconnect).toHaveBeenCalled();
    expect(browser.media.removeEventListener).toHaveBeenCalled();
  });
  it('contains a rejected scene chunk or texture', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onFailure = vi.fn<() => void>();
    const { container } = render(
      <SceneBoundary onFailure={onFailure}>
        <Broken />
      </SceneBoundary>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(onFailure).toHaveBeenCalledOnce();
  });
});

function Broken(): never {
  throw new Error('texture failed');
}
