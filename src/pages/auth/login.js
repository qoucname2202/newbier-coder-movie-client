import { useState, useEffect } from 'react';
import Head from 'next/head';
import AuthForm from '../../components/Auth/AuthForm';
import { useRouter } from 'next/router';
import { useAuth } from '../../utils/auth';

// Thêm log chi tiết để debug
const logDetailedError = (error) => {
    console.group('=== DETAILED LOGIN ERROR ===');
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Kiểm tra nếu đây là lỗi từ fetch API
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error detected. API server might be down or URL is incorrect.');
        console.error('API_URL being used:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api');
    }
    
    // Kiểm tra nếu đây là lỗi từ JSON parsing
    if (error.message.includes('JSON')) {
        console.error('JSON parsing error. Server might be returning non-JSON response.');
    }
    console.groupEnd();
};

export default function Login() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [debugInfo, setDebugInfo] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    useEffect(() => {
        // Check if user came from signup page
        if (router.query.registered) {
            setMessage('Đăng ký thành công! Vui lòng đăng nhập bằng tài khoản mới.');
        }
    }, [router.query]);

    const handleLogin = async (credentials) => {
        try {
            setIsLoading(true);
            setError('');
            setMessage('');
            setDebugInfo('');

            // Validate input fields
            if (!credentials.email || !credentials.password) {
                setError('Email và mật khẩu là bắt buộc');
                setIsLoading(false);
                return;
            }

            // Email validation with regex
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(credentials.email)) {
                setError('Email không hợp lệ.');
                setIsLoading(false);
                return;
            }

            console.log("Attempting login with:", credentials);

            // Thử gọi API login
            try {
                // Call the login function from auth context
                const result = await login({
                    email: credentials.email,
                    password: credentials.password
                });

                console.log("Login result:", result);

                if (result.success) {
                    setMessage('Đăng nhập thành công! Đang chuyển hướng...');
                    // Redirect to home page after successful login
                    setTimeout(() => {
                        router.push('/');
                    }, 1000);
                } else {
                    setError(result.error || 'Đăng nhập thất bại');
                    setDebugInfo(result.debugInfo || '');
                }
            } catch (apiError) {
                // Xử lý lỗi khi gọi API
                console.error("API call error:", apiError);
                logDetailedError(apiError);
                
                if (apiError.message.includes('Failed to fetch')) {
                    setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và cài đặt API.');
                    setDebugInfo(`Backend server có thể chưa khởi động. Hãy đảm bảo server đang chạy ở ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`);
                } else if (apiError.message.includes('<!DOCTYPE') || apiError.message.includes('Unexpected token')) {
                    setError('Lỗi kết nối máy chủ: Máy chủ trả về HTML thay vì JSON.');
                    setDebugInfo(`API URL không chính xác hoặc server trả về trang lỗi. URL hiện tại: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`);
                } else {
                    setError(apiError.message || 'Đăng nhập thất bại');
                    setDebugInfo(`Lỗi: ${apiError.message}\nAPI URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}`);
                }
            }
        } catch (error) {
            console.error("Login error:", error);
            logDetailedError(error);
            setError(error.message || 'Đăng nhập thất bại');
            setDebugInfo(`Lỗi không xác định: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Đăng nhập - Netflix Clone</title>
                <meta name="description" content="Đăng nhập vào tài khoản Netflix Clone của bạn" />
            </Head>
            <AuthForm
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
                message={message}
                debugInfo={debugInfo}
                isSignup={false}
            />
        </>
    );
}