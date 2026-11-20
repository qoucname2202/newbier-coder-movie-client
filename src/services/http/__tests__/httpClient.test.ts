/**
 * @file httpClient.test.ts
 * @description Unit tests for enterprise HTTP client interceptor verifying:
 * 1. Single 401 request -> automatic refresh -> retry succeeds.
 * 2. 5 parallel 401 requests -> only 1 single refresh call executed.
 * 3. Refresh failure -> Re-auth modal opens -> user logs in -> queued request retries.
 * 4. 403 Forbidden does NOT trigger token refresh.
 * 5. /auth/refresh endpoint answering 401 does NOT trigger infinite recursion.
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  httpClient,
  executeTokenRefresh,
  reauthEvents,
  isExcludedAuthEndpoint,
  isMethodIdempotent
} from '../httpClient';
import { HttpErrorCodes, RetryableRequestConfig } from '../types';
import { setMemoryAccessToken, getMemoryAccessToken } from '@/utils/accessTokenStore';

// Global mocks
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Enterprise HTTP Client Interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setMemoryAccessToken(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * TEST CASE 1: Single 401 request -> auto-refresh -> retry succeeds
   */
  it('CASE 1: should refresh token and retry original request when receiving 401', async () => {
    let callCount = 0;
    const originalToken = 'expired-token';
    const refreshedToken = 'fresh-valid-token-123';

    setMemoryAccessToken(originalToken);

    // Mock fetch for /api/auth/refresh
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: refreshedToken })
    });

    // Mock Axios adapter
    const adapterMock = jest.fn(async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      callCount++;
      if (callCount === 1) {
        // First attempt fails with 401 Unauthorized
        const error = new AxiosError(
          'Request failed with status code 401',
          'ERR_BAD_REQUEST',
          config,
          {},
          {
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
            data: { message: 'Token expired' }
          }
        );
        throw error;
      }

      // Second attempt (retry) succeeds with 200
      return {
        data: { success: true, message: 'Protected resource loaded' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    });

    httpClient.defaults.adapter = adapterMock;

    const response = await httpClient.get<{ success: boolean }>('/api/v1/user/profile');

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    // Request adapter called twice: initial + retry
    expect(callCount).toBe(2);
    // Refresh endpoint was called exactly once
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // Memory token was updated
    expect(getMemoryAccessToken()).toBe(refreshedToken);
  });

  /**
   * TEST CASE 2: 5 parallel 401 requests -> exactly 1 refresh call executed
   */
  it('CASE 2: should collapse 5 concurrent 401 requests into a single refresh call', async () => {
    let refreshCallCount = 0;
    const refreshedToken = 'single-flight-token-456';

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/refresh')) {
        refreshCallCount++;
        // Simulate minor network latency so parallel requests queue up
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          ok: true,
          status: 200,
          json: async () => ({ token: refreshedToken })
        };
      }
      return { ok: false, status: 500, json: async () => ({}) };
    });

    const requestCounters = [0, 0, 0, 0, 0];

    const adapterMock = jest.fn(async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      const indexMatch = config.url?.match(/item-(\d+)/);
      const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;
      requestCounters[index]++;

      if (requestCounters[index] === 1) {
        // First attempt for this request fails with 401
        throw new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          config,
          {},
          {
            status: 401,
            statusText: 'Unauthorized',
            headers: {},
            config,
            data: {}
          }
        );
      }

      // Retry succeeds
      return {
        data: { index, ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    });

    httpClient.defaults.adapter = adapterMock;

    // Dispatch 5 concurrent requests
    const promises = [0, 1, 2, 3, 4].map((i) =>
      httpClient.get<{ index: number; ok: boolean }>(`/api/v1/resource/item-${i}`)
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    results.forEach((res, i) => {
      expect(res.data.index).toBe(i);
      expect(res.data.ok).toBe(true);
    });

    // CRITICAL ASSERTION: Exactly 1 refresh call occurred despite 5 simultaneous 401s
    expect(refreshCallCount).toBe(1);
    expect(getMemoryAccessToken()).toBe(refreshedToken);
  });

  /**
   * TEST CASE 3: Refresh fails -> Re-auth modal opens -> user logs in -> requests retry
   */
  it('CASE 3: should queue failed request in re-auth modal when refresh fails, and retry upon login', async () => {
    let attempt = 0;
    const reauthNewToken = 'reauthenticated-bearer-token-789';

    // Refresh fails with 401 (refresh token expired)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Refresh token expired' })
    });

    let modalOpened = false;
    const unsubscribe = reauthEvents.subscribe((state) => {
      if (state.isOpen) {
        modalOpened = true;
      }
    });

    const adapterMock = jest.fn(async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      attempt++;
      if (attempt === 1) {
        throw new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          config,
          {},
          { status: 401, statusText: 'Unauthorized', headers: {}, config, data: {} }
        );
      }

      // Succeeded after re-auth
      return {
        data: { saved: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      };
    });

    httpClient.defaults.adapter = adapterMock;

    // Initiate request while user is editing form
    const requestPromise = httpClient.get<{ saved: boolean }>('/api/v1/user/draft-document');

    // Wait a tick for the interceptor to process 401, attempt refresh, fail, and open modal
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(modalOpened).toBe(true);

    // Simulate user entering password and clicking "Submit" in the modal
    reauthEvents.onLoginSuccess(reauthNewToken);

    // Await the suspended request promise
    const result = await requestPromise;

    expect(result.status).toBe(200);
    expect(result.data.saved).toBe(true);
    expect(getMemoryAccessToken()).toBe(reauthNewToken);

    unsubscribe();
  });

  /**
   * TEST CASE 4: 403 Forbidden does NOT trigger token refresh
   */
  it('CASE 4: should immediately reject on 403 Forbidden without calling refresh', async () => {
    const adapterMock = jest.fn(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Forbidden resource',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config,
          data: { message: 'Access denied: Insufficient privileges' }
        }
      );
    });

    httpClient.defaults.adapter = adapterMock;

    await expect(httpClient.get('/api/v1/admin/super-secret')).rejects.toMatchObject({
      code: HttpErrorCodes.FORBIDDEN
    });

    // Verify refresh was NEVER called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * TEST CASE 5: /auth/refresh endpoint answering 401 does NOT trigger infinite loop
   */
  it('CASE 5: should reject 401 on excluded auth endpoints without triggering recursive refresh', async () => {
    const adapterMock = jest.fn(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { message: 'Session dead' }
        }
      );
    });

    httpClient.defaults.adapter = adapterMock;

    // Calling an excluded endpoint (like /api/auth/refresh itself)
    await expect(httpClient.post('/api/auth/refresh')).rejects.toThrow();

    // Verify it was called only once and did not start a refresh loop
    expect(adapterMock).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * BONUS CASE: Non-idempotent mutation guard (POST without Idempotency-Key)
   */
  it('BONUS: should block automatic retry for non-idempotent POST without Idempotency-Key to prevent double-mutation', async () => {
    // Refresh succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ token: 'fresh-key-token' })
    });

    const adapterMock = jest.fn(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        { status: 401, statusText: 'Unauthorized', headers: {}, config, data: {} }
      );
    });

    httpClient.defaults.adapter = adapterMock;

    // POST request with NO Idempotency-Key
    await expect(
      httpClient.post('/api/v1/payments/checkout', { amount: 100 })
    ).rejects.toMatchObject({
      code: HttpErrorCodes.NON_IDEMPOTENT_BLOCKED
    });

    // Adapter was called only once (no automatic resend)
    expect(adapterMock).toHaveBeenCalledTimes(1);
    // Token was nonetheless refreshed so subsequent user actions succeed
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
