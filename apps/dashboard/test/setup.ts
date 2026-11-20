import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { api } from "./api.ts";

// jsdom does not have these browser APIs; Mantine needs them.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
window.ResizeObserver = class {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};
Element.prototype.scrollIntoView = vi.fn();

// Every request must have a handler: a forgotten one fails the test instead of hanging.
beforeAll(() => {
  api.listen({ onUnhandledFrame: "error" });
});
afterEach(() => {
  cleanup();
  api.resetHandlers();
});
afterAll(() => {
  api.close();
});
