import { type CSSProperties, useState } from "react";
import { findAmmo } from "../lib/ledger";
import type { LedgerState, Plan } from "../lib/types";
import { Cartridge } from "./Cartridge";
import "./Magazine.css";

type MagazineProps = {
  state: LedgerState;
  slots: Plan;
  /** Slot that fires next (Tactical Selection), or -1. */
  selectedSlot: number;
  onSelect?: (ammoId: string) => void;
  /** Plan mode (reload configurator): tapping a round takes it out. */
  onRemove?: (index: number) => void;
};

function slotLabel(name: string | undefined, kind: string, i: number, removing: boolean) {
  if (!name) return `Empty ${kind} ${i + 1}`;
  return removing ? `Remove ${name} from ${kind} ${i + 1}` : `${name}, ${kind} ${i + 1}`;
}

/** Lever-action tube: rounds stand upright in a rack ending at the spring. */
export function TubeMagazine({ state, slots, selectedSlot, onSelect, onRemove }: MagazineProps) {
  return (
    <div className={`tube-mag ${onRemove ? "plan" : ""}`} role="group" aria-label="Loaded cartridges">
      <div className="tube-rack">
        {slots.map((id, i) => {
          const ammo = findAmmo(state, id);
          const selected = !onRemove && !!ammo && ammo.id === state.selectedAmmoId;
          return (
            <button
              key={i}
              className={`tube-slot ${ammo ? "loaded" : "empty"} ${selected ? "selected" : ""} ${i === selectedSlot ? "next" : ""}`}
              style={{ "--ammo": ammo?.color } as CSSProperties}
              disabled={!ammo}
              aria-pressed={ammo && !onRemove ? selected : undefined}
              aria-label={slotLabel(ammo?.name, "slot", i, !!onRemove)}
              onClick={() => ammo && (onRemove ? onRemove(i) : onSelect?.(ammo.id))}
            >
              <Cartridge ammo={ammo} small selected={selected} density={state.theme.density} />
              <i>{i + 1}</i>
              {onRemove && ammo && <b className="remove-mark" aria-hidden="true">×</b>}
            </button>
          );
        })}
      </div>
      <div className="tube-spring" aria-hidden="true">
        <span />
      </div>
    </div>
  );
}

/** Rotate by the shortest way round so the cylinder never spins backwards a full turn. */
function nearestAngle(current: number, target: number) {
  const delta = ((((target - current) % 360) + 540) % 360) - 180;
  return current + delta;
}

/**
 * Revolver cylinder seen from the rear. It turns to bring the chosen chamber
 * to the top (under the hammer); the rounds counter-rotate to stay upright.
 */
export function CylinderMagazine({
  state,
  slots,
  selectedSlot,
  onSelect,
  onRemove,
  firing = false,
}: MagazineProps & { firing?: boolean }) {
  const step = 360 / slots.length;
  const target = -Math.max(0, selectedSlot) * step;
  const [prevTarget, setPrevTarget] = useState(target);
  const [angle, setAngle] = useState(target);
  if (target !== prevTarget) {
    setPrevTarget(target);
    setAngle(nearestAngle(angle, target));
  }
  return (
    <div className={`cylinder-mag ${firing ? "firing" : ""} ${onRemove ? "plan" : ""}`} role="group" aria-label="Revolver cylinder">
      <div className="cylinder-frame" aria-hidden="true">
        <span className="hammer-notch" />
      </div>
      <div className="cylinder-rotor" style={{ "--rot": `${angle}deg` } as CSSProperties}>
        {slots.map((id, i) => {
          const ammo = findAmmo(state, id);
          const selected = !onRemove && i === selectedSlot;
          return (
            <button
              key={i}
              className={`chamber ${ammo ? "loaded" : "empty"} ${selected ? "selected" : ""}`}
              style={{ "--a": `${i * step}deg`, "--ammo": ammo?.color } as CSSProperties}
              disabled={!ammo}
              aria-pressed={ammo && !onRemove ? ammo.id === state.selectedAmmoId : undefined}
              aria-label={slotLabel(ammo?.name, "chamber", i, !!onRemove)}
              onClick={() => ammo && (onRemove ? onRemove(i) : onSelect?.(ammo.id))}
            >
              <span className="chamber-upright">
                <Cartridge ammo={ammo} small selected={selected} density={state.theme.density} />
              </span>
            </button>
          );
        })}
        <span className="cylinder-pin">AC</span>
      </div>
    </div>
  );
}
