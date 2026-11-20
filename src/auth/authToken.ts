/**
 * @file authToken.ts
 * @description Enterprise-grade Access Token Lifecycle Manager.
 *
 * Key Capabilities:
 * 1. Reactive & proactive token refresh (`ensureFreshToken`).
 * 2. Background tab throttling resilience via `visibilitychange` and `focus` events.
 * 3. Proactive `setTimeout` refresh scheduled ~60s before JWT `exp`.
 * 4. Cross-tab synchronization via `BroadcastChannel('auth')` with `storage` fallback.
 * 5. Strict in-memory access token storage (NEVER written to localStorage / sessionStorage).
 * 6. Hard-failure teardown with Open-Redirect-safe navigation.
 */

import {
  getMemoryAccessToken,
  setMemoryAccessToken,
  setMemoryUser
} from '@/utils/accessTokenStore';

/**
 * Standard JWT Payload with expiration and subject claims.
 */
export interface JwtPayload {
  exp?: number;
  sub?: string;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Cross-tab authentication communication message.
 */
export type AuthSyncMessage =
  | { type: 'TOKEN_REFRESHED'; token: string; timestamp: number }
  | { type: 'LOGOUT'; timestamp: number };

const BROADCAST_CHANNEL_NAME = 'auth';
const STORAGE_SYNC_KEY = 'mv_auth_sync_event';

/**
 * In-flight single-flight refresh promise.
 *
 * CRITICAL PITFALL EXPLANATION:
 * When multiple components or background events request a fresh token at the same time,
 * this shared promise prevents race conditions and redundant HTTP calls.
 * All concurrent callers await this single promise.
 */
let sharedRefreshPromise: Promise<string> | null = null;

/**
 * Reference to the proactive refresh setTimeout timer.
 */
let proactiveTimerId: ReturnType<typeof setTimeout> | null = null;

/**
 * BroadcastChannel instance for cross-tab communication.
 */
let broadcastChannel: BroadcastChannel | null = null;

/**
 * Decodes the JWT payload on the client without verifying the cryptographic signature.
 * (Cryptographic verification is the server's responsibility).
 *
 * @param token - The raw JWT token string.
 * @returns The decoded payload object, or null if malformed.
 */
export const decodeJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Convert Base64Url to Base64
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Sanitizes a redirect path to ensure it is strictly an internal, relative URL.
 *
 * CRITICAL SECURITY DEFENSE:
 * Prevents Open Redirect vulnerabilities where an attacker constructs links such as:
 * `/login?redirect=https://attacker.com` or `/login?redirect=//evil.com`.
 * Only single-slash relative paths (e.g. `/profile`, `/movies/batman`) are permitted.
 *
 * @param path - Proposed redirect destination.
 * @returns Safe encoded redirect string.
 */
export const getSafeRedirectPath = (path?: string): string => {
  const target = path || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/');

  // Reject protocol-relative URLs (//) and absolute URLs (http://, https://)
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('://')) {
    return encodeURIComponent('/');
  }

  return encodeURIComponent(target);
};

/**
 * Retrieves the current access token from memory.
 */
export const getAccessToken = (): string | null => {
  return getMemoryAccessToken();
};

/**
 * Updates the access token in memory, schedules proactive refresh, and optionally broadcasts to peer tabs.
 *
 * @param token - The fresh access token string or null on logout.
 * @param broadcast - Whether to broadcast the token to other browser tabs (default: true).
 */
export const setAccessToken = (token: string | null, broadcast: boolean = true): void => {
  setMemoryAccessToken(token);

  if (token) {
    scheduleProactiveRefresh(token);

    if (broadcast) {
      postAuthSyncMessage({
        type: 'TOKEN_REFRESHED',
        token,
        timestamp: Date.now()
      });
    }
  } else {
    clearProactiveTimer();

    if (broadcast) {
      postAuthSyncMessage({
        type: 'LOGOUT',
        timestamp: Date.now()
      });
    }
  }
};

/**
 * Sends an authentication synchronization message across tabs.
 * Uses BroadcastChannel as primary, falling back to localStorage 'storage' events.
 */
export const postAuthSyncMessage = (message: AuthSyncMessage): void => {
  if (typeof window === 'undefined') return;

  // 1. Primary: BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message);
    } catch {
      // Channel might be closed or detached
    }
  }

  // 2. Fallback: Storage event (fires in other tabs when localStorage changes)
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(message));
    // Remove immediately so next identical event will still trigger 'storage'
    localStorage.removeItem(STORAGE_SYNC_KEY);
  } catch {
    // QuotaExceeded or privacy mode
  }
};

/**
 * Clears the in-memory proactive refresh timer.
 */
export const clearProactiveTimer = (): void => {
  if (proactiveTimerId !== null) {
    clearTimeout(proactiveTimerId);
    proactiveTimerId = null;
  }
};

/**
 * Schedules a proactive token refresh approximately 60 seconds before expiration.
 *
 * BROWSER BACKGROUND THROTTLING EXPLANATION:
 * Modern browsers heavily throttle or suspend setTimeout timers in background tabs
 * (delaying them to 1-minute intervals or pausing them completely when tabs are discarded).
 * Therefore, this timer is an optimization for active tabs.
 * The `visibilitychange` listener serves as the definitive safety net when the user returns.
 *
 * @param token - Current access token.
 */
export const scheduleProactiveRefresh = (token: string): void => {
  clearProactiveTimer();

  const payload = decodeJwt(token);
  if (!payload?.exp) return;

  const nowSeconds = Math.floor(Date.now() / 1000);
  // Schedule refresh 60 seconds prior to exp
  const targetRefreshTime = payload.exp - 60;
  const delayMs = Math.max((targetRefreshTime - nowSeconds) * 1000, 0);

  // JavaScript setTimeout max safe integer is 2^31 - 1 (~24.8 days)
  if (delayMs > 2147483647) return;

  proactiveTimerId = setTimeout(async () => {
    try {
      await ensureFreshToken(60);
    } catch {
      // Inactive tab or server cold-start; visibilitychange will pick it up on return
    }
  }, delayMs);
};

/**
 * Calls the backend refresh endpoint `/api/auth/refresh` using the HttpOnly cookie.
 *
 * When refresh token is rejected (401/403):
 * 1. Purges memory tokens and sensitive data.
 * 2. Broadcasts logout to peer tabs.
 * 3. Redirects to `/auth/login?redirect=<safe_current_url>`.
 */
export const refreshAccessToken = async (): Promise<string> => {
  if (sharedRefreshPromise) {
    return sharedRefreshPromise;
  }

  sharedRefreshPromise = (async (): Promise<string> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        // Refresh token is expired, invalid, or rejected
        if (response.status === 401 || response.status === 403) {
          handleSessionHardFailure();
        }

        const err = new Error(`Token refresh failed with status ${response.status}`);
        (err as Error & { status: number }).status = response.status;
        throw err;
      }

      const data = (await response.json()) as {
        token?: string;
        accessToken?: string;
        user?: Record<string, unknown>;
      };

      const freshToken = data.accessToken || data.token;
      if (!freshToken) {
        throw new Error('Refresh response missing access token');
      }

      // Update in-memory token, schedule proactive timer, and broadcast to other tabs
      setAccessToken(freshToken, true);

      if (data.user) {
        setMemoryUser(data.user);
      }

      return freshToken;
    } finally {
      sharedRefreshPromise = null;
    }
  })();

  return sharedRefreshPromise;
};

/**
 * Handles terminal refresh failure (Refresh token dead):
 * Wipes in-memory session, broadcasts logout, and redirects to login with safe redirect query.
 */
export const handleSessionHardFailure = (): void => {
  setAccessToken(null, true);
  setMemoryUser(null);

  if (typeof window !== 'undefined') {
    // Notify application context / clear query cache
    window.dispatchEvent(new CustomEvent('auth:session_expired', { detail: { terminal: true } }));

    const safeRedirect = getSafeRedirectPath();
    window.location.href = `/auth/login?redirect=${safeRedirect}`;
  }
};

/**
 * Ensures the memory access token is valid and fresh.
 *
 * LOGIC:
 * 1. If a refresh is already running, reuse the existing shared promise.
 * 2. If no token in memory, refresh immediately.
 * 3. Decode `exp` from JWT.
 * 4. If remaining lifetime <= `thresholdSeconds` (default: 30s) or expired, refresh immediately.
 * 5. Otherwise, return the current token.
 *
 * NOTE ON CLIENT CLOCK SKEW:
 * Client clock can deviate from server clock. Server 401 responses remain the authoritative
 * source of truth; checking client-side `exp` is an optimization to prevent in-flight 401s.
 *
 * @param thresholdSeconds - Threshold buffer in seconds (default: 30).
 * @returns Guaranteed fresh access token.
 */
export const ensureFreshToken = async (thresholdSeconds: number = 30): Promise<string> => {
  // 1. Single-flight reuse
  if (sharedRefreshPromise) {
    return sharedRefreshPromise;
  }

  const currentToken = getAccessToken();

  // 2. No token present
  if (!currentToken) {
    return refreshAccessToken();
  }

  // 3. Decode JWT exp
  const payload = decodeJwt(currentToken);
  if (!payload?.exp) {
    // Malformed or non-expiring token -> refresh to verify
    return refreshAccessToken();
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingLifetime = payload.exp - nowSeconds;

  // 4. Token expired or expiring soon (< 30s)
  if (remainingLifetime <= thresholdSeconds) {
    return refreshAccessToken();
  }

  // 5. Token is healthy
  return currentToken;
};

/**
 * Initializes global background lifecycle listeners:
 * 1. `document.addEventListener('visibilitychange')`: Checks and refreshes token when tab wakes up.
 * 2. `window.addEventListener('focus')`: Refreshes token when window regains focus.
 * 3. Cross-tab `BroadcastChannel('auth')` and `storage` event fallback.
 *
 * Register this once in root app (e.g. `pages/_app.tsx`).
 *
 * @returns Cleanup function to unbind all listeners on unmount.
 */
export const initAuthTokenListeners = (): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // 1. Handler for tab returning to foreground
  const handleForegroundWakeup = async (): Promise<void> => {
    if (document.visibilityState === 'visible') {
      try {
        await ensureFreshToken(30);
      } catch {
        // If refresh failed, handleSessionHardFailure already took action
      }
    }
  };

  document.addEventListener('visibilitychange', handleForegroundWakeup);
  window.addEventListener('focus', handleForegroundWakeup);

  // 2. Cross-tab sync: BroadcastChannel
  if ('BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
        handleIncomingSyncMessage(event.data);
      };
    } catch {
      broadcastChannel = null;
    }
  }

  // 3. Cross-tab sync: LocalStorage storage event fallback
  const handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === STORAGE_SYNC_KEY && event.newValue) {
      try {
        const message = JSON.parse(event.newValue) as AuthSyncMessage;
        handleIncomingSyncMessage(message);
      } catch {
        // ignore parse error
      }
    }
  };

  window.addEventListener('storage', handleStorageEvent);

  // Return comprehensive unbind cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleForegroundWakeup);
    window.removeEventListener('focus', handleForegroundWakeup);
    window.removeEventListener('storage', handleStorageEvent);

    clearProactiveTimer();

    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
  };
};

/**
 * Processes incoming cross-tab synchronization events.
 */
const handleIncomingSyncMessage = (message?: AuthSyncMessage): void => {
  if (!message) return;

  if (message.type === 'TOKEN_REFRESHED' && message.token) {
    // Another tab refreshed successfully -> update local tab memory without re-broadcasting
    setAccessToken(message.token, false);
  } else if (message.type === 'LOGOUT') {
    // Another tab logged out -> wipe local tab session without re-broadcasting
    setMemoryAccessToken(null);
    setMemoryUser(null);
    clearProactiveTimer();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:session_expired', { detail: { remote: true } }));
      const safeRedirect = getSafeRedirectPath();
      window.location.href = `/auth/login?redirect=${safeRedirect}`;
    }
  }
};
