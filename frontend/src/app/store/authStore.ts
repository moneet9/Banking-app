import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  address: string | null;
  user: User | null;
  token: string | null;
  
  // Actions
  login: (address: string, signature: string) => Promise<void>;
  logout: () => void;
  setAddress: (address: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      address: null,
      user: null,
      token: null,

      login: async (address: string, signature: string) => {
        // Simulate API verification
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser: User = {
          id: address.toLowerCase(),
          address: address,
          username: `User ${address.slice(0, 6)}`,
          isOnline: true,
          lastSeen: new Date(),
        };

        set({
          isAuthenticated: true,
          address,
          user: mockUser,
          token: 'mock_jwt_' + signature.slice(0, 10),
        });
      },

      logout: () => {
        set({ isAuthenticated: false, address: null, user: null, token: null });
      },
      
      setAddress: (address) => set({ address }),
    }),
    {
      name: 'web3-chat-auth',
    }
  )
);
