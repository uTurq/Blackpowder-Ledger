# Blackpowder Ledger — Claude Code Handoff

This is the complete source snapshot for the live Blackpowder Ledger PWA at commit `a36ea9486638160205f43e88694a1833631f3a0b`.

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

## Local setup

Requirements: Node.js 22.13 or newer. The included helper scripts are designed for Linux/WSL.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production verification:

```bash
npm test
```

Useful individual commands:

```bash
npm run build
npm run lint
npm run validate:artifact
```

## Architecture map

- `app/page.tsx` — application state, save migration, armory, workshop, presets, settings, combat logic, reload/fire behavior, dialogs, and most UI rendering.
- `app/cartridge.tsx` — reusable cartridge design system and renderer: families, projectile shapes, materials, bands, markings, effects, placement, intensity, and presets.
- `app/globals.css` — complete visual system, responsive layouts, themes, weapon/reload/fire animations, and accessibility states.
- `app/pwa.ts` — service-worker registration and install-prompt behavior.
- `app/manifest.ts` — installable-app metadata.
- `public/sw.js` — offline application-shell and runtime asset caching.
- `public/blackpowder-icon-*` — installed-app icons.
- `tests/rendered-html.test.mjs` — regression checks for rendered content and required source/PWA features.
- `.openai/hosting.json` — existing ChatGPT Sites project identity. It contains no credential, but do not replace its `project_id` when updating the same hosted Site.

## Persistence

Primary state is stored in browser `localStorage` under `blackpowder-ledger-v5`. The loader also checks `blackpowder-ledger-v4` and `blackpowder-ledger-v3` and normalizes legacy cartridge/weapon data. The last crafting batch uses `blackpowder-last-batch`.

Do not rename or discard these keys without adding a migration. Export/import remains the portable backup mechanism; there is no server database dependency during ordinary play.

## Safe change checklist

When changing cartridge visuals, verify the same round in inventory, magazine/cylinder, presets, reload animation, firing selection, and the custom-ammunition editor. Design and placement/rotation are deliberately separate concerns.

When changing weapon behavior, test the lever-action and revolver independently:

- ammo accounting on load, unload, fire, and undo;
- upright static displays versus physically correct animation rotation;
- revolver chamber gaps and indexing;
- no revolver casing ejection;
- rifle lever cycle, feed, and casing ejection;
- Tactical Selection persistence and fallback.

When changing state shape, increment/handle the version and preserve v3/v4/v5 migration. When changing the PWA shell or generated asset URLs, bump the cache version in `public/sw.js` and verify a previously installed copy updates.

## Source and generated files

Edit authored files, not generated output. Do not commit `node_modules`, `dist`, `.next`, `.wrangler`, `.sites-runtime`, `outputs`, or `work`.

The original README documents the Vinext/Cloudflare Sites toolchain. The application itself is React 19 + TypeScript, built through Vite/Vinext and packaged for a Cloudflare Worker deployment.
