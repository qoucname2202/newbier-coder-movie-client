/**
 * authConfig.ts
 *
 * Central configuration for the authentication screens: artwork, API endpoint
 * contract, UI labels, placeholders and error messages.
 */

import { apiUrl } from './apiPaths';

export const AUTH_CONFIG = {
  // The endpoint and the contract used by the backend authentication.
  api: {
    endpoint: apiUrl('authLogin'),
    successCode: '000000',
    invalidCredentialsCode: '00000204'
  },

  // Artwork configuration.
  artwork: {
    defaultLoginImage: process.env.NEXT_PUBLIC_LOGIN_IMAGE || '/img/chantay.jpg',
    defaultRegisterImage: process.env.NEXT_PUBLIC_REGISTER_IMAGE || '/img/chantay.jpg',
    altText: 'Welcome Illustration'
  },

  // Backwards compatible aliases.
  defaultLoginArtwork: process.env.NEXT_PUBLIC_LOGIN_IMAGE || '/img/chantay.jpg',
  artworkAlt: 'Welcome Illustration',

  // All the text, copy, placeholders and error messages of the Login screen.
  login: {
    meta: {
      title: 'Welcome - Đăng nhập',
      description: 'Đăng nhập tài khoản của bạn'
    },
    navigation: {
      backHome: 'Trang chủ'
    },
    header: {
      title: 'Welcome',
      subtitle: 'We are glad to see you back with us'
    },
    placeholders: {
      username: 'Email hoặc Username',
      email: 'Email hoặc Username',
      password: 'Password'
    },
    accessibility: {
      showPassword: 'Hiện mật khẩu',
      hidePassword: 'Ẩn mật khẩu'
    },
    validation: {
      requiredFields: 'Vui lòng nhập tài khoản và mật khẩu',
      invalidEmail: 'Email hoặc Username không hợp lệ',
      invalidCredentials: 'Invalid credentials',
      wrongPassword: 'Invalid credentials',
      serverError: 'Không thể kết nối máy chủ'
    },
    notifications: {
      registeredSuccess: 'Đăng ký thành công! Vui lòng đăng nhập bằng tài khoản mới.',
      loginSuccess: 'Đăng nhập thành công! Đang chuyển hướng...'
    },
    serverStarting: {
      title: 'Server is starting up',
      message:
        'The server is not ready yet. Please wait a moment, the system will retry automatically.',
      retrying: 'Retrying...',
      attempts: 'Attempt {0}',
      giveUp:
        'The server is still not responding. Please try again in a few minutes or check your network connection.',
      button: 'Retry now'
    },
    buttons: {
      submit: 'SignIn',
      submitting: 'Processing...'
    },
    remember: {
      label: 'Ghi nhớ đăng nhập',
      ariaLabel: 'Ghi nhớ đăng nhập trên thiết bị này'
    },
    links: {
      forgotPassword: 'Forgot password?',
      signupNow: 'Signup Now'
    },
    divider: {
      boldText: 'SignIn',
      normalText: 'with Others'
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
      linkedinUpdating: 'Tính năng đăng nhập LinkedIn đang được hoàn thiện'
    }
  }
} as const;

export default AUTH_CONFIG;
