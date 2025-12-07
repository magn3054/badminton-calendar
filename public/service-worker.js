// serviceworker.js
const STATIC_CACHE = "badminton-static-v4"; // bump on SW changes
const RUNTIME_CACHE = "badminton-runtime-v4";

// Only pre-cache truly static, unversioned assets (NOT index.html)
const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/badminton-logo-192.png",
  "/icons/badminton-logo-512.png",
];

// Install: pre-cache static
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches and enable navigation preload
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((n) => {
          if (n !== STATIC_CACHE && n !== RUNTIME_CACHE) return caches.delete(n);
        })
      );
      // Helps network-first navigations return faster
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

// Fetch: different strategies per request type
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1) HTML navigations => network-first with cache fallback
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(networkFirstForHTML(event));
    return;
  }

  // 2) Versioned static assets (Vite hashed) => cache-first
  if (["script", "style", "image", "font"].includes(req.destination)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 3) Everything else (APIs etc.) => network-first, then cache
  event.respondWith(networkFirst(req));
});

async function networkFirstForHTML(event) {
  try {
    // Use navigation preload if available
    const preload = await event.preloadResponse;
    if (preload) return preload;

    const fresh = await fetch(event.request, { cache: "no-store" });
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(event.request, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(event.request);
    return cached || caches.match("/index.html"); // optional offline fallback
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  const res = await fetch(req);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    throw err;
  }
}

// Push notifications (unchanged)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || "Ny besked fra klubben!",
    icon: "/icons/badminton-logo-192.png",
    badge: "/icons/badminton-logo-192.png",
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Badminton Klubben", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
