import api from '../config/axiosConfig.js'; // Nhập instance axios đã cấu hình

// Service xử lý các API liên quan đến đăng ký
const subscriptionService = {
  // Lấy danh sách các gói đăng ký có sẵn
  getAllPackages: async () => {
    try {
      const response = await api.get('/subscription/packages');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subscription packages:', error);
      throw error;
    }
  },  // Đã xóa phương thức getUserAdBenefits trùng lặp - sử dụng phương thức có ghi log cải tiến ở dưới

  // Lấy chi tiết một gói đăng ký
  getPackageById: async (packageId) => {
    try {
      const response = await api.get(`/subscription/packages/${packageId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching package details:', error);
      throw error;
    }
  },  // Đăng ký gói premium - chuyển sang cơ chế duyệt bởi admin
  subscribePackage: async (data) => {
    try {
      console.log('Sending subscription data:', data);
      
      // Đảm bảo dữ liệu có đầy đủ các trường bắt buộc
      const subscriptionData = {
        packageId: data.packageId,
        paymentMethod: data.paymentMethod || 'bank_transfer'
        // Loại bỏ các trường không cần thiết có thể gây lỗi
      };
      
      const response = await api.post('/subscription/subscribe', subscriptionData);
      console.log('Subscribe API response:', response.data);
      
      // Đảm bảo luôn có trường success trong response để frontend xử lý thống nhất
      const formattedResponse = {
        ...response.data,
        success: true,  // Luôn đánh dấu là thành công nếu không có lỗi
        _originalSuccess: response.data.success, // Lưu giá trị success gốc
        _formatted: true // Đánh dấu là đã qua xử lý
      };
      
      return formattedResponse;
    } catch (error) {
      console.error('Error subscribing package:', error);
      
      // Kiểm tra xem lỗi có chứa dữ liệu hữu ích không
      if (error.response && error.response.status === 200 && error.response.data) {
        console.log("Phát hiện response thành công trong lỗi, trả về như thành công");
        return {
          ...error.response.data,
          success: true,
          _errorButSuccess: true,
          _formatted: true
        };
      }
      
      // Trả về một phản hồi lỗi đã định dạng để xử lý frontend tốt hơn
      return {
        success: false,
        message: error.response?.data?.error || 'Có lỗi xảy ra khi đăng ký gói',
        details: error.response?.data?.details || [],
        error: error.message
      };
    }
  },

  // Xác nhận thanh toán
  confirmPayment: async (paymentId) => {
    try {
      console.log('Calling confirmPayment API with paymentId:', paymentId);
      const response = await api.post('/subscription/confirm-payment', { paymentId });
      console.log('confirmPayment API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      console.error('Error details:', error.response?.data);
      
      // Ngay cả trong trường hợp lỗi, trả về một đối tượng phản hồi phù hợp
      // Điều này giúp frontend tiếp tục luồng xử lý
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xác nhận thanh toán, nhưng đăng ký đã được tạo.',
        error: error.response?.data
      };
    }
  },

  // Hủy đăng ký gói premium
  cancelSubscription: async () => {
    try {
      const response = await api.post('/subscription/cancel');
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },  // Lấy thông tin đăng ký hiện tại - sử dụng phương thức tối ưu truy vấn trực tiếp bằng userId và isActive
  getCurrentSubscription: async () => {
    try {
      console.log('Fetching current active subscription...');
      const response = await api.get('/subscription/current');
      console.log('Current subscription API response:', response.data);
      
      // Trả về dữ liệu đã được chuẩn hóa để frontend có thể sử dụng dễ dàng
      return {
        hasActiveSubscription: response.data.data?.hasActiveSubscription || false,
        subscription: response.data.data?.subscription || null,
        daysLeft: response.data.data?.daysLeft || 0,
        isExpired: response.data.data?.isExpired || false
      };
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      // Trả về dữ liệu mặc định trong trường hợp lỗi để không làm gián đoạn UI
      return {
        hasActiveSubscription: false,
        subscription: null,
        daysLeft: 0,
        isExpired: false
      };
    }  },
    // Lấy thông tin về quyền lợi ẩn quảng cáo dựa trên gói đăng ký của người dùng
  getUserAdBenefits: async () => {
    try {
      // Lấy token trước để kiểm tra trạng thái xác thực
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');
      
      console.log('%c[AdBenefits] Fetching user ad benefits based on subscription...', 'color: #4CAF50; font-weight: bold');
      console.log('%c[AdBenefits] Authentication status:', 'color: #4CAF50; font-weight: bold', token ? 'Authenticated' : 'Not authenticated');
      
      if (!token) {
        console.log('%c[AdBenefits] No authentication token found, skipping API call', 'color: #FFA500; font-weight: bold');
        return {
          hideHomepageAds: false,
          hideVideoAds: false,
          packageType: null,
          hasActiveSubscription: false,
          authError: true
        };
      }
      
      // Thực hiện lệnh gọi API với header phù hợp
      const response = await api.get('/subscription/ad-benefits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('%c[AdBenefits] API response:', 'color: #4CAF50; font-weight: bold', response.data);      
      // Phát hiện gói Premium 15k (682f7d849c310399aa715c9d)
      const isPremiumPackage = response.data.data?.packageType === '682f7d849c310399aa715c9d';
      
      if (isPremiumPackage) {
        console.log('%c[AdBenefits] GOI 15K PREMIUM DETECTED! Hiding all ads.', 'color: #FF0000; font-weight: bold; font-size: 16px;');
      }
      
      // Trả về quyền lợi quảng cáo từ API hoặc giá trị mặc định nếu không có
      return {
        hideHomepageAds: response.data.data?.hideHomepageAds || isPremiumPackage || false,
        hideVideoAds: response.data.data?.hideVideoAds || isPremiumPackage || false,
        packageType: response.data.data?.packageType || null,
        hasActiveSubscription: response.data.data?.hasActiveSubscription || false,
        isPremium15k: isPremiumPackage
      };
    } catch (error) {
      console.error('%c[AdBenefits] Error fetching ad benefits:', 'color: #FF0000; font-weight: bold', error);
      
      // Kiểm tra xem đó có phải là lỗi xác thực không
      const isAuthError = error.response && (error.response.status === 401 || error.response.status === 403);
      if (isAuthError) {
        console.warn('%c[AdBenefits] Authentication error detected', 'color: #FF9800; font-weight: bold');
      }
      
      // Giá trị mặc định trong trường hợp lỗi
      return {
        hideHomepageAds: false,
        hideVideoAds: false,
        packageType: null,
        hasActiveSubscription: false,
        authError: isAuthError
      };
    }
  },

  // Lấy lịch sử đăng ký
  getSubscriptionHistory: async () => {
    try {
      const response = await api.get('/subscription/history');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw error;
    }
  },

  // Cập nhật tự động gia hạn
  updateAutoRenewal: async (autoRenewal) => {
    try {
      const response = await api.put('/subscription/auto-renewal', { autoRenewal });
      return response.data;
    } catch (error) {
      console.error('Error updating auto renewal:', error);
      throw error;
    }
  },

  // Lấy trạng thái đăng ký chờ duyệt
  getPendingSubscription: async () => {
    try {
      const response = await api.get('/subscription/pending');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pending subscription:', error);
      throw error;
    }
  },

  // PHƯƠNG THỨC ADMIN
  // [Admin] Lấy danh sách đăng ký đang chờ duyệt
  getAdminPendingSubscriptions: async () => {
    try {
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();
      console.log('Fetching pending subscriptions for admin...');
      
      // Sử dụng truy vấn trực tiếp thay vì qua instance axios được cấu hình
      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No authentication token found');
        return {
          pendingSubscriptions: [],
          pagination: { page: 1, pages: 1, total: 0 }
        };
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      // Thử gọi trực tiếp để debug
      const response = await fetch(`${baseUrl}/subscription/admin/pending-subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('Admin pending subscriptions API response:', responseData);
      
      if (responseData.success) {
        // Cấu trúc data có thể khác nhau, xử lý linh hoạt
        let subscriptionsData = [];
        
        if (responseData.data && responseData.data.subscriptions) {
          subscriptionsData = responseData.data.subscriptions;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          subscriptionsData = responseData.data;
        } else if (Array.isArray(responseData.subscriptions)) {
          subscriptionsData = responseData.subscriptions;
        }
        
        console.log(`Found ${subscriptionsData.length} pending subscriptions`);
        console.log('Subscriptions data:', subscriptionsData);
        
        return {
          success: true,
          pendingSubscriptions: subscriptionsData,
          pagination: responseData.data?.pagination || { page: 1, pages: 1, total: subscriptionsData.length }
        };
      } else {
        console.error('API returned success: false');
        return {
          success: false,
          message: responseData.message || 'Failed to fetch pending subscriptions',
          pendingSubscriptions: [],
          pagination: { page: 1, pages: 1, total: 0 }
        };
      }
    } catch (error) {
      console.error('Error fetching pending subscriptions for admin:', error);
      console.error('Error details:', error.response?.data || error.message);
      return {
        success: false,
        message: error.message || 'Unknown error occurred',
        pendingSubscriptions: [],
        pagination: { page: 1, pages: 1, total: 0 }
      };
    }
  },

  // [Admin] Lấy số lượng đăng ký đang chờ duyệt - dùng cho huy hiệu thông báo
  getAdminPendingSubscriptionsCount: async () => {
    try {
      // Sử dụng token trực tiếp để tránh vấn đề với instance axios
      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      
      if (!token) {
        console.error('No authentication token found');
        return 0;
      }
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseUrl}/subscription/admin/pending-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.success) {
        return responseData.data?.count || 0;
      } else {
        console.error('API returned success: false');
        return 0;
      }
    } catch (error) {
      console.error('Error fetching pending subscriptions count:', error);
      return 0;
    }
  },

  // [Admin] Lấy danh sách đăng ký đã duyệt
  getAdminApprovedSubscriptions: async () => {
    try {
      const response = await api.get('/subscription/admin/subscriptions');
      const allSubscriptions = response.data.data || [];
      const approvedSubscriptions = allSubscriptions.filter(sub => 
        sub.status === 'approved' || sub.status === 'active'
      );
      return approvedSubscriptions;
    } catch (error) {
      console.error('Error fetching approved subscriptions for admin:', error);
      throw error;
    }
  },

  // [Admin] Lấy danh sách đăng ký đã từ chối
  getAdminRejectedSubscriptions: async () => {
    try {
      const response = await api.get('/subscription/admin/subscriptions');
      const allSubscriptions = response.data.data || [];
      const rejectedSubscriptions = allSubscriptions.filter(sub => 
        sub.status === 'rejected'
      );
      return rejectedSubscriptions;
    } catch (error) {
      console.error('Error fetching rejected subscriptions for admin:', error);
      throw error;
    }
  },

  // [Admin] Duyệt đăng ký
  approveSubscription: async (subscriptionId) => {
    try {
      const response = await api.post(`/subscription/admin/approve/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error approving subscription:', error);
      throw error;
    }
  },

  // [Admin] Từ chối đăng ký
  rejectSubscription: async (subscriptionId, rejectReason) => {
    try {
      const response = await api.post(`/subscription/admin/reject/${subscriptionId}`, { reason: rejectReason });
      return response.data;
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      throw error;
    }
  }
};

export default subscriptionService;