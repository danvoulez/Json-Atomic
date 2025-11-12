/**
 * Service Worker for Minicore PWA
 * Provides offline-first caching with cache-first strategy
 */

const VERSION = 'minicore-sw-v1';
const CACHE_NAME = VERSION;

// Static assets to cache immediately on install
const ASSETS = [
  '/runtime.html',
  '/dist/browser/minicore.browser.js',
  '/dist/browser/minicore.worker.js',
  '/public/manifest.webmanifest',
  '/public/icon-192.svg',
  '/public/icon-512.svg',
  '/examples/demo_span.json',
  '/examples/code_execution.json',
  '/examples/prompt_span.json',
  '/examples/test_span.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Add assets individually to avoid failing the entire cache if one fails
        return Promise.allSettled(
          ASSETS.map(url =>
            cache.add(url).catch(err => {
              console.warn('[SW] Failed to cache:', url, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[SW] Install complete');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', VERSION);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[SW] Fetching from network:', url.pathname);
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Only cache same-origin requests
            if (url.origin !== location.origin) {
              return response;
            }

            // Clone the response before caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', url.pathname, error);

            // Return offline fallback if available
            if (url.pathname === '/' || url.pathname === '/runtime.html') {
              return caches.match('/runtime.html');
            }

            throw error;
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});
