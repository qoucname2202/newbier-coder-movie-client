import { useState, useEffect, ChangeEvent, FormEvent, MouseEvent } from 'react';
import Link from 'next/link';
import {
  FaGoogle,
  FaHome,
  FaUser,
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaMapMarkerAlt,
  FaPhone,
  FaCalendarAlt
} from 'react-icons/fa';
import { useRouter } from 'next/router';
import { signIn, SignInResponse } from 'next-auth/react';
import axios from 'axios';

interface FormFields {
  email: string;
  password: string;
  retype_password: string;
  fullname: string;
  address: string;
  phone: string;
  date_of_birth: string;
}

interface SocialLoading {
  google: boolean;
}

type FocusedField = 'email' | 'password' | 'retype_password' | 'fullname' | 'address' | 'phone' | 'date_of_birth' | null;

export interface AuthFormProps {
  onSubmit?: (form: FormFields) => void;
  isLoading?: boolean;
  error?: string;
  message?: string;
  isSignup?: boolean;
}

const EMPTY_FIELDS: FormFields = {
  email: '',
  password: '',
  retype_password: '',
  fullname: '',
  address: '',
  phone: '',
  date_of_birth: ''
};

const EMPTY_SOCIAL: SocialLoading = { google: false };

const AuthForm: React.FC<AuthFormProps> = ({
  onSubmit,
  isLoading = false,
  error,
  message,
  isSignup = false
}) => {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [formFields, setFormFields] = useState<FormFields>(EMPTY_FIELDS);
  const [socialLoading, setSocialLoading] = useState<SocialLoading>(EMPTY_SOCIAL);
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSwitchAuth = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>): void => {
    e.preventDefault();
    setIsAnimating(true);
    const path: string = isSignup ? '/auth/login' : '/auth/signup';

    setTimeout(() => {
      router.push(path);
    }, 300);

    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const handleHomeClick = (): void => {
    router.push('/');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormFields((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formFields);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      setSocialLoading((prev) => ({ ...prev, google: true }));
      const result: SignInResponse | undefined = await signIn('google', {
        callbackUrl: '/',
        redirect: false
      });

      if (result?.error) {

        alert(`Đăng nhập Google thất bại: ${result.error}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      alert(`Đăng nhập Google thất bại: ${message}`);
    } finally {
      setSocialLoading((prev) => ({ ...prev, google: false }));
    }
  };

  const authBoxClass: string = `auth-box ${isAnimating ? 'animating' : ''} ${
    isSignup ? 'signup' : 'login'
  }`;

  return (
    <div className="auth-container">
      <div className="background-image" />
      <div className="background-effect" />
      <div className="background-gradient" />
      <div className="floating-particles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
      </div>

      <button className="home-button" onClick={handleHomeClick} aria-label="Trang chủ">
        <FaHome /> Trang chủ
      </button>

      <div className={authBoxClass}>
        <div className="form-container">
          <div className="form-section">
            <h2>
              {isSignup ? 'Sign up' : 'Login'}
              <span className="accent-dot">.</span>
            </h2>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <form onSubmit={handleSubmit}>
              {isSignup && (
                <div
                  className={`input-group ${
                    focusedField === 'fullname' || formFields.fullname ? 'active' : ''
                  }`}
                >
                  <div className="input-icon">
                    <FaUser />
                  </div>
                  <input
                    type="text"
                    name="fullname"
                    value={formFields.fullname}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    onFocus={() => setFocusedField('fullname')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isLoading}
                  />
                  <div className="input-line" />
                </div>
              )}

              <div
                className={`input-group ${
                  focusedField === 'email' || formFields.email ? 'active' : ''
                }`}
              >
                <div className="input-icon">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formFields.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                />
                <div className="input-line" />
              </div>

              <div
                className={`input-group ${
                  focusedField === 'password' || formFields.password ? 'active' : ''
                }`}
              >
                <div className="input-icon">
                  <FaLock />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formFields.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                />
                <div className="input-line" />
              </div>

              {isSignup && (
                <>
                  <div
                    className={`input-group ${
                      focusedField === 'retype_password' || formFields.retype_password
                        ? 'active'
                        : ''
                    }`}
                  >
                    <div className="input-icon">
                      <FaLock />
                    </div>
                    <input
                      type="password"
                      name="retype_password"
                      value={formFields.retype_password}
                      onChange={handleInputChange}
                      placeholder="Retype Password"
                      onFocus={() => setFocusedField('retype_password')}
                      onBlur={() => setFocusedField(null)}
                      disabled={isLoading}
                    />
                    <div className="input-line" />
                  </div>
                  <div
                    className={`input-group ${
                      focusedField === 'address' || formFields.address ? 'active' : ''
                    }`}
                  >
                    <div className="input-icon">
                      <FaMapMarkerAlt />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={formFields.address}
                      onChange={handleInputChange}
                      placeholder="Address"
                      onFocus={() => setFocusedField('address')}
                      onBlur={() => setFocusedField(null)}
                      disabled={isLoading}
                    />
                    <div className="input-line" />
                  </div>
                  <div
                    className={`input-group ${
                      focusedField === 'phone' || formFields.phone ? 'active' : ''
                    }`}
                  >
                    <div className="input-icon">
                      <FaPhone />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={formFields.phone}
                      onChange={handleInputChange}
                      placeholder="Phone"
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      disabled={isLoading}
                    />
                    <div className="input-line" />
                  </div>
                  <div
                    className={`input-group ${
                      focusedField === 'date_of_birth' || formFields.date_of_birth ? 'active' : ''
                    }`}
                  >
                    <div className="input-icon">
                      <FaCalendarAlt />
                    </div>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formFields.date_of_birth}
                      onChange={handleInputChange}
                      placeholder="Date of Birth"
                      onFocus={() => setFocusedField('date_of_birth')}
                      onBlur={() => setFocusedField(null)}
                      disabled={isLoading}
                    />
                    <div className="input-line" />
                  </div>
                </>
              )}

              <button className="auth-button" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <FaSpinner className="spinner-icon" /> Processing...
                  </>
                ) : isSignup ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
                <span className="button-effect" />
              </button>

              {mounted && (
                <div className="social-login">
                  <button
                    className="social-button google"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || socialLoading.google}
                  >
                    {socialLoading.google ? (
                      <>
                        <FaSpinner className="spinner-icon" /> Connecting with Google...
                      </>
                    ) : (
                      <>
                        <FaGoogle /> Continue with Google
                      </>
                    )}
                  </button>
                </div>
              )}
              {!isSignup && (
                <div className="forgot-password-link">
                  <Link href="/auth/forgot-password" legacyBehavior>
                    <a>Forgot your password?</a>
                  </Link>
                </div>
              )}

              <div className="switch-auth">
                {isSignup ? "Already have an account?" : "Don't have an account?"}
                <a href="#" onClick={handleSwitchAuth}>
                  {isSignup ? ' Sign in' : ' Sign up'}
                </a>
              </div>
            </form>
          </div>
        </div>

        <div className="welcome-section">
          <div className="welcome-content">
            <h1>{isSignup ? 'Join Us Today' : 'Welcome Back'}</h1>
            <p>
              {isSignup
                ? 'Create an account to start enjoying unlimited streaming.'
                : 'Sign in to access your favorite movies and TV shows.'}
            </p>
            <button className="switch-button" onClick={handleSwitchAuth}>
              {isSignup ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d111f;
          padding: 20px;
          perspective: 1000px;
          position: relative;
          overflow: hidden;
        }
        .background-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: url('/img/background/movies-wall.jpg') center/cover no-repeat;
          opacity: 0.75;
          z-index: 0;
          filter: blur(1px);
          transform: scale(1.1);
          animation: dynamicPan 80s infinite alternate-reverse ease-in-out;
        }

        @keyframes dynamicPan {
          0% { transform: scale(1.1) translate(0, 0) rotate(0deg); }
          20% { transform: scale(1.12) translate(-2%, -1%) rotate(0.5deg); }
          40% { transform: scale(1.15) translate(1%, -2%) rotate(-0.3deg); }
          60% { transform: scale(1.13) translate(2%, 0%) rotate(0.2deg); }
          80% { transform: scale(1.11) translate(1%, 2%) rotate(-0.5deg); }
          100% { transform: scale(1.16) translate(-1.5%, 1.5%) rotate(0.7deg); }
        }
        .background-effect {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            rgba(15, 18, 30, 0.7) 0%,
            rgba(30, 33, 50, 0.8) 20%,
            rgba(45, 50, 70, 0.8) 40%,
            rgba(12, 15, 25, 0.9) 60%,
            rgba(40, 45, 65, 0.8) 80%,
            rgba(10, 12, 22, 0.7) 100%
          );
          animation: gradientShift 30s ease infinite;
          z-index: 1;
        }
        .background-gradient {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(60, 65, 80, 0.4) 0%,
            rgba(40, 45, 55, 0.35) 20%,
            rgba(10, 10, 20, 0.7) 70%
          );
          z-index: 2;
        }

        .background-gradient::after {
          content: '';
          position: absolute;
          top: -150%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.07) 0%, rgba(0, 0, 0, 0) 70%);
          animation: lightMove 15s infinite linear;
          z-index: 0;
        }

        .floating-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 3;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          animation: float 20s infinite linear;
          z-index: 3;
        }

        .particle::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%);
          filter: blur(1px);
        }

        @keyframes float {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          5% { opacity: 0.8; }
          95% { opacity: 0.5; }
          100% { transform: translateY(-100vh) translateX(20px) scale(0.2); opacity: 0; }
        }

        .particle-1 { left: 10%; animation-duration: 15s; animation-delay: 0s; }
        .particle-2 { left: 20%; animation-duration: 25s; animation-delay: 2s; }
        .particle-3 { left: 30%; animation-duration: 18s; animation-delay: 4s; }
        .particle-4 { left: 40%; animation-duration: 22s; animation-delay: 6s; }
        .particle-5 { left: 50%; animation-duration: 20s; animation-delay: 8s; }
        .particle-6 { left: 60%; animation-duration: 17s; animation-delay: 10s; }
        .particle-7 { left: 70%; animation-duration: 23s; animation-delay: 3s; }
        .particle-8 { left: 80%; animation-duration: 19s; animation-delay: 5s; }
        .particle-9 { left: 90%; animation-duration: 21s; animation-delay: 7s; }
        .particle-10 { left: 15%; animation-duration: 24s; animation-delay: 9s; }
        .particle-11 { left: 25%; animation-duration: 16s; animation-delay: 1s; }
        .particle-12 { left: 35%; animation-duration: 26s; animation-delay: 0s; }
        .particle-13 { left: 45%; animation-duration: 19s; animation-delay: 2s; }
        .particle-14 { left: 55%; animation-duration: 22s; animation-delay: 4s; }
        .particle-15 { left: 65%; animation-duration: 18s; animation-delay: 6s; }
        .auth-container::before {
          content: '';
          position: absolute;
          top: -30%;
          left: -30%;
          width: 80%;
          height: 80%;
          background: radial-gradient(circle at center, rgba(100, 110, 130, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
          filter: blur(20px);
          z-index: 1;
          animation: floatLight 18s ease-in-out infinite alternate;
        }

        @keyframes floatLight {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15%, 10%) scale(1.2); }
          100% { transform: translate(-10%, 15%) scale(0.9); }
        }

        .auth-box {
          position: relative;
          z-index: 10;
          display: flex;
          width: 900px;
          max-width: 100%;
          min-height: 600px;
          background: rgba(15, 18, 30, 0.85);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(229, 9, 20, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }

        .auth-box.animating {
          transform: scale(0.97) rotateY(2deg);
          opacity: 0.85;
        }

        .form-container {
          flex: 1;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(15, 18, 30, 0.6);
        }

        .form-section {
          width: 100%;
        }

        .form-section h2 {
          font-size: 32px;
          color: #fff;
          margin-bottom: 25px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .accent-dot {
          color: #e50914;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #777;
          transition: color 0.3s ease;
          z-index: 2;
        }

        .input-group input {
          width: 100%;
          padding: 14px 14px 14px 40px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          transition: all 0.3s ease;
          outline: none;
        }

        .input-group input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .input-group input:focus {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(229, 9, 20, 0.5);
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.15);
        }

        .input-group.active .input-icon {
          color: #e50914;
        }

        .input-line {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: #e50914;
          transition: all 0.3s ease;
        }

        .input-group.active .input-line {
          width: 100%;
          left: 0;
        }

        .error-message,
        .success-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          text-align: left;
        }

        .error-message {
          background: rgba(229, 9, 20, 0.15);
          color: #ff6b6b;
          border: 1px solid rgba(229, 9, 20, 0.3);
        }

        .success-message {
          background: rgba(40, 167, 69, 0.15);
          color: #5dd879;
          border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .auth-button {
          width: 100%;
          padding: 14px;
          background: #e50914;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .auth-button:hover:not(:disabled) {
          background: #f40612;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(229, 9, 20, 0.4);
        }

        .auth-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .auth-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .button-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 0;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .social-login {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .social-button {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .social-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }

        .social-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .social-button.google:hover {
          background: rgba(219, 68, 55, 0.15);
          border-color: rgba(219, 68, 55, 0.4);
        }

        .social-button.facebook:hover {
          background: rgba(66, 103, 178, 0.15);
          border-color: rgba(66, 103, 178, 0.4);
        }

        .forgot-password-link {
          text-align: right;
          margin-top: 12px;
        }

        .forgot-password-link a {
          color: #aaa;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s ease;
        }

        .forgot-password-link a:hover {
          color: #e50914;
        }

        .switch-auth {
          text-align: center;
          margin-top: 24px;
          color: #aaa;
          font-size: 14px;
        }

        .switch-auth a {
          color: #e50914;
          text-decoration: none;
          font-weight: 600;
          margin-left: 6px;
          transition: color 0.2s ease;
        }

        .switch-auth a:hover {
          color: #ff3b47;
        }

        .welcome-section {
          flex: 1;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.85) 0%, rgba(120, 0, 0, 0.95) 100%);
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .welcome-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 60%),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0) 60%);
          pointer-events: none;
        }

        .welcome-content {
          position: relative;
          z-index: 2;
          max-width: 320px;
        }

        .welcome-content h1 {
          font-size: 28px;
          margin-bottom: 16px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .welcome-content p {
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 24px;
          opacity: 0.9;
        }

        .switch-button {
          background: transparent;
          color: white;
          border: 2px solid white;
          padding: 10px 28px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .switch-button:hover {
          background: white;
          color: #e50914;
        }

        .home-button {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.4);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          z-index: 20;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .home-button:hover {
          background: rgba(229, 9, 20, 0.7);
          border-color: rgba(229, 9, 20, 0.7);
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes lightMove {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-30%, -50%) rotate(360deg); }
        }

        @media (max-width: 950px) {
          .auth-container {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 68px 24px 32px;
            box-sizing: border-box;
            position: relative;
          }
          .auth-box {
            flex-direction: column;
            min-height: auto;
            width: 100%;
            max-width: 480px;
            border-radius: 18px;
            margin: auto 0;
          }
          .welcome-section {
            display: none;
          }
          .form-container {
            padding: 34px 26px;
            background: rgba(15, 18, 30, 0.9);
          }
          .home-button {
            position: absolute;
            top: 20px;
            left: 24px;
            z-index: 30;
          }
        }

        @media (min-width: 750px) and (max-width: 950px) {
          .auth-container {
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 72px 32px 36px;
            box-sizing: border-box;
            position: relative;
          }
          .auth-box {
            flex-direction: column;
            min-height: auto;
            width: 100%;
            max-width: 480px;
            border-radius: 18px;
            margin: auto 0;
          }
          .welcome-section {
            display: none;
          }
          .form-container {
            padding: 36px 30px;
            background: rgba(15, 18, 30, 0.92);
          }
          .home-button {
            position: absolute;
            top: 20px;
            left: 24px;
            z-index: 30;
            padding: 6px 10px;
            font-size: 14px;
            color: #94a3b8;
            background: transparent;
            border: none;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .home-button:hover {
            color: #ffffff;
            background: transparent;
            border: none;
            transform: translateX(-2px);
          }
        }

        @media (max-width: 749px) {
          .auth-container {
            padding: 56px 16px 24px;
          }
          .auth-box {
            max-width: 460px;
            border-radius: 16px;
          }
          .form-container {
            padding: 30px 22px;
          }
          .home-button {
            top: 14px;
            left: 14px;
          }
        }

        @media (max-width: 480px) {
          .auth-container {
            padding: 44px 14px 20px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .floating-particles {
            display: none;
          }
          .auth-box {
            border-radius: 14px;
            margin: auto 0;
            width: 100%;
            max-width: 420px;
          }
          .form-container {
            padding: 24px 18px;
          }
          .form-section h2 {
            font-size: 24px;
            margin-bottom: 20px;
          }
          .input-group {
            margin-bottom: 14px;
          }
          .input-group input {
            padding: 12px 14px 12px 38px;
            font-size: 14.5px;
          }
          .input-icon {
            left: 11px;
            font-size: 14px;
          }
          .auth-button {
            padding: 12px;
            font-size: 15px;
          }
          .switch-auth {
            margin-top: 18px;
            font-size: 13.5px;
          }
          .home-button {
            top: 12px;
            left: 12px;
            padding: 6px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 421px) {
          .auth-container {
            padding: 40px 12px 18px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .auth-box {
            margin: auto 0;
            width: 100%;
            max-width: 100%;
          }
          .form-container {
            padding: 20px 14px;
          }
          .form-section h2 {
            font-size: 22px;
            margin-bottom: 16px;
          }
          .input-group {
            margin-bottom: 11px;
          }
          .input-group input {
            padding: 11px 12px 11px 34px;
            font-size: 14px;
            border-radius: 8px;
          }
          .input-icon {
            left: 10px;
            font-size: 13px;
          }
          .error-message,
          .success-message {
            padding: 10px 12px;
            font-size: 13px;
            margin-bottom: 14px;
          }
          .auth-button {
            padding: 11px;
            font-size: 14.5px;
            border-radius: 8px;
          }
          .social-login {
            margin-top: 14px;
            gap: 8px;
          }
          .social-button {
            padding: 10px;
            font-size: 13px;
            border-radius: 8px;
          }
          .switch-auth {
            margin-top: 16px;
            font-size: 13px;
          }
          .home-button {
            top: 10px;
            left: 10px;
            padding: 5px 10px;
            font-size: 11.5px;
            gap: 5px;
          }
        }

        @media (max-width: 360px) {
          .auth-container {
            padding: 38px 8px 14px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .auth-box {
            margin: auto 0;
          }
          .form-container {
            padding: 16px 10px;
          }
          .form-section h2 {
            font-size: 20px;
            margin-bottom: 12px;
          }
          .input-group {
            margin-bottom: 9px;
          }
          .input-group input {
            padding: 10px 10px 10px 30px;
            font-size: 13px;
          }
          .input-icon {
            left: 8px;
            font-size: 12px;
          }
          .auth-button {
            padding: 10px;
            font-size: 14px;
          }
          .switch-auth {
            font-size: 12px;
            margin-top: 12px;
          }
        }

        @media (orientation: landscape) and (max-height: 500px) {
          .auth-container {
            padding: 34px 16px 14px;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .floating-particles {
            display: none;
          }
          .welcome-section {
            display: none;
          }
          .auth-box {
            max-width: 440px;
            margin: auto 0;
          }
          .form-container {
            padding: 14px 16px;
          }
          .form-section h2 {
            font-size: 18px;
            margin-bottom: 10px;
          }
          .input-group {
            margin-bottom: 8px;
          }
          .input-group input {
            padding: 8px 10px 8px 30px;
            font-size: 13px;
          }
          .auth-button {
            padding: 8px;
            font-size: 13.5px;
          }
          .switch-auth {
            margin-top: 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
