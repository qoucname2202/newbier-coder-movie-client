/**
 * @file pages/api/auth/logout.ts
 * @description Terminates the session.
 *
 * The route calls the logout endpoint of the backend with the tokens of the
 * server-side session, and then clears the encrypted session cookie, so the
 * `HttpOnly` cookie no longer grants anything.
 *
 * The browser is not told about any token: it only receives the answer of
 * the route.
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  backendLogout,
  clearSession,
  readSession,
  verifyCsrfToken,
} from '@/utils/serverAuthSession';

/**
 * Terminates the current session.
 *
 * The route revokes the session on the backend first, so the refresh token
 * is invalidated there too. Then it clears the encrypted session cookie,
 * so the browser can no longer present it.
 *
 * @param req - The API request. It must carry the `x-csrf-token` header.
 * @param res - The API response.
 * @returns Nothing. The route answers with `{ success: true }`.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Record<string, unknown>>
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // NOTE: On logout or terminal session teardown, CSRF token may be expired or missing.
  // We MUST ALWAYS clear cookies and revoke tokens on logout, never block logout with 403.
  const session = readSession(req);

  // The session is terminated on the backend first, so the refresh token
  // is revoked there as well.
  if (session) {
    try {
      await backendLogout(session.accessToken, session.refreshToken);
    } catch {
      // Backend may already have revoked or expired the tokens
    }
  }

  // The cookies are always cleared, whatever the backend answered.
  clearSession(res);

  return res.status(200).json({ success: true, authenticated: false });
}
