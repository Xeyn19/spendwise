const STATIC_CACHE = "spendwise-static-v1";
const PAGE_CACHE = "spendwise-pages-v1";
const STATIC_ASSETS = [
  "/offline",
  "/spendwise-logo.png",
  "/pwa-192.png",
  "/pwa-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== PAGE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLEAR_PRIVATE_CACHE") {
    event.waitUntil(caches.delete(PAGE_CACHE));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === "POST" && url.origin === self.location.origin && url.pathname === "/auth/signout") {
    event.respondWith(
      fetch(request).then(async (response) => {
        await caches.delete(PAGE_CACHE);
        return response;
      })
    );
    return;
  }

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.pathname === "/dashboard") {
            const copy = response.clone();
            void caches.open(PAGE_CACHE).then((cache) => cache.put("/dashboard", copy));
          }
          return response;
        })
        .catch(async () => {
          if (url.pathname === "/dashboard") {
            const dashboard = await caches.match("/dashboard");
            if (dashboard) return dashboard;
          }
          return (await caches.match("/offline")) ?? Response.error();
        })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || request.destination === "font") {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            void caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            void caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => undefined);
        return cached ?? (await network) ?? Response.error();
      })
    );
  }
});
