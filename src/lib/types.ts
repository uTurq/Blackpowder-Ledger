import type {
  AnimationDensity,
  CartridgeVisual,
} from "../components/Cartridge";

export type View = "armory" | "workshop" | "presets" | "settings";
export type SettingsTab =
  | "appearance"
  | "combat"
  | "animation"
  | "weapons"
  | "ammunition"
  | "data";
export type Motion = "full" | "reduced" | "off";
export type RollMode = "normal" | "advantage" | "disadvantage";

/** One magazine/cylinder layout: an ammunition id per slot, or null when empty. */
export type Plan = (string | null)[];

export type Ammo = {
  id: string;
  name: string;
  reserve: number;
  cost: number;
  effect: string;
  // color/symbol/fx/shape mirror `visual` and are kept for v3/v4 save compatibility.
  color: string;
  symbol: string;
  fx: string;
  shape: string;
  visual: CartridgeVisual;
};
export type Weapon = {
  id: string;
  name: string;
  shortName: string;
  type: "lever" | "revolver";
  capacity: number;
  slots: Plan;
  lastLoad: Plan;
  element: string;
  lastElement: string;
  finish: string;
  stock: string;
};
export type Preset = {
  id: string;
  name: string;
  weaponId: string;
  slots: Plan;
  favorite?: boolean;
};
export type Activity = { id: string; text: string; time: number; kind: string };
export type Reminder = {
  id: string;
  label: string;
  detail: string;
  turns: number | null;
  color: string;
};
export type Theme = {
  environment: string;
  material: string;
  accent: string;
  panelOpacity: number;
  backgroundIntensity: number;
  vignette: number;
  blur: number;
  atmosphere: number;
  motion: Motion;
  density: AnimationDensity;
  intensity: number;
  scale: number;
};
export type Roller = {
  enabled: boolean;
  dex: number;
  prof: number;
  misc: number;
  mode: RollMode;
  last: string | null;
};
export type LedgerState = {
  version: number;
  characterName: string;
  gold: number;
  view: View;
  activeWeaponId: string;
  combatMode: boolean;
  selectedAmmoId: string | null;
  sound: boolean;
  elementalUnlocked: boolean;
  inventoryEdit: boolean;
  turn: number;
  reminders: Reminder[];
  theme: Theme;
  ammo: Ammo[];
  weapons: Weapon[];
  presets: Preset[];
  activity: Activity[];
  roller: Roller;
  savedAt: number;
};

/** A crafting batch: quantity queued per ammunition id. */
export type Batch = Record<string, number>;

export type DialogState = {
  type:
    | "renamePreset"
    | "savePreset"
    | "deletePreset"
    | "deleteAmmo"
    | "discardCraft"
    | "reset"
    | "newAmmo";
  id?: string;
  title: string;
  value?: string;
  body: string;
} | null;
