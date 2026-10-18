import { type CSSProperties, useEffect } from "react";
import { LAST_BATCH_KEY } from "../lib/defaults";
import { batchCost, batchCount, maxAffordable, sanitizeBatch } from "../lib/ledger";
import { safeStorage } from "../lib/migrate";
import type { Batch, LedgerState } from "../lib/types";
import { money } from "../lib/util";
import { Cartridge } from "./Cartridge";
import { Ticker } from "./Ticker";
import { AppButton, Icon } from "./ui";
import "./Workshop.css";

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
    <div className="workshop">
      <section className="panel bench">
        <header className="panel-head">
          <div>
            <span className="eyebrow">Ammosmith bench</span>
            <h1>Build the next encounter.</h1>
            <p>Queue a batch, check the full cost, and restock the field case.</p>
          </div>
          <button className="purse" onClick={editGold} aria-label={`Available funds ${money(state.gold)}. Edit coins`}>
            <Icon name="coins" />
            <span>
              <small>Available funds</small>
              <b className="num">
                <Ticker value={state.gold} /> gp
              </b>
            </span>
          </button>
        </header>
        <div className="craft-grid">
          {state.ammo.map((a) => {
            const qty = batch[a.id] || 0;
            return (
              <article key={a.id} className={`crate ${qty ? "active" : ""}`} style={{ "--ammo": a.color } as CSSProperties}>
                <div className="crate-round">
                  <Cartridge ammo={a} density={state.theme.density} />
                  {qty > 0 && <span className="crate-qty num">×{qty}</span>}
                </div>
                <div className="crate-copy">
                  <span className="eyebrow">{money(a.cost)} each</span>
                  <h3 className="display">{a.name}</h3>
                  <p>{a.effect}</p>
                </div>
                <div className="crate-controls">
                  <button onClick={() => setQty(a.id, qty - 1)} disabled={!qty} aria-label={`One fewer ${a.name}`}>
                    <Icon name="minus" />
                  </button>
                  <b aria-label={`${qty} queued`} className="num">
                    {qty}
                  </b>
                  <button onClick={() => setQty(a.id, qty + 1)} aria-label={`One more ${a.name}`}>
                    <Icon name="plus" />
                  </button>
                  <button className="wide" onClick={() => setQty(a.id, qty + 5)} aria-label={`Five more ${a.name}`}>
                    +5
                  </button>
                  <button
                    className="wide"
                    onClick={() => setQty(a.id, maxAffordable(state, batch, a))}
                    aria-label={`As many ${a.name} as you can afford`}
                  >
                    Max
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <aside className={`batch-panel ${count ? "" : "empty"}`}>
        <div className="receipt">
          <span className="eyebrow">Crafting ledger</span>
          <h2 className="display">Current batch</h2>
          <ol className="batch-lines">
            {state.ammo
              .filter((a) => batch[a.id])
              .map((a) => (
                <li key={a.id} style={{ "--ammo": a.color } as CSSProperties}>
                  <b className="num">{batch[a.id]}×</b>
                  <span>{a.name}</span>
                  <em className="num">{money((batch[a.id] || 0) * a.cost)}</em>
                </li>
              ))}
            {!count && <li className="empty-batch">Nothing queued. Pick rounds from the bench.</li>}
          </ol>
          <div className="batch-total">
            <div className="stat">
              <span>Rounds</span>
              <b>{count}</b>
            </div>
            <div className="stat">
              <span>Total</span>
              <b className={cost > state.gold ? "over" : ""}>{money(cost)}</b>
            </div>
            <div className="stat">
              <span>Average</span>
              <b>{count ? money(cost / count) : "—"}</b>
            </div>
          </div>
        </div>
        <AppButton variant="primary" size="lg" block className="craft-confirm" disabled={!count || cost > state.gold} onClick={craft}>
          <Icon name="workshop" />
          Craft {count || ""} Rounds
        </AppButton>
        <div className="batch-tools">
          <AppButton size="sm" onClick={() => setBatch(() => ({}))} disabled={!count}>
            Clear batch
          </AppButton>
          <AppButton size="sm" onClick={repeat}>
            Repeat last
          </AppButton>
        </div>
      </aside>
    </div>
  );
}
