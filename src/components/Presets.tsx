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
import { AppButton } from "./ui";

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
    <section className="panel presets-panel glass">
      <div className="panel-head">
        <div>
          <span className="eyebrow">MAGAZINE PRESETS</span>
          <h1>One-tap field loadouts.</h1>
          <p>
            See shortages before combat and stage the exact ammunition mix you
            want.
          </p>
        </div>
        <div className="filter-tabs" role="group" aria-label="Filter by weapon">
          <button
            className={filter === "all" ? "active" : ""}
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {state.weapons.map((w) => (
            <button
              className={filter === w.id ? "active" : ""}
              aria-pressed={filter === w.id}
              onClick={() => setFilter(w.id)}
              key={w.id}
            >
              {w.shortName}
            </button>
          ))}
        </div>
      </div>
      <div className="preset-grid">
        {!visible.length && (
          <div className="empty-batch">
            <p>
              No loadouts yet. Load a weapon in the Armory and choose Save
              Preset.
            </p>
          </div>
        )}
        {visible.map((p) => {
          const w = findWeapon(state, p.weaponId);
          if (!w) return null;
          const missing = presetShortfall(state, p);
          const short = missing.length > 0;
          const missingCount = missing.reduce((n, x) => n + x.qty, 0);
          const missingCost = missing.reduce((n, x) => n + x.qty * x.ammo.cost, 0);
          return (
            <article key={p.id} className={short ? "short" : ""}>
              <button
                className={`pin ${p.favorite ? "active" : ""}`}
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
                ✦
              </button>
              <div className="preset-head">
                <span>{w.shortName.toUpperCase()}</span>
                <h2>{p.name}</h2>
                <p>
                  {loadedCount(p.slots)}/{w.capacity} rounds ·{" "}
                  {short ? `Missing ${missingCount} (${money(missingCost)})` : "Ready to load"}
                </p>
              </div>
              <div className="preset-mag">
                {p.slots.map((id, i) => {
                  const a = findAmmo(state, id);
                  return (
                    <span key={i} style={{ "--ammo": a?.color } as CSSProperties}>
                      {a ? <Cartridge ammo={a} small density={state.theme.density} /> : null}
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
                      {a.symbol} ×{countIn(p.slots, a.id)}
                    </span>
                  ))}
              </div>
              <div className="preset-actions">
                <AppButton className="primary" onClick={() => loadNow(p)} disabled={short}>
                  Load Now
                </AppButton>
                <button onClick={() => adjustPreset(p)}>Adjust</button>
                {short && (
                  <button
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
                    Craft Missing
                  </button>
                )}
                <button
                  onClick={() =>
                    commit(
                      (n) => {
                        const x = n.presets.find((q) => q.id === p.id);
                        if (!x) return false;
                        n.presets.push({
                          ...clone(x),
                          id: uid("preset"),
                          name: `${x.name} Copy`,
                          favorite: false,
                        });
                      },
                      `Duplicated ${p.name}.`,
                      "preset",
                    )
                  }
                >
                  Duplicate
                </button>
                <button
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
                </button>
                <button
                  className="danger"
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
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
