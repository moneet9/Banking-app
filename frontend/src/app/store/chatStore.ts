import { create } from 'zustand';
import { Conversation, Message, User } from '../types';
import { socket } from '../services/mockSocket';
import { nanoid } from 'nanoid';

interface ChatStore {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  isLoading: boolean;
  typingUsers: Record<string, string[]>; // conversationId -> [userNames]

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  updateMessageStatus: (id: string, status: 'sending' | 'sent' | 'failed') => void;
  
  // Async Actions
  sendMessage: (content: string, type: 'text' | 'image' | 'file', file?: File) => Promise<void>;
  
  // Socket Handlers
  initializeSocket: (user: User) => void;
  disconnectSocket: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  messages: {},
  activeConversationId: null,
  isLoading: false,
  typingUsers: {},

  setConversations: (conversations) => set({ conversations }),
  
  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    // Reset unread count for this conversation (mock)
    if (id) {
      set(state => ({
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, unreadCount: 0 } : c
        )
      }));
    }
  },

  addMessage: (message) => set((state) => {
    const conversationId = message.conversationId;
    const currentMessages = state.messages[conversationId] || [];
    
    // Check if message already exists (deduplication)
    if (currentMessages.find(m => m.id === message.id)) {
      return state;
    }

    // Update last message in conversation list
    const updatedConversations = state.conversations.map(c => 
      c.id === conversationId 
        ? { ...c, lastMessage: message, unreadCount: state.activeConversationId === conversationId ? 0 : c.unreadCount + 1 }
        : c
    );

    return {
      conversations: updatedConversations,
      messages: {
        ...state.messages,
        [conversationId]: [...currentMessages, message]
      }
    };
  }),

  setMessages: (conversationId, messages) => set(state => ({
    messages: { ...state.messages, [conversationId]: messages }
  })),

  updateMessageStatus: (id, status) => set(state => {
    // Find the conversation for this message (expensive in real app, but ok for MVP mock)
    // Here we'll just iterate all message lists
    const newMessages = { ...state.messages };
    Object.keys(newMessages).forEach(chatId => {
      newMessages[chatId] = newMessages[chatId].map(m => 
        m.id === id ? { ...m, status } : m
      );
    });
    return { messages: newMessages };
  }),

  sendMessage: async (content, type, file) => {
    const { activeConversationId, addMessage, updateMessageStatus } = get();
    if (!activeConversationId) return;

    // Optimistic Update
    const tempId = nanoid();
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: 'me', // Will be replaced by real ID in auth context
      content: content, 
      type,
      status: 'sending',
      timestamp: new Date().toISOString(),
      fileName: file?.name,
      fileSize: file?.size,
      mimeType: file?.type,
    };

    addMessage(optimisticMessage);

    try {
      // Simulate socket emission
      socket.emitToServer('send_message', optimisticMessage);
      
      // Simulate success callback
      setTimeout(() => {
        updateMessageStatus(tempId, 'sent');
      }, 800);
      
    } catch (error) {
      console.error(error);
      updateMessageStatus(tempId, 'failed');
    }
  },

  initializeSocket: (user) => {
    if (!socket.connected) {
      socket.connect();
      
      socket.on('new_message', (msg: Message) => {
        // If it's my own message echoing back, don't duplicate (handled by optimistic UI)
        // But for mock, let's just use ID check in addMessage
        get().addMessage(msg);
      });

      socket.on('typing', (data: any) => {
        // Handle typing indicator
      });
    }
  },

  disconnectSocket: () => {
    if (socket.connected) {
      socket.disconnect();
    }
  }
}));
