import type { CSSProperties } from "react";
import { ELEMENTS } from "../lib/defaults";
import { countIn, findAmmo, loadedCount } from "../lib/ledger";
import type { Passive } from "../lib/store";
import type { LedgerState, Weapon } from "../lib/types";
import { capitalize } from "../lib/util";
import { Cartridge } from "./Cartridge";
import { AppButton, Icon } from "./ui";
import { WeaponArt } from "./WeaponArt";

type ArmoryProps = {
  state: LedgerState;
  weapon: Weapon;
  firing: boolean;
  shotFx: string;
  accent: string;
  passive: Passive;
  chooseWeapon: (id: string) => void;
  chooseAmmo: (id: string) => void;
  openReload: (plan?: (string | null)[]) => void;
  unloadAll: () => void;
  savePreset: () => void;
  nextTurn: () => void;
  rollAttack: () => void;
  adjustReserve: (id: string, delta: number) => void;
};

export function Armory(props: ArmoryProps) {
  return (
    <div className="armory-layout">
      <WeaponPanel {...props} />
      <SidePanel {...props} />
    </div>
  );
}

function WeaponPanel({
  state,
  weapon,
  firing,
  shotFx,
  accent,
  passive,
  chooseWeapon,
  chooseAmmo,
  openReload,
  unloadAll,
  savePreset,
}: ArmoryProps) {
  const loaded = loadedCount(weapon.slots);
  const selectedAmmo = findAmmo(state, state.selectedAmmoId);
  const selectedSlot = state.selectedAmmoId
    ? weapon.slots.indexOf(state.selectedAmmoId)
    : -1;
  const density = state.theme.density;
  const setElement = (recipe: (w: Weapon) => void) =>
    passive((n) => {
      const w = n.weapons.find((x) => x.id === weapon.id);
      if (w) recipe(w);
    });

  return (
    <section className="panel weapon-panel glass">
      <div className="panel-head">
        <div>
          <span className="eyebrow">TACTICAL WEAPONS DESK</span>
          <h1>
            {state.combatMode ? "Ready to engage" : "Choose the shot, not the slot."}
          </h1>
          <p>
            Tactical Selection keeps your chosen cartridge armed until that
            type runs dry.
          </p>
        </div>
        <div className="weapon-tabs" role="group" aria-label="Active weapon">
          {state.weapons.map((w) => (
            <button
              key={w.id}
              className={w.id === weapon.id ? "active" : ""}
              aria-pressed={w.id === weapon.id}
              onClick={() => chooseWeapon(w.id)}
            >
              <span aria-hidden="true">{w.type === "revolver" ? "◉" : "⌁"}</span>
              {w.shortName}
              <small>
                {loadedCount(w.slots)}/{w.capacity}
              </small>
            </button>
          ))}
        </div>
      </div>
      <div className="weapon-stage">
        <div className="stage-light" />
        <div className="weapon-label">
          <span>{weapon.type === "revolver" ? "SECONDARY" : "PRIMARY"}</span>
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
              {weapon.type === "revolver" ? "CYLINDER LEDGER" : "PREPARED AMMUNITION"}
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
              const ammo = findAmmo(state, id);
              const selected = !!ammo && ammo.id === state.selectedAmmoId;
              return (
                <button
                  key={i}
                  disabled={!ammo}
                  className={`${ammo ? "loaded" : "empty"} ${selected ? "selected" : ""}`}
                  style={{ "--ammo": ammo?.color } as CSSProperties}
                  onClick={() => ammo && chooseAmmo(ammo.id)}
                  aria-pressed={ammo ? selected : undefined}
                  aria-label={ammo ? `${ammo.name}, slot ${i + 1}` : `Empty slot ${i + 1}`}
                >
                  <Cartridge ammo={ammo} small selected={selected} density={density} />
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
              const ammo = findAmmo(state, id);
              const selected = i === selectedSlot;
              return (
                <button
                  key={i}
                  disabled={!ammo}
                  className={`${ammo ? "loaded" : "empty"} pos-${i} ${selected ? "selected" : ""}`}
                  style={{ "--ammo": ammo?.color } as CSSProperties}
                  onClick={() => ammo && chooseAmmo(ammo.id)}
                  aria-pressed={ammo ? ammo.id === state.selectedAmmoId : undefined}
                  aria-label={
                    ammo ? `${ammo.name}, chamber ${i + 1}` : `Empty chamber ${i + 1}`
                  }
                >
                  <Cartridge ammo={ammo} small selected={selected} density={density} />
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
                className={state.selectedAmmoId === a.id ? "active" : ""}
                aria-pressed={state.selectedAmmoId === a.id}
                style={{ "--ammo": a.color } as CSSProperties}
                onClick={() => chooseAmmo(a.id)}
              >
                <Cartridge
                  ammo={a}
                  small
                  selected={state.selectedAmmoId === a.id}
                  density={density}
                />
                <span>
                  <b>{a.name}</b>
                  <small>{a.effect}</small>
                </span>
                <em>×{countIn(weapon.slots, a.id)}</em>
              </button>
            ))}
        </div>
      </div>

      {!state.combatMode && (
        <>
          <div
            className="selected-card"
            style={{ "--ammo": selectedAmmo?.color || accent } as CSSProperties}
          >
            <Cartridge ammo={selectedAmmo} selected density={density} />
            <div>
              <span>NEXT SHOT</span>
              <h2>{selectedAmmo?.name || "No round selected"}</h2>
              <p>
                {selectedAmmo?.effect ||
                  "Load the weapon or select a prepared cartridge."}
              </p>
              {weapon.element !== "off" && state.elementalUnlocked && (
                <small>Elemental Chamber · +1d6 {weapon.element}</small>
              )}
            </div>
          </div>
          {state.elementalUnlocked && (
            <div className={`elemental-armory-control element-${weapon.element}`}>
              <label className="element-switch">
                <input
                  type="checkbox"
                  checked={weapon.element !== "off"}
                  onChange={(e) =>
                    setElement((w) => {
                      if (e.target.checked) w.element = w.lastElement || "fire";
                      else {
                        if (w.element !== "off") w.lastElement = w.element;
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
                      setElement((w) => {
                        w.element = e.target.value;
                        w.lastElement = e.target.value;
                      })
                    }
                  >
                    {ELEMENTS.filter((x) => x !== "off").map((x) => (
                      <option key={x} value={x}>
                        {capitalize(x)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          <div className="weapon-actions">
            <AppButton className="primary" onClick={() => openReload()}>
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
            <AppButton onClick={savePreset} disabled={!loaded}>
              Save Preset
            </AppButton>
          </div>
        </>
      )}
    </section>
  );
}

function SidePanel({
  state,
  weapon,
  passive,
  nextTurn,
  rollAttack,
  adjustReserve,
}: ArmoryProps) {
  const loaded = loadedCount(weapon.slots);
  const integrity = Math.round((loaded / weapon.capacity) * 100);
  return (
    <aside className={`panel side-panel glass ${state.combatMode ? "combat-side" : ""}`}>
      <div className="panel-head compact">
        <div>
          <span className="eyebrow">
            {state.combatMode ? "COMBAT TELEMETRY" : "AMMUNITION CASE"}
          </span>
          <h2>{state.combatMode ? `Turn ${state.turn}` : "Reserve inventory"}</h2>
        </div>
        {state.combatMode ? (
          <AppButton className="turn-btn" onClick={nextTurn}>
            Next Turn <Icon name="turn" />
          </AppButton>
        ) : (
          <button
            className={`inventory-edit ${state.inventoryEdit ? "active" : ""}`}
            aria-pressed={state.inventoryEdit}
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
              <span style={{ width: `${integrity}%` }} />
            </div>
            <small>Magazine integrity</small>
            <b>{integrity}%</b>
          </div>
          {state.roller.enabled && (
            <div className="roll-card">
              <span>ATTACK ROLLER</span>
              <strong aria-live="polite">
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
                <article key={r.id} style={{ "--reminder": r.color } as CSSProperties}>
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
                        n.reminders = n.reminders.filter((x) => x.id !== r.id);
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
            const inWeapons = state.weapons.reduce((n, w) => n + countIn(w.slots, a.id), 0);
            return (
              <article
                className="inventory-card"
                key={a.id}
                style={{ "--ammo": a.color } as CSSProperties}
              >
                <Cartridge ammo={a} density={state.theme.density} />
                <div>
                  <strong>{a.name}</strong>
                  <p>{a.effect}</p>
                  <span>
                    <b>{a.reserve}</b> reserve · <b>{inWeapons}</b> loaded
                  </span>
                </div>
                {state.inventoryEdit ? (
                  <div className="stepper">
                    <button
                      disabled={!a.reserve}
                      aria-label={`Remove one ${a.name}`}
                      onClick={() => adjustReserve(a.id, -1)}
                    >
                      −
                    </button>
                    <b>{a.reserve}</b>
                    <button
                      aria-label={`Add one ${a.name}`}
                      onClick={() => adjustReserve(a.id, 1)}
                    >
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
  );
}
