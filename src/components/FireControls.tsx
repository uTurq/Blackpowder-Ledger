import type { CSSProperties } from "react";
import type { Ammo, Weapon } from "../lib/types";
import { Cartridge, type AnimationDensity } from "./Cartridge";
import { Icon } from "./ui";

type FireProps = {
  weapon: Weapon;
  selectedAmmo: Ammo | undefined;
  selectedLoaded: number;
  loaded: number;
  firing: boolean;
  density: AnimationDensity;
  fire: () => void;
};

/** Thumb-reach controls shown while Combat Mode is on. */
export function CombatDock({
  weapon,
  selectedAmmo,
  selectedLoaded,
  loaded,
  firing,
  density,
  fire,
  canUndo,
  undo,
  cycleAmmo,
  openReload,
}: FireProps & {
  canUndo: boolean;
  undo: () => void;
  cycleAmmo: () => void;
  openReload: () => void;
}) {
  return (
    <div className="combat-dock glass">
      <button className="dock-side" onClick={undo} disabled={!canUndo}>
        <Icon name="undo" />
        <span>Undo</span>
      </button>
      <button
        className="dock-round"
        onClick={cycleAmmo}
        disabled={!selectedAmmo}
        aria-label={`Next round: ${selectedAmmo?.name || "none"}. Tap to cycle loaded types.`}
      >
        <Cartridge ammo={selectedAmmo} small selected density={density} />
        <span>
          <small>NEXT ROUND</small>
          <b>{selectedAmmo?.name || "No cartridge"}</b>
          <em>{selectedLoaded} loaded</em>
        </span>
      </button>
      <button className="combat-fire" onClick={fire} disabled={!selectedLoaded || firing}>
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
      <button
        className="dock-mag"
        onClick={openReload}
        aria-label={`Magazine ${loaded} of ${weapon.capacity}. Open reload.`}
      >
        <small>MAGAZINE</small>
        <b>
          {loaded}
          <em>/{weapon.capacity}</em>
        </b>
        <span>
          <i style={{ width: `${(loaded / weapon.capacity) * 100}%` }} />
        </span>
      </button>
      <button className="dock-side" onClick={openReload}>
        <Icon name="reload" />
        <span>Reload</span>
      </button>
    </div>
  );
}

/** Floating trigger tab on the Armory view outside Combat Mode. */
export function ArmoryFireTab({
  weapon,
  selectedAmmo,
  selectedLoaded,
  loaded,
  firing,
  density,
  fire,
  accent,
}: FireProps & { accent: string }) {
  return (
    <div
      className={`armory-fire-tab glass element-${weapon.element}`}
      style={{ "--ammo": selectedAmmo?.color || accent } as CSSProperties}
    >
      <div className="armory-fire-round">
        <Cartridge ammo={selectedAmmo} small selected density={density} />
        <span>
          <small>NEXT SHOT</small>
          <b>{selectedAmmo?.name || "No cartridge"}</b>
        </span>
      </div>
      <button onClick={fire} disabled={!selectedLoaded || firing}>
        <span className="fire-tab-hammer" />
        <strong>{firing ? "BANG" : "FIRE"}</strong>
        <small>{selectedLoaded ? `${selectedLoaded} READY` : "EMPTY"}</small>
      </button>
      <div className="armory-fire-status">
        <small>{weapon.shortName.toUpperCase()}</small>
        <b>
          {loaded}/{weapon.capacity}
        </b>
        <em>
          {weapon.element === "off" ? "KINETIC" : `+1D6 ${weapon.element.toUpperCase()}`}
        </em>
      </div>
    </div>
  );
}
