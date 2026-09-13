// Public/sw.js - Service Worker for offline functionality

const CACHE_NAME = 'moviestreaming-offline-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache the offline page and necessary assets
      return cache.addAll([
        OFFLINE_URL,
        '/favicon.ico',
        // Add more critical assets that should be available offline
      ]);
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
  // Only intercept network requests for HTML documents
  if (event.request.mode === 'navigate' || 
     (event.request.method === 'GET' && 
      event.request.headers.get('accept').includes('text/html'))) {
    
    event.respondWith(
      fetch(event.request).catch(() => {
        // If the navigation fails due to network error, serve the offline page
        return caches.match(OFFLINE_URL);
      })
    );
  } else {
    // For non-HTML requests, use standard fetch with network-first strategy
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses for offline use
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
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
