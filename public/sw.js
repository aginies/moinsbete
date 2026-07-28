/* eslint-disable no-undef */
const CACHE_VERSION = 'v9';
const PRECACHE_CACHE = `app-precache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `app-dynamic-${CACHE_VERSION}`;
const ASSET_CACHE = `app-assets-${CACHE_VERSION}`;

// Install: precache app shell + chunks manifest
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_CACHE).then(async (cache) => {
      // Precache static URLs
      await cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        '/icon-512-maskable.png',
        '/favicon.ico',
        '/offline.html',
        '/sujets',
        '/image-du-jour',
        '/le-saviez-vous',
        '/portail-lexical',
        '/proverbes',
        '/idees/au-hasard',
      ]);

      // Fetch and precache all JS/CSS chunks from manifest
      try {
        const manifestResponse = await fetch('/chunks-manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          const allUrls = [...manifest.js, ...manifest.css];
          await cache.addAll(allUrls);
          console.log(`Precached ${allUrls.length} chunks`);
        }
      } catch (error) {
        console.error('Failed to precache chunks:', error);
      }
    })
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('app-'))
          .filter((name) => name !== PRECACHE_CACHE && name !== DYNAMIC_CACHE && name !== ASSET_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // App shell HTML - NetworkFirst with precache fallback
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
          // Try precache first
          const precached = await caches.match(request.url);
          if (precached) return precached;
          // Fallback to offline page
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // JS/CSS chunks - CacheFirst (precached)
  if (url.pathname.startsWith('/_next/static/chunks/')) {
    event.respondWith(
      caches.open(PRECACHE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        // Try asset cache (dynamic)
        const assetCached = await caches.open(ASSET_CACHE).then((c) => c.match(request));
        if (assetCached) return assetCached;
        // Fetch from network
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response('Asset not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      })
    );
    return;
  }

  // Fonts - CacheFirst
  if (url.pathname.endsWith('.woff2') || url.pathname.endsWith('.woff') || url.pathname.endsWith('.ttf')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response('Font not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      })
    );
    return;
  }

  // Local API routes - StaleWhileRevalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          // Return cached while fetching fresh
          fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
          }).catch(() => {});
          return cached;
        }
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response('API data not available offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      })
    );
    return;
  }

  // Wikimedia images - CacheFirst with expiration
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

  // Pixabay images - CacheFirst with shorter TTL
  if (url.hostname.includes('cdn.pixabay.com')) {
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

  // OpenAI API - StaleWhileRevalidate
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
});
