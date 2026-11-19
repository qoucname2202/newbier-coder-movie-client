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
      requiredEmail: 'Vui lòng nhập email hoặc tên đăng nhập',
      requiredPassword: 'Vui lòng nhập mật khẩu',
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
      title: 'Đang kết nối hệ thống máy chủ',
      message:
        'Hệ thống đang khởi động các dịch vụ truyền phát. Quá trình này có thể mất vài giây, hệ thống sẽ tự động kết nối lại cho bạn.',
      retrying: 'Đang kết nối lại',
      attempts: 'Lần thử {0}',
      giveUp:
        'Máy chủ phản hồi chậm hoặc đang bảo trì định kỳ. Quý khách vui lòng thử kết nối lại hoặc quay lại sau ít phút.',
      button: 'Thử kết nối lại ngay'
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
