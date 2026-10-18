import { useEffect, useState, useSyncExternalStore } from "react";
import { loadSavedState, saveState } from "./migrate";
import type { LedgerState } from "./types";
import { activity, clone, MAX_ACTIVITY } from "./util";

const MAX_UNDO = 50;
const SAVE_DELAY_MS = 250;

/** Mutates a fresh copy of the state. Return `false` to abandon the change. */
export type Recipe = (draft: LedgerState) => void | boolean;
export type Commit = (recipe: Recipe, label?: string, kind?: string) => boolean;
export type Passive = (recipe: Recipe) => boolean;

type Snapshot = { state: LedgerState; undoDepth: number };

/**
 * Holds the ledger and its undo history outside React so every action reads
 * the latest state, even from timers and animation sequences.
 */
export function createLedgerStore(initial: LedgerState) {
  let state = initial;
  let undo: LedgerState[] = [];
  let snapshot: Snapshot = { state, undoDepth: 0 };
  const listeners = new Set<() => void>();

  function publish(next: LedgerState, nextUndo = undo) {
    state = next;
    undo = nextUndo;
    snapshot = { state, undoDepth: undo.length };
    listeners.forEach((listener) => listener());
  }
  function draftFrom(recipe: Recipe) {
    const draft = clone(state);
    return recipe(draft) === false ? null : draft;
  }
  function log(draft: LedgerState, label?: string, kind = "system") {
    if (label)
      draft.activity = [activity(label, kind), ...draft.activity].slice(0, MAX_ACTIVITY);
    draft.savedAt = Date.now();
    return draft;
  }

  return {
    getState: () => state,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    /** An undoable change, optionally recorded in the activity log. */
    commit: ((recipe, label, kind) => {
      const draft = draftFrom(recipe);
      if (!draft) return false;
      publish(log(draft, label, kind), [state, ...undo].slice(0, MAX_UNDO));
      return true;
    }) as Commit,
    /** A preference or navigation change that is saved but not undoable. */
    passive: ((recipe) => {
      const draft = draftFrom(recipe);
      if (!draft) return false;
      publish(log(draft));
      return true;
    }) as Passive,
    /** Swap in a whole ledger (import, reset); the old one stays undoable. */
    replace(next: LedgerState, label: string, kind = "data") {
      publish(log(clone(next), label, kind), [state, ...undo].slice(0, MAX_UNDO));
    },
    undo() {
      const [previous, ...rest] = undo;
      if (!previous) return false;
      publish(log(clone(previous), "Undid last action.", "undo"), rest);
      return true;
    },
  };
}
export type LedgerStore = ReturnType<typeof createLedgerStore>;

/** The app-wide ledger, loaded synchronously from storage and autosaved. */
export function useLedgerStore() {
  const [store] = useState(() => createLedgerStore(loadSavedState()));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      clearTimeout(timer);
      timer = undefined;
      saveState(store.getState());
    };
    const unsubscribe = store.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(flush, SAVE_DELAY_MS);
    });
    const onHide = () => {
      if (timer !== undefined) flush();
    };
    const onVisibility = () => document.visibilityState === "hidden" && onHide();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      unsubscribe();
      onHide();
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [store]);

  return { store, state: snapshot.state, canUndo: snapshot.undoDepth > 0 };
}
