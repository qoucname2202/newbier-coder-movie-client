/**
 * authService.ts
 *
 * Unified authentication service for the whole frontend.
 * It groups the login, register, refresh token, logout, profile, watchlist
 * and user stats calls.
 */

import { getApiBaseUrl } from '@/config/apiBase';
import { apiUrl } from '@/config/apiPaths';
import { setAccessToken, handleSessionHardFailure } from '@/auth/authToken';
import {
  clearMemorySession,
  ensureCsrfToken,
  ensureSessionReady,
  getMemoryAccessToken,
  getMemoryUser,
  resetSessionRestore,
  setMemoryAccessToken,
  setMemoryRememberMe,
  setMemoryUser,} from '@/utils/accessTokenStore';

/** Obfuscation key. It is an environment variable so it can be changed when needed. */
const OBFUSCATION_KEY = process.env.NEXT_PUBLIC_SESSION_OBFUSCATE || 'xK9mP2vL';

/**
 * Encodes a string into base64 with a prefix, so the value is easy to
 * recognize and to validate.
 *
 * @param plain - The clear text to encode.
 * @returns The encoded string, or the clear text when encoding fails.
 */
const obfEncode = (plain: string): string => {
  try {
    const prefixed = OBFUSCATION_KEY + plain + OBFUSCATION_KEY;
    // Simple base64 encoding.
    return btoa(encodeURIComponent(prefixed).replace(/%([0-9A-F]{2})/g,
      (_: string, p1: string) => String.fromCharCode(parseInt(p1, 16))));
  } catch {
    return plain;
  }
};

/**
 * Decodes a string that was obfuscated by {@link obfEncode}.
 *
 * @param encoded - The encoded value.
 * @returns The decoded string, or null when it cannot be decoded.
 */
const obfDecode = (encoded: string): string | null => {
  try {
    const decoded = decodeURIComponent(atob(encoded).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    // Strips the prefix and the suffix.
    if (decoded.startsWith(OBFUSCATION_KEY) && decoded.endsWith(OBFUSCATION_KEY)) {
      return decoded.slice(OBFUSCATION_KEY.length, -OBFUSCATION_KEY.length);
    }
    // Legacy plain JSON, still parsed correctly.
    JSON.parse(decoded);
    return decoded;
  } catch {
    return null;
  }
};

/**
 * The base URL of the backend. It always ends with `/api/v1`.
 *
 * This file used to resolve the base on its own
 * (`CORE_API_URL || API_URL || localhost/api`), and the logout and refresh
 * endpoints built their own URL with
 * `${API_URL.replace(/\/api\/?$/, '')}/api/v1/...`. That only worked when the
 * environment variable ended with `/api`. With the correct contract value
 * `/api/v1` the replacement did not match, so the URL became
 * `/api/v1/api/v1/auth/...` and answered 404 "Route not found".
 */
const API_URL = getApiBaseUrl();

/** Storage key constants.
 *
 * ONLY the non-sensitive keys are listed here.
 *
 * The access token and the refresh token are NOT stored in the Web Storage
 * any more:
 *   - the refresh token lives in an encrypted `HttpOnly` cookie, on the
 *     server side, so the JavaScript of the page cannot read it;
 *   - the access token lives in the memory of the tab
 *     (`src/utils/accessTokenStore.ts`).
 *
 * The keys below are the legacy ones, so the leftovers of a previous
 * version can be removed on the first run. */
const STORAGE_KEYS = {
  /** The legacy access token keys. They are only removed, never written. */
  legacyAccessTokens: ['auth_token', 'token', 'authToken'] as const,
  /** The legacy refresh token key. It is only removed, never written. */
  legacyRefreshToken: 'refresh_token',
  /** The user payload. It never contains a token. */
  user: 'user',
  isAccountLocked: 'isAccountLocked',
  /** The legacy NextAuth bridge token. It is only removed, never written. */
  legacySessionBackendToken: 'backendToken',
  /** The Zustand persist key of the user store. It is wiped on logout so
   * the store cannot keep a stale "authenticated" state. */
  userStore: 'user-store'
} as const;

/** Persisted remember-me flag stored in localStorage so subsequent page
 * loads can re-hydrate the checkbox state. The flag itself is not
 * security-sensitive (it does not grant access on its own): the session
 * itself lives in the `HttpOnly` cookie. */
const REMEMBER_ME_KEY = 'remember_me';

/**
 * Reads the access token of the current tab.
 *
 * The token is read from the MEMORY of the tab. It is never read from the
 * Web Storage, because a token in the Web Storage can be read by any
 * script running on the page.
 *
 * @returns The token, or null when there is no session.
 */
const readAccessToken = (): string | null => getMemoryAccessToken();

/**
 * Reads the access token from the LEGACY storage locations.
 *
 * It is only used to detect (and then remove) the leftovers of a previous
 * version. It never returns a token that is used for a request.
 *
 * @returns The legacy token, or null.
 */
const readLegacyAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const isUsable = (value: string | null): value is string =>
    Boolean(value) && value !== 'undefined' && value !== 'null';
  try {
    for (const key of STORAGE_KEYS.legacyAccessTokens) {
      const value = localStorage.getItem(key);
      if (isUsable(value)) return value;
    }
  } catch {
    /* the storage is disabled */
  }
  try {
    for (const key of STORAGE_KEYS.legacyAccessTokens) {
      const value = window.sessionStorage?.getItem(key);
      if (isUsable(value)) return value;
    }
  } catch {
    /* the storage is disabled */
  }
  return null;
};

/**
 * Reads the access token of the current tab.
 *
 * It is the single helper every service uses, so the token is always read
 * from the same place.
 *
 * @returns The token, or null when the user is not signed in.
 */
export const getStoredAccessToken = (): string | null => readAccessToken();

/**
 * Reads the refresh token of the current tab.
 *
 * The refresh token is NEVER available on the client side: it lives in the
 * encrypted `HttpOnly` cookie, on the server side. The renewal is done by
 * the server (`/api/auth/refresh`).
 *
 * @returns Always null. The function only exists to keep the old call
 *          sites working.
 */
const readRefreshToken = (): string | null => null;

/** The login information coming from the form. */
export interface LoginCredentials {
  username?: string;
  email?: string;
  password: string;
  rememberMe?: boolean;
}

/** The user payload returned by the backend. */
export interface UserPayload {
  _id?: string;
  id?: string;
  sub?: string;
  username?: string;
  email?: string;
  fullname?: string;
  role?: string;
  permissions?: string[];
  sessionId?: string;
  accountType?: string;
  avatar?: string;
  [key: string]: unknown;
}

/** The token and the user returned after a successful login.
 *
 * The `user` payload NEVER contains a token: it is stored in the browser,
 * so it must stay free of secrets. The access token is returned separately
 * and is kept in the memory of the tab. */
export interface LoginResult {
  success: true;
  user: UserPayload;
  token: string;
  data?: unknown;
  rememberMe?: boolean;
}

/**
 * The error thrown when the backend could not be reached.
 *
 * It carries the `serverStarting` flag, so the caller can tell a "wrong
 * password" apart from a "the server is not up yet" situation.
 */
export interface LoginServiceError extends Error {
  code?: string;
  serverStarting?: boolean;
}

/** The registration information. */
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullname?: string;
  [key: string]: unknown;
}

/** The result of a registration. */
export interface RegisterResult {
  success: true;
  message: string;
  data: unknown;
}

/**
 * Stores the user payload.
 *
 * The payload is always written to `sessionStorage` (the tab session). It is
 * ALSO written to `localStorage` when the "remember me" flag is set, so a
 * new tab can restore the session. The previous implementation always removed
 * the `localStorage` copy, which lost the user on the next visit even though
 * the token was still valid.
 *
 * @param user - The user payload to store.
 * @returns Nothing. Storage failures are swallowed on purpose.
 */
const persistUser = (user: UserPayload): void => {
  if (typeof window === 'undefined') return;
  const encoded = obfEncode(JSON.stringify(user));
  try {
    window.sessionStorage.setItem(STORAGE_KEYS.user, encoded);
  } catch {
    /* sessionStorage can be disabled */
  }
  try {
    if (localStorage.getItem(REMEMBER_ME_KEY) === '1') {
      localStorage.setItem(STORAGE_KEYS.user, encoded);
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  } catch {
    /* localStorage can be disabled */
  }
};

/** The authorization header used with fetch. */
export interface AuthHeader {
  Authorization?: string;
  [key: string]: string | undefined;
}

/** The profile update information. */
export interface ProfileData {
  fullName?: string;
  address?: string;
  phone?: string;
  dateOfBirth?: string;
  bio?: string;
  favoriteGenres?: string[];
  [key: string]: unknown;
}

/** The password change information. */
export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

/** An extended error with a code, used by the refresh flow. */
export interface ServiceError extends Error {
  code?: string;
  status?: number;
  cause?: unknown;
}

/**
 * Safely decodes the payload part of a JWT.
 *
 * @param token - The JWT to read.
 * @returns The decoded payload, or null when it cannot be parsed.
 */
const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

/**
 * Builds the user payload of the app.
 *
 * The token is NOT part of the returned object: it would end up in the
 * storage of the user payload.
 *
 * @param profile - The profile returned by the backend.
 * @param accessToken - The access token, used to rebuild the profile when
 *                      the backend did not send one.
 * @param fallbackUsername - The username of the form, used as a fallback.
 * @returns The user payload.
 */
const resolveUserFromProfile = (
  profile: Record<string, unknown> | null | undefined,
  accessToken: string,
  fallbackUsername: string
): UserPayload => {
  const source = (profile ?? {}) as Record<string, unknown>;

  if (Object.keys(source).length > 0) {
    return {
      ...source,
      _id: (source._id as string) || (source.id as string) || (source.sub as string),
      id: (source._id as string) || (source.id as string) || (source.sub as string),
      fullname: (source.fullname as string) || (source.username as string) || '',
      username: (source.username as string) || (source.email as string) || fallbackUsername,
      role: (source.role as string) || 'USER'
    } as UserPayload;
  }

  const decoded = decodeJwtPayload(accessToken) || {};
  return {
    _id: (decoded.sub as string) || (decoded.userId as string) || (decoded.id as string),
    id: (decoded.sub as string) || (decoded.userId as string) || (decoded.id as string),
    username: (decoded.username as string) || fallbackUsername,
    fullname: (decoded.fullname as string) || (decoded.username as string) || '',
    role: (decoded.role as string) || 'USER',
    permissions: (decoded.permissions as string[]) || [],
    sessionId: (decoded.sessionId as string) || '',
    accountType: (decoded.accountType as string) || 'Normal'
  };
};

/**
 * Removes every authentication artifact from the client side.
 *
 * The tokens are not in the Web Storage any more, so this only wipes:
 *   - the MEMORY of the tab (the access token and the user profile);
 *   - the LEGACY keys of the previous versions, so a token written by an
 *     older build can never be used again;
 *   - the remember-me flag and the persisted user store.
 *
 * The server-side session (the encrypted `HttpOnly` cookie) is cleared by
 * the `/api/auth/logout` route, not from here.
 *
 * @returns Nothing. Storage failures are swallowed on purpose.
 */
const clearLocalSession = (): void => {
  if (typeof window === 'undefined') return;

  // The tokens of the tab are gone.
  clearMemorySession();
  resetSessionRestore();
  setAccessToken(null, false);

  // Clear 100% of browser localStorage and sessionStorage
  try {
    localStorage.clear();
  } catch {
    /* localStorage can be disabled (private mode) */
  }
  try {
    window.sessionStorage.clear();
  } catch {
    /* sessionStorage can be disabled */
  }

  // Clear all accessible client-side cookies
  try {
    document.cookie.split(';').forEach((cookie) => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`;
      }
    });
  } catch {
    /* ignore */
  }

  // The components that keep the auth state in React (the AuthProvider and
  // the ad context) are notified, so the UI leaves the "signed in" state
  // right away instead of after the next reload.
  try {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('auth:session_expired', { detail: { terminal: true } }));
  } catch {
    /* the event is not supported */
  }
};

const authService = {
  /**
   * Signs the user in.
   *
   * The call goes to the LOCAL route `/api/auth/login`, which forwards the
   * credentials to the backend and stores the refresh token in an
   * encrypted `HttpOnly` cookie (server side).
   *
   * The answer only carries the access token and the token-free user
   * profile. The access token is kept in the MEMORY of the tab; it is
   * never written to the Web Storage.
   */
  login: async (credentials: LoginCredentials): Promise<LoginResult> => {
    const username = credentials.username || credentials.email || '';
    const rememberMe = credentials.rememberMe === true;
    const payload = {
      username: typeof username === 'string' ? username.trim() : '',
      password: credentials.password
    };

    // The CSRF nonce is required by the route. The cookie is not `HttpOnly`,
    // so the client can read it and copy it into the header.
    const csrfToken = await ensureCsrfToken();

    let response: Response;
    try {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
        },
        body: JSON.stringify({ ...payload, rememberMe })
      });
    } catch {
      // The local route itself could not be reached, or it did not answer.
      const error: LoginServiceError = new Error(
        'Cannot reach the server. Please check your connection.'
      );
      error.code = 'SERVER_STARTING';
      error.serverStarting = true;
      throw error;
    }

    let data: Record<string, unknown> | null = null;
    try {
      data = (await response.json()) as Record<string, unknown>;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message = (data?.message as string) || 'Authentication failed';
      const error: LoginServiceError = new Error(
        response.status === 401 || response.status === 403
          ? 'Invalid username or password'
          : message
      );
      // The backend did not answer at all (it is still starting, or the free
      // tier is doing a cold start). The flag lets the UI show the "waiting
      // for the server" notice and retry automatically.
      if (data?.serverStarting === true) {
        error.code = 'SERVER_STARTING';
        error.serverStarting = true;
      }
      throw error;
    }

    const rawAccessToken = (data?.token as string) || null;
    if (!rawAccessToken) {
      throw new Error('Không nhận được token từ máy chủ.');
    }

    // The remember-me flag is persisted, so the checkbox of the login form
    // can be restored. The flag itself grants nothing: the session lives in
    // the `HttpOnly` cookie.
    try {
      if (rememberMe) localStorage.setItem(REMEMBER_ME_KEY, '1');
      else localStorage.removeItem(REMEMBER_ME_KEY);
    } catch {
      /* localStorage may be disabled */
    }

    // The access token goes to the MEMORY of the tab. The legacy keys of
    // the previous versions are removed, so a token written by an older
    // build can never be used again.
    try {
      STORAGE_KEYS.legacyAccessTokens.forEach((key) => localStorage.removeItem(key));
      STORAGE_KEYS.legacyAccessTokens.forEach((key) => window.sessionStorage.removeItem(key));
      localStorage.removeItem(STORAGE_KEYS.legacyRefreshToken);
    } catch {
      /* the storage may be disabled */
    }

    setMemoryAccessToken(rawAccessToken);
    setMemoryRememberMe(rememberMe);
    setMemoryUser((data?.user as Record<string, unknown>) ?? null);
    resetSessionRestore();
    setAccessToken(rawAccessToken, true);

    const user = resolveUserFromProfile(
      data?.user as Record<string, unknown> | null | undefined,
      rawAccessToken,
      payload.username
    );

    // The user payload (without any token) is kept, so the UI can show it
    // right away.
    persistUser(user);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
    }

    return { success: true, user, token: rawAccessToken, data, rememberMe };
  },

  register: async (userData: RegisterData): Promise<RegisterResult> => {
    const response = await fetch(apiUrl(`authRegister`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Đăng ký thất bại';

      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        const textData = await response.text();

        if (textData.includes('<!DOCTYPE')) {
          errorMessage = 'Lỗi kết nối máy chủ. Vui lòng kiểm tra lại API URL.';
        }
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textData = await response.text();

      throw new Error('Server trả về định dạng không phải JSON. Vui lòng kiểm tra log và cấu hình API.');
    }

    const data = await response.json();

    if (!data.message) {
      throw new Error('Không nhận được phản hồi từ server');
    }

    return {
      success: true,
      message: data.message,
      data
    };
  },

  /**
   * Signs the user out.
   *
   * The call goes to the LOCAL route `/api/auth/logout`, which terminates
   * the session on the backend and clears the encrypted `HttpOnly` cookie.
   * The browser never handles the refresh token.
   *
   * The local session is cleared even when the server does not answer.
   */
  logout: async (): Promise<void> => {
    try {
      if (typeof window === 'undefined') {
        clearLocalSession();
        return;
      }

      const csrfToken = await ensureCsrfToken();

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
          },
          // A slow backend must not block the local cleanup.
          keepalive: true
        });
      } catch {
        /* the local session is cleared anyway */
      }
    } finally {
      clearLocalSession();
      if (typeof window !== 'undefined') {
        handleSessionHardFailure(true);
      }
    }
  },

  /**
   * Internal: wipe all client-side auth artifacts. Exposed for code paths
   * (e.g. refresh failure, account-locked page) that need to log the user
   * out without making another network call.
   */
  _clearLocalSession: (): void => clearLocalSession(),

  // ---------------------------------------------------------------------
  // Refresh token - single-flight pattern
  //
  // The refresh token NEVER travels through the browser: the route
  // `/api/auth/refresh` reads it from the encrypted `HttpOnly` cookie and
  // calls the backend itself. Only the fresh access token comes back.
  // ---------------------------------------------------------------------
  _refreshInFlight: null as Promise<string> | null,

  refreshToken: async (): Promise<string> => {
    if (authService._refreshInFlight) {
      return authService._refreshInFlight;
    }

    const promise = (async (): Promise<string> => {
      // The session has to be restored first, otherwise the route cannot
      // know which session to renew.
      await ensureSessionReady();

      const csrfToken = await ensureCsrfToken();

      let response: Response;
      try {
        response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
          }
        });
      } catch (networkError) {
        const err: ServiceError = new Error('Network error while refreshing token');
        err.code = 'NETWORK';
        err.cause = networkError;
        throw err;
      }

      if (response.status === 401 || response.status === 403) {
        clearLocalSession();
        const err: ServiceError = new Error('Refresh token rejected');
        err.code = 'REFRESH_REJECTED';
        err.status = response.status;
        throw err;
      }

      if (!response.ok) {
        const err: ServiceError = new Error(`Refresh failed (${response.status})`);
        err.code = 'TRANSIENT';
        err.status = response.status;
        throw err;
      }

      let data: { token?: string; user?: Record<string, unknown> } | null = null;
      try {
        data = (await response.json()) as { token?: string; user?: Record<string, unknown> };
      } catch {
        const err: ServiceError = new Error('Invalid refresh response');
        err.code = 'INVALID_RESPONSE';
        throw err;
      }

      const newAccessToken = data?.token || null;

      if (!newAccessToken) {
        const err: ServiceError = new Error('No access token in refresh response');
        err.code = 'INVALID_RESPONSE';
        throw err;
      }

      // The fresh token is kept in the MEMORY of the tab.
      setMemoryAccessToken(newAccessToken);
      if (data?.user) setMemoryUser(data.user);

      return newAccessToken;
    })();

    authService._refreshInFlight = promise.finally(() => {
      authService._refreshInFlight = null;
    });

    return authService._refreshInFlight;
  },

  getAuthHeader: async (): Promise<Record<string, string>> => {
    try {
      // The session is restored first, so the token is never missing
      // because the restore was still in flight.
      await ensureSessionReady();

      let token: string | null = readAccessToken();

      if (token) {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          let payload: { exp?: number } | null = null;
          try {
            payload = JSON.parse(atob(tokenParts[1])) as { exp?: number };
          } catch {
            payload = null;
          }
          const exp = payload?.exp ? payload.exp * 1000 : null;
          // The token is refreshed proactively when it is about to expire.
          if (exp && exp < Date.now() + 60000) {
            try {
              token = await authService.refreshToken();
            } catch (refreshError) {
              const err = refreshError as ServiceError;
              if (err?.code === 'REFRESH_REJECTED') {
                throw new Error('Session expired. Please log in again.');
              }

            }
          }
        }
      }

      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch (error) {

      throw error;
    }
  },

  isLoggedIn: (): boolean => {
    // The token is in the memory of the tab.
    if (readAccessToken()) return true;
    // The user payload is a fallback, for the moment between the restore
    // of the session and the arrival of the token.
    try {
      const userJson =
        (typeof window !== 'undefined' && window.sessionStorage
          ? window.sessionStorage.getItem(STORAGE_KEYS.user)
          : null) || localStorage.getItem(STORAGE_KEYS.user);
      if (!userJson) return false;
      const decoded = obfDecode(userJson) || userJson;
      const user = JSON.parse(decoded) as { _id?: string };
      return !!user?._id;
    } catch {
      return false;
    }
  },

  getCurrentUser: (): UserPayload | null => {
    // The profile of the memory is the freshest one.
    const fromMemory = getMemoryUser();
    if (fromMemory) return fromMemory as UserPayload;

    try {
      const userJson =
        (typeof window !== 'undefined' && window.sessionStorage
          ? window.sessionStorage.getItem(STORAGE_KEYS.user)
          : null) || localStorage.getItem(STORAGE_KEYS.user);
      if (!userJson) return null;
      const decoded = obfDecode(userJson) || userJson;
      return JSON.parse(decoded) as UserPayload;
    } catch (e) {

      return null;
    }
  },

  updateProfile: async (profileData: ProfileData): Promise<{ success: boolean; message: string; user: UserPayload }> => {

    const headers = await authService.getAuthHeader();

    const updateData = {
      fullname: profileData.fullName,
      address: profileData.address,
      phone: profileData.phone,
      date_of_birth: profileData.dateOfBirth,
      bio: profileData.bio,
      favoriteGenres: profileData.favoriteGenres
    };

    const response = await fetch(apiUrl(`authUpdateProfile`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Cập nhật thông tin thất bại';

      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;

      } else {
        const textData = await response.text();

      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    const currentUser = (() => {
      try {
        const fromSS = (typeof window !== 'undefined' && window.sessionStorage)
          ? window.sessionStorage.getItem('user')
          : null;
        if (fromSS) {
          const decoded = obfDecode(fromSS) || fromSS;
          return JSON.parse(decoded) as UserPayload;
        }
        // The "remember me" mode also keeps the user in the local storage.
        const fromLS = (typeof window !== 'undefined' && localStorage.getItem(REMEMBER_ME_KEY) === '1')
          ? localStorage.getItem('user')
          : null;
        if (fromLS) {
          const decoded = obfDecode(fromLS) || fromLS;
          return JSON.parse(decoded) as UserPayload;
        }
      } catch { /* ignore */ }
      return {} as UserPayload;
    })();
    const updatedUser: UserPayload = {
      ...currentUser,
      fullname: data.user.fullname,
      email: data.user.email,
      phone: data.user.phone || '',
      address: data.user.address || '',
      date_of_birth: data.user.date_of_birth || '',
      bio: data.user.bio || '',
      avatar: data.user.avatar || currentUser.avatar || '',
      favoriteGenres: data.user.favoriteGenres || [],
      fullName: data.user.fullname,
      dateOfBirth: data.user.date_of_birth
    };

    // The updated user is written to the session storage, and also to the
    // local storage when the "remember me" flag is set.
    persistUser(updatedUser);

    return {
      success: true,
      message: data.message || 'Cập nhật thông tin thành công',
      user: updatedUser
    };
  },

  uploadAvatar: async (file: File): Promise<{ success: boolean; message: string; avatarUrl: string; user: UserPayload }> => {
    const headers = await authService.getAuthHeader();

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(apiUrl(`authUploadAvatar`), {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Tải lên avatar thất bại';

      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;

      } else {
        const textData = await response.text();

      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    const currentUser = (() => {
      try {
        const fromSS = (typeof window !== 'undefined' && window.sessionStorage)
          ? window.sessionStorage.getItem('user')
          : null;
        if (fromSS) {
          const decoded = obfDecode(fromSS) || fromSS;
          return JSON.parse(decoded) as UserPayload;
        }
        // The "remember me" mode also keeps the user in the local storage.
        const fromLS = (typeof window !== 'undefined' && localStorage.getItem(REMEMBER_ME_KEY) === '1')
          ? localStorage.getItem('user')
          : null;
        if (fromLS) {
          const decoded = obfDecode(fromLS) || fromLS;
          return JSON.parse(decoded) as UserPayload;
        }
      } catch { /* ignore */ }
      return {} as UserPayload;
    })();
    const updatedUser: UserPayload = {
      ...currentUser,
      avatar: data.avatarUrl || data.user?.avatar
    };

    // The updated user is written to the session storage, and also to the
    // local storage when the "remember me" flag is set.
    persistUser(updatedUser);

    return {
      success: true,
      message: data.message || 'Cập nhật avatar thành công',
      avatarUrl: data.avatarUrl || data.user?.avatar || '',
      user: updatedUser
    };
  },

  getProfile: async (): Promise<UserPayload> => {
    const headers = await authService.getAuthHeader();

    const response = await fetch(apiUrl(`authUserDetail`), { headers });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Không thể lấy thông tin người dùng');
    }

    // The profile is written to the session storage, and also to the local
    // storage when the "remember me" flag is set.
    persistUser(data.user as UserPayload);
    return data.user as UserPayload;
  },

  changePassword: async (passwordData: PasswordData): Promise<{ success: boolean; message: string }> => {

    const headers = await authService.getAuthHeader();

    const dataToSend = {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword || passwordData.newPassword
    };

    const response = await fetch(apiUrl(`authChangePassword`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Đổi mật khẩu thất bại';

      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;

      } else {
        const textData = await response.text();

      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    return {
      success: true,
      message: data.message || 'Đổi mật khẩu thành công'
    };
  },

  deleteAccount: async (): Promise<{ success: boolean; message: string }> => {
    const headers = await authService.getAuthHeader();

    const response = await fetch(apiUrl(`authDeleteAccount`), {
      method: 'DELETE',
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Xóa tài khoản thất bại');
    }

    // The whole client-side session is wiped, exactly like a logout.
    clearLocalSession();

    return {
      success: true,
      message: data.message || 'Tài khoản đã được xóa thành công'
    };
  },

  getActivityHistory: async (): Promise<unknown> => {
    const headers = await authService.getAuthHeader();

    const response = await fetch(apiUrl(`authActivityHistory`), { headers });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Không thể lấy lịch sử hoạt động');
    }

    return data.activities;
  },

  getFavorites: async (): Promise<unknown> => {
    const headers = await authService.getAuthHeader();

    const response = await fetch(apiUrl(`authFavorites`), { headers });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Không thể lấy danh sách yêu thích');
    }

    return data.favorites;
  },

  getWatchlist: async (): Promise<unknown> => {
    // Dynamic import, to avoid an import cycle with watchlistService.
    const { default: watchlistService } = await import('./watchlistService');
    return watchlistService.getWatchlist();
  },

  addToWatchlist: async (movieData: unknown): Promise<unknown> => {
    const { default: watchlistService } = await import('./watchlistService');
    return watchlistService.addToWatchlist(movieData as Parameters<typeof watchlistService.addToWatchlist>[0]);
  },

  removeFromWatchlist: async (movieId: string): Promise<unknown> => {
    const { default: watchlistService } = await import('./watchlistService');
    return watchlistService.removeFromWatchlist(movieId);
  },

  getStats: async (): Promise<unknown> => {
    const headers = await authService.getAuthHeader();

    const response = await fetch(apiUrl(`authStats`), { headers });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Không thể lấy thống kê người dùng');
    }

    return data.stats;
  },

  getUserWatchStats: async (): Promise<{
    totalWatchedMovies: number;
    totalWatchedSeries: number;
    totalWatchTime: { hours: number; minutes: number; displayText: string };
    favoriteGenres: unknown[];
  }> => {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(apiUrl(`userStatsWatch`), { headers });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy thống kê xem phim`);
      }

      const data = await response.json();
      return (data.data as {
        totalWatchedMovies: number;
        totalWatchedSeries: number;
        totalWatchTime: { hours: number; minutes: number; displayText: string };
        favoriteGenres: unknown[];
      }) || {
        totalWatchedMovies: 0,
        totalWatchedSeries: 0,
        totalWatchTime: { hours: 0, minutes: 0, displayText: '0 giờ 0 phút' },
        favoriteGenres: []
      };
    } catch (error) {

      return {
        totalWatchedMovies: 0,
        totalWatchedSeries: 0,
        totalWatchTime: { hours: 0, minutes: 0, displayText: '0 giờ 0 phút' },
        favoriteGenres: []
      };
    }
  },

  getUserWeeklyActivity: async (): Promise<number[]> => {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(apiUrl(`userStatsWeeklyActivity`), { headers });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy hoạt động hằng tuần`);
      }

      const data = await response.json();
      return (data.data as number[]) || [0, 0, 0, 0, 0, 0, 0];
    } catch (error) {

      return [0, 0, 0, 0, 0, 0, 0];
    }
  },

  getUserGenreDistribution: async (): Promise<unknown[]> => {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(apiUrl(`userStatsGenreDistribution`), { headers });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy phân bố thể loại`);
      }

      const data = await response.json();
      return (data.data as unknown[]) || [];
    } catch (error) {

      return [];
    }
  },

  getUserAchievements: async (): Promise<{ achievements: unknown[]; stats: Record<string, unknown> }> => {
    const emptyResponse = {
      achievements: [],
      stats: {
        moviesWatched: 0,
        seriesWatched: 0,
        userLevel: 'Người mới',
        levelProgress: 0,
        totalLikes: 0,
        totalComments: 0,
        viewCount: 0,
        completedWatchCount: 0
      }
    };

    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(apiUrl(`userStatsAchievements`), { headers });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error ${response.status}: Không thể lấy thành tựu người dùng`);
      }

      const data = await response.json();
      return (data.data as { achievements: unknown[]; stats: Record<string, unknown> }) || emptyResponse;
    } catch (error) {

      return emptyResponse;
    }
  },

  /**
   * Polls backend to confirm the user account is still active.
   *
   * Intentionally disabled: backend has no verified account-status endpoint.
   * Use WebSocket lock notifications or 403 isAccountLocked response on other
   * API calls instead.
   */
  checkAccountStatus: async (): Promise<void> => {
    const reason =
      'checkAccountStatus is disabled: backend has no verified account-status endpoint. ' +
      'Use the WebSocket lock notifications or the 403 isAccountLocked response on other API calls instead.';
    const err: ServiceError = new Error(reason);
    err.code = 'NOT_IMPLEMENTED';
    throw err;
  }
};

export default authService;
