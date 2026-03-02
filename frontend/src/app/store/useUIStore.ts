// ============================================================================
// UI Store - Zustand
// ============================================================================

import { create } from 'zustand';
import type { UIState, ModalType, DrawerContent } from '../types';
import { UI_CONFIG } from '../config/constants';

// ============================================================================
// Store State Interface
// ============================================================================

interface UIStore extends UIState {
  // Actions
  setIsMobile: (isMobile: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setSelectedChat: (chatId: string | null) => void;
  setSelectedUsers: (userIds: string[]) => void;
  addSelectedUser: (userId: string) => void;
  removeSelectedUser: (userId: string) => void;
  clearSelectedUsers: () => void;
  openDrawer: (content: DrawerContent) => void;
  closeDrawer: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const getInitialMobileState = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < UI_CONFIG.MOBILE_BREAKPOINT;
};

const initialState: UIState = {
  isMobile: getInitialMobileState(),
  sidebarOpen: !getInitialMobileState(),
  activeModal: null,
  selectedChat: null,
  selectedUsers: [],
  drawerOpen: false,
  drawerContent: null,
};

// ============================================================================
// UI Store
// ============================================================================

export const useUIStore = create<UIStore>()((set) => ({
  ...initialState,

  setIsMobile: (isMobile) =>
    set((state) => ({
      isMobile,
      // Auto-close sidebar on mobile
      sidebarOpen: isMobile ? false : state.sidebarOpen,
    })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),

  setSelectedChat: (chatId) =>
    set((state) => ({
      selectedChat: chatId,
      // Close sidebar on mobile when chat is selected
      sidebarOpen: state.isMobile ? false : state.sidebarOpen,
    })),

  setSelectedUsers: (userIds) => set({ selectedUsers: userIds }),

  addSelectedUser: (userId) =>
    set((state) => ({
      selectedUsers: [...state.selectedUsers, userId],
    })),

  removeSelectedUser: (userId) =>
    set((state) => ({
      selectedUsers: state.selectedUsers.filter((id) => id !== userId),
    })),

  clearSelectedUsers: () => set({ selectedUsers: [] }),

  openDrawer: (content) => set({ drawerOpen: true, drawerContent: content }),

  closeDrawer: () => set({ drawerOpen: false, drawerContent: null }),

  reset: () => set(initialState),
}));
