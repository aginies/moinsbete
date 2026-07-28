/* eslint-disable no-undef */
const CACHE_VERSION = 'v7';
const PRECACHE_CACHE = `app-precache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `app-dynamic-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        '/icon-512-maskable.png',
        '/favicon.ico',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('app-'))
          .filter((name) => name !== PRECACHE_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - StaleWhileRevalidate
  if (url.hostname.includes('api.openai.com')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cache.match(request);
        }
      })
    );
    return;
  }

  // Wikimedia images - CacheFirst
  if (url.hostname.includes('upload.wikimedia.org')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response('Image not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      })
    );
    return;
  }

  // Navigation requests - NetworkFirst with fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
          return networkResponse;
        })
        .catch(async () => {
          return caches.match('/');
        })
    );
    return;
  }
});
