import { type CSSProperties, useState } from "react";
import { availableFor, countIn, findAmmo, loadedCount, sanitizePlan } from "../lib/ledger";
import type { LedgerState, Plan, Weapon } from "../lib/types";
import { blankSlots } from "../lib/util";
import { Cartridge } from "./Cartridge";
import { CylinderMagazine, TubeMagazine } from "./Magazine";
import "./Overlays.css";
import { AppButton, Icon, Modal } from "./ui";

export function ReloadModal({
  state,
  weapon,
  initialPlan,
  initialSelected,
  close,
  commit,
  announce,
}: {
  state: LedgerState;
  weapon: Weapon;
  initialPlan: Plan;
  initialSelected: string;
  close: () => void;
  commit: (plan: Plan, selected: string) => void;
  announce: (text: string, kind?: string) => void;
}) {
  const [plan, setPlanRaw] = useState(() => sanitizePlan(state, weapon, initialPlan));
  const [selected, setSelected] = useState(initialSelected);
  const setPlan = (next: Plan) => setPlanRaw(sanitizePlan(state, weapon, next));
  const pool = (id: string) => availableFor(state, weapon, id);
  const count = (id: string) => countIn(plan, id);
  const possible = state.ammo.every((a) => count(a.id) <= pool(a.id));
  const selectedAmmo = findAmmo(state, selected);
  const hasStandard = !!findAmmo(state, "standard");
  const planned = loadedCount(plan);

  function add(id: string) {
    const index = plan.findIndex((x) => !x);
    if (index < 0) return announce("Magazine is full.", "error");
    if (count(id) >= pool(id)) return announce("No more of that cartridge is available.", "error");
    const next = [...plan];
    next[index] = id;
    setPlan(next);
    setSelected(id);
  }
  function remove(index: number) {
    const next = [...plan];
    next[index] = null;
    setPlan(next);
  }
  function fillWith(id: string, replace: boolean) {
    let available = pool(id) - (replace ? 0 : count(id));
    const next = replace ? blankSlots(weapon.capacity) : [...plan];
    for (let i = 0; i < next.length && available > 0; i++)
      if (!next[i]) {
        next[i] = id;
        available--;
      }
    setPlan(next);
  }

  return (
    <Modal className="reload-modal panel" labelledBy="reload-title" onDismiss={close}>
      <header className="modal-head">
        <div>
          <span className="eyebrow">Physical load configurator</span>
          <h2 id="reload-title" className="display">
            Prepare {weapon.shortName}
          </h2>
          <p>Tap a cartridge to seat one round. Tap a round in the weapon to take it out.</p>
        </div>
        <AppButton className="btn--icon" variant="ghost" onClick={close} aria-label="Close reload">
          <Icon name="close" />
        </AppButton>
      </header>
      <div className="reload-layout">
        <div className="reload-catalog">
          <div className="segmented well reload-tools">
            <button onClick={() => setPlan(weapon.slots)}>Current</button>
            <button onClick={() => setPlan(weapon.lastLoad)}>Last Load</button>
            <button onClick={() => fillWith("standard", false)} disabled={!hasStandard}>
              Fill Standard
            </button>
            <button onClick={() => setPlan(blankSlots(weapon.capacity))}>Clear</button>
          </div>
          <div className="reload-list">
            {state.ammo.map((a) => {
              const left = pool(a.id) - count(a.id);
              return (
                <article
                  key={a.id}
                  role="button"
                  tabIndex={left > 0 ? 0 : -1}
                  aria-disabled={left <= 0}
                  aria-label={`Load one ${a.name}. ${left} available.`}
                  className={`load-card ${selected === a.id ? "active" : ""} ${left <= 0 ? "depleted" : ""}`}
                  style={{ "--ammo": a.color } as CSSProperties}
                  onClick={() => {
                    setSelected(a.id);
                    if (left > 0) add(a.id);
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && left > 0) {
                      e.preventDefault();
                      add(a.id);
                    }
                  }}
                >
                  <Cartridge ammo={a} selected={selected === a.id} density={state.theme.density} />
                  <div>
                    <b>{a.name}</b>
                    <small>{a.effect}</small>
                    <span className="num">
                      {left} available · {count(a.id)} planned
                    </span>
                  </div>
                  <span className="load-action" aria-hidden="true">
                    <Icon name={left > 0 ? "plus" : "minus"} />
                    {left > 0 ? "Load" : "Empty"}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
        <div className="reload-plan">
          <div className={`plan-stage ${weapon.type}`}>
            <span className="eyebrow">{weapon.type === "lever" ? "Tubular magazine" : "Open cylinder"}</span>
            {weapon.type === "lever" ? (
              <TubeMagazine state={state} slots={plan} selectedSlot={-1} onRemove={remove} />
            ) : (
              <CylinderMagazine state={state} slots={plan} selectedSlot={-1} onRemove={remove} />
            )}
          </div>
          <div className="selected-load-type well">
            <Cartridge ammo={selectedAmmo} small density={state.theme.density} />
            <div>
              <span className="eyebrow">Selected type</span>
              <b>{selectedAmmo?.name || "—"}</b>
            </div>
            <AppButton size="sm" onClick={() => fillWith(selected, true)} disabled={!selectedAmmo}>
              Fill entire weapon
            </AppButton>
          </div>
          {state.presets.some((p) => p.weaponId === weapon.id) && (
            <div className="preset-strip">
              <span className="eyebrow">One-tap presets</span>
              {state.presets
                .filter((p) => p.weaponId === weapon.id)
                .map((p) => (
                  <AppButton key={p.id} size="sm" onClick={() => setPlan(p.slots)}>
                    {p.favorite && <Icon name="spark" />}
                    {p.name}
                  </AppButton>
                ))}
            </div>
          )}
          <div className="plan-summary">
            <div className="stat">
              <span>Prepared</span>
              <b>
                {planned}
                <small> / {weapon.capacity}</small>
              </b>
            </div>
            <div className="stat">
              <span>Empty</span>
              <b>{weapon.capacity - planned}</b>
            </div>
            <div className="stat">
              <span>Status</span>
              <b className={possible ? "ok" : "bad"}>{possible ? "Ready" : "Shortage"}</b>
            </div>
          </div>
          <AppButton
            variant="primary"
            size="lg"
            block
            className="commit-load"
            onClick={() => commit(plan, selected)}
            disabled={!possible}
          >
            <Icon name="reload" />
            Load {planned} Rounds
          </AppButton>
        </div>
      </div>
    </Modal>
  );
}
