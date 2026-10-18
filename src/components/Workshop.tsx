import { type CSSProperties, useEffect } from "react";
import { LAST_BATCH_KEY } from "../lib/defaults";
import { batchCost, batchCount, maxAffordable, sanitizeBatch } from "../lib/ledger";
import { safeStorage } from "../lib/migrate";
import type { Batch, LedgerState } from "../lib/types";
import { money } from "../lib/util";
import { Cartridge } from "./Cartridge";
import { AppButton, Icon } from "./ui";

export function Workshop({
  state,
  batch,
  setBatch,
  craft,
  editGold,
}: {
  state: LedgerState;
  batch: Batch;
  setBatch: (update: (b: Batch) => Batch) => void;
  craft: () => void;
  editGold: () => void;
}) {
  const count = batchCount(state, batch);
  const cost = batchCost(state, batch);
  const setQty = (id: string, qty: number) =>
    setBatch((b) => ({ ...b, [id]: Math.max(0, qty) }));
  const repeat = () => {
    try {
      const last = JSON.parse(safeStorage()?.getItem(LAST_BATCH_KEY) || "{}");
      setBatch(() => sanitizeBatch(state, last));
    } catch {}
  };
  useEffect(() => {
    if (!count) return;
    try {
      safeStorage()?.setItem(LAST_BATCH_KEY, JSON.stringify(batch));
    } catch {}
  }, [batch, count]);

  return (
    <div className="workshop-layout">
      <section className="panel glass">
        <div className="panel-head">
          <div>
            <span className="eyebrow">AMMOSMITH BENCH</span>
            <h1>Build the next encounter.</h1>
            <p>
              Queue a batch, inspect the full cost, and replenish the field
              case.
            </p>
          </div>
          <button className="gold-chip" onClick={editGold}>
            <span>AVAILABLE FUNDS</span>
            <b>{money(state.gold)}</b>
            <small>Edit coins</small>
          </button>
        </div>
        <div className="craft-grid">
          {state.ammo.map((a) => {
            const qty = batch[a.id] || 0;
            return (
              <article
                key={a.id}
                className={qty ? "active" : ""}
                style={{ "--ammo": a.color } as CSSProperties}
              >
                <Cartridge ammo={a} density={state.theme.density} />
                <div className="craft-copy">
                  <span>{money(a.cost)} EACH</span>
                  <h3>{a.name}</h3>
                  <p>{a.effect}</p>
                </div>
                <div className="craft-controls">
                  <button
                    onClick={() => setQty(a.id, qty - 1)}
                    disabled={!qty}
                    aria-label={`One fewer ${a.name}`}
                  >
                    −
                  </button>
                  <b aria-label={`${qty} queued`}>{qty}</b>
                  <button onClick={() => setQty(a.id, qty + 1)} aria-label={`One more ${a.name}`}>
                    +
                  </button>
                  <button onClick={() => setQty(a.id, qty + 5)} aria-label={`Five more ${a.name}`}>
                    +5
                  </button>
                  <button
                    onClick={() => setQty(a.id, maxAffordable(state, batch, a))}
                    aria-label={`As many ${a.name} as you can afford`}
                  >
                    MAX
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <aside className={`panel glass batch-panel ${count ? "" : "empty"}`}>
        <span className="eyebrow">CRAFTING LEDGER</span>
        <h2>Current batch</h2>
        <div className="batch-lines">
          {state.ammo
            .filter((a) => batch[a.id])
            .map((a) => (
              <div key={a.id}>
                <span style={{ background: a.color }} />
                <b>{batch[a.id]}×</b>
                <p>{a.name}</p>
                <em>{money((batch[a.id] || 0) * a.cost)}</em>
              </div>
            ))}
          {!count && (
            <div className="empty-batch">
              <Icon name="workshop" />
              <p>Select ammunition from the bench to begin.</p>
            </div>
          )}
        </div>
        <div className="batch-total">
          <span>
            <small>ROUNDS</small>
            <b>{count}</b>
          </span>
          <span>
            <small>TOTAL COST</small>
            <b className={cost > state.gold ? "over" : ""}>{money(cost)}</b>
          </span>
          <span>
            <small>AVERAGE</small>
            <b>{count ? money(cost / count) : "—"}</b>
          </span>
        </div>
        <AppButton
          className="primary craft-confirm"
          disabled={!count || cost > state.gold}
          onClick={craft}
        >
          <Icon name="workshop" />
          Craft {count || ""} Rounds
        </AppButton>
        <div className="batch-tools">
          <button onClick={() => setBatch(() => ({}))}>Clear batch</button>
          <button onClick={repeat}>Repeat last</button>
        </div>
      </aside>
    </div>
  );
}
