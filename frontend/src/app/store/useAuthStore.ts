// ============================================================================
// Authentication Store - Zustand
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, CurrentUser } from '../types';
import { STORAGE_KEYS } from '../config/constants';

// ============================================================================
// Store State Interface
// ============================================================================

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: CurrentUser) => void;
  setToken: (token: string) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: CurrentUser, token: string) => void;
  logout: () => void;
  clearError: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isConnecting: false,
  error: null,
};

// ============================================================================
// Auth Store
// ============================================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user, isAuthenticated: true, error: null }),

      setToken: (token) => set({ token }),

      setIsConnecting: (isConnecting) => set({ isConnecting }),

      setError: (error) => set({ error, isConnecting: false }),

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isConnecting: false,
          error: null,
        }),

      logout: () => {
        // Clear local storage
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_ADDRESS);
        localStorage.removeItem(STORAGE_KEYS.CHAT_KEYS);
        
        set(initialState);
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: STORAGE_KEYS.AUTH_TOKEN,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
