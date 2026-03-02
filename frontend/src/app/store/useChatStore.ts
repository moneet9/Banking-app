// ============================================================================
// Chat Store - Zustand
// ============================================================================

import { create } from 'zustand';
import type {
  Chat,
  Message,
  User,
  TypingIndicator,
  ChatState,
  OptimisticMessage,
} from '../types';

// ============================================================================
// Store State Interface
// ============================================================================

interface ChatStore extends ChatState {
  // Chat Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;

  // Message Actions
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  addOptimisticMessage: (message: OptimisticMessage) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeOptimisticMessage: (tempId: string) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;

  // User Actions
  setUsers: (users: User[]) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;

  // Typing Indicator Actions
  setTypingIndicator: (chatId: string, indicator: TypingIndicator) => void;
  clearTypingIndicator: (chatId: string, userId: string) => void;

  // Loading Actions
  setChatsLoading: (loading: boolean) => void;
  setMessagesLoading: (chatId: string, loading: boolean) => void;

  // Error Actions
  setError: (error: string | null) => void;
  clearError: () => void;

  // Utility Actions
  markChatAsRead: (chatId: string) => void;
  incrementUnreadCount: (chatId: string) => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: ChatState = {
  chats: {},
  messages: {},
  users: {},
  typingIndicators: {},
  loading: {
    chats: false,
    messages: {},
  },
  error: null,
};

// ============================================================================
// Chat Store
// ============================================================================

export const useChatStore = create<ChatStore>()((set, get) => ({
  ...initialState,

  // ============================================================================
  // Chat Actions
  // ============================================================================

  setChats: (chats) => {
    const chatsMap = chats.reduce((acc, chat) => {
      acc[chat.id] = chat;
      return acc;
    }, {} as Record<string, Chat>);

    set({ chats: chatsMap });
  },

  addChat: (chat) =>
    set((state) => ({
      chats: { ...state.chats, [chat.id]: chat },
    })),

  updateChat: (chatId, updates) =>
    set((state) => ({
      chats: {
        ...state.chats,
        [chatId]: state.chats[chatId]
          ? { ...state.chats[chatId], ...updates }
          : state.chats[chatId],
      },
    })),

  removeChat: (chatId) =>
    set((state) => {
      const { [chatId]: removed, ...remainingChats } = state.chats;
      const { [chatId]: removedMessages, ...remainingMessages } = state.messages;
      return {
        chats: remainingChats,
        messages: remainingMessages,
      };
    }),

  // ============================================================================
  // Message Actions
  // ============================================================================

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  addMessage: (message) =>
    set((state) => {
      const chatMessages = state.messages[message.chatId] || [];
      
      // Check if message already exists (by ID)
      const exists = chatMessages.some((m) => m.id === message.id);
      if (exists) {
        // Update existing message
        return {
          messages: {
            ...state.messages,
            [message.chatId]: chatMessages.map((m) =>
              m.id === message.id ? message : m
            ),
          },
        };
      }

      // Add new message
      return {
        messages: {
          ...state.messages,
          [message.chatId]: [...chatMessages, message],
        },
        chats: {
          ...state.chats,
          [message.chatId]: state.chats[message.chatId]
            ? {
                ...state.chats[message.chatId],
                lastMessage: message,
                lastMessageTime: message.timestamp,
              }
            : state.chats[message.chatId],
        },
      };
    }),

  addOptimisticMessage: (message) =>
    set((state) => {
      const chatMessages = state.messages[message.chatId] || [];
      return {
        messages: {
          ...state.messages,
          [message.chatId]: [...chatMessages, message],
        },
      };
    }),

  updateMessage: (messageId, updates) =>
    set((state) => {
      const newMessages = { ...state.messages };
      
      for (const chatId in newMessages) {
        const messageIndex = newMessages[chatId].findIndex((m) => m.id === messageId);
        if (messageIndex !== -1) {
          newMessages[chatId] = [
            ...newMessages[chatId].slice(0, messageIndex),
            { ...newMessages[chatId][messageIndex], ...updates },
            ...newMessages[chatId].slice(messageIndex + 1),
          ];
          break;
        }
      }

      return { messages: newMessages };
    }),

  removeOptimisticMessage: (tempId) =>
    set((state) => {
      const newMessages = { ...state.messages };
      
      for (const chatId in newMessages) {
        newMessages[chatId] = newMessages[chatId].filter(
          (m) => !('tempId' in m) || (m as OptimisticMessage).tempId !== tempId
        );
      }

      return { messages: newMessages };
    }),

  prependMessages: (chatId, messages) =>
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: [...messages, ...chatMessages],
        },
      };
    }),

  // ============================================================================
  // User Actions
  // ============================================================================

  setUsers: (users) => {
    const usersMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);

    set({ users: usersMap });
  },

  updateUser: (userId, updates) =>
    set((state) => ({
      users: {
        ...state.users,
        [userId]: state.users[userId]
          ? { ...state.users[userId], ...updates }
          : state.users[userId],
      },
    })),

  // ============================================================================
  // Typing Indicator Actions
  // ============================================================================

  setTypingIndicator: (chatId, indicator) =>
    set((state) => {
      const chatIndicators = state.typingIndicators[chatId] || [];
      
      // Remove existing indicator for this user
      const filtered = chatIndicators.filter((i) => i.userId !== indicator.userId);
      
      // Add new indicator if timestamp > 0 (0 means stopped typing)
      const updated = indicator.timestamp > 0 ? [...filtered, indicator] : filtered;

      return {
        typingIndicators: {
          ...state.typingIndicators,
          [chatId]: updated,
        },
      };
    }),

  clearTypingIndicator: (chatId, userId) =>
    set((state) => {
      const chatIndicators = state.typingIndicators[chatId] || [];
      return {
        typingIndicators: {
          ...state.typingIndicators,
          [chatId]: chatIndicators.filter((i) => i.userId !== userId),
        },
      };
    }),

  // ============================================================================
  // Loading Actions
  // ============================================================================

  setChatsLoading: (loading) =>
    set((state) => ({
      loading: { ...state.loading, chats: loading },
    })),

  setMessagesLoading: (chatId, loading) =>
    set((state) => ({
      loading: {
        ...state.loading,
        messages: { ...state.loading.messages, [chatId]: loading },
      },
    })),

  // ============================================================================
  // Error Actions
  // ============================================================================

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // ============================================================================
  // Utility Actions
  // ============================================================================

  markChatAsRead: (chatId) =>
    set((state) => ({
      chats: {
        ...state.chats,
        [chatId]: state.chats[chatId]
          ? { ...state.chats[chatId], unreadCount: 0 }
          : state.chats[chatId],
      },
    })),

  incrementUnreadCount: (chatId) =>
    set((state) => ({
      chats: {
        ...state.chats,
        [chatId]: state.chats[chatId]
          ? {
              ...state.chats[chatId],
              unreadCount: state.chats[chatId].unreadCount + 1,
            }
          : state.chats[chatId],
      },
    })),

  reset: () => set(initialState),
}));
