// Pure armory rules. Functions that take a `draft` mutate a cloned state in
// place (the store hands them a fresh copy); the rest only read.
import type {
  Ammo,
  Batch,
  LedgerState,
  Plan,
  Preset,
  Weapon,
} from "./types";
import { blankSlots, uid } from "./util";

export function findWeapon(state: LedgerState, id: string | null | undefined) {
  return state.weapons.find((w) => w.id === id);
}
export function findAmmo(state: LedgerState, id: string | null | undefined) {
  return id ? state.ammo.find((a) => a.id === id) : undefined;
}
export function activeWeapon(state: LedgerState): Weapon {
  return findWeapon(state, state.activeWeaponId) || state.weapons[0];
}
export function countIn(slots: Plan, ammoId: string) {
  return slots.filter((id) => id === ammoId).length;
}
export function loadedCount(slots: Plan) {
  return slots.filter(Boolean).length;
}

/** Rounds of one type that can go into a weapon: reserve plus what it already holds. */
export function availableFor(state: LedgerState, weapon: Weapon, ammoId: string) {
  return (findAmmo(state, ammoId)?.reserve || 0) + countIn(weapon.slots, ammoId);
}

/** Fit a plan to the weapon's capacity and drop ammunition that no longer exists. */
export function sanitizePlan(state: LedgerState, weapon: Weapon, plan: Plan): Plan {
  const known = new Set(state.ammo.map((a) => a.id));
  return Array.from({ length: weapon.capacity }, (_, i) => {
    const id = plan[i];
    return id && known.has(id) ? id : null;
  });
}

/** Rounds missing, per type, before `plan` can be loaded into `weapon`. */
export function shortfall(state: LedgerState, weapon: Weapon, plan: Plan) {
  return state.ammo
    .map((ammo) => ({
      ammo,
      qty: Math.max(0, countIn(plan, ammo.id) - availableFor(state, weapon, ammo.id)),
    }))
    .filter((x) => x.qty > 0);
}

/**
 * Tactical Selection: keep the chosen type armed while the weapon still holds
 * it, otherwise fall back to the first loaded round.
 */
export function reconcileSelection(draft: LedgerState, weapon: Weapon) {
  if (!draft.selectedAmmoId || !weapon.slots.includes(draft.selectedAmmoId))
    draft.selectedAmmoId = weapon.slots.find(Boolean) ?? null;
}

/** Seat a plan, returning displaced rounds to reserve. False on a shortage. */
export function loadWeapon(draft: LedgerState, weaponId: string, plan: Plan) {
  const weapon = findWeapon(draft, weaponId);
  if (!weapon) return false;
  const next = sanitizePlan(draft, weapon, plan);
  if (shortfall(draft, weapon, next).length) return false;
  const pool = new Map(
    draft.ammo.map((a) => [a.id, availableFor(draft, weapon, a.id)]),
  );
  for (const ammo of draft.ammo)
    ammo.reserve = (pool.get(ammo.id) || 0) - countIn(next, ammo.id);
  weapon.slots = [...next];
  weapon.lastLoad = [...next];
  if (draft.activeWeaponId === weapon.id) reconcileSelection(draft, weapon);
  return true;
}

/** Return every loaded round to reserve. Returns the number extracted. */
export function unloadWeapon(draft: LedgerState, weaponId: string) {
  const weapon = findWeapon(draft, weaponId);
  if (!weapon) return 0;
  let extracted = 0;
  for (const id of weapon.slots) {
    const ammo = findAmmo(draft, id);
    if (ammo) {
      ammo.reserve++;
      extracted++;
    }
  }
  weapon.slots = blankSlots(weapon.capacity);
  if (draft.activeWeaponId === weapon.id) draft.selectedAmmoId = null;
  return extracted;
}

export function addReminder(draft: LedgerState, ammo: Ammo) {
  draft.reminders = draft.reminders.filter((r) => r.id !== ammo.id);
  if (ammo.id === "explosive")
    draft.reminders.unshift({
      id: "explosive",
      label: "Blast spent",
      detail: "Explosive splash used this round.",
      turns: 1,
      color: ammo.color,
    });
  if (ammo.id === "toxic")
    draft.reminders.unshift({
      id: uid("toxic"),
      label: "Toxic payload",
      detail: "Apply 1d4 at the start of the target’s turn.",
      turns: 2,
      color: ammo.color,
    });
  if (ammo.id === "tracer")
    draft.reminders.unshift({
      id: "tracer",
      label: "Confirm tracer",
      detail: "On a miss, mark advantage for the next firearm attack.",
      turns: null,
      color: ammo.color,
    });
}

/** Spend one round of the selected type. Returns it, or null if none is loaded. */
export function fireRound(draft: LedgerState, weaponId: string, ammoId: string) {
  const weapon = findWeapon(draft, weaponId);
  const ammo = findAmmo(draft, ammoId);
  if (!weapon || !ammo) return null;
  const slot = weapon.slots.indexOf(ammoId);
  if (slot < 0) return null;
  weapon.slots[slot] = null;
  addReminder(draft, ammo);
  if (draft.activeWeaponId === weapon.id) reconcileSelection(draft, weapon);
  return ammo;
}

export function advanceTurn(draft: LedgerState) {
  draft.turn += 1;
  draft.reminders = draft.reminders
    .map((r) => (r.turns === null ? r : { ...r, turns: r.turns - 1 }))
    .filter((r) => r.turns === null || r.turns > 0);
}

export function batchCount(state: LedgerState, batch: Batch) {
  return state.ammo.reduce((n, a) => n + (batch[a.id] || 0), 0);
}
export function batchCost(state: LedgerState, batch: Batch) {
  return state.ammo.reduce((n, a) => n + (batch[a.id] || 0) * a.cost, 0);
}
/** Most of one type the remaining gold can buy alongside the rest of the batch. */
export function maxAffordable(state: LedgerState, batch: Batch, ammo: Ammo) {
  if (!ammo.cost) return 99;
  const others = batchCost(state, { ...batch, [ammo.id]: 0 });
  return Math.max(0, Math.floor((state.gold - others) / ammo.cost));
}
/** Keep only positive whole quantities of ammunition that still exists. */
export function sanitizeBatch(state: LedgerState, raw: unknown): Batch {
  const batch: Batch = {};
  if (!raw || typeof raw !== "object") return batch;
  for (const ammo of state.ammo) {
    const qty = Math.floor(Number((raw as Batch)[ammo.id]) || 0);
    if (qty > 0) batch[ammo.id] = qty;
  }
  return batch;
}
export function craftBatch(draft: LedgerState, batch: Batch) {
  const cost = batchCost(draft, batch);
  if (!batchCount(draft, batch) || cost > draft.gold) return false;
  draft.gold -= cost;
  for (const ammo of draft.ammo) ammo.reserve += batch[ammo.id] || 0;
  return true;
}

export function presetShortfall(state: LedgerState, preset: Preset) {
  const weapon = findWeapon(state, preset.weaponId);
  return weapon ? shortfall(state, weapon, preset.slots) : [];
}
export function loadPreset(draft: LedgerState, preset: Preset) {
  if (!findWeapon(draft, preset.weaponId)) return false;
  const previous = draft.activeWeaponId;
  draft.activeWeaponId = preset.weaponId;
  if (loadWeapon(draft, preset.weaponId, preset.slots)) return true;
  draft.activeWeaponId = previous;
  return false;
}
/** Buy exactly the rounds a preset is missing. */
export function craftPresetShortfall(draft: LedgerState, preset: Preset) {
  const missing = presetShortfall(draft, preset);
  const batch = Object.fromEntries(missing.map((m) => [m.ammo.id, m.qty]));
  return craftBatch(draft, batch);
}

/** Remove an ammunition type and every reference to it. */
export function deleteAmmoType(draft: LedgerState, ammoId: string) {
  draft.ammo = draft.ammo.filter((a) => a.id !== ammoId);
  const clear = (slots: Plan) => slots.map((id) => (id === ammoId ? null : id));
  for (const weapon of draft.weapons) {
    weapon.slots = clear(weapon.slots);
    weapon.lastLoad = clear(weapon.lastLoad);
  }
  for (const preset of draft.presets) preset.slots = clear(preset.slots);
  if (draft.selectedAmmoId === ammoId) reconcileSelection(draft, activeWeapon(draft));
}
export function ammoInUse(state: LedgerState, ammoId: string) {
  return (
    (findAmmo(state, ammoId)?.reserve || 0) > 0 ||
    state.weapons.some((w) => w.slots.includes(ammoId)) ||
    state.presets.some((p) => p.slots.includes(ammoId))
  );
}

export function rollAttack(
  roller: LedgerState["roller"],
  d20 = () => Math.ceil(Math.random() * 20),
) {
  const a = d20(),
    b = d20();
  const chosen =
    roller.mode === "advantage"
      ? Math.max(a, b)
      : roller.mode === "disadvantage"
        ? Math.min(a, b)
        : a;
  const bonus = roller.dex + roller.prof + roller.misc;
  return {
    total: chosen + bonus,
    text: `${roller.mode === "normal" ? a : `${a} / ${b}`} + ${bonus} = ${chosen + bonus}`,
  };
}
