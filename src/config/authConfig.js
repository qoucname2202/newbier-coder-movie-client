/**
 * @file authConfig.js
 * @description Centralized configuration for authentication views, artwork assets,
 * API endpoint specifications, UI text labels, placeholders, and error messages.
 */

export const AUTH_CONFIG = {
  // Backend Authentication API endpoints & contracts
  api: {
    // Target endpoint matching: /api/v1/auth/login
    endpoint: (
      process.env.NEXT_PUBLIC_CORE_API_URL 
        ? `${process.env.NEXT_PUBLIC_CORE_API_URL.replace(/\/+$/, '')}/auth/login`
        : (process.env.NEXT_PUBLIC_API_URL
            ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')}/api/v1/auth/login`
            : 'http://localhost:5000/api/v1/auth/login')
    ),
    successCode: '000000',
    invalidCredentialsCode: '00000204',
  },

  // Artwork settings
  artwork: {
    defaultLoginImage: process.env.NEXT_PUBLIC_LOGIN_IMAGE || '/img/chantay.jpg',
    defaultRegisterImage: process.env.NEXT_PUBLIC_REGISTER_IMAGE || '/img/chantay.jpg',
    altText: 'Welcome Illustration',
  },

  // Backward compatibility aliases
  defaultLoginArtwork: process.env.NEXT_PUBLIC_LOGIN_IMAGE || '/img/chantay.jpg',
  artworkAlt: 'Welcome Illustration',

  // All UI text, copy, placeholders and error messages for Login
  login: {
    meta: {
      title: 'Welcome - Đăng nhập',
      description: 'Đăng nhập tài khoản của bạn',
    },
    navigation: {
      backHome: 'Trang chủ',
    },
    header: {
      title: 'Welcome',
      subtitle: 'We are glad to see you back with us',
    },
    placeholders: {
      username: 'Email hoặc Username',
      email: 'Email hoặc Username',
      password: 'Password',
    },
    accessibility: {
      showPassword: 'Hiện mật khẩu',
      hidePassword: 'Ẩn mật khẩu',
    },
    validation: {
      requiredFields: 'Vui lòng nhập tài khoản và mật khẩu',
      invalidEmail: 'Email hoặc Username không hợp lệ',
      invalidCredentials: 'Invalid credentials',
      wrongPassword: 'Invalid credentials',
      serverError: 'Không thể kết nối máy chủ',
    },
    notifications: {
      registeredSuccess: 'Đăng ký thành công! Vui lòng đăng nhập bằng tài khoản mới.',
      loginSuccess: 'Đăng nhập thành công! Đang chuyển hướng...',
    },
    buttons: {
      submit: 'SignIn',
      submitting: 'Processing...',
    },
    links: {
      forgotPassword: 'Forgot password?',
      signupNow: 'Signup Now',
    },
    divider: {
      boldText: 'SignIn',
      normalText: 'with Others',
    },
    social: {
      google: 'Đăng nhập bằng Google',
      facebook: 'Đăng nhập bằng Facebook',
      github: 'Đăng nhập bằng GitHub',
      linkedin: 'Đăng nhập bằng LinkedIn',
      googleFailed: 'Đăng nhập Google thất bại',
      googleConnectError: 'Không thể kết nối tới Google',
      facebookFailed: 'Đăng nhập Facebook thất bại',
      githubDisabled: 'Tính năng đăng nhập GitHub chưa được kích hoạt trên máy chủ.',
      githubUpdating: 'Tính năng đăng nhập GitHub đang được cập nhật',
      linkedinUpdating: 'Tính năng đăng nhập LinkedIn đang được hoàn thiện',
    },
  },
};

export default AUTH_CONFIG;
