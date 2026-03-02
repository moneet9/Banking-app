// ============================================================================
// Chat Hook - Main chat functionality
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  getChats,
  getMessages,
  sendMessage as sendMessageApi,
  createChat as createChatApi,
} from '../services/mockApi';
import { mockSocketClient } from '../services/mockSocket';
import {
  encryptMessage,
  decryptMessage,
  formatEncryptedPayload,
  parseEncryptedPayload,
  generateRoomKey,
  getRoomKey,
  storeRoomKey,
} from '../utils/encryption';
import type {
  Message,
  SendMessagePayload,
  CreateChatPayload,
  OptimisticMessage,
} from '../types';
import { toast } from 'sonner';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants';

// ============================================================================
// Hook
// ============================================================================

export function useChat() {
  const {
    chats,
    messages,
    users,
    loading,
    error,
    setChats,
    addChat,
    setMessages,
    addMessage,
    addOptimisticMessage,
    updateMessage,
    removeOptimisticMessage,
    setChatsLoading,
    setMessagesLoading,
    setError,
    markChatAsRead,
    incrementUnreadCount,
  } = useChatStore();

  const { user: currentUser } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  // Initialize - Load chats and setup socket listeners
  // ============================================================================

  useEffect(() => {
    if (!currentUser || isInitialized) return;

    const initialize = async () => {
      try {
        await loadChats();
        setupSocketListeners();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setError(ERROR_MESSAGES.NETWORK_ERROR);
      }
    };

    initialize();
  }, [currentUser, isInitialized]);

  // ============================================================================
  // Socket Listeners
  // ============================================================================

  const setupSocketListeners = useCallback(() => {
    // New message received
    mockSocketClient.on('message:new', async (message: Message) => {
      try {
        // Decrypt message
        const roomKey = getRoomKey(message.chatId);
        if (roomKey && message.encryptedContent) {
          const encrypted = parseEncryptedPayload(message.encryptedContent);
          const decrypted = await decryptMessage(encrypted, roomKey);
          
          if (message.type === 'text') {
            (message as any).content = decrypted.content;
          }
        }

        addMessage(message);

        // Increment unread count if not from current user
        if (message.senderId !== currentUser?.id) {
          incrementUnreadCount(message.chatId);
        }
      } catch (error) {
        console.error('Failed to process new message:', error);
      }
    });

    // Message status update
    mockSocketClient.on('message:status', ({ messageId, status }) => {
      updateMessage(messageId, { status: status as any });
    });

    // User status update
    mockSocketClient.on('user:status', ({ userId, status }) => {
      useChatStore.getState().updateUser(userId, { status: status as any });
    });

    // Typing indicator
    mockSocketClient.on('typing:update', (indicator) => {
      if (indicator.userId !== currentUser?.id) {
        useChatStore.getState().setTypingIndicator(indicator.chatId, indicator);
      }
    });
  }, [currentUser, addMessage, updateMessage, incrementUnreadCount]);

  // ============================================================================
  // Load Chats
  // ============================================================================

  const loadChats = useCallback(async () => {
    try {
      setChatsLoading(true);
      const response = await getChats();

      if (response.success && response.data) {
        setChats(response.data.items);

        // Store encryption keys
        response.data.items.forEach((chat) => {
          if (chat.encryptionKey) {
            storeRoomKey(chat.id, chat.encryptionKey);
          }
        });
      } else {
        throw new Error(response.error || 'Failed to load chats');
      }
    } catch (error: any) {
      console.error('Failed to load chats:', error);
      setError(error.message);
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setChatsLoading(false);
    }
  }, [setChats, setChatsLoading, setError]);

  // ============================================================================
  // Load Messages
  // ============================================================================

  const loadMessages = useCallback(
    async (chatId: string) => {
      try {
        setMessagesLoading(chatId, true);
        const response = await getMessages(chatId);

        if (response.success && response.data) {
          const roomKey = getRoomKey(chatId);

          // Decrypt messages
          const decryptedMessages = await Promise.all(
            response.data.items.map(async (message) => {
              try {
                if (roomKey && message.encryptedContent) {
                  const encrypted = parseEncryptedPayload(message.encryptedContent);
                  const decrypted = await decryptMessage(encrypted, roomKey);

                  if (message.type === 'text') {
                    return { ...message, content: decrypted.content };
                  }
                }
                return message;
              } catch (error) {
                console.error('Failed to decrypt message:', error);
                return message;
              }
            })
          );

          setMessages(chatId, decryptedMessages);
          
          // Join chat room for real-time updates
          mockSocketClient.joinChat(chatId);
          
          // Mark as read
          markChatAsRead(chatId);
        } else {
          throw new Error(response.error || 'Failed to load messages');
        }
      } catch (error: any) {
        console.error('Failed to load messages:', error);
        setError(error.message);
        toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      } finally {
        setMessagesLoading(chatId, false);
      }
    },
    [setMessages, setMessagesLoading, setError, markChatAsRead]
  );

  // ============================================================================
  // Send Message
  // ============================================================================

  const sendMessage = useCallback(
    async (chatId: string, content: string, type: 'text' = 'text') => {
      if (!currentUser) return;

      const tempId = `temp-${Date.now()}`;
      const roomKey = getRoomKey(chatId);

      if (!roomKey) {
        toast.error(ERROR_MESSAGES.ENCRYPTION_FAILED);
        return;
      }

      try {
        // Encrypt content
        const encrypted = await encryptMessage(content, roomKey);
        const encryptedContent = formatEncryptedPayload(encrypted);

        // Create optimistic message
        const optimisticMessage: OptimisticMessage = {
          id: tempId,
          tempId,
          chatId,
          senderId: currentUser.id,
          timestamp: Date.now(),
          status: 'sending',
          type,
          encryptedContent,
          content,
          optimistic: true,
        };

        // Add optimistic message immediately
        addOptimisticMessage(optimisticMessage);

        // Send to server
        const payload: SendMessagePayload = {
          chatId,
          type,
          encryptedContent,
          tempId,
        };

        const response = await sendMessageApi(payload);

        if (response.success && response.data) {
          // Remove optimistic message
          removeOptimisticMessage(tempId);

          // Decrypt and add real message
          const decrypted = await decryptMessage(encrypted, roomKey);
          const realMessage = {
            ...response.data,
            content: decrypted.content,
          };

          addMessage(realMessage);

          // Send through socket for real-time delivery
          mockSocketClient.sendMessage({ ...payload, tempId: response.data.id });
        } else {
          // Mark optimistic message as failed
          updateMessage(tempId, { status: 'failed' });
          toast.error(ERROR_MESSAGES.MESSAGE_SEND_FAILED);
        }
      } catch (error: any) {
        console.error('Failed to send message:', error);
        updateMessage(tempId, { status: 'failed' });
        toast.error(ERROR_MESSAGES.MESSAGE_SEND_FAILED);
      }
    },
    [
      currentUser,
      addOptimisticMessage,
      removeOptimisticMessage,
      addMessage,
      updateMessage,
    ]
  );

  // ============================================================================
  // Create Chat
  // ============================================================================

  const createChat = useCallback(
    async (payload: CreateChatPayload) => {
      try {
        // Generate encryption key for new chat
        const encryptionKey = await generateRoomKey();

        const response = await createChatApi(payload);

        if (response.success && response.data) {
          const chat = { ...response.data, encryptionKey };
          
          // Store encryption key
          storeRoomKey(chat.id, encryptionKey);
          
          addChat(chat);
          toast.success(SUCCESS_MESSAGES.GROUP_CREATED);
          
          return chat;
        } else {
          throw new Error(response.error || 'Failed to create chat');
        }
      } catch (error: any) {
        console.error('Failed to create chat:', error);
        toast.error(error.message);
        return null;
      }
    },
    [addChat]
  );

  // ============================================================================
  // Send Typing Indicator
  // ============================================================================

  const sendTyping = useCallback((chatId: string, isTyping: boolean) => {
    mockSocketClient.sendTyping(chatId, isTyping);
  }, []);

  // ============================================================================
  // Return Hook Values
  // ============================================================================

  return {
    // State
    chats: Object.values(chats).sort((a, b) => b.lastMessageTime - a.lastMessageTime),
    messages,
    users,
    loading,
    error,
    isInitialized,

    // Actions
    loadChats,
    loadMessages,
    sendMessage,
    createChat,
    sendTyping,
    markChatAsRead,
  };
}
