// Cấu hình Firebase Authentication
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Khởi tạo Firebase App một cách an toàn
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Cấu hình nâng cao cho Facebook Provider
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// Thêm các tham số tùy chỉnh để khắc phục lỗi auth/configuration-not-found
facebookProvider.setCustomParameters({
  'display': 'popup',
  'auth_type': 'rerequest',
  'return_scopes': 'true',
  // Sử dụng localhost cho development
  'redirect_uri': 'http://localhost:3000/__/auth/handler'
});

// Hàm đăng nhập bằng Facebook
export const signInWithFacebook = async () => {
  try {
    console.log('Attempting Facebook login with Firebase...');
    console.log('Firebase config:', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + '...',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      // Hiding sensitive info
    });
    
    // Thêm log cho Facebook Provider
    console.log('Facebook provider scopes:', facebookProvider.scopes);
    
    const result = await signInWithPopup(auth, facebookProvider);
    
    // Lấy thông tin người dùng từ Facebook
    const user = result.user;
    const credential = FacebookAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;
    
    console.log('Facebook login successful:', {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      // Not logging token for security
    });
    
    // Thông tin người dùng Facebook
    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      accessToken,
      providerId: 'facebook.com'
    };
    
    return { user: userData, success: true };
  } catch (error) {
    console.error('Firebase Facebook login error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Chi tiết lỗi cho các lỗi phổ biến
    if (error.code === 'auth/configuration-not-found') {
      console.error('HINT: Cấu hình Facebook chưa được bật trong Firebase Authentication console hoặc URL chuyển hướng không đúng');
      console.error('Kiểm tra: 1) Firebase Auth console có bật Facebook provider không');
      console.error('Kiểm tra: 2) Facebook Developer Console có thêm URL chuyển hướng đúng không');
      console.error('Kiểm tra: 3) Facebook App có được set là Live mode không');
    } else if (error.code === 'auth/popup-blocked') {
      console.error('HINT: Popup bị chặn bởi trình duyệt');
    }
    
    return { error: error.message, success: false, code: error.code };
  }
};

// Đăng xuất
export const signOutFirebase = async () => {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    return { error: error.message, success: false };
  }
};

export { auth };