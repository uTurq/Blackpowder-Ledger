import type { CSSProperties } from "react";
import type { Ammo, Weapon } from "../lib/types";
import { capitalize } from "../lib/util";
import { Cartridge, type AnimationDensity } from "./Cartridge";
import "./FireControls.css";
import { Ticker } from "./Ticker";
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

/** The trigger itself: a brass-bezelled button that kicks when it fires. */
function FireButton({
  fire,
  firing,
  disabled,
  caption,
  big = false,
}: {
  fire: () => void;
  firing: boolean;
  disabled: boolean;
  caption: string;
  big?: boolean;
}) {
  return (
    <button
      className={`fire-button ${big ? "big" : ""} ${firing ? "firing" : ""}`}
      onClick={fire}
      disabled={disabled}
      aria-label={`Fire. ${caption}`}
    >
      <span className="fire-bezel" aria-hidden="true" />
      <span className="fire-face" aria-hidden="true">
        <strong>{firing ? "Bang" : "Fire"}</strong>
        <small>{caption}</small>
      </span>
    </button>
  );
}

function elementCaption(weapon: Weapon) {
  return weapon.element !== "off" ? `+1d6 ${capitalize(weapon.element)}` : "";
}

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
    <div className="dock combat-dock panel">
      <button className="dock-side" onClick={undo} disabled={!canUndo}>
        <Icon name="undo" />
        <span>Undo</span>
      </button>
      <button
        className="dock-round"
        onClick={cycleAmmo}
        disabled={!selectedAmmo}
        style={{ "--ammo": selectedAmmo?.color } as CSSProperties}
        aria-label={`Next round: ${selectedAmmo?.name || "none"}. Tap to cycle loaded types.`}
      >
        <Cartridge ammo={selectedAmmo} small selected density={density} />
        <span>
          <small>Next round · tap to switch</small>
          <b key={selectedAmmo?.id}>{selectedAmmo?.name || "No cartridge"}</b>
          <em>{selectedLoaded} loaded</em>
        </span>
      </button>
      <FireButton
        big
        fire={fire}
        firing={firing}
        disabled={!selectedLoaded || firing}
        caption={firing ? "Cycling" : elementCaption(weapon) || "Ready"}
      />
      <button
        className="dock-mag"
        onClick={openReload}
        aria-label={`Magazine ${loaded} of ${weapon.capacity}. Open reload.`}
      >
        <small>Magazine</small>
        <b>
          <Ticker value={loaded} />
          <em>/{weapon.capacity}</em>
        </b>
        <span className="mag-pips" aria-hidden="true">
          {weapon.slots.map((id, i) => (
            <i key={i} className={id ? "full" : ""} />
          ))}
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
export function ArmoryFireTab({ weapon, selectedAmmo, selectedLoaded, loaded, firing, density, fire }: FireProps) {
  return (
    <div className="dock armory-fire-tab panel" style={{ "--ammo": selectedAmmo?.color } as CSSProperties}>
      <div className="fire-tab-round">
        <Cartridge ammo={selectedAmmo} small selected density={density} />
        <span>
          <small>Next shot</small>
          <b key={selectedAmmo?.id}>{selectedAmmo?.name || "No cartridge"}</b>
        </span>
      </div>
      <FireButton
        fire={fire}
        firing={firing}
        disabled={!selectedLoaded || firing}
        caption={selectedLoaded ? `${selectedLoaded} ready` : "Empty"}
      />
      <div className="fire-tab-status">
        <small>{weapon.shortName}</small>
        <b>
          <Ticker value={loaded} />
          <em>/{weapon.capacity}</em>
        </b>
        <span>{elementCaption(weapon) || "Kinetic"}</span>
      </div>
    </div>
  );
}
