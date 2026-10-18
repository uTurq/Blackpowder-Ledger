import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Motion } from "../lib/types";

/** The ledger's motion profile, so small animations can honour it. */
export const MotionContext = createContext<Motion>("full");

/**
 * A number that rolls to its new value like a mechanical counter. With
 * reduced or no motion it simply shows the new value.
 */
export function Ticker({ value }: { value: number }) {
  const motion = useContext(MotionContext);
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const animate = motion === "full";
  useEffect(() => {
    const start = animate ? from.current : value;
    const duration = start === value ? 0 : Math.min(600, 180 + Math.abs(value - start) * 25);
    let t0: number | undefined;
    let frame = 0;
    const step = (now: number) => {
      // Time from the first frame's own clock, so the roll can never overshoot.
      t0 ??= now;
      const t = duration ? Math.min(1, (now - t0) / duration) : 1;
      const next = start + (value - start) * (1 - Math.pow(1 - t, 3));
      from.current = t < 1 ? next : value;
      setShown(from.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, animate]);
  const display = animate ? shown : value;
  return (
    <span className="ticker">
      {Number.isInteger(value) ? Math.round(display) : Math.round(display * 10) / 10}
    </span>
  );
}
