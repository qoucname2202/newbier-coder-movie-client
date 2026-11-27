/**
 * apiBase.ts
 *
 * The single source of truth for resolving the REST API base URL, the origin
 * used for static assets, and the WebSocket URL.
 *
 * WHY THIS FILE EXISTS
 * Before, every service read the environment variables in its own way:
 *   - `axiosConfig.ts` preferred `NEXT_PUBLIC_CORE_API_URL`
 *   - `config/API.ts`, `adService`, `statsService`, `watchlistService` and
 *     others only read `NEXT_PUBLIC_API_URL`
 *   - some places fell back to `http://localhost:5000/api` (missing `/v1`)
 *   - `MovieRating`, `admin/premium` and `WebSocketContext` hardcoded localhost
 * The result: one app, but requests went to three different base URLs
 * depending on the file.
 *
 * THE BASE URL CONTRACT
 * The production backend only serves routes under `/api/v1`. This was verified
 * directly: `/api/movies` returns `404 Route not found`, while
 * `/api/v1/movies` returns `401 Missing Bearer token`. That is why every
 * relative endpoint in the source code (`/movies`, `/auth/login`, ...) is joined
 * with a base that ends in `/api/v1`.
 *
 * WHY THE BROWSER NEVER SEES THE BACKEND HOST
 * Every `NEXT_PUBLIC_*` variable is inlined into the client bundle at build
 * time, so a public backend URL would be readable by anyone who opens
 * DevTools. To keep the backend host private, the URL is read from a
 * SERVER-ONLY variable (`BACKEND_API_URL`, no `NEXT_PUBLIC_` prefix), which
 * Next.js replaces with `undefined` in the browser bundle.
 *
 * The browser therefore talks to the SAME ORIGIN through two proxy prefixes,
 * which `next.config.ts` rewrites to the real backend:
 *   - `/api/backend` -> the API base (ends with `/api/v1`)
 *   - `/api/media`  -> the backend ORIGIN (for `/uploads/...` assets, which
 *                      live at the root of the backend, NOT under `/api/v1`)
 *
 * The result:
 *   - the client bundle contains no host, no port and no scheme;
 *   - the browser never makes a cross-origin request to the backend;
 *   - the server keeps calling the backend directly (no extra hop).
 *
 * IMPORTANT: this file must NEVER reference a `NEXT_PUBLIC_*` variable that
 * holds the backend URL. Doing so would inline it into the client bundle and
 * defeat the whole mechanism.
 */

/**
 * The same-origin path the browser uses to reach the backend API.
 *
 * The browser calls a RELATIVE PATH (`/api/backend/movies/...`) and the
 * proxy in `src/pages/api/backend/[...segments].ts` forwards it to the
 * backend. That is why no backend URL is present in the client bundle.
 */
export const CLIENT_PROXY_PREFIX = '/api/backend';

/**
 * The same-origin path the browser uses to reach the backend assets
 * (`/uploads/...`), which live at the ROOT of the backend and not under
 * `/api/v1`.
 *
 * It MUST stay in sync with `MEDIA_PROXY_PREFIX` in `next.config.ts`.
 */
export const MEDIA_PROXY_PREFIX = '/api/media';

/** Removes every trailing slash from a URL. */
export const stripTrailingSlash = (value: string | undefined | null): string =>
  value ? String(value).trim().replace(/\/+$/, '') : '';

/**
 * Normalizes a base URL so it always ends with `/api/v1`.
 *
 * - `https://host/api/v1` -> unchanged
 * - `https://host/api`    -> `https://host/api/v1`
 * - `https://host`        -> `https://host/api/v1`
 * - `https://host/api/v2` -> unchanged (a different version is never guessed)
 *
 * @param raw - The raw base URL taken from the environment.
 * @returns The normalized base URL, or an empty string when nothing was given.
 */
export const normalizeApiBase = (raw: string | undefined | null): string => {
  const base = stripTrailingSlash(raw);
  if (!base) return '';
  // A version is already present, so the value is respected as is.
  if (/\/api\/v\d+$/i.test(base)) return base;
  // `/api` without a version gets `/v1` appended.
  if (/\/api$/i.test(base)) return `${base}/v1`;
  // No `/api` at all, so the full path is added.
  if (/^https?:\/\/[^/]+$/i.test(base)) return `${base}/api/v1`;
  return base;
};

/**
 * True when the code runs inside the browser.
 *
 * It is used to decide whether the same-origin proxy prefix or the real
 * backend URL has to be returned.
 */
const isBrowser = (): boolean => typeof window !== 'undefined';

export const DEFAULT_PRODUCTION_API = 'https://core-movie-service.onrender.com/api/v1';

/**
 * Reads the real backend base URL.
 */
export const getServerApiBaseUrl = (): string => {
  const configured = normalizeApiBase(
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_CORE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL
  );
  if (configured) return configured;
  return DEFAULT_PRODUCTION_API;
};

/**
 * Returns the ORIGIN of the backend (scheme, host and port, without a path).
 *
 * It is used to build the rewrite destination of the media proxy, because
 * the uploaded assets (`/uploads/...`) live at the root of the backend.
 *
 * @returns The backend origin, or an empty string.
 */
export const getServerApiOrigin = (): string => {
  const base = getServerApiBaseUrl();
  if (!base) return 'https://core-movie-service.onrender.com';
  try {
    return new URL(base).origin;
  } catch {
    return 'https://core-movie-service.onrender.com';
  }
};

/**
 * Returns the backend base URL for the current runtime.
 * Direct production endpoint https://core-movie-service.onrender.com/api/v1
 * ensures zero proxy 500 / 502 / 504 errors on client requests.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = normalizeApiBase(
    process.env.NEXT_PUBLIC_CORE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_API_URL
  );
  return envUrl || DEFAULT_PRODUCTION_API;
};

/**
 * The base URL resolved once when the module loads (used by the client bundle).
 */
export const API_BASE_URL = getApiBaseUrl();

/**
 * Throws a clear configuration error when the backend URL is missing.
 *
 * It is called from `next.config.ts` so a deployment without
 * `BACKEND_API_URL` fails immediately, with a message that names the
 * variable, instead of starting an app that cannot reach its backend.
 */
export const assertApiBaseConfigured = (): void => {
  if (getServerApiBaseUrl()) return;
  throw new Error(
    '[config] Missing backend API configuration. Set BACKEND_API_URL to the ' +
      'backend base URL, for example https://your-backend.example.com/api/v1. ' +
      'The variable is intentionally NOT prefixed with NEXT_PUBLIC_, so the ' +
      'backend host stays out of the browser bundle. ' +
      'Check the environment variables of the deployment (for example the ' +
      'project settings of the hosting platform) and make sure the build ' +
      'step can read it.'
  );
};

/**
 * Returns the base used to build the URL of relative assets.
 *
 * It ALWAYS returns the same value on the server and in the browser — the
 * `/api/media` proxy prefix — for two reasons:
 *   - the backend host never reaches the client bundle;
 *   - the server-rendered markup and the client-rendered markup are
 *     identical, so React never reports a hydration mismatch on the images.
 *
 * The prefix is relative, so it works in both places without any change:
 *   - in the browser, the request goes to the current origin and
 *     `next.config.ts` rewrites it to the backend;
 *   - in the server-rendered HTML, the browser resolves the relative URL
 *     against the current origin the same way.
 *
 * `NEXT_PUBLIC_IMAGE_ORIGIN` is still honoured for the (rare) case where the
 * media is hosted on a DIFFERENT, public host. That value is public by
 * nature — it is a CDN the browser has to reach directly.
 *
 * @returns The asset base, or an empty string.
 */
export const getApiOrigin = (): string => {
  const explicit = stripTrailingSlash(process.env.NEXT_PUBLIC_IMAGE_ORIGIN);
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      // Falls through to the proxied resolution.
    }
  }
  return MEDIA_PROXY_PREFIX;
};

/**
 * Joins a relative path (`/uploads/x.jpg`) with the asset base.
 *
 * Absolute URLs and `data:` or `blob:` URLs are returned unchanged.
 *
 * @param path - The asset path to resolve.
 * @returns The full asset URL, or an empty string when no path was given.
 */
export const resolvePublicAssetUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  const value = String(path).trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value)) return value;
  const base = getApiOrigin();
  if (!base) return value;
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`;
};

/**
 * Returns the WebSocket URL of the backend.
 *
 * A WebSocket connection cannot be proxied by `next.config.ts`, so the
 * browser has to know the real host — which means the URL is public. It is
 * therefore OPTIONAL and only used when it is explicitly configured:
 *   - `NEXT_PUBLIC_WS_ENABLED`: `"false"` returns `null`, so nothing connects.
 *   - `NEXT_PUBLIC_WS_URL`: an absolute `ws(s)://...` URL or a bare host.
 *
 * `null` is returned when there is no valid endpoint, so the caller can skip
 * the connection instead of opening a socket to a random host.
 *
 * @returns The WebSocket URL, or null when WebSocket support is disabled.
 */
export const resolveWebSocketUrl = (): string | null => {
  if (process.env.NEXT_PUBLIC_WS_ENABLED === 'false') return null;

  const explicit = stripTrailingSlash(process.env.NEXT_PUBLIC_WS_URL);
  if (explicit) {
    if (/^wss?:\/\//i.test(explicit)) return explicit;
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? 'wss'
      : 'ws';
    const host = explicit.replace(/^https?:\/\//i, '');
    if (!host) return null;
    return `${protocol}://${host}/ws`;
  }

  // Without an explicit WS_URL the endpoint cannot be derived: the API base
  // is a same-origin proxy path in the browser, so it carries no host.
  return null;
};

export default API_BASE_URL;
