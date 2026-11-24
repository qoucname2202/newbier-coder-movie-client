/**
 * @file pages/_document.tsx
 */
import { Html, Head, Main, NextScript } from 'next/document';
import type { DocumentContext, DocumentInitialProps } from 'next/document';

export default function Document() {
  return (
    <Html lang="vi">
      <Head>
        {/* Bootstrap Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css"
        />
        {/* Font Awesome */}
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
            if (typeof window !== 'undefined' && localStorage.getItem('isAccountLocked') === 'true' && window.location.pathname !== '/common/account-locked') {
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

              if (window.location.pathname !== '/common/account-locked') {
                window.location.href = '/common/account-locked';
              }
            }
          `
          }}
        />
      </Head>
      <body suppressHydrationWarning>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// `getInitialProps` is kept off here on purpose: Next.js's default static
// document is already sufficient and keeps initial HTML fast. If we ever
// need per-request data, uncomment and type the props/context.
export async function getInitialProps(
  _ctx: DocumentContext
): Promise<DocumentInitialProps> {
  const initialProps: DocumentInitialProps = await (await import('next/document')).default.getInitialProps(_ctx);
  return { ...initialProps };
}
