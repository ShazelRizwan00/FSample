/**
 * jsdom shims for packages that assume a real layout engine.
 * Radix's floating-ui primitives observe element size, and Radix's presence
 * helpers query matchMedia, so both must exist before the shell mounts.
 */
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = ResizeObserverStub
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

// jsdom has no layout engine, so scrollIntoView (used to reveal a slot in the
// browser) must be stubbed rather than throwing.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}
