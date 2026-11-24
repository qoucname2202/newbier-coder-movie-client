/**
 * @file pages/api/auth/session-state.ts
 * @description Returns the state of the current session.
 *
 * WHY THE ROUTE HAS THIS NAME
 * The route used to be `/api/auth/session`, but that path belongs to
 * NextAuth: the catch-all route `[...nextauth].ts` serves it. A STATIC
 * file wins over the catch-all, so the local route was shadowing the
 * NextAuth one. The NextAuth client then received the answer of this
 * route instead of the NextAuth session, and the OAuth sign-in broke
 * (the `csrfToken` of this route is not the one NextAuth expects).
 *
 * The route is therefore called `/api/auth/session-state`, which cannot
 * collide with anything NextAuth serves.
 *
 * WHY THIS ROUTE EXISTS
 * The access token is NOT stored in the Web Storage any more, so after a
 * reload the browser has no token. The `HttpOnly` session cookie is still
 * there, and it cannot be read by JavaScript — but the BROWSER sends it
 * with every request.
 *
 * This route therefore:
 *   1. reads the encrypted cookie on the server;
 *   2. refreshes the access token when it is expired (the refresh token
 *      never leaves the server);
 *   3. returns the fresh access token and the token-free user profile, so
 *      the client can restore the session in MEMORY.
 *
 * The route never returns the refresh token.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  backendRefresh,
  clearSession,
  needsRefresh,
  readSession,
  readTokenExpiry,
  stripTokensFromUser,
  writeSession,
} from '@/utils/serverAuthSession';

/**
 * Returns the state of the current session.
 *
 * The route reads the encrypted cookie, renews the access token when it is
 * expired, and answers with the fresh access token and the token-free user
 * profile. The refresh token stays on the server.
 *
 * @param req - The API request. It carries the `mv_session` cookie.
 * @param res - The API response.
 * @returns Nothing. The route answers with `{ authenticated, token, user }`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, unknown>>
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = readSession(req);

  if (!session) {
    clearSession(res);
    return res.status(401).json({ authenticated: false });
  }

  // The access token is still valid: the session is restored as it is.
  if (!needsRefresh(session)) {
    return res.status(200).json({
      authenticated: true,
      token: session.accessToken,
      user: stripTokensFromUser(session.user) ?? null,
      rememberMe: session.rememberMe,
    });
  }

  // The access token is expired: a refresh is needed. Without a refresh
  // token the session cannot be renewed.
  if (!session.refreshToken) {
    clearSession(res);
    return res.status(401).json({ authenticated: false, message: 'Session expired' });
  }

  const result = await backendRefresh(session.refreshToken);

  if (!result.ok || !result.tokens) {
    // The refresh token was rejected: the session is over.
    clearSession(res);
    return res.status(401).json({ authenticated: false, message: 'Session expired' });
  }

  const { accessToken, refreshToken, user } = result.tokens;

  writeSession(res, {
    accessToken,
    // The backend can rotate the refresh token; the old one is then
    // replaced. It stays on the server in any case.
    refreshToken: refreshToken || session.refreshToken,
    user: stripTokensFromUser(user) ?? stripTokensFromUser(session.user),
    accessTokenExpiresAt: readTokenExpiry(accessToken),
    rememberMe: session.rememberMe,
  });

  return res.status(200).json({
    authenticated: true,
    token: accessToken,
    user: stripTokensFromUser(user) ?? stripTokensFromUser(session.user) ?? null,
    rememberMe: session.rememberMe,
  });
}
