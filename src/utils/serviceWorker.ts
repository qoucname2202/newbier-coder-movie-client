/**
 * @file serviceWorker.ts
 * @description Helpers to register and update the offline service worker
 * (served from /sw.js). Only runs in the browser.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Trigger immediate background update check so outdated workers are retired
        registration.update().catch(() => {});

        const installing = registration.installing;
        if (installing) {
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('swUpdateReady'));
            }
          });
        }
      })
      .catch((err) => {

      });

    setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => registration.update());
    }, ONE_HOUR_MS);
  });

  window.addEventListener('online', () => {
    window.dispatchEvent(new CustomEvent('appOnline'));
  });
  window.addEventListener('offline', () => {
    window.dispatchEvent(new CustomEvent('appOffline'));
  });
}

export function updateServiceWorker(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => registration.update());
}
