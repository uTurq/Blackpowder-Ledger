# Blackpowder Ledger

A tactile D&D gunsmith armory and combat companion for the AC-3 Gunsmith.
Track ammunition, load a lever-action and a revolver round by round, fire with
Tactical Selection, craft new cartridges, save magazine loadouts, and keep
combat reminders, all in a rough, handmade gunslinger interface.

It runs entirely in the browser: no account and no server. Everything saves to
the device automatically, and the app installs as an offline PWA.

## Using it

- **Armory**: pick a weapon, tap any loaded cartridge to make it the next shot,
  then **Fire**. Combat Mode adds a thumb-reach dock, turn tracking and live
  effect reminders. Shortcuts: <kbd>Space</kbd> fire (Combat Mode),
  <kbd>R</kbd> reload, <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Z</kbd> undo,
  <kbd>Esc</kbd> close.
- **Workshop**: queue a crafting batch against your gold.
- **Loadouts**: one-tap magazine presets that show shortages before combat.
- **Settings**: environments, materials, animation density, weapon finishes, a
  full cartridge designer, and **Data & Saves** for export/import.

Every change to ammunition, gold or loadouts can be undone.

### Moving saves from the old ChatGPT Sites version

Saves live in each website's own browser storage, so they don't follow you to a
new address. Once, on the old site: **Settings → Data & Saves → Export Portable
Save**. Then on the new site: **Import Save** and pick that file.

## Development

Requires Node.js 22.13 or newer.

```bash
npm ci          # install exact locked dependencies
npm run dev     # local dev server with hot reload
npm run check   # lint + typecheck + tests
npm run build   # production build into dist/
npm run preview # serve the production build locally (offline mode works here)
```

> If `npm install` (not `npm ci`) crashes on npm 10 with
> `Cannot read properties of null (reading 'edgesOut')`, run it with npm 11:
> `npx npm@11 install`. `npm ci` works on either.

## Deploying

`.github/workflows/ci.yml` lints, tests and builds every push and pull request,
and deploys `main` to GitHub Pages. One-time setup: in the repository's
**Settings → Pages**, set **Source** to **GitHub Actions**.

The build uses relative URLs, so `dist/` also works from any static host
(Netlify, Cloudflare Pages, a subfolder on your own server) without changes.

## Project layout

```
src/
  App.tsx            screen layout, dialogs, firing/reload flows, shortcuts
  lib/
    ledger.ts        pure armory rules: loading, firing, crafting, presets
    store.ts         state + undo history + debounced autosave
    migrate.ts       save loading, v3/v4/v5 migration, import parsing
    defaults.ts      factory ammunition, weapons, presets, storage keys
    types.ts         shared types
  components/        one file per screen or dialog; Cartridge.tsx is the
                     cartridge design system and renderer
  styles/            visual system, themes and animations
pwa/                 service-worker template + Vite plugin that fills in the
                     precache list and cache version at build time
tests/               unit tests for the rules and migration, plus UI tests
```
