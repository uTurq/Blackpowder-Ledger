import { useId, useState } from "react";
import type { DialogState } from "../lib/types";
import { money } from "../lib/util";
import "./Overlays.css";
import { AppButton, Icon, Modal } from "./ui";

const CONFIRM_LABELS: Partial<Record<NonNullable<DialogState>["type"], string>> = {
  reset: "Reset Ledger",
  deletePreset: "Delete Preset",
  deleteAmmo: "Delete Type",
  discardCraft: "Discard Batch",
};

export function ThemedDialog({
  dialog,
  close,
  confirm,
}: {
  dialog: NonNullable<DialogState>;
  close: () => void;
  confirm: (v: string) => void;
}) {
  const titleId = useId();
  const [value, setValue] = useState(dialog.value || "");
  const needsInput = ["renamePreset", "savePreset", "newAmmo"].includes(dialog.type);
  const destructive =
    dialog.type === "reset" || dialog.type.includes("delete") || dialog.type === "discardCraft";
  const blank = needsInput && !value.trim();
  return (
    <Modal className={`themed-dialog panel ${destructive ? "destructive" : ""}`} labelledBy={titleId} onDismiss={close}>
      <span className="dialog-seal" aria-hidden="true">
        {destructive ? "!" : <Icon name="spark" />}
      </span>
      <h2 id={titleId} className="display">
        {dialog.title}
      </h2>
      <p>{dialog.body}</p>
      {needsInput && (
        <div className="field">
          <input
            autoFocus
            aria-label={dialog.title}
            value={value}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !blank) confirm(value);
            }}
          />
        </div>
      )}
      <div className="dialog-actions">
        <AppButton onClick={close}>Cancel</AppButton>
        <AppButton
          variant={destructive ? "danger" : "primary"}
          onClick={() => confirm(value)}
          disabled={blank}
          autoFocus={!needsInput}
        >
          {CONFIRM_LABELS[dialog.type] || "Confirm"}
        </AppButton>
      </div>
    </Modal>
  );
}

export function GoldDialog({
  gold,
  close,
  save,
}: {
  gold: number;
  close: () => void;
  save: (gold: number) => void;
}) {
  const [draft, setDraft] = useState(String(gold));
  const adjust = (delta: number) =>
    setDraft((current) => String(Math.max(0, (Number(current) || 0) + delta)));
  const commit = () => save(Math.max(0, Number(draft) || 0));
  return (
    <Modal className="coin-ledger themed-dialog panel" labelledBy="coin-ledger-title" onDismiss={close}>
      <span className="dialog-seal coin" aria-hidden="true">
        <Icon name="coins" />
      </span>
      <span className="eyebrow">Coin ledger</span>
      <h2 id="coin-ledger-title" className="display">
        Edit available gold
      </h2>
      <label className="coin-input">
        <span className="sr-only">Current gold</span>
        <input
          autoFocus
          type="number"
          min="0"
          step="1"
          inputMode="decimal"
          value={draft}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
        />
        <span aria-hidden="true">gp</span>
      </label>
      <div className="coin-adjustments">
        {[-10, -5, -1, 1, 5, 10].map((delta) => (
          <button
            key={delta}
            onClick={() => adjust(delta)}
            aria-label={`${delta > 0 ? "Add" : "Subtract"} ${money(Math.abs(delta))}`}
          >
            {delta > 0 ? `+${delta}` : `−${-delta}`}
          </button>
        ))}
      </div>
      <small className="muted">Every saved change can be undone.</small>
      <div className="dialog-actions">
        <AppButton onClick={close}>Cancel</AppButton>
        <AppButton variant="primary" onClick={commit}>
          Save Gold
        </AppButton>
      </div>
    </Modal>
  );
}
