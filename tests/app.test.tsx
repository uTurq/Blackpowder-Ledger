import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";
import { createDefaultState, STORAGE_KEY } from "../src/lib/defaults";
import type { Motion } from "../src/lib/types";

function start(motion: Motion = "off", combatMode = false) {
  const state = createDefaultState();
  state.theme.motion = motion;
  state.combatMode = combatMode;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return render(<App />);
}
const magazine = () => document.querySelector(".magazine-block")!;
const loadedText = () => magazine().querySelector(".section-title b")!.textContent;
const press = (key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(window, { key, code: key === " " ? "Space" : `Key${key.toUpperCase()}`, ...init });

describe("armory", () => {
  it("opens straight into the saved ledger and fires the selected round", async () => {
    start();
    expect(loadedText()).toBe("7 / 11");
    fireEvent.click(within(document.querySelector(".armory-fire-tab")!).getByRole("button"));
    await waitFor(() => expect(loadedText()).toBe("6 / 11"));
    expect(document.querySelector(".toast")!.textContent).toMatch(/Standard Round fired/);
  });

  it("undoes a shot with Ctrl+Z", async () => {
    start("off", true);
    press(" ");
    await waitFor(() => expect(loadedText()).toBe("6 / 11"));
    press("z", { ctrlKey: true });
    expect(loadedText()).toBe("7 / 11");
  });

  it("starts a fresh encounter each time Combat Mode is entered", () => {
    start("off");
    const toggle = () => fireEvent.click(document.querySelector(".combat-toggle")!);
    toggle();
    fireEvent.click(screen.getByRole("button", { name: /Next Turn/ }));
    fireEvent.click(screen.getByRole("button", { name: /Next Turn/ }));
    const turn = () => document.querySelector(".combat-side h2")!.textContent;
    expect(turn()).toBe("Turn 3");
    toggle();
    toggle();
    expect(turn()).toBe("Turn 1");
    // Starting over is undoable in case Combat Mode was toggled by accident.
    press("z", { ctrlKey: true });
    expect(document.querySelector(".combat-side h2")!.textContent).toBe("Turn 3");
  });

  it("cycles Tactical Selection from the combat dock", () => {
    start("off", true);
    const dock = document.querySelector(".dock-round") as HTMLElement;
    expect(dock.textContent).toContain("Standard Round");
    fireEvent.click(dock);
    expect(dock.textContent).toContain("Hollow Point");
  });
});

describe("keyboard shortcuts", () => {
  it("do not fire or reload behind an open dialog", async () => {
    start("off", true);
    fireEvent.click(document.querySelector(".history-peek")!);
    expect(screen.getByRole("dialog", { name: "Activity history" })).toBeTruthy();
    press(" ");
    press("r");
    await new Promise((r) => setTimeout(r, 30));
    expect(loadedText()).toBe("7 / 11");
    expect(screen.queryByRole("dialog", { name: /Prepare/ })).toBeNull();
    press("Escape");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("leave browser shortcuts such as Ctrl+R alone", () => {
    start();
    const event = new KeyboardEvent("keydown", { key: "r", ctrlKey: true, cancelable: true });
    act(() => void window.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("ignore typing in a text field", () => {
    start();
    const name = screen.getByLabelText("Character or armory name");
    fireEvent.keyDown(name, { key: "r", code: "KeyR" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("reload", () => {
  it("Skip animation commits the load immediately", async () => {
    start("full");
    press("r");
    const modal = screen.getByRole("dialog", { name: /Prepare Lever-Action/ });
    fireEvent.click(within(modal).getByRole("button", { name: "Clear" }));
    fireEvent.click(within(modal).getByRole("button", { name: "Load 0 Rounds" }));
    fireEvent.click(await screen.findByRole("button", { name: "Skip animation" }));
    await waitFor(() => expect(loadedText()).toBe("0 / 11"));
    expect(screen.queryByText("Seating cartridges…")).toBeNull();
  });

  it("refuses to plan more rounds than are owned", () => {
    start();
    press("r");
    const modal = screen.getByRole("dialog", { name: /Prepare Lever-Action/ });
    fireEvent.click(within(modal).getByRole("button", { name: "Clear" }));
    const explosive = within(modal).getByRole("button", { name: /Load one Explosive Shell/ });
    for (let i = 0; i < 10; i++) fireEvent.click(explosive);
    expect(within(modal).getByRole("button", { name: "Load 7 Rounds" })).toBeTruthy();
    expect(explosive.getAttribute("aria-disabled")).toBe("true");
  });
});
