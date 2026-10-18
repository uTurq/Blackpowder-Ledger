import { type CSSProperties, useState } from "react";
import { availableFor, countIn, findAmmo, loadedCount, sanitizePlan } from "../lib/ledger";
import type { LedgerState, Plan, Weapon } from "../lib/types";
import { blankSlots } from "../lib/util";
import { Cartridge } from "./Cartridge";
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

  const slotButton = (id: string | null, i: number, extraClass = "") => {
    const a = findAmmo(state, id);
    return (
      <button
        key={i}
        className={`${extraClass} ${a ? "filled" : ""}`.trim()}
        onClick={() => a && remove(i)}
        style={{ "--ammo": a?.color } as CSSProperties}
        aria-label={a ? `Remove ${a.name} from slot ${i + 1}` : `Slot ${i + 1} empty`}
      >
        {a ? (
          <Cartridge ammo={a} small density={state.theme.density} />
        ) : (
          <b>{i + 1}</b>
        )}
      </button>
    );
  };

  return (
    <Modal className="reload-modal glass" labelledBy="reload-title" onDismiss={close}>
      <div className="modal-head">
        <div>
          <span>PHYSICAL LOAD CONFIGURATOR</span>
          <h2 id="reload-title">Prepare {weapon.shortName}</h2>
          <p>
            Click an ammunition card to seat one round. Click a cartridge in the
            weapon to remove it.
          </p>
        </div>
        <button onClick={close} aria-label="Close reload">
          <Icon name="close" />
        </button>
      </div>
      <div className="reload-layout">
        <div className="reload-catalog">
          <div className="reload-tools">
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
                  className={`${selected === a.id ? "active" : ""} ${left <= 0 ? "depleted" : ""}`}
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
                    <span>
                      {left} available · {count(a.id)} planned
                    </span>
                  </div>
                  <span className="load-card-action">
                    {left > 0 ? "LOAD" : "EMPTY"}
                    <b>＋</b>
                  </span>
                </article>
              );
            })}
          </div>
        </div>
        <div className="reload-plan">
          <div className="plan-stage">
            <span>{weapon.type === "lever" ? "TUBULAR MAGAZINE CUTAWAY" : "OPEN CYLINDER"}</span>
            {weapon.type === "lever" ? (
              <div className="reload-tube">{plan.map((id, i) => slotButton(id, i))}</div>
            ) : (
              <div className="reload-cylinder">
                {plan.map((id, i) => slotButton(id, i, `pos-${i}`))}
                <i />
              </div>
            )}
          </div>
          <div className="selected-load-type">
            <Cartridge ammo={selectedAmmo} small density={state.theme.density} />
            <div>
              <span>SELECTED TYPE</span>
              <b>{selectedAmmo?.name || "—"}</b>
            </div>
            <button onClick={() => fillWith(selected, true)} disabled={!selectedAmmo}>
              Fill Entire Weapon
            </button>
          </div>
          <div className="preset-strip">
            <span>ONE-TAP PRESETS</span>
            {state.presets
              .filter((p) => p.weaponId === weapon.id)
              .map((p) => (
                <button key={p.id} onClick={() => setPlan(p.slots)}>
                  {p.favorite && "✦ "}
                  {p.name}
                </button>
              ))}
          </div>
          <div className="plan-summary">
            <span>
              <small>PREPARED</small>
              <b>
                {loadedCount(plan)}/{weapon.capacity}
              </b>
            </span>
            <span>
              <small>EMPTY</small>
              <b>{plan.filter((x) => !x).length}</b>
            </span>
            <span>
              <small>STATUS</small>
              <b className={possible ? "ready" : "bad"}>{possible ? "READY" : "SHORTAGE"}</b>
            </span>
          </div>
          <AppButton
            className="primary commit-load"
            onClick={() => commit(plan, selected)}
            disabled={!possible}
          >
            <Icon name="reload" />
            Load {loadedCount(plan)} Rounds
          </AppButton>
        </div>
      </div>
    </Modal>
  );
}
