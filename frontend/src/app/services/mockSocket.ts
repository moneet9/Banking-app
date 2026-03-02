// ============================================================================
// Mock WebSocket Client - Simulates Socket.IO Real-time Events
// ============================================================================

import { io, Socket } from 'socket.io-client';
import type { SocketEvents, Message, TypingIndicator, Chat, User } from '../types';
import { ENV } from '../config/constants';

// ============================================================================
// Mock Socket Implementation
// ============================================================================

class MockSocketClient {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private isConnected = false;
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Connect to the mock socket server
   */
  connect(token: string): void {
    console.log('[MockSocket] Connecting with token:', token);

    // In production, this would connect to a real Socket.IO server
    // For now, we simulate the connection
    this.socket = io(ENV.SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling'],
    });

    this.setupSocketListeners();
    this.simulateConnection();
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    console.log('[MockSocket] Disconnecting');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.eventHandlers.clear();
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * Set up socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[MockSocket] Connected');
      this.isConnected = true;
      this.emit('connected', null);
    });

    this.socket.on('disconnect', () => {
      console.log('[MockSocket] Disconnected');
      this.isConnected = false;
      this.emit('disconnected', null);
    });

    this.socket.on('error', (error: string) => {
      console.error('[MockSocket] Error:', error);
      this.emit('error', error);
    });

    // Chat events
    this.socket.on('message:new', (message: Message) => {
      console.log('[MockSocket] New message:', message);
      this.emit('message:new', message);
    });

    this.socket.on('message:status', (data: { messageId: string; status: string }) => {
      console.log('[MockSocket] Message status update:', data);
      this.emit('message:status', data);
    });

    this.socket.on('typing:update', (data: TypingIndicator) => {
      console.log('[MockSocket] Typing update:', data);
      this.emit('typing:update', data);
    });

    this.socket.on('user:status', (data: { userId: string; status: string }) => {
      console.log('[MockSocket] User status update:', data);
      this.emit('user:status', data);
    });

    this.socket.on('chat:updated', (chat: Chat) => {
      console.log('[MockSocket] Chat updated:', chat);
      this.emit('chat:updated', chat);
    });
  }

  /**
   * Simulate successful connection for demo purposes
   */
  private simulateConnection(): void {
    setTimeout(() => {
      this.isConnected = true;
      this.emit('connected', null);
    }, 500);
  }

  /**
   * Join a chat room
   */
  joinChat(chatId: string): void {
    console.log('[MockSocket] Joining chat:', chatId);
    
    if (this.socket) {
      this.socket.emit('chat:join', chatId);
    }
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string): void {
    console.log('[MockSocket] Leaving chat:', chatId);
    
    if (this.socket) {
      this.socket.emit('chat:leave', chatId);
    }
  }

  /**
   * Send a message through socket (for real-time delivery)
   */
  sendMessage(data: any): void {
    console.log('[MockSocket] Sending message:', data);
    
    if (this.socket) {
      this.socket.emit('message:send', data);
    }

    // Simulate immediate status update
    setTimeout(() => {
      this.emit('message:status', {
        messageId: data.tempId,
        status: 'sent',
      });
    }, 500);

    // Simulate delivery confirmation
    setTimeout(() => {
      this.emit('message:status', {
        messageId: data.tempId,
        status: 'delivered',
      });
    }, 1500);
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    console.log('[MockSocket] Typing indicator:', chatId, isTyping);
    
    if (this.socket) {
      if (isTyping) {
        this.socket.emit('typing:start', chatId);
      } else {
        this.socket.emit('typing:stop', chatId);
      }
    }

    // Clear existing timeout
    const existingTimeout = this.typingTimeouts.get(chatId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        this.sendTyping(chatId, false);
      }, 3000);
      this.typingTimeouts.set(chatId, timeout);
    }
  }

  /**
   * Mark messages as read
   */
  markAsRead(chatId: string, messageIds: string[]): void {
    console.log('[MockSocket] Marking as read:', chatId, messageIds);
    
    if (this.socket) {
      this.socket.emit('message:read', { chatId, messageIds });
    }
  }

  /**
   * Register event handler
   */
  on<K extends keyof SocketEvents>(event: K, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister event handler
   */
  off<K extends keyof SocketEvents>(event: K, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to registered handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[MockSocket] Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Simulate receiving a message (for demo purposes)
   */
  simulateIncomingMessage(message: Message): void {
    setTimeout(() => {
      this.emit('message:new', message);
    }, Math.random() * 2000 + 1000);
  }

  /**
   * Simulate typing indicator (for demo purposes)
   */
  simulateTyping(chatId: string, user: User): void {
    const typingIndicator: TypingIndicator = {
      chatId,
      userId: user.id,
      username: user.username,
      timestamp: Date.now(),
    };

    this.emit('typing:update', typingIndicator);

    // Stop typing after 3 seconds
    setTimeout(() => {
      this.emit('typing:update', {
        ...typingIndicator,
        timestamp: 0, // Indicates stopped typing
      });
    }, 3000);
  }

  /**
   * Simulate user status change (for demo purposes)
   */
  simulateUserStatus(userId: string, status: 'online' | 'offline' | 'away'): void {
    this.emit('user:status', { userId, status });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const mockSocketClient = new MockSocketClient();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Initialize socket connection
 */
export function initializeSocket(token: string): void {
  mockSocketClient.connect(token);
}

/**
 * Cleanup socket connection
 */
export function cleanupSocket(): void {
  mockSocketClient.disconnect();
}

/**
 * Get socket connection status
 */
export function isSocketConnected(): boolean {
  return mockSocketClient.connected;
}
