import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

export default function AuthError() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    // Get error details from the URL query params
    const { error } = router.query;
    
    if (error) {
      switch (error) {
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
          setErrorMessage('Could not create OAuth provider account. You might already have an account with a different sign-in method.');
          break;
        case 'EmailCreateAccount':
          setErrorMessage('Could not create email account. You might already have an account with a different sign-in method.');
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
          break;
      }
    } else {
      setErrorMessage('An authentication error occurred.');
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
        
        .error-icon {
          font-size: 60px;
          color: #ff5555;
          margin-bottom: 20px;
        }
        
        h1 {
          font-size: 28px;
          font-weight: 400;
          margin-bottom: 20px;
          color: #fff;
        }
        
        .error-message {
          color: #b0b0b0;
          margin-bottom: 30px;
          line-height: 1.6;
          font-size: 16px;
        }
        
        .error-actions {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
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
          .error-card {
            padding: 30px 20px;
          }
        }
      `}</style>
    </>
  );
}