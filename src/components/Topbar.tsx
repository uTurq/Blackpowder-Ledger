import { VIEWS } from "../lib/defaults";
import { findAmmo, loadedCount } from "../lib/ledger";
import type { LedgerState, View, Weapon } from "../lib/types";
import { capitalize, money } from "../lib/util";
import { Icon } from "./ui";

export function Topbar({
  state,
  weapon,
  canUndo,
  undo,
  rename,
  editGold,
  toggleCombat,
}: {
  state: LedgerState;
  weapon: Weapon;
  canUndo: boolean;
  undo: () => void;
  rename: (name: string) => void;
  editGold: () => void;
  toggleCombat: () => void;
}) {
  const selectedAmmo = findAmmo(state, state.selectedAmmoId);
  const totalLoaded = state.weapons.reduce((n, w) => n + loadedCount(w.slots), 0);
  const totalReserve = state.ammo.reduce((n, a) => n + a.reserve, 0);
  return (
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
            onChange={(e) => rename(e.target.value)}
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
                {loadedCount(weapon.slots)}
                <small> / {weapon.capacity}</small>
              </b>
            </div>
            <div>
              <span>NEXT ROUND</span>
              <b style={{ color: selectedAmmo?.color }}>{selectedAmmo?.name || "—"}</b>
            </div>
          </>
        ) : (
          <>
            <div className="gold-stat-wrap">
              <button className="gold-stat-button" onClick={editGold}>
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
          disabled={!canUndo}
          aria-label="Undo last action"
        >
          <Icon name="undo" />
          <span>Undo</span>
        </button>
        <button
          className={`combat-switch ${state.combatMode ? "active" : ""}`}
          aria-pressed={state.combatMode}
          onClick={toggleCombat}
        >
          <Icon name="combat" />
          {state.combatMode ? "Exit Combat" : "Combat Mode"}
        </button>
      </div>
    </header>
  );
}

export function MainNav({ view, go }: { view: View; go: (v: View) => void }) {
  return (
    <nav className="main-nav glass" aria-label="Primary navigation">
      {VIEWS.map((v) => (
        <button
          key={v}
          className={view === v ? "active" : ""}
          aria-current={view === v ? "page" : undefined}
          onClick={() => go(v)}
        >
          <Icon name={v} />
          <span>{v === "presets" ? "Loadouts" : capitalize(v)}</span>
        </button>
      ))}
    </nav>
  );
}
