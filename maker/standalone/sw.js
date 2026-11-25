const CACHE = "flipbook-reader-v1";
const CORE = ["./", "./index.html", "./reader.js", "./pdf.mjs", "./pdf.worker.min.mjs", "./sdflip.min.js", "./sdflip.min.css", "./manifest.webmanifest"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(async cached => {
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && (request.destination === "document" || request.url.endsWith(".pdf"))) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  }));
});
