import type * as MotionModule from '../components/scene/motion';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { mockBrowser } from '../test/browser';
vi.mock('../components/scene/motion', async (original) => ({
  ...(await original<typeof MotionModule>()),
  supportsWebGL: () => false,
}));
beforeEach(() => {
  mockBrowser();
  window.history.replaceState({}, '', '/');
});
describe('Portfolio navigation and content', () => {
  it('navigates all destinations, highlights the current page and restores Home from the logo', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('HybridIntelligence');
    for (const [link, heading] of [
      ['Team', 'People × AI'],
      ['Projects', 'From Hackathonsto Real Impact'],
      ['Journey', 'Small Steps.Big Dreams.'],
    ]) {
      await user.click(screen.getByRole('link', { name: link! }));
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading!);
      expect(screen.getByRole('link', { name: link! })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('main')).toHaveFocus();
    }
    await user.click(screen.getByRole('link', { name: 'AzenoHI.dev — Home' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('HybridIntelligence');
  });
  it('shows six projects in order with Risk Miner last, opens its detail and returns', async () => {
    window.history.replaceState({}, '', '/projects');
    const user = userEvent.setup();
    render(<App />);
    const cards = screen
      .getAllByRole('link')
      .filter((link) => link.className.includes('project-card'));
    expect(cards).toHaveLength(6);
    expect(cards[5]).toHaveTextContent('Risk Miner');
    await user.click(cards[5]!);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Risk Miner');
    for (const title of ['Detect', 'Predict', 'Analyse', 'Support'])
      expect(screen.getByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByText('Concept visuals · illustrative project views')).toBeVisible();
    await user.click(
      within(screen.getByRole('main')).getAllByRole('link', { name: 'Back to projects' })[0]!,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('From Hackathons');
    expect(document.getElementById('project-risk-miner')).toHaveFocus();
    expect(window.location.hash).toBe('#project-risk-miner');
  });
  it.each(['captrace', 'done', 'privymeet', 'productivity-suite', 'risktrace'])(
    'provides a real detail view for %s',
    (slug) => {
      window.history.replaceState({}, '', `/projects/${slug}`);
      render(<App />);
      expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
      expect(
        screen.getByText('Project overview from the AzenoHI portfolio concept.'),
      ).toBeVisible();
    },
  );
  it('restores a directly linked project card and tolerates an unknown return anchor', () => {
    window.history.replaceState({}, '', '/projects#project-done');
    const view = render(<App />);
    expect(document.getElementById('project-done')).toHaveFocus();
    view.unmount();
    window.history.replaceState({}, '', '/projects#missing-card');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('From Hackathons');
  });
  it.each(['/unknown', '/projects/unknown'])('provides a useful 404 at %s', (path) => {
    window.history.replaceState({}, '', path);
    render(<App />);
    expect(screen.getByRole('link', { name: 'Return to Home' })).toHaveAttribute('href', '/');
  });
  it('preserves supplied names and milestones without invented biographies', async () => {
    window.history.replaceState({}, '', '/team');
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getAllByRole('article')).toHaveLength(12);
    expect(screen.getByRole('heading', { name: 'Paweł' })).toBeVisible();
    expect(screen.getByText('14+')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Journey' }));
    const milestones = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(milestones).toHaveLength(5);
    expect(milestones[1]).toHaveTextContent('2018Remote work during Zoom era');
  });
  it('opens the mobile disclosure, supports Escape, and closes on route changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    await user.keyboard('{Escape}');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    await user.click(screen.getByRole('link', { name: 'Team' }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
  it('dismisses navigation on outside taps, focus exit, current-page selection and breakpoint changes', async () => {
    const browser = mockBrowser();
    window.history.replaceState({}, '', '/projects');
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    await user.click(toggle);
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', { name: 'Projects' }),
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
    await user.click(toggle);
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    await user.tab();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    const resized = browser.media.addEventListener.mock.calls.at(-1)![1];
    act(() => resized(new Event('change')));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
