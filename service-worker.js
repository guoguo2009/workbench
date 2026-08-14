const CACHE = 'wb-v2';
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // 清掉旧版本缓存，避免一直显示旧首页
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // 首页 / 页面导航：网络优先，保证每次都能看到最新问候语
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const resp = await fetch(req);
        cache.put(req, resp.clone());
        return resp;
      } catch {
        return (await cache.match(req)) || (await fetch(req));
      }
    })());
    return;
  }

  // 静态资源（JS/CSS/图标/AI日报）：先用缓存，后台再更新
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((resp) => {
      if (resp && resp.status === 200) cache.put(req, resp.clone());
      return resp;
    }).catch(() => cached);
    return cached || network;
  })());
});
