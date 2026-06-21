// sw.js — Service Worker for Golf Scorecard PWA
// Caches all app files on first load for full offline support.
// Update CACHE_VERSION when deploying new files to bust the cache.

const CACHE_VERSION = 'golf-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './courses.js',
  './rounds.js'
];

// Install: cache all files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Only handle same-origin requests (skip tile CDN etc)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful GET responses for our files
        if (response.ok && event.request.method === 'GET') {
          const url = new URL(event.request.url);
          const isAppFile = FILES_TO_CACHE.some(f =>
            url.pathname.endsWith(f.replace('./', '/'))
            || url.pathname === '/'
            || url.pathname.endsWith('/index.html')
          );
          if (isAppFile) {
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, response.clone()));
          }
        }
        return response;
      }).catch(() => cached); // If network fails and we have cache, use it
    })
  );
});
