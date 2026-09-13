import { useState, useEffect } from 'react';
import Head from 'next/head';

const setCookie = (name, value, days) => {
  if (typeof document === 'undefined') return;
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ''}${expires}; path=/`;
};

const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// This is a standalone page that doesn't depend on auth context to prevent rendering loops
export default function AccountLockedPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogout = () => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isAccountLocked');
        deleteCookie('isAccountLocked');

        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (window.sessionStorage) {
          sessionStorage.removeItem('backendToken');
          sessionStorage.removeItem('user');
        }

        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          deleteCookie(name);
        });

        setTimeout(() => {
          try {
            window.location.href = '/auth/login?locked=true';
          } catch (error) {
            console.error("Error redirecting with window.location:", error);

            const loginUrl = '/auth/login?locked=true';
            const link = document.createElement('a');
            link.href = loginUrl;
            link.setAttribute('data-redirect', 'forced');
            document.body.appendChild(link);
            link.click();
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Có lỗi xảy ra khi đăng xuất. Vui lòng tải lại trang.");
    }
  };
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem('isAccountLocked', 'true');
    setCookie('isAccountLocked', 'true', 7);
    let requestCount = 0;
    const MAX_REQUESTS = 50;
    const requestLog = {};

    const showRateLimitMessage = () => {
      if (!document.getElementById('rate-limit-message')) {
        const message = document.createElement('div');
        message.id = 'rate-limit-message';
        message.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #e50914;
          color: white;
          padding: 15px;
          border-radius: 5px;
          z-index: 9999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        message.innerText = 'Quá nhiều yêu cầu được gửi. Hệ thống đang bị giới hạn.';
        document.body.appendChild(message);

        setTimeout(() => {
          if (message && message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, 5000);
      }
    };

    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;

      xhr.open = function(method, url) {
        if (requestCount >= MAX_REQUESTS) {
          showRateLimitMessage();

          setTimeout(() => {
            if (xhr.onabort) xhr.onabort();
          }, 0);

          return;
        }

        if (typeof url === 'string' && (url.includes('/api/') || url.includes('/auth/'))) {
          requestCount++;

          const domain = url.split('/').slice(0, 3).join('/');
          requestLog[domain] = (requestLog[domain] || 0) + 1;

          if (requestLog[domain] > 10) {
            console.warn('Phát hiện spam từ domain:', domain);
            showRateLimitMessage();
          }

          setTimeout(() => {
            if (xhr.onreadystatechange) {
              xhr.readyState = 4;
              xhr.status = 403;
              xhr.responseText = JSON.stringify({
                blocked: true,
                message: 'Tài khoản đã bị khóa',
                status: 403
              });
              xhr.onreadystatechange();
            }

            if (xhr.onerror) xhr.onerror(new Error('Request blocked'));
          }, 500);

          // Prevent the actual request
          return;
        }

        originalOpen.apply(this, arguments);
      };

      return xhr;
    };

    const preventBackNavigation = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', preventBackNavigation);
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && (
        url.includes('/_next/data') ||
        url.includes('/api/') ||
        url.includes('/auth/') ||
        (options?.headers?.Authorization ||
         (options?.headers && options?.headers.get && options?.headers.get('Authorization')))
      )) {

        return new Promise(resolve => {
          setTimeout(() => {
            resolve(new Response(JSON.stringify({
              blocked: true,
              message: 'Tài khoản đã bị khóa',
              status: 403
            }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            }));
          }, 500);
        });
      }

      return originalFetch(url, options);
    };

    // Clean up
    return () => {
      window.removeEventListener('popstate', preventBackNavigation);
      window.fetch = originalFetch;
      window.XMLHttpRequest = originalXHR;
    };
  }, []);

  return (
    <>
      <Head>
        <title>Tài khoản đã bị khóa</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="next-head-count" content="3" />
      </Head>

      <div className="account-locked-container">
        <div className="account-locked-card">
          <h1>Tài khoản đã bị khóa</h1>

          <p className="locked-message">
            Tài khoản của bạn hiện đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.
          </p>

          <button
            className="login-button"
            onClick={handleLogout}
            disabled={isRedirecting}
          >
            {isRedirecting ? 'Đang xử lý...' : 'Quay lại trang đăng nhập'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .account-locked-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #000000;
          padding: 20px;
        }

        .account-locked-card {
          background-color: #e50914;
          padding: 2rem;
          border-radius: 4px;
          max-width: 500px;
          width: 100%;
          color: white;
          text-align: center;
        }

        h1 {
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          font-weight: 700;
        }

        .locked-message {
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }

        .login-button {
          background-color: white;
          color: black;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          background-color: #f8f8f8;
          transform: translateY(-2px);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {},
  };
}

AccountLockedPage.getLayout = page => page;