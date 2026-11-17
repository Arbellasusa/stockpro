/* StockPro - Service Worker v3
   Network-first for the app (so every device always gets the latest index.html),
   cache only as an offline fallback. Old caches are deleted on activate. */
const CACHE_NAME = 'stockpro-v3-20261117';
const PRECACHE = ['./manifest.json', './icon-192.png', './icon-512.png'];
const CDN_HOSTS = ['cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(req, fallbackUrl) {
  return fetch(req)
    .then(res => {
      if (res && res.ok && res.type !== 'opaque') {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    })
    .catch(() =>
      caches.match(req).then(hit => hit || (fallbackUrl ? caches.match(fallbackUrl) : undefined))
    );
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Firebase / Google APIs: never intercept (real-time data)
  if (/firebase|firestore|googleapis|gstatic|google\.com/.test(url.hostname)) return;

  // Page loads and index.html: always try the network first
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(networkFirst(req, './index.html'));
    return;
  }

  // CDN and same-origin assets: network first, cache as offline fallback
  if (CDN_HOSTS.some(h => url.hostname.includes(h)) || url.origin === self.location.origin) {
    e.respondWith(networkFirst(req));
  }
});
