import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

const GLYPHS: Record<string, string> = {
  armory: "⌖",
  workshop: "⚒",
  presets: "▤",
  settings: "⚙",
  reload: "↻",
  undo: "↶",
  history: "☷",
  sound: "◖",
  combat: "✦",
  turn: "→",
  close: "×",
  edit: "✎",
  download: "⇩",
  upload: "⇧",
  spark: "✧",
  lock: "◆",
};

export function Icon({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="ui-icon">
      {GLYPHS[name] || "·"}
    </span>
  );
}

export function AppButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props} className={`app-btn ${className}`}>
      {children}
    </button>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal shell: dismisses on a scrim press, keeps Tab inside the
 * dialog, and returns focus to whatever opened it.
 */
export function Modal({
  children,
  onDismiss,
  scrimClassName = "modal-scrim",
  className,
  as: Tag = "section",
  labelledBy,
  label,
}: {
  children: ReactNode;
  onDismiss: () => void;
  scrimClassName?: string;
  className: string;
  as?: "section" | "aside";
  labelledBy?: string;
  label?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialog && !dialog.contains(document.activeElement))
      (dialog.querySelector<HTMLElement>("[autofocus]") ||
        dialog.querySelector<HTMLElement>(FOCUSABLE) ||
        dialog
      ).focus();
    return () => opener?.focus?.({ preventScroll: true });
  }, []);
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !ref.current) return;
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0],
      last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  return (
    <div
      className={scrimClassName}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <Tag
        ref={ref as React.RefObject<HTMLElement & HTMLDivElement>}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
        tabIndex={-1}
        onKeyDown={trapTab}
      >
        {children}
      </Tag>
    </div>
  );
}

export function SettingsHeading({
  kicker,
  title,
  text,
}: {
  kicker: string;
  title: string;
  text: string;
}) {
  return (
    <div className="settings-heading">
      <span>{kicker}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

export function VisualSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Range({
  label,
  detail,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  detail: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="range-setting">
      <span>
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output>
        {value}
        {suffix}
      </output>
    </label>
  );
}

export function Toggle({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-setting">
      <span>
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <i />
    </label>
  );
}
