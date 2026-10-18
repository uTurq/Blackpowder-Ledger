"use client";

import { useId } from "react";

export type AnimationDensity = "all" | "focused" | "minimal";

export type CartridgeVisual = {
  preset: string;
  family: string;
  projectile: string;
  caseMaterial: string;
  projectileMaterial: string;
  tipStyle: string;
  band: string;
  marking: string;
  fx: string;
  fxPlacement: string;
  intensity: string;
  symbol: string;
  color: string;
};

export type CartridgeAmmo = {
  id: string;
  name: string;
  visual: CartridgeVisual;
};

export const CARTRIDGE_FAMILIES = [
  ["revolverShort", "Short Revolver"],
  ["revolverMagnum", "Magnum Revolver"],
  ["pistolCompact", "Compact Pistol"],
  ["pistolService", "Service Pistol"],
  ["rifleCarbine", "Carbine Rifle"],
  ["rifleStandard", "Standard Rifle"],
  ["rifleLong", "Long Rifle"],
  ["heavyRifle", "Heavy Rifle"],
  ["straightWall", "Straight-Wall"],
  ["shotgun", "Shotgun Shell"],
  ["arcaneCell", "Arcane Cell"],
  ["caseless", "Caseless"],
] as const;

export const PROJECTILES = [
  ["roundNose", "Round Nose"],
  ["flatNose", "Flat Nose"],
  ["hollowPoint", "Hollow Point"],
  ["wadcutter", "Wadcutter"],
  ["softPoint", "Soft Point"],
  ["spitzer", "Spitzer"],
  ["longSpitzer", "Long Spitzer"],
  ["needle", "Needle Penetrator"],
  ["explosive", "Explosive Head"],
  ["segmented", "Segmented"],
  ["crystal", "Crystal"],
  ["capsule", "Fluid Capsule"],
] as const;

export const CASE_MATERIALS = [
  ["brass", "Brass"],
  ["nickel", "Nickel-Silver"],
  ["copper", "Copper"],
  ["steel", "Steel"],
  ["blackSteel", "Blackened Steel"],
  ["bone", "Ivory / Bone"],
  ["ceramic", "Ceramic"],
  ["arcane", "Arcane Alloy"],
  ["glass", "Reinforced Glass"],
] as const;

export const PROJECTILE_MATERIALS = [
  ["copper", "Copper Jacket"],
  ["lead", "Lead"],
  ["silver", "Silver"],
  ["steel", "Steel"],
  ["blackSteel", "Black Steel"],
  ["tungsten", "Tungsten Core"],
  ["brass", "Brass"],
  ["obsidian", "Obsidian"],
  ["crystal", "Crystal"],
  ["toxicGlass", "Toxic Glass"],
  ["arcane", "Arcane Metal"],
] as const;

export const TIP_STYLES = [
  ["none", "Natural"],
  ["painted", "Painted Tip"],
  ["core", "Exposed Core"],
  ["split", "Split / Cavity"],
  ["glass", "Translucent"],
  ["glow", "Glowing Tip"],
] as const;

export const BANDS = [
  ["none", "No Band"],
  ["single", "Single Band"],
  ["double", "Double Band"],
  ["hazard", "Hazard Stripes"],
  ["toxic", "Toxic Seal"],
  ["runes", "Rune Band"],
] as const;

export const MARKINGS = [
  ["none", "None"],
  ["dot", "Dot"],
  ["letter", "Letter"],
  ["chevron", "Chevron"],
  ["star", "Starburst"],
  ["moon", "Moon"],
  ["skull", "Toxic Mark"],
  ["rune", "Rune"],
] as const;

export const EFFECTS = [
  ["none", "None"],
  ["flame", "Flame"],
  ["ember", "Embers"],
  ["drip", "Dripping Liquid"],
  ["poison", "Poison"],
  ["frost", "Frost Mist"],
  ["electric", "Electricity"],
  ["energy", "Swirling Energy"],
  ["shadow", "Shadow Smoke"],
  ["radiant", "Radiant Shimmer"],
  ["tracer", "Tracer Trail"],
  ["runes", "Pulsing Runes"],
] as const;

export const FX_PLACEMENTS = [
  ["tip", "Projectile"],
  ["neck", "Case Neck"],
  ["case", "Casing"],
  ["full", "Whole Round"],
  ["trail", "Trailing"],
  ["internal", "Inside Cartridge"],
] as const;

export const INTENSITIES = [
  ["subtle", "Subtle"],
  ["noticeable", "Noticeable"],
  ["dramatic", "Dramatic"],
] as const;

export const STYLE_PRESETS: Record<string, CartridgeVisual> = {
  standard: {
    preset: "standard",
    family: "rifleStandard",
    projectile: "spitzer",
    caseMaterial: "brass",
    projectileMaterial: "copper",
    tipStyle: "none",
    band: "none",
    marking: "dot",
    fx: "none",
    fxPlacement: "tip",
    intensity: "subtle",
    symbol: "•",
    color: "#b87333",
  },
  hollow: {
    preset: "hollow",
    family: "revolverMagnum",
    projectile: "hollowPoint",
    caseMaterial: "brass",
    projectileMaterial: "copper",
    tipStyle: "split",
    band: "single",
    marking: "letter",
    fx: "none",
    fxPlacement: "tip",
    intensity: "subtle",
    symbol: "H",
    color: "#d7604e",
  },
  fmj: {
    preset: "fmj",
    family: "rifleLong",
    projectile: "longSpitzer",
    caseMaterial: "nickel",
    projectileMaterial: "copper",
    tipStyle: "none",
    band: "double",
    marking: "chevron",
    fx: "tracer",
    fxPlacement: "trail",
    intensity: "subtle",
    symbol: "F",
    color: "#8fc4dc",
  },
  explosive: {
    preset: "explosive",
    family: "heavyRifle",
    projectile: "explosive",
    caseMaterial: "brass",
    projectileMaterial: "blackSteel",
    tipStyle: "painted",
    band: "hazard",
    marking: "star",
    fx: "flame",
    fxPlacement: "tip",
    intensity: "noticeable",
    symbol: "✦",
    color: "#ef7f28",
  },
  armor: {
    preset: "armor",
    family: "rifleStandard",
    projectile: "needle",
    caseMaterial: "blackSteel",
    projectileMaterial: "tungsten",
    tipStyle: "core",
    band: "double",
    marking: "chevron",
    fx: "none",
    fxPlacement: "tip",
    intensity: "subtle",
    symbol: "▲",
    color: "#8e969d",
  },
  tracer: {
    preset: "tracer",
    family: "rifleCarbine",
    projectile: "spitzer",
    caseMaterial: "copper",
    projectileMaterial: "copper",
    tipStyle: "painted",
    band: "single",
    marking: "letter",
    fx: "tracer",
    fxPlacement: "trail",
    intensity: "noticeable",
    symbol: "T",
    color: "#ff5146",
  },
  silver: {
    preset: "silver",
    family: "revolverShort",
    projectile: "roundNose",
    caseMaterial: "nickel",
    projectileMaterial: "silver",
    tipStyle: "none",
    band: "single",
    marking: "moon",
    fx: "radiant",
    fxPlacement: "full",
    intensity: "subtle",
    symbol: "☾",
    color: "#dfe8ed",
  },
  toxic: {
    preset: "toxic",
    family: "straightWall",
    projectile: "capsule",
    caseMaterial: "blackSteel",
    projectileMaterial: "toxicGlass",
    tipStyle: "glass",
    band: "toxic",
    marking: "skull",
    fx: "poison",
    fxPlacement: "tip",
    intensity: "noticeable",
    symbol: "V",
    color: "#74d45f",
  },
  arcane: {
    preset: "arcane",
    family: "arcaneCell",
    projectile: "crystal",
    caseMaterial: "arcane",
    projectileMaterial: "crystal",
    tipStyle: "glow",
    band: "runes",
    marking: "rune",
    fx: "energy",
    fxPlacement: "full",
    intensity: "noticeable",
    symbol: "✧",
    color: "#9278ed",
  },
  frost: {
    preset: "frost",
    family: "rifleCarbine",
    projectile: "crystal",
    caseMaterial: "nickel",
    projectileMaterial: "crystal",
    tipStyle: "glow",
    band: "single",
    marking: "rune",
    fx: "frost",
    fxPlacement: "full",
    intensity: "noticeable",
    symbol: "❄",
    color: "#87dbf2",
  },
  shadow: {
    preset: "shadow",
    family: "caseless",
    projectile: "segmented",
    caseMaterial: "blackSteel",
    projectileMaterial: "obsidian",
    tipStyle: "glow",
    band: "none",
    marking: "rune",
    fx: "shadow",
    fxPlacement: "full",
    intensity: "noticeable",
    symbol: "◆",
    color: "#815da0",
  },
  custom: {
    preset: "custom",
    family: "pistolService",
    projectile: "flatNose",
    caseMaterial: "brass",
    projectileMaterial: "copper",
    tipStyle: "painted",
    band: "single",
    marking: "letter",
    fx: "runes",
    fxPlacement: "case",
    intensity: "subtle",
    symbol: "?",
    color: "#69b8a3",
  },
};

type Geometry = {
  casePath: string;
  rim: [number, number, number, number, number];
  primer: [number, number, number];
  bulletBase: number;
  bulletTop: number;
  bulletWidth: number;
};

const GEOMETRY: Record<string, Geometry> = {
  revolverShort: {
    casePath:
      "M18 78 Q18 72 24 72 H56 Q62 72 62 78 V151 Q62 157 56 157 H24 Q18 157 18 151 Z",
    rim: [14, 153, 52, 10, 3],
    primer: [40, 160, 10],
    bulletBase: 77,
    bulletTop: 28,
    bulletWidth: 38,
  },
  revolverMagnum: {
    casePath:
      "M21 72 Q21 68 25 68 H55 Q59 68 59 72 V158 Q59 163 54 163 H26 Q21 163 21 158 Z",
    rim: [17, 159, 46, 9, 3],
    primer: [40, 166, 9],
    bulletBase: 71,
    bulletTop: 18,
    bulletWidth: 32,
  },
  pistolCompact: {
    casePath:
      "M20 87 Q20 82 25 82 H55 Q60 82 60 87 L57 154 Q57 159 52 159 H28 Q23 159 23 154 Z",
    rim: [20, 155, 40, 7, 2],
    primer: [40, 159, 8],
    bulletBase: 86,
    bulletTop: 40,
    bulletWidth: 34,
  },
  pistolService: {
    casePath:
      "M20 80 Q20 75 25 75 H55 Q60 75 60 80 L58 158 Q58 163 53 163 H27 Q22 163 22 158 Z",
    rim: [20, 159, 40, 7, 2],
    primer: [40, 163, 8],
    bulletBase: 79,
    bulletTop: 27,
    bulletWidth: 34,
  },
  rifleCarbine: {
    casePath:
      "M22 78 L28 65 Q30 61 33 61 H47 Q50 61 52 65 L58 78 V161 Q58 166 53 166 H27 Q22 166 22 161 Z",
    rim: [19, 162, 42, 8, 2],
    primer: [40, 166, 8],
    bulletBase: 63,
    bulletTop: 19,
    bulletWidth: 22,
  },
  rifleStandard: {
    casePath:
      "M23 74 L29 59 Q30 56 34 56 H46 Q50 56 51 59 L57 74 V163 Q57 168 52 168 H28 Q23 168 23 163 Z",
    rim: [20, 164, 40, 8, 2],
    primer: [40, 168, 8],
    bulletBase: 58,
    bulletTop: 5,
    bulletWidth: 20,
  },
  rifleLong: {
    casePath:
      "M25 68 L31 51 Q32 48 35 48 H45 Q48 48 49 51 L55 68 V165 Q55 170 50 170 H30 Q25 170 25 165 Z",
    rim: [22, 166, 36, 8, 2],
    primer: [40, 170, 7],
    bulletBase: 50,
    bulletTop: 0,
    bulletWidth: 17,
  },
  heavyRifle: {
    casePath:
      "M16 73 L25 55 Q27 51 31 51 H49 Q53 51 55 55 L64 73 V162 Q64 168 58 168 H22 Q16 168 16 162 Z",
    rim: [12, 163, 56, 9, 3],
    primer: [40, 168, 11],
    bulletBase: 53,
    bulletTop: 3,
    bulletWidth: 29,
  },
  straightWall: {
    casePath:
      "M18 72 Q18 67 23 67 H57 Q62 67 62 72 V161 Q62 166 57 166 H23 Q18 166 18 161 Z",
    rim: [14, 162, 52, 9, 3],
    primer: [40, 166, 10],
    bulletBase: 71,
    bulletTop: 18,
    bulletWidth: 37,
  },
  shotgun: {
    casePath:
      "M15 51 Q15 46 20 46 H60 Q65 46 65 51 V157 Q65 163 59 163 H21 Q15 163 15 157 Z",
    rim: [10, 159, 60, 11, 3],
    primer: [40, 164, 12],
    bulletBase: 50,
    bulletTop: 21,
    bulletWidth: 43,
  },
  arcaneCell: {
    casePath: "M19 66 L14 82 V154 L22 166 H58 L66 154 V82 L61 66 L53 57 H27 Z",
    rim: [20, 162, 40, 8, 3],
    primer: [40, 166, 8],
    bulletBase: 61,
    bulletTop: 2,
    bulletWidth: 35,
  },
  caseless: {
    casePath: "M24 78 L28 68 H52 L56 78 V160 L50 168 H30 L24 160 Z",
    rim: [27, 164, 26, 5, 1],
    primer: [40, 166, 5],
    bulletBase: 71,
    bulletTop: 5,
    bulletWidth: 22,
  },
};

const MATERIALS: Record<string, [string, string, string, string]> = {
  brass: ["#5b3612", "#f0c66d", "#b77928", "#6b3e13"],
  nickel: ["#3c454b", "#eef4f6", "#9ca9af", "#4a555a"],
  copper: ["#602713", "#edaa72", "#ad5128", "#6e2b15"],
  steel: ["#2c3439", "#c6d0d5", "#68747a", "#22292d"],
  blackSteel: ["#07090a", "#697177", "#242a2d", "#080a0b"],
  bone: ["#6c634f", "#f1ead2", "#b9ad8a", "#6f6650"],
  ceramic: ["#565252", "#eee9e2", "#a9a29a", "#555051"],
  arcane: ["#142e50", "#9edcff", "#4c79b1", "#1b3150"],
  glass: ["#224653", "#c7f6ff", "#5fb5c8", "#244653"],
  lead: ["#383b3d", "#aaaeb0", "#65696b", "#373a3c"],
  silver: ["#566067", "#ffffff", "#c8d4da", "#657078"],
  tungsten: ["#171b1d", "#9aa2a5", "#454b4e", "#161a1c"],
  obsidian: ["#030305", "#62526f", "#1b1320", "#030204"],
  crystal: ["#2d5770", "#d5f8ff", "#75c5e8", "#31586d"],
  toxicGlass: ["#173b23", "#c7ff9e", "#59c555", "#183b21"],
};

function safeColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#b8bcc0";
}
function shade(hex: string, amount: number) {
  const clean = safeColor(hex).slice(1);
  const rgb = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
  const target = amount < 0 ? 0 : 255;
  return `#${rgb
    .map((v) =>
      Math.max(
        0,
        Math.min(255, Math.round((target - v) * Math.abs(amount) + v)),
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
function palette(name: string, tint?: string) {
  if (tint)
    return [
      shade(tint, -0.48),
      shade(tint, 0.48),
      shade(tint, -0.08),
      shade(tint, -0.56),
    ] as const;
  return MATERIALS[name] || MATERIALS.brass;
}

export function normalizeCartridgeVisual(
  raw: Partial<CartridgeVisual> | undefined,
  id = "custom",
  legacy?: { color?: string; symbol?: string; fx?: string; shape?: string },
): CartridgeVisual {
  const preset = STYLE_PRESETS[id] || STYLE_PRESETS.custom;
  const oldShape: Record<string, string> = {
    standard: "spitzer",
    hollow: "hollowPoint",
    heavy: "explosive",
    needle: "needle",
    carbine: "spitzer",
    short: "roundNose",
    capsule: "capsule",
    long: "longSpitzer",
  };
  const familyAlias: Record<string, string> = {
    standard: "rifleStandard",
    hollow: "revolverMagnum",
    heavy: "heavyRifle",
    needle: "rifleStandard",
    carbine: "rifleCarbine",
    short: "revolverShort",
    capsule: "straightWall",
    long: "rifleLong",
  };
  return {
    ...preset,
    ...raw,
    preset: String(raw?.preset || preset.preset),
    family: GEOMETRY[raw?.family || ""]
      ? String(raw?.family)
      : familyAlias[legacy?.shape || ""] || preset.family,
    projectile: PROJECTILES.some(([v]) => v === raw?.projectile)
      ? String(raw?.projectile)
      : oldShape[legacy?.shape || ""] || preset.projectile,
    color: safeColor(String(raw?.color || legacy?.color || preset.color)),
    symbol: String(raw?.symbol ?? legacy?.symbol ?? preset.symbol).slice(0, 3),
    fx: String(raw?.fx || legacy?.fx || preset.fx),
  };
}

function projectilePath(profile: string, g: Geometry) {
  const cx = 40,
    w = g.bulletWidth,
    base = g.bulletBase,
    top = g.bulletTop,
    l = cx - w / 2,
    r = cx + w / 2;
  switch (profile) {
    case "roundNose":
      return `M${l} ${base} L${l} ${top + 18} Q${l + 2} ${top + 2} ${cx} ${top} Q${r - 2} ${top + 2} ${r} ${top + 18} L${r} ${base} Z`;
    case "flatNose":
      return `M${l} ${base} L${l + 2} ${top + 8} Q${l + 4} ${top + 3} ${l + 9} ${top + 3} H${r - 9} Q${r - 4} ${top + 3} ${r - 2} ${top + 8} L${r} ${base} Z`;
    case "hollowPoint":
      return `M${l} ${base} L${l + 2} ${top + 15} L${l + 8} ${top + 5} L${cx - 4} ${top + 11} L${cx} ${top + 3} L${cx + 4} ${top + 11} L${r - 8} ${top + 5} L${r - 2} ${top + 15} L${r} ${base} Z`;
    case "wadcutter":
      return `M${l} ${base} L${l + 2} ${top + 4} H${r - 2} L${r} ${base} Z`;
    case "softPoint":
      return `M${l} ${base} L${l + 1} ${top + 17} Q${l + 4} ${top + 3} ${cx} ${top + 1} Q${r - 4} ${top + 3} ${r - 1} ${top + 17} L${r} ${base} Z`;
    case "longSpitzer":
      return `M${l} ${base} Q${l + 2} ${top + 22} ${cx} ${top} Q${r - 2} ${top + 22} ${r} ${base} Z`;
    case "needle":
      return `M${cx - w * 0.33} ${base} L${cx - w * 0.18} ${top + 17} L${cx} ${top} L${cx + w * 0.18} ${top + 17} L${cx + w * 0.33} ${base} Z`;
    case "explosive":
      return `M${l} ${base} L${l - 2} ${top + 23} L${l + 6} ${top + 9} L${cx - 7} ${top + 4} H${cx + 7} L${r - 6} ${top + 9} L${r + 2} ${top + 23} L${r} ${base} Z`;
    case "segmented":
      return `M${l} ${base} L${l + 1} ${top + 22} L${l + 7} ${top + 14} L${l + 5} ${top + 6} L${cx} ${top} L${r - 5} ${top + 6} L${r - 7} ${top + 14} L${r - 1} ${top + 22} L${r} ${base} Z`;
    case "crystal":
      return `M${l} ${base} L${l + 5} ${top + 20} L${cx} ${top} L${r - 5} ${top + 20} L${r} ${base} L${cx} ${base - 7} Z`;
    case "capsule":
      return `M${l} ${base} V${top + 15} Q${l} ${top} ${cx} ${top} Q${r} ${top} ${r} ${top + 15} V${base} Z`;
    default:
      return `M${l} ${base} L${cx} ${top} L${r} ${base} Z`;
  }
}

function Marking({ visual, y }: { visual: CartridgeVisual; y: number }) {
  const glyphs: Record<string, string> = {
    dot: "•",
    letter: visual.symbol || "A",
    chevron: "▲",
    star: "✦",
    moon: "☾",
    skull: "☣",
    rune: "ᚱ",
  };
  const glyph = glyphs[visual.marking];
  return glyph ? (
    <text
      x="40"
      y={Math.min(151, y + 52)}
      textAnchor="middle"
      fill="rgba(15,12,9,.72)"
      fontSize="10"
      fontFamily="Georgia,serif"
      fontWeight="700"
    >
      {glyph}
    </text>
  ) : null;
}

function Band({ visual, y }: { visual: CartridgeVisual; y: number }) {
  const at = Math.min(146, y + 22);
  if (visual.band === "none") return null;
  if (visual.band === "single")
    return (
      <rect
        x="22"
        y={at}
        width="36"
        height="6"
        rx="2"
        fill={visual.color}
        opacity=".86"
      />
    );
  if (visual.band === "double")
    return (
      <>
        <rect
          x="22"
          y={at - 3}
          width="36"
          height="4"
          rx="1"
          fill={visual.color}
        />
        <rect
          x="22"
          y={at + 5}
          width="36"
          height="4"
          rx="1"
          fill={visual.color}
        />
      </>
    );
  if (visual.band === "toxic")
    return (
      <>
        <rect x="20" y={at} width="40" height="8" rx="3" fill="#62d451" />
        <circle cx="28" cy={at + 4} r="2" fill="#d9ffb8" />
        <circle cx="50" cy={at + 4} r="1.6" fill="#d9ffb8" />
      </>
    );
  if (visual.band === "runes")
    return (
      <>
        <rect
          x="20"
          y={at - 1}
          width="40"
          height="10"
          rx="3"
          fill={shade(visual.color, -0.45)}
        />
        <text
          x="40"
          y={at + 7}
          textAnchor="middle"
          fontSize="8"
          fill={shade(visual.color, 0.55)}
        >
          ᚱ ✧
        </text>
      </>
    );
  return (
    <g opacity=".9">
      <path d={`M20 ${at}h40v8H20z`} fill="#d54b25" />
      <path
        d={`M22 ${at + 8}l8-8h8l-8 8h8l8-8h8l-8 8h10`}
        stroke="#1a1714"
        strokeWidth="4"
      />
    </g>
  );
}

export function Cartridge({
  ammo,
  small = false,
  selected = false,
  density = "all",
  silhouette = false,
  className = "",
}: {
  ammo?: CartridgeAmmo;
  small?: boolean;
  selected?: boolean;
  density?: AnimationDensity;
  silhouette?: boolean;
  className?: string;
}) {
  const rawId = useId().replace(/:/g, "");
  if (!ammo)
    return (
      <span
        className={`cartridge ghost ${small ? "small" : ""}`}
        aria-hidden="true"
      />
    );
  const visual = normalizeCartridgeVisual(ammo.visual, ammo.id);
  const g = GEOMETRY[visual.family] || GEOMETRY.rifleStandard;
  const path = projectilePath(visual.projectile, g);
  const casePal = silhouette
    ? ["#050505", "#111", "#080808", "#000"]
    : palette(visual.caseMaterial);
  const tinted = ["crystal", "toxicGlass"].includes(visual.projectileMaterial)
    ? visual.color
    : undefined;
  const projectilePal = silhouette
    ? ["#050505", "#111", "#080808", "#000"]
    : palette(visual.projectileMaterial, tinted);
  const caseId = `case-${rawId}`,
    projectileId = `projectile-${rawId}`,
    clipId = `clip-${rawId}`;
  const [rx, ry, rw, rh, rr] = g.rim;
  const [px, py, pr] = g.primer;
  const tipHeight = Math.max(11, (g.bulletBase - g.bulletTop) * 0.28);
  return (
    <span
      className={`cartridge round-icon family-${visual.family} projectile-${visual.projectile} effect-${visual.fx} fx-${visual.fx} placement-${visual.fxPlacement} intensity-${visual.intensity} ${small ? "small" : ""} ${selected ? "selected" : ""} density-${density} ${silhouette ? "silhouette" : ""} ${className}`}
      style={
        {
          "--ammo": visual.color,
          "--ammo-color": visual.color,
        } as React.CSSProperties
      }
      title={ammo.name}
      aria-label={ammo.name}
    >
      <span className="cartridge-fx round-fx" />
      <svg viewBox="0 0 80 180" aria-hidden="true">
        <defs>
          <linearGradient id={caseId} x1="0" x2="1">
            <stop stopColor={casePal[0]} />
            <stop offset=".27" stopColor={casePal[1]} />
            <stop offset=".55" stopColor={casePal[2]} />
            <stop offset="1" stopColor={casePal[3]} />
          </linearGradient>
          <linearGradient id={projectileId} x1="0" x2="1">
            <stop stopColor={projectilePal[0]} />
            <stop offset=".28" stopColor={projectilePal[1]} />
            <stop offset=".58" stopColor={projectilePal[2]} />
            <stop offset="1" stopColor={projectilePal[3]} />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        </defs>
        <g className="case-svg">
          <path
            d={g.casePath}
            fill={`url(#${caseId})`}
            stroke={shade(casePal[2], -0.42)}
            strokeWidth="1.5"
          />
          <path
            d="M27 82V151"
            stroke="rgba(255,255,255,.13)"
            strokeWidth="2"
            opacity=".6"
          />
          <rect
            x={rx}
            y={ry}
            width={rw}
            height={rh}
            rx={rr}
            fill={`url(#${caseId})`}
            stroke={shade(casePal[2], -0.48)}
            strokeWidth="1.2"
          />
          <circle
            cx={px}
            cy={py}
            r={pr}
            fill={shade(casePal[2], -0.58)}
            stroke={casePal[1]}
            strokeWidth="1"
          />
          {!silhouette && (
            <>
              <Band visual={visual} y={g.bulletBase} />
              <Marking visual={visual} y={g.bulletBase} />
            </>
          )}
        </g>
        <g className="projectile-svg">
          <path
            d={path}
            fill={`url(#${projectileId})`}
            stroke={shade(projectilePal[2], -0.42)}
            strokeWidth="1.5"
          />
          {!silhouette && visual.tipStyle !== "none" && (
            <rect
              x="0"
              y={g.bulletTop - 1}
              width="80"
              height={tipHeight}
              fill={
                visual.tipStyle === "core"
                  ? shade(visual.color, -0.25)
                  : visual.color
              }
              opacity={visual.tipStyle === "glass" ? ".58" : "1"}
              clipPath={`url(#${clipId})`}
            />
          )}
          {visual.projectile === "hollowPoint" && (
            <path
              d={`M34 ${g.bulletTop + 5} L40 ${g.bulletTop + 16} L46 ${g.bulletTop + 5} Q40 ${g.bulletTop + 9} 34 ${g.bulletTop + 5}Z`}
              fill="#090b0c"
              opacity=".95"
            />
          )}
          {visual.projectile === "capsule" && !silhouette && (
            <>
              <path d={path} fill={visual.color} opacity=".38" />
              <circle
                cx="34"
                cy={g.bulletTop + 26}
                r="3"
                fill="#ddffc5"
                opacity=".72"
              />
              <circle
                cx="47"
                cy={g.bulletTop + 39}
                r="2"
                fill="#ddffc5"
                opacity=".62"
              />
            </>
          )}
          <path
            d={`M${40 - g.bulletWidth * 0.22} ${g.bulletTop + 8} Q40 ${g.bulletTop + 2} ${40 + g.bulletWidth * 0.12} ${g.bulletTop + 10}`}
            fill="none"
            stroke="rgba(255,255,255,.24)"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </span>
  );
}
