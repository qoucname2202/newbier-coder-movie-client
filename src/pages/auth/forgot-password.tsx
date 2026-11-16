/**
 * @file pages/auth/forgot-password.tsx
 */
import { useState, ChangeEvent, FormEvent, MouseEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { FaEnvelope, FaArrowLeft, FaSpinner, FaCheckCircle } from 'react-icons/fa';

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      const response = await axios.post('/api/auth/forgot-password', { email });
      if (response.data.success) setSuccess(true);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;

      setError(axiosErr.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => setEmail(e.target.value);
  const handleResend = (e: MouseEvent<HTMLButtonElement>): void => {
    e.preventDefault();
    setSuccess(false);
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Check Your Email - Movie Streaming</title>
        </Head>
        <div className="forgot-password-container">
          <div className="background-effect" />
          <div className="background-gradient" />

          <div className="success-card">
            <div className="success-icon">
              <FaCheckCircle />
            </div>
            <h1>Email đã được gửi!</h1>
            <p>
              Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>.
            </p>
            <p>Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn.</p>
            <p className="expire-note">
              <em>Liên kết sẽ hết hạn sau 15 phút.</em>
            </p>
            <div className="action-buttons">
              <Link href="/auth/login" legacyBehavior>
                <a className="back-to-login">
                  <FaArrowLeft /> Quay lại đăng nhập
                </a>
              </Link>
              <button className="resend-button" type="button" onClick={handleResend}>
                Gửi lại email
              </button>
            </div>
          </div>

          <style jsx>{`
            .forgot-password-container {
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
            .background-effect {
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: linear-gradient(
                45deg,
                rgba(25, 28, 40, 0.7) 0%,
                rgba(40, 43, 60, 0.8) 20%,
                rgba(70, 75, 95, 0.8) 40%,
                rgba(20, 22, 35, 0.9) 60%,
                rgba(60, 65, 85, 0.8) 80%,
                rgba(15, 18, 30, 0.7) 100%
              );
              animation: gradientShift 20s ease infinite;
              z-index: 0;
            }
            .background-gradient {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(
                circle at center,
                rgba(100, 100, 110, 0.2) 0%,
                rgba(10, 10, 10, 0.9) 70%
              );
              z-index: 1;
            }
            .success-card {
              background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.9));
              border-radius: 15px;
              padding: 50px;
              max-width: 500px;
              width: 100%;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
              position: relative;
              z-index: 2;
            }
            .success-icon {
              font-size: 4rem;
              color: #4caf50;
              margin-bottom: 30px;
              animation: bounce 2s ease-in-out infinite;
            }
            h1 {
              color: #fff;
              font-size: 2rem;
              margin-bottom: 20px;
              font-weight: 300;
            }
            p {
              color: #ccc;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            .expire-note {
              color: #ffa726;
              font-size: 0.9rem;
              margin-top: 20px;
            }
            .action-buttons {
              display: flex;
              flex-direction: column;
              gap: 15px;
              margin-top: 30px;
            }
            .back-to-login {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 12px 30px;
              background: linear-gradient(135deg, #4a5380, #323b66);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              transition: all 0.3s ease;
              font-weight: 500;
            }
            .back-to-login:hover {
              background: linear-gradient(135deg, #536094, #3a4475);
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            .resend-button {
              padding: 12px 30px;
              background: transparent;
              border: 2px solid #4a5380;
              color: #4a5380;
              border-radius: 5px;
              cursor: pointer;
              transition: all 0.3s ease;
              font-weight: 500;
            }
            .resend-button:hover {
              background: #4a5380;
              color: white;
            }
            @keyframes bounce {
              0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
              40% { transform: translateY(-10px); }
              60% { transform: translateY(-5px); }
            }
            @keyframes gradientShift {
              0%, 100% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(180deg) scale(1.1); }
            }
            @media (max-width: 768px) {
              .forgot-password-container {
                min-height: 100vh;
                min-height: 100dvh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 48px 16px 24px;
                box-sizing: border-box;
              }
              .success-card { padding: 30px 20px; margin: auto 0; width: 100%; max-width: 420px; }
              .action-buttons { flex-direction: column; }
            }

            @media (max-width: 480px) {
              .forgot-password-container {
                padding: 44px 14px 20px;
                min-height: 100vh;
                min-height: 100dvh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .success-card {
                padding: 24px 16px;
                margin: auto 0;
                width: 100%;
                border-radius: 14px;
              }
              .success-icon {
                font-size: 3.5rem;
                margin-bottom: 20px;
              }
              h1 {
                font-size: 1.6rem;
                margin-bottom: 12px;
              }
              p {
                font-size: 14px;
                margin-bottom: 10px;
              }
              .action-buttons {
                gap: 10px;
                margin-top: 24px;
              }
              .back-to-login,
              .resend-button {
                padding: 11px 16px;
                font-size: 14px;
                width: 100%;
                justify-content: center;
              }
            }

            @media (max-width: 421px) {
              .forgot-password-container {
                padding: 40px 12px 18px;
                min-height: 100vh;
                min-height: 100dvh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .success-card {
                padding: 20px 14px;
                margin: auto 0;
                border-radius: 12px;
              }
              .success-icon {
                font-size: 3rem;
                margin-bottom: 16px;
              }
              h1 {
                font-size: 1.4rem;
                margin-bottom: 10px;
              }
              p {
                font-size: 13px;
                margin-bottom: 8px;
              }
              .expire-note {
                font-size: 12px;
              }
              .back-to-login,
              .resend-button {
                padding: 10px 14px;
                font-size: 13px;
              }
            }

            @media (max-width: 360px) {
              .forgot-password-container {
                padding: 36px 8px 14px;
                min-height: 100vh;
                min-height: 100dvh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .success-card {
                padding: 16px 10px;
                margin: auto 0;
              }
              h1 {
                font-size: 1.25rem;
              }
              .success-icon {
                font-size: 2.5rem;
              }
            }
          `}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Forgot Password - Movie Streaming</title>
      </Head>
      <div className="forgot-password-container">
        <div className="background-effect" />
        <div className="background-gradient" />

        <Link href="/auth/login" legacyBehavior>
          <a className="back-button">
            <FaArrowLeft /> Quay lại
          </a>
        </Link>

        <div className="forgot-password-card">
          <h1>Quên mật khẩu</h1>
          <p>Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={`input-group ${email ? 'active' : ''}`}>
              <div className="input-icon">
                <FaEnvelope />
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Email của bạn"
                disabled={isLoading}
                autoFocus
              />
              <div className="input-line" />
            </div>

            <button type="submit" className="submit-button" disabled={isLoading || !email}>
              {isLoading ? (
                <>
                  <FaSpinner className="spinner-icon" /> Đang gửi...
                </>
              ) : (
                'Gửi email đặt lại'
              )}
            </button>
          </form>
          <div className="auth-links">
            <Link href="/auth/login" legacyBehavior>
              <a>Quay lại đăng nhập</a>
            </Link>
            <span> | </span>
            <Link href="/auth/signup" legacyBehavior>
              <a>Đăng ký tài khoản mới</a>
            </Link>
          </div>
        </div>

        <style jsx>{`
          .forgot-password-container {
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
          .background-effect {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              45deg,
              rgba(25, 28, 40, 0.7) 0%,
              rgba(40, 43, 60, 0.8) 20%,
              rgba(70, 75, 95, 0.8) 40%,
              rgba(20, 22, 35, 0.9) 60%,
              rgba(60, 65, 85, 0.8) 80%,
              rgba(15, 18, 30, 0.7) 100%
            );
            animation: gradientShift 20s ease infinite;
            z-index: 0;
          }
          .background-gradient {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(
              circle at center,
              rgba(100, 100, 110, 0.2) 0%,
              rgba(10, 10, 10, 0.9) 70%
            );
            z-index: 1;
          }
          .back-button {
            position: absolute;
            top: 30px;
            left: 30px;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 20px;
            background: rgba(30, 30, 30, 0.8);
            color: #fff;
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.3s ease;
            z-index: 10;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(5px);
          }
          .back-button:hover {
            background: rgba(65, 75, 110, 0.3);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
          }
          .forgot-password-card {
            background: linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.9));
            border-radius: 15px;
            padding: 50px;
            max-width: 450px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            z-index: 2;
            backdrop-filter: blur(10px);
          }
          h1 {
            color: #fff;
            font-size: 2.2rem;
            margin-bottom: 15px;
            font-weight: 300;
          }
          p {
            color: #ccc;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          .input-group {
            position: relative;
            margin-bottom: 25px;
            text-align: left;
          }
          .input-icon {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: rgba(255, 255, 255, 0.5);
            z-index: 2;
          }
          input {
            width: 100%;
            padding: 15px 15px 15px 45px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            color: #fff;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          input:focus {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(123, 136, 201, 0.4);
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
            outline: none;
          }
          input:disabled { opacity: 0.7; cursor: not-allowed; }
          input::placeholder { color: rgba(255, 255, 255, 0.3); }
          .input-line {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, #4a5380, #7b88c9, #4a5380);
            transition: all 0.3s ease;
          }
          .input-group.active .input-line { width: 100%; }
          .submit-button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #4a5380, #323b66);
            border: none;
            border-radius: 5px;
            color: #fff;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          }
          .submit-button:disabled { opacity: 0.6; cursor: not-allowed; }
          .submit-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #536094, #3a4475);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }
          .spinner-icon { animation: spin 1s linear infinite; }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .error-message {
            color: #ff5555;
            text-align: center;
            margin-bottom: 20px;
            padding: 12px;
            background: rgba(255, 0, 0, 0.08);
            border-radius: 5px;
            border-left: 3px solid #ff5555;
            font-size: 14px;
          }
          .auth-links {
            margin-top: 25px;
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
          }
          .auth-links a {
            color: #b0b0b0;
            text-decoration: none;
            transition: color 0.3s ease;
          }
          .auth-links a:hover { color: #7b88c9; }
          @keyframes gradientShift {
            0%, 100% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
          }
          @media (max-width: 950px) {
            .forgot-password-container {
              min-height: 100vh;
              min-height: 100dvh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 68px 24px 32px;
              box-sizing: border-box;
              position: relative;
            }
            .forgot-password-card {
              padding: 34px 26px;
              margin: auto 0;
              width: 100%;
              max-width: 440px;
            }
            .back-button {
              position: absolute;
              top: 20px;
              left: 24px;
              z-index: 25;
            }
          }

          @media (min-width: 750px) and (max-width: 950px) {
            .forgot-password-container {
              min-height: 100vh;
              min-height: 100dvh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 72px 32px 36px;
              box-sizing: border-box;
              position: relative;
            }
            .forgot-password-card {
              padding: 36px 30px;
              margin: auto 0;
              width: 100%;
              max-width: 450px;
            }
            .back-button {
              position: absolute;
              top: 20px;
              left: 24px;
              z-index: 25;
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
              transition: all 0.2s ease;
            }
            .back-button:hover {
              color: #ffffff;
              background: transparent;
              transform: translateX(-2px);
            }
          }

          @media (max-width: 749px) {
            .forgot-password-container {
              padding: 56px 16px 24px;
            }
            .forgot-password-card {
              padding: 30px 22px;
              max-width: 420px;
            }
            .back-button {
              top: 14px;
              left: 14px;
            }
          }

          @media (max-width: 480px) {
            .forgot-password-container {
              padding: 44px 14px 20px;
              min-height: 100vh;
              min-height: 100dvh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .forgot-password-card {
              margin: auto 0;
              padding: 24px 18px;
              border-radius: 14px;
            }
            h1 {
              font-size: 1.7rem;
              margin-bottom: 12px;
            }
            p {
              font-size: 14px;
              margin-bottom: 22px;
            }
            .input-group {
              margin-bottom: 18px;
            }
            input {
              padding: 12px 14px 12px 40px;
              font-size: 14.5px;
            }
            .submit-button {
              padding: 12px;
              font-size: 15px;
              border-radius: 8px;
            }
            .back-button {
              top: 12px;
              left: 12px;
              padding: 6px 12px;
              font-size: 12.5px;
            }
            .auth-links {
              margin-top: 20px;
              font-size: 13px;
            }
          }

          @media (max-width: 421px) {
            .forgot-password-container {
              padding: 40px 12px 18px;
              min-height: 100vh;
              min-height: 100dvh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .forgot-password-card {
              margin: auto 0;
              padding: 20px 14px;
              border-radius: 12px;
            }
            h1 {
              font-size: 1.45rem;
              margin-bottom: 8px;
            }
            p {
              font-size: 13px;
              margin-bottom: 18px;
            }
            .input-group {
              margin-bottom: 15px;
            }
            input {
              padding: 11px 12px 11px 36px;
              font-size: 14px;
            }
            .input-icon {
              left: 12px;
            }
            .submit-button {
              padding: 11px;
              font-size: 14.5px;
              margin-bottom: 14px;
            }
            .back-button {
              top: 10px;
              left: 10px;
              padding: 5px 10px;
              font-size: 12px;
              gap: 5px;
            }
            .auth-links {
              margin-top: 16px;
              font-size: 12.5px;
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .auth-links span {
              display: none;
            }
          }

          @media (max-width: 360px) {
            .forgot-password-container {
              padding: 36px 8px 14px;
              min-height: 100vh;
              min-height: 100dvh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .forgot-password-card {
              margin: auto 0;
              padding: 16px 10px;
            }
            h1 {
              font-size: 1.3rem;
            }
            p {
              font-size: 12.5px;
              margin-bottom: 14px;
            }
            input {
              padding: 10px 10px 10px 32px;
              font-size: 13px;
            }
            .submit-button {
              padding: 10px;
              font-size: 14px;
            }
            .auth-links {
              font-size: 12px;
            }
          }

          @media (orientation: landscape) and (max-height: 500px) {
            .forgot-password-container {
              padding: 34px 14px 14px;
              min-height: 100vh;
              min-height: 100dvh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .forgot-password-card {
              padding: 16px 20px;
              max-width: 420px;
              margin: auto 0;
            }
            h1 {
              font-size: 1.3rem;
              margin-bottom: 6px;
            }
            p {
              font-size: 12px;
              margin-bottom: 12px;
            }
            .input-group {
              margin-bottom: 10px;
            }
            input {
              padding: 8px 10px 8px 32px;
              font-size: 13px;
            }
            .submit-button {
              padding: 8px;
              font-size: 13.5px;
              margin-bottom: 8px;
            }
            .auth-links {
              margin-top: 8px;
              font-size: 11.5px;
            }
          }
        `}</style>
      </div>
    </>
  );
}
