import { expect, it } from "vitest";
import { createDefaultState } from "../src/lib/defaults";
import { createLedgerStore } from "../src/lib/store";

it("records undoable changes and restores them in order", () => {
  const store = createLedgerStore(createDefaultState());
  store.commit((n) => void (n.gold = 50), "Spent gold.", "gold");
  store.commit((n) => void (n.gold = 10), "Spent more.", "gold");
  expect(store.getState().activity[0].text).toBe("Spent more.");
  expect(store.undo()).toBe(true);
  expect(store.getState().gold).toBe(50);
  expect(store.getState().activity[0].text).toBe("Undid last action.");
  expect(store.undo()).toBe(true);
  expect(store.getState().gold).toBe(120);
  expect(store.undo()).toBe(false);
});

it("keeps preferences out of the undo history", () => {
  const store = createLedgerStore(createDefaultState());
  store.passive((n) => void (n.theme.accent = "ember"));
  expect(store.getSnapshot().undoDepth).toBe(0);
  expect(store.getState().theme.accent).toBe("ember");
});

it("abandons a change when the recipe returns false", () => {
  const initial = createDefaultState();
  const store = createLedgerStore(initial);
  expect(
    store.commit((n) => {
      n.gold = 0;
      return false;
    }, "Nope."),
  ).toBe(false);
  expect(store.getState()).toBe(initial);
  expect(store.getSnapshot().undoDepth).toBe(0);
});

it("never mutates states held in history", () => {
  const initial = createDefaultState();
  const frozen = structuredClone(initial);
  const store = createLedgerStore(initial);
  store.commit((n) => void n.weapons[0].slots.fill(null), "Emptied.");
  expect(initial).toEqual(frozen);
});
