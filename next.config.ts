import type { NextConfig } from "next";
import {
  MEDIA_PROXY_PREFIX,
  getServerApiOrigin,
  assertApiBaseConfigured,
} from "./src/config/apiBase";

/**
 * Fails the BUILD when the backend API is not configured.
 *
 * `BACKEND_API_URL` is a server-only variable (no `NEXT_PUBLIC_` prefix), so
 * Next.js replaces it with `undefined` in the browser bundle. That is exactly
 * what keeps the backend host out of the client code — and it is also why the
 * build has to verify that the variable exists: the browser cannot fall back
 * to a sensible default.
 *
 * The error message names the variable, so the problem is obvious.
 */
assertApiBaseConfigured();

/**
 * The real backend base URL and origin, read on the server only.
 *
 * They are used to build the rewrite destinations. An empty string means the
 * rewrite is simply not registered (development without a backend).
 */
const backendOrigin = getServerApiOrigin();

/**
 * Allowed image origins for `next/image`.
 *
 * The backend host is deliberately NOT part of this list: the backend images
 * are served through the same-origin media proxy, so the browser never loads
 * them from a remote host. The remaining entries are the public third-party
 * CDNs the app legitimately loads from the browser.
 */
const allowedImageHosts = [
  { protocol: "https" as const, hostname: "image.tmdb.org" },
  { protocol: "https" as const, hostname: "res.cloudinary.com" },
  { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
  // Static fallback images used by the mock data and the admin screens.
  { protocol: "https" as const, hostname: "images.unsplash.com" },
  // Posters returned by the crawl source (the backend proxies the absolute URL).
  { protocol: "https" as const, hostname: "img.nguonc.com" },
  // YouTube trailer thumbnails.
  { protocol: "https" as const, hostname: "img.youtube.com" },
  { protocol: "https" as const, hostname: "i.ytimg.com" },
];

/**
 * @section Route aliasing
 *
 * All client-facing pages now live under `src/pages/client/*` so that
 * Admin / Auth / Api / Common stay cleanly separated at the filesystem
 * level. To keep public URLs stable (e.g. `/browse/movies`, `/movie/[slug]`,
 * `/profile`, `/search`, `/user/profile`...) we use Next.js `rewrites()`
 * to map the legacy public path to the new internal one transparently —
 * the user-facing URL never changes, the underlying page file does.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: allowedImageHosts.map(({ protocol, hostname }) => ({
      protocol,
      hostname,
      pathname: "/**",
    })),
  },
  async rewrites() {
    const rewrites: { source: string; destination: string }[] = [
      // Homepage: physical file is at /client (src/pages/client/index.tsx).
      { source: "/", destination: "/client" },
      // Browse
      { source: "/browse/:path*", destination: "/client/browse/:path*" },
      // Country / Genre (dynamic slug)
      { source: "/country/:slug", destination: "/client/country/:slug" },
      { source: "/genre/:slug", destination: "/client/genre/:slug" },
      // Movie: detail + nested watch
      { source: "/movie/:path*", destination: "/client/movie/:path*" },
      // Performer
      { source: "/performer", destination: "/client/performer" },
      { source: "/performer/:id", destination: "/client/performer/:id" },
      // Profile / Rankings
      { source: "/profile", destination: "/client/profile" },
      { source: "/rankings", destination: "/client/rankings" },
      // Search
      { source: "/search", destination: "/client/search" },
      { source: "/search/history", destination: "/client/search/history" },
      // User
      { source: "/user/favorites", destination: "/client/user/favorites" },
      { source: "/user/history", destination: "/client/user/history" },
      { source: "/user/premium", destination: "/client/user/premium" },
      { source: "/user/profile", destination: "/client/user/profile" },
      { source: "/user/watch-later", destination: "/client/user/watch-later" },
      // Offline fallback page for PWA / Service Worker
      { source: "/offline", destination: "/common/offline" },
    ];

    // The MEDIA proxy only.
    //
    // The API is NOT handled by a rewrite: it goes through the Next.js API
    // route `src/pages/api/backend/[...segments].ts`, which forwards the
    // request to the backend. A rewrite on `/api/backend` would take
    // precedence over that route and would bypass the proxy, which is
    // needed to keep the backend host out of the browser.
    if (backendOrigin) {
      // The uploaded assets (`/uploads/...`), which live at the ROOT of the
      // backend and therefore NOT under `/api/v1`.
      rewrites.push({
        source: `${MEDIA_PROXY_PREFIX}/:path*`,
        destination: `${backendOrigin}/:path*`,
      });
    }

    return rewrites;
  },
};

export default nextConfig;
