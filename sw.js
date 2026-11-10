// Service worker for The Astorian.
// - Pages: always try the live site first, so new pieces appear right away.
//   If the reader is offline, show the copy saved from their last visit.
// - Images and fonts: saved after first use so they load fast and work offline.
// Change the version below only if you ever need to clear every reader's saved copy.
const VERSION = "v1";
const PAGES = "astorian-pages-" + VERSION;
const ASSETS = "astorian-assets-" + VERSION;
const OFFLINE_URL = "/offline.html";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES)
      .then((cache) => cache.addAll(["/", OFFLINE_URL]))
      .then(() => caches.open(ASSETS))
      .then((cache) => cache.addAll(["/astorianlogo.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("astorian-") && k !== PAGES && k !== ASSETS)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Pages: network first, saved copy as the fallback.
  if (request.mode === "navigate" && sameOrigin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request, { ignoreSearch: true })
            .then((saved) => saved || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Images, fonts and other files: saved copy first, refreshed in the background.
  if (sameOrigin || FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(ASSETS).then((cache) =>
        cache.match(request).then((saved) => {
          const fresh = fetch(request)
            .then((response) => {
              if (response.ok || response.type === "opaque") cache.put(request, response.clone());
              return response;
            })
            .catch(() => saved);
          return saved || fresh;
        })
      )
    );
  }
});
