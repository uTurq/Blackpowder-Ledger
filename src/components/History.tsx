import type { Activity } from "../lib/types";
import { timeAgo } from "../lib/util";
import "./Overlays.css";
import { AppButton, Icon, Modal } from "./ui";

export function HistoryPeek({
  latest,
  compact,
  open,
}: {
  latest?: Activity;
  /** Shrinks to an icon so it clears the Armory's fire tab. */
  compact: boolean;
  open: () => void;
}) {
  return (
    <button
      className={`history-peek ${compact ? "compact" : ""}`}
      onClick={open}
      aria-label="Open activity history"
    >
      <Icon name="history" />
      <span>{latest?.text}</span>
      <small>{latest ? timeAgo(latest.time) : ""}</small>
    </button>
  );
}

const KIND_ICONS: Record<string, string> = {
  shot: "flame",
  reload: "reload",
  craft: "workshop",
  gold: "coins",
  turn: "turn",
  undo: "undo",
  preset: "presets",
  ammo: "spark",
  inventory: "edit",
  data: "download",
};

/** The field record, kept like a ruled ledger page. */
export function HistoryDrawer({ entries, close }: { entries: Activity[]; close: () => void }) {
  return (
    <Modal
      as="aside"
      scrimClassName="modal-scrim drawer-scrim"
      className="history-drawer panel"
      labelledBy="history-title"
      onDismiss={close}
    >
      <header className="modal-head">
        <div>
          <span className="eyebrow">Field record</span>
          <h2 id="history-title" className="display">
            Activity history
          </h2>
        </div>
        <AppButton className="btn--icon" variant="ghost" onClick={close} aria-label="Close history">
          <Icon name="close" />
        </AppButton>
      </header>
      <ol className="ledger-page">
        {entries.map((a) => (
          <li key={a.id} className={`kind-${a.kind}`}>
            <Icon name={KIND_ICONS[a.kind] || "spark"} />
            <p>{a.text}</p>
            <time dateTime={new Date(a.time).toISOString()}>
              {new Date(a.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              <small>{timeAgo(a.time)}</small>
            </time>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
