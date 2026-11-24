import { vi } from 'vitest';
export function mockBrowser(reduced = true) {
  const media = {
    matches: reduced,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn<(name: string, callback: (event: Event) => void) => void>(),
    removeEventListener: vi.fn<(name: string, callback: (event: Event) => void) => void>(),
    dispatchEvent: vi.fn<(event: Event) => boolean>(),
    addListener: vi.fn<() => void>(),
    removeListener: vi.fn<() => void>(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  );
  vi.stubGlobal('scrollTo', vi.fn<() => void>());
  let intersection: IntersectionObserverCallback | undefined;
  const disconnect = vi.fn<() => void>();
  const observer: IntersectionObserver = {
    root:null,rootMargin:'0px',scrollMargin:'0px',thresholds:[0],
    observe:vi.fn<() => void>(),unobserve:vi.fn<() => void>(),disconnect,takeRecords:()=>[],
  };
  class Observer {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; return observer; }
  }
  vi.stubGlobal('IntersectionObserver', Observer);
  return {
    media,
    disconnect,
    intersect: (isIntersecting: boolean) => {
      const rect = document.body.getBoundingClientRect();
      intersection?.(
        [
          {
            isIntersecting,
            target: document.body,
            boundingClientRect: rect,
            intersectionRect: rect,
            rootBounds: null,
            intersectionRatio: isIntersecting ? 1 : 0,
            time: 0,
          },
        ],
        observer,
      );
    },
  };
}
