/**
 * @file pages/auth/login.tsx
 */
import { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent, MouseEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { useAuth, type AuthResult } from '@/context/AuthContext';
import { AUTH_CONFIG } from '@/config/authConfig';
import styles from '@/styles/Login.module.css';
import type { NextPage } from 'next';
import type { ReactElement } from 'react';

import {
  FaRegEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaExclamationCircle,
  FaCheckCircle,
  FaArrowLeft,
  FaSpinner
} from 'react-icons/fa';

/**
 * The delays between the automatic retries, in milliseconds.
 *
 * The backend is hosted on the free tier of Render, so a cold start can
 * take a while. The delays grow after every attempt, so the server is not
 * hammered while it is booting.
 */
const SERVER_RETRY_DELAYS_MS = [3000, 6000, 12000, 20000, 30000];

const Login: NextPage & { getLayout?: (page: ReactElement) => ReactElement } = () => {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading, user } = useAuth();
  const t = AUTH_CONFIG.login;

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [artworkSrc, setArtworkSrc] = useState<string>(
    AUTH_CONFIG.artwork?.defaultLoginImage || AUTH_CONFIG.defaultLoginArtwork
  );

  // The state of the "the server is still starting" flow.
  const [serverStarting, setServerStarting] = useState<boolean>(false);
  const [serverRetryAttempt, setServerRetryAttempt] = useState<number>(0);
  const [serverRetryFailed, setServerRetryFailed] = useState<boolean>(false);
  // The retry timer, so it can be cancelled when the component unmounts or
  // when the user leaves the page.
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The attempt counter, so the automatic retry knows when to stop.
  const retryCountRef = useRef<number>(0);
  // The retry scheduler, kept in a ref so it can call itself recursively.
  const scheduleRetryRef = useRef<((attempt: number) => void) | null>(null);
  // The credentials of the form, mirrored into refs so the automatic retry
  // always uses the latest values.
  const emailRef = useRef<string>('');
  const passwordRef = useRef<string>('');
  const rememberMeRef = useRef<boolean>(false);

  // Re-hydrate the remember-me checkbox from localStorage so the choice
  // persists across visits when the user previously opted in.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setRememberMe(localStorage.getItem('remember_me') === '1');
    } catch {
      /* localStorage may be disabled */
    }
  }, []);

  // If the visitor is already authenticated, send them straight to the
  // post-login destination so the Login form is never shown to a logged-in
  // user. We wait for `authLoading` to settle so we never redirect based on
  // a stale null user before the auth context finishes restoring the
  // session.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (typeof window === 'undefined') return;
    const redirectQuery = router.query.redirect;
    const redirectUrl =
      typeof redirectQuery === 'string' && redirectQuery ? redirectQuery : '/';
    router.replace(redirectUrl);
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (router.query.registered) {
      setMessage(t.notifications.registeredSuccess);
    }
  }, [router.query, t.notifications.registeredSuccess]);

  // Cancels the pending retry when the component unmounts.
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  /**
   * Performs ONE login attempt.
   *
   * It is separated from `handleLogin` so the automatic retry (used when the
   * backend is still starting) can call exactly the same code path.
   *
   * @returns The result of the login.
   */
  const attemptLogin = useCallback(async (): Promise<AuthResult> => {
    // The credentials are read from the refs, so a retry that fires after the
    // component re-rendered always uses the latest values (and never a
    // stale closure).
    const identifier = (emailRef.current ?? '').trim();
    const result = await login({
      username: identifier,
      email: identifier,
      password: passwordRef.current,
      rememberMe: rememberMeRef.current
    });

    if (result.success) {
      setServerStarting(false);
      setServerRetryFailed(false);
      setMessage(t.notifications.loginSuccess);
      setTimeout(() => {
        const redirectQuery = router.query.redirect;
        const redirectUrl =
          typeof redirectQuery === 'string' && redirectQuery ? redirectQuery : '/';
        router.push(redirectUrl);
      }, 800);
    }

    return result;
  }, [login, router, t.notifications.loginSuccess]);

  // The credentials are mirrored into refs, so the retry always uses the
  // values that are currently in the form.
  useEffect(() => {
    emailRef.current = email;
    passwordRef.current = password;
    rememberMeRef.current = rememberMe;
  }, [email, password, rememberMe]);

  /**
   * Schedules the next automatic attempt.
   *
   * The delays grow after every attempt, so the backend is not hammered
   * while it is booting. When every delay is used, the retry stops and the
   * user is invited to try again by hand.
   *
   * The function is kept in a ref, so it can call itself without the
   * "accessed before it is declared" problem of a recursive `useCallback`.
   *
   * @param attempt - The number of the attempt that just failed (1-based).
   */
  const scheduleRetry = useCallback((attempt: number): void => {
    const delay = SERVER_RETRY_DELAYS_MS[attempt - 1];
    if (!delay) {
      setServerRetryFailed(true);
      setIsLoading(false);
      return;
    }

    setServerRetryAttempt(attempt);
    setServerStarting(true);

    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      void (async () => {
        setIsLoading(true);
        try {
          const result = await attemptLogin();
          if (!result.success && result.serverStarting) {
            retryCountRef.current = attempt + 1;
            scheduleRetryRef.current?.(attempt + 1);
            return;
          }
          if (!result.success) {
            setServerStarting(false);
            setServerRetryFailed(false);
            setError(result.error || t.validation.invalidCredentials);
          }
        } catch (err) {
          const e = err as { code?: string; message?: string };
          if (e?.code === 'SERVER_STARTING') {
            retryCountRef.current = attempt + 1;
            scheduleRetryRef.current?.(attempt + 1);
            return;
          }
          setServerStarting(false);
          setServerRetryFailed(false);
          setError(e?.message || t.validation.invalidCredentials);
        } finally {
          setIsLoading(false);
        }
      })();
    }, delay);
  }, [attemptLogin, t.validation.invalidCredentials]);

  // The retry function is also kept in a ref, so the recursive call inside
  // it does not depend on the declaration order.
  useEffect(() => {
    scheduleRetryRef.current = scheduleRetry;
  }, [scheduleRetry]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError(t.validation.requiredFields);
      return;
    }

    // A new attempt starts a new retry cycle.
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;
    setServerRetryFailed(false);

    try {
      if (isLoading) return;
      setIsLoading(true);
      const result = await attemptLogin();

      if (result.success) return;

      // The backend did not answer: it is still starting. The notice is
      // shown and the login is retried automatically.
      if (result.serverStarting) {
        setServerStarting(true);
        setError('');
        retryCountRef.current = 1;
        scheduleRetry(1);
        return;
      }

      setServerStarting(false);
      setError(result.error || t.validation.invalidCredentials || t.validation.wrongPassword);
    } catch (apiError) {
      const err = apiError as Error & { code?: string };
      if (err.code === 'SERVER_STARTING') {
        setServerStarting(true);
        setError('');
        retryCountRef.current = 1;
        scheduleRetry(1);
        return;
      }
      if (err.message?.includes('Failed to fetch')) {
        setError(t.validation.serverError);
      } else {
        setError(err.message || t.validation.invalidCredentials || t.validation.wrongPassword);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      setSocialLoading('google');
      setError('');
      const redirectQuery = router.query.redirect;
      const redirectUrl =
        typeof redirectQuery === 'string' && redirectQuery ? redirectQuery : '/';

      const result = await signIn('google', {
        callbackUrl: redirectUrl,
        redirect: false
      });

      if (result?.error) {
        setError(`${t.social.googleFailed}: ${result.error}`);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {

      setError(t.social.googleConnectError);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGithubSignIn = async (): Promise<void> => {
    try {
      setSocialLoading('github');
      setError('');
      const redirectQuery = router.query.redirect;
      const redirectUrl =
        typeof redirectQuery === 'string' && redirectQuery ? redirectQuery : '/';

      const result = await signIn('github', {
        callbackUrl: redirectUrl,
        redirect: false
      });

      if (result?.error) {
        setError(t.social.githubDisabled);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      const _ = err;
      setError(t.social.githubUpdating);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleLinkedinSignIn = (): void => {
    setError(t.social.linkedinUpdating);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
    if (error) setError('');
  };
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
    if (error) setError('');
  };
  const toggleShowPassword = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    setShowPassword((p) => !p);
  };
  const handleArtworkError = (): void => {
    if (artworkSrc !== '/img/chantay.jpg') setArtworkSrc('/img/chantay.jpg');
  };

  // Show a short loading state while the auth context finishes restoring
  // an existing session, or when we are about to redirect a logged-in user
  // away from this page. This prevents the Login form from flashing on
  // top of an already-authenticated session.
  if (authLoading || (isAuthenticated && !!user)) {
    return (
      <div className={styles.loginPage} suppressHydrationWarning>
        <Head>
          <title>{t.meta.title}</title>
          <meta name="description" content={t.meta.description} />
        </Head>
        <div className={styles.formSide} suppressHydrationWarning>
          <div className={styles.formContainer} suppressHydrationWarning>
            <div className={styles.header} suppressHydrationWarning>
              <h1 className={styles.title}>{t.header.title}</h1>
              <p className={styles.subtitle}>Đang khôi phục phiên đăng nhập…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage} suppressHydrationWarning>
      <Head>
        <title>{t.meta.title}</title>
        <meta name="description" content={t.meta.description} />
      </Head>

      <div className={styles.formSide} suppressHydrationWarning>
        <Link href="/" className={styles.backHome}>
          <FaArrowLeft size={13} />
          <span>{t.navigation.backHome}</span>
        </Link>

        <div className={styles.formContainer} suppressHydrationWarning>
          <div className={styles.header} suppressHydrationWarning>
            <h1 className={styles.title}>{t.header.title}</h1>
            <p className={styles.subtitle}>{t.header.subtitle}</p>
          </div>

          <form className={styles.form} onSubmit={handleLogin} noValidate>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <FaRegEnvelope />
              </span>
              <input
                type="email"
                name="email"
                id="login-email"
                className={styles.inputField}
                placeholder={t.placeholders.email}
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <div className={`${styles.inputWrapper} ${error ? styles.inputError : ''}`}>
              <span className={styles.inputIcon}>
                <FaLock />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="login-password"
                className={styles.inputField}
                placeholder={t.placeholders.password}
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={toggleShowPassword}
                aria-label={showPassword ? t.accessibility.hidePassword : t.accessibility.showPassword}
                title={showPassword ? t.accessibility.hidePassword : t.accessibility.showPassword}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <FaExclamationCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {serverStarting && (
              <div className={styles.waitingBox} role="status" aria-live="polite">
                <FaSpinner size={14} className={styles.spinner} />
                <div className={styles.waitingContent}>
                  <strong className={styles.waitingTitle}>{t.serverStarting.title}</strong>
                  <span className={styles.waitingMessage}>
                    {serverRetryFailed
                      ? t.serverStarting.giveUp
                      : t.serverStarting.message}
                  </span>
                  <span className={styles.waitingMeta}>
                    {serverRetryFailed
                      ? ''
                      : t.serverStarting.retrying +
                        (serverRetryAttempt > 0
                          ? ` ${t.serverStarting.attempts.replace('{0}', String(serverRetryAttempt))}`
                          : '')}
                  </span>
                </div>
                {serverRetryFailed && (
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => {
                      setServerRetryFailed(false);
                      retryCountRef.current = 0;
                      scheduleRetry(1);
                    }}
                    disabled={isLoading}
                  >
                    {t.serverStarting.button}
                  </button>
                )}
              </div>
            )}

            {message && (
              <div className={styles.successBox}>
                <FaCheckCircle size={14} />
                <span>{message}</span>
              </div>
            )}

            <div className={styles.linksRow}>
              <label className={styles.rememberRow} htmlFor="login-remember">
                <input
                  type="checkbox"
                  id="login-remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  aria-label={t.remember.ariaLabel}
                />
                <span className={styles.rememberLabel}>{t.remember.label}</span>
              </label>

              <Link href="/auth/forgot-password" className={styles.forgotText}>
                {t.links.forgotPassword}
              </Link>
            </div>

            <button
              type="submit"
              id="login-submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : t.buttons.submit}
            </button>
          </form>

          <div className={styles.signupPrompt}>
            <span>Bạn chưa có tài khoản?</span>
            <Link href="/auth/signup" className={styles.signupText}>
              {t.links.signupNow}
            </Link>
          </div>

          {/* Social buttons preserved for future re-enable */}
          <div style={{ display: 'none' }} aria-hidden>
            <button type="button" onClick={handleGoogleSignIn}>Google</button>
            <button type="button" onClick={handleGithubSignIn}>GitHub</button>
            <button type="button" onClick={handleLinkedinSignIn}>LinkedIn</button>
          </div>
        </div>
      </div>

      <div className={styles.imageSide}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artworkSrc}
          alt={AUTH_CONFIG.artwork?.altText || AUTH_CONFIG.artworkAlt}
          className={styles.artworkImage}
          onError={handleArtworkError}
        />
      </div>
    </div>
  );
};

// Bypasses root Layout navbar/footer to keep the split-screen view clean and full-bleed
(Login as NextPage & { getLayout?: (page: ReactElement) => ReactElement }).getLayout = (page) => page;

export default Login;
