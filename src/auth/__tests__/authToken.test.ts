/**
 * @file authToken.test.ts
 * @description Unit tests for ensureFreshToken and background token lifecycle management.
 */

import {
  ensureFreshToken,
  setAccessToken,
  getAccessToken,
  decodeJwt,
  getSafeRedirectPath
} from '../authToken';

// Helper to generate mock JWTs with specific expiration timestamps
const createMockJwt = (expInSeconds: number): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'user_123', exp: expInSeconds }));
  const signature = 'mock_signature_hash';
  return `${header}.${payload}.${signature}`;
};

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('Access Token Lifecycle Manager (ensureFreshToken)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAccessToken(null, false);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * TEST 1: Token is healthy and has plenty of time remaining (> 30s)
   */
  it('TEST 1: should return existing token without calling refresh when token has > 30s remaining', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    // Expires in 15 minutes (900 seconds)
    const validToken = createMockJwt(nowSeconds + 900);

    setAccessToken(validToken, false);

    const token = await ensureFreshToken(30);

    // Token must remain identical
    expect(token).toBe(validToken);
    // Refresh endpoint must NOT be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * TEST 2: Token is expiring soon (< 30s remaining)
   */
  it('TEST 2: should trigger refresh when token has <= 30s remaining', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    // Expires in 10 seconds (under the 30s threshold)
    const expiringSoonToken = createMockJwt(nowSeconds + 10);
    const freshToken = createMockJwt(nowSeconds + 3600);

    setAccessToken(expiringSoonToken, false);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: freshToken })
    });

    const token = await ensureFreshToken(30);

    // Returns fresh token
    expect(token).toBe(freshToken);
    // Memory store updated
    expect(getAccessToken()).toBe(freshToken);
    // Refresh endpoint was called exactly once
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  /**
   * TEST 3: Token is already expired (exp < now)
   */
  it('TEST 3: should trigger refresh immediately when token is already expired', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    // Expired 60 seconds ago
    const expiredToken = createMockJwt(nowSeconds - 60);
    const freshToken = createMockJwt(nowSeconds + 3600);

    setAccessToken(expiredToken, false);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ accessToken: freshToken })
    });

    const token = await ensureFreshToken(30);

    expect(token).toBe(freshToken);
    expect(getAccessToken()).toBe(freshToken);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  /**
   * TEST 4: Multiple concurrent calls to ensureFreshToken() share a single refresh request
   */
  it('TEST 4: should collapse multiple concurrent calls into exactly 1 refresh call', async () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiredToken = createMockJwt(nowSeconds - 100);
    const freshToken = createMockJwt(nowSeconds + 3600);

    setAccessToken(expiredToken, false);

    let networkCallCount = 0;
    mockFetch.mockImplementation(async () => {
      networkCallCount++;
      // Simulate 25ms async latency
      await new Promise((resolve) => setTimeout(resolve, 25));
      return {
        ok: true,
        status: 200,
        json: async () => ({ accessToken: freshToken })
      };
    });

    // 5 concurrent requests simulate multiple components/widgets querying ensureFreshToken at once
    const promises = [
      ensureFreshToken(30),
      ensureFreshToken(30),
      ensureFreshToken(30),
      ensureFreshToken(30),
      ensureFreshToken(30)
    ];

    const results = await Promise.all(promises);

    // All callers receive the fresh token
    expect(results).toHaveLength(5);
    results.forEach((token) => expect(token).toBe(freshToken));

    // CRITICAL: Exactly 1 HTTP request executed
    expect(networkCallCount).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  /**
   * BONUS TEST: Open Redirect Protection
   */
  it('BONUS: should sanitize redirect URLs to prevent open redirect vulnerabilities', () => {
    // Malicious external redirects must be sanitized to '/'
    expect(decodeURIComponent(getSafeRedirectPath('https://evil-phishing.com'))).toBe('/');
    expect(decodeURIComponent(getSafeRedirectPath('//attacker.com/steal-session'))).toBe('/');
    expect(decodeURIComponent(getSafeRedirectPath('javascript:alert(1)'))).toBe('/');

    // Legitimate internal paths must be preserved
    expect(decodeURIComponent(getSafeRedirectPath('/user/profile'))).toBe('/user/profile');
    expect(decodeURIComponent(getSafeRedirectPath('/movies/batman?quality=hd'))).toBe(
      '/movies/batman?quality=hd'
    );
  });
});
