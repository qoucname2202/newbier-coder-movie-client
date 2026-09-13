import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import axios from 'axios';
import { FaLock, FaArrowLeft, FaSpinner, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Get token from URL query parameters
        if (router.query.token) {
            setToken(router.query.token);
        }
    }, [router.query]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!token) {
            setError('Token không hợp lệ hoặc đã hết hạn');
            return;
        }

        if (!newPassword || !confirmPassword) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setIsLoading(true);
            setError('');
            
            const response = await axios.post('/api/auth/reset-password', {
                token,
                newPassword,
                confirmPassword
            });
            
            if (response.data.success) {
                setSuccess(true);
            }
        } catch (err) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <Head>
                    <title>Đặt lại mật khẩu thành công - Movie Streaming</title>
                </Head>
                <div className="reset-password-container">
                    <div className="background-effect"></div>
                    <div className="background-gradient"></div>
                    
                    <div className="success-card">
                        <div className="success-icon">
                            <FaCheckCircle />
                        </div>
                        <h1>Đặt lại mật khẩu thành công!</h1>
                        <p>
                            Mật khẩu của bạn đã được cập nhật thành công.
                        </p>
                        <p>
                            Bạn có thể đăng nhập ngay bây giờ với mật khẩu mới.
                        </p>
                          <div className="action-buttons">
                            <Link href="/auth/login" legacyBehavior>
                                <a className="login-button">
                                    Đăng nhập ngay
                                </a>
                            </Link>
                        </div>
                    </div>

                    <style jsx>{`
                        .reset-password-container {
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
                            background: linear-gradient(45deg, 
                                rgba(25, 28, 40, 0.7) 0%, 
                                rgba(40, 43, 60, 0.8) 20%, 
                                rgba(70, 75, 95, 0.8) 40%, 
                                rgba(20, 22, 35, 0.9) 60%, 
                                rgba(60, 65, 85, 0.8) 80%, 
                                rgba(15, 18, 30, 0.7) 100%);
                            animation: gradientShift 20s ease infinite;
                            z-index: 0;
                        }
                        
                        .background-gradient {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: radial-gradient(circle at center, rgba(100, 100, 110, 0.2) 0%, rgba(10, 10, 10, 0.9) 70%);
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
                            color: #4CAF50;
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

                        .action-buttons {
                            margin-top: 30px;
                        }

                        .login-button {
                            display: inline-flex;
                            align-items: center;
                            gap: 10px;
                            padding: 15px 40px;
                            background: linear-gradient(135deg, #4a5380, #323b66);
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            transition: all 0.3s ease;
                            font-weight: 500;
                            font-size: 16px;
                        }

                        .login-button:hover {
                            background: linear-gradient(135deg, #536094, #3a4475);
                            transform: translateY(-2px);
                            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                        }

                        @keyframes bounce {
                            0%, 20%, 50%, 80%, 100% {
                                transform: translateY(0);
                            }
                            40% {
                                transform: translateY(-10px);
                            }
                            60% {
                                transform: translateY(-5px);
                            }
                        }

                        @keyframes gradientShift {
                            0%, 100% { transform: rotate(0deg) scale(1); }
                            50% { transform: rotate(180deg) scale(1.1); }
                        }

                        @media (max-width: 768px) {
                            .success-card {
                                padding: 30px 20px;
                                margin: 0 20px;
                            }
                        }
                    `}</style>
                </div>
            </>
        );
    }

    if (!token) {
        return (
            <>
                <Head>
                    <title>Liên kết không hợp lệ - Movie Streaming</title>
                </Head>
                <div className="reset-password-container">
                    <div className="background-effect"></div>
                    <div className="background-gradient"></div>
                    
                    <div className="error-card">
                        <div className="error-icon">
                            <FaLock />
                        </div>
                        <h1>Liên kết không hợp lệ</h1>
                        <p>
                            Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                        </p>
                        <p>
                            Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.
                        </p>
                          <div className="action-buttons">
                            <Link href="/auth/forgot-password" legacyBehavior>
                                <a className="retry-button">
                                    Gửi lại email
                                </a>
                            </Link>
                            <Link href="/auth/login" legacyBehavior>
                                <a className="back-button">
                                    <FaArrowLeft /> Quay lại đăng nhập
                                </a>
                            </Link>
                        </div>
                    </div>

                    <style jsx>{`
                        .reset-password-container {
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
                            background: linear-gradient(45deg, 
                                rgba(25, 28, 40, 0.7) 0%, 
                                rgba(40, 43, 60, 0.8) 20%, 
                                rgba(70, 75, 95, 0.8) 40%, 
                                rgba(20, 22, 35, 0.9) 60%, 
                                rgba(60, 65, 85, 0.8) 80%, 
                                rgba(15, 18, 30, 0.7) 100%);
                            animation: gradientShift 20s ease infinite;
                            z-index: 0;
                        }
                        
                        .background-gradient {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: radial-gradient(circle at center, rgba(100, 100, 110, 0.2) 0%, rgba(10, 10, 10, 0.9) 70%);
                            z-index: 1;
                        }

                        .error-card {
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

                        .error-icon {
                            font-size: 4rem;
                            color: #ff5555;
                            margin-bottom: 30px;
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

                        .action-buttons {
                            display: flex;
                            flex-direction: column;
                            gap: 15px;
                            margin-top: 30px;
                        }

                        .retry-button, .back-button {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                            padding: 12px 30px;
                            text-decoration: none;
                            border-radius: 5px;
                            transition: all 0.3s ease;
                            font-weight: 500;
                        }

                        .retry-button {
                            background: linear-gradient(135deg, #4a5380, #323b66);
                            color: white;
                        }

                        .retry-button:hover {
                            background: linear-gradient(135deg, #536094, #3a4475);
                            transform: translateY(-2px);
                            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                        }

                        .back-button {
                            background: transparent;
                            border: 2px solid #4a5380;
                            color: #4a5380;
                        }

                        .back-button:hover {
                            background: #4a5380;
                            color: white;
                        }

                        @keyframes gradientShift {
                            0%, 100% { transform: rotate(0deg) scale(1); }
                            50% { transform: rotate(180deg) scale(1.1); }
                        }

                        @media (max-width: 768px) {
                            .error-card {
                                padding: 30px 20px;
                                margin: 0 20px;
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
                <title>Đặt lại mật khẩu - Movie Streaming</title>
            </Head>
            <div className="reset-password-container">
                <div className="background-effect"></div>
                <div className="background-gradient"></div>
                  <Link href="/auth/login" legacyBehavior>
                    <a className="back-button-nav">
                        <FaArrowLeft /> Quay lại
                    </a>
                </Link>

                <div className="reset-password-card">
                    <h1>Đặt lại mật khẩu</h1>
                    <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className={`input-group ${newPassword ? 'active' : ''}`}>
                            <div className="input-icon">
                                <FaLock />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mật khẩu mới"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            <div className="input-line"></div>
                        </div>

                        <div className={`input-group ${confirmPassword ? 'active' : ''}`}>
                            <div className="input-icon">
                                <FaLock />
                            </div>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Xác nhận mật khẩu mới"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            <div className="input-line"></div>
                        </div>

                        <button 
                            type="submit" 
                            className="submit-button" 
                            disabled={isLoading || !newPassword || !confirmPassword}
                        >
                            {isLoading ? (
                                <>
                                    <FaSpinner className="spinner-icon" /> 
                                    Đang xử lý...
                                </>
                            ) : (
                                'Đặt lại mật khẩu'
                            )}
                        </button>
                    </form>                    <div className="auth-links">
                        <Link href="/auth/forgot-password" legacyBehavior>
                            <a>Gửi lại email đặt lại</a>
                        </Link>
                        <span> | </span>
                        <Link href="/auth/login" legacyBehavior>
                            <a>Quay lại đăng nhập</a>
                        </Link>
                    </div>
                </div>

                <style jsx>{`
                    .reset-password-container {
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
                        background: linear-gradient(45deg, 
                            rgba(25, 28, 40, 0.7) 0%, 
                            rgba(40, 43, 60, 0.8) 20%, 
                            rgba(70, 75, 95, 0.8) 40%, 
                            rgba(20, 22, 35, 0.9) 60%, 
                            rgba(60, 65, 85, 0.8) 80%, 
                            rgba(15, 18, 30, 0.7) 100%);
                        animation: gradientShift 20s ease infinite;
                        z-index: 0;
                    }
                    
                    .background-gradient {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(circle at center, rgba(100, 100, 110, 0.2) 0%, rgba(10, 10, 10, 0.9) 70%);
                        z-index: 1;
                    }

                    .back-button-nav {
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

                    .back-button-nav:hover {
                        background: rgba(65, 75, 110, 0.3);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                        transform: translateY(-2px);
                    }

                    .reset-password-card {
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

                    .password-toggle {
                        position: absolute;
                        right: 15px;
                        top: 50%;
                        transform: translateY(-50%);
                        background: none;
                        border: none;
                        color: rgba(255, 255, 255, 0.5);
                        cursor: pointer;
                        z-index: 3;
                        transition: color 0.3s ease;
                    }

                    .password-toggle:hover {
                        color: rgba(255, 255, 255, 0.8);
                    }

                    input {
                        width: 100%;
                        padding: 15px 45px 15px 45px;
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

                    input:disabled {
                        opacity: 0.7;
                        cursor: not-allowed;
                    }

                    input::placeholder {
                        color: rgba(255, 255, 255, 0.3);
                    }

                    .input-line {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 0;
                        height: 2px;
                        background: linear-gradient(90deg, #4a5380, #7b88c9, #4a5380);
                        transition: all 0.3s ease;
                    }

                    .input-group.active .input-line {
                        width: 100%;
                    }

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

                    .submit-button:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }

                    .submit-button:hover:not(:disabled) {
                        background: linear-gradient(135deg, #536094, #3a4475);
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    }

                    .spinner-icon {
                        animation: spin 1s linear infinite;
                    }

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

                    .auth-links a:hover {
                        color: #7b88c9;
                    }

                    @keyframes gradientShift {
                        0%, 100% { transform: rotate(0deg) scale(1); }
                        50% { transform: rotate(180deg) scale(1.1); }
                    }

                    @media (max-width: 768px) {
                        .reset-password-card {
                            padding: 30px 20px;
                            margin: 0 20px;
                        }
                        
                        .back-button-nav {
                            top: 20px;
                            left: 20px;
                        }
                    }
                `}</style>
            </div>
        </>
    );
}
