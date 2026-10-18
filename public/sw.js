const CACHE_VERSION = "blackpowder-ledger-offline-v1";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/blackpowder-icon-192.png",
  "/blackpowder-icon-512.png",
  "/blackpowder-icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
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
            .filter((key) =>
              key.startsWith("blackpowder-ledger-offline-") &&
              key !== CACHE_VERSION,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put("/", response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match("/")) ||
      new Response(
        "Blackpowder Ledger could not open offline yet. Connect once, open the app, and try again.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } },
      )
    );
  }
}

async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
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
  if (url.origin !== self.location.origin || url.pathname === "/sw.js") return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    ["script", "style", "font", "image"].includes(request.destination)
  ) {
    event.respondWith(cacheFirstAsset(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === "CACHE_URLS" && Array.isArray(event.data.urls)) {
    const urls = event.data.urls
      .map((value) => {
        try {
          return new URL(value, self.location.origin);
        } catch {
          return null;
        }
      })
      .filter((url) => url?.origin === self.location.origin)
      .map((url) => url.href);
    event.waitUntil(
      caches.open(CACHE_VERSION).then((cache) =>
        Promise.allSettled(
          urls.map(async (url) => {
            const response = await fetch(url);
            if (response.ok && response.type === "basic")
              await cache.put(url, response);
          }),
        ),
      ),
    );
  }
});
