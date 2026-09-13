import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FaExclamationTriangle, FaHome, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';
import { isAuthenticated, getCurrentUser } from '../utils/adminUtils';

// NOTE: Advertisements are explicitly disabled on this page through AdContext
// The AdContext automatically hides all ads when the pathname is '/noaccess'
export default function NoAccessPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Check authentication status and get user info
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const currentUser = getCurrentUser();
      
      setIsAuth(authenticated);
      setUser(currentUser);
    };

    checkAuth();
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <Head>
        <title>Unauthorized Access - Movie Streaming</title>
        <meta name="description" content="You don't have permission to access this page" />
      </Head>
      
      <div className="unauthorized-container">
        <div className="unauthorized-card">
          <div className="error-icon">
            <FaExclamationTriangle />
          </div>
          
          <h1>Access Denied</h1>
          
          <div className="error-message">
            {!isAuth ? (
              <p>You need to be logged in to access this pages.</p>
            ) : (
              <>
                <p>Sorry, you do not  have permission to access this page.</p>
                {user && (
                  <div className="user-info">
                    <p><strong>Current user:</strong> {user.fullname || user.email}</p>
                    <p><strong>Role:</strong> {user.role || 'User'}</p>
                    <p className="required-role">This page requires <strong>Admin</strong> privileges.</p>
                  </div>
                )}
              </>
            )}
          </div>
            <div className="action-buttons">
            {!isAuth ? (
              <Link href="/auth/login" className="btn btn-primary">
                <FaSignInAlt /> Sign In
              </Link>
            ) : (
              <button onClick={handleGoBack} className="btn btn-secondary">
                <FaArrowLeft /> Go Back
              </button>
            )}
            
            <Link href="/" className="btn btn-primary">
              <FaHome /> Home
            </Link>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .unauthorized-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0d111f 0%, #1a1f35 100%);
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .unauthorized-card {
          background: rgba(26, 26, 26, 0.9);
          border-radius: 15px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .error-icon {
          font-size: 64px;
          color: #ff6b35;
          margin-bottom: 20px;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #fff;
          letter-spacing: 0.5px;
        }
        
        .error-message {
          color: #b0b0b0;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        
        .error-message p {
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .user-info {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 15px;
          margin-top: 20px;
          border-left: 3px solid #4a5380;
        }
        
        .user-info p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .required-role {
          color: #ff6b35 !important;
          font-weight: 500;
          margin-top: 10px !important;
        }
        
        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          min-width: 120px;
          justify-content: center;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #4a5380, #323b66);
          color: white;
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #536094, #3a4475);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        @media (max-width: 576px) {
          .unauthorized-card {
            padding: 30px 20px;
          }
          
          .action-buttons {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
          }
          
          h1 {
            font-size: 24px;
          }
          
          .error-icon {
            font-size: 48px;
          }        }
      `}</style>
    </>
  );
}
