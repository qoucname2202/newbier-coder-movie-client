/**
 * @file sessionTeardown.ts
 * @description Centralized session destruction, AbortController request tracking, cache clearing, and cross-tab BroadcastChannel synchronization.
 */

import { setMemoryAccessToken, setMemoryUser } from '@/utils/accessTokenStore';

/**
 * Registry of active in-flight request AbortControllers.
 */
class RequestAbortRegistry {
  private controllers = new Set<AbortController>();

  /**
   * Registers a new AbortController for an active request.
   * @returns Clean-up function to remove controller once request settles.
   */
  public register(): { controller: AbortController; unregister: () => void } {
    const controller = new AbortController();
    this.controllers.add(controller);

    const unregister = (): void => {
      this.controllers.delete(controller);
    };

    return { controller, unregister };
  }

  /**
   * Aborts all pending HTTP requests currently in flight.
   */
  public abortAll(): void {
    for (const controller of this.controllers) {
      try {
        controller.abort(new Error('Session terminated: In-flight request aborted.'));
      } catch {
        // ignore
      }
    }
    this.controllers.clear();
  }
}

export const requestAbortRegistry = new RequestAbortRegistry();

/**
 * Cross-tab authentication communication channel.
 */
let authBroadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    authBroadcastChannel = new BroadcastChannel('auth');
    authBroadcastChannel.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'LOGOUT') {
        // Received logout broadcast from another tab
        handleRemoteLogout();
      }
    };
  } catch {
    authBroadcastChannel = null;
  }
}

/**
 * Executes local teardown when a logout message is received from a peer tab.
 */
const handleRemoteLogout = (): void => {
  requestAbortRegistry.abortAll();
  setMemoryAccessToken(null);
  setMemoryUser(null);

  if (typeof window !== 'undefined') {
    // Notify application state / trigger redirect to login if currently on protected page
    window.dispatchEvent(new CustomEvent('auth:session_expired', { detail: { remote: true } }));
  }
};

/**
 * Broadcasts a logout event across all open browser tabs.
 */
export const broadcastLogout = (): void => {
  if (authBroadcastChannel) {
    try {
      authBroadcastChannel.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
};

/**
 * Executes a full enterprise session teardown:
 * 1. Aborts all active in-flight HTTP requests.
 * 2. Wipes sensitive in-memory access tokens and user profile.
 * 3. Clears sensitive cache stores.
 * 4. Broadcasts logout to all peer tabs via BroadcastChannel.
 *
 * @param options.broadcast - Whether to broadcast to peer tabs (default: true).
 * @param options.redirectToLogin - Whether to navigate the current window to `/auth/login`.
 */
export const performSessionTeardown = (options?: {
  broadcast?: boolean;
  redirectToLogin?: boolean;
  redirectUrl?: string;
}): void => {
  const { broadcast = true, redirectToLogin = false, redirectUrl = '/auth/login' } = options || {};

  // 1. Abort all pending HTTP requests
  requestAbortRegistry.abortAll();

  // 2. Clear in-memory credentials (never stored in localStorage)
  setMemoryAccessToken(null);
  setMemoryUser(null);

  // 3. Broadcast logout event to other tabs
  if (broadcast) {
    broadcastLogout();
  }

  // 4. Dispatch DOM event for React context / query client cache purge
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:session_expired', { detail: { local: true } }));

    if (redirectToLogin && !window.location.pathname.startsWith('/auth/login')) {
      window.location.href = redirectUrl;
    }
  }
};
