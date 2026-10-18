import { describe, expect, it } from "vitest";
import { CORRUPT_BACKUP_KEY, createDefaultState, STORAGE_KEY } from "../src/lib/defaults";
import { loadSavedState, normalize, parseSaveFile, saveState } from "../src/lib/migrate";

describe("save migration", () => {
  it("upgrades a v3 save with legacy ammo and weapon visuals", () => {
    const v3 = {
      activeView: "presets",
      gold: "42",
      ammo: [
        { id: "standard", name: "Plain", reserve: 3, cost: 1, color: "#123456", shape: "standard" },
        { id: "slug", name: "Heavy Slug", reserve: "4.7", cost: 2, color: "#abcdef", symbol: "S", shape: "heavy" },
      ],
      weapons: [
        { id: "lever", name: "Old Lever", capacity: 3, slots: ["slug", "missing", "standard"], visual: { metal: "brass", stock: "ivory" } },
      ],
      presets: [{ id: "p1", weaponId: "lever", slots: ["slug"] }, { weaponId: "nope", slots: [] }],
    };
    localStorage.setItem("blackpowder-ledger-v3", JSON.stringify(v3));
    const s = loadSavedState();
    expect(s.version).toBe(5);
    expect(s.view).toBe("presets");
    expect(s.gold).toBe(42);
    const slug = s.ammo.find((a) => a.id === "slug")!;
    expect(slug.reserve).toBe(4);
    expect(slug.visual.family).toBe("heavyRifle");
    expect(slug.visual.color).toBe("#abcdef");
    expect(s.weapons[0]).toMatchObject({
      finish: "brass",
      stock: "ivory",
      slots: ["slug", null, "standard"],
      lastLoad: [null, null, null],
    });
    expect(s.presets).toHaveLength(1);
    expect(s.presets[0].slots).toEqual(["slug", null, null]);
    // The saved selection is gone, so Tactical Selection picks a loaded round.
    expect(s.selectedAmmoId).toBe("slug");
  });

  it("prefers the newest save key", () => {
    localStorage.setItem("blackpowder-ledger-v4", JSON.stringify({ characterName: "Old" }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ characterName: "New" }));
    expect(loadSavedState().characterName).toBe("New");
  });

  it("backs up an unreadable save instead of letting autosave erase it", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");
    localStorage.setItem("blackpowder-ledger-v4", JSON.stringify({ characterName: "Older" }));
    expect(loadSavedState().characterName).toBe("Older");
    expect(localStorage.getItem(CORRUPT_BACKUP_KEY)).toBe("{not json");
  });

  it("round-trips the current state unchanged", () => {
    const s = normalize(createDefaultState());
    saveState(s);
    expect(loadSavedState()).toEqual(s);
  });

  it("keeps factory loadouts consistent with a custom ammo catalog", () => {
    const s = normalize({ ammo: [{ id: "standard", reserve: 5 }] });
    expect(s.weapons[0].slots).toEqual(["standard", "standard", "standard", null, null, null, null, null, null, null, null]);
    expect(s.presets[1].slots.every((x) => x === null)).toBe(true);
  });

  it("falls back to defaults for junk values", () => {
    const s = normalize({
      theme: { motion: "warp", density: 3 },
      roller: { mode: "chaos", dex: "x" },
      turn: -4,
      weapons: [{ capacity: 999 }],
    });
    expect(s.theme.motion).toBe("full");
    expect(s.theme.density).toBe("all");
    expect(s.roller.mode).toBe("normal");
    expect(s.roller.dex).toBe(0);
    expect(s.turn).toBe(1);
    expect(s.weapons[0].capacity).toBe(20);
    // Factory presets belonged to the factory lever-action, which this save lacks.
    expect(s.presets).toEqual([]);
    expect(normalize(null)).toMatchObject({ version: 5, gold: 120 });
  });
});

describe("portable save files", () => {
  it("imports an exported file and a bare state", () => {
    const state = { ...createDefaultState(), characterName: "Exported" };
    const file = JSON.stringify({ app: "Blackpowder Ledger", exportedAt: "x", data: state });
    expect(parseSaveFile(file).characterName).toBe("Exported");
    expect(parseSaveFile(JSON.stringify(state)).characterName).toBe("Exported");
  });

  it("rejects files that are not ledger saves", () => {
    expect(() => parseSaveFile("[]")).toThrow();
    expect(() => parseSaveFile('{"hello":1}')).toThrow();
    expect(() => parseSaveFile("nope")).toThrow();
  });
});
