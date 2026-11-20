/**
 * @file specialHandlers.ts
 * @description Specialized token freshness checks for heavy uploads and WebSocket/SSE reconnect flows.
 */

import { getMemoryAccessToken } from '@/utils/accessTokenStore';
import { executeTokenRefresh } from './httpClient';

/**
 * Decodes the JWT exp field without validating signature (browser-side only).
 *
 * @param token - The raw JWT token string.
 * @returns Expiration timestamp in seconds or null if invalid.
 */
export const decodeTokenExpiry = (token: string): number | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
};

/**
 * Ensures the memory access token has sufficient remaining validity before starting
 * a long-running operation (such as multi-megabyte file chunk uploads).
 *
 * If the current token will expire within `minRemainingSeconds` (default: 60s),
 * it proactively invokes the shared token refresh before the upload stream starts.
 *
 * @param minRemainingSeconds - Minimum lifetime buffer required in seconds.
 * @returns The guaranteed fresh access token.
 */
export const ensureFreshToken = async (minRemainingSeconds: number = 60): Promise<string> => {
  const currentToken = getMemoryAccessToken();

  if (!currentToken) {
    // No token in memory: perform refresh
    return executeTokenRefresh();
  }

  const expInSeconds = decodeTokenExpiry(currentToken);
  if (!expInSeconds) {
    return currentToken;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const remainingLifetime = expInSeconds - nowInSeconds;

  // If token is expired or expires very soon during upload, refresh beforehand
  if (remainingLifetime <= minRemainingSeconds) {
    return executeTokenRefresh();
  }

  return currentToken;
};

/**
 * WebSocket Reconnect Manager for handling custom server close code 4401 (Unauthorized).
 */
export interface ManagedWebSocketOptions {
  url: string | ((token: string) => string);
  protocols?: string | string[];
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  maxReconnectAttempts?: number;
}

export class ManagedWebSocket {
  private ws: WebSocket | null = null;
  private options: ManagedWebSocketOptions;
  private reconnectAttempts = 0;
  private isDisposed = false;

  constructor(options: ManagedWebSocketOptions) {
    this.options = options;
  }

  /**
   * Establishes or re-establishes the WebSocket connection with a fresh token.
   */
  public async connect(): Promise<void> {
    if (this.isDisposed) return;

    try {
      const freshToken = await ensureFreshToken(30);
      const targetUrl =
        typeof this.options.url === 'function' ? this.options.url(freshToken) : this.options.url;

      this.ws = new WebSocket(targetUrl, this.options.protocols);

      this.ws.onopen = (event: Event) => {
        this.reconnectAttempts = 0;
        this.options.onOpen?.(event);
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.options.onMessage?.(event);
      };

      this.ws.onerror = (event: Event) => {
        this.options.onError?.(event);
      };

      this.ws.onclose = async (event: CloseEvent) => {
        this.options.onClose?.(event);

        // Server closed connection with custom code 4401 (Unauthorized / Access Token Expired)
        if (event.code === 4401 && !this.isDisposed) {
          try {
            // Proactively refresh access token
            await executeTokenRefresh();
            // Reconnect with new token
            await this.connect();
          } catch (err) {
            console.error('[ManagedWebSocket] Token refresh failed on 4401:', err);
          }
        }
      };
    } catch (error) {
      console.error('[ManagedWebSocket] Connect error:', error);
    }
  }

  /**
   * Sends data over the active socket.
   */
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  /**
   * Closes the connection and prevents automatic reconnects.
   */
  public close(code?: number, reason?: string): void {
    this.isDisposed = true;
    this.ws?.close(code, reason);
  }
}
