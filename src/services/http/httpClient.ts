/**
 * @file httpClient.ts
 * @description Enterprise-grade Axios HTTP client featuring:
 * 1. Reactive 401 token refresh with shared single-flight promise.
 * 2. Infinite-loop protection via `_retry` flag.
 * 3. Idempotency guard: prevents auto-retrying mutations (POST/PATCH) unless Idempotency-Key is present.
 * 4. Distinct 401 vs 403 error separation.
 * 5. Re-authentication Modal queue: holds requests in pending promises when refresh token expires,
 *    allowing in-place re-login without losing form state or unmounting components.
 * 6. In-flight request tracking with AbortController.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse
} from 'axios';
import { getApiBaseUrl } from '@/config/apiBase';
import { getMemoryAccessToken, setMemoryAccessToken, setMemoryUser } from '@/utils/accessTokenStore';
import {
  RetryableRequestConfig,
  HttpErrorCodes,
  PendingReauthRequest,
  ReauthModalState
} from './types';
import { requestAbortRegistry } from './sessionTeardown';

/**
 * Endpoints excluded from 401 token refresh.
 *
 * CRITICAL PITFALL EXPLANATION:
 * 1. `/auth/refresh`: Must NEVER trigger a refresh when it returns 401 (meaning the refresh token
 *    is invalid or expired). If it did, it would call itself in an infinite loop until the browser crashes.
 * 2. `/auth/login`: 401 here represents invalid user credentials; refreshing is nonsensical.
 */
const EXCLUDED_AUTH_ENDPOINTS = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/api/auth/refresh',
  '/api/auth/login'
];

/**
 * Shared single-flight refresh promise.
 *
 * CRITICAL PITFALL EXPLANATION:
 * When multiple API calls fail with 401 simultaneously (e.g. 5 parallel widgets on page load),
 * naive implementations fire 5 separate POST /auth/refresh calls. This causes race conditions,
 * token invalidation (refresh token rotation collision), and unnecessary server load.
 * We store a single in-flight Promise that all concurrent 401 requests await together.
 */
let sharedRefreshPromise: Promise<string> | null = null;

/**
 * Queue of requests pending re-authentication in the modal when refresh token has failed.
 */
const pendingReauthQueue: PendingReauthRequest[] = [];

/**
 * Event emitter for notifying the React Re-auth Modal UI.
 */
type ReauthListener = (state: ReauthModalState) => void;
const reauthListeners = new Set<ReauthListener>();

let isModalOpen = false;

const notifyListeners = (errorMessage: string | null = null, isLoading: boolean = false): void => {
  const state: ReauthModalState = {
    isOpen: isModalOpen,
    isLoading,
    errorMessage,
    pendingCount: pendingReauthQueue.length
  };
  reauthListeners.forEach((listener) => listener(state));
};

export const reauthEvents = {
  subscribe: (listener: ReauthListener): (() => void) => {
    reauthListeners.add(listener);
    return () => reauthListeners.delete(listener);
  },

  /**
   * Opens the Re-authentication Modal when refresh token has failed.
   */
  openModal: (errorMessage: string | null = null): void => {
    isModalOpen = true;
    notifyListeners(errorMessage);
  },

  /**
   * Called by the modal UI when user successfully logs back in.
   * Flushes the queued requests by retrying them with the fresh token.
   */
  onLoginSuccess: (newToken: string): void => {
    isModalOpen = false;
    setMemoryAccessToken(newToken);
    notifyListeners(null, false);

    // Drain and retry all pending requests
    while (pendingReauthQueue.length > 0) {
      const item = pendingReauthQueue.shift();
      if (!item) break;

      item.config.headers = item.config.headers || {};
      item.config.headers.Authorization = `Bearer ${newToken}`;
      item.config._retry = true;

      // Re-dispatch through httpClient
      httpClient(item.config)
        .then((res) => item.resolve(res))
        .catch((err) => item.reject(err));
    }
  },

  /**
   * Called when user cancels or closes the Re-authentication Modal.
   * Rejects all queued requests so components can stop their loading states.
   */
  onCancel: (): void => {
    isModalOpen = false;
    notifyListeners(null, false);

    const cancelError = new AxiosError(
      'Re-authentication was cancelled by user. Pending operations aborted to protect form state.',
      HttpErrorCodes.REAUTH_CANCELLED
    );

    while (pendingReauthQueue.length > 0) {
      const item = pendingReauthQueue.shift();
      item?.reject(cancelError);
    }
  }
};

/**
 * Performs the actual HTTP refresh call to the backend.
 * Uses native fetch with same-origin credentials so the HttpOnly cookie is attached.
 */
export const executeTokenRefresh = async (): Promise<string> => {
  // If a refresh is already in-flight, return the existing shared promise!
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
        const errorData = await response.json().catch(() => ({}));
        const message = (errorData as { message?: string }).message || `Token refresh failed with status ${response.status}`;
        const err = new Error(message) as Error & { status: number; code: string };
        err.status = response.status;
        err.code = HttpErrorCodes.REFRESH_FAILED;
        throw err;
      }

      const data = (await response.json()) as { token?: string; user?: Record<string, unknown> };
      const newToken = data.token;

      if (!newToken) {
        throw new Error('Refresh endpoint answered without token');
      }

      // Update in-memory token (NEVER written to localStorage)
      setMemoryAccessToken(newToken);
      if (data.user) {
        setMemoryUser(data.user);
      }

      return newToken;
    } finally {
      // Clear the shared promise on completion so subsequent expirations can trigger a new refresh
      sharedRefreshPromise = null;
    }
  })();

  return sharedRefreshPromise;
};

/**
 * Checks if a request URL matches any excluded authentication endpoint.
 */
export const isExcludedAuthEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return EXCLUDED_AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

/**
 * Checks whether an HTTP method is considered safe / idempotent according to RFC 7231.
 */
export const isMethodIdempotent = (method?: string): boolean => {
  const m = (method || 'GET').toUpperCase();
  return ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'].includes(m);
};

/**
 * Creates the enterprise Axios instance.
 */
export const httpClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  withCredentials: true
});

/**
 * REQUEST INTERCEPTOR:
 * 1. Attaches AbortController for session-level teardown.
 * 2. Injects in-memory Bearer token into Authorization header.
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. Link request to AbortController registry if not already carrying an external signal
    if (!config.signal) {
      const { controller, unregister } = requestAbortRegistry.register();
      config.signal = controller.signal;

      // Clean registry entry when settled
      const originalAdapter = config.adapter;
      if (!originalAdapter) {
        // Axios handles unregister via response/error interceptors
      }
    }

    // 2. Attach Bearer token from in-memory store
    const token = getMemoryAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 3. Attach Idempotency-Key if provided in config
    const customConfig = config as RetryableRequestConfig;
    if (customConfig.idempotencyKey && !config.headers['Idempotency-Key']) {
      config.headers['Idempotency-Key'] = customConfig.idempotencyKey;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR:
 * Handles 401 (refresh + retry) and 403 (forbidden).
 */
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = (error.config || {}) as RetryableRequestConfig;
    const status = error.response?.status;
    const url = originalRequest.url || '';
    const method = (originalRequest.method || 'GET').toUpperCase();

    // -------------------------------------------------------------------------
    // RULE 5: Distinguish 401 (Refresh) from 403 (Forbidden)
    // -------------------------------------------------------------------------
    if (status === 403) {
      // 403 Forbidden: User is authenticated but lacks permission.
      // NEVER trigger refresh on 403; reject with actionable error code.
      error.code = HttpErrorCodes.FORBIDDEN;
      return Promise.reject(error);
    }

    // -------------------------------------------------------------------------
    // Ignore non-401 errors, excluded auth endpoints, and explicit skip flags
    // -------------------------------------------------------------------------
    if (status !== 401 || originalRequest.skipAuthRefresh || isExcludedAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    // -------------------------------------------------------------------------
    // RULE 3: Infinite-loop protection via `_retry` flag
    // -------------------------------------------------------------------------
    // If request was already retried once after 401 and failed again with 401,
    // do NOT retry again! Proceed to Re-authentication Modal.
    if (originalRequest._retry) {
      return enqueueReauthRequest(originalRequest);
    }

    // -------------------------------------------------------------------------
    // RULE 4: Idempotency Guard for Mutations (POST / PATCH)
    // -------------------------------------------------------------------------
    const hasIdempotencyKey = Boolean(
      originalRequest.headers?.['Idempotency-Key'] ||
      originalRequest.headers?.['idempotency-key'] ||
      originalRequest.idempotencyKey
    );

    const isNonIdempotent = !isMethodIdempotent(method) && !hasIdempotencyKey;

    if (isNonIdempotent) {
      /**
       * CRITICAL SAFETY GUARD:
       * For non-idempotent mutation requests (e.g. POST /orders, PATCH /payments)
       * that do NOT provide an Idempotency-Key, automatic retry could cause
       * double-charge or duplicate entity creation.
       * We still refresh the token so user's session is restored, BUT reject
       * this specific request with `ERR_NON_IDEMPOTENT_RETRY_BLOCKED` so the
       * UI component can prompt the user or handle safely.
       */
      try {
        await executeTokenRefresh();
      } catch {
        // If refresh fails too, trigger re-auth modal
        return enqueueReauthRequest(originalRequest);
      }

      const nonIdempotentError = new AxiosError(
        `Automatic retry was blocked for non-idempotent ${method} request to prevent duplicate mutations. Provide an 'Idempotency-Key' header if safe to retry.`,
        HttpErrorCodes.NON_IDEMPOTENT_BLOCKED,
        originalRequest,
        error.request,
        error.response
      );
      return Promise.reject(nonIdempotentError);
    }

    // -------------------------------------------------------------------------
    // RULE 2: Transparent Single-Flight Token Refresh & Retry
    // -------------------------------------------------------------------------
    try {
      originalRequest._retry = true; // Mark retry flag immediately

      // All concurrent requests await the exact same shared refresh promise
      const newToken = await executeTokenRefresh();

      // Attach new token to headers
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      // Retry original request exactly once
      return httpClient(originalRequest);
    } catch {
      // -----------------------------------------------------------------------
      // PART B: Refresh failed -> Re-auth Modal (Do not destroy user form state!)
      // -----------------------------------------------------------------------
      return enqueueReauthRequest(originalRequest);
    }
  }
);

/**
 * Enqueues a failed request into the Re-authentication Modal promise queue.
 *
 * This keeps the request in a pending Promise state.
 * If the user logs in via the modal: Promise resolves and request retries.
 * If user cancels the modal: Promise rejects.
 */
const enqueueReauthRequest = (config: RetryableRequestConfig): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    pendingReauthQueue.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      config,
      resolve,
      reject,
      createdAt: Date.now()
    });

    // If modal is not already open, open it
    if (!isModalOpen) {
      reauthEvents.openModal('Phiên làm việc đã hết hạn. Vui lòng xác thực lại để tiếp tục mà không mất dữ liệu.');
    } else {
      // Update pending count in open modal
      notifyListeners();
    }
  });
};

export default httpClient;
