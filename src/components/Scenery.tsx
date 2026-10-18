import { memo } from "react";
import "./Scenery.css";

// Deterministic scatter so stars and particles don't jump between renders.
function scatter(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => [rand(), rand(), rand()] as const);
}
const STARS = scatter(90, 7);
const MOTES = scatter(16, 31);

function Stars({ max = 520 }: { max?: number }) {
  return (
    <g className="stars">
      {STARS.map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x * 1600}
          cy={y * max}
          r={0.6 + r * 1.5}
          style={{ animationDelay: `${(r * 6).toFixed(2)}s` }}
        />
      ))}
    </g>
  );
}

function Desert() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="desert-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#100c1e" />
          <stop offset=".34" stopColor="#3a1f3d" />
          <stop offset=".6" stopColor="#9a3f29" />
          <stop offset=".76" stopColor="#ec9a52" />
          <stop offset=".86" stopColor="#f6c987" />
        </linearGradient>
        <radialGradient id="desert-sun">
          <stop offset="0" stopColor="#fff2c9" />
          <stop offset=".45" stopColor="#ffbe6a" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#desert-sky)" />
      <circle className="sun-glow" cx="1060" cy="640" r="330" fill="url(#desert-sun)" opacity=".5" />
      <circle cx="1060" cy="640" r="74" fill="#ffe0a3" />
      <path fill="#6b2f2c" opacity=".75" d="M0 640 L120 640 L150 600 L330 600 L350 640 L520 650 L560 590 L760 590 L790 640 L1000 660 L1040 610 L1180 610 L1210 655 L1600 645 L1600 900 L0 900Z" />
      <path fill="#3e1c22" d="M0 700 L220 690 L250 640 L420 640 L460 700 L780 715 L1260 700 L1290 655 L1470 655 L1500 705 L1600 712 L1600 900 L0 900Z" />
      <path fill="#1e0f12" d="M0 770 Q400 735 800 760 T1600 750 L1600 900 L0 900Z" />
      <g fill="#140a0c">
        <path d="M250 780 v-82 a12 12 0 0 1 24 0 v82z M274 735 h18 a10 10 0 0 0 10 -10 v-28 a8 8 0 0 1 16 0 v28 a26 26 0 0 1 -26 26 h-18z M250 748 h-14 a22 22 0 0 1 -22 -22 v-18 a8 8 0 0 1 16 0 v18 a6 6 0 0 0 6 6 h14z" />
        <path d="M1330 790 v-62 a9 9 0 0 1 18 0 v62z M1348 756 h12 a7 7 0 0 0 7 -7 v-20 a6 6 0 0 1 12 0 v20 a19 19 0 0 1 -19 19 h-12z" />
      </g>
      <path fill="#0c0607" d="M0 820 Q500 795 900 815 T1600 805 L1600 900 L0 900Z" />
    </svg>
  );
}

function Moon() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="moon-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#03060f" />
          <stop offset=".55" stopColor="#0d1a36" />
          <stop offset=".8" stopColor="#223558" />
        </linearGradient>
        <radialGradient id="moon-glow">
          <stop offset="0" stopColor="#dfe8ff" stopOpacity=".5" />
          <stop offset="1" stopColor="#dfe8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#moon-sky)" />
      <Stars />
      <circle cx="1180" cy="230" r="260" fill="url(#moon-glow)" />
      <circle cx="1180" cy="230" r="86" fill="#f1eedf" />
      <g fill="#d6d2bf" opacity=".7">
        <circle cx="1152" cy="208" r="16" />
        <circle cx="1206" cy="258" r="11" />
        <circle cx="1196" cy="196" r="7" />
      </g>
      <path fill="#14213c" d="M0 660 Q260 600 520 650 T1040 640 T1600 630 L1600 900 L0 900Z" />
      <path fill="#0c1529" d="M0 730 Q380 680 760 725 T1600 715 L1600 900 L0 900Z" />
      <path fill="#060b17" d="M0 810 Q420 770 860 805 T1600 795 L1600 900 L0 900Z" />
    </svg>
  );
}

function Workshop() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="ws-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1d130b" />
          <stop offset=".5" stopColor="#2f1f12" />
          <stop offset="1" stopColor="#1a1109" />
        </linearGradient>
        <pattern id="ws-planks" width="120" height="900" patternUnits="userSpaceOnUse">
          <rect width="120" height="900" fill="none" stroke="#0e0905" strokeWidth="3" />
          <path d="M60 0 v900" stroke="#140c06" strokeWidth="1" opacity=".5" />
        </pattern>
        <radialGradient id="ws-lamp">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity=".6" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#ws-wall)" />
      <rect width="1600" height="900" fill="url(#ws-planks)" />
      <circle className="lamp-glow" cx="820" cy="200" r="520" fill="url(#ws-lamp)" />
      <g fill="#0d0805" opacity=".85">
        <path d="M816 0 v130 M790 130 h52 l18 40 h-88z" stroke="#0d0805" strokeWidth="4" />
        <rect x="240" y="300" width="16" height="250" rx="4" />
        <rect x="214" y="290" width="68" height="18" rx="4" />
        <path d="M1240 310 l200 -20 l6 22 l-200 20z M1300 325 l-16 70 l22 4 l14 -66z" />
        <path d="M380 340 h120 v12 h-120z M440 352 v120 l-14 30 h28 l-14 -30" />
      </g>
      <circle cx="820" cy="190" r="26" fill="#ffe1a0" opacity=".9" />
      <path fill="#140c06" d="M0 760 h1600 v140 h-1600z" />
      <path fill="#3a2614" d="M0 750 h1600 v14 h-1600z" />
    </svg>
  );
}

function Forge() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
      <defs>
        <radialGradient id="forge-mouth" cx=".5" cy=".7">
          <stop offset="0" stopColor="#fff0b0" />
          <stop offset=".25" stopColor="#ff9a36" />
          <stop offset=".6" stopColor="#c23b12" />
          <stop offset="1" stopColor="#3a0e05" stopOpacity="0" />
        </radialGradient>
        <pattern id="forge-bricks" width="140" height="70" patternUnits="userSpaceOnUse">
          <path d="M0 0 h140 M0 35 h140 M70 0 v35 M0 35 v35 M140 35 v35" stroke="#050302" strokeWidth="4" fill="none" />
        </pattern>
      </defs>
      <rect width="1600" height="900" fill="#120a07" />
      <rect width="1600" height="900" fill="url(#forge-bricks)" opacity=".7" />
      <ellipse className="forge-glow" cx="1120" cy="640" rx="560" ry="420" fill="url(#forge-mouth)" opacity=".75" />
      <path fill="#080403" d="M900 900 V560 a220 200 0 0 1 440 0 V900z" opacity=".55" />
      <path fill="#070302" d="M470 820 h300 l-30 -40 h-60 v-40 h80 l40 -30 h-260 l20 30 h70 v40 h-60z" />
      <path fill="#0a0503" d="M0 840 h1600 v60 h-1600z" />
    </svg>
  );
}

function Camp() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="camp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#05070d" />
          <stop offset=".7" stopColor="#151c2b" />
        </linearGradient>
        <radialGradient id="camp-fire" cx=".5" cy="1">
          <stop offset="0" stopColor="#ffb055" stopOpacity=".85" />
          <stop offset=".45" stopColor="#c8501b" stopOpacity=".35" />
          <stop offset="1" stopColor="#c8501b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#camp-sky)" />
      <Stars max={420} />
      <path fill="#0c111c" d="M0 600 L90 520 L140 560 L230 470 L330 580 L420 520 L520 600 L700 560 L900 610 L1100 540 L1220 590 L1340 500 L1460 580 L1600 540 L1600 900 L0 900Z" />
      <ellipse className="fire-glow" cx="800" cy="900" rx="760" ry="430" fill="url(#camp-fire)" />
      <path fill="#080a10" d="M1050 830 L1180 650 L1310 830z" />
      <path fill="#05070b" d="M1180 650 L1200 830 L1160 830z" opacity=".6" />
      <path fill="#06080c" d="M0 840 Q400 800 800 830 T1600 820 L1600 900 L0 900Z" />
    </svg>
  );
}

function Arcane() {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="arc-bg" cx=".5" cy=".45">
          <stop offset="0" stopColor="#2a1650" />
          <stop offset=".6" stopColor="#110a24" />
          <stop offset="1" stopColor="#06040e" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#arc-bg)" />
      <g className="rune-circle" fill="none" stroke="#9a86ff" strokeOpacity=".32">
        <circle cx="800" cy="430" r="300" strokeWidth="2" />
        <circle cx="800" cy="430" r="262" strokeWidth="1" strokeDasharray="4 10" />
        <circle cx="800" cy="430" r="190" strokeWidth="1.5" />
        <path d="M800 130 L1060 580 L540 580Z M800 730 L540 280 L1060 280Z" strokeWidth="1.2" />
        <g fill="#b8a9ff" fillOpacity=".38" stroke="none" fontFamily="serif" fontSize="26">
          {"ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ".split("").map((rune, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <text key={i} x={800 + Math.cos(a) * 281} y={438 + Math.sin(a) * 281} textAnchor="middle">
                {rune}
              </text>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

const SCENES: Record<string, () => React.ReactElement | null> = {
  desert: Desert,
  moon: Moon,
  workshop: Workshop,
  forge: Forge,
  camp: Camp,
  arcane: Arcane,
  plain: () => null,
};
const PARTICLES: Record<string, string> = {
  desert: "dust",
  moon: "dust",
  workshop: "dust",
  forge: "ember",
  camp: "ember",
  arcane: "mote",
};

/** The painted backdrop behind the ledger, plus drifting dust, embers or motes. */
export const Scenery = memo(function Scenery({ environment }: { environment: string }) {
  const Scene = SCENES[environment] || SCENES.desert;
  const particle = PARTICLES[environment];
  return (
    <div className={`scenery scene-${environment}`} aria-hidden="true">
      <div className="scenery-art">
        <Scene />
      </div>
      {particle && (
        <div className={`particles ${particle}`}>
          {MOTES.map(([x, d, s], i) => (
            <i
              key={i}
              style={
                {
                  "--x": `${(x * 100).toFixed(1)}%`,
                  "--delay": `${(-d * 14).toFixed(2)}s`,
                  "--dur": `${(9 + s * 9).toFixed(2)}s`,
                  "--size": `${(2 + s * 3).toFixed(1)}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div className="scenery-vignette" />
    </div>
  );
});
