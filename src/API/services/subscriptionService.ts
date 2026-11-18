/**
 * @file subscriptionService.ts
 * @description Subscription management: packages, payment, lifecycle,
 * admin-side approval/rejection, ad-benefits.
 */
import api from '@/API/config/axiosConfig';
import { getApiBaseUrl } from '@/config/apiBase';
import { apiPath, apiUrl } from '@/config/apiPaths';
import { getStoredAccessToken } from './authService';

export interface SubscriptionPackage {
  _id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  features?: string[];
  [key: string]: unknown;
}

export interface Subscription {
  _id: string;
  userId: string;
  packageId: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'cancelled' | 'expired';
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  [key: string]: unknown;
}

export interface SubscriptionCurrentPayload {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  daysLeft: number;
  isExpired: boolean;
}

export interface AdBenefits {
  hideHomepageAds: boolean;
  hideVideoAds: boolean;
  packageType: string | null;
  hasActiveSubscription: boolean;
  isPremium15k?: boolean;
  authError?: boolean;
}

export interface SubscriptionPagination {
  page: number;
  pages: number;
  total: number;
}

export interface AdminPendingResult {
  success: boolean;
  message?: string;
  pendingSubscriptions: Subscription[];
  pagination: SubscriptionPagination;
}

const PREMIUM_PACKAGE_ID = '682f7d849c310399aa715c9d';

const emptyCurrent = (): SubscriptionCurrentPayload => ({
  hasActiveSubscription: false,
  subscription: null,
  daysLeft: 0,
  isExpired: false
});

const emptyAdBenefits = (authError = false): AdBenefits => ({
  hideHomepageAds: false,
  hideVideoAds: false,
  packageType: null,
  hasActiveSubscription: false,
  authError
});

const subscriptionService = {
  getAllPackages: async (): Promise<SubscriptionPackage[]> => {
    try {
      const response = await api.get(apiPath(`subscriptionPackages`));
      return (response.data as { data: SubscriptionPackage[] }).data;
    } catch (error) {

      throw error;
    }
  },

  getPackageById: async (packageId: string): Promise<SubscriptionPackage> => {
    try {
      const response = await api.get(apiPath(`subscriptionPackageById`, packageId));
      return (response.data as { data: SubscriptionPackage }).data;
    } catch (error) {

      throw error;
    }
  },

  subscribePackage: async (data: { packageId: string; paymentMethod?: string }): Promise<Record<string, unknown>> => {
    try {
      const subscriptionData = {
        packageId: data.packageId,
        paymentMethod: data.paymentMethod || 'bank_transfer'
      };
      const response = await api.post(apiPath(`subscriptionSubscribe`), subscriptionData);
      return { ...(response.data as object), success: true, _originalSuccess: (response.data as { success?: boolean }).success, _formatted: true };
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { error?: string; details?: unknown } }; message?: string };

      if (err.response && err.response.status === 200 && err.response.data) {
        return { ...(err.response.data as object), success: true, _errorButSuccess: true, _formatted: true };
      }
      return {
        success: false,
        message: err.response?.data?.error || 'Subscription request failed',
        details: err.response?.data?.details || [],
        error: err.message
      };
    }
  },

  confirmPayment: async (paymentId: string): Promise<Record<string, unknown>> => {
    try {
      const response = await api.post(apiPath(`subscriptionConfirmPayment`), { paymentId });
      return response.data as Record<string, unknown>;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };

      return {
        success: false,
        message: err.response?.data?.message || 'Could not confirm payment, but the subscription was created.',
        error: err.response?.data
      };
    }
  },

  cancelSubscription: async (): Promise<unknown> => {
    try {
      const response = await api.post(apiPath(`subscriptionCancel`));
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getCurrentSubscription: async (): Promise<SubscriptionCurrentPayload> => {
    // Endpoint /subscription/current is removed per user request (not currently in use)
    return emptyCurrent();
  },

  getUserAdBenefits: async (): Promise<AdBenefits> => {
    // Endpoint /subscription/current is removed per user request (not currently in use).
    // Defaults cleanly without hitting non-existent backend endpoints.
    return { ...emptyAdBenefits(true) };
  },

  getSubscriptionHistory: async (): Promise<unknown> => {
    try {
      const response = await api.get(apiPath(`subscriptionHistory`));
      return (response.data as { data: unknown }).data;
    } catch (error) {

      throw error;
    }
  },

  updateAutoRenewal: async (autoRenewal: boolean): Promise<unknown> => {
    try {
      const response = await api.put(apiPath(`subscriptionAutoRenewal`), { autoRenewal });
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  getPendingSubscription: async (): Promise<unknown> => {
    try {
      const response = await api.get(apiPath(`subscriptionPending`));
      return (response.data as { data: unknown }).data;
    } catch (error) {

      throw error;
    }
  },

  getAdminPendingSubscriptions: async (): Promise<AdminPendingResult> => {
    const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
    if (!token) {
      return {
        success: false,
        message: 'No authentication token found',
        pendingSubscriptions: [],
        pagination: { page: 1, pages: 1, total: 0 }
      };
    }
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(apiUrl(`subscriptionAdminPendingSubscriptions`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`API request failed with status ${res.status}: ${res.statusText}`);

      const responseData = await res.json() as {
        success?: boolean;
        data?: { subscriptions?: Subscription[] } | Subscription[];
        subscriptions?: Subscription[];
        pagination?: SubscriptionPagination;
        message?: string;
      };

      if (responseData.success) {
        let subscriptionsData: Subscription[] = [];
        if (responseData.data && typeof responseData.data === 'object' && 'subscriptions' in responseData.data) {
          subscriptionsData = responseData.data.subscriptions || [];
        } else if (Array.isArray(responseData.data)) {
          subscriptionsData = responseData.data;
        } else if (Array.isArray(responseData.subscriptions)) {
          subscriptionsData = responseData.subscriptions;
        }
        const pagination = (responseData.data && typeof responseData.data === 'object' && 'pagination' in responseData.data)
          ? (responseData.data.pagination as SubscriptionPagination | undefined)
          : (responseData.pagination as SubscriptionPagination | undefined);
        return {
          success: true,
          pendingSubscriptions: subscriptionsData,
          pagination: pagination ?? { page: 1, pages: 1, total: subscriptionsData.length }
        };
      }
      return {
        success: false,
        message: responseData.message || 'Failed to fetch pending subscriptions',
        pendingSubscriptions: [],
        pagination: { page: 1, pages: 1, total: 0 }
      };
    } catch (error) {
      const err = error as Error;

      return {
        success: false,
        message: err.message,
        pendingSubscriptions: [],
        pagination: { page: 1, pages: 1, total: 0 }
      };
    }
  },

  getAdminPendingSubscriptionsCount: async (): Promise<number> => {
    const token = typeof window !== 'undefined' ? getStoredAccessToken() : null;
    if (!token) {

      return 0;
    }
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(apiUrl(`subscriptionAdminPendingCount`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
      const data = await res.json() as { success?: boolean; data?: { count?: number } };
      return data.success ? (data.data?.count || 0) : 0;
    } catch (error) {

      return 0;
    }
  },

  getAdminApprovedSubscriptions: async (): Promise<Subscription[]> => {
    try {
      const response = await api.get(apiPath(`subscriptionAdminSubscriptions`));
      const all = ((response.data as { data?: Subscription[] }).data || []) as Subscription[];
      return all.filter((s) => s.status === 'approved' || s.status === 'active');
    } catch (error) {

      throw error;
    }
  },

  getAdminRejectedSubscriptions: async (): Promise<Subscription[]> => {
    try {
      const response = await api.get(apiPath(`subscriptionAdminSubscriptions`));
      const all = ((response.data as { data?: Subscription[] }).data || []) as Subscription[];
      return all.filter((s) => s.status === 'rejected');
    } catch (error) {

      throw error;
    }
  },

  approveSubscription: async (subscriptionId: string): Promise<unknown> => {
    try {
      const response = await api.post(apiPath(`subscriptionAdminApprove`, subscriptionId));
      return response.data;
    } catch (error) {

      throw error;
    }
  },

  rejectSubscription: async (subscriptionId: string, reason?: string): Promise<unknown> => {
    try {
      const response = await api.post(apiPath(`subscriptionAdminReject`, subscriptionId), { reason });
      return response.data;
    } catch (error) {

      throw error;
    }
  }
};

export default subscriptionService;
