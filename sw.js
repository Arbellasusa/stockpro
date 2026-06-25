/* ═══════════════════════════════════════════════════════════
   Arbella'sStock WMS — Service Worker v7
   Hotel Arbellas · Plantation, FL
   ═══════════════════════════════════════════════════════════
   v7 CHANGES:
   - Bumped cache name → forces all devices to re-download
   - index.html: NETWORK-FIRST (always gets latest version)
   - CDN libs: cache-first (speeds up load)
   - Firebase/Firestore: bypass (never cache real-time data)
   - Auto-skipWaiting → no "waiting" state on iPhone
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'arbellastock-wms-v7';

const PRECACHE_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
];

const NO_CACHE_HOSTS = [
  'firebase',
  'firestore',
  'googleapis',
  'firebaseio',
  'identitytoolkit',
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  console.log('[SW v7] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => { console.warn('[SW v7] Pre-cache error:', err.message); return self.skipWaiting(); })
  );
});

/* ── ACTIVATE: delete ALL old caches ── */
self.addEventListener('activate', event => {
  console.log('[SW v7] Activating — purging old caches...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW v7] Deleted:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

/* ── FETCH ── */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const p = url.pathname;

  /* Firebase / Firestore — never cache */
  if (NO_CACHE_HOSTS.some(h => url.hostname.includes(h))) return;

  /* index.html — NETWORK FIRST, always get latest */
  if (p.endsWith('/') || p.endsWith('/index.html') || p.includes('/stockpro') ) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  /* CDN libs — cache first */
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  /* Icons / static — cache first */
  if (['.png','.jpg','.svg','.ico','manifest.json'].some(ext => p.endsWith(ext))) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  /* Everything else — network first */
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

/* ── MESSAGE: force update from app ── */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});
