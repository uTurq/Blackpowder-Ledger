import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

// jsdom lacks matchMedia, which the install-status check reads.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia;

beforeEach(() => localStorage.clear());
afterEach(cleanup);
