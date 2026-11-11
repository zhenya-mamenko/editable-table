import { afterEach, expect, vi } from "vitest";
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

enableAutoUnmount(afterEach);
afterEach(() => {
  audio.play.mockClear();
  document.body.innerHTML = "";
  // The component must not throw errors
  const thrown = errors.splice(0);
  expect(thrown.map(e => e?.message ?? e)).toEqual([]);
});
