import type { Activity } from "../lib/types";
import { timeAgo } from "../lib/util";
import { Icon, Modal } from "./ui";

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

export function HistoryDrawer({ entries, close }: { entries: Activity[]; close: () => void }) {
  return (
    <Modal
      as="aside"
      scrimClassName="drawer-scrim"
      className="history-drawer glass"
      labelledBy="history-title"
      onDismiss={close}
    >
      <div className="drawer-head">
        <div>
          <span>FIELD RECORD</span>
          <h2 id="history-title">Activity history</h2>
        </div>
        <button onClick={close} aria-label="Close history">
          <Icon name="close" />
        </button>
      </div>
      <div className="history-list">
        {entries.map((a) => (
          <article key={a.id} className={`kind-${a.kind}`}>
            <i />
            <div>
              <p>{a.text}</p>
              <span>
                {new Date(a.time).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                · {timeAgo(a.time)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </Modal>
  );
}
