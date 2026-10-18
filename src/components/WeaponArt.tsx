import { useId } from "react";
import type { Weapon } from "../lib/types";
import "./WeaponArt.css";

type Props = {
  weapon: Weapon;
  /** True for one firing cycle; restarts the animation each time it flips on. */
  firing?: boolean;
  /** Ammunition effect of the round being fired (tracer, flame, frost…). */
  fx?: string;
  className?: string;
};

/**
 * Hand-built SVG firearms with separately animated parts: the hammer falls,
 * the lever-action cycles and throws brass, the revolver indexes its cylinder.
 */
export function WeaponArt({ weapon, firing = false, fx = "none", className = "" }: Props) {
  const uid = useId().replace(/:/g, "");
  const Art = weapon.type === "revolver" ? Revolver : LeverRifle;
  return (
    <div
      className={`weapon-art ${weapon.type} finish-${weapon.finish} stock-${weapon.stock} element-${weapon.element} ${firing ? `firing shot-${fx}` : ""} ${className}`}
      role="img"
      aria-label={`${weapon.name} illustration`}
    >
      <Art uid={uid} />
    </div>
  );
}

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-metal`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--metal-hi)" }} />
        <stop offset=".35" style={{ stopColor: "var(--metal)" }} />
        <stop offset="1" style={{ stopColor: "var(--metal-lo)" }} />
      </linearGradient>
      <linearGradient id={`${uid}-metal-dark`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--metal)" }} />
        <stop offset="1" style={{ stopColor: "var(--metal-lo)" }} />
      </linearGradient>
      <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={{ stopColor: "var(--wood-hi)" }} />
        <stop offset=".45" style={{ stopColor: "var(--wood)" }} />
        <stop offset="1" style={{ stopColor: "var(--wood-lo)" }} />
      </linearGradient>
      <pattern id={`${uid}-grain`} width="160" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
        <path
          d="M0 6 C40 2 80 12 160 6 M0 17 C50 13 90 23 160 16 M0 28 C40 25 100 34 160 27 M0 37 C60 33 110 40 160 36"
          fill="none"
          stroke="var(--wood-lo)"
          strokeOpacity=".28"
          strokeWidth="1.1"
        />
      </pattern>
      <radialGradient id={`${uid}-flash`}>
        <stop offset="0" stopColor="#fffbe6" />
        <stop offset=".3" style={{ stopColor: "var(--flash, #ffd36a)" }} />
        <stop offset=".7" style={{ stopColor: "var(--flash-edge, #ff6a1f)" }} stopOpacity=".55" />
        <stop offset="1" style={{ stopColor: "var(--flash-edge, #ff6a1f)" }} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${uid}-smoke`}>
        <stop offset="0" stopColor="#d9d3c6" stopOpacity=".55" />
        <stop offset="1" stopColor="#d9d3c6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${uid}-brass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe3a0" />
        <stop offset=".5" stopColor="#c8923d" />
        <stop offset="1" stopColor="#6a4416" />
      </linearGradient>
      <filter id={`${uid}-soft`} x="-20%" y="-60%" width="140%" height="220%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
  );
}

/** Muzzle flash, smoke and tracer, anchored at the muzzle point. */
function MuzzleFx({ uid, x, y }: { uid: string; x: number; y: number }) {
  return (
    <g className="muzzle-fx" transform={`translate(${x} ${y})`}>
      <line className="tracer" x1="0" y1="0" x2="-900" y2="-14" />
      <g className="smoke">
        <circle className="puff p1" r="26" fill={`url(#${uid}-smoke)`} />
        <circle className="puff p2" r="34" fill={`url(#${uid}-smoke)`} />
        <circle className="puff p3" r="22" fill={`url(#${uid}-smoke)`} />
      </g>
      <g className="flash">
        <circle r="80" fill={`url(#${uid}-flash)`} opacity=".55" />
        <circle r="38" fill={`url(#${uid}-flash)`} />
        <path d="M0 0 L-130 -8 L-40 -16 L-84 -52 L-18 -22 L-8 -60 L6 -18 L0 0 L6 18 L-8 60 L-18 22 L-84 52 L-40 16 L-130 8 Z" fill={`url(#${uid}-flash)`} />
        <circle r="12" fill="#fffdf2" />
      </g>
    </g>
  );
}

function LeverRifle({ uid }: { uid: string }) {
  const metal = `url(#${uid}-metal)`;
  const dark = `url(#${uid}-metal-dark)`;
  const wood = `url(#${uid}-wood)`;
  const grain = `url(#${uid}-grain)`;
  return (
    <svg viewBox="0 30 1000 230" className="weapon-svg">
      <Defs uid={uid} />
      <g className="recoil">
        <path className="element-glow" d="M40 104 h560" filter={`url(#${uid}-soft)`} />
        {/* Barrel, magazine tube, bands and sights */}
        <rect x="88" y="117" width="508" height="15" rx="7.5" fill={dark} />
        <rect x="40" y="95" width="566" height="20" rx="3" fill={metal} />
        <path d="M44 98.5 H602" stroke="var(--metal-hi)" strokeOpacity=".55" strokeWidth="1.4" />
        <path d="M44 111.5 H602" stroke="#000" strokeOpacity=".35" strokeWidth="1.4" />
        <rect x="33" y="93" width="11" height="24" rx="2" fill={dark} />
        <path d="M60 95 l3 -10 h4 l2 10z" fill={dark} />
        <path d="M456 95 v-9 h22 v9 h-6 v-4 h-10 v4z" fill={dark} />
        <rect x="92" y="91" width="11" height="44" rx="2.5" fill={metal} />
        {/* Fore-end */}
        <path d="M384 113 H600 V142 H392 Q378 142 378 128 Q378 113 384 113Z" fill={wood} />
        <path d="M384 113 H600 V142 H392 Q378 142 378 128 Q378 113 384 113Z" fill={grain} />
        <rect x="372" y="111" width="12" height="33" rx="3" fill={metal} />
        {/* Stock */}
        <path d="M732 98 C768 99 792 108 814 117 L960 92 Q977 89 980 106 L987 226 Q988 243 970 241 C900 233 850 212 813 184 C790 168 768 165 732 166Z" fill={wood} />
        <path d="M732 98 C768 99 792 108 814 117 L960 92 Q977 89 980 106 L987 226 Q988 243 970 241 C900 233 850 212 813 184 C790 168 768 165 732 166Z" fill={grain} />
        <path d="M818 120 C870 112 920 104 958 98" stroke="var(--wood-hi)" strokeOpacity=".5" strokeWidth="2" fill="none" />
        <path d="M963 92 Q977 89 980 106 L987 226 Q988 243 970 241 L973 238 L971 104 Z" fill={metal} />
        {/* Lever, cycling around its pivot under the receiver */}
        <g className="lever">
          <path
            d="M642 166 L700 168 Q714 170 718 184 Q724 206 760 208 Q790 208 788 194 Q786 182 762 182 Q736 182 726 172"
            fill="none"
            stroke={metal}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="642" cy="166" r="4.5" fill={dark} />
        </g>
        <path className="trigger" d="M690 164 C694 176 692 186 684 192 L680 189 C686 182 686 174 684 164Z" fill={dark} />
        {/* Receiver with loading gate, bolt and ejection port */}
        <path d="M598 86 H716 Q730 86 732 100 L738 152 Q740 168 724 168 H598Z" fill={metal} />
        <path d="M604 90 H714" stroke="var(--metal-hi)" strokeOpacity=".6" strokeWidth="1.4" />
        <rect className="bolt" x="632" y="88" width="62" height="10" rx="2" fill={dark} />
        <rect x="634" y="84" width="50" height="5" rx="1.5" fill="#0b0b0b" opacity=".75" />
        <g className="engraving" fill="none" stroke="var(--metal-hi)" strokeOpacity=".35" strokeWidth="1.1">
          <path d="M610 110 c10 -10 22 4 32 -4 c10 -8 20 6 30 -2 M612 124 c14 6 24 -6 36 0" />
          <circle cx="702" cy="118" r="9" />
        </g>
        <text x="696" y="122" className="engraving-mark">AC</text>
        <rect className="loading-gate" x="648" y="134" width="48" height="13" rx="3.5" fill={dark} />
        <circle cx="652" cy="140.5" r="2" fill="var(--metal-hi)" opacity=".7" />
        <circle cx="616" cy="152" r="2.6" fill={dark} />
        <circle cx="720" cy="150" r="2.6" fill={dark} />
        {/* Hammer */}
        <g className="hammer">
          <path d="M708 108 C708 92 716 80 728 72 C734 68 740 72 737 77 C728 86 724 96 724 110Z" fill={metal} />
          <path d="M727 74 l8 -4 M729 77 l8 -4" stroke="#000" strokeOpacity=".4" />
        </g>
        {/* Spent brass, thrown from the ejection port when the lever cycles */}
        <g className="casing">
          <rect x="-5" y="-13" width="10" height="26" rx="2" fill={`url(#${uid}-brass)`} />
          <rect x="-6" y="11" width="12" height="3" rx="1" fill="#8a5c22" />
        </g>
      </g>
      <MuzzleFx uid={uid} x={30} y={105} />
    </svg>
  );
}

function Revolver({ uid }: { uid: string }) {
  const metal = `url(#${uid}-metal)`;
  const dark = `url(#${uid}-metal-dark)`;
  const wood = `url(#${uid}-wood)`;
  const grain = `url(#${uid}-grain)`;
  return (
    <svg viewBox="200 26 650 244" className="weapon-svg">
      <Defs uid={uid} />
      <g className="recoil">
        <path className="element-glow" d="M274 104 h250" filter={`url(#${uid}-soft)`} />
        {/* Barrel, rib and ejector housing */}
        <rect x="372" y="116" width="154" height="16" rx="8" fill={dark} />
        <rect x="272" y="91" width="256" height="27" rx="3" fill={metal} />
        <rect x="272" y="85" width="256" height="8" rx="2" fill={dark} />
        <path d="M276 96 H524" stroke="var(--metal-hi)" strokeOpacity=".55" strokeWidth="1.5" />
        <path d="M284 85 l4 -11 h5 l3 11z" fill={dark} />
        <rect x="264" y="87" width="10" height="33" rx="2" fill={dark} />
        {/* Grip */}
        <path d="M686 148 Q718 138 744 150 Q792 178 808 236 Q812 255 790 257 L748 259 Q728 259 724 240 Q710 196 684 176Z" fill={wood} />
        <path d="M686 148 Q718 138 744 150 Q792 178 808 236 Q812 255 790 257 L748 259 Q728 259 724 240 Q710 196 684 176Z" fill={grain} />
        <path d="M744 150 Q792 178 808 236 Q812 255 790 257 L800 256 Q818 252 816 232 Q800 174 752 146Z" fill={metal} />
        <circle cx="756" cy="208" r="9" fill={metal} />
        <circle cx="756" cy="208" r="4" fill={dark} />
        {/* Frame, trigger guard and recoil shield */}
        <path d="M524 78 H690 Q712 78 716 98 L720 150 Q722 170 700 172 H640 L640 160 H524Z" fill={metal} />
        <path d="M528 82 H688" stroke="var(--metal-hi)" strokeOpacity=".6" strokeWidth="1.4" />
        <path fillRule="evenodd" fill={metal} d="M636 160 H700 C706 186 694 206 668 208 C646 210 632 196 632 176Z M646 172 C646 188 654 198 668 198 C684 198 692 186 690 170Z" />
        <path className="trigger" d="M666 166 C672 176 670 186 662 192 L658 189 C664 182 664 174 662 166Z" fill={dark} />
        {/* Cylinder, whose flutes slide past as it indexes */}
        <rect x="538" y="80" width="102" height="80" rx="14" fill={metal} />
        <clipPath id={`${uid}-cyl`}>
          <rect x="542" y="84" width="94" height="72" rx="11" />
        </clipPath>
        <g clipPath={`url(#${uid}-cyl)`}>
          <g className="flutes">
            {[-46, -23, 0, 23, 46, 69, 92].map((y) => (
              <rect key={y} x="548" y={90 + y} width="82" height="10" rx="5" fill={dark} opacity=".85" />
            ))}
          </g>
        </g>
        <rect x="640" y="80" width="14" height="82" rx="3" fill={dark} />
        <circle cx="690" cy="112" r="3" fill={dark} />
        <circle cx="704" cy="140" r="3" fill={dark} />
        {/* Hammer */}
        <g className="hammer">
          <path d="M694 100 C696 86 704 72 720 62 C728 57 736 62 731 69 C720 78 714 90 712 104Z" fill={metal} />
          <path d="M720 64 l9 -5 M722 68 l9 -5" stroke="#000" strokeOpacity=".4" />
        </g>
      </g>
      <MuzzleFx uid={uid} x={260} y={104} />
    </svg>
  );
}
