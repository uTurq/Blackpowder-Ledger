// Blackpowder Ledger offline worker.
// Built by pwa/vite-plugin.ts: it fills in the build version and the list of
// every file in the build, so each deploy gets a fresh cache automatically.
const CACHE_PREFIX = "blackpowder-ledger-offline-";
const CACHE_VERSION = CACHE_PREFIX + "__BUILD_VERSION__";
const PRECACHE = __PRECACHE_URLS__;
const SHELL = new URL("./", self.location.href).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) =>
        cache.addAll(PRECACHE.map((path) => new URL(path, SHELL).href)),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Pages: try the network so updates land on the next open, fall back offline.
async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(SHELL, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(SHELL)) ||
      (await cache.match(request, { ignoreSearch: true })) ||
      new Response(
        "Blackpowder Ledger could not open offline yet. Connect once, open the app, and try again.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
      )
    );
  }
}

// Build assets have content hashes in their names, so cached copies stay valid.
async function cacheFirstAsset(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SHELL)) return;
  if (url.href === self.location.href) return;
  event.respondWith(
    request.mode === "navigate" ? networkFirstPage(request) : cacheFirstAsset(request),
  );
});
