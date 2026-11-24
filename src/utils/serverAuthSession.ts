/**
 * @file serverAuthSession.ts
 * @description The server-side authentication session (the BFF session).
 *
 * WHY THIS FILE EXISTS
 * Before, the browser stored BOTH tokens in Web Storage:
 *   - the access token  -> `localStorage.auth_token` / `sessionStorage.auth_token`
 *   - the refresh token -> `localStorage.refresh_token`
 * Every script running on the page could read them, so a single XSS was
 * enough to steal a long-lived refresh token and to impersonate the user
 * for the whole lifetime of that token.
 *
 * The contract with the backend does not change: it still answers with an
 * access token and a refresh token IN THE BODY (verified against the
 * production backend: `POST /auth/refresh-token` requires a body field
 * `refreshToken` of at least 16 characters).
 *
 * The tokens are therefore moved to THIS side of the wire:
 *   - the refresh token NEVER leaves the server. It lives in the encrypted
 *     session cookie, which is `HttpOnly`, so the JavaScript of the page
 *     cannot read it;
 *   - the access token is handed to the browser only as a response value and
 *     is kept in a MODULE-LEVEL VARIABLE (memory). It is never written to
 *     `localStorage`, `sessionStorage` or the persisted Zustand store.
 *
 * The cookie holds an AES-256-GCM encrypted payload, so the content is
 * neither readable by JavaScript nor forgeable by the client.
 *
 * THE SESSION IS STATELESS
 * The payload is encrypted into the cookie itself (no server-side map), so
 * the session survives a restart of the Next.js server and works on a
 * serverless deployment without a shared store.
 *
 * SECURITY NOTES
 * - The cookie is `HttpOnly` + `SameSite=Lax` + `Secure` in production.
 * - The access token is only used as an `Authorization: Bearer` header; it
 *   is never written to a log, a console message or an error message.
 */

import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

import { apiUrl } from '@/config/apiPaths';

// The TLS limit is applied as soon as this module is loaded, so every call
// to the backend uses it (see `src/utils/serverTls.ts`).
import '@/utils/serverTls';

/** The name of the session cookie. */
export const AUTH_SESSION_COOKIE_NAME = 'mv_session';

/**
 * The name of the CSRF cookie.
 *
 * It holds a random nonce that the client has to send back in the
 * `x-csrf-token` header of every state-changing request. The cookie is NOT
 * `HttpOnly` on purpose: the client has to read it to copy it into the
 * header. The protection comes from the fact that a cross-site attacker
 * cannot READ the cookie, so it cannot forge the header.
 */
export const CSRF_COOKIE_NAME = 'mv_csrf';

/** The lifetime of a "remember me" session, in seconds (30 days). */
const REMEMBER_ME_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * The access token is refreshed when it expires in less than this margin.
 */
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

/** The payload of the session. It is encrypted before it leaves the server. */
export interface AuthSessionPayload {
  /** The access token used for the `Authorization` header. */
  accessToken: string;
  /** The refresh token. It NEVER leaves the server. */
  refreshToken?: string;
  /** The user profile, without any token. */
  user?: Record<string, unknown>;
  /** The expiry of the access token, in milliseconds. */
  accessTokenExpiresAt?: number;
  /** Whether the session survives the closing of the browser. */
  rememberMe: boolean;
}

/**
 * The secret used to encrypt the session cookie.
 *
 * `AUTH_SESSION_SECRET` is preferred; `NEXTAUTH_SECRET` is used as a
 * fallback, so an existing deployment keeps working without any new
 * variable. The value never reaches the browser bundle, because neither
 * variable has the `NEXT_PUBLIC_` prefix.
 *
 * @returns The secret, or a development fallback.
 */
const getSessionSecret = (): string =>
  process.env.AUTH_SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'mv-session-development-secret-change-me';

/**
 * Derives the 256-bit encryption key from the secret.
 *
 * @returns The encryption key.
 */
const getEncryptionKey = (): Buffer =>
  crypto.createHash('sha256').update(getSessionSecret(), 'utf8').digest();

/**
 * Encrypts the session payload with AES-256-GCM.
 *
 * @param payload - The payload to encrypt.
 * @returns The encrypted value, as a URL-safe string.
 */
export const encryptSession = (payload: AuthSessionPayload): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    data.toString('base64url'),
  ].join('.');
};

/**
 * Decrypts the session payload.
 *
 * @param value - The encrypted value.
 * @returns The payload, or null when the value is missing, tampered with or
 *          encrypted with another secret.
 */
export const decryptSession = (value: string | undefined | null): AuthSessionPayload | null => {
  if (!value) return null;
  const parts = value.split('.');
  if (parts.length !== 3) return null;
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getEncryptionKey(),
      Buffer.from(parts[0], 'base64url')
    );
    decipher.setAuthTag(Buffer.from(parts[1], 'base64url'));
    const data = Buffer.concat([
      decipher.update(Buffer.from(parts[2], 'base64url')),
      decipher.final(),
    ]);
    const parsed = JSON.parse(data.toString('utf8')) as AuthSessionPayload;
    if (!parsed || typeof parsed.accessToken !== 'string' || !parsed.accessToken) return null;
    return parsed;
  } catch {
    // A tampered, expired or foreign cookie is simply ignored.
    return null;
  }
};

/**
 * Builds the options of the session cookie.
 *
 * @param rememberMe - Whether the session survives the closing of the browser.
 * @returns The cookie options.
 */
export const sessionCookieOptions = (
  rememberMe: boolean
): {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge?: number;
} => ({
  // `HttpOnly` is the whole point: the JavaScript of the page cannot read
  // the session, so it cannot read the refresh token.
  httpOnly: true,
  // `Lax` still sends the cookie on the top-level navigations of the OAuth
  // callback, and it blocks the cookie on the cross-site subrequests.
  sameSite: 'lax',
  // The cookie is only sent over HTTPS in production. In development the
  // app runs on plain HTTP, where a `Secure` cookie would be dropped.
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  ...(rememberMe ? { maxAge: REMEMBER_ME_TTL_SECONDS } : {}),
});

/**
 * Reads the session cookie of a request.
 *
 * @param req - The request.
 * @returns The session payload, or null when there is no valid session.
 */
export const readSession = (req: NextApiRequest): AuthSessionPayload | null => {
  const raw = req.cookies?.[AUTH_SESSION_COOKIE_NAME];
  return decryptSession(raw);
};

/**
 * Writes the session cookie.
 *
 * @param res - The response.
 * @param payload - The session payload.
 */
export const writeSession = (res: NextApiResponse, payload: AuthSessionPayload): void => {
  const value = encryptSession(payload);
  res.setHeader(
    'Set-Cookie',
    `${AUTH_SESSION_COOKIE_NAME}=${value}; ${serializeCookieOptions(
      sessionCookieOptions(payload.rememberMe)
    )}`
  );
};

/**
 * Clears the session cookie and all related authentication cookies (including NextAuth).
 *
 * @param res - The response.
 */
export const clearSession = (res: NextApiResponse): void => {
  const isSecure = process.env.NODE_ENV === 'production';
  const expiredBase = 'Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';

  const cookieNamesToClear = [
    { name: AUTH_SESSION_COOKIE_NAME, httpOnly: true },
    { name: CSRF_COOKIE_NAME, httpOnly: false },
    { name: 'next-auth.session-token', httpOnly: true },
    { name: '__Secure-next-auth.session-token', httpOnly: true },
    { name: 'next-auth.csrf-token', httpOnly: false },
    { name: 'next-auth.callback-url', httpOnly: false },
    { name: '__Host-next-auth.csrf-token', httpOnly: false },
  ];

  const clearHeaders = cookieNamesToClear.map(({ name, httpOnly }) => {
    const requireSecure = name.startsWith('__Secure-') || name.startsWith('__Host-') || isSecure;
    return `${name}=; ${expiredBase}${httpOnly ? '; HttpOnly' : ''}${requireSecure ? '; Secure' : ''}`;
  });

  res.setHeader('Set-Cookie', clearHeaders);
};

/**
 * Reads the CSRF nonce of a request.
 *
 * @param req - The request.
 * @returns The nonce, or an empty string.
 */
export const readCsrfToken = (req: NextApiRequest): string =>
  (req.cookies?.[CSRF_COOKIE_NAME] as string) || '';

/**
 * Creates the CSRF nonce of a request.
 *
 * The nonce is sent to the browser in a cookie that JavaScript CAN read,
 * and the client copies it into the `x-csrf-token` header. A cross-site
 * attacker can make the browser SEND the cookie, but it cannot READ it, so
 * it cannot build a valid header.
 *
 * @param req - The request.
 * @returns The nonce to use.
 */
export const ensureCsrfToken = (req: NextApiRequest): string => {
  const existing = readCsrfToken(req);
  if (existing) return existing;
  return crypto.randomBytes(24).toString('base64url');
};

/**
 * Writes the CSRF cookie.
 *
 * @param res - The response.
 * @param token - The nonce.
 */
export const writeCsrfCookie = (res: NextApiResponse, token: string): void => {
  const parts = [
    'Path=/',
    'SameSite=Lax',
    // The cookie is readable by JavaScript on purpose: the client copies
    // the nonce into the `x-csrf-token` header.
    `Max-Age=${REMEMBER_ME_TTL_SECONDS}`,
  ];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  res.setHeader('Set-Cookie', `${CSRF_COOKIE_NAME}=${token}; ${parts.join('; ')}`);
};

/**
 * Verifies the CSRF nonce of a state-changing request.
 *
 * @param req - The request.
 * @returns `true` when the request may continue.
 */
export const verifyCsrfToken = (req: NextApiRequest): boolean => {
  const cookieToken = readCsrfToken(req);
  const headerToken = (req.headers['x-csrf-token'] as string) || '';
  if (!cookieToken || !headerToken) return false;

  const expected = Buffer.from(cookieToken);
  const provided = Buffer.from(headerToken);
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
};

/**
 * Serializes the cookie options into a `Set-Cookie` attribute list.
 *
 * @param options - The cookie options.
 * @returns The attribute list.
 */
const serializeCookieOptions = (options: {
  httpOnly: boolean;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge?: number;
}): string => {
  const parts = ['Path=' + options.path, 'SameSite=Lax'];
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (typeof options.maxAge === 'number') parts.push(`Max-Age=${options.maxAge}`);
  return parts.join('; ');
};

/**
 * Reads the expiry of a JWT without verifying it.
 *
 * The value is only used to decide WHEN the token has to be refreshed, so
 * the signature does not matter here.
 *
 * @param token - The access token.
 * @returns The expiry in milliseconds, or undefined when it cannot be read.
 */
export const readTokenExpiry = (token: string | undefined | null): number | undefined => {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(json) as { exp?: number };
    if (typeof payload.exp !== 'number') return undefined;
    return payload.exp * 1000;
  } catch {
    return undefined;
  }
};

/**
 * Tells whether the access token of a session is expired (or about to be).
 *
 * @param payload - The session payload.
 * @returns `true` when the token has to be refreshed.
 */
export const needsRefresh = (payload: AuthSessionPayload): boolean => {
  const expiresAt = payload.accessTokenExpiresAt ?? readTokenExpiry(payload.accessToken);
  if (!expiresAt) return false;
  return expiresAt - ACCESS_TOKEN_REFRESH_MARGIN_MS <= Date.now();
};

/**
 * Removes every token from a user profile.
 *
 * The backend sometimes puts the token inside the user object. That object
 * is stored in the browser, so the token must never be part of it.
 *
 * @param user - The user profile.
 * @returns The profile, without any token.
 */
export const stripTokensFromUser = (
  user: Record<string, unknown> | null | undefined
): Record<string, unknown> | undefined => {
  if (!user || typeof user !== 'object') return undefined;
  const clean: Record<string, unknown> = { ...user };
  delete clean.token;
  delete clean.access_token;
  delete clean.accessToken;
  delete clean.refresh_token;
  delete clean.refreshToken;
  delete clean.backendToken;
  return clean;
};

/**
 * Finds an access token anywhere in a response payload.
 *
 * The backend answers with several shapes depending on the endpoint, so the
 * token is searched in the known paths first and then deep in the object.
 *
 * @param source - The payload to search.
 * @param depth - The current recursion depth.
 * @returns The token, or null.
 */
export const findAccessToken = (source: unknown, depth = 0): string | null => {
  if (depth > 4 || !source || typeof source !== 'object') return null;
  const object = source as Record<string, unknown>;
  for (const key of Object.keys(object)) {
    const value = object[key];
    if (typeof value === 'string' && value.split('.').length === 3) return value;
    if (typeof value === 'object' && value !== null) {
      const found = findAccessToken(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
};

/**
 * The shape of the token payload of the backend.
 */
export interface BackendTokenPayload {
  accessToken: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
}

/**
 * Extracts the tokens of a login or refresh answer of the backend.
 *
 * @param data - The parsed body of the answer.
 * @returns The tokens, or null when the body carries no access token.
 */
export const extractBackendTokens = (data: unknown): BackendTokenPayload | null => {
  if (!data || typeof data !== 'object') return null;
  const root = data as Record<string, unknown>;
  const responseData = (root.responseData ?? root.data ?? root) as Record<string, unknown>;

  const accessToken =
    (responseData.access_token as string) ||
    (responseData.accessToken as string) ||
    (root.access_token as string) ||
    (root.accessToken as string) ||
    (root.token as string) ||
    findAccessToken(data);

  if (!accessToken) return null;

  const refreshToken =
    (responseData.refresh_token as string) ||
    (responseData.refreshToken as string) ||
    (root.refresh_token as string) ||
    (root.refreshToken as string) ||
    undefined;

  const user = (responseData.user ?? root.user) as Record<string, unknown> | undefined;

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
    user: stripTokensFromUser(user),
  };
};

/**
 * The result of a call to the authentication endpoints of the backend.
 */
export interface BackendAuthResult {
  ok: boolean;
  status: number;
  message: string;
  tokens: BackendTokenPayload | null;
  /**
   * `true` when the backend could not be reached at all (it is still
   * starting, or the free tier is doing a cold start).
   *
   * The client uses this flag to show the "waiting for the server" notice
   * and to retry automatically, instead of showing a generic failure.
   */
  serverStarting?: boolean;
}

/**
 * The timeout of a call to the backend, in milliseconds.
 *
 * WITHOUT this timeout, a backend that does not answer (a cold start of the
 * free tier of Render, for example) keeps the request open until the
 * operating system gives up, which is ~10 seconds. The user then waits 10
 * seconds before seeing an error, and the API route looks like it hung.
 *
 * `AbortSignal.timeout()` is used because it also covers the CONNECTION
 * phase, which `fetch` does not interrupt on its own.
 */
const BACKEND_TIMEOUT_MS = 8000;

/**
 * Calls the login endpoint of the backend.
 *
 * The API contract is NOT changed: the backend still answers with the
 * tokens in the body.
 *
 * @param username - The username or the email.
 * @param password - The password.
 * @returns The result of the call.
 */
export const backendLogin = async (
  username: string,
  password: string
): Promise<BackendAuthResult> => {
  try {
    const response = await fetch(apiUrl('authLogin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => null);
    return interpretBackendAuthResponse(response.status, data);
  } catch {
    // The backend did not answer at all: it is either still starting (a cold
    // start of the free tier) or it is down. The flag lets the client show
    // the "waiting for the server" notice instead of a dead-end error.
    return {
      ok: false,
      status: 502,
      message: 'Authentication service unreachable.',
      tokens: null,
      serverStarting: true,
    };
  }
};

/**
 * Calls the refresh endpoint of the backend.
 *
 * The refresh token is read from the session, so it never travels through
 * the browser.
 *
 * @param refreshToken - The refresh token.
 * @returns The result of the call.
 */
export const backendRefresh = async (
  refreshToken: string
): Promise<BackendAuthResult> => {
  try {
    const response = await fetch(apiUrl('authRefreshToken'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
    const data = await response.json().catch(() => null);
    return interpretBackendAuthResponse(response.status, data);
  } catch {
    return { ok: false, status: 502, message: 'Authentication service unreachable.', tokens: null };
  }
};

/**
 * Calls the logout endpoint of the backend.
 *
 * @param accessToken - The access token, when there is one.
 * @param refreshToken - The refresh token, when there is one.
 * @returns The result of the call.
 */
export const backendLogout = async (
  accessToken: string | undefined,
  refreshToken: string | undefined
): Promise<void> => {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    await fetch(apiUrl('authLogout'), {
      method: 'POST',
      headers,
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    });
  } catch {
    // The local session is cleared even when the backend does not answer.
  }
};

/**
 * Interprets an answer of the backend.
 *
 * The message is taken from the `responseStatus` block of the v1 contract,
 * so the user sees exactly what the backend said. The tokens are never part
 * of the message.
 *
 * @param status - The HTTP status of the answer.
 * @param data - The parsed body of the answer.
 * @returns The result of the call.
 */
const interpretBackendAuthResponse = (
  status: number,
  data: unknown
): BackendAuthResult => {
  const root = (data ?? {}) as Record<string, unknown>;
  const responseStatus = root.responseStatus as
    | { responseCode?: string; responseMessage?: string }
    | undefined;

  const tokens = extractBackendTokens(data);

  if (status >= 200 && status < 300 && tokens) {
    return { ok: true, status, message: 'OK', tokens };
  }

  const message =
    (responseStatus?.responseMessage as string) ||
    (root.message as string) ||
    (root.error as string) ||
    'Authentication failed';

  return { ok: false, status, message, tokens: null };
};
