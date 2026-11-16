/**
 * @file pages/auth/error.tsx
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

export default function AuthError() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const errorParam = router.query.error;
    if (!errorParam) {
      setErrorMessage('An authentication error occurred.');
      return;
    }
    switch (errorParam) {
      case 'Signin':
        setErrorMessage('Try signing in with a different account.');
        break;
      case 'OAuthSignin':
        setErrorMessage('Error while trying to connect to the OAuth provider.');
        break;
      case 'OAuthCallback':
        setErrorMessage('Error during OAuth callback process.');
        break;
      case 'OAuthCreateAccount':
        setErrorMessage(
          'Could not create OAuth provider account. You might already have an account with a different sign-in method.'
        );
        break;
      case 'EmailCreateAccount':
        setErrorMessage(
          'Could not create email account. You might already have an account with a different sign-in method.'
        );
        break;
      case 'Callback':
        setErrorMessage('Error during authentication callback.');
        break;
      case 'OAuthAccountNotLinked':
        setErrorMessage('To confirm your identity, sign in with the same account you used originally.');
        break;
      case 'EmailSignin':
        setErrorMessage('Verification email could not be sent.');
        break;
      case 'CredentialsSignin':
        setErrorMessage('Invalid username or password.');
        break;
      case 'SessionRequired':
        setErrorMessage('Please sign in to access this page.');
        break;
      default:
        setErrorMessage('An unknown error occurred during authentication.');
    }
  }, [router.query]);

  return (
    <>
      <Head>
        <title>Authentication Error - Movie Streaming</title>
      </Head>
      <div className="error-container">
        <div className="error-card">
          <div className="error-icon">
            <FaExclamationTriangle />
          </div>
          <h1>Authentication Error</h1>
          <p className="error-message">{errorMessage}</p>
          <div className="error-actions">
            <Link href="/auth/login" className="error-button login">
              <FaArrowLeft /> Back to Login
            </Link>
            <Link href="/" className="error-button home">
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d111f;
          padding: 20px;
        }
        .error-card {
          background: rgba(26, 26, 26, 0.8);
          border-radius: 15px;
          padding: 40px;
          max-width: 500px;
          text-align: center;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #e0e0e0;
        }
        .error-icon { font-size: 60px; color: #ff5555; margin-bottom: 20px; }
        h1 { font-size: 28px; font-weight: 400; margin-bottom: 20px; color: #fff; }
        .error-message {
          color: #b0b0b0;
          margin-bottom: 30px;
          line-height: 1.6;
          font-size: 16px;
        }
        .error-actions { display: flex; flex-direction: column; gap: 15px; }
        .error-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          border-radius: 5px;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          gap: 8px;
        }
        .error-button.login {
          background: rgba(123, 136, 201, 0.2);
          border: 1px solid rgba(123, 136, 201, 0.3);
          color: #b0b0b0;
        }
        .error-button.login:hover {
          background: rgba(123, 136, 201, 0.3);
          transform: translateY(-2px);
        }
        .error-button.home {
          background: linear-gradient(135deg, #4a5380, #323b66);
          border: none;
          color: #fff;
        }
        .error-button.home:hover {
          background: linear-gradient(135deg, #536094, #3a4475);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        @media (max-width: 576px) {
          .error-container {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 48px 16px 24px;
            box-sizing: border-box;
          }
          .error-card { padding: 30px 20px; width: 100%; max-width: 420px; margin: auto 0; }
        }

        @media (max-width: 480px) {
          .error-container {
            padding: 44px 14px 20px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-card {
            margin: auto 0;
            padding: 24px 18px;
            border-radius: 14px;
          }
          .error-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 22px;
            margin-bottom: 14px;
          }
          .error-message {
            font-size: 14px;
            margin-bottom: 24px;
          }
          .error-actions {
            gap: 12px;
          }
          .error-button {
            padding: 11px 16px;
            font-size: 14px;
            border-radius: 8px;
          }
        }

        @media (max-width: 421px) {
          .error-container {
            padding: 40px 12px 18px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-card {
            margin: auto 0;
            padding: 20px 14px;
            border-radius: 12px;
          }
          .error-icon {
            font-size: 42px;
            margin-bottom: 14px;
          }
          h1 {
            font-size: 20px;
            margin-bottom: 10px;
          }
          .error-message {
            font-size: 13.5px;
            margin-bottom: 20px;
          }
          .error-actions {
            gap: 10px;
          }
          .error-button {
            padding: 10px 14px;
            font-size: 13.5px;
          }
        }

        @media (max-width: 360px) {
          .error-container {
            padding: 36px 8px 14px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-card {
            margin: auto 0;
            padding: 16px 10px;
          }
          .error-icon {
            font-size: 36px;
          }
          h1 {
            font-size: 18px;
          }
          .error-message {
            font-size: 13px;
          }
          .error-button {
            padding: 9px 12px;
            font-size: 13px;
          }
        }

        @media (orientation: landscape) and (max-height: 500px) {
          .error-container {
            padding: 24px 16px 14px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-card {
            margin: auto 0;
            padding: 16px 20px;
            max-width: 420px;
          }
          .error-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }
          h1 {
            font-size: 18px;
            margin-bottom: 6px;
          }
          .error-message {
            font-size: 13px;
            margin-bottom: 12px;
          }
          .error-actions {
            flex-direction: row;
            gap: 10px;
          }
          .error-button {
            flex: 1;
            padding: 8px 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
}
