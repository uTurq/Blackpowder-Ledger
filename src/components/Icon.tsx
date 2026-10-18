// A small engraved-line icon set. Strokes use currentColor so icons take the
// colour of whatever control they sit in.
const PATHS: Record<string, React.ReactNode> = {
  armory: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  workshop: (
    <>
      <path d="M3.5 17.5h17M6 17.5c0-2.5 1.5-3.5 4-3.5h4.5c1.8 0 3.2-1 3.5-3H8.5C6 11 4.5 9.5 4.5 7.5" />
      <path d="M8 20.5h8M10 17.5v3M14 17.5v3" />
    </>
  ),
  presets: (
    <>
      <path d="M5 20.5v-9.5l1.75-4.5L8.5 11v9.5zM11.25 20.5v-9.5L13 6.5l1.75 4.5v9.5zM17.5 20.5v-9.5l1.75-4.5L21 11v9.5z" transform="translate(-1.5 -1)" />
      <path d="M2.5 15.5h19" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
      <circle cx="12" cy="12" r="6.4" />
    </>
  ),
  reload: <path d="M19.5 10.5A7.8 7.8 0 0 0 5.7 7.2L4 9M4 4.5V9h4.5M4.5 13.5a7.8 7.8 0 0 0 13.8 3.3L20 15M20 19.5V15h-4.5" />,
  undo: <path d="M9 14.5L4 9.5l5-5M4 9.5h10.5a5.5 5.5 0 0 1 0 11H10.5" />,
  history: (
    <>
      <path d="M5 4.5h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17.5a3 3 0 0 1 3-3h11M9 8.5h6M9 11h4" />
    </>
  ),
  combat: (
    <>
      <path d="M12 2.8l2.3 4.5 5-.3-2.8 4.3 2.8 4.3-5-.3L12 19.8l-2.3-4.5-5 .3 2.8-4.3-2.8-4.3 5 .3z" />
      <circle cx="12" cy="11.3" r="2.1" />
    </>
  ),
  turn: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  edit: (
    <>
      <path d="M4 20l1-4.2L16 4.8a2.1 2.1 0 0 1 3 3L8 18.8z" />
      <path d="M14 7l3 3" />
    </>
  ),
  download: <path d="M12 3.5v12M6.5 10l5.5 5.5 5.5-5.5M4.5 20.5h15" />,
  upload: <path d="M12 20.5v-12M6.5 14l5.5-5.5 5.5 5.5M4.5 3.5h15" />,
  spark: <path d="M12 2.5c.9 5 2.6 6.6 7.5 7.5-4.9.9-6.6 2.5-7.5 7.5-.9-5-2.6-6.6-7.5-7.5 4.9-.9 6.6-2.5 7.5-7.5z" />,
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  coins: (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="3" />
      <path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  dice: (
    <>
      <path d="M12 2.5l8.3 4.8v9.4L12 21.5l-8.3-4.8V7.3z" />
      <path d="M12 7l4.3 7.5H7.7z" />
    </>
  ),
  flame: <path d="M12 21c-3.8 0-6-2.6-6-5.6 0-4 3.6-5.6 3.6-9.4 2.6 1.3 4.2 3.7 4.2 6.3.9-.6 1.5-1.6 1.6-2.8 1.6 1.4 2.6 3.4 2.6 5.6 0 3.3-2.3 5.9-6 5.9z" />,
  sound: (
    <>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
};

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name] ?? PATHS.spark}
    </svg>
  );
}
