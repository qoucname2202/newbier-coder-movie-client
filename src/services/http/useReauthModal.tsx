/**
 * @file useReauthModal.tsx
 * @description React Context and Hook for managing the Re-authentication Modal lifecycle.
 * Isolates re-authentication state, keeping components completely decoupled from token refresh logic.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react';
import { reauthEvents } from './httpClient';
import { ReauthModalState, ReauthCredentials } from './types';
import { saveFormDraft, getFormDraft, clearFormDraft } from './formDraft';
import authService from '@/API/services/authService';

interface ReauthContextValue extends ReauthModalState {
  submitReauth: (credentials: ReauthCredentials) => Promise<boolean>;
  cancelReauth: (fallbackDraft?: { formId: string; data: Record<string, unknown> }) => void;
  saveDraft: typeof saveFormDraft;
  getDraft: typeof getFormDraft;
  clearDraft: typeof clearFormDraft;
}

const ReauthContext = createContext<ReauthContextValue | null>(null);

export interface ReauthProviderProps {
  children: ReactNode;
}

export const ReauthProvider: React.FC<ReauthProviderProps> = ({ children }) => {
  const [modalState, setModalState] = useState<ReauthModalState>({
    isOpen: false,
    isLoading: false,
    errorMessage: null,
    pendingCount: 0
  });

  // Subscribe to re-authentication events dispatched from httpClient
  useEffect(() => {
    const unsubscribe = reauthEvents.subscribe((state) => {
      setModalState(state);
    });
    return unsubscribe;
  }, []);

  /**
   * Submits credentials to re-authenticate the user without leaving the current view.
   */
  const submitReauth = useCallback(
    async (credentials: ReauthCredentials): Promise<boolean> => {
      try {
        setModalState((prev) => ({ ...prev, isLoading: true, errorMessage: null }));

        // Attempt login via unified authService
        const result = await authService.login({
          username: credentials.username || credentials.email || '',
          password: credentials.password || ''
        });

        if (result && result.token) {
          // Notify HTTP client to flush pending queue with new token
          reauthEvents.onLoginSuccess(result.token);
          setModalState((prev) => ({ ...prev, isOpen: false, isLoading: false, errorMessage: null }));
          return true;
        } else {
          setModalState((prev) => ({
            ...prev,
            isLoading: false,
            errorMessage: 'Đăng nhập không thành công. Vui lòng thử lại.'
          }));
          return false;
        }
      } catch (err) {
        const error = err as Error;
        setModalState((prev) => ({
          ...prev,
          isLoading: false,
          errorMessage: error.message || 'Mật khẩu hoặc thông tin xác thực không chính xác.'
        }));
        return false;
      }
    },
    []
  );

  /**
   * Cancels re-authentication, optionally saving a form draft to sessionStorage before dismissal.
   */
  const cancelReauth = useCallback(
    (fallbackDraft?: { formId: string; data: Record<string, unknown> }): void => {
      if (fallbackDraft) {
        saveFormDraft(fallbackDraft.formId, fallbackDraft.data);
      }
      reauthEvents.onCancel();
      setModalState((prev) => ({ ...prev, isOpen: false, isLoading: false, errorMessage: null }));
    },
    []
  );

  const value: ReauthContextValue = {
    ...modalState,
    submitReauth,
    cancelReauth,
    saveDraft: saveFormDraft,
    getDraft: getFormDraft,
    clearDraft: clearFormDraft
  };

  return <ReauthContext.Provider value={value}>{children}</ReauthContext.Provider>;
};

/**
 * Hook to access re-authentication modal state and draft persistence utilities.
 */
export const useReauthModal = (): ReauthContextValue => {
  const context = useContext(ReauthContext);
  if (!context) {
    throw new Error('useReauthModal must be used within a ReauthProvider');
  }
  return context;
};
