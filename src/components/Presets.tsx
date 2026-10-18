import type { CSSProperties } from "react";
import {
  countIn,
  craftPresetShortfall,
  findAmmo,
  findWeapon,
  loadedCount,
  presetShortfall,
} from "../lib/ledger";
import type { Commit } from "../lib/store";
import type { DialogState, LedgerState, Preset } from "../lib/types";
import { clone, money, uid } from "../lib/util";
import { Cartridge } from "./Cartridge";
import "./Presets.css";
import { AppButton, Icon } from "./ui";

export function Presets({
  state,
  filter,
  setFilter,
  adjustPreset,
  loadNow,
  setDialog,
  commit,
}: {
  state: LedgerState;
  filter: string;
  setFilter: (v: string) => void;
  adjustPreset: (p: Preset) => void;
  loadNow: (p: Preset) => void;
  setDialog: (d: DialogState) => void;
  commit: Commit;
}) {
  const visible = state.presets
    .filter((p) => filter === "all" || p.weaponId === filter)
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite));
  return (
    <section className="panel loadouts">
      <header className="panel-head">
        <div>
          <span className="eyebrow">Magazine presets</span>
          <h1>One-tap field loadouts.</h1>
          <p>See shortages before combat and stage the exact ammunition mix you want.</p>
        </div>
        <div className="segmented well" role="group" aria-label="Filter by weapon">
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            All
          </button>
          {state.weapons.map((w) => (
            <button aria-pressed={filter === w.id} onClick={() => setFilter(w.id)} key={w.id}>
              {w.shortName}
            </button>
          ))}
        </div>
      </header>
      <div className="preset-grid">
        {!visible.length && (
          <p className="empty-presets">No loadouts yet. Load a weapon in the Armory and choose Save Preset.</p>
        )}
        {visible.map((p) => {
          const w = findWeapon(state, p.weaponId);
          if (!w) return null;
          const missing = presetShortfall(state, p);
          const short = missing.length > 0;
          const missingCount = missing.reduce((n, x) => n + x.qty, 0);
          const missingCost = missing.reduce((n, x) => n + x.qty * x.ammo.cost, 0);
          return (
            <article key={p.id} className={`loadout ${short ? "short" : ""}`}>
              <header className="loadout-head">
                <div>
                  <span className="eyebrow">{w.shortName}</span>
                  <h2 className="display">{p.name}</h2>
                  <p className={short ? "status-short" : "status-ready"}>
                    <span className="num">
                      {loadedCount(p.slots)}/{w.capacity}
                    </span>{" "}
                    rounds · {short ? `missing ${missingCount} (${money(missingCost)})` : "ready to load"}
                  </p>
                </div>
                <button
                  className="pin"
                  aria-label={p.favorite ? `Unpin ${p.name}` : `Pin ${p.name}`}
                  aria-pressed={!!p.favorite}
                  onClick={() =>
                    commit(
                      (n) => {
                        const x = n.presets.find((q) => q.id === p.id);
                        if (x) x.favorite = !x.favorite;
                      },
                      `${p.favorite ? "Unpinned" : "Pinned"} ${p.name}.`,
                      "preset",
                    )
                  }
                >
                  <Icon name="spark" />
                </button>
              </header>
              <div className="bandolier" aria-label={`${p.name} rounds`}>
                {p.slots.map((id, i) => {
                  const a = findAmmo(state, id);
                  return (
                    <span key={i} className={`loop ${a ? "" : "empty"}`} style={{ "--ammo": a?.color } as CSSProperties}>
                      {a && <Cartridge ammo={a} small density={state.theme.density} />}
                    </span>
                  );
                })}
              </div>
              <div className="preset-key">
                {state.ammo
                  .filter((a) => p.slots.includes(a.id))
                  .map((a) => (
                    <span key={a.id} style={{ "--ammo": a.color } as CSSProperties}>
                      <i />
                      {a.name} <b className="num">×{countIn(p.slots, a.id)}</b>
                    </span>
                  ))}
              </div>
              <div className="preset-actions">
                <AppButton variant="primary" onClick={() => loadNow(p)} disabled={short}>
                  <Icon name="reload" />
                  Load Now
                </AppButton>
                <AppButton onClick={() => adjustPreset(p)}>Adjust</AppButton>
                {short && (
                  <AppButton
                    disabled={missingCost > state.gold}
                    title={missingCost > state.gold ? "Not enough gold" : undefined}
                    onClick={() =>
                      commit(
                        (n) => craftPresetShortfall(n, p),
                        `Crafted ${missingCount} missing preset rounds for ${money(missingCost)}.`,
                        "craft",
                      )
                    }
                  >
                    <Icon name="workshop" />
                    Craft Missing
                  </AppButton>
                )}
                <span className="action-spacer" />
                <AppButton
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    commit(
                      (n) => {
                        const x = n.presets.find((q) => q.id === p.id);
                        if (!x) return false;
                        n.presets.push({ ...clone(x), id: uid("preset"), name: `${x.name} Copy`, favorite: false });
                      },
                      `Duplicated ${p.name}.`,
                      "preset",
                    )
                  }
                >
                  Duplicate
                </AppButton>
                <AppButton
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDialog({
                      type: "renamePreset",
                      id: p.id,
                      title: "Rename Preset",
                      value: p.name,
                      body: "Choose a concise name you can recognize during combat.",
                    })
                  }
                >
                  Rename
                </AppButton>
                <AppButton
                  size="sm"
                  variant="ghost"
                  className="delete"
                  onClick={() =>
                    setDialog({
                      type: "deletePreset",
                      id: p.id,
                      title: "Delete Preset?",
                      body: `“${p.name}” will be removed. You can undo this afterward.`,
                    })
                  }
                >
                  Delete
                </AppButton>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
