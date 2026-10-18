import { findAmmo } from "../lib/ledger";
import type { LedgerState, Plan, Weapon } from "../lib/types";
import { Cartridge } from "./Cartridge";
import { WeaponArt } from "./WeaponArt";

export type LoadingSequence = {
  mode: "seat" | "extract";
  progress: number;
  /** Rounds in the order they are seated or withdrawn. */
  rounds: string[];
  /** Chamber contents to show in the open revolver cylinder. */
  chambers: Plan;
};

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
  const { mode, progress, rounds, chambers } = sequence;
  const total = Math.max(1, rounds.length);
  const current = findAmmo(state, rounds[Math.min(progress, rounds.length - 1)]);
  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="loading-card glass">
        <span className="loading-kicker">MECHANICAL SEQUENCE</span>
        <h2>{mode === "extract" ? "Extracting cartridges…" : "Seating cartridges…"}</h2>
        <div className={`loader-weapon ${weapon.type} ${mode}`} key={`${mode}-${progress}`}>
          {weapon.type === "lever" ? (
            <>
              <WeaponArt weapon={weapon} />
              <span className="loading-gate">
                <i />
              </span>
              <span className="loading-round">
                <Cartridge ammo={current} density="all" />
              </span>
              <span className="loader-caption">
                {mode === "extract"
                  ? "Gate release · cartridge withdrawn"
                  : "Nose forward · loading gate seated"}
              </span>
            </>
          ) : (
            <>
              <div className="revolver-reload-frame">
                <WeaponArt weapon={weapon} />
                <span className="swing-arm" />
              </div>
              <div className="revolver-loader-cylinder">
                <i className="ejector" />
                {chambers.map((id, i) => {
                  const ammo = findAmmo(state, id);
                  return (
                    <span className={`loader-chamber pos-${i}`} key={i}>
                      {ammo && <Cartridge ammo={ammo} small density="all" />}
                    </span>
                  );
                })}
              </div>
              <span className="loader-caption">
                {mode === "extract"
                  ? "Ejector rod pressed · chambers cleared"
                  : "Cylinder swung out · rounds seated chamber by chamber"}
              </span>
            </>
          )}
        </div>
        <div className="load-bar">
          <span style={{ width: `${(progress / total) * 100}%` }} />
        </div>
        <p>
          {progress} / {total}
        </p>
        <button onClick={skip} autoFocus>
          Skip animation
        </button>
      </div>
    </div>
  );
}
