# Blackpowder Ledger — working notes

Blackpowder Ledger is a client-only React 19 + TypeScript PWA built with Vite
and deployed to GitHub Pages by `.github/workflows/ci.yml`.

## Product direction

Blackpowder Ledger is a tactile D&D gunsmith armory and combat companion. Preserve its rough, handmade gunslinger character. Avoid replacing large, visual, physical interactions with tiny generic controls or sleek corporate UI. Cartridge silhouette and artwork are primary identifiers, not decoration.

Important established decisions:

- Tactical Selection: the player may choose any loaded ammunition type.
- Selected ammo type persists after firing and falls back intelligently when exhausted.
- All cartridge animations are visible by default; animation density remains configurable.
- Lever-action and revolver loading/firing must remain mechanically distinct.
- Cartridge artwork stays upright in magazines and presets.
- The Bounty Board theme should remain dark, weathered, and readable.
- Armory state autosaves locally and must migrate legacy v3/v4 data.
- The app remains installable and usable offline as a PWA.

## Commands

```bash
npm ci
npm run dev      # Vite dev server (no service worker in dev)
npm run check    # eslint + tsc + vitest — run before committing
npm run build    # tsc + production build into dist/ (also writes dist/sw.js)
npm run preview  # serve dist/ to test the PWA and offline mode
```

## Architecture map

- `src/lib/ledger.ts` — all armory rules as pure functions over a state draft: ammo accounting on load/unload/fire, Tactical Selection fallback, presets, crafting, reminders. Put new rules here and test them in `tests/ledger.test.ts`.
- `src/lib/store.ts` — the single state store. `commit(recipe, label, kind)` is undoable and logged; `passive(recipe)` is for preferences/navigation. Recipes mutate a fresh clone and may return `false` to abort. Always read the latest state via the store (`store.getState()`) inside timers or async flows, never a render-time copy.
- `src/lib/migrate.ts` — `normalize()` turns any v3/v4/v5 save or exported file into a valid state; `loadSavedState()` / `saveState()` wrap localStorage.
- `src/App.tsx` — layout, overlays, fire/reload/unload sequences, keyboard shortcuts.
- `src/components/` — one file per screen or dialog. `Cartridge.tsx` is the cartridge design system (families, projectiles, materials, bands, markings, effects); `ui.tsx` holds shared controls including the focus-trapping `Modal`.
- `src/styles/globals.css` — complete visual system, themes, weapon/reload/fire animations, accessibility states. Class names in components are load-bearing for this file.
- `pwa/` — service-worker template and the Vite plugin that injects the precache list and a content-hash cache version at build time (no manual cache bumps).
- `public/manifest.webmanifest` — install metadata; URLs are relative so the app works under `/<repo>/` on GitHub Pages.

## Persistence

Primary state lives in `localStorage` under `blackpowder-ledger-v5`. The loader falls back to `blackpowder-ledger-v4` and `blackpowder-ledger-v3`, and copies an unreadable save to `blackpowder-ledger-unreadable-backup` before autosave can overwrite it. The last crafting batch uses `blackpowder-last-batch`.

Do not rename or discard these keys without adding a migration. When changing state shape, bump `version`, extend `normalize()`, and add a migration test. Export/import is the portable backup and the way to move saves between sites.

## Safe change checklist

When changing cartridge visuals, verify the same round in inventory, magazine/cylinder, presets, reload animation, firing selection, and the custom-ammunition editor. Design and placement/rotation are deliberately separate concerns.

When changing weapon behavior, test the lever-action and revolver independently:

- ammo accounting on load, unload, fire, and undo;
- upright static displays versus physically correct animation rotation;
- revolver chamber gaps and indexing;
- no revolver casing ejection;
- rifle lever cycle, feed, and casing ejection;
- Tactical Selection persistence and fallback.

Keyboard shortcuts must stay inactive while any dialog or the loading sequence is open, and must never swallow browser shortcuts (only Ctrl/⌘+Z is handled).
