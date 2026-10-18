import { useId, useState } from "react";
import type { DialogState } from "../lib/types";
import { money } from "../lib/util";
import { AppButton, Modal } from "./ui";

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
    dialog.type === "reset" ||
    dialog.type.includes("delete") ||
    dialog.type === "discardCraft";
  const blank = needsInput && !value.trim();
  return (
    <Modal className="themed-dialog glass" labelledBy={titleId} onDismiss={close}>
      <span className="dialog-mark" aria-hidden="true">
        {destructive ? "!" : "✦"}
      </span>
      <h2 id={titleId}>{dialog.title}</h2>
      <p>{dialog.body}</p>
      {needsInput && (
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
      )}
      <div>
        <AppButton onClick={close}>Cancel</AppButton>
        <AppButton
          className={destructive ? "danger" : "primary"}
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
    <Modal
      scrimClassName="modal-scrim coin-ledger-scrim"
      className="coin-ledger coin-ledger-dialog glass"
      labelledBy="coin-ledger-title"
      onDismiss={close}
    >
      <span>COIN LEDGER</span>
      <h2 id="coin-ledger-title">Edit available gold</h2>
      <label>
        Current gold
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
      </label>
      <div className="coin-adjustments">
        {[-5, -1, 1, 5].map((delta) => (
          <button key={delta} onClick={() => adjust(delta)} aria-label={`${delta > 0 ? "Add" : "Subtract"} ${money(Math.abs(delta))}`}>
            {delta > 0 ? `+${delta}` : `−${-delta}`}
          </button>
        ))}
      </div>
      <small>Every saved change can be undone.</small>
      <div className="coin-ledger-actions">
        <AppButton onClick={close}>Cancel</AppButton>
        <AppButton className="primary" onClick={commit}>
          Save Gold
        </AppButton>
      </div>
    </Modal>
  );
}
