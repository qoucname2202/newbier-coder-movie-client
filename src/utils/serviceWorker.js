// Register the service worker to enable offline functionality
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                const event = new CustomEvent('swUpdateReady');
                window.dispatchEvent(event);
              }
            });
          });
        })
        .catch((err) => {
          console.error('Service Worker registration failed: ', err);
        });
      
      setInterval(() => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }, 60 * 60 * 1000);
    });
    
    window.addEventListener('online', () => {
      window.dispatchEvent(new CustomEvent('appOnline'));
    });
    
    window.addEventListener('offline', () => {
      window.dispatchEvent(new CustomEvent('appOffline'));
    });
  }
}

// Function to update the service worker when a new version is available
export function updateServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }
}
