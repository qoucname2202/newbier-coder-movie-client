import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (    <Html lang="en">      <Head>
        {/* Add your Bootstrap Icons stylesheet here */}
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
        
        {/* Add Font Awesome for better icons */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        
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
                  console.log('Request blocked due to locked account:', url);
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
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}