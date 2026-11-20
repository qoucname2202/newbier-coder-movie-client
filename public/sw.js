// Public/sw.js - Service Worker for offline functionality

const CACHE_NAME = 'moviestreaming-offline-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safe, resilient caching for offline shell assets.
      // We use individual fetch & put to avoid atomic rejection of cache.addAll
      // if any individual asset is missing (e.g. 404).
      const criticalAssets = [
        OFFLINE_URL,
        '/favicon.ico',
        '/img/icons.png'
      ];

      await Promise.allSettled(
        criticalAssets.map(async (assetUrl) => {
          try {
            const response = await fetch(assetUrl);
            if (response && response.ok) {
              await cache.put(assetUrl, response);
            }
          } catch {
            // Silently ignore asset caching failures during install
          }
        })
      );
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old caches with different name
            return cacheName.startsWith('moviestreaming-offline-') && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  // Claim any clients immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Only handle GET requests (Cache API does not support HEAD, POST, PUT, DELETE)
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 2. NEVER intercept or cache backend API routes or internal Next.js dev sockets
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  const acceptHeader = event.request.headers.get('accept');
  const isHtmlNavigation = event.request.mode === 'navigate' || 
    Boolean(acceptHeader && acceptHeader.includes('text/html'));

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // If navigation fails due to offline/network error, serve the cached offline page
        const cached = await caches.match(OFFLINE_URL);
        if (cached) return cached;
        return new Response('Bạn đang ngoại tuyến. Vui lòng kiểm tra lại kết nối mạng.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
  } else {
    // For non-HTML static assets (images, css, js), use network-first with cache fallback
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful GET responses for static assets
          if (response && response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response('', { status: 408, statusText: 'Network Request Failed' });
        })
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
