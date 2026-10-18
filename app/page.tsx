"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BANDS,
  CARTRIDGE_FAMILIES,
  CASE_MATERIALS,
  Cartridge,
  type CartridgeVisual,
  EFFECTS,
  FX_PLACEMENTS,
  INTENSITIES,
  MARKINGS,
  normalizeCartridgeVisual,
  PROJECTILES,
  PROJECTILE_MATERIALS,
  STYLE_PRESETS,
  TIP_STYLES,
  type AnimationDensity,
} from "./cartridge";
import { type PwaInstallStatus, usePwaInstall } from "./pwa";

type View = "armory" | "workshop" | "presets" | "settings";
type SettingsTab =
  | "appearance"
  | "combat"
  | "animation"
  | "weapons"
  | "ammunition"
  | "data";
type Motion = "full" | "reduced" | "off";
type Ammo = {
  id: string;
  name: string;
  reserve: number;
  cost: number;
  effect: string;
  color: string;
  symbol: string;
  fx: string;
  shape: string;
  visual: CartridgeVisual;
};
type Weapon = {
  id: string;
  name: string;
  shortName: string;
  type: "lever" | "revolver";
  capacity: number;
  slots: (string | null)[];
  lastLoad: (string | null)[];
  element: string;
  lastElement: string;
  finish: string;
  stock: string;
};
type Preset = {
  id: string;
  name: string;
  weaponId: string;
  slots: (string | null)[];
  favorite?: boolean;
};
type Activity = { id: string; text: string; time: number; kind: string };
type Reminder = {
  id: string;
  label: string;
  detail: string;
  turns: number | null;
  color: string;
};
type Theme = {
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
type LedgerState = {
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
  roller: {
    enabled: boolean;
    dex: number;
    prof: number;
    misc: number;
    mode: "normal" | "advantage" | "disadvantage";
    last: string | null;
  };
  savedAt: number;
};
type DialogState = {
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
type LegacyAmmo = Partial<Ammo> & {
  visual?: Partial<CartridgeVisual>;
};
type LegacyWeapon = Partial<Weapon> & {
  visual?: { metal?: string; stock?: string };
};
type LegacyState = Partial<LedgerState> & {
  activeView?: View;
  ammo?: LegacyAmmo[];
  weapons?: LegacyWeapon[];
  presets?: Partial<Preset>[];
};

const STORAGE_KEY = "blackpowder-ledger-v5";
const ACCENTS: Record<string, [string, string]> = {
  brass: ["#c7954b", "#f0c77a"],
  copper: ["#b86c42", "#f1a16c"],
  silver: ["#aebac2", "#edf6fa"],
  ember: ["#d45d31", "#ff9a55"],
  moonstone: ["#7e9fbe", "#c6ddf1"],
  arcane: ["#7c68d0", "#c1b2ff"],
};
const ENVIRONMENTS = [
  ["desert", "Desert at Dusk"],
  ["moon", "Moonlit Dunes"],
  ["workshop", "Gunsmith Workshop"],
  ["forge", "Blackpowder Forge"],
  ["camp", "Bounty Hunter Camp"],
  ["arcane", "Arcane Laboratory"],
  ["plain", "No Environment"],
];
const MATERIALS = [
  ["gunmetal", "Field Gunmetal"],
  ["blackened", "Blackened Steel"],
  ["brass", "Weathered Brass"],
  ["leather", "Dark Leather"],
  ["wood", "Wood & Steel"],
  ["paper", "Bounty Board"],
  ["glass", "Arcane Glass"],
];
const ELEMENTS = [
  "off",
  "fire",
  "cold",
  "lightning",
  "acid",
  "thunder",
  "necrotic",
  "radiant",
];

const DEFAULT_AMMO: Ammo[] = [
  {
    id: "standard",
    name: "Standard Round",
    reserve: 28,
    cost: 1,
    effect: "Reliable baseline ammunition.",
    color: "#b87333",
    symbol: "•",
    fx: "none",
    shape: "standard",
    visual: STYLE_PRESETS.standard,
  },
  {
    id: "hollow",
    name: "Hollow Point",
    reserve: 12,
    cost: 2,
    effect: "+1d4 piercing damage.",
    color: "#d7604e",
    symbol: "H",
    fx: "impact",
    shape: "hollow",
    visual: STYLE_PRESETS.hollow,
  },
  {
    id: "explosive",
    name: "Explosive Shell",
    reserve: 6,
    cost: 5,
    effect: "+1d6 fire damage; 5-foot blast, once per round.",
    color: "#ef7f28",
    symbol: "✦",
    fx: "flame",
    shape: "heavy",
    visual: STYLE_PRESETS.explosive,
  },
  {
    id: "armor",
    name: "Armor-Piercing Round",
    reserve: 8,
    cost: 3,
    effect: "+2 to hit and damage against heavy armor or metal targets.",
    color: "#9aa2a7",
    symbol: "▲",
    fx: "spark",
    shape: "needle",
    visual: STYLE_PRESETS.armor,
  },
  {
    id: "tracer",
    name: "Tracer Round",
    reserve: 8,
    cost: 2,
    effect: "After a miss, gain advantage on your next firearm attack.",
    color: "#ff5146",
    symbol: "T",
    fx: "tracer",
    shape: "carbine",
    visual: STYLE_PRESETS.tracer,
  },
  {
    id: "silver",
    name: "Silver Bullet",
    reserve: 6,
    cost: 5,
    effect: "Silvered ammunition for creatures affected by silver.",
    color: "#dfe8ed",
    symbol: "☾",
    fx: "radiant",
    shape: "short",
    visual: STYLE_PRESETS.silver,
  },
  {
    id: "toxic",
    name: "Toxic Round",
    reserve: 6,
    cost: 4,
    effect: "1d4 poison damage at the start of the target’s next two turns.",
    color: "#74d45f",
    symbol: "V",
    fx: "poison",
    shape: "capsule",
    visual: STYLE_PRESETS.toxic,
  },
  {
    id: "fmj",
    name: "Full Metal Jacket",
    reserve: 10,
    cost: 3,
    effect:
      "Deals 1d6 piercing damage to a creature directly behind the target.",
    color: "#8fc4dc",
    symbol: "F",
    fx: "tracer",
    shape: "long",
    visual: STYLE_PRESETS.fmj,
  },
];

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
function blankSlots(n: number) {
  return Array.from({ length: n }, () => null);
}
function activity(text: string, kind = "system"): Activity {
  return { id: uid("act"), text, time: Date.now(), kind };
}

const DEFAULT_STATE: LedgerState = {
  version: 5,
  characterName: "AC-3's Field Armory",
  gold: 120,
  view: "armory",
  activeWeaponId: "lever",
  combatMode: false,
  selectedAmmoId: "standard",
  sound: false,
  elementalUnlocked: true,
  inventoryEdit: false,
  turn: 1,
  reminders: [],
  theme: {
    environment: "desert",
    material: "gunmetal",
    accent: "brass",
    panelOpacity: 86,
    backgroundIntensity: 82,
    vignette: 28,
    blur: 0,
    atmosphere: 42,
    motion: "full",
    density: "all",
    intensity: 74,
    scale: 100,
  },
  ammo: DEFAULT_AMMO,
  weapons: [
    {
      id: "lever",
      name: "Wayfarer Lever-Action",
      shortName: "Lever-Action",
      type: "lever",
      capacity: 11,
      slots: [
        "standard",
        "standard",
        "standard",
        "hollow",
        "hollow",
        "fmj",
        "explosive",
        null,
        null,
        null,
        null,
      ],
      lastLoad: [
        "standard",
        "standard",
        "standard",
        "hollow",
        "hollow",
        "fmj",
        "explosive",
        null,
        null,
        null,
        null,
      ],
      element: "off",
      lastElement: "fire",
      finish: "blackened",
      stock: "walnut",
    },
    {
      id: "revolver",
      name: "Sidewinder Revolver",
      shortName: "Revolver",
      type: "revolver",
      capacity: 6,
      slots: ["standard", "standard", "hollow", "fmj", null, null],
      lastLoad: ["standard", "standard", "hollow", "fmj", null, null],
      element: "off",
      lastElement: "lightning",
      finish: "steel",
      stock: "ebony",
    },
  ],
  presets: [
    {
      id: "preset-standard",
      name: "Standard Patrol",
      weaponId: "lever",
      favorite: true,
      slots: [
        "standard",
        "standard",
        "standard",
        "standard",
        "hollow",
        "hollow",
        "fmj",
        "fmj",
        "explosive",
        null,
        null,
      ],
    },
    {
      id: "preset-boss",
      name: "Boss Killer",
      weaponId: "lever",
      slots: [
        "hollow",
        "hollow",
        "hollow",
        "fmj",
        "fmj",
        "armor",
        "armor",
        "explosive",
        "explosive",
        null,
        null,
      ],
    },
  ],
  activity: [activity("Blackpowder Ledger Charmworks initialized.")],
  roller: {
    enabled: false,
    dex: 5,
    prof: 3,
    misc: 0,
    mode: "normal",
    last: null,
  },
  savedAt: Date.now(),
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
function normalize(raw: unknown): LedgerState {
  const base = clone(DEFAULT_STATE);
  if (!raw || typeof raw !== "object") return base;
  const input = raw as LegacyState;
  const ammo: Array<Ammo> =
    Array.isArray(input.ammo) && input.ammo.length
      ? input.ammo.map((a: LegacyAmmo, i: number) => {
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
            reserve: Math.max(0, Math.floor(Number(a.reserve) || 0)),
            cost: Math.max(0, Number(a.cost) || 0),
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
  const weapons: Array<Weapon> =
    Array.isArray(input.weapons) && input.weapons.length
      ? input.weapons.map((w: LegacyWeapon, i: number) => {
          const capacity = Math.max(1, Math.min(20, Number(w.capacity) || 6));
          const slots = Array.from({ length: capacity }, (_, n) =>
            ammoIds.has(w.slots?.[n] || "") ? w.slots?.[n] || null : null,
          );
          return {
            id: String(w.id || `weapon-${i}`),
            name: String(w.name || "Field Weapon"),
            shortName: String(w.shortName || w.name || "Weapon"),
            type: w.type === "revolver" ? "revolver" : "lever",
            capacity,
            slots,
            lastLoad: Array.from({ length: capacity }, (_, n) =>
              ammoIds.has(w.lastLoad?.[n] || "")
                ? w.lastLoad?.[n] || null
                : null,
            ),
            element: ELEMENTS.includes(w.element || "")
              ? w.element || "off"
              : "off",
            lastElement:
              ELEMENTS.includes(w.lastElement || "") && w.lastElement !== "off"
                ? String(w.lastElement)
                : w.element && w.element !== "off"
                  ? String(w.element)
                  : "fire",
            finish: String(w.finish || w.visual?.metal || "blackened"),
            stock: String(w.stock || w.visual?.stock || "walnut"),
          };
        })
      : base.weapons;
  const weaponIds = new Set(weapons.map((w) => w.id));
  const requestedView = input.view || input.activeView;
  return {
    ...base,
    ...input,
    version: 5,
    ammo,
    weapons,
    activeWeaponId: weaponIds.has(input.activeWeaponId || "")
      ? input.activeWeaponId || weapons[0].id
      : weapons[0].id,
    selectedAmmoId: ammoIds.has(input.selectedAmmoId || "")
      ? input.selectedAmmoId || null
      : null,
    view:
      requestedView &&
      ["armory", "workshop", "presets", "settings"].includes(requestedView)
        ? requestedView
        : "armory",
    theme: { ...base.theme, ...input.theme },
    roller: { ...base.roller, ...input.roller },
    reminders: Array.isArray(input.reminders) ? input.reminders : [],
    presets: Array.isArray(input.presets)
      ? input.presets
          .filter((p): p is Partial<Preset> & { weaponId: string } =>
            Boolean(p.weaponId && weaponIds.has(p.weaponId)),
          )
          .map((p) => ({
            ...p,
            id: String(p.id || uid("preset")),
            name: String(p.name || "Field Load"),
            weaponId: p.weaponId,
            slots: Array.from(
              {
                length: weapons.find((w) => w.id === p.weaponId)?.capacity || 6,
              },
              (_, n) =>
                ammoIds.has(p.slots?.[n] || "") ? p.slots?.[n] || null : null,
            ),
          }))
      : base.presets,
    activity: Array.isArray(input.activity)
      ? input.activity.slice(0, 80).map((a) => ({
          id: a.id || uid("act"),
          text: String(a.text || "Ledger activity"),
          time: Number(a.time) || Date.now(),
          kind: a.kind || "system",
        }))
      : base.activity,
  };
}

function timeAgo(time: number) {
  const s = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (s < 15) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
function money(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)} gp`;
}

function Icon({ name }: { name: string }) {
  const glyphs: Record<string, string> = {
    armory: "⌖",
    workshop: "⚒",
    presets: "▤",
    settings: "⚙",
    reload: "↻",
    undo: "↶",
    history: "☷",
    sound: "◖",
    combat: "✦",
    turn: "→",
    close: "×",
    edit: "✎",
    download: "⇩",
    upload: "⇧",
    spark: "✧",
    lock: "◆",
  };
  return (
    <span aria-hidden="true" className="ui-icon">
      {glyphs[name] || "·"}
    </span>
  );
}

type CartridgeProfile = {
  family: string;
  casePath: string;
  rimY: number;
  projectilePath: string;
  caseTone: string;
  markY: number;
};
const CARTRIDGE_PROFILES: Record<string, CartridgeProfile> = {
  standard: {
    family: "rifle-standard",
    casePath:
      "M25 76 L31 61 Q32 57 36 57 H44 Q48 57 49 61 L55 76 V164 Q55 169 50 169 H30 Q25 169 25 164 Z",
    rimY: 164,
    projectilePath: "M31 59 Q33 27 40 5 Q47 27 49 59 Z",
    caseTone: "brass",
    markY: 129,
  },
  hollow: {
    family: "straight-wall",
    casePath:
      "M19 76 Q19 70 25 70 H55 Q61 70 61 76 V160 Q61 166 55 166 H25 Q19 166 19 160 Z",
    rimY: 161,
    projectilePath:
      "M22 72 L24 38 L31 24 L36 35 L40 21 L44 35 L49 24 L56 38 L58 72 Z",
    caseTone: "brass",
    markY: 126,
  },
  explosive: {
    family: "heavy-rifle",
    casePath:
      "M16 77 L25 57 Q27 52 32 52 H48 Q53 52 55 57 L64 77 V161 Q64 168 57 168 H23 Q16 168 16 161 Z",
    rimY: 162,
    projectilePath: "M22 54 L20 35 L28 21 L34 13 H46 L52 21 L60 35 L58 54 Z",
    caseTone: "black",
    markY: 128,
  },
  armor: {
    family: "long-rifle",
    casePath:
      "M27 70 L32 52 Q33 48 36 48 H44 Q47 48 48 52 L53 70 V166 Q53 171 48 171 H32 Q27 171 27 166 Z",
    rimY: 166,
    projectilePath: "M34 50 L37 18 L40 0 L43 18 L46 50 Z",
    caseTone: "steel",
    markY: 133,
  },
  tracer: {
    family: "carbine",
    casePath:
      "M23 80 L29 67 Q31 63 35 63 H45 Q49 63 51 67 L57 80 V160 Q57 166 51 166 H29 Q23 166 23 160 Z",
    rimY: 161,
    projectilePath: "M29 65 Q32 34 40 18 Q48 34 51 65 Z",
    caseTone: "copper",
    markY: 132,
  },
  silver: {
    family: "revolver-magnum",
    casePath:
      "M22 76 Q22 70 28 70 H52 Q58 70 58 76 V158 Q58 164 52 164 H28 Q22 164 22 158 Z",
    rimY: 159,
    projectilePath: "M25 72 V42 Q25 20 40 17 Q55 20 55 42 V72 Z",
    caseTone: "nickel",
    markY: 128,
  },
  toxic: {
    family: "arcane-cell",
    casePath: "M21 69 L16 83 V153 L24 166 H56 L64 153 V83 L59 69 L51 59 H29 Z",
    rimY: 162,
    projectilePath: "M27 62 V30 Q27 12 40 9 Q53 12 53 30 V62 Z",
    caseTone: "glass",
    markY: 130,
  },
  fmj: {
    family: "needle-jacket",
    casePath:
      "M26 71 L32 54 Q33 50 36 50 H44 Q47 50 48 54 L54 71 V165 Q54 170 49 170 H31 Q26 170 26 165 Z",
    rimY: 165,
    projectilePath: "M32 52 Q34 22 40 2 Q46 22 48 52 Z",
    caseTone: "steel",
    markY: 132,
  },
};
function cartridgeProfile(ammo: Ammo) {
  const aliases: Record<string, string> = {
    heavy: "explosive",
    needle: "armor",
    carbine: "tracer",
    short: "silver",
    capsule: "toxic",
    long: "fmj",
  };
  return (
    CARTRIDGE_PROFILES[ammo.id] ||
    CARTRIDGE_PROFILES[aliases[ammo.shape] || ammo.shape] ||
    CARTRIDGE_PROFILES.standard
  );
}
// Retained as a visual migration reference for pre-v5 cartridge data.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyCartridge({
  ammo,
  small = false,
  selected = false,
  density = "all",
}: {
  ammo?: Ammo;
  small?: boolean;
  selected?: boolean;
  density?: AnimationDensity;
}) {
  const rawId = useId().replace(/:/g, "");
  if (!ammo)
    return (
      <span
        className={`cartridge ghost ${small ? "small" : ""}`}
        aria-hidden="true"
      />
    );
  const p = cartridgeProfile(ammo),
    caseId = `case-${rawId}`,
    slugId = `slug-${rawId}`;
  return (
    <span
      className={`cartridge round-icon family-${p.family} fx-${ammo.fx} ${small ? "small" : ""} ${selected ? "selected" : ""} density-${density}`}
      style={{ "--ammo": ammo.color } as React.CSSProperties}
      title={ammo.name}
      aria-label={ammo.name}
    >
      <span className="cartridge-fx" />
      <svg viewBox="0 0 80 180" aria-hidden="true">
        <defs>
          <linearGradient id={caseId} x1="0" x2="1">
            <stop
              stopColor={
                p.caseTone === "steel"
                  ? "#273037"
                  : p.caseTone === "nickel"
                    ? "#626e74"
                    : p.caseTone === "copper"
                      ? "#5b2615"
                      : p.caseTone === "black"
                        ? "#15191b"
                        : p.caseTone === "glass"
                          ? "#17352a"
                          : "#5a3912"
              }
            />
            <stop
              offset=".28"
              stopColor={
                p.caseTone === "steel"
                  ? "#d3dadd"
                  : p.caseTone === "nickel"
                    ? "#f2f6f5"
                    : p.caseTone === "copper"
                      ? "#d97a3e"
                      : p.caseTone === "black"
                        ? "#667177"
                        : p.caseTone === "glass"
                          ? "#89d87c"
                          : "#e2b75f"
              }
            />
            <stop
              offset=".55"
              stopColor={p.caseTone === "glass" ? "#b8ff9e" : "#f4d486"}
            />
            <stop
              offset="1"
              stopColor={
                p.caseTone === "steel"
                  ? "#1a2024"
                  : p.caseTone === "nickel"
                    ? "#354047"
                    : p.caseTone === "copper"
                      ? "#3d170d"
                      : p.caseTone === "black"
                        ? "#080a0b"
                        : p.caseTone === "glass"
                          ? "#102a20"
                          : "#402608"
              }
            />
          </linearGradient>
          <linearGradient id={slugId} x1="0" x2="1">
            <stop stopColor="#1b1d1e" />
            <stop offset=".25" stopColor={ammo.color} />
            <stop offset=".58" stopColor="#f6ead0" />
            <stop offset="1" stopColor={ammo.color} />
          </linearGradient>
        </defs>
        <g className="case-svg">
          <path
            d={p.casePath}
            fill={`url(#${caseId})`}
            stroke="#17120b"
            strokeWidth="1.5"
          />
          <path
            d="M29 84 V151"
            stroke="rgba(255,255,255,.18)"
            strokeWidth="2"
          />
          <rect
            x="20"
            y={p.rimY}
            width="40"
            height="8"
            rx="2"
            fill={`url(#${caseId})`}
            stroke="#17120b"
          />
          <circle
            cx="40"
            cy={p.rimY + 4}
            r="7"
            fill="#3b2b17"
            stroke="#ddb968"
          />
          <rect
            className="identity-band"
            x="21"
            y={p.markY - 12}
            width="38"
            height="8"
            rx="2"
            fill={ammo.color}
          />
          <text x="40" y={p.markY + 9} textAnchor="middle">
            {ammo.symbol}
          </text>
        </g>
        <g className="projectile-svg">
          <path
            d={p.projectilePath}
            fill={`url(#${slugId})`}
            stroke="#18191a"
            strokeWidth="1.5"
          />
          {ammo.id === "hollow" && (
            <path d="M32 28 L40 41 L48 28 Q40 34 32 28Z" fill="#08090a" />
          )}
          {ammo.id === "toxic" && (
            <>
              <circle cx="35" cy="34" r="4" fill="#d9ffc5" />
              <circle cx="47" cy="46" r="3" fill="#b9ff96" />
            </>
          )}
        </g>
      </svg>
    </span>
  );
}

function WeaponArt({
  weapon,
  firing,
  fx,
}: {
  weapon: Weapon;
  firing: boolean;
  fx: string;
}) {
  return (
    <div
      className={`weapon-art ${weapon.type} finish-${weapon.finish} stock-${weapon.stock} element-${weapon.element} ${firing ? `firing shot-${fx}` : ""}`}
      aria-label={`${weapon.name} illustration`}
      role="img"
    >
      <span className="muzzle" />
      <span className="barrel" />
      <span className="tube" />
      <span className="fore-end" />
      <span className="receiver" />
      <span className="cylinder" />
      <span className="frame" />
      <span className="stock" />
      <span className="grip" />
      <span className="lever" />
      <span className="hammer" />
      <span className="sight" />
      <span className="engraving">AC-3 · ✦</span>
      <span className="muzzle-flash" />
      <span className="tracer-line" />
      {weapon.type === "lever" && <span className="casing" />}
    </div>
  );
}

function AppButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`app-btn ${className}`}>
      {children}
    </button>
  );
}

export default function Home() {
  const [state, setState] = useState<LedgerState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [undoStack, setUndoStack] = useState<LedgerState[]>([]);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("appearance");
  const [reloadOpen, setReloadOpen] = useState(false);
  const [reloadPlan, setReloadPlan] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState<{
    active: boolean;
    progress: number;
    total: number;
    mode: "seat" | "extract";
  }>({ active: false, progress: 0, total: 0, mode: "seat" });
  const [firing, setFiring] = useState(false);
  const [shotFx, setShotFx] = useState("none");
  const [toast, setToast] = useState<{ text: string; kind: string } | null>(
    null,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [craft, setCraft] = useState<Record<string, number>>({});
  const [presetFilter, setPresetFilter] = useState("all");
  const [reloadSelected, setReloadSelected] = useState<string>("standard");
  const [goldOpen, setGoldOpen] = useState(false);
  const [goldDraft, setGoldDraft] = useState(String(DEFAULT_STATE.gold));
  const importRef = useRef<HTMLInputElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const pwa = usePwaInstall();

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved =
          localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem("blackpowder-ledger-v4") ||
          localStorage.getItem("blackpowder-ledger-v3");
        if (saved) setState(normalize(JSON.parse(saved)));
      } catch {}
      setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const saved = { ...state, savedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {}
  }, [state, hydrated]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName || "",
      );
      if (e.key === "Escape") {
        setReloadOpen(false);
        setDialog(null);
        setHistoryOpen(false);
        setGoldOpen(false);
      }
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        openReload();
      }
      if (e.code === "Space" && state.combatMode) {
        e.preventDefault();
        fire();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const weapon =
    state.weapons.find((w) => w.id === state.activeWeaponId) ||
    state.weapons[0];
  const selectedAmmo =
    state.ammo.find((a) => a.id === state.selectedAmmoId) || null;
  const loaded = weapon.slots.filter(Boolean).length;
  const totalLoaded = state.weapons.reduce(
    (n, w) => n + w.slots.filter(Boolean).length,
    0,
  );
  const totalReserve = state.ammo.reduce((n, a) => n + a.reserve, 0);
  const selectedLoaded = state.selectedAmmoId
    ? weapon.slots.filter((id) => id === state.selectedAmmoId).length
    : 0;
  const accent = ACCENTS[state.theme.accent] || ACCENTS.brass;
  const craftCost = state.ammo.reduce(
    (n, a) => n + (craft[a.id] || 0) * a.cost,
    0,
  );
  const craftCount = Object.values(craft).reduce((a, b) => a + b, 0);
  const cssVars = {
    "--accent": accent[0],
    "--accent-hi": accent[1],
    "--panel-alpha": state.theme.panelOpacity / 100,
    "--bg-intensity": state.theme.backgroundIntensity / 100,
    "--vignette": state.theme.vignette / 100,
    "--scene-blur": `${state.theme.blur}px`,
    "--atmosphere": state.theme.atmosphere / 100,
    "--ui-scale": state.theme.scale / 100,
    "--fx-intensity": state.theme.intensity / 100,
  } as React.CSSProperties;

  function commit(next: LedgerState, label?: string, kind = "system") {
    setUndoStack((stack) => [clone(state), ...stack].slice(0, 50));
    const n = clone(next);
    if (label) n.activity = [activity(label, kind), ...n.activity].slice(0, 80);
    n.savedAt = Date.now();
    setState(n);
  }
  function mutate(
    fn: (n: LedgerState) => void,
    label?: string,
    kind = "system",
  ) {
    const n = clone(state);
    fn(n);
    commit(n, label, kind);
  }
  function passive(fn: (n: LedgerState) => void) {
    setState((prev) => {
      const n = clone(prev);
      fn(n);
      n.savedAt = Date.now();
      return n;
    });
  }
  function announce(text: string, kind = "success") {
    setToast({ text, kind });
    if (liveRef.current) liveRef.current.textContent = text;
  }
  function sound(kind: "click" | "shot" | "reload") {
    if (!state.sound) return;
    try {
      const ctx = audioRef.current || new AudioContext();
      audioRef.current = ctx;
      const now = ctx.currentTime;
      if (kind === "shot") {
        const buffer = ctx.createBuffer(
            1,
            ctx.sampleRate * 0.16,
            ctx.sampleRate,
          ),
          data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
        const source = ctx.createBufferSource(),
          filter = ctx.createBiquadFilter(),
          gain = ctx.createGain();
        filter.type = "lowpass";
        filter.frequency.value = 980;
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
        source.buffer = buffer;
        source.connect(filter).connect(gain).connect(ctx.destination);
        source.start(now);
        return;
      }
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(kind === "reload" ? 170 : 330, now);
      osc.frequency.exponentialRampToValueAtTime(
        kind === "reload" ? 410 : 190,
        now + 0.07,
      );
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }
  function undo() {
    setUndoStack((stack) => {
      if (!stack.length) {
        announce("Nothing to undo.", "muted");
        return stack;
      }
      const [prev, ...rest] = stack;
      setState({
        ...prev,
        activity: [activity("Undid last action.", "undo"), ...prev.activity],
      });
      announce("Last action undone.");
      return rest;
    });
  }
  function switchView(view: View) {
    if (state.view === "workshop" && view !== "workshop" && craftCount) {
      setDialog({
        type: "discardCraft",
        id: view,
        title: "Discard This Crafting Batch?",
        body: `Your uncrafted batch contains ${craftCount} rounds. Leaving the bench will clear it.`,
      });
      return;
    }
    passive((n) => {
      n.view = view;
      if (view !== "armory") n.combatMode = false;
    });
  }
  function chooseWeapon(id: string) {
    passive((n) => {
      n.activeWeaponId = id;
      const w = n.weapons.find((x) => x.id === id);
      if (w && !w.slots.includes(n.selectedAmmoId))
        n.selectedAmmoId = w.slots.find(Boolean) || null;
    });
  }
  function chooseAmmo(id: string) {
    if (!weapon.slots.includes(id)) return;
    passive((n) => {
      n.selectedAmmoId = id;
    });
  }
  function addReminder(n: LedgerState, ammo: Ammo) {
    n.reminders = n.reminders.filter((r) => r.id !== ammo.id);
    if (ammo.id === "explosive")
      n.reminders.unshift({
        id: "explosive",
        label: "Blast spent",
        detail: "Explosive splash used this round.",
        turns: 1,
        color: ammo.color,
      });
    if (ammo.id === "toxic")
      n.reminders.unshift({
        id: `toxic-${Date.now()}`,
        label: "Toxic payload",
        detail: "Apply 1d4 at the start of the target’s turn.",
        turns: 2,
        color: ammo.color,
      });
    if (ammo.id === "tracer")
      n.reminders.unshift({
        id: "tracer",
        label: "Confirm tracer",
        detail: "On a miss, mark advantage for the next firearm attack.",
        turns: null,
        color: ammo.color,
      });
  }
  function fire() {
    if (firing || !state.selectedAmmoId)
      return announce("Select a loaded cartridge first.", "error");
    const slot = weapon.slots.findIndex((id) => id === state.selectedAmmoId);
    if (slot < 0)
      return announce("That cartridge is no longer loaded.", "error");
    const ammo = state.ammo.find((a) => a.id === state.selectedAmmoId)!;
    setFiring(true);
    setShotFx(ammo.visual.fx);
    sound("shot");
    setTimeout(
      () => {
        const n = clone(state);
        const w = n.weapons.find((x) => x.id === weapon.id)!;
        w.slots[slot] = null;
        addReminder(n, ammo);
        if (!w.slots.includes(ammo.id))
          n.selectedAmmoId = w.slots.find(Boolean) || null;
        commit(n, `Fired ${ammo.name} from ${w.shortName}.`, "shot");
        announce(
          `${ammo.name} fired — ${ammo.effect}${w.element !== "off" && state.elementalUnlocked ? ` · +1d6 ${w.element}` : ""}`,
        );
      },
      state.theme.motion === "full" ? 170 : 10,
    );
    setTimeout(
      () => setFiring(false),
      state.theme.motion === "full" ? 650 : 80,
    );
  }
  function nextTurn() {
    mutate(
      (n) => {
        n.turn += 1;
        n.reminders = n.reminders
          .map((r) => (r.turns === null ? r : { ...r, turns: r.turns - 1 }))
          .filter((r) => r.turns === null || r.turns > 0);
      },
      `Turn ${state.turn + 1} started.`,
      "turn",
    );
    announce(`Turn ${state.turn + 1}. Once-per-round effects reset.`);
  }
  function openReload(plan?: (string | null)[]) {
    setReloadPlan(clone(plan || weapon.slots));
    setReloadSelected(state.selectedAmmoId || state.ammo[0]?.id || "");
    setReloadOpen(true);
  }
  function poolForReload(ammoId: string) {
    return (
      (state.ammo.find((a) => a.id === ammoId)?.reserve || 0) +
      weapon.slots.filter((id) => id === ammoId).length
    );
  }
  function planCount(id: string) {
    return reloadPlan.filter((x) => x === id).length;
  }
  function addReload(id: string) {
    const index = reloadPlan.findIndex((x) => !x);
    if (index < 0) return announce("Magazine is full.", "error");
    if (planCount(id) >= poolForReload(id))
      return announce("No more of that cartridge is available.", "error");
    const p = [...reloadPlan];
    p[index] = id;
    setReloadPlan(p);
    setReloadSelected(id);
  }
  function removeReload(index: number) {
    const p = [...reloadPlan];
    p[index] = null;
    setReloadPlan(p);
  }
  function fillStandard() {
    const p = [...reloadPlan];
    for (let i = 0; i < p.length; i++) {
      if (
        !p[i] &&
        p.filter((x) => x === "standard").length < poolForReload("standard")
      )
        p[i] = "standard";
    }
    setReloadPlan(p);
  }
  function replaceAll(id: string) {
    const available = poolForReload(id);
    setReloadPlan(
      Array.from({ length: weapon.capacity }, (_, i) =>
        i < available ? id : null,
      ),
    );
    setReloadSelected(id);
  }
  async function commitReload() {
    const impossible = state.ammo.some(
      (a) => planCount(a.id) > poolForReload(a.id),
    );
    if (impossible)
      return announce("This load uses more ammunition than you own.", "error");
    setReloadOpen(false);
    const changes = reloadPlan.filter(
      (id, i) => id !== weapon.slots[i] && id,
    ).length;
    setLoading({
      active: true,
      progress: 0,
      total: changes || 1,
      mode: "seat",
    });
    if (state.theme.motion === "full") {
      for (let i = 1; i <= Math.max(1, changes); i++) {
        await new Promise((r) => setTimeout(r, 150));
        setLoading({
          active: true,
          progress: i,
          total: Math.max(1, changes),
          mode: "seat",
        });
      }
    }
    const n = clone(state);
    const w = n.weapons.find((x) => x.id === weapon.id)!;
    const pool: Record<string, number> = {};
    n.ammo.forEach(
      (a) =>
        (pool[a.id] = a.reserve + w.slots.filter((x) => x === a.id).length),
    );
    n.ammo.forEach(
      (a) =>
        (a.reserve = pool[a.id] - reloadPlan.filter((x) => x === a.id).length),
    );
    w.slots = clone(reloadPlan);
    w.lastLoad = clone(reloadPlan);
    if (!w.slots.includes(n.selectedAmmoId))
      n.selectedAmmoId = w.slots.find(Boolean) || null;
    commit(
      n,
      `Loaded ${w.shortName} with ${w.slots.filter(Boolean).length} rounds.`,
      "reload",
    );
    sound("reload");
    setLoading({ active: false, progress: 0, total: 0, mode: "seat" });
    announce(`${w.shortName} ready.`);
  }
  async function unloadAll() {
    const rounds = loaded;
    if (!rounds) return;
    setLoading({ active: true, progress: 0, total: rounds, mode: "extract" });
    if (state.theme.motion === "full") {
      for (let i = 1; i <= rounds; i++) {
        await new Promise((r) => setTimeout(r, 95));
        setLoading({
          active: true,
          progress: i,
          total: rounds,
          mode: "extract",
        });
      }
    }
    mutate(
      (n) => {
        const w = n.weapons.find((x) => x.id === weapon.id)!;
        w.slots.forEach((id) => {
          const a = n.ammo.find((x) => x.id === id);
          if (a) a.reserve++;
        });
        w.slots = blankSlots(w.capacity);
        n.selectedAmmoId = null;
      },
      `Unloaded ${weapon.shortName}.`,
      "reload",
    );
    sound("reload");
    setLoading({ active: false, progress: 0, total: 0, mode: "seat" });
    announce(`${weapon.shortName} unloaded.`);
  }
  function savePreset(name: string) {
    const n = clone(state);
    n.presets.push({
      id: uid("preset"),
      name,
      weaponId: weapon.id,
      slots: clone(weapon.slots),
    });
    commit(n, `Saved preset “${name}”.`, "preset");
    announce("Magazine preset saved.");
  }
  function applyPreset(preset: Preset) {
    if (preset.weaponId !== weapon.id) {
      chooseWeapon(preset.weaponId);
      setTimeout(() => {
        setReloadPlan(clone(preset.slots));
        setReloadOpen(true);
      }, 0);
    } else openReload(preset.slots);
  }
  function loadPresetNow(preset: Preset) {
    const n = clone(state),
      w = n.weapons.find((x) => x.id === preset.weaponId)!;
    const pool: Record<string, number> = {};
    n.ammo.forEach(
      (a) =>
        (pool[a.id] = a.reserve + w.slots.filter((x) => x === a.id).length),
    );
    if (
      n.ammo.some(
        (a) => preset.slots.filter((x) => x === a.id).length > pool[a.id],
      )
    )
      return announce(
        "Craft the missing cartridges before loading this preset.",
        "error",
      );
    n.ammo.forEach(
      (a) =>
        (a.reserve =
          pool[a.id] - preset.slots.filter((x) => x === a.id).length),
    );
    w.slots = clone(preset.slots);
    w.lastLoad = clone(preset.slots);
    n.activeWeaponId = w.id;
    n.selectedAmmoId = w.slots.find(Boolean) || null;
    commit(n, `Quick-loaded ${preset.name} into ${w.shortName}.`, "reload");
    sound("reload");
    announce(`${preset.name} loaded.`);
  }
  function shortage(p: Preset) {
    const w = state.weapons.find((x) => x.id === p.weaponId)!;
    return state.ammo.some(
      (a) =>
        p.slots.filter((x) => x === a.id).length >
        a.reserve + w.slots.filter((x) => x === a.id).length,
    );
  }
  function adjustReserve(id: string, delta: number) {
    mutate(
      (n) => {
        const a = n.ammo.find((x) => x.id === id)!;
        a.reserve = Math.max(0, a.reserve + delta);
      },
      `${delta > 0 ? "Added" : "Removed"} ${Math.abs(delta)} reserve round${Math.abs(delta) === 1 ? "" : "s"}.`,
      "inventory",
    );
  }
  function adjustGold(delta: number) {
    setGoldDraft((current) =>
      String(Math.max(0, (Number(current) || 0) + delta)),
    );
  }
  function commitGoldDraft(close = false) {
    const next = Math.max(0, Number(goldDraft) || 0);
    if (next !== state.gold) {
      mutate(
        (n) => {
          n.gold = next;
        },
        `Set coin ledger to ${money(next)}.`,
        "gold",
      );
    }
    if (close) setGoldOpen(false);
  }
  function craftRounds() {
    if (!craftCount) return;
    if (craftCost > state.gold)
      return announce("Not enough gold for this batch.", "error");
    mutate(
      (n) => {
        n.gold -= craftCost;
        n.ammo.forEach((a) => (a.reserve += craft[a.id] || 0));
      },
      `Crafted ${craftCount} rounds for ${money(craftCost)}.`,
      "craft",
    );
    setCraft({});
    announce(`${craftCount} cartridges added to the case.`);
  }
  function maxAffordable(ammo: Ammo) {
    const other = state.ammo.reduce(
      (n, a) => n + (a.id === ammo.id ? 0 : (craft[a.id] || 0) * a.cost),
      0,
    );
    return ammo.cost
      ? Math.max(0, Math.floor((state.gold - other) / ammo.cost))
      : 99;
  }
  function rollAttack() {
    const { dex, prof, misc, mode } = state.roller;
    const a = Math.ceil(Math.random() * 20),
      b = Math.ceil(Math.random() * 20);
    const chosen =
      mode === "advantage"
        ? Math.max(a, b)
        : mode === "disadvantage"
          ? Math.min(a, b)
          : a;
    const bonus = dex + prof + misc;
    passive((n) => {
      n.roller.last = `${mode === "normal" ? a : `${a} / ${b}`} + ${bonus} = ${chosen + bonus}`;
    });
    announce(`Attack roll: ${chosen + bonus}`);
  }
  function exportSave() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            app: "Blackpowder Ledger",
            exportedAt: new Date().toISOString(),
            data: state,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blackpowder-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    announce("Portable save exported.");
  }
  async function importSave(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const n = normalize(parsed.data || parsed);
      setUndoStack([clone(state)]);
      setState({
        ...n,
        activity: [
          activity("Imported a portable save.", "data"),
          ...n.activity,
        ],
      });
      announce("Save imported successfully.");
    } catch {
      announce("That file is not a valid Blackpowder Ledger save.", "error");
    }
  }
  function confirmDialog(value?: string) {
    if (!dialog) return;
    const val = (value ?? dialog.value ?? "").trim();
    if (dialog.type === "savePreset" && val) savePreset(val);
    if (dialog.type === "renamePreset" && val)
      mutate(
        (n) => {
          const p = n.presets.find((x) => x.id === dialog.id);
          if (p) p.name = val;
        },
        `Renamed preset to “${val}”.`,
        "preset",
      );
    if (dialog.type === "deletePreset")
      mutate(
        (n) => {
          n.presets = n.presets.filter((p) => p.id !== dialog.id);
        },
        "Deleted magazine preset.",
        "preset",
      );
    if (dialog.type === "deleteAmmo")
      mutate(
        (n) => {
          n.ammo = n.ammo.filter((a) => a.id !== dialog.id);
        },
        "Deleted custom ammunition type.",
        "ammo",
      );
    if (dialog.type === "discardCraft") {
      setCraft({});
      passive((n) => {
        n.view = (dialog.id as View) || "armory";
        n.combatMode = false;
      });
    }
    if (dialog.type === "reset") {
      setUndoStack([clone(state)]);
      setState(clone(DEFAULT_STATE));
      announce("Ledger reset to factory defaults.");
    }
    if (dialog.type === "newAmmo" && val)
      mutate(
        (n) => {
          n.ammo.push({
            id: uid("ammo"),
            name: val,
            reserve: 0,
            cost: 1,
            effect: "Add a short rules reminder.",
            color: "#69b8a3",
            symbol: "?",
            fx: "runes",
            shape: "standard",
            visual: clone(STYLE_PRESETS.custom),
          });
        },
        `Added ${val} to the ammunition catalog.`,
        "ammo",
      );
    setDialog(null);
  }

  if (!hydrated)
    return (
      <main className="boot">
        <div className="boot-mark">BL</div>
        <p>Opening the field ledger…</p>
      </main>
    );

  return (
    <main
      className={`ledger env-${state.theme.environment} material-${state.theme.material} motion-${state.theme.motion} density-${state.theme.density} ${state.combatMode ? "combat-mode" : ""}`}
      style={cssVars}
    >
      <div className="environment" />
      <div className="scene-vignette" />
      <div className="dust" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="shell">
        <header className="topbar glass">
          <div className="brand">
            <div className="brand-lock">
              <span>BL</span>
            </div>
            <div>
              <p>AC-3 FIELD SYSTEM</p>
              <input
                aria-label="Character or armory name"
                value={state.characterName}
                onChange={(e) =>
                  passive((n) => {
                    n.characterName = e.target.value;
                  })
                }
              />
            </div>
          </div>
          <div className="top-stats">
            {state.combatMode ? (
              <>
                <div>
                  <span>ACTIVE WEAPON</span>
                  <b>{weapon.shortName}</b>
                </div>
                <div>
                  <span>LOADED</span>
                  <b>
                    {loaded}
                    <small> / {weapon.capacity}</small>
                  </b>
                </div>
                <div>
                  <span>NEXT ROUND</span>
                  <b style={{ color: selectedAmmo?.color }}>
                    {selectedAmmo?.name || "—"}
                  </b>
                </div>
              </>
            ) : (
              <>
                <div className="gold-stat-wrap">
                  <button
                    className="gold-stat-button"
                    onClick={() => {
                      setGoldDraft(String(state.gold));
                      setGoldOpen(true);
                    }}
                    aria-expanded={goldOpen}
                  >
                    <span>GOLD · EDIT</span>
                    <b>{money(state.gold)}</b>
                  </button>
                </div>
                <div>
                  <span>RESERVE</span>
                  <b>{totalReserve}</b>
                </div>
                <div>
                  <span>LOADED</span>
                  <b>{totalLoaded}</b>
                </div>
              </>
            )}
          </div>
          <div className="top-actions">
            <button
              className="quiet-icon undo-top"
              onClick={undo}
              disabled={!undoStack.length}
              aria-label="Undo last action"
            >
              <Icon name="undo" />
              <span>Undo</span>
            </button>
            <button
              className={`combat-switch ${state.combatMode ? "active" : ""}`}
              onClick={() =>
                passive((n) => {
                  n.combatMode = !n.combatMode;
                  n.view = "armory";
                })
              }
            >
              <Icon name="combat" />
              {state.combatMode ? "Exit Combat" : "Combat Mode"}
            </button>
          </div>
        </header>

        {!state.combatMode && (
          <nav className="main-nav glass" aria-label="Primary navigation">
            {(["armory", "workshop", "presets", "settings"] as View[]).map(
              (v) => (
                <button
                  key={v}
                  className={state.view === v ? "active" : ""}
                  onClick={() => switchView(v)}
                >
                  <Icon name={v} />
                  <span>
                    {v === "presets"
                      ? "Loadouts"
                      : v[0].toUpperCase() + v.slice(1)}
                  </span>
                </button>
              ),
            )}
          </nav>
        )}

        <section className="view-wrap">
          {state.view === "armory" && (
            <div className="armory-layout">
              <section className="panel weapon-panel glass">
                <div className="panel-head">
                  <div>
                    <span className="eyebrow">TACTICAL WEAPONS DESK</span>
                    <h1>
                      {state.combatMode
                        ? "Ready to engage"
                        : "Choose the shot, not the slot."}
                    </h1>
                    <p>
                      Tactical Selection keeps your chosen cartridge armed until
                      that type runs dry.
                    </p>
                  </div>
                  <div className="weapon-tabs">
                    {state.weapons.map((w) => (
                      <button
                        key={w.id}
                        className={w.id === weapon.id ? "active" : ""}
                        onClick={() => chooseWeapon(w.id)}
                      >
                        <span>{w.type === "revolver" ? "◉" : "⌁"}</span>
                        {w.shortName}
                        <small>
                          {w.slots.filter(Boolean).length}/{w.capacity}
                        </small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="weapon-stage">
                  <div className="stage-light" />
                  <div className="weapon-label">
                    <span>
                      {weapon.type === "revolver" ? "SECONDARY" : "PRIMARY"}
                    </span>
                    <strong>{weapon.name}</strong>
                  </div>
                  <WeaponArt weapon={weapon} firing={firing} fx={shotFx} />
                  <div className="bench-line" />
                  <div className="stage-status">
                    <span>
                      <i className={`status-dot ${loaded ? "ready" : ""}`} />
                      {loaded ? "WEAPON READY" : "EMPTY"}
                    </span>
                    <span>
                      {weapon.element === "off"
                        ? "CHAMBER: KINETIC"
                        : `${weapon.element.toUpperCase()} · +1D6`}
                    </span>
                  </div>
                </div>

                <div className="magazine-block">
                  <div className="section-title">
                    <div>
                      <span>
                        {weapon.type === "revolver"
                          ? "CYLINDER LEDGER"
                          : "PREPARED AMMUNITION"}
                      </span>
                      <small>Select any loaded cartridge family</small>
                    </div>
                    <b>
                      {loaded} <em>/ {weapon.capacity}</em>
                    </b>
                  </div>
                  {weapon.type === "lever" ? (
                    <div className="tube-mag" aria-label="Loaded cartridges">
                      {weapon.slots.map((id, i) => {
                        const ammo = state.ammo.find((a) => a.id === id);
                        return (
                          <button
                            key={i}
                            disabled={!ammo}
                            className={`${ammo ? "loaded" : "empty"} ${ammo?.id === state.selectedAmmoId ? "selected" : ""}`}
                            style={
                              { "--ammo": ammo?.color } as React.CSSProperties
                            }
                            onClick={() => ammo && chooseAmmo(ammo.id)}
                            aria-label={
                              ammo
                                ? `${ammo.name}, slot ${i + 1}`
                                : `Empty slot ${i + 1}`
                            }
                          >
                            <Cartridge
                              ammo={ammo}
                              small
                              selected={ammo?.id === state.selectedAmmoId}
                              density={state.theme.density}
                            />
                          </button>
                        );
                      })}
                      <span className="tube-spring" />
                    </div>
                  ) : (
                    <div
                      className={`cylinder-mag ${firing ? "firing" : ""}`}
                      aria-label="Revolver cylinder"
                    >
                      {weapon.slots.map((id, i) => {
                        const ammo = state.ammo.find((a) => a.id === id);
                        return (
                          <button
                            key={i}
                            disabled={!ammo}
                            className={`${ammo ? "loaded" : "empty"} pos-${i} ${i === weapon.slots.findIndex((slot) => slot === state.selectedAmmoId) ? "selected" : ""}`}
                            style={
                              { "--ammo": ammo?.color } as React.CSSProperties
                            }
                            onClick={() => ammo && chooseAmmo(ammo.id)}
                            aria-label={
                              ammo
                                ? `${ammo.name}, chamber ${i + 1}`
                                : `Empty chamber ${i + 1}`
                            }
                          >
                            <Cartridge
                              ammo={ammo}
                              small
                              selected={
                                i ===
                                weapon.slots.findIndex(
                                  (slot) => slot === state.selectedAmmoId,
                                )
                              }
                              density={state.theme.density}
                            />
                          </button>
                        );
                      })}
                      <span className="cyl-center">AC</span>
                    </div>
                  )}
                  <div className="ammo-legend">
                    {state.ammo
                      .filter((a) => weapon.slots.includes(a.id))
                      .map((a) => (
                        <button
                          key={a.id}
                          className={
                            state.selectedAmmoId === a.id ? "active" : ""
                          }
                          style={{ "--ammo": a.color } as React.CSSProperties}
                          onClick={() => chooseAmmo(a.id)}
                        >
                          <Cartridge
                            ammo={a}
                            small
                            selected={state.selectedAmmoId === a.id}
                            density={state.theme.density}
                          />
                          <span>
                            <b>{a.name}</b>
                            <small>{a.effect}</small>
                          </span>
                          <em>
                            ×{weapon.slots.filter((id) => id === a.id).length}
                          </em>
                        </button>
                      ))}
                  </div>
                </div>

                {!state.combatMode && (
                  <>
                    <div
                      className="selected-card"
                      style={
                        {
                          "--ammo": selectedAmmo?.color || accent[0],
                        } as React.CSSProperties
                      }
                    >
                      <Cartridge
                        ammo={selectedAmmo || undefined}
                        selected
                        density={state.theme.density}
                      />
                      <div>
                        <span>NEXT SHOT</span>
                        <h2>{selectedAmmo?.name || "No round selected"}</h2>
                        <p>
                          {selectedAmmo?.effect ||
                            "Load the weapon or select a prepared cartridge."}
                        </p>
                        {weapon.element !== "off" &&
                          state.elementalUnlocked && (
                            <small>
                              Elemental Chamber · +1d6 {weapon.element}
                            </small>
                          )}
                      </div>
                    </div>
                    {state.elementalUnlocked && (
                      <div
                        className={`elemental-armory-control element-${weapon.element}`}
                      >
                        <label className="element-switch">
                          <input
                            type="checkbox"
                            checked={weapon.element !== "off"}
                            onChange={(e) =>
                              passive((n) => {
                                const w = n.weapons.find(
                                  (x) => x.id === weapon.id,
                                )!;
                                if (e.target.checked)
                                  w.element = w.lastElement || "fire";
                                else {
                                  if (w.element !== "off")
                                    w.lastElement = w.element;
                                  w.element = "off";
                                }
                              })
                            }
                          />
                          <i />
                          <span>
                            <b>Elemental Shot</b>
                            <small>
                              {weapon.element === "off"
                                ? "Kinetic chamber"
                                : `Armed · +1d6 ${weapon.element}`}
                            </small>
                          </span>
                        </label>
                        {weapon.element !== "off" && (
                          <label className="element-selector">
                            Infusion
                            <select
                              value={weapon.element}
                              onChange={(e) =>
                                passive((n) => {
                                  const w = n.weapons.find(
                                    (x) => x.id === weapon.id,
                                  )!;
                                  w.element = e.target.value;
                                  w.lastElement = e.target.value;
                                })
                              }
                            >
                              {ELEMENTS.filter((x) => x !== "off").map((x) => (
                                <option key={x} value={x}>
                                  {x[0].toUpperCase() + x.slice(1)}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                    )}
                    <div className="weapon-actions">
                      <AppButton
                        className="primary"
                        onClick={() => openReload()}
                      >
                        <Icon name="reload" />
                        Reload / Configure
                      </AppButton>
                      <AppButton
                        onClick={() => openReload(weapon.lastLoad)}
                        disabled={!weapon.lastLoad.some(Boolean)}
                      >
                        Repeat Last Load
                      </AppButton>
                      <AppButton onClick={unloadAll} disabled={!loaded}>
                        Unload All
                      </AppButton>
                      <AppButton
                        onClick={() =>
                          setDialog({
                            type: "savePreset",
                            title: "Save Magazine Preset",
                            value: `${weapon.shortName} Load ${state.presets.filter((p) => p.weaponId === weapon.id).length + 1}`,
                            body: "Save the current prepared ammunition as a reusable one-tap loadout.",
                          })
                        }
                        disabled={!loaded}
                      >
                        Save Preset
                      </AppButton>
                    </div>
                  </>
                )}
              </section>

              <aside
                className={`panel side-panel glass ${state.combatMode ? "combat-side" : ""}`}
              >
                <div className="panel-head compact">
                  <div>
                    <span className="eyebrow">
                      {state.combatMode
                        ? "COMBAT TELEMETRY"
                        : "AMMUNITION CASE"}
                    </span>
                    <h2>
                      {state.combatMode
                        ? `Turn ${state.turn}`
                        : "Reserve inventory"}
                    </h2>
                  </div>
                  {state.combatMode ? (
                    <AppButton className="turn-btn" onClick={nextTurn}>
                      Next Turn <Icon name="turn" />
                    </AppButton>
                  ) : (
                    <button
                      className={`inventory-edit ${state.inventoryEdit ? "active" : ""}`}
                      onClick={() =>
                        passive((n) => {
                          n.inventoryEdit = !n.inventoryEdit;
                        })
                      }
                    >
                      <Icon name="edit" />
                      {state.inventoryEdit ? "Done" : "Edit"}
                    </button>
                  )}
                </div>
                {state.combatMode ? (
                  <div className="combat-telemetry">
                    <div className="combat-gauge">
                      <div>
                        <span
                          style={{
                            width: `${(loaded / weapon.capacity) * 100}%`,
                          }}
                        />
                      </div>
                      <small>Magazine integrity</small>
                      <b>{Math.round((loaded / weapon.capacity) * 100)}%</b>
                    </div>
                    {state.roller.enabled && (
                      <div className="roll-card">
                        <span>ATTACK ROLLER</span>
                        <strong>
                          {state.roller.last ||
                            `+${state.roller.dex + state.roller.prof + state.roller.misc} to hit`}
                        </strong>
                        <AppButton onClick={rollAttack}>Roll d20</AppButton>
                      </div>
                    )}
                    <div className="effect-tray">
                      <div className="tray-title">
                        <span>LIVE EFFECTS</span>
                        <b>{state.reminders.length}</b>
                      </div>
                      {state.reminders.length ? (
                        state.reminders.map((r) => (
                          <article
                            key={r.id}
                            style={
                              { "--reminder": r.color } as React.CSSProperties
                            }
                          >
                            <i />
                            <div>
                              <strong>{r.label}</strong>
                              <p>{r.detail}</p>
                            </div>
                            {r.turns !== null && <span>{r.turns}T</span>}
                            <button
                              aria-label={`Dismiss ${r.label}`}
                              onClick={() =>
                                passive((n) => {
                                  n.reminders = n.reminders.filter(
                                    (x) => x.id !== r.id,
                                  );
                                })
                              }
                            >
                              ×
                            </button>
                          </article>
                        ))
                      ) : (
                        <div className="empty-effects">
                          <Icon name="spark" />
                          <p>Special ammunition reminders will appear here.</p>
                        </div>
                      )}
                    </div>
                    <div className="combat-shortcuts">
                      <span>
                        <kbd>Space</kbd> fire
                      </span>
                      <span>
                        <kbd>R</kbd> reload
                      </span>
                      <span>
                        <kbd>Ctrl Z</kbd> undo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="inventory-list">
                    {state.ammo.map((a) => {
                      const inWeapons = state.weapons.reduce(
                        (n, w) =>
                          n + w.slots.filter((id) => id === a.id).length,
                        0,
                      );
                      return (
                        <article
                          className="inventory-card"
                          key={a.id}
                          style={{ "--ammo": a.color } as React.CSSProperties}
                        >
                          <Cartridge ammo={a} density={state.theme.density} />
                          <div>
                            <strong>{a.name}</strong>
                            <p>{a.effect}</p>
                            <span>
                              <b>{a.reserve}</b> reserve · <b>{inWeapons}</b>{" "}
                              loaded
                            </span>
                          </div>
                          {state.inventoryEdit ? (
                            <div className="stepper">
                              <button
                                disabled={!a.reserve}
                                onClick={() => adjustReserve(a.id, -1)}
                              >
                                −
                              </button>
                              <b>{a.reserve}</b>
                              <button onClick={() => adjustReserve(a.id, 1)}>
                                +
                              </button>
                            </div>
                          ) : (
                            <b className="reserve-badge">{a.reserve}</b>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </aside>
            </div>
          )}

          {state.view === "workshop" && (
            <Workshop
              state={state}
              craft={craft}
              setCraft={setCraft}
              craftCost={craftCost}
              craftCount={craftCount}
              maxAffordable={maxAffordable}
              craftRounds={craftRounds}
              editGold={() => {
                setGoldDraft(String(state.gold));
                setGoldOpen(true);
              }}
            />
          )}
          {state.view === "presets" && (
            <Presets
              state={state}
              filter={presetFilter}
              setFilter={setPresetFilter}
              shortage={shortage}
              applyPreset={applyPreset}
              loadNow={loadPresetNow}
              setDialog={setDialog}
              mutate={mutate}
            />
          )}
          {state.view === "settings" && (
            <Settings
              state={state}
              tab={settingsTab}
              setTab={setSettingsTab}
              passive={passive}
              mutate={mutate}
              exportSave={exportSave}
              importRef={importRef}
              setDialog={setDialog}
              pwaStatus={pwa.status}
              installPwa={async () => {
                const result = await pwa.install();
                if (result === "accepted")
                  announce("Blackpowder Ledger installed for offline use.");
                else if (result === "dismissed")
                  announce("Installation canceled.", "muted");
                else
                  announce(
                    "Use your browser menu and choose Install app or Add to Home Screen.",
                    "muted",
                  );
              }}
            />
          )}
        </section>

        {state.combatMode && (
          <div className="combat-dock glass">
            <button
              className="dock-side"
              onClick={undo}
              disabled={!undoStack.length}
            >
              <Icon name="undo" />
              <span>Undo</span>
            </button>
            <button
              className="dock-round"
              onClick={() => selectedAmmo && chooseAmmo(selectedAmmo.id)}
              disabled={!selectedAmmo}
            >
              <Cartridge
                ammo={selectedAmmo || undefined}
                small
                selected
                density={state.theme.density}
              />
              <span>
                <small>NEXT ROUND</small>
                <b>{selectedAmmo?.name || "No cartridge"}</b>
                <em>{selectedLoaded} loaded</em>
              </span>
            </button>
            <button
              className="combat-fire"
              onClick={fire}
              disabled={!selectedLoaded || firing}
            >
              <span className="fire-ring" />
              <strong>FIRE</strong>
              <small>
                {firing
                  ? "CYCLING"
                  : weapon.element !== "off"
                    ? `+1D6 ${weapon.element.toUpperCase()}`
                    : "READY"}
              </small>
            </button>
            <button className="dock-mag">
              <small>MAGAZINE</small>
              <b>
                {loaded}
                <em>/{weapon.capacity}</em>
              </b>
              <span>
                <i style={{ width: `${(loaded / weapon.capacity) * 100}%` }} />
              </span>
            </button>
            <button className="dock-side" onClick={() => openReload()}>
              <Icon name="reload" />
              <span>Reload</span>
            </button>
          </div>
        )}
        {!state.combatMode && state.view === "armory" && (
          <div
            className={`armory-fire-tab glass element-${weapon.element}`}
            style={
              {
                "--ammo": selectedAmmo?.color || accent[0],
              } as React.CSSProperties
            }
          >
            <div className="armory-fire-round">
              <Cartridge
                ammo={selectedAmmo || undefined}
                small
                selected
                density={state.theme.density}
              />
              <span>
                <small>NEXT SHOT</small>
                <b>{selectedAmmo?.name || "No cartridge"}</b>
              </span>
            </div>
            <button onClick={fire} disabled={!selectedLoaded || firing}>
              <span className="fire-tab-hammer" />
              <strong>{firing ? "BANG" : "FIRE"}</strong>
              <small>
                {selectedLoaded ? `${selectedLoaded} READY` : "EMPTY"}
              </small>
            </button>
            <div className="armory-fire-status">
              <small>{weapon.shortName.toUpperCase()}</small>
              <b>
                {loaded}/{weapon.capacity}
              </b>
              <em>
                {weapon.element === "off"
                  ? "KINETIC"
                  : `+1D6 ${weapon.element.toUpperCase()}`}
              </em>
            </div>
          </div>
        )}
      </div>

      <button className="history-peek" onClick={() => setHistoryOpen(true)}>
        <Icon name="history" />
        <span>{state.activity[0]?.text}</span>
        <small>{timeAgo(state.activity[0]?.time || Date.now())}</small>
      </button>
      {historyOpen && (
        <div
          className="drawer-scrim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setHistoryOpen(false);
          }}
        >
          <aside
            className="history-drawer glass"
            role="dialog"
            aria-modal="true"
            aria-label="Activity history"
          >
            <div className="drawer-head">
              <div>
                <span>FIELD RECORD</span>
                <h2>Activity history</h2>
              </div>
              <button
                onClick={() => setHistoryOpen(false)}
                aria-label="Close history"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="history-list">
              {state.activity.map((a) => (
                <article key={a.id} className={`kind-${a.kind}`}>
                  <i />
                  <div>
                    <p>{a.text}</p>
                    <span>
                      {new Date(a.time).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · {timeAgo(a.time)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>
      )}
      {reloadOpen && (
        <ReloadModal
          state={state}
          weapon={weapon}
          plan={reloadPlan}
          selected={reloadSelected}
          setSelected={setReloadSelected}
          add={addReload}
          remove={removeReload}
          fillStandard={fillStandard}
          replaceAll={replaceAll}
          setPlan={setReloadPlan}
          pool={poolForReload}
          count={planCount}
          close={() => setReloadOpen(false)}
          commit={commitReload}
          applyPreset={(p) => setReloadPlan(clone(p.slots))}
        />
      )}
      {loading.active && (
        <div className="loading-overlay" role="status">
          <div className="loading-card glass">
            <span className="loading-kicker">MECHANICAL SEQUENCE</span>
            <h2>
              {loading.mode === "extract"
                ? "Extracting cartridges…"
                : "Seating cartridges…"}
            </h2>
            <div
              className={`loader-weapon ${weapon.type} ${loading.mode}`}
              key={`${loading.mode}-${loading.progress}`}
            >
              {weapon.type === "lever" ? (
                <>
                  <WeaponArt weapon={weapon} firing={false} fx="none" />
                  <span className="loading-gate">
                    <i />
                  </span>
                  <span className="loading-round">
                    <Cartridge
                      ammo={state.ammo.find((a) => a.id === reloadSelected)}
                      density="all"
                    />
                  </span>
                  <span className="loader-caption">
                    {loading.mode === "extract"
                      ? "Gate release · cartridge withdrawn"
                      : "Nose forward · loading gate seated"}
                  </span>
                </>
              ) : (
                <>
                  <div className="revolver-reload-frame">
                    <WeaponArt weapon={weapon} firing={false} fx="none" />
                    <span className="swing-arm" />
                  </div>
                  <div className="revolver-loader-cylinder">
                    <i className="ejector" />
                    {Array.from({ length: 6 }, (_, i) => {
                      const id = (
                        loading.mode === "extract" ? weapon.slots : reloadPlan
                      )[i];
                      const ammo = state.ammo.find((a) => a.id === id);
                      return (
                        <span className={`loader-chamber pos-${i}`} key={i}>
                          {ammo && (
                            <Cartridge ammo={ammo} small density="all" />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <span className="loader-caption">
                    {loading.mode === "extract"
                      ? "Ejector rod pressed · chambers cleared"
                      : "Cylinder swung out · rounds seated chamber by chamber"}
                  </span>
                </>
              )}
            </div>
            <div className="load-bar">
              <span
                style={{
                  width: `${(loading.progress / loading.total) * 100}%`,
                }}
              />
            </div>
            <p>
              {loading.progress} / {loading.total}
            </p>
            <button
              onClick={() =>
                setLoading({
                  active: false,
                  progress: 0,
                  total: 0,
                  mode: "seat",
                })
              }
            >
              Skip animation
            </button>
          </div>
        </div>
      )}
      {goldOpen && (
        <div
          className="modal-scrim coin-ledger-scrim"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) commitGoldDraft(true);
          }}
        >
          <section
            className="coin-ledger coin-ledger-dialog glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coin-ledger-title"
          >
            <span>COIN LEDGER</span>
            <h2 id="coin-ledger-title">Edit available gold</h2>
            <label>
              Current gold
              <input
                autoFocus
                type="number"
                min="0"
                step="1"
                value={goldDraft}
                onChange={(e) => setGoldDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitGoldDraft(true);
                }}
              />
            </label>
            <div className="coin-adjustments">
              <button onClick={() => adjustGold(-5)}>−5</button>
              <button onClick={() => adjustGold(-1)}>−1</button>
              <button onClick={() => adjustGold(1)}>+1</button>
              <button onClick={() => adjustGold(5)}>+5</button>
            </div>
            <small>Every saved change can be undone.</small>
            <div className="coin-ledger-actions">
              <AppButton onClick={() => setGoldOpen(false)}>Cancel</AppButton>
              <AppButton className="primary" onClick={() => commitGoldDraft(true)}>
                Save Gold
              </AppButton>
            </div>
          </section>
        </div>
      )}
      {dialog && (
        <ThemedDialog
          dialog={dialog}
          close={() => setDialog(null)}
          confirm={confirmDialog}
        />
      )}
      {toast && (
        <div className={`toast ${toast.kind}`}>
          <i />
          {toast.text}
        </div>
      )}
      <input
        ref={importRef}
        className="sr-only"
        type="file"
        accept="application/json,.json"
        onChange={(e) => e.target.files?.[0] && importSave(e.target.files[0])}
      />
      <div ref={liveRef} className="sr-only" aria-live="polite" />
    </main>
  );
}

function Workshop({
  state,
  craft,
  setCraft,
  craftCost,
  craftCount,
  maxAffordable,
  craftRounds,
  editGold,
}: {
  state: LedgerState;
  craft: Record<string, number>;
  setCraft: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  craftCost: number;
  craftCount: number;
  maxAffordable: (a: Ammo) => number;
  craftRounds: () => void;
  editGold: () => void;
}) {
  const repeat = () => {
    try {
      const last = JSON.parse(
        localStorage.getItem("blackpowder-last-batch") || "{}",
      );
      setCraft(last);
    } catch {}
  };
  useEffect(() => {
    if (craftCount)
      localStorage.setItem("blackpowder-last-batch", JSON.stringify(craft));
  }, [craft, craftCount]);
  return (
    <div className="workshop-layout">
      <section className="panel glass">
        <div className="panel-head">
          <div>
            <span className="eyebrow">AMMOSMITH BENCH</span>
            <h1>Build the next encounter.</h1>
            <p>
              Queue a batch, inspect the full cost, and replenish the field
              case.
            </p>
          </div>
          <button className="gold-chip" onClick={editGold}>
            <span>AVAILABLE FUNDS</span>
            <b>{money(state.gold)}</b>
            <small>Edit coins</small>
          </button>
        </div>
        <div className="craft-grid">
          {state.ammo.map((a) => {
            const qty = craft[a.id] || 0;
            return (
              <article
                key={a.id}
                className={qty ? "active" : ""}
                style={{ "--ammo": a.color } as React.CSSProperties}
              >
                <Cartridge ammo={a} density={state.theme.density} />
                <div className="craft-copy">
                  <span>{money(a.cost)} EACH</span>
                  <h3>{a.name}</h3>
                  <p>{a.effect}</p>
                </div>
                <div className="craft-controls">
                  <button
                    onClick={() =>
                      setCraft((c) => ({ ...c, [a.id]: Math.max(0, qty - 1) }))
                    }
                    disabled={!qty}
                  >
                    −
                  </button>
                  <b>{qty}</b>
                  <button
                    onClick={() => setCraft((c) => ({ ...c, [a.id]: qty + 1 }))}
                  >
                    +
                  </button>
                  <button
                    onClick={() => setCraft((c) => ({ ...c, [a.id]: qty + 5 }))}
                  >
                    +5
                  </button>
                  <button
                    onClick={() =>
                      setCraft((c) => ({ ...c, [a.id]: maxAffordable(a) }))
                    }
                  >
                    MAX
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <aside className="panel glass batch-panel">
        <span className="eyebrow">CRAFTING LEDGER</span>
        <h2>Current batch</h2>
        <div className="batch-lines">
          {state.ammo
            .filter((a) => craft[a.id])
            .map((a) => (
              <div key={a.id}>
                <span style={{ background: a.color }} />
                <b>{craft[a.id]}×</b>
                <p>{a.name}</p>
                <em>{money((craft[a.id] || 0) * a.cost)}</em>
              </div>
            ))}
          {!craftCount && (
            <div className="empty-batch">
              <Icon name="workshop" />
              <p>Select ammunition from the bench to begin.</p>
            </div>
          )}
        </div>
        <div className="batch-total">
          <span>
            <small>ROUNDS</small>
            <b>{craftCount}</b>
          </span>
          <span>
            <small>TOTAL COST</small>
            <b className={craftCost > state.gold ? "over" : ""}>
              {money(craftCost)}
            </b>
          </span>
          <span>
            <small>AVERAGE</small>
            <b>{craftCount ? money(craftCost / craftCount) : "—"}</b>
          </span>
        </div>
        <AppButton
          className="primary craft-confirm"
          disabled={!craftCount || craftCost > state.gold}
          onClick={craftRounds}
        >
          <Icon name="workshop" />
          Craft {craftCount || ""} Rounds
        </AppButton>
        <div className="batch-tools">
          <button onClick={() => setCraft({})}>Clear batch</button>
          <button onClick={repeat}>Repeat last</button>
        </div>
      </aside>
    </div>
  );
}

function Presets({
  state,
  filter,
  setFilter,
  shortage,
  applyPreset,
  loadNow,
  setDialog,
  mutate,
}: {
  state: LedgerState;
  filter: string;
  setFilter: (v: string) => void;
  shortage: (p: Preset) => boolean;
  applyPreset: (p: Preset) => void;
  loadNow: (p: Preset) => void;
  setDialog: (d: DialogState) => void;
  mutate: (fn: (n: LedgerState) => void, label?: string, kind?: string) => void;
}) {
  const visible = state.presets
    .filter((p) => filter === "all" || p.weaponId === filter)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  return (
    <section className="panel presets-panel glass">
      <div className="panel-head">
        <div>
          <span className="eyebrow">MAGAZINE PRESETS</span>
          <h1>One-tap field loadouts.</h1>
          <p>
            See shortages before combat and stage the exact ammunition mix you
            want.
          </p>
        </div>
        <div className="filter-tabs">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {state.weapons.map((w) => (
            <button
              className={filter === w.id ? "active" : ""}
              onClick={() => setFilter(w.id)}
              key={w.id}
            >
              {w.shortName}
            </button>
          ))}
        </div>
      </div>
      <div className="preset-grid">
        {visible.map((p) => {
          const w = state.weapons.find((x) => x.id === p.weaponId)!;
          const short = shortage(p);
          const missing = state.ammo
            .map((a) => ({
              ammo: a,
              qty: Math.max(
                0,
                p.slots.filter((x) => x === a.id).length -
                  (a.reserve + w.slots.filter((x) => x === a.id).length),
              ),
            }))
            .filter((x) => x.qty);
          const missingCost = missing.reduce(
            (n, x) => n + x.qty * x.ammo.cost,
            0,
          );
          return (
            <article key={p.id} className={short ? "short" : ""}>
              <button
                className={`pin ${p.favorite ? "active" : ""}`}
                aria-label={p.favorite ? "Unpin preset" : "Pin preset"}
                onClick={() =>
                  mutate(
                    (n) => {
                      const x = n.presets.find((q) => q.id === p.id);
                      if (x) x.favorite = !x.favorite;
                    },
                    `${p.favorite ? "Unpinned" : "Pinned"} ${p.name}.`,
                    "preset",
                  )
                }
              >
                ✦
              </button>
              <div className="preset-head">
                <span>{w.shortName.toUpperCase()}</span>
                <h2>{p.name}</h2>
                <p>
                  {p.slots.filter(Boolean).length}/{w.capacity} rounds ·{" "}
                  {short
                    ? `Missing ${missing.reduce((n, x) => n + x.qty, 0)} (${money(missingCost)})`
                    : "Ready to load"}
                </p>
              </div>
              <div className="preset-mag">
                {p.slots.map((id, i) => {
                  const a = state.ammo.find((x) => x.id === id);
                  return (
                    <span
                      key={i}
                      style={{ "--ammo": a?.color } as React.CSSProperties}
                    >
                      {a ? (
                        <Cartridge
                          ammo={a}
                          small
                          density={state.theme.density}
                        />
                      ) : null}
                    </span>
                  );
                })}
              </div>
              <div className="preset-key">
                {state.ammo
                  .filter((a) => p.slots.includes(a.id))
                  .map((a) => (
                    <span
                      key={a.id}
                      style={{ "--ammo": a.color } as React.CSSProperties}
                    >
                      <i />
                      {a.symbol} ×{p.slots.filter((x) => x === a.id).length}
                    </span>
                  ))}
              </div>
              <div className="preset-actions">
                <AppButton
                  className="primary"
                  onClick={() => loadNow(p)}
                  disabled={short}
                >
                  Load Now
                </AppButton>
                <button onClick={() => applyPreset(p)}>Adjust</button>
                {short && (
                  <button
                    disabled={missingCost > state.gold}
                    onClick={() =>
                      mutate(
                        (n) => {
                          n.gold -= missingCost;
                          missing.forEach(({ ammo, qty }) => {
                            n.ammo.find((a) => a.id === ammo.id)!.reserve +=
                              qty;
                          });
                        },
                        `Crafted ${missing.reduce((n, x) => n + x.qty, 0)} missing preset rounds for ${money(missingCost)}.`,
                        "craft",
                      )
                    }
                  >
                    Craft Missing
                  </button>
                )}
                <button
                  onClick={() =>
                    mutate(
                      (n) => {
                        const x = n.presets.find((q) => q.id === p.id)!;
                        n.presets.push({
                          ...clone(x),
                          id: uid("preset"),
                          name: `${x.name} Copy`,
                          favorite: false,
                        });
                      },
                      `Duplicated ${p.name}.`,
                      "preset",
                    )
                  }
                >
                  Duplicate
                </button>
                <button
                  onClick={() =>
                    setDialog({
                      type: "renamePreset",
                      id: p.id,
                      title: "Rename Preset",
                      value: p.name,
                      body: "Choose a concise name you can recognize during combat.",
                    })
                  }
                >
                  Rename
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    setDialog({
                      type: "deletePreset",
                      id: p.id,
                      title: "Delete Preset?",
                      body: `“${p.name}” will be removed. You can undo this afterward.`,
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Settings({
  state,
  tab,
  setTab,
  passive,
  mutate,
  exportSave,
  importRef,
  setDialog,
  pwaStatus,
  installPwa,
}: {
  state: LedgerState;
  tab: SettingsTab;
  setTab: (t: SettingsTab) => void;
  passive: (fn: (n: LedgerState) => void) => void;
  mutate: (fn: (n: LedgerState) => void, label?: string, kind?: string) => void;
  exportSave: () => void;
  importRef: React.RefObject<HTMLInputElement | null>;
  setDialog: (d: DialogState) => void;
  pwaStatus: PwaInstallStatus;
  installPwa: () => void;
}) {
  const tabs: [SettingsTab, string][] = [
    ["appearance", "Appearance"],
    ["combat", "Combat"],
    ["animation", "Animation & Sound"],
    ["weapons", "Weapons"],
    ["ammunition", "Ammunition"],
    ["data", "Data & Saves"],
  ];
  return (
    <section className="settings-shell panel glass">
      <div className="settings-sidebar">
        <span className="eyebrow">SYSTEM CONFIGURATION</span>
        <h1>Settings</h1>
        <p>
          Shape the ledger to your table, screen, and preferred level of
          spectacle.
        </p>
        <nav>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <span>{label}</span>
              <b>›</b>
            </button>
          ))}
        </nav>
      </div>
      <div className="settings-content">
        {tab === "appearance" && (
          <>
            <SettingsHeading
              kicker="VISUAL SYSTEM"
              title="Appearance"
              text="Build a rough field ledger: forged metal, scarred leather, timber, or a paper bounty board."
            />
            <div className="setting-block">
              <h3>Environment</h3>
              <div className="environment-grid">
                {ENVIRONMENTS.map(([id, label]) => (
                  <button
                    key={id}
                    className={`${state.theme.environment === id ? "active" : ""} env-card-${id}`}
                    onClick={() =>
                      passive((n) => {
                        n.theme.environment = id;
                      })
                    }
                  >
                    <span />
                    <b>{label}</b>
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-block">
              <h3>Panel material</h3>
              <div className="choice-row material-choices">
                {MATERIALS.map(([id, label]) => (
                  <button
                    key={id}
                    className={`${state.theme.material === id ? "active" : ""} material-swatch-${id}`}
                    onClick={() =>
                      passive((n) => {
                        n.theme.material = id;
                      })
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-block">
              <h3>Accent metal</h3>
              <div className="swatches">
                {Object.entries(ACCENTS).map(([id, colors]) => (
                  <button
                    key={id}
                    className={state.theme.accent === id ? "active" : ""}
                    onClick={() =>
                      passive((n) => {
                        n.theme.accent = id;
                      })
                    }
                  >
                    <i style={{ background: colors[0] }} />
                    <span>{id}</span>
                  </button>
                ))}
              </div>
            </div>
            <Range
              label="Panel transparency"
              detail="Lower values reveal more of the chosen environment."
              value={state.theme.panelOpacity}
              min={62}
              max={98}
              suffix="%"
              onChange={(v) =>
                passive((n) => {
                  n.theme.panelOpacity = v;
                })
              }
            />
            <Range
              label="Background visibility"
              detail="Controls the strength of environmental artwork."
              value={state.theme.backgroundIntensity}
              min={20}
              max={100}
              suffix="%"
              onChange={(v) =>
                passive((n) => {
                  n.theme.backgroundIntensity = v;
                })
              }
            />
            <Range
              label="Vignette"
              detail="Darkens the outer edge behind the interface."
              value={state.theme.vignette}
              min={0}
              max={80}
              suffix="%"
              onChange={(v) =>
                passive((n) => {
                  n.theme.vignette = v;
                })
              }
            />
            <Range
              label="Background blur"
              detail="Softens busy scenery behind text."
              value={state.theme.blur}
              min={0}
              max={12}
              suffix="px"
              onChange={(v) =>
                passive((n) => {
                  n.theme.blur = v;
                })
              }
            />
            <Range
              label="Interface scale"
              detail="Adjusts the visual density of the ledger."
              value={state.theme.scale}
              min={88}
              max={112}
              suffix="%"
              onChange={(v) =>
                passive((n) => {
                  n.theme.scale = v;
                })
              }
            />
          </>
        )}
        {tab === "combat" && (
          <>
            <SettingsHeading
              kicker="TABLE PLAY"
              title="Combat controls"
              text="Optional helpers stay lightweight and never replace your character sheet."
            />
            <Toggle
              label="Attack roller"
              detail="Show a fast d20 control inside Combat Mode."
              value={state.roller.enabled}
              onChange={(v) =>
                passive((n) => {
                  n.roller.enabled = v;
                })
              }
            />
            <Toggle
              label="Elemental Chamber unlocked"
              detail="Enable the level 10 +1d6 elemental modification controls."
              value={state.elementalUnlocked}
              onChange={(v) =>
                passive((n) => {
                  n.elementalUnlocked = v;
                })
              }
            />
            {state.roller.enabled && (
              <div className="setting-block">
                <h3>Attack bonus</h3>
                <div className="number-fields">
                  <label>
                    Dexterity
                    <input
                      type="number"
                      value={state.roller.dex}
                      onChange={(e) =>
                        passive((n) => {
                          n.roller.dex = Number(e.target.value) || 0;
                        })
                      }
                    />
                  </label>
                  <label>
                    Proficiency
                    <input
                      type="number"
                      value={state.roller.prof}
                      onChange={(e) =>
                        passive((n) => {
                          n.roller.prof = Number(e.target.value) || 0;
                        })
                      }
                    />
                  </label>
                  <label>
                    Miscellaneous
                    <input
                      type="number"
                      value={state.roller.misc}
                      onChange={(e) =>
                        passive((n) => {
                          n.roller.misc = Number(e.target.value) || 0;
                        })
                      }
                    />
                  </label>
                  <label>
                    Roll mode
                    <select
                      value={state.roller.mode}
                      onChange={(e) =>
                        passive((n) => {
                          n.roller.mode = e.target
                            .value as LedgerState["roller"]["mode"];
                        })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="advantage">Advantage</option>
                      <option value="disadvantage">Disadvantage</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
            <div className="setting-block rules-card">
              <h3>Encoded class rulings</h3>
              <ul>
                <li>Tactical Selection: choose any prepared cartridge.</li>
                <li>Hollow Point: +1d4 piercing.</li>
                <li>Explosive Shell: 5-foot blast, once per round.</li>
                <li>
                  Full Metal Jacket: 1d6 piercing to a creature directly behind.
                </li>
                <li>
                  Elemental Chamber: +1d6 damage on each shot when unlocked.
                </li>
              </ul>
              <small>
                All costs and reminders remain editable in Ammunition.
              </small>
            </div>
          </>
        )}
        {tab === "animation" && (
          <>
            <SettingsHeading
              kicker="FEEDBACK"
              title="Animation & sound"
              text="All cartridge effects stay visible by default, exactly as requested."
            />
            <div className="setting-block">
              <h3>Cartridge animation density</h3>
              <div className="segmented">
                {(["all", "focused", "minimal"] as AnimationDensity[]).map(
                  (id) => (
                    <button
                      key={id}
                      className={state.theme.density === id ? "active" : ""}
                      onClick={() =>
                        passive((n) => {
                          n.theme.density = id;
                        })
                      }
                    >
                      {id === "all"
                        ? "All Rounds"
                        : id === "focused"
                          ? "Selected / Focused"
                          : "Minimal"}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="setting-block">
              <h3>Motion profile</h3>
              <div className="segmented">
                {(["full", "reduced", "off"] as Motion[]).map((id) => (
                  <button
                    key={id}
                    className={state.theme.motion === id ? "active" : ""}
                    onClick={() =>
                      passive((n) => {
                        n.theme.motion = id;
                      })
                    }
                  >
                    {id[0].toUpperCase() + id.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Range
              label="Effect intensity"
              detail="Scales flame, vapor, tracer, glint, and ambient effects."
              value={state.theme.intensity}
              min={20}
              max={120}
              suffix="%"
              onChange={(v) =>
                passive((n) => {
                  n.theme.intensity = v;
                })
              }
            />
            <Range
              label="Environmental motion"
              detail="Controls dust, embers, and arcane drift."
              value={state.theme.atmosphere}
              min={0}
              max={100}
              suffix="%"
              onChange={(v) =>
                passive((n) => {
                  n.theme.atmosphere = v;
                })
              }
            />
            <Toggle
              label="Mechanical sound"
              detail="Enable synthesized clicks, cycling, and shot feedback."
              value={state.sound}
              onChange={(v) =>
                passive((n) => {
                  n.sound = v;
                })
              }
            />
          </>
        )}
        {tab === "weapons" && (
          <>
            <SettingsHeading
              kicker="ARMORY"
              title="Weapon configuration"
              text="Refinish the two canonical firearms and choose their chamber element."
            />
            <div className="weapon-editor-grid">
              {state.weapons.map((w) => (
                <article key={w.id}>
                  <div className="weapon-editor-stage">
                    <WeaponArt weapon={w} firing={false} fx="none" />
                  </div>
                  <label>
                    Display name
                    <input
                      value={w.name}
                      onChange={(e) =>
                        passive((n) => {
                          n.weapons.find((x) => x.id === w.id)!.name =
                            e.target.value;
                        })
                      }
                    />
                  </label>
                  <div className="two-fields">
                    <label>
                      Metal
                      <select
                        value={w.finish}
                        onChange={(e) =>
                          passive((n) => {
                            n.weapons.find((x) => x.id === w.id)!.finish =
                              e.target.value;
                          })
                        }
                      >
                        <option value="blackened">Blackened Steel</option>
                        <option value="steel">Polished Steel</option>
                        <option value="brass">Brass</option>
                        <option value="silver">Silver</option>
                        <option value="copper">Copper</option>
                      </select>
                    </label>
                    <label>
                      Stock
                      <select
                        value={w.stock}
                        onChange={(e) =>
                          passive((n) => {
                            n.weapons.find((x) => x.id === w.id)!.stock =
                              e.target.value;
                          })
                        }
                      >
                        <option value="walnut">Dark Walnut</option>
                        <option value="ebony">Ebony</option>
                        <option value="weathered">Weathered Ash</option>
                        <option value="ivory">Ivory</option>
                      </select>
                    </label>
                  </div>
                  {state.elementalUnlocked && (
                    <label>
                      Elemental Chamber
                      <select
                        value={w.element}
                        onChange={(e) =>
                          passive((n) => {
                            const weapon = n.weapons.find(
                              (x) => x.id === w.id,
                            )!;
                            weapon.element = e.target.value;
                            if (e.target.value !== "off") {
                              weapon.lastElement = e.target.value;
                            }
                          })
                        }
                      >
                        {ELEMENTS.map((x) => (
                          <option key={x} value={x}>
                            {x[0].toUpperCase() + x.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "ammunition" && (
          <>
            <SettingsHeading
              kicker="AMMOSMITH CATALOG"
              title="Ammunition"
              text="Factory defaults follow the approved AC-3 revisions; custom variants remain fully editable."
            />
            <div className="ammo-editor-list">
              {state.ammo.map((a) => {
                const inUse =
                  a.reserve > 0 ||
                  state.weapons.some((w) => w.slots.includes(a.id)) ||
                  state.presets.some((p) => p.slots.includes(a.id));
                return (
                  <details key={a.id}>
                    <summary>
                      <Cartridge ammo={a} small density={state.theme.density} />
                      <span>
                        <b>{a.name}</b>
                        <small>
                          {money(a.cost)} · {a.effect}
                        </small>
                      </span>
                      <em>›</em>
                    </summary>
                    <div className="ammo-editor visual-workshop">
                      <div className="visual-preview-suite">
                        <div className="hero-round-preview">
                          <div>
                            <Cartridge ammo={a} density={state.theme.density} />
                            <span>Rendered round</span>
                          </div>
                          <div>
                            <Cartridge ammo={a} silhouette density="minimal" />
                            <span>Silhouette test</span>
                          </div>
                        </div>
                        <p>
                          If these two shapes read differently at a glance, the
                          cartridge is doing its job.
                        </p>
                      </div>
                      <div className="visual-fields">
                        <label>
                          Name
                          <input
                            value={a.name}
                            onChange={(e) =>
                              passive((n) => {
                                n.ammo.find((x) => x.id === a.id)!.name =
                                  e.target.value;
                              })
                            }
                          />
                        </label>
                        <label>
                          Crafting cost
                          <input
                            type="number"
                            min="0"
                            value={a.cost}
                            onChange={(e) =>
                              passive((n) => {
                                n.ammo.find((x) => x.id === a.id)!.cost =
                                  Math.max(0, Number(e.target.value) || 0);
                              })
                            }
                          />
                        </label>
                        <label className="wide">
                          Rules reminder
                          <textarea
                            value={a.effect}
                            onChange={(e) =>
                              passive((n) => {
                                n.ammo.find((x) => x.id === a.id)!.effect =
                                  e.target.value;
                              })
                            }
                          />
                        </label>

                        <div className="visual-divider">
                          Structural silhouette
                        </div>
                        <label>
                          Appearance preset
                          <select
                            value={a.visual.preset}
                            onChange={(e) =>
                              passive((n) => {
                                const item = n.ammo.find((x) => x.id === a.id)!;
                                item.visual = clone(
                                  STYLE_PRESETS[e.target.value] ||
                                    STYLE_PRESETS.custom,
                                );
                                item.color = item.visual.color;
                                item.symbol = item.visual.symbol;
                                item.fx = item.visual.fx;
                                item.shape = item.visual.family;
                              })
                            }
                          >
                            {Object.keys(STYLE_PRESETS).map((key) => (
                              <option key={key} value={key}>
                                {key[0].toUpperCase() + key.slice(1)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <VisualSelect
                          label="Cartridge family"
                          value={a.visual.family}
                          options={CARTRIDGE_FAMILIES}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.family = value;
                              item.shape = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <VisualSelect
                          label="Projectile profile"
                          value={a.visual.projectile}
                          options={PROJECTILES}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.projectile = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />

                        <div className="visual-divider">
                          Materials & markings
                        </div>
                        <VisualSelect
                          label="Case material"
                          value={a.visual.caseMaterial}
                          options={CASE_MATERIALS}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.caseMaterial = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <VisualSelect
                          label="Projectile material"
                          value={a.visual.projectileMaterial}
                          options={PROJECTILE_MATERIALS}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.projectileMaterial = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <VisualSelect
                          label="Tip treatment"
                          value={a.visual.tipStyle}
                          options={TIP_STYLES}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.tipStyle = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <label>
                          Accent / effect color
                          <input
                            type="color"
                            value={a.visual.color}
                            onChange={(e) =>
                              passive((n) => {
                                const item = n.ammo.find((x) => x.id === a.id)!;
                                item.visual.color = e.target.value;
                                item.color = e.target.value;
                                item.visual.preset = "custom";
                              })
                            }
                          />
                        </label>
                        <VisualSelect
                          label="Case band"
                          value={a.visual.band}
                          options={BANDS}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.band = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <VisualSelect
                          label="Casing marking"
                          value={a.visual.marking}
                          options={MARKINGS}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.marking = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <label>
                          Custom mark
                          <input
                            maxLength={3}
                            value={a.visual.symbol}
                            onChange={(e) =>
                              passive((n) => {
                                const item = n.ammo.find((x) => x.id === a.id)!;
                                item.visual.symbol = e.target.value.slice(0, 3);
                                item.symbol = item.visual.symbol;
                                item.visual.preset = "custom";
                              })
                            }
                          />
                        </label>

                        <div className="visual-divider">Animated effect</div>
                        <VisualSelect
                          label="Effect"
                          value={a.visual.fx}
                          options={EFFECTS}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.fx = value;
                              item.fx = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <VisualSelect
                          label="Effect placement"
                          value={a.visual.fxPlacement}
                          options={FX_PLACEMENTS}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.fxPlacement = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <VisualSelect
                          label="Effect intensity"
                          value={a.visual.intensity}
                          options={INTENSITIES}
                          onChange={(value) =>
                            passive((n) => {
                              const item = n.ammo.find((x) => x.id === a.id)!;
                              item.visual.intensity = value;
                              item.visual.preset = "custom";
                            })
                          }
                        />
                        <div className="ammo-editor-actions">
                          <AppButton
                            onClick={() =>
                              mutate(
                                (n) => {
                                  const src = n.ammo.find(
                                    (x) => x.id === a.id,
                                  )!;
                                  n.ammo.push({
                                    ...clone(src),
                                    id: uid("ammo"),
                                    name: `${src.name} Variant`,
                                    reserve: 0,
                                    visual: {
                                      ...clone(src.visual),
                                      preset: "custom",
                                    },
                                  });
                                },
                                `Duplicated ${a.name}.`,
                                "ammo",
                              )
                            }
                          >
                            Duplicate Variant
                          </AppButton>
                          <AppButton
                            className="danger"
                            disabled={inUse}
                            title={
                              inUse
                                ? "Set reserve to 0 and remove this type from weapons and presets first."
                                : "Delete this ammunition type"
                            }
                            onClick={() =>
                              setDialog({
                                type: "deleteAmmo",
                                id: a.id,
                                title: "Delete Ammunition Type?",
                                body: `“${a.name}” will be removed from the catalog. You can undo this afterward.`,
                              })
                            }
                          >
                            Delete Type
                          </AppButton>
                        </div>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
            <AppButton
              className="primary add-ammo"
              onClick={() =>
                setDialog({
                  type: "newAmmo",
                  title: "New Ammunition Type",
                  value: "New Specialty Round",
                  body: "Create a new editable cartridge for homebrew ammunition.",
                })
              }
            >
              + Add Ammunition Type
            </AppButton>
          </>
        )}
        {tab === "data" && (
          <>
            <SettingsHeading
              kicker="PORTABLE LEDGER"
              title="Data & saves"
              text="Your ledger saves automatically on this device. Export a file before moving browsers or computers."
            />
            <div className="save-status">
              <Icon name="lock" />
              <div>
                <span>AUTOSAVE HEALTHY</span>
                <h3>Last saved {timeAgo(state.savedAt)}</h3>
                <p>Stored locally on this device.</p>
              </div>
            </div>
            <div className={`install-status ${pwaStatus}`}>
              <div className="install-mark" aria-hidden="true">BL</div>
              <div>
                <span>OFFLINE FIELD KIT</span>
                <h3>
                  {pwaStatus === "installed"
                    ? "Installed on this device"
                    : "Install Blackpowder Ledger"}
                </h3>
                <p>
                  {pwaStatus === "installed"
                    ? "Ready to open without internet. Updates arrive automatically when you reconnect."
                    : pwaStatus === "available"
                      ? "Adds a standalone app icon and keeps the complete armory available without internet."
                      : "Open your browser menu and choose Install app or Add to Home Screen."}
                </p>
              </div>
              {pwaStatus !== "installed" && (
                <AppButton
                  className={pwaStatus === "available" ? "primary" : ""}
                  onClick={installPwa}
                >
                  <Icon name="download" />
                  {pwaStatus === "available" ? "Install App" : "How to Install"}
                </AppButton>
              )}
            </div>
            <div className="data-actions">
              <AppButton className="primary" onClick={exportSave}>
                <Icon name="download" />
                Export Portable Save
              </AppButton>
              <AppButton onClick={() => importRef.current?.click()}>
                <Icon name="upload" />
                Import Save
              </AppButton>
            </div>
            <div className="danger-zone">
              <div>
                <h3>Reset the ledger</h3>
                <p>
                  Restore factory ammunition, weapons, presets, gold, and
                  appearance. The reset can be undone until you close the page.
                </p>
              </div>
              <AppButton
                className="danger"
                onClick={() =>
                  setDialog({
                    type: "reset",
                    title: "Reset the Entire Ledger?",
                    body: "This restores the Charmworks factory defaults. Your current state will remain available through Undo during this session.",
                  })
                }
              >
                Reset Everything
              </AppButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SettingsHeading({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div className="settings-heading">
      <span>{kicker}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function VisualSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Range({
  label,
  detail,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  detail: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="range-setting">
      <span>
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output>
        {value}
        {suffix}
      </output>
    </label>
  );
}
function Toggle({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-setting">
      <span>
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i />
    </label>
  );
}

function ReloadModal({
  state,
  weapon,
  plan,
  selected,
  setSelected,
  add,
  remove,
  fillStandard,
  replaceAll,
  setPlan,
  pool,
  count,
  close,
  commit,
  applyPreset,
}: {
  state: LedgerState;
  weapon: Weapon;
  plan: (string | null)[];
  selected: string;
  setSelected: (v: string) => void;
  add: (id: string) => void;
  remove: (i: number) => void;
  fillStandard: () => void;
  replaceAll: (id: string) => void;
  setPlan: (p: (string | null)[]) => void;
  pool: (id: string) => number;
  count: (id: string) => number;
  close: () => void;
  commit: () => void;
  applyPreset: (p: Preset) => void;
}) {
  const possible = state.ammo.every((a) => count(a.id) <= pool(a.id));
  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className="reload-modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reload-title"
      >
        <div className="modal-head">
          <div>
            <span>PHYSICAL LOAD CONFIGURATOR</span>
            <h2 id="reload-title">Prepare {weapon.shortName}</h2>
            <p>
              Click an ammunition card to seat one round. Click a cartridge in
              the weapon to remove it.
            </p>
          </div>
          <button onClick={close} aria-label="Close reload">
            <Icon name="close" />
          </button>
        </div>
        <div className="reload-layout">
          <div className="reload-catalog">
            <div className="reload-tools">
              <button onClick={() => setPlan(clone(weapon.slots))}>
                Current
              </button>
              <button onClick={() => setPlan(clone(weapon.lastLoad))}>
                Last Load
              </button>
              <button onClick={fillStandard}>Fill Standard</button>
              <button onClick={() => setPlan(blankSlots(weapon.capacity))}>
                Clear
              </button>
            </div>
            <div className="reload-list">
              {state.ammo.map((a) => {
                const left = pool(a.id) - count(a.id);
                return (
                  <article
                    key={a.id}
                    role="button"
                    tabIndex={left > 0 ? 0 : -1}
                    aria-disabled={left <= 0}
                    aria-label={`Load one ${a.name}. ${left} available.`}
                    className={`${selected === a.id ? "active" : ""} ${left <= 0 ? "depleted" : ""}`}
                    style={{ "--ammo": a.color } as React.CSSProperties}
                    onClick={() => {
                      setSelected(a.id);
                      if (left > 0) add(a.id);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && left > 0) {
                        e.preventDefault();
                        setSelected(a.id);
                        add(a.id);
                      }
                    }}
                  >
                    <Cartridge
                      ammo={a}
                      selected={selected === a.id}
                      density={state.theme.density}
                    />
                    <div>
                      <b>{a.name}</b>
                      <small>{a.effect}</small>
                      <span>
                        {left} available · {count(a.id)} planned
                      </span>
                    </div>
                    <span className="load-card-action">
                      {left > 0 ? "LOAD" : "EMPTY"}
                      <b>＋</b>
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="reload-plan">
            <div className="plan-stage">
              <span>
                {weapon.type === "lever"
                  ? "TUBULAR MAGAZINE CUTAWAY"
                  : "OPEN CYLINDER"}
              </span>
              {weapon.type === "lever" ? (
                <div className="reload-tube">
                  {plan.map((id, i) => {
                    const a = state.ammo.find((x) => x.id === id);
                    return (
                      <button
                        key={i}
                        className={a ? "filled" : ""}
                        onClick={() => a && remove(i)}
                        style={{ "--ammo": a?.color } as React.CSSProperties}
                      >
                        {a ? (
                          <Cartridge
                            ammo={a}
                            small
                            density={state.theme.density}
                          />
                        ) : (
                          <b>{i + 1}</b>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="reload-cylinder">
                  {plan.map((id, i) => {
                    const a = state.ammo.find((x) => x.id === id);
                    return (
                      <button
                        key={i}
                        className={`pos-${i} ${a ? "filled" : ""}`}
                        onClick={() => a && remove(i)}
                        style={{ "--ammo": a?.color } as React.CSSProperties}
                      >
                        {a ? (
                          <Cartridge
                            ammo={a}
                            small
                            density={state.theme.density}
                          />
                        ) : (
                          <b>{i + 1}</b>
                        )}
                      </button>
                    );
                  })}
                  <i />
                </div>
              )}
            </div>
            <div className="selected-load-type">
              <Cartridge
                ammo={state.ammo.find((a) => a.id === selected)}
                small
                density={state.theme.density}
              />
              <div>
                <span>SELECTED TYPE</span>
                <b>{state.ammo.find((a) => a.id === selected)?.name}</b>
              </div>
              <button onClick={() => replaceAll(selected)}>
                Fill Entire Weapon
              </button>
            </div>
            <div className="preset-strip">
              <span>ONE-TAP PRESETS</span>
              {state.presets
                .filter((p) => p.weaponId === weapon.id)
                .map((p) => (
                  <button key={p.id} onClick={() => applyPreset(p)}>
                    {p.favorite && "✦ "}
                    {p.name}
                  </button>
                ))}
            </div>
            <div className="plan-summary">
              <span>
                <small>PREPARED</small>
                <b>
                  {plan.filter(Boolean).length}/{weapon.capacity}
                </b>
              </span>
              <span>
                <small>EMPTY</small>
                <b>{plan.filter((x) => !x).length}</b>
              </span>
              <span>
                <small>STATUS</small>
                <b className={possible ? "ready" : "bad"}>
                  {possible ? "READY" : "SHORTAGE"}
                </b>
              </span>
            </div>
            <AppButton
              className="primary commit-load"
              onClick={commit}
              disabled={!possible}
            >
              <Icon name="reload" />
              Load {plan.filter(Boolean).length} Rounds
            </AppButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function ThemedDialog({
  dialog,
  close,
  confirm,
}: {
  dialog: NonNullable<DialogState>;
  close: () => void;
  confirm: (v?: string) => void;
}) {
  const [value, setValue] = useState(dialog.value || "");
  const needsInput = ["renamePreset", "savePreset", "newAmmo"].includes(
    dialog.type,
  );
  const destructive =
    dialog.type === "reset" ||
    dialog.type.includes("delete") ||
    dialog.type === "discardCraft";
  return (
    <div
      className="modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section className="themed-dialog glass" role="dialog" aria-modal="true">
        <span className="dialog-mark">{destructive ? "!" : "✦"}</span>
        <h2>{dialog.title}</h2>
        <p>{dialog.body}</p>
        {needsInput && (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirm(value);
            }}
          />
        )}
        <div>
          <AppButton onClick={close}>Cancel</AppButton>
          <AppButton
            className={destructive ? "danger" : "primary"}
            onClick={() => confirm(value)}
          >
            {dialog.type === "reset"
              ? "Reset Ledger"
              : dialog.type === "deletePreset"
                ? "Delete Preset"
                : dialog.type === "deleteAmmo"
                  ? "Delete Type"
                  : dialog.type === "discardCraft"
                    ? "Discard Batch"
                    : "Confirm"}
          </AppButton>
        </div>
      </section>
    </div>
  );
}
