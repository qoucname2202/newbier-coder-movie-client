/**
 * AuthContext.tsx
 *
 * The authentication context. It exposes the current user, the login,
 * register and logout actions, the account-lock detection through a periodic
 * poll and the WebSocket, plus the HOCs that protect the routes.
 */
import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut, type SessionProviderProps } from 'next-auth/react';
import authService, { getStoredAccessToken } from '@/API/services/authService';
import { getApiOrigin, resolveWebSocketUrl } from '@/config/apiBase';
import {
  ensureSessionReady,
  getMemoryAccessToken,
  getMemoryUser,
  setMemoryUser,} from '@/utils/accessTokenStore';

/** Obfuscation helpers, used to hide the user info in DevTools. */
const OBFUSCATION_KEY = process.env.NEXT_PUBLIC_SESSION_OBFUSCATE || 'xK9mP2vL';

const obfEncode = (plain: string): string => {
  try {
    const prefixed = OBFUSCATION_KEY + plain + OBFUSCATION_KEY;
    return btoa(encodeURIComponent(prefixed).replace(/%([0-9A-F]{2})/g,
      (_: string, p1: string) => String.fromCharCode(parseInt(p1, 16))));
  } catch {
    return plain;
  }
};

const obfDecode = (encoded: string): string | null => {
  try {
    const decoded = decodeURIComponent(atob(encoded).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    if (decoded.startsWith(OBFUSCATION_KEY) && decoded.endsWith(OBFUSCATION_KEY)) {
      return decoded.slice(OBFUSCATION_KEY.length, -OBFUSCATION_KEY.length);
    }
    // Legacy plain JSON
    JSON.parse(decoded);
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Rebuilds a minimal user object from a JWT.
 *
 * It is used when a valid token exists but the stored user payload is
 * missing, so the app does not end up in the "token present but
 * `isAuthenticated` is false" state.
 *
 * @param token - The access token.
 * @returns The user, or null when the token cannot be decoded.
 */
const decodeJwtUser = (token: string): AuthUser | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = decodeURIComponent(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''));
    const payload = JSON.parse(json) as Record<string, unknown>;
    const id = (payload.sub as string) || (payload.userId as string) || (payload.id as string);
    if (!id) return null;
    return {
      _id: id,
      id,
      username: (payload.username as string) || (payload.email as string) || '',
      fullname: (payload.fullname as string) || (payload.username as string) || '',
      email: (payload.email as string) || '',
      role: (payload.role as string) || 'USER'
    };
  } catch {
    return null;
  }
};

export interface AuthUser {
  _id?: string;
  fullname?: string;
  email?: string;
  username?: string;
  avatar?: string;
  role?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  /**
   * The backend token is NEVER part of this payload any more: it lives in
   * the encrypted `HttpOnly` session cookie, on the server side.
   */
  [key: string]: unknown;
}

export interface LoginCredentials {
  identifier?: string;
  email?: string;
  password: string;
  [key: string]: unknown;
}

export interface RegisterPayload {
  fullname: string;
  username?: string;
  email: string;
  password: string;
  [key: string]: unknown;
}

export interface AuthResult {
  success: boolean;
  data?: unknown;
  user?: AuthUser;
  error?: string;
  isAccountLocked?: boolean;
  /**
   * `true` when the backend could not be reached (it is still starting).
   * The login form shows the "waiting for the server" notice and retries
   * automatically in that case.
   */
  serverStarting?: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAccountLocked: boolean;
  showAccountLockedBanner: boolean;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: Record<string, unknown>) => Promise<AuthResult>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatarUrl?: string; error?: string; isAccountLocked?: boolean }>;
  refreshUser: () => Promise<AuthUser | null>;
  hideAccountLockedBanner: () => void;
  resetAccountLockStatus: () => void;
  updateAvatarInUI: (user: AuthUser) => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  session?: SessionProviderProps['session'];
}

const ACCOUNT_LOCKED_ROUTE = '/common/account-locked';
const LOGIN_ROUTE = '/auth/login';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccountLocked, setIsAccountLocked] = useState<boolean>(false);
  const [showAccountLockedBanner, setShowAccountLockedBanner] = useState<boolean>(false);

  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const logoutInFlightRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // Tracks the NextAuth session.
  const { data: session, status: sessionStatus } = useSession();

  // Mount tracking that is safe with React Strict Mode.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Listens to the storage changes, so a login or logout in another tab is
  // reflected here. The user info lives in sessionStorage, not localStorage.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleStorageChange = () => {
      const remembered = localStorage.getItem('remember_me') === '1';
      const ssUser = window.sessionStorage ? window.sessionStorage.getItem('user') : null;
      const lsUser = remembered ? localStorage.getItem('user') : null;
      const rawUser = ssUser || lsUser;
      if (rawUser) {
        try {
          const decoded = obfDecode(rawUser) || rawUser;
          setUser(JSON.parse(decoded));
        } catch (err) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Resolves the initial user from the session.
   *
   * The session lives in an encrypted `HttpOnly` cookie, on the server side.
   * The client asks the server for the access token (and the user profile)
   * with `/api/auth/session-state`; the refresh token never reaches the
   * browser.
   *
   * The user payload is read from the memory first, then from the storage
   * (where the token-free profile is kept).
   */
  useEffect(() => {
    let cancelled = false;

    const checkLoggedIn = async () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      try {
        // The NextAuth session (Google / Facebook) still exists, but its
        // backend token is NOT returned to the browser any more. The route
        // `/api/auth/oauth-session` reads the token on the server and puts
        // it into the encrypted `HttpOnly` session cookie.
        if (session?.user) {
          try {
            await fetch('/api/auth/oauth-session', {
              method: 'POST',
              credentials: 'same-origin',
              headers: { Accept: 'application/json' },
            });
          } catch {
            /* the session restore below reports the problem */
          }

          // The session is restored from the `HttpOnly` cookie.
          await ensureSessionReady();

          if (cancelled) {
            setLoading(false);
            return;
          }

          const bridgedToken = getMemoryAccessToken();
          const bridgedUser = getMemoryUser();

          if (bridgedToken) {
            const userWithToken: AuthUser = {
              ...(session.user as AuthUser),
              ...((bridgedUser ?? {}) as AuthUser)
            };
            // The user payload is stored without any token.
            const encodedUser = obfEncode(JSON.stringify(userWithToken));
            sessionStorage.setItem('user', encodedUser);
            if (localStorage.getItem('remember_me') === '1') {
              localStorage.setItem('user', encodedUser);
            }
            if (!cancelled) setUser(userWithToken);
            setLoading(false);
            return;
          }
        }

        // The session is restored from the `HttpOnly` cookie. The route
        // refreshes the access token when it is expired.
        await ensureSessionReady();

        if (cancelled) {
          setLoading(false);
          return;
        }

        const accessToken = getMemoryAccessToken();
        const memoryUser = getMemoryUser();

        // The user payload is read from the memory first, with the storage
        // as the fallback (the profile is kept there without any token).
        const storedUser = (() => {
          if (memoryUser) return JSON.stringify(memoryUser);
          const remembered = localStorage.getItem('remember_me') === '1';
          const ssUser = window.sessionStorage ? window.sessionStorage.getItem('user') : null;
          const lsUser = remembered ? localStorage.getItem('user') : null;
          const rawUser = ssUser || lsUser;
          if (!rawUser) return null;
          try {
            return obfDecode(rawUser) || rawUser;
          } catch {
            return null;
          }
        })();

        if (accessToken && storedUser) {
          try {
            if (!cancelled) setUser(JSON.parse(storedUser));
          } catch (err) {
            if (!cancelled) setUser(null);
          }
        } else if (accessToken) {
          // The token is valid but the user payload is missing (the storage
          // was cleared, or the user was created by another flow). The
          // payload is rebuilt from the JWT, so the app does not show a
          // "signed out" state while a valid token is being used.
          const fromToken = decodeJwtUser(accessToken);
          if (!cancelled) setUser(fromToken);
        } else {
          // If there is no access token in memory or cookie, the user is NOT authenticated.
          // Do NOT revive a stale ghost user from storage without a valid access token!
          if (!cancelled) setUser(null);
        }
      } catch (err) {
        if (!cancelled) setError('Could not check authentication status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void checkLoggedIn();

    const handleSessionExpired = (): void => {
      setUser(null);
      setLoading(false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:session_expired', handleSessionExpired);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:session_expired', handleSessionExpired);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Polls backend to confirm the user account is still active.
   * Throttled to once every 30s and disabled for the rest of the session
   * after the first NOT_IMPLEMENTED response. Lock notifications still
   * arrive via WebSocket and via 403 isAccountLocked on other calls.
   */
  const checkAccountStatus = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem('accountStatusDisabled') === '1') return;

    const pathname = window.location.pathname;
    if (pathname === ACCOUNT_LOCKED_ROUTE || pathname === LOGIN_ROUTE) return;
    if (!user) return;

    if (localStorage.getItem('isAccountLocked') === 'true') {
      if (pathname !== ACCOUNT_LOCKED_ROUTE) {
        window.location.href = ACCOUNT_LOCKED_ROUTE;
      }
      return;
    }

    const now = Date.now();
    const lastCheck = parseInt(localStorage.getItem('lastAccountStatusCheck') || '0', 10);
    if (now - lastCheck < 30000) return;
    localStorage.setItem('lastAccountStatusCheck', now.toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    abortControllerRef.current = controller;

    try {
      const result = await (authService as unknown as { checkAccountStatus: (opts: { signal: AbortSignal }) => Promise<unknown> }).checkAccountStatus({ signal: controller.signal });
      if (!isMountedRef.current) return;
      if (result && (result as { isAccountLocked?: boolean }).isAccountLocked && pathname !== ACCOUNT_LOCKED_ROUTE) {
        localStorage.setItem('isAccountLocked', 'true');
        window.location.href = ACCOUNT_LOCKED_ROUTE;
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const e = err as { name?: string; code?: string; message?: string };
      if (e?.name === 'AbortError') return;
      if (e?.code === 'NOT_IMPLEMENTED') {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('accountStatusDisabled', '1');
          if (!window.sessionStorage.getItem('accountStatusDisabledLogged')) {
            window.sessionStorage.setItem('accountStatusDisabledLogged', '1');

          }
        }
        return;
      }

    } finally {
      clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && user._id) {
      checkAccountStatus();
    }
  }, [user, checkAccountStatus]);

  /**
   * WebSocket connection for real-time account-status notifications.
   * Honors NEXT_PUBLIC_WS_ENABLED, uses exponential backoff with caps, and
   * stops reconnecting on hard 4xx close codes.
   */
  useEffect(() => {
    if (!user || !user._id) return;
    if (process.env.NEXT_PUBLIC_WS_ENABLED === 'false') return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let ws: WebSocket | null = null;
    let attempts = 0;

    /**
     * Resolves the WebSocket URL through `resolveWebSocketUrl()`, the single
     * source of truth.
     *
     * This function used to read the two environment variables on its own and
     * append `/ws` by hand. That logic was duplicated in `admin/users` and
     * `WebSocketContext`, so three places built the URL in three different
     * ways. Now there is only one.
     */
    const wsUrl = resolveWebSocketUrl();
    if (!wsUrl) {
      return undefined;
    }

    const logScope = '[WS]';

    const scheduleReconnect = () => {
      if (cancelled) return;
      if (!user || !user._id) return;
      if (reconnectTimer) return;
      const delay = Math.min(30000, 2000 * Math.pow(2, Math.min(attempts, 4)));
      attempts += 1;
      if (attempts > 8) {

        return;
      }
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!cancelled) connect();
      }, delay);
    };

    const connect = () => {
      if (cancelled) return;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
      } catch (err) {

        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        attempts = 0;

        // The session is restored first, so the token of the memory is
        // available even right after a reload.
        void ensureSessionReady().then(() => {
          const token = getStoredAccessToken();
          if (token && ws && ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'authenticate', token }));
            } catch (sendErr) {

            }
          }
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string; userId?: string; isActive?: boolean; message?: string };
          if (data.type === 'account_status_changed' && data.userId === user._id) {
            if (data.isActive === false) {
              setIsAccountLocked(true);
              setShowAccountLockedBanner(true);
              localStorage.setItem('isAccountLocked', 'true');
            } else if (data.isActive === true) {
              setIsAccountLocked(false);
              setShowAccountLockedBanner(false);
              localStorage.removeItem('isAccountLocked');
              alert(data.message || 'Your account has been unlocked.');
            }
          }
        } catch (err) {

        }
      };

      ws.onerror = () => {

      };

      ws.onclose = (event) => {

        if (cancelled) return;
        if (!user || !user._id) return;
        if (document.visibilityState === 'hidden') return;
        if (event?.code >= 4000 && event?.code < 5000) return;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        try {
          if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close(1000, 'client cleanup');
          }
        } catch {
          /* ignore */
        }
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
      }
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      setError(null);
      setIsAccountLocked(false);
      const data = await authService.login(credentials);
      if (data.success && data.user) {
        localStorage.removeItem('lastAccountStatusCheck');
        localStorage.removeItem('isAccountLocked');
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('accountStatusDisabled');
          window.sessionStorage.removeItem('accountStatusDisabledLogged');
        }
        setUser(data.user as AuthUser);
        return { success: true, data };
      }
      throw new Error('Login failed: no user info received');
    } catch (err) {
      const error = err as { response?: { data?: { isAccountLocked?: boolean } }; message?: string };
      // Invalid credentials is an expected user-input failure, not a bug.
      // Use warn (no stack trace) so the dev console is not spammed every
      // time someone mistypes a password. Server/network errors still log
      // as warn below without a stack trace.

      if (error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        const message = 'Your account has been locked. Please contact an administrator.';
        setError(message);
        return { success: false, error: message, isAccountLocked: true };
      }
      const message = error.message || 'Login failed';
      setError(message);
      // The backend did not answer (it is still starting). The flag is
      // forwarded to the login form, so it can show the "waiting for the
      // server" notice instead of a dead-end error.
      const serverStarting =
        (err as { code?: string })?.code === 'SERVER_STARTING' ||
        (err as { serverStarting?: boolean })?.serverStarting === true;
      return { success: false, error: message, serverStarting };
    }
  };

  const register = async (userData: RegisterPayload): Promise<AuthResult> => {
    try {
      setError(null);
      if (!userData.fullname) {
        throw new Error('Full name is required');
      }
      const data = await authService.register(userData as unknown as { username: string; email: string; password: string; fullname?: string; [key: string]: unknown });
      return { success: true, data };
    } catch (err) {
      const error = err as { message?: string };

      setError(error.message || 'Registration failed');
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = async (): Promise<void> => {
    if (logoutInFlightRef.current) return;
    logoutInFlightRef.current = true;
    try {
      if (session) {
        try {
          await signOut({ redirect: false });
        } catch (nextAuthError) {

        }
      }
      try {
        await authService.logout();
      } catch (logoutError) {

      }

      localStorage.removeItem('lastAccountStatusCheck');
      localStorage.removeItem('isAccountLocked');

      setUser(null);
      setError(null);
      setIsAccountLocked(false);
      setShowAccountLockedBanner(false);

      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch { /* noop */ }
        abortControllerRef.current = null;
      }

      // `authService.logout()` already wiped localStorage and sessionStorage
      // (tokens, user, remember-me flag and the persisted user store), so it
      // is called only once here. A second call would send the logout
      // request to the backend twice.

      router.push(LOGIN_ROUTE);
    } catch (err) {

      setError('Logout failed');
    } finally {
      logoutInFlightRef.current = false;
    }
  };

  const updateProfile = async (profileData: Record<string, unknown>): Promise<AuthResult> => {
    try {
      setError(null);
      const result = await authService.updateProfile(profileData) as { user: AuthUser };
      setUser(result.user);
      return { success: true, user: result.user };
    } catch (err) {
      const error = err as { response?: { data?: { isAccountLocked?: boolean } }; message?: string };

      if (error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        const message = 'Your account has been locked. Please contact an administrator.';
        setError(message);
        return { success: false, error: message, isAccountLocked: true };
      }
      setError(error.message ?? 'Profile update failed');
      return { success: false, error: error.message || 'Profile update failed' };
    }
  };

  const uploadAvatar = async (file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string; isAccountLocked?: boolean }> => {
    try {
      const result = await authService.uploadAvatar(file) as { user: AuthUser; avatarUrl?: string };
      setUser(result.user);
      return { success: true, avatarUrl: result.avatarUrl };
    } catch (err) {
      const error = err as { response?: { data?: { isAccountLocked?: boolean } }; message?: string };

      if (error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        return {
          success: false,
          error: 'Your account has been locked. Please contact an administrator.',
          isAccountLocked: true
        };
      }
      return { success: false, error: error.message || 'Avatar upload failed' };
    }
  };

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      if (user) {
        const updatedUser = (await authService.getProfile()) as AuthUser;
        setUser(updatedUser);
        return updatedUser;
      }
      return null;
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { isAccountLocked?: boolean } } };

      if (error.response?.status === 403 && error.response?.data?.isAccountLocked) {
        setIsAccountLocked(true);
        setError('Your account has been locked. Please contact an administrator.');
      }
      return null;
    }
  };

  const updateAvatarInUI = (updated: AuthUser): string | null => {
    if (updated && updated.avatar) {
      // The relative avatar path is joined with the backend origin, not with
      // the `/api/v1` base. The fallback used to be the hardcoded
      // `http://localhost:5000`, so production always showed a broken image.
      const origin = getApiOrigin();
      let avatarUrl = String(updated.avatar);
      if (avatarUrl.startsWith('/') && origin) {
        avatarUrl = `${origin}${avatarUrl}`;
      }
      avatarUrl = `${avatarUrl}?t=${new Date().getTime()}`;
      // The user is updated in the memory of the tab, in sessionStorage
      // (and in localStorage when the "remember me" flag is set). The
      // payload never contains a token.
      try {
        const memoryUser = getMemoryUser() ?? {};
        setMemoryUser({ ...memoryUser, avatar: avatarUrl });
        const ssUser = window.sessionStorage ? window.sessionStorage.getItem('user') : null;
        const currentUser = ssUser ? (() => { try { const d = obfDecode(ssUser); return d ? JSON.parse(d) : {}; } catch { return {}; } })() : {};
        const encoded = obfEncode(JSON.stringify({ ...currentUser, avatar: avatarUrl }));
        window.sessionStorage.setItem('user', encoded);
        if (localStorage.getItem('remember_me') === '1') {
          localStorage.setItem('user', encoded);
        }
      } catch { /* ignore */ }
      return avatarUrl;
    }
    return null;
  };

  const value: AuthContextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar,
    refreshUser,
    updateAvatarInUI,
    isAuthenticated: Boolean(user && (getMemoryAccessToken() || session?.user)),
    isAdmin: user?.role?.toLowerCase() === 'admin' || user?.isAdmin === true,
    isAccountLocked,
    showAccountLockedBanner,
    hideAccountLockedBanner: () => setShowAccountLockedBanner(false),
    resetAccountLockStatus: () => {
      setIsAccountLocked(false);
      setShowAccountLockedBanner(false);
      localStorage.removeItem('isAccountLocked');
    },
    status: loading ? 'loading' : user ? 'authenticated' : 'unauthenticated'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const withAuth = <P extends Record<string, unknown>>(Component: React.ComponentType<P>) => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace(LOGIN_ROUTE);
      }
    }, [user, loading, router]);

    if (loading) return <div suppressHydrationWarning>Loading...</div>;
    if (!user) return null;
    return <Component {...props} />;
  };
  return AuthenticatedComponent;
};

export const withAccountStatus = <P extends Record<string, unknown>>(Component: React.ComponentType<P>) => {
  const WithAccountStatus: React.FC<P> = (props) => {
    const { user, loading, isAccountLocked } = useAuth();
    const router = useRouter();
    const [showBanner, setShowBanner] = useState<boolean>(false);

    useEffect(() => {
      if (!loading && user && isAccountLocked) {
        setShowBanner(true);
        const timer = setTimeout(() => router.push('/'), 500);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [user, loading, isAccountLocked, router]);

    if (showBanner) {
      return (
        <div className="account-locked-container">
          <div className="account-locked-banner">
            <h2>Account locked</h2>
            <p>Your account is currently locked. Please contact an administrator for support.</p>
            <button onClick={() => router.push(LOGIN_ROUTE)}>
              Back to login
            </button>
            <style jsx>{`
              .account-locked-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
              }
              .account-locked-banner {
                background: linear-gradient(135deg, #e50914 0%, #8b0000 100%);
                padding: 2rem;
                border-radius: 8px;
                color: white;
                text-align: center;
                max-width: 500px;
                width: 90%;
              }
              button {
                background: white;
                color: #e50914;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                font-weight: bold;
                margin-top: 15px;
                cursor: pointer;
              }
            `}</style>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
  return WithAccountStatus;
};

export default useAuth;

export const isAdminUser = (user: AuthUser | null | undefined): boolean => {
  if (!user) return false;
  return user?.role?.toLowerCase() === 'admin' || user?.isAdmin === true;
};
