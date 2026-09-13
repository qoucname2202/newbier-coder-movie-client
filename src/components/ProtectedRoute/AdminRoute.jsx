import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { canAccessAdmin, isAuthenticated } from '../../utils/adminUtils';

const AdminRoute = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      if (!isAuthenticated()) {
        router.push('/auth/login?returnUrl=' + encodeURIComponent(router.asPath));
        return;
      }
      if (!canAccessAdmin()) {
        router.push('/noaccess');
        return;
      }

      setHasAccess(true);
      setIsLoading(false);
    };

    const timer = setTimeout(checkAccess, 100);

    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>

        <style jsx>{`
          .admin-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0d111f;
            color: white;
          }

          .loading-container {
            text-align: center;
          }

          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-left: 4px solid #4a5380;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          p {
            margin: 0;
            font-size: 16px;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  return hasAccess ? children : null;
};

export default AdminRoute;
