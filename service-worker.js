const CACHE = 'wb-v1';
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((resp) => {
      if (resp && resp.status === 200 && (req.url.includes('/assets/') || req.url.endsWith('index.html') || req.url.endsWith('/') || req.url.includes('ai-daily/'))) {
        cache.put(req, resp.clone());
      }
      return resp;
    }).catch(() => cached);
    return cached || network;
  })());
});
