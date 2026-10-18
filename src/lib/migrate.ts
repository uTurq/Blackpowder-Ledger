import {
  type CartridgeVisual,
  normalizeCartridgeVisual,
} from "../components/Cartridge";
import {
  CORRUPT_BACKUP_KEY,
  createDefaultState,
  ELEMENTS,
  LEGACY_STORAGE_KEYS,
  STORAGE_KEY,
  VIEWS,
} from "./defaults";
import { activeWeapon, reconcileSelection } from "./ledger";
import type {
  Ammo,
  LedgerState,
  Motion,
  Preset,
  Reminder,
  RollMode,
  View,
  Weapon,
} from "./types";
import { MAX_ACTIVITY, uid } from "./util";

type LegacyAmmo = Partial<Ammo> & { visual?: Partial<CartridgeVisual> };
type LegacyWeapon = Partial<Weapon> & {
  visual?: { metal?: string; stock?: string };
};
type LegacyState = Partial<
  Omit<LedgerState, "ammo" | "weapons" | "presets" | "theme" | "roller">
> & {
  activeView?: View;
  ammo?: LegacyAmmo[];
  weapons?: LegacyWeapon[];
  presets?: Partial<Preset>[];
  theme?: Partial<LedgerState["theme"]>;
  roller?: Partial<LedgerState["roller"]>;
};

const num = (value: unknown, fallback: number) =>
  Number.isFinite(Number(value)) && value !== null && value !== ""
    ? Number(value)
    : fallback;
const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T) =>
  options.includes(value as T) ? (value as T) : fallback;

/**
 * Turn any saved ledger (v3, v4, v5 or an exported file's `data`) into a
 * valid current-version state. Unknown or broken fields fall back to defaults.
 */
export function normalize(raw: unknown): LedgerState {
  const base = createDefaultState();
  if (!raw || typeof raw !== "object") return base;
  const input = raw as LegacyState;

  const ammo: Ammo[] =
    Array.isArray(input.ammo) && input.ammo.length
      ? input.ammo.map((a, i) => {
          const id = String(a.id || uid(`ammo${i}`));
          const visual = normalizeCartridgeVisual(a.visual, id, {
            color: a.color,
            symbol: a.symbol,
            fx: a.fx,
            shape: a.shape,
          });
          return {
            id,
            name: String(a.name || `Ammo ${i + 1}`),
            reserve: Math.max(0, Math.floor(num(a.reserve, 0))),
            cost: Math.max(0, num(a.cost, 0)),
            effect: String(a.effect || ""),
            color: visual.color,
            symbol: visual.symbol,
            fx: visual.fx,
            shape: String(a.shape || visual.family),
            visual,
          };
        })
      : base.ammo;
  const ammoIds = new Set(ammo.map((a) => a.id));
  const fitSlots = (slots: unknown, length: number) =>
    Array.from({ length }, (_, n) => {
      const id = Array.isArray(slots) ? slots[n] : null;
      return typeof id === "string" && ammoIds.has(id) ? id : null;
    });

  // Factory weapons and presets go through the same cleanup as saved ones so
  // they never point at ammunition or weapons this save doesn't have.
  const rawWeapons: LegacyWeapon[] =
    Array.isArray(input.weapons) && input.weapons.length ? input.weapons : base.weapons;
  const weapons: Weapon[] = rawWeapons.map((w, i) => {
    const capacity = Math.max(1, Math.min(20, Math.floor(num(w.capacity, 6))));
    const element = ELEMENTS.includes(w.element || "") ? w.element! : "off";
    return {
      id: String(w.id || `weapon-${i}`),
      name: String(w.name || "Field Weapon"),
      shortName: String(w.shortName || w.name || "Weapon"),
      type: w.type === "revolver" ? "revolver" : "lever",
      capacity,
      slots: fitSlots(w.slots, capacity),
      lastLoad: fitSlots(w.lastLoad, capacity),
      element,
      lastElement:
        ELEMENTS.includes(w.lastElement || "") && w.lastElement !== "off"
          ? String(w.lastElement)
          : element !== "off"
            ? element
            : "fire",
      finish: String(w.finish || w.visual?.metal || "blackened"),
      stock: String(w.stock || w.visual?.stock || "walnut"),
    };
  });
  const weaponIds = new Set(weapons.map((w) => w.id));

  const rawPresets: Partial<Preset>[] = Array.isArray(input.presets)
    ? input.presets
    : base.presets;
  const presets: Preset[] = rawPresets
    .filter((p) => Boolean(p && p.weaponId && weaponIds.has(p.weaponId)))
    .map((p) => ({
      id: String(p.id || uid("preset")),
      name: String(p.name || "Field Load"),
      weaponId: String(p.weaponId),
      favorite: Boolean(p.favorite),
      slots: fitSlots(
        p.slots,
        weapons.find((w) => w.id === p.weaponId)?.capacity || 6,
      ),
    }));

  const reminders: Reminder[] = Array.isArray(input.reminders)
    ? input.reminders
        .filter((r) => r && typeof r === "object")
        .map((r) => ({
          id: String(r.id || uid("reminder")),
          label: String(r.label || "Reminder"),
          detail: String(r.detail || ""),
          turns: r.turns === null || r.turns === undefined ? null : num(r.turns, 1),
          color: String(r.color || "#c7954b"),
        }))
    : [];

  const theme = { ...base.theme, ...input.theme };
  const roller = { ...base.roller, ...input.roller };
  const state: LedgerState = {
    version: 5,
    characterName: String(input.characterName ?? base.characterName),
    gold: Math.max(0, num(input.gold, base.gold)),
    view: oneOf(input.view || input.activeView, VIEWS, "armory"),
    activeWeaponId:
      input.activeWeaponId && weaponIds.has(input.activeWeaponId)
        ? input.activeWeaponId
        : weapons[0].id,
    combatMode: Boolean(input.combatMode),
    selectedAmmoId:
      input.selectedAmmoId && ammoIds.has(input.selectedAmmoId)
        ? input.selectedAmmoId
        : null,
    sound: Boolean(input.sound ?? base.sound),
    elementalUnlocked: Boolean(input.elementalUnlocked ?? base.elementalUnlocked),
    inventoryEdit: Boolean(input.inventoryEdit),
    turn: Math.max(1, Math.floor(num(input.turn, 1))),
    reminders,
    theme: {
      ...theme,
      motion: oneOf<Motion>(theme.motion, ["full", "reduced", "off"], "full"),
      density: oneOf(theme.density, ["all", "focused", "minimal"] as const, "all"),
    },
    ammo,
    weapons,
    presets,
    activity: Array.isArray(input.activity)
      ? input.activity.slice(0, MAX_ACTIVITY).map((a) => ({
          id: String(a.id || uid("act")),
          text: String(a.text || "Ledger activity"),
          time: num(a.time, Date.now()),
          kind: String(a.kind || "system"),
        }))
      : base.activity,
    roller: {
      enabled: Boolean(roller.enabled),
      dex: num(roller.dex, 0),
      prof: num(roller.prof, 0),
      misc: num(roller.misc, 0),
      mode: oneOf<RollMode>(roller.mode, ["normal", "advantage", "disadvantage"], "normal"),
      last: roller.last ? String(roller.last) : null,
    },
    savedAt: num(input.savedAt, Date.now()),
  };
  if (state.combatMode) state.view = "armory";
  reconcileSelection(state, activeWeapon(state));
  return state;
}

/** Accepts either a raw state or an exported `{ app, exportedAt, data }` file. */
export function parseSaveFile(text: string): LedgerState {
  const parsed = JSON.parse(text);
  const data = parsed && typeof parsed === "object" && "data" in parsed ? parsed.data : parsed;
  if (!data || typeof data !== "object" || !("ammo" in data || "weapons" in data))
    throw new Error("Not a Blackpowder Ledger save.");
  return normalize(data);
}

/** Newest save first, falling back through legacy keys. */
export function loadSavedState(storage: Storage | undefined = safeStorage()): LedgerState {
  if (!storage) return createDefaultState();
  for (const key of [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]) {
    let raw: string | null = null;
    try {
      raw = storage.getItem(key);
      if (raw) return normalize(JSON.parse(raw));
    } catch {
      // Keep the unreadable copy before autosave replaces it.
      try {
        if (raw) storage.setItem(CORRUPT_BACKUP_KEY, raw);
      } catch {}
    }
  }
  return createDefaultState();
}

export function saveState(state: LedgerState, storage: Storage | undefined = safeStorage()) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** localStorage can be missing or throw (private mode, blocked site data). */
export function safeStorage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
