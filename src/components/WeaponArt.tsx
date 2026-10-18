import type { Weapon } from "../lib/types";

export function WeaponArt({
  weapon,
  firing = false,
  fx = "none",
}: {
  weapon: Weapon;
  firing?: boolean;
  fx?: string;
}) {
  return (
    <div
      className={`weapon-art ${weapon.type} finish-${weapon.finish} stock-${weapon.stock} element-${weapon.element} ${firing ? `firing shot-${fx}` : ""}`}
      aria-label={`${weapon.name} illustration`}
      role="img"
    >
      <span className="muzzle" />
      <span className="barrel" />
      <span className="tube" />
      <span className="fore-end" />
      <span className="receiver" />
      <span className="cylinder" />
      <span className="frame" />
      <span className="stock" />
      <span className="grip" />
      <span className="lever" />
      <span className="hammer" />
      <span className="sight" />
      <span className="engraving">AC-3 · ✦</span>
      <span className="muzzle-flash" />
      <span className="tracer-line" />
      {weapon.type === "lever" && <span className="casing" />}
    </div>
  );
}
