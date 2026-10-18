import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  assert.match(await response.text(), developmentPreviewMeta);
});

test("ships the restored tactile armory controls", async () => {
  const source = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /armory-fire-tab/);
  assert.match(source, /Elemental Shot/);
  assert.match(source, /COIN LEDGER/);
  assert.match(source, /TUBULAR MAGAZINE CUTAWAY/);
  assert.match(source, /OPEN CYLINDER/);
  assert.match(source, /blackpowder-ledger-v5/);
  assert.match(source, /blackpowder-ledger-v4/);
  assert.match(source, /blackpowder-ledger-v3/);
});

test("keeps Prototype III depth in the cartridge workshop", async () => {
  const source = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const cartridge = await readFile(
    new URL("../app/cartridge.tsx", import.meta.url),
    "utf8",
  );

  for (const control of [
    "Cartridge family",
    "Projectile profile",
    "Case material",
    "Projectile material",
    "Tip treatment",
    "Case band",
    "Casing marking",
    "Effect placement",
    "Effect intensity",
  ]) {
    assert.match(source, new RegExp(control));
  }

  assert.match(cartridge, /export const CARTRIDGE_FAMILIES/);
  assert.match(cartridge, /export const PROJECTILES/);
  assert.match(cartridge, /family-\$\{visual\.family\}/);
  assert.match(cartridge, /silhouette/);
  assert.match(cartridge, /shotgun:/);
});

test("publishes an installable offline app manifest", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("pwa-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/manifest.webmanifest"),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/manifest\+json/i,
  );
  const manifest = await response.json();
  assert.equal(manifest.name, "Blackpowder Ledger");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "/");
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
});

test("ships the offline worker and in-app installation control", async () => {
  const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const pwa = await readFile(new URL("../app/pwa.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(worker, /blackpowder-ledger-offline-v1/);
  assert.match(worker, /request\.mode === "navigate"/);
  assert.match(worker, /cacheFirstAsset/);
  assert.match(worker, /CACHE_URLS/);
  assert.match(pwa, /navigator\.serviceWorker[\s\S]*?\.register\("\/sw\.js"/);
  assert.match(pwa, /performance[\s\S]*?\.getEntriesByType\("resource"\)/);
  assert.match(pwa, /beforeinstallprompt/);
  assert.match(page, /OFFLINE FIELD KIT/);
  assert.match(page, /Install App/);
});
