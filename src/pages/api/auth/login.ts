/**
 * @file pages/api/auth/login.ts
 * @description The login API route.
 *
 * SECURITY MODEL
 * The route is the only place where the refresh token is received from the
 * backend, and it never sends it to the browser:
 *   1. the credentials are forwarded to the backend (the API contract is
 *      unchanged: the backend still answers with the tokens in the body);
 *   2. the refresh token is stored, together with the access token and the
 *      user profile, in an AES-256-GCM ENCRYPTED cookie;
 *   3. the cookie is `HttpOnly`, so the JavaScript of the page cannot read
 *      the refresh token (or the access token);
 *   4. only the access token and the token-free user profile are returned
 *      in the body, so the client can keep them in memory.
 *
 * The `SameSite` and `Secure` attributes of the cookie are set according to
 * the environment (see `sessionCookieOptions`).
 */
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  backendLogin,
  sessionCookieOptions,
  verifyCsrfToken,
  writeSession,
  readTokenExpiry,
  stripTokensFromUser,} from '@/utils/serverAuthSession';

interface ErrorResponse {
  message: string;
}

interface LoginBody {
  email?: string;
  username?: string;
  password?: string;
  rememberMe?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | Record<string, unknown>>
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // The CSRF nonce is checked before the credentials are forwarded, so a
    // cross-site request cannot start a session.
    if (!verifyCsrfToken(req)) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    const { email, username, password, rememberMe } = req.body as LoginBody;

    // Backend v1 requires `username` (the real validation error is
    // "body must have required property 'username'"). The UI form can send
    // `email` or `username`, so the value is normalized before forwarding.
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const result = await backendLogin(identifier, password);

    if (!result.ok || !result.tokens) {
      const status = result.status >= 400 && result.status < 600 ? result.status : 401;
      // The backend did not answer (it is still starting). The flag is
      // forwarded so the client can show the "waiting for the server" notice
      // and retry automatically, instead of a dead-end error.
      return res.status(status).json({
        message: result.message,
        ...(result.serverStarting ? { serverStarting: true } : {}),
      });
    }

    const { accessToken, refreshToken, user } = result.tokens;
    const persist = rememberMe === true;

    // The session is written to the encrypted cookie. The refresh token
    // stays on this side of the wire, forever.
    writeSession(res, {
      accessToken,
      refreshToken,
      user: stripTokensFromUser(user),
      accessTokenExpiresAt: readTokenExpiry(accessToken),
      rememberMe: persist,
    });

    // Only the access token and the token-free profile leave the server.
    // The refresh token is NOT part of the answer.
    return res.status(200).json({
      success: true,
      token: accessToken,
      user: stripTokensFromUser(user) ?? null,
      rememberMe: persist,
    });
  } catch {
    // The message never contains a token.
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
}

/**
 * The cookie is written by the route itself, so the body parser of Next.js
 * is enough.
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16kb',
    },
  },
};

// The helper is re-exported for the tests and for the other auth routes.
export { sessionCookieOptions };
