// This file provides TypeScript type definitions for auth.js
import { User } from '../types/user';

declare module '@/utils/auth' {  export interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isAccountLocked: boolean;
    showAccountLockedBanner: boolean;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    login: (credentials: any) => Promise<{ success: boolean, data?: any, error?: string }>;
    register: (userData: any) => Promise<{ success: boolean, data?: any, error?: string }>;
    logout: () => void;  // Changed from Promise<void> to plain function
    updateProfile: (profileData: any) => Promise<{ success: boolean, user?: User, error?: string }>;
    uploadAvatar: (file: File) => Promise<string | null>;
    refreshUser: () => Promise<void>;
    hideAccountLockedBanner: () => void;
    resetAccountLockStatus: () => void;
  }

  export function useAuth(): AuthContextType;
  export function withAuth(Component: React.ComponentType<any>): React.ComponentType<any>;
  export function withAccountStatus(Component: React.ComponentType<any>): React.ComponentType<any>;
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
}
