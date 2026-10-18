import { describe, expect, it } from "vitest";
import { createDefaultState } from "../src/lib/defaults";
import {
  activeWeapon,
  advanceTurn,
  ammoInUse,
  availableFor,
  craftBatch,
  craftPresetShortfall,
  deleteAmmoType,
  findAmmo,
  findWeapon,
  fireRound,
  loadedCount,
  loadPreset,
  loadWeapon,
  maxAffordable,
  presetShortfall,
  rollAttack,
  sanitizeBatch,
  startEncounter,
  unloadWeapon,
} from "../src/lib/ledger";
import type { LedgerState } from "../src/lib/types";

/** Total rounds of a type across reserve and every weapon. */
function owned(state: LedgerState, id: string) {
  return (
    findAmmo(state, id)!.reserve +
    state.weapons.reduce((n, w) => n + w.slots.filter((x) => x === id).length, 0)
  );
}

describe("loading", () => {
  it("moves rounds between reserve and the weapon without creating or losing any", () => {
    const s = createDefaultState();
    const before = s.ammo.map((a) => owned(s, a.id));
    const plan = Array(11).fill("armor");
    plan[8] = plan[9] = plan[10] = null;
    expect(loadWeapon(s, "lever", plan)).toBe(true);
    expect(findWeapon(s, "lever")!.slots.filter((x) => x === "armor")).toHaveLength(8);
    expect(findAmmo(s, "armor")!.reserve).toBe(0);
    // The displaced standard/hollow/fmj/explosive rounds went back to reserve.
    expect(s.ammo.map((a) => owned(s, a.id))).toEqual(before);
    expect(findWeapon(s, "lever")!.lastLoad).toEqual(findWeapon(s, "lever")!.slots);
  });

  it("refuses a plan that needs more rounds than exist", () => {
    const s = createDefaultState();
    expect(loadWeapon(s, "revolver", Array(6).fill("explosive"))).toBe(true);
    expect(loadWeapon(s, "lever", Array(11).fill("explosive"))).toBe(false);
    expect(findWeapon(s, "lever")!.slots[6]).toBe("explosive");
    expect(findAmmo(s, "explosive")!.reserve).toBe(0);
  });

  it("drops unknown ammunition and trims plans to capacity", () => {
    const s = createDefaultState();
    expect(loadWeapon(s, "revolver", ["ghost", "silver", null, null, null, null, "silver"])).toBe(true);
    expect(findWeapon(s, "revolver")!.slots).toEqual([null, "silver", null, null, null, null]);
  });

  it("counts what the weapon already holds as available", () => {
    const s = createDefaultState();
    const lever = findWeapon(s, "lever")!;
    expect(availableFor(s, lever, "explosive")).toBe(7);
  });

  it("returns every round on unload and clears the selection", () => {
    const s = createDefaultState();
    const reserve = findAmmo(s, "standard")!.reserve;
    expect(unloadWeapon(s, "lever")).toBe(7);
    expect(findAmmo(s, "standard")!.reserve).toBe(reserve + 3);
    expect(loadedCount(findWeapon(s, "lever")!.slots)).toBe(0);
    expect(s.selectedAmmoId).toBeNull();
  });
});

describe("firing and Tactical Selection", () => {
  it("spends one round of the chosen type and keeps it selected while any remain", () => {
    const s = createDefaultState();
    s.selectedAmmoId = "hollow";
    expect(fireRound(s, "lever", "hollow")?.id).toBe("hollow");
    expect(s.selectedAmmoId).toBe("hollow");
    expect(fireRound(s, "lever", "hollow")?.id).toBe("hollow");
    // Hollow points are exhausted: fall back to the first loaded round.
    expect(s.selectedAmmoId).toBe("standard");
    expect(fireRound(s, "lever", "hollow")).toBeNull();
  });

  it("does not touch reserve when firing", () => {
    const s = createDefaultState();
    const reserve = findAmmo(s, "fmj")!.reserve;
    fireRound(s, "lever", "fmj");
    expect(findAmmo(s, "fmj")!.reserve).toBe(reserve);
  });

  it("adds combat reminders for special rounds and expires them by turn", () => {
    const s = createDefaultState();
    fireRound(s, "lever", "explosive");
    expect(s.reminders.map((r) => r.id)).toEqual(["explosive"]);
    advanceTurn(s);
    expect(s.turn).toBe(2);
    expect(s.reminders).toHaveLength(0);
  });

  it("starts each encounter at turn 1 without the last fight's reminders", () => {
    const s = createDefaultState();
    fireRound(s, "lever", "explosive");
    advanceTurn(s);
    advanceTurn(s);
    fireRound(s, "lever", "fmj");
    s.reminders.push({ id: "x", label: "Old", detail: "", turns: null, color: "#fff" });
    s.view = "settings";
    startEncounter(s);
    expect(s).toMatchObject({ combatMode: true, view: "armory", turn: 1, reminders: [] });
  });
});

describe("presets and crafting", () => {
  it("reports and crafts exactly the rounds a preset is missing", () => {
    const s = createDefaultState();
    const boss = s.presets.find((p) => p.id === "preset-boss")!;
    findAmmo(s, "armor")!.reserve = 0;
    expect(presetShortfall(s, boss)).toEqual([{ ammo: findAmmo(s, "armor"), qty: 2 }]);
    const gold = s.gold;
    expect(craftPresetShortfall(s, boss)).toBe(true);
    expect(s.gold).toBe(gold - 2 * 3);
    expect(presetShortfall(s, boss)).toEqual([]);
    expect(loadPreset(s, boss)).toBe(true);
    expect(findWeapon(s, "lever")!.slots).toEqual(boss.slots);
  });

  it("switches to the preset's weapon and keeps a still-loaded selection", () => {
    const s = createDefaultState();
    s.activeWeaponId = "revolver";
    s.selectedAmmoId = "fmj";
    const patrol = s.presets.find((p) => p.id === "preset-standard")!;
    expect(loadPreset(s, patrol)).toBe(true);
    expect(activeWeapon(s).id).toBe("lever");
    expect(s.selectedAmmoId).toBe("fmj");
  });

  it("refuses a batch the gold cannot cover", () => {
    const s = createDefaultState();
    s.gold = 4;
    expect(craftBatch(s, { explosive: 1 })).toBe(false);
    expect(craftBatch(s, { standard: 4 })).toBe(true);
    expect(s.gold).toBe(0);
  });

  it("limits MAX to what remains after the rest of the batch", () => {
    const s = createDefaultState();
    s.gold = 20;
    const explosive = findAmmo(s, "explosive")!;
    expect(maxAffordable(s, { standard: 10 }, explosive)).toBe(2);
  });

  it("cleans stored batches of deleted ammunition and junk", () => {
    const s = createDefaultState();
    expect(sanitizeBatch(s, { standard: 2, gone: 5, hollow: -1, toxic: "3" })).toEqual({
      standard: 2,
      toxic: 3,
    });
  });
});

describe("ammunition catalog", () => {
  it("treats a type as in use while it is held anywhere", () => {
    const s = createDefaultState();
    expect(ammoInUse(s, "standard")).toBe(true);
    findAmmo(s, "silver")!.reserve = 0;
    expect(ammoInUse(s, "silver")).toBe(false);
  });

  it("removes every reference to a deleted type, including the last load", () => {
    const s = createDefaultState();
    deleteAmmoType(s, "explosive");
    const lever = findWeapon(s, "lever")!;
    expect(lever.slots).not.toContain("explosive");
    expect(lever.lastLoad).not.toContain("explosive");
    expect(s.presets.every((p) => !p.slots.includes("explosive"))).toBe(true);
  });
});

it("rolls with advantage and disadvantage", () => {
  const rolls = [4, 17];
  const d20 = () => rolls.shift()!;
  const roller = { ...createDefaultState().roller, mode: "advantage" as const };
  expect(rollAttack(roller, d20)).toEqual({ total: 25, text: "4 / 17 + 8 = 25" });
  const low = [4, 17];
  expect(rollAttack({ ...roller, mode: "disadvantage" }, () => low.shift()!).total).toBe(12);
});
