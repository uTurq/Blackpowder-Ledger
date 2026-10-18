import { findAmmo } from "../lib/ledger";
import type { LedgerState, Plan, Weapon } from "../lib/types";
import { Cartridge } from "./Cartridge";
import { CylinderMagazine } from "./Magazine";
import "./Overlays.css";
import { WeaponArt } from "./WeaponArt";

export type LoadingSequence = {
  mode: "seat" | "extract";
  progress: number;
  /** Rounds in the order they are seated or withdrawn. */
  rounds: string[];
  /** Slot each of those rounds goes into or comes out of. */
  indices: number[];
  /** Slot contents before the sequence (seat) or being emptied (extract). */
  before: Plan;
};

/** What each slot holds at this point in the sequence. */
function slotsAt(seq: LoadingSequence): Plan {
  return seq.before.map((id, i) => {
    const step = seq.indices.indexOf(i);
    if (step < 0) return id;
    if (seq.mode === "seat") return step < seq.progress ? seq.rounds[step] : null;
    return step < seq.progress ? null : id;
  });
}

export function LoadingOverlay({
  state,
  weapon,
  sequence,
  skip,
}: {
  state: LedgerState;
  weapon: Weapon;
  sequence: LoadingSequence;
  skip: () => void;
}) {
  const { mode, progress, rounds } = sequence;
  const total = Math.max(1, rounds.length);
  const current = findAmmo(state, rounds[Math.min(progress, rounds.length - 1)]);
  const seating = mode === "seat";
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className={`loading-card panel ${weapon.type} ${mode}`}>
        <span className="eyebrow">Mechanical sequence</span>
        <h2 className="display">{seating ? "Seating cartridges…" : "Extracting cartridges…"}</h2>
        <div className="loader-stage">
          {weapon.type === "lever" ? (
            <div className="gate-view">
              <WeaponArt weapon={weapon} className="receiver-zoom" />
              <span className="feeding-round" key={`${mode}-${progress}`}>
                <Cartridge ammo={current} density="all" />
              </span>
            </div>
          ) : (
            <div className="swing-view">
              <CylinderMagazine state={state} slots={slotsAt(sequence)} selectedSlot={-1} />
              <span className="ejector-rod" />
            </div>
          )}
          <span className="loader-caption">
            {weapon.type === "lever"
              ? seating
                ? "Nose forward through the loading gate"
                : "Gate released · cartridge withdrawn"
              : seating
                ? "Cylinder swung out · seated chamber by chamber"
                : "Ejector rod pressed · chambers cleared"}
          </span>
        </div>
        <div className="load-progress">
          <div className="load-bar">
            <span style={{ width: `${(progress / total) * 100}%` }} />
          </div>
          <p className="num">
            {progress} / {total}
          </p>
        </div>
        <button className="skip-btn" onClick={skip} autoFocus>
          Skip animation
        </button>
      </div>
    </div>
  );
}
