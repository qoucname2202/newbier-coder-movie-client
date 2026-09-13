// Register the service worker to enable offline functionality
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered: ', registration);
          
          // Handle updates - show notification to user when SW update is available
          registration.addEventListener('updatefound', () => {
            // Track the new service worker that is installing
            const newWorker = registration.installing;
            console.log('Service Worker update found!');
            
            // Check state changes during installation
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // There's a new service worker available
                console.log('New service worker installed and ready for use');
                
                // Dispatch event for UI components to show update prompt
                const event = new CustomEvent('swUpdateReady');
                window.dispatchEvent(event);
              }
            });
          });
        })
        .catch((err) => {
          console.error('Service Worker registration failed: ', err);
        });
      
      // Check for updates periodically
      setInterval(() => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }, 60 * 60 * 1000); // Check for updates every hour
    });
    
    // Handle offline/online events
    window.addEventListener('online', () => {
      console.log('Application is online again');
      // Dispatch custom event that components can listen for
      window.dispatchEvent(new CustomEvent('appOnline'));
    });
    
    window.addEventListener('offline', () => {
      console.log('Application is offline');
      // Dispatch custom event that components can listen for
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
