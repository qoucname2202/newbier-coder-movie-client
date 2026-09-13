import api from '../config/axiosConfig.js';

const subscriptionService = {
  getAllPackages: async () => {
    try {
      const response = await api.get('/subscription/packages');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subscription packages:', error);
      throw error;
    }
  },

  getPackageById: async (packageId) => {
    try {
      const response = await api.get(`/subscription/packages/${packageId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching package details:', error);
      throw error;
    }
  },
  subscribePackage: async (data) => {
    try {

      const subscriptionData = {
        packageId: data.packageId,
        paymentMethod: data.paymentMethod || 'bank_transfer'
      };

      const response = await api.post('/subscription/subscribe', subscriptionData);

      const formattedResponse = {
        ...response.data,
        success: true,
        _originalSuccess: response.data.success,
        _formatted: true
      };

      return formattedResponse;
    } catch (error) {
      console.error('Error subscribing package:', error);

      if (error.response && error.response.status === 200 && error.response.data) {
        return {
          ...error.response.data,
          success: true,
          _errorButSuccess: true,
          _formatted: true
        };
      }

      return {
        success: false,
        message: error.response?.data?.error || 'Có lỗi xảy ra khi đăng ký gói',
        details: error.response?.data?.details || [],
        error: error.message
      };
    }
  },

  confirmPayment: async (paymentId) => {
    try {
      const response = await api.post('/subscription/confirm-payment', { paymentId });
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      console.error('Error details:', error.response?.data);

      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xác nhận thanh toán, nhưng đăng ký đã được tạo.',
        error: error.response?.data
      };
    }
  },

  cancelSubscription: async () => {
    try {
      const response = await api.post('/subscription/cancel');
      return response.data;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },
  getCurrentSubscription: async () => {
    try {
      const response = await api.get('/subscription/current');

      return {
        hasActiveSubscription: response.data.data?.hasActiveSubscription || false,
        subscription: response.data.data?.subscription || null,
        daysLeft: response.data.data?.daysLeft || 0,
        isExpired: response.data.data?.isExpired || false
      };
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return {
        hasActiveSubscription: false,
        subscription: null,
        daysLeft: 0,
        isExpired: false
      };
    }  },
  getUserAdBenefits: async () => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('authToken');

      if (!token) {
        return {
          hideHomepageAds: false,
          hideVideoAds: false,
          packageType: null,
          hasActiveSubscription: false,
          authError: true
        };
      }

      const response = await api.get('/subscription/ad-benefits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const isPremiumPackage = response.data.data?.packageType === '682f7d849c310399aa715c9d';

      if (isPremiumPackage) {
      }

      return {
        hideHomepageAds: response.data.data?.hideHomepageAds || isPremiumPackage || false,
        hideVideoAds: response.data.data?.hideVideoAds || isPremiumPackage || false,
        packageType: response.data.data?.packageType || null,
        hasActiveSubscription: response.data.data?.hasActiveSubscription || false,
        isPremium15k: isPremiumPackage
      };
    } catch (error) {
      console.error('%c[AdBenefits] Error fetching ad benefits:', 'color: #FF0000; font-weight: bold', error);

      const isAuthError = error.response && (error.response.status === 401 || error.response.status === 403);
      if (isAuthError) {
        console.warn('%c[AdBenefits] Authentication error detected', 'color: #FF9800; font-weight: bold');
      }

      return {
        hideHomepageAds: false,
        hideVideoAds: false,
        packageType: null,
        hasActiveSubscription: false,
        authError: isAuthError
      };
    }
  },

  getSubscriptionHistory: async () => {
    try {
      const response = await api.get('/subscription/history');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching subscription history:', error);
      throw error;
    }
  },

  updateAutoRenewal: async (autoRenewal) => {
    try {
      const response = await api.put('/subscription/auto-renewal', { autoRenewal });
      return response.data;
    } catch (error) {
      console.error('Error updating auto renewal:', error);
      throw error;
    }
  },

  getPendingSubscription: async () => {
    try {
      const response = await api.get('/subscription/pending');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pending subscription:', error);
      throw error;
    }
  },

  getAdminPendingSubscriptions: async () => {
    try {
      const timestamp = new Date().getTime();

      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');

      if (!token) {
        console.error('No authentication token found');
        return {
          pendingSubscriptions: [],
          pagination: { page: 1, pages: 1, total: 0 }
        };
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
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

      if (responseData.success) {
        let subscriptionsData = [];

        if (responseData.data && responseData.data.subscriptions) {
          subscriptionsData = responseData.data.subscriptions;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          subscriptionsData = responseData.data;
        } else if (Array.isArray(responseData.subscriptions)) {
          subscriptionsData = responseData.subscriptions;
        }

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

  getAdminPendingSubscriptionsCount: async () => {
    try {
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

  approveSubscription: async (subscriptionId) => {
    try {
      const response = await api.post(`/subscription/admin/approve/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Error approving subscription:', error);
      throw error;
    }
  },

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