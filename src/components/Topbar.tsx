import { VIEWS } from "../lib/defaults";
import { findAmmo, loadedCount } from "../lib/ledger";
import type { LedgerState, View, Weapon } from "../lib/types";
import { capitalize } from "../lib/util";
import { Ticker } from "./Ticker";
import { AppButton, Icon } from "./ui";

export function Topbar({
  state,
  weapon,
  canUndo,
  undo,
  rename,
  editGold,
  toggleCombat,
  openHistory,
}: {
  state: LedgerState;
  weapon: Weapon;
  canUndo: boolean;
  undo: () => void;
  rename: (name: string) => void;
  editGold: () => void;
  toggleCombat: () => void;
  openHistory: () => void;
}) {
  const selectedAmmo = findAmmo(state, state.selectedAmmoId);
  const totalLoaded = state.weapons.reduce((n, w) => n + loadedCount(w.slots), 0);
  const totalReserve = state.ammo.reduce((n, a) => n + a.reserve, 0);
  return (
    <header className="topbar panel">
      <div className="brand">
        <div className="medallion" aria-hidden="true">
          BL
        </div>
        <div className="brand-text">
          <span className="eyebrow">Blackpowder Ledger</span>
          <input
            className="brand-name"
            aria-label="Character or armory name"
            value={state.characterName}
            onChange={(e) => rename(e.target.value)}
          />
        </div>
      </div>
      <div className="top-stats">
        {state.combatMode ? (
          <>
            <div className="stat">
              <span>Weapon</span>
              <b>{weapon.shortName}</b>
            </div>
            <div className="stat">
              <span>Loaded</span>
              <b>
                <Ticker value={loadedCount(weapon.slots)} />
                <small> / {weapon.capacity}</small>
              </b>
            </div>
            <div className="stat">
              <span>Next round</span>
              <b style={{ color: selectedAmmo?.color }}>{selectedAmmo?.name || "—"}</b>
            </div>
          </>
        ) : (
          <>
            <button className="stat gold-stat" onClick={editGold} aria-label={`Gold: ${state.gold} gp. Edit`}>
              <span>Gold</span>
              <b>
                <Ticker value={state.gold} />
                <small> gp</small>
              </b>
            </button>
            <div className="stat">
              <span>Reserve</span>
              <b>
                <Ticker value={totalReserve} />
              </b>
            </div>
            <div className="stat">
              <span>Loaded</span>
              <b>
                <Ticker value={totalLoaded} />
              </b>
            </div>
          </>
        )}
      </div>
      <div className="top-actions">
        {/* Phones only: the bottom activity bar gives way to the fire controls there. */}
        <AppButton className="history-top" onClick={openHistory} aria-label="Open activity history">
          <Icon name="history" />
        </AppButton>
        <AppButton className="undo-top" onClick={undo} disabled={!canUndo} aria-label="Undo last action">
          <Icon name="undo" />
          <span>Undo</span>
        </AppButton>
        <AppButton
          className="combat-toggle"
          aria-pressed={state.combatMode}
          aria-label={state.combatMode ? "Exit Combat Mode" : "Enter Combat Mode"}
          onClick={toggleCombat}
        >
          <Icon name="combat" />
          <span>{state.combatMode ? "Exit Combat" : "Combat Mode"}</span>
        </AppButton>
      </div>
    </header>
  );
}

export function MainNav({ view, go }: { view: View; go: (v: View) => void }) {
  return (
    <nav className="main-nav panel" aria-label="Primary navigation">
      {VIEWS.map((v) => (
        <button key={v} aria-current={view === v ? "page" : undefined} onClick={() => go(v)}>
          <Icon name={v} />
          <span>{v === "presets" ? "Loadouts" : capitalize(v)}</span>
        </button>
      ))}
    </nav>
  );
}
