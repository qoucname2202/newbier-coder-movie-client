import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="vi">
      <Head>
        {/* Google Fonts: Plus Jakarta Sans for pristine Vietnamese typography */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
          rel="stylesheet"
        />

        {/* Add your Bootstrap Icons stylesheet here */}
        <link          rel="stylesheet"          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
        {/* Add Font Awesome for better icons */}
        <link          rel="stylesheet"          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="          crossOrigin="anonymous"          referrerPolicy="no-referrer"        />
        {/* PWA manifest and meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e50914" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        {/* Script to prevent repeated data fetching if account locked */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && localStorage.getItem('isAccountLocked') === 'true' && window.location.pathname !== '/account-locked') {
              // Prevent data fetching and redirect to locked page
              const originalFetch = window.fetch;
              window.fetch = function(url, options) {
                if (typeof url === 'string' && url.includes('/_next/data')) {
                  return Promise.resolve(new Response(JSON.stringify({ blocked: true }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  }));
                }
                return originalFetch(url, options);
              };

              // Redirect to locked account page if not already there
              if (window.location.pathname !== '/account-locked') {
                window.location.href = '/account-locked';
              }
            }
          `
        }} />

        {/* Disable browser swipe-to-navigate history back/forward gesture globally */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              overscroll-behavior-x: none !important;
            }
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}