import type { CSSProperties } from "react";
import { ELEMENTS } from "../lib/defaults";
import { countIn, findAmmo, loadedCount } from "../lib/ledger";
import type { Passive } from "../lib/store";
import type { LedgerState, Weapon } from "../lib/types";
import { capitalize } from "../lib/util";
import "./Armory.css";
import { Cartridge } from "./Cartridge";
import { CylinderMagazine, TubeMagazine } from "./Magazine";
import { Ticker } from "./Ticker";
import { AppButton, Icon } from "./ui";
import { WeaponArt } from "./WeaponArt";

type ArmoryProps = {
  state: LedgerState;
  weapon: Weapon;
  firing: boolean;
  shotFx: string;
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
    <div className="armory">
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
  passive,
  chooseWeapon,
  chooseAmmo,
  openReload,
  unloadAll,
  savePreset,
}: ArmoryProps) {
  const loaded = loadedCount(weapon.slots);
  const selectedAmmo = findAmmo(state, state.selectedAmmoId);
  const selectedSlot = state.selectedAmmoId ? weapon.slots.indexOf(state.selectedAmmoId) : -1;
  const density = state.theme.density;
  const elemental = state.elementalUnlocked && weapon.element !== "off";
  const setElement = (recipe: (w: Weapon) => void) =>
    passive((n) => {
      const w = n.weapons.find((x) => x.id === weapon.id);
      if (w) recipe(w);
    });

  return (
    <section className="panel weapon-panel">
      <header className="panel-head">
        <div>
          <span className="eyebrow">Tactical Weapons Desk</span>
          <h1>{state.combatMode ? "Ready to engage." : "Choose the shot, not the slot."}</h1>
          <p>Tactical Selection keeps your chosen cartridge armed until that type runs dry.</p>
        </div>
        <div className="segmented well weapon-switch" role="group" aria-label="Active weapon">
          {state.weapons.map((w) => (
            <button key={w.id} aria-pressed={w.id === weapon.id} onClick={() => chooseWeapon(w.id)}>
              <span>{w.shortName}</span>
              <small>
                {loadedCount(w.slots)}/{w.capacity}
              </small>
            </button>
          ))}
        </div>
      </header>

      <div
        className={`weapon-stage ${weapon.type} ${elemental ? "infused" : ""} ${firing ? "firing" : ""} element-${weapon.element}`}
      >
        <span className="stage-flash" aria-hidden="true" />
        <div className="stage-plate">
          <span className="eyebrow">{weapon.type === "revolver" ? "Sidearm" : "Long gun"}</span>
          <strong>{weapon.name}</strong>
        </div>
        <WeaponArt weapon={weapon} firing={firing} fx={shotFx} />
        <div className="stage-status">
          <span className={loaded ? "ready" : "empty"}>
            <i />
            {loaded ? "Weapon ready" : "Empty"}
          </span>
          <span>{elemental ? `${capitalize(weapon.element)} chamber · +1d6` : "Kinetic chamber"}</span>
        </div>
      </div>

      <div className="magazine-block">
        <div className="section-title">
          <div>
            <span className="eyebrow">{weapon.type === "revolver" ? "Cylinder" : "Tubular magazine"}</span>
            <small>Tap any loaded round to arm it</small>
          </div>
          <b>
            <Ticker value={loaded} /> <em>/ {weapon.capacity}</em>
          </b>
        </div>
        {weapon.type === "lever" ? (
          <TubeMagazine state={state} slots={weapon.slots} selectedSlot={selectedSlot} onSelect={chooseAmmo} />
        ) : (
          <CylinderMagazine
            state={state}
            slots={weapon.slots}
            selectedSlot={selectedSlot}
            onSelect={chooseAmmo}
            firing={firing}
          />
        )}
        <div className="ammo-legend">
          {state.ammo
            .filter((a) => weapon.slots.includes(a.id))
            .map((a) => (
              <button
                key={a.id}
                className="legend-chip"
                aria-pressed={state.selectedAmmoId === a.id}
                style={{ "--ammo": a.color } as CSSProperties}
                onClick={() => chooseAmmo(a.id)}
              >
                <Cartridge ammo={a} small selected={state.selectedAmmoId === a.id} density={density} />
                <span>
                  <b>{a.name}</b>
                  <small>{a.effect}</small>
                </span>
                <em>×{countIn(weapon.slots, a.id)}</em>
              </button>
            ))}
          {!loaded && <p className="empty-note">Nothing chambered. Reload to seat rounds.</p>}
        </div>
      </div>

      {!state.combatMode && (
        <>
          <div className="next-shot" style={{ "--ammo": selectedAmmo?.color || "var(--accent)" } as CSSProperties}>
            <div className="next-shot-round">
              <Cartridge ammo={selectedAmmo} selected density={density} />
            </div>
            <div>
              <span className="eyebrow">Next shot</span>
              <h2 className="display">{selectedAmmo?.name || "No round selected"}</h2>
              <p>{selectedAmmo?.effect || "Load the weapon or select a prepared cartridge."}</p>
              {elemental && <small className="element-note">Elemental Chamber · +1d6 {weapon.element}</small>}
            </div>
          </div>
          {state.elementalUnlocked && (
            <div className={`element-control well element-${weapon.element}`}>
              <label className="element-toggle">
                <span className="switch">
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
                </span>
                <span>
                  <b>Elemental Shot</b>
                  <small>{weapon.element === "off" ? "Kinetic chamber" : `Armed · +1d6 ${weapon.element}`}</small>
                </span>
              </label>
              {weapon.element !== "off" && (
                <div className="element-picker" role="group" aria-label="Infusion">
                  {ELEMENTS.filter((x) => x !== "off").map((x) => (
                    <button
                      key={x}
                      className={`element-${x}`}
                      aria-pressed={weapon.element === x}
                      aria-label={capitalize(x)}
                      title={capitalize(x)}
                      onClick={() =>
                        setElement((w) => {
                          w.element = x;
                          w.lastElement = x;
                        })
                      }
                    >
                      <Icon name="flame" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="weapon-actions">
            <AppButton variant="primary" size="lg" onClick={() => openReload()}>
              <Icon name="reload" />
              Reload / Configure
            </AppButton>
            <AppButton onClick={() => openReload(weapon.lastLoad)} disabled={!weapon.lastLoad.some(Boolean)}>
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

function SidePanel({ state, weapon, passive, nextTurn, rollAttack, adjustReserve }: ArmoryProps) {
  const loaded = loadedCount(weapon.slots);
  const integrity = Math.round((loaded / weapon.capacity) * 100);
  if (state.combatMode)
    return (
      <aside className="panel side-panel combat-side">
        <header className="turn-bar">
          <div>
            <span className="eyebrow">Combat telemetry</span>
            <h2 className="display" key={state.turn}>
              Turn <span className="num">{state.turn}</span>
            </h2>
          </div>
          <AppButton variant="primary" className="turn-btn" onClick={nextTurn}>
            Next Turn <Icon name="turn" />
          </AppButton>
        </header>
        <div className="combat-telemetry">
          <div className="combat-gauge">
            <div className="gauge-track">
              <span style={{ width: `${integrity}%` }} />
            </div>
            <small>Magazine</small>
            <b>{integrity}%</b>
          </div>
          {state.roller.enabled && (
            <div className="roll-card well">
              <span className="eyebrow">Attack roll</span>
              <strong aria-live="polite" key={state.roller.last}>
                {state.roller.last ||
                  `+${state.roller.dex + state.roller.prof + state.roller.misc} to hit`}
              </strong>
              <AppButton size="sm" onClick={rollAttack}>
                <Icon name="dice" /> Roll d20
              </AppButton>
            </div>
          )}
          <div className="effect-tray">
            <div className="tray-title">
              <span className="eyebrow">Live effects</span>
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
                  {r.turns !== null && <span className="turns">{r.turns}T</span>}
                  <button
                    aria-label={`Dismiss ${r.label}`}
                    onClick={() =>
                      passive((n) => {
                        n.reminders = n.reminders.filter((x) => x.id !== r.id);
                      })
                    }
                  >
                    <Icon name="close" />
                  </button>
                </article>
              ))
            ) : (
              <p className="empty-effects">Special ammunition reminders appear here.</p>
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
      </aside>
    );

  return (
    <aside className="panel side-panel">
      <header className="panel-head compact">
        <div>
          <span className="eyebrow">Ammunition case</span>
          <h2 className="display">Reserve inventory</h2>
        </div>
        <AppButton
          size="sm"
          className="inventory-edit"
          aria-pressed={state.inventoryEdit}
          onClick={() =>
            passive((n) => {
              n.inventoryEdit = !n.inventoryEdit;
            })
          }
        >
          <Icon name={state.inventoryEdit ? "check" : "edit"} />
          {state.inventoryEdit ? "Done" : "Edit"}
        </AppButton>
      </header>
      <div className="inventory-list">
        {state.ammo.map((a) => {
          const inWeapons = state.weapons.reduce((n, w) => n + countIn(w.slots, a.id), 0);
          return (
            <article className="inventory-card" key={a.id} style={{ "--ammo": a.color } as CSSProperties}>
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
                  <button disabled={!a.reserve} aria-label={`Remove one ${a.name}`} onClick={() => adjustReserve(a.id, -1)}>
                    <Icon name="minus" />
                  </button>
                  <b>{a.reserve}</b>
                  <button aria-label={`Add one ${a.name}`} onClick={() => adjustReserve(a.id, 1)}>
                    <Icon name="plus" />
                  </button>
                </div>
              ) : (
                <b className="reserve-badge">
                  <Ticker value={a.reserve} />
                </b>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}
