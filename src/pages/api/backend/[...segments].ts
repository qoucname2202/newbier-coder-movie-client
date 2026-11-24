

import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerApiBaseUrl } from '@/config/apiBase';
import { clearSession } from '@/utils/serverAuthSession';

// The TLS limit is applied as soon as this module is loaded, so every
// forwarded request uses it (see `src/utils/serverTls.ts`).
import '@/utils/serverTls';

/** The prefix of the proxy. */
const PREFIX = '/api/backend';

/**
 * The cookies that belong to the LOCAL session of this application.
 *
 * They must never be forwarded to the backend: `mv_session` holds the
 * encrypted refresh token.
 */
const LOCAL_SESSION_COOKIES = ['mv_session', 'mv_csrf'];

/**
 * Removes the local session cookies from a `Cookie` header.
 *
 * Every other cookie is kept, so a backend that relies on its own cookies
 * keeps working.
 *
 * @param raw - The value of the `Cookie` header.
 * @returns The header without the local session cookies, or an empty string.
 */
const stripSessionCookies = (raw: string | undefined): string => {
  if (!raw) return '';
  return raw
    .split(';')
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false;
      const name = part.split('=')[0]?.trim() ?? '';
      return !LOCAL_SESSION_COOKIES.includes(name);
    })
    .join('; ');
};

/**
 * Reads the optional server-only route map.
 *
 * `API_ROUTE_MAP` is a JSON object: `{ "/old/path": "/new/path", ... }`.
 * It is stored WITHOUT the `NEXT_PUBLIC_` prefix, so Next.js replaces it
 * with `undefined` in the browser bundle.
 *
 * @returns The map, or an empty object when it is missing or invalid.
 */
const readRouteMap = (): Record<string, string> => {
  const raw = process.env.API_ROUTE_MAP;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
};

/**
 * Applies the server-side path overrides.
 *
 * A key matches when the path STARTS with it, so a whole branch of the API
 * can be remapped at once. The longest matching key wins, so a specific
 * override always beats a generic one.
 *
 * @param path - The path of the request, for example `/search-history/12`.
 * @param routeMap - The server-side overrides.
 * @returns The remapped path, or the original one when nothing matches.
 */
const applyRouteMap = (path: string, routeMap: Record<string, string>): string => {
  let bestKey = '';
  for (const key of Object.keys(routeMap)) {
    if (!path.startsWith(key)) continue;
    if (key.length > bestKey.length) bestKey = key;
  }
  if (!bestKey) return path;
  const replacement = routeMap[bestKey];
  return `${replacement}${path.slice(bestKey.length)}`;
};

/**
 * Relays the request to the backend and streams the answer back.
 *
 * The Authorization header and the cookies are forwarded, so the backend
 * keeps answering exactly as it would for a direct call.
 */
const proxy = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  const backendBase = getServerApiBaseUrl();
  if (!backendBase) {
    res.status(503).json({ success: false, message: 'Backend is not configured.' });
    return;
  }

  const routeMap = readRouteMap();

  // `req.query.segments` holds everything after `/api/backend`.
  const segments = (req.query.segments ?? []) as string[];
  const [head, ...params] = segments;

  if (!head) {
    res.status(404).json({ success: false, message: 'Unknown route.' });
    return;
  }

  // The path of the endpoint, with the remaining segments appended, so a
  // route can accept a variable number of them. Safely prevents double-encoding.
  const extra = params.map((value) => {
    try {
      return encodeURIComponent(decodeURIComponent(value));
    } catch {
      return encodeURIComponent(value);
    }
  });
  const rawPath = [`/${head}`, ...extra].join('/');

  // The path is remapped when the server route map declares an override
  // for it.
  const path = applyRouteMap(rawPath, routeMap);

  // The path starts with a slash, and the base URL ends with one too.
  // Joining them as is would produce a double slash (`/api/v1//movies`),
  // which the backend answers with `404 Route not found`.
  const suffix = path.replace(/^\/+/, '');

  const requestUrl = req.url ?? '';
  const queryIndex = requestUrl.indexOf('?');
  const search = queryIndex >= 0 ? requestUrl.slice(queryIndex) : '';

  const target = `${backendBase}/${suffix}${search}`;

  // The body is buffered so it can be forwarded as-is. `multipart/form-data`
  // is excluded: it must keep its own boundary header.
  const contentType = req.headers['content-type'] ?? '';
  const isMultipart = contentType.includes('multipart/form-data');

  let body: Buffer | undefined;
  if (!isMultipart && req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    body = Buffer.concat(chunks);
  }

  const headers: Record<string, string> = {};
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  
  const forwardedCookie = stripSessionCookies(req.headers.cookie);
  if (forwardedCookie) headers.cookie = forwardedCookie;
  if (req.headers['user-agent']) headers['user-agent'] = req.headers['user-agent'];
  if (!isMultipart && body) headers['content-type'] = contentType;
  if (isMultipart) headers['content-type'] = contentType;
  headers.accept = req.headers.accept ?? 'application/json';

  try {
    const upstream = await fetch(target, {
      method: req.method ?? 'GET',
      headers,
      body: body && body.length ? new Uint8Array(body) : undefined,
      redirect: 'manual',
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());

    let finalStatus = upstream.status;
    const bodyText = buffer.toString('utf8');
    const isTokenExpired =
      upstream.status === 401 ||
      (upstream.status === 500 &&
        (bodyText.includes('Authentication token is invalid or expired') ||
          bodyText.includes('00000204') ||
          bodyText.includes('jwt expired') ||
          bodyText.includes('TokenExpiredError')));

    if (isTokenExpired) {
      clearSession(res);
      finalStatus = 401;
    }

    res.status(finalStatus);

    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) res.setHeader('content-type', upstreamType);

    // The `set-cookie` headers of the backend are relayed, so the sessions
    // keep working exactly as before.
    const setCookies = upstream.headers.getSetCookie?.() ?? [];
    if (setCookies.length) res.setHeader('set-cookie', setCookies);

    res.send(buffer);
  } catch (error) {
    res.status(502).json({
      success: false,
      message: 'Upstream request failed.',
      detail: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export default proxy;

/**
 * The proxy accepts every method, so the config only has to exclude the
 * static assets Next.js serves itself.
 */
export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
