import { afterEach, beforeEach, expect, vi } from "vitest";
import { enableAutoUnmount } from "@vue/test-utils";
import { errors } from "./helpers.js";

// jsdom does not implement APIs used by Vuetify
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserver;
window.matchMedia ??= (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent() { return false; },
});
window.visualViewport ??= {
  width: window.innerWidth,
  height: window.innerHeight,
  offsetLeft: 0,
  offsetTop: 0,
  scale: 1,
  addEventListener() {},
  removeEventListener() {},
};
Element.prototype.scrollIntoView ??= () => {};

// Sound of validation error, jsdom does not implement media playback
export const audio = {
  play: vi.fn(),
};
globalThis.Audio = class {
  constructor(src) {
    this.src = src;
    this.volume = 1;
  }
  play() {
    audio.play(this);
  }
};

// The table checks every 100ms whether the focus is inside it and emits "update" when this changes.
// With real timers the check runs at a random moment of the test, so the number of "update" events
// depends on the speed of the machine. The timer of the check runs only when the test advances it
// (see "activity" tests), the timers used by Vuetify (setTimeout) stay real.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
});
// Registered before auto unmount, so it runs after the components are unmounted (hooks run in reverse order)
afterEach(() => {
  vi.useRealTimers();
});

enableAutoUnmount(afterEach);
afterEach(() => {
  audio.play.mockClear();
  document.body.innerHTML = "";
  // The component must not throw errors
  const thrown = errors.splice(0);
  expect(thrown.map(e => e?.message ?? e)).toEqual([]);
});
