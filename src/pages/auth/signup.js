import { useState } from 'react';
import Head from 'next/head';
import AuthForm from '../../components/Auth/AuthForm';
import { useRouter } from 'next/router';
import { useAuth } from '../../utils/auth';

export default function Signup() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const { register } = useAuth();

    const handleSignup = async (credentials) => {
        try {
            setIsLoading(true);
            setError('');
            setMessage('');

            // Validate input fields
            if (!credentials.fullname || !credentials.email || !credentials.password || !credentials.retype_password) {
                setError('Họ tên, email, và mật khẩu là bắt buộc.');
                setIsLoading(false);
                return;
            }

            if (credentials.password !== credentials.retype_password) {
                setError('Mật khẩu không khớp.');
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

            // Password validation - at least 6 characters
            if (credentials.password.length < 6) {
                setError('Mật khẩu phải có ít nhất 6 ký tự.');
                setIsLoading(false);
                return;
            }

            console.log("Attempting registration with credentials:", credentials);

            // Format the user data for the backend
            const userData = {
                fullname: credentials.fullname,
                email: credentials.email,
                password: credentials.password,
                retype_password: credentials.retype_password,
                address: credentials.address || '',
                phone: credentials.phone || '',
                date_of_birth: credentials.date_of_birth || ''
            };

            console.log("Formatted user data:", userData);

            try {
                // Call the registration function from auth context
                const result = await register(userData);

                console.log("Registration result:", result);

                if (result.success) {
                    setMessage('Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...');
                    // Registration successful - redirect to login
                    setTimeout(() => {
                        router.push('/auth/login?registered=true');
                    }, 1500);
                } else {
                    setError(result.error || 'Đăng ký thất bại. Vui lòng thử lại.');
                }
            } catch (apiError) {
                // Xử lý lỗi khi gọi API
                console.error("API call error:", apiError);
                
                if (apiError.message.includes('Failed to fetch')) {
                    setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và cài đặt API.');
                } else if (apiError.message.includes('<!DOCTYPE') || apiError.message.includes('Unexpected token')) {
                    setError('Lỗi kết nối máy chủ: Máy chủ trả về HTML thay vì JSON. Vui lòng kiểm tra URL API.');
                } else if (apiError.message.includes('API URL')) {
                    setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại cấu hình API.');
                } else if (apiError.message.includes('Email already exists') || apiError.message.includes('đã tồn tại')) {
                    setError('Email đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.');
                } else {
                    setError(apiError.message || 'Đăng ký thất bại. Vui lòng thử lại.');
                }
            }
        } catch (err) {
            console.error('Signup error:', err);
            setError('Lỗi đăng ký: ' + (err.message || 'Đã xảy ra lỗi không xác định'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <title>Đăng ký - Movie Streaming</title>
            </Head>
            <AuthForm 
                onSubmit={handleSignup} 
                isLoading={isLoading} 
                error={error}
                message={message}
                isSignup={true}
            />
        </>
    );
}
