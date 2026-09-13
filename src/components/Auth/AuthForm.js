import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaGoogle, FaFacebook, FaHome, FaUser, FaEnvelope, FaLock, FaSpinner, FaMapMarkerAlt, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { signInWithFacebook } from '../../utils/firebase';
import axios from 'axios';

export default function AuthForm({ onSubmit, isLoading, error, message, isSignup = false }) {
    const router = useRouter();
    const [isAnimating, setIsAnimating] = useState(false);
    const [formFields, setFormFields] = useState({
        email: '',
        password: '',
        retype_password: '',
        fullname: '',
        address: '',
        phone: '',
        date_of_birth: ''
    });
    const [socialLoading, setSocialLoading] = useState({
        google: false,
        facebook: false
    });
    const [focusedField, setFocusedField] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSwitchAuth = (e) => {
        e.preventDefault();
        setIsAnimating(true);
        const path = isSignup ? '/auth/login' : '/auth/signup';
        
        setTimeout(() => {
            router.push(path);
        }, 300);

        setTimeout(() => {
            setIsAnimating(false);
        }, 600);
    };

    const handleHomeClick = () => {
        router.push('/');
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormFields({
            ...formFields,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(formFields);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setSocialLoading({ ...socialLoading, google: true });
            const result = await signIn('google', { 
                callbackUrl: '/',
                redirect: false 
            });
            
            if (result?.error) {
                console.error("Google sign-in error:", result.error);
                alert(`Đăng nhập Google thất bại: ${result.error}`);
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            alert(`Đăng nhập Google thất bại: ${error.message}`);
        } finally {
            setSocialLoading({ ...socialLoading, google: false });
        }
    };

    const handleFacebookSignIn = async () => {
        try {
            setSocialLoading({ ...socialLoading, facebook: true });
            
            // Sử dụng Firebase để đăng nhập Facebook thay vì NextAuth
            const result = await signInWithFacebook();
            
            if (result.success) {
                // Gửi thông tin từ Firebase lên backend của bạn
                const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/facebook-login`, {
                    email: result.user.email || `${result.user.uid}@facebook.com`, // Đảm bảo luôn có email
                    name: result.user.displayName,
                    facebookId: result.user.uid,
                    picture: result.user.photoURL
                });
                
                if (response.data && response.data.token) {
                    // Lưu token và thông tin người dùng vào localStorage
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    
                    // Kích hoạt sự kiện storage để AuthProvider cập nhật trạng thái
                    window.dispatchEvent(new Event('storage'));
                    
                    // Đảm bảo token được thêm vào header của axios cho các request tiếp theo
                    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
                    
                    // Chuyển hướng người dùng sau khi đăng nhập thành công
                    router.push('/');
                } else {
                    alert(`Đăng nhập Facebook thất bại: ${response.data?.error || 'Lỗi không xác định'}`);
                }
            } else {
                console.error("Facebook sign-in error:", result.error);
                alert(`Đăng nhập Facebook thất bại: ${result.error}`);
            }
        } catch (error) {
            console.error('Facebook sign in error:', error);
            alert(`Đăng nhập Facebook thất bại: ${error.message}`);
        } finally {
            setSocialLoading({ ...socialLoading, facebook: false });
        }
    };

    const authBoxClass = `auth-box ${isAnimating ? 'animating' : ''} ${isSignup ? 'signup' : 'login'}`;    return (
        <div className="auth-container">
            <div className="background-image"></div>
            <div className="background-effect"></div>
            <div className="background-gradient"></div>
            <div className="floating-particles">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className={`particle particle-${i + 1}`}></div>
                ))}
            </div>
            
            <button className="home-button" onClick={handleHomeClick}>
                <FaHome /> Home
            </button>
            
            <div className={authBoxClass}>
                <div className="form-container">
                    <div className="form-section">
                        <h2>{isSignup ? 'Sign up' : 'Login'}<span className="accent-dot">.</span></h2>
                        
                        {error && <div className="error-message">{error}</div>}
                        {message && <div className="success-message">{message}</div>}
                        
                        <form onSubmit={handleSubmit}>
                            {isSignup && (
                                <div className={`input-group ${focusedField === 'fullname' || formFields.fullname ? 'active' : ''}`}>
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
                                    <div className="input-line"></div>
                                </div>
                            )}
                            
                            <div className={`input-group ${focusedField === 'email' || formFields.email ? 'active' : ''}`}>
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
                                <div className="input-line"></div>
                            </div>
                            
                            <div className={`input-group ${focusedField === 'password' || formFields.password ? 'active' : ''}`}>
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
                                <div className="input-line"></div>
                            </div>
                            
                            {isSignup && (
                                <>
                                    <div className={`input-group ${focusedField === 'retype_password' || formFields.retype_password ? 'active' : ''}`}>
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
                                        <div className="input-line"></div>
                                    </div>
                                    <div className={`input-group ${focusedField === 'address' || formFields.address ? 'active' : ''}`}>
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
                                        <div className="input-line"></div>
                                    </div>
                                    <div className={`input-group ${focusedField === 'phone' || formFields.phone ? 'active' : ''}`}>
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
                                        <div className="input-line"></div>
                                    </div>
                                    <div className={`input-group ${focusedField === 'date_of_birth' || formFields.date_of_birth ? 'active' : ''}`}>
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
                                        <div className="input-line"></div>
                                    </div>
                                </>
                            )}
                            
                            <button className="auth-button" type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <><FaSpinner className="spinner-icon" /> Processing...</>
                                ) : (
                                    isSignup ? 'Create Account' : 'Sign In'
                                )}
                                <span className="button-effect"></span>
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
                                            <><FaSpinner className="spinner-icon" /> Connecting with Google...</>
                                        ) : (
                                            <><FaGoogle /> Continue with Google</>
                                        )}
                                    </button>
                                    <button 
                                        className="social-button facebook" 
                                        type="button" 
                                        onClick={handleFacebookSignIn}
                                        disabled={isLoading || socialLoading.facebook}
                                    >
                                        {socialLoading.facebook ? (
                                            <><FaSpinner className="spinner-icon" /> Connecting with Facebook...</>
                                        ) : (
                                            <><FaFacebook /> Continue with Facebook</>
                                        )}
                                    </button>
                                </div>                            )}
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
                        <p>{isSignup 
                            ? 'Create an account to start enjoying unlimited streaming.' 
                            : 'Sign in to access your favorite movies and TV shows.'}</p>
                        <button className="switch-button" onClick={handleSwitchAuth}>
                            {isSignup ? 'Sign in' : 'Sign up'}
                        </button>
                    </div>
                </div>
            </div>
            
            <style jsx>{`                .auth-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #0d111f;
                    padding: 20px;
                    perspective: 1000px;
                    position: relative;
                    overflow: hidden;
                }                  .background-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: url('/img/background/movies-wall.jpg') center/cover no-repeat;
                    opacity: 0.75; /* Tăng độ rõ lên cao hơn */
                    z-index: 0;
                    filter: blur(1px); /* Giảm độ mờ hơn nữa */
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
                    background: linear-gradient(45deg, 
                        rgba(15, 18, 30, 0.7) 0%, 
                        rgba(30, 33, 50, 0.8) 20%, 
                        rgba(45, 50, 70, 0.8) 40%, 
                        rgba(12, 15, 25, 0.9) 60%, 
                        rgba(40, 45, 65, 0.8) 80%, 
                        rgba(10, 12, 22, 0.7) 100%);
                    animation: gradientShift 30s ease infinite;
                    z-index: 1;
                }
                  .background-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at 30% 30%, 
                        rgba(60, 65, 80, 0.4) 0%, 
                        rgba(40, 45, 55, 0.35) 20%, 
                        rgba(10, 10, 20, 0.7) 70%);
                    z-index: 2;
                }
                
                .background-gradient::after {
                    content: "";
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
                    0% {
                        transform: translateY(0) translateX(0) scale(1);
                        opacity: 0;
                    }
                    5% {
                        opacity: 0.8;
                    }
                    95% {
                        opacity: 0.5;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(20px) scale(0.2);
                        opacity: 0;
                    }
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
                  /* Thêm một số ánh sáng từ góc màn hình */
                .auth-container::before {
                    content: '';
                    position: absolute;
                    top: -30%;
                    left: -30%;
                    width: 80%;
                    height: 80%;
                    background: radial-gradient(circle at center, rgba(100, 110, 130, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
                    filter: blur(20px);
                    animation: lightPulse 10s infinite alternate ease-in-out;
                    z-index: 2;
                }
                
                .auth-container::after {
                    content: '';
                    position: absolute;
                    bottom: -30%;
                    right: -30%;
                    width: 80%;
                    height: 80%;
                    background: radial-gradient(circle at center, rgba(90, 100, 120, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
                    filter: blur(20px);
                    animation: lightPulse 8s infinite alternate-reverse ease-in-out;
                    z-index: 2;
                }
                
                @keyframes lightPulse {
                    0% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                    100% { opacity: 0.5; transform: scale(1); }
                }

                @keyframes lightMove {
                    0% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(25%) rotate(180deg); }
                    100% { transform: translateY(0) rotate(360deg); }
                }

                @keyframes gradientShift {
                    0% { transform: rotate(0deg); }
                    50% { transform: rotate(180deg); }
                    100% { transform: rotate(360deg); }
                }                .auth-box {
                    display: flex;
                    width: 900px;
                    height: ${mounted ? (isSignup ? '750px' : '600px') : 'auto'};
                    background: rgba(26, 26, 26, 0.65); /* Giảm độ đậm của nền để mờ hơn */
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5),
                                0 0 40px rgba(150, 150, 160, 0.1);
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 10;
                    backdrop-filter: blur(8px); /* Điều chỉnh độ mờ filter */
                    border: 1px solid rgba(255, 255, 255, 0.08); /* Tăng độ sáng của viền */
                    animation: glow 8s infinite alternate ease-in-out;
                }
                  @keyframes glow {
                    0% { box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 40px rgba(150, 150, 160, 0.1); }
                    50% { box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 60px rgba(100, 110, 140, 0.2); }
                    100% { box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 40px rgba(80, 95, 115, 0.2); }
                }

                .form-container {
                    position: absolute;
                    width: 45%;
                    height: 100%;
                    left: 0;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    overflow-y: auto;
                }                .welcome-section {
                    position: absolute;
                    width: 55%;
                    height: 100%;
                    right: 0;
                    background: linear-gradient(135deg, #252525, #1a1a1a);
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                
                .welcome-section:before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at center, 
                        rgba(120, 120, 130, 0.15) 0%, 
                        rgba(30, 30, 35, 0.05) 30%, 
                        rgba(30, 30, 30, 0) 70%);
                    animation: pulseLight 10s ease-in-out infinite;
                }
                
                .welcome-section:after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: repeating-linear-gradient(
                        45deg,
                        rgba(255, 255, 255, 0.01) 0px,
                        rgba(255, 255, 255, 0.02) 2px,
                        rgba(255, 255, 255, 0) 2px,
                        rgba(255, 255, 255, 0) 4px
                    );
                    opacity: 0.5;
                    animation: shiftPattern 20s linear infinite;
                }
                
                @keyframes shiftPattern {
                    0% { background-position: 0 0; }
                    100% { background-position: 50px 50px; }
                }

                @keyframes pulseLight {
                    0% { opacity: 0.3; transform: scale(1) rotate(0deg); }
                    50% { opacity: 0.5; transform: scale(1.1) rotate(180deg); }
                    100% { opacity: 0.3; transform: scale(1) rotate(360deg); }
                }

                .welcome-content {
                    padding: 50px;
                    color: #e0e0e0;
                    position: relative;
                    z-index: 2;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: center;
                }
                  .welcome-content h1 {
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
                    animation: titlePulse 3s infinite alternate;
                    background: linear-gradient(90deg, #ffffff, #b0b0ff, #ffffff);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shine 3s linear infinite;
                }
                
                @keyframes shine {
                    to {
                        background-position: 200% center;
                    }
                }
                
                @keyframes titlePulse {
                    0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.1); }
                    100% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.3); }
                }

                .auth-box.signup .form-container {
                    transform: translateX(122%);
                }

                .auth-box.signup .welcome-section {
                    transform: translateX(-81.8%);
                }

                .form-section {
                    padding: 50px;
                    opacity: 1;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    background: linear-gradient(to bottom, 
                        rgba(40, 40, 40, 0.2),
                        rgba(20, 20, 20, 0.1)
                    );
                }

                .auth-box.animating {
                    transform: scale(0.97) rotate3d(1, 1, 0, 3deg);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                }

                .welcome-section {
                    clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
                }

                .auth-box.signup .welcome-section {
                    clip-path: polygon(0 0, 85% 0, 100% 100%, 15% 100%);
                }

                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 20px;
                    font-weight: 300;
                    letter-spacing: 1px;
                    color: #fff;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                }

                h2 {
                    color: #e0e0e0;
                    font-size: 2rem;
                    margin-bottom: 30px;
                    font-weight: 300;
                    position: relative;
                    display: inline-block;
                }

                .accent-dot {
                    color: #b0b0b0;
                    position: relative;
                    font-size: 2.5rem;
                    line-height: 0;
                    vertical-align: text-top;
                }

                .input-group {
                    margin-bottom: 25px;
                    position: relative;
                    transition: all 0.3s ease;
                }

                .input-icon {
                    position: absolute;
                    left: 12px;
                    top: 14px;
                    color: #555;
                    transition: all 0.3s ease;
                }

                .input-group.active .input-icon {
                    color: #b0b0b0;
                    animation: iconPulse 1s ease;
                }
                
                @keyframes iconPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }

                input {
                    width: 100%;
                    padding: 12px 12px 12px 40px;
                    background: rgba(255, 255, 255, 0.03);
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
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1), 
                                inset 0 1px 3px rgba(0, 0, 0, 0.1);
                    outline: none;
                }

                input:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .input-line {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: linear-gradient(90deg, #4a5380, #7b88c9, #4a5380);
                    transition: all 0.3s ease;
                    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
                }

                .input-group.active .input-line {
                    width: 100%;
                    animation: lineGrow 0.5s ease-out;
                }
                
                @keyframes lineGrow {
                    0% { width: 0; opacity: 0.3; }
                    100% { width: 100%; opacity: 1; }
                }

                input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }                .auth-button {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #4a5380, #323b66);
                    border: none;
                    border-radius: 5px;
                    color: #fff;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-bottom: 20px;
                    position: relative;
                    overflow: hidden;
                    letter-spacing: 0.5px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), 
                               0 0 15px rgba(74, 83, 128, 0.15);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-size: 200% 100%;
                    animation: gradientMove 3s ease infinite;
                }
                
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .auth-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .spinner-icon {
                    animation: spin 1s linear infinite;
                    margin-right: 8px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .button-effect {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0;
                    transition: all 0.6s ease;
                }

                .auth-button:hover:not(:disabled) {
                    background: linear-gradient(135deg, #536094, #3a4475);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3), 
                                0 0 10px rgba(99, 123, 213, 0.2);
                    transform: translateY(-2px);
                }

                .auth-button:hover:not(:disabled) .button-effect {
                    width: 300%;
                    height: 300%;
                    opacity: 1;
                }

                .auth-button:active:not(:disabled) {
                    transform: translateY(0);
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
                }

                .social-login {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 25px;
                }

                .social-button {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 5px;
                    font-size: 15px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.03);
                    color: #ddd;
                }

                .social-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .social-button:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.08);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                }

                .google svg, .facebook svg {
                    font-size: 18px;
                    filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.5));
                }

                .google {
                    background: rgba(179, 0, 0, 0.49);
                }                .facebook {
                    background: rgba(4, 71, 186, 0.65);
                }

                .forgot-password-link {
                    margin-top: 15px;
                    text-align: center;
                }

                .forgot-password-link a {
                    color: #b0b0b0;
                    text-decoration: none;
                    font-size: 14px;
                    cursor: pointer;
                    position: relative;
                    padding-bottom: 2px;
                    transition: color 0.3s ease;
                }

                .forgot-password-link a:hover {
                    color: #fff;
                }

                .forgot-password-link a:after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 1px;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    background: linear-gradient(90deg, transparent, #b0b0b0, transparent);
                    transition: width 0.3s ease;
                }

                .forgot-password-link a:hover:after {
                    width: 100%;
                }

                .switch-auth {
                    margin-top: 25px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.5);
                    font-size: 14px;
                }

                .switch-auth a {
                    color: #b0b0b0;
                    text-decoration: none;
                    cursor: pointer;
                    position: relative;
                    padding-bottom: 2px;
                }

                .switch-auth a:after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 1px;
                    bottom: 0;
                    left: 0;
                    background: linear-gradient(90deg, transparent, #b0b0b0, transparent);
                    transition: width 0.3s ease;
                }

                .switch-auth a:hover:after {
                    width: 100%;
                }

                .switch-button {
                    padding: 12px 30px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 50px;
                    color: #fff;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 30px;
                    backdrop-filter: blur(5px);
                    position: relative;
                    overflow: hidden;
                }
                
                .switch-button:before {
                    content: "";
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 80%);
                    opacity: 0;
                    transition: opacity 0.5s ease;
                }

                .switch-button:hover {
                    background: rgba(65, 75, 110, 0.3);
                    border-color: rgba(123, 136, 201, 0.4);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2),
                                0 0 15px rgba(99, 123, 213, 0.2);
                    transform: translateY(-2px);
                }
                
                .switch-button:hover:before {
                    opacity: 1;
                    animation: rotateGradient 4s linear infinite;
                }
                
                @keyframes rotateGradient {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .home-button {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    background: rgba(45, 52, 75, 0.2);
                    border: 1px solid rgba(78, 89, 131, 0.2);
                    border-radius: 5px;
                    color: #e2e8ff;
                    font-size: 15px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    z-index: 100;
                    backdrop-filter: blur(5px);
                }

                .home-button:hover {
                    background: rgba(65, 75, 110, 0.3);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2),
                                0 0 10px rgba(99, 123, 213, 0.15);
                    transform: translateY(-2px);
                }

                .home-button svg {
                    font-size: 16px;
                    color: #7b88c9;
                    animation: homeIconFloat 2s ease-in-out infinite;
                }

                @keyframes homeIconFloat {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-2px); }
                    100% { transform: translateY(0); }
                }

                .error-message {
                    color: #ff5555;
                    text-align: center;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(255, 0, 0, 0.08);
                    border-radius: 5px;
                    border-left: 3px solid #ff5555;
                    font-size: 14px;
                }
                
                .success-message {
                    color: #4CD964;
                    text-align: center;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(76, 217, 100, 0.08);
                    border-radius: 5px;
                    border-left: 3px solid #4CD964;
                    font-size: 14px;
                }

                @media (max-width: 768px) {
                    .auth-box {
                        flex-direction: column;
                        height: auto;
                        width: 90%;
                    }

                    .form-container,
                    .welcome-section {
                        position: relative;
                        width: 100%;
                    }

                    .welcome-section {
                        min-height: 220px;
                        clip-path: none;
                    }

                    .auth-box.signup .form-container,
                    .auth-box.signup .welcome-section {
                        transform: none;
                    }

                    .welcome-content {
                        padding: 30px 20px;
                    }

                    .form-section {
                        padding: 30px 20px;
                    }
                }
            `}</style>
        </div>
    );
}
