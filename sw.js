/* ═══════════════════════════════════════════════════
   Arbella'sStock WMS v3 — Service Worker
   Arbella's Family · Plantation, FL
   ═══════════════════════════════════════════════════
   FIXES:
   - Removed ./css/app.css and ./js/app.js (don't exist)
   - index.html is self-contained (CSS+JS inline)
   - Bumped to stockpro-v2 to clear stale v1 cache
   ═══════════════════════════════════════════════════ */

const CACHE_NAME = 'arbellastock-wms-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// External CDN assets cached on first use (network-first, then cache)
const CDN_HOSTS = [
  'cdn.jsdelivr.net',
];

self.addEventListener('install', e => {
  console.log('[SW] Installing arbellastock-wms-v3...');
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => {
        console.log('[SW] Core assets cached');
        return self.skipWaiting();
      })
      .catch(err => console.error('[SW] Install failed:', err))
  );
});

self.addEventListener('activate', e => {
  console.log('[SW] Activating — clearing old caches...');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // CDN resources — network first, fallback to cache
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Firebase / Firestore — always network, never cache (real-time data)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis')
  ) {
    return; // Let browser handle normally
  }

  // App shell — cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback: serve index.html for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
