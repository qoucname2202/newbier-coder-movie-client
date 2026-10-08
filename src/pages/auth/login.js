import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import axios from 'axios';
import { useAuth } from '../../utils/auth';
import { signInWithFacebook } from '../../utils/firebase';
import { AUTH_CONFIG } from '../../config/authConfig';
import styles from '../../styles/Login.module.css';

import {
    FaRegEnvelope,
    FaLock,
    FaEye,
    FaEyeSlash,
    FaExclamationCircle,
    FaCheckCircle,
    FaArrowLeft,
    FaFacebookF,
    FaGithub,
    FaLinkedinIn,
    FaSpinner
} from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
    const router = useRouter();
    const { login } = useAuth();
    const t = AUTH_CONFIG.login;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [artworkSrc, setArtworkSrc] = useState(
        AUTH_CONFIG.artwork?.defaultLoginImage || AUTH_CONFIG.defaultLoginArtwork
    );

    useEffect(() => {
        if (router.query.registered) {
            setMessage(t.notifications.registeredSuccess);
        }
    }, [router.query, t.notifications.registeredSuccess]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Basic validation
        if (!email.trim() || !password) {
            setError(t.validation.requiredFields);
            return;
        }

        try {
            setIsLoading(true);
            const result = await login({
                username: email.trim(),
                email: email.trim(),
                password: password
            });

            if (result.success) {
                setMessage(t.notifications.loginSuccess);
                setTimeout(() => {
                    const redirectUrl = (router.query.redirect && typeof router.query.redirect === 'string') 
                        ? router.query.redirect 
                        : '/';
                    router.push(redirectUrl);
                }, 800);
            } else {
                setError(result.error || t.validation.invalidCredentials || t.validation.wrongPassword);
            }
        } catch (apiError) {
            if (apiError.message?.includes('Failed to fetch')) {
                setError(t.validation.serverError);
            } else {
                setError(apiError.message || t.validation.invalidCredentials || t.validation.wrongPassword);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setSocialLoading('google');
            setError('');
            const redirectUrl = (router.query.redirect && typeof router.query.redirect === 'string') 
                ? router.query.redirect 
                : '/';

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
            console.error('Google sign in error:', err);
            setError(t.social.googleConnectError);
        } finally {
            setSocialLoading(null);
        }
    };

    const handleFacebookSignIn = async () => {
        try {
            setSocialLoading('facebook');
            setError('');
            const result = await signInWithFacebook();

            if (result.success) {
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/facebook-login`, {
                    email: result.user.email || `${result.user.uid}@facebook.com`,
                    name: result.user.displayName,
                    facebookId: result.user.uid,
                    picture: result.user.photoURL
                });

                if (response.data && response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    window.dispatchEvent(new Event('storage'));
                    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                    
                    const redirectUrl = (router.query.redirect && typeof router.query.redirect === 'string') 
                        ? router.query.redirect 
                        : '/';
                    router.push(redirectUrl);
                } else {
                    setError(response.data?.error || t.social.facebookFailed);
                }
            } else {
                setError(result.error || t.social.facebookFailed);
            }
        } catch (err) {
            console.error('Facebook sign in error:', err);
            setError(err.message || t.social.facebookFailed);
        } finally {
            setSocialLoading(null);
        }
    };

    const handleGithubSignIn = async () => {
        try {
            setSocialLoading('github');
            setError('');
            const redirectUrl = (router.query.redirect && typeof router.query.redirect === 'string') 
                ? router.query.redirect 
                : '/';

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
            setError(t.social.githubUpdating);
        } finally {
            setSocialLoading(null);
        }
    };

    const handleLinkedinSignIn = () => {
        setError(t.social.linkedinUpdating);
    };

    return (
        <div className={styles.loginPage}>
            <Head>
                <title>{t.meta.title}</title>
                <meta name="description" content={t.meta.description} />
            </Head>

            {/* Left Column: Clean White Login Form */}
            <div className={styles.formSide}>
                <Link href="/" className={styles.backHome}>
                    <FaArrowLeft size={13} />
                    <span>{t.navigation.backHome}</span>
                </Link>

                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>{t.header.title}</h1>
                        <p className={styles.subtitle}>{t.header.subtitle}</p>
                    </div>

                    <form className={styles.form} onSubmit={handleLogin} noValidate>
                        {/* Email Input */}
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
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (error) setError('');
                                }}
                                disabled={isLoading}
                                autoComplete="email"
                                required
                            />
                        </div>

                        {/* Password Input */}
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
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError('');
                                }}
                                disabled={isLoading}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? t.accessibility.hidePassword : t.accessibility.showPassword}
                                tabIndex={-1}
                            >
                                {showPassword ? <FaEye /> : <FaEyeSlash />}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className={styles.errorBox}>
                                <FaExclamationCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {message && (
                            <div className={styles.successBox}>
                                <FaCheckCircle size={14} />
                                <span>{message}</span>
                            </div>
                        )}

                        {/* Helper Links */}
                        {/* <div className={styles.linksRow}>
                            <Link href="/auth/forgot-password" className={styles.forgotText}>
                                {t.links.forgotPassword}
                            </Link>
                            <Link href="/auth/signup" className={styles.signupText}>
                                {t.links.signupNow}
                            </Link>
                        </div> */}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            id="login-submit"
                            className={styles.submitButton}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="spinner-border spinner-border-sm" />
                                    <span>{t.buttons.submitting}</span>
                                </>
                            ) : (
                                t.buttons.submit
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    {/* <div className={styles.dividerContainer}>
                        <div className={styles.dividerLine}></div>
                        <div className={styles.dividerText}>
                            <strong>{t.divider.boldText}</strong> {t.divider.normalText}
                        </div>
                        <div className={styles.dividerLine}></div>
                    </div> */}

                    {/* Social Logins */}
                    {/* <div className={styles.socialRow}>
                        <button
                            type="button"
                            className={styles.socialButton}
                            onClick={handleGoogleSignIn}
                            disabled={isLoading || socialLoading !== null}
                            title={t.social.google}
                            aria-label={t.social.google}
                        >
                            {socialLoading === 'google' ? (
                                <FaSpinner size={16} className="spinner-border spinner-border-sm" />
                            ) : (
                                <FcGoogle size={22} />
                            )}
                        </button>

                        <button
                            type="button"
                            className={styles.socialButton}
                            onClick={handleFacebookSignIn}
                            disabled={isLoading || socialLoading !== null}
                            title={t.social.facebook}
                            aria-label={t.social.facebook}
                        >
                            {socialLoading === 'facebook' ? (
                                <FaSpinner size={16} className="spinner-border spinner-border-sm" />
                            ) : (
                                <FaFacebookF size={18} color="#1877F2" />
                            )}
                        </button>

                        <button
                            type="button"
                            className={styles.socialButton}
                            onClick={handleGithubSignIn}
                            disabled={isLoading || socialLoading !== null}
                            title={t.social.github}
                            aria-label={t.social.github}
                        >
                            {socialLoading === 'github' ? (
                                <FaSpinner size={16} className="spinner-border spinner-border-sm" />
                            ) : (
                                <FaGithub size={21} color="#18181b" />
                            )}
                        </button>

                        <button
                            type="button"
                            className={styles.socialButton}
                            onClick={handleLinkedinSignIn}
                            disabled={isLoading || socialLoading !== null}
                            title={t.social.linkedin}
                            aria-label={t.social.linkedin}
                        >
                            <FaLinkedinIn size={18} color="#0A66C2" />
                        </button>
                    </div> */}
                </div>
            </div>

            {/* Right Column: Full-height Artwork Illustration */}
            <div className={styles.imageSide}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={artworkSrc}
                    alt={AUTH_CONFIG.artwork?.altText || AUTH_CONFIG.artworkAlt}
                    className={styles.artworkImage}
                    onError={() => {
                        // Fallback to local chantay.jpg if custom configured URL fails
                        if (artworkSrc !== '/img/chantay.jpg') {
                            setArtworkSrc('/img/chantay.jpg');
                        }
                    }}
                />
            </div>
        </div>
    );
}

// Bypasses root Layout navbar/footer to keep the split-screen view clean and full-bleed
Login.getLayout = (page) => page;