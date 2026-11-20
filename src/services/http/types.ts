/**
 * @file types.ts
 * @description Type definitions for enterprise HTTP client, re-authentication, and session lifecycle.
 */

import type { InternalAxiosRequestConfig } from 'axios';

/**
 * Extended Axios request configuration with retry tracking and custom flags.
 */
export interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  /**
   * Internal flag indicating whether the request has already been retried once
   * after a 401 Unauthorized response. Prevents recursive retry loops.
   */
  _retry?: boolean;

  /**
   * Optional custom identifier for request idempotency tracking.
   */
  idempotencyKey?: string;

  /**
   * Flag to skip automatic 401 interception (e.g. for background silent pings).
   */
  skipAuthRefresh?: boolean;
}

/**
 * Custom error codes thrown by the HTTP client and interceptors.
 */
export const HttpErrorCodes = {
  UNAUTHORIZED: 'ERR_UNAUTHORIZED',
  FORBIDDEN: 'ERR_FORBIDDEN',
  REFRESH_FAILED: 'ERR_TOKEN_REFRESH_FAILED',
  NON_IDEMPOTENT_BLOCKED: 'ERR_NON_IDEMPOTENT_RETRY_BLOCKED',
  REAUTH_CANCELLED: 'ERR_REAUTH_CANCELLED',
  NETWORK_ERROR: 'ERR_NETWORK',
  REQUEST_ABORTED: 'ERR_REQUEST_ABORTED'
} as const;

export type HttpErrorCode = (typeof HttpErrorCodes)[keyof typeof HttpErrorCodes];

/**
 * Standard pending request holder queued while waiting for user re-authentication in the modal.
 */
export interface PendingReauthRequest {
  id: string;
  config: RetryableRequestConfig;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  createdAt: number;
}

/**
 * Re-authentication modal event payload.
 */
export interface ReauthModalState {
  isOpen: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  pendingCount: number;
}

/**
 * Credentials structure submitted through the Re-authentication Modal.
 */
export interface ReauthCredentials {
  username?: string;
  email?: string;
  password?: string;
}

/**
 * Form draft metadata for session restoration fallback.
 */
export interface FormDraft<T = Record<string, unknown>> {
  formId: string;
  timestamp: number;
  pathname: string;
  data: T;
}
