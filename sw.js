const CACHE_NAME = "jlpt-cache-v1";

const urlsToCache = [
  "./",
  "./index.html",
  "./game.js",
  "./manifest.json"
];

// =====================
// INSTALL (โหลดครั้งแรก)
// =====================
self.addEventListener("install", event => {
  console.log("Service Worker: Installed");

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// =====================
// FETCH (ดัก request)
// =====================
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(res => res)
      .catch(() => caches.match(event.request))
  );
});
