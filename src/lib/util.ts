import type { Activity, Plan } from "./types";

export const MAX_ACTIVITY = 80;

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
export function clone<T>(value: T): T {
  return structuredClone(value);
}
export function blankSlots(n: number): Plan {
  return Array.from({ length: n }, () => null);
}
export function activity(text: string, kind = "system"): Activity {
  return { id: uid("act"), text, time: Date.now(), kind };
}
export function capitalize(text: string) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}
export function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function timeAgo(time: number, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - time) / 1000));
  if (s < 15) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
export function money(n: number) {
  return `${Number.isInteger(n) ? n : n.toFixed(1)} gp`;
}
