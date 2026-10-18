import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";

export { Icon } from "./Icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost";
  size?: "sm" | "lg";
  block?: boolean;
};

export function AppButton({
  children,
  className = "",
  variant,
  size,
  block,
  ...props
}: ButtonProps) {
  const classes = [
    "btn",
    variant && `btn--${variant}`,
    size && `btn--${size}`,
    block && "btn--block",
    className,
  ];
  return (
    <button type="button" {...props} className={classes.filter(Boolean).join(" ")}>
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
      <span className="eyebrow">{kicker}</span>
      <h2 className="display">{title}</h2>
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
    <label className="field">
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
  const pct = `${((value - min) / (max - min)) * 100}%`;
  return (
    <label className="setting-row range-setting">
      <span className="setting-copy">
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <output>
        {value}
        {suffix}
      </output>
      <input
        className="range"
        type="range"
        min={min}
        max={max}
        value={value}
        style={{ "--pct": pct } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
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
    <label className="setting-row toggle-setting">
      <span className="setting-copy">
        <b>{label}</b>
        <small>{detail}</small>
      </span>
      <span className="switch">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <i />
      </span>
    </label>
  );
}
