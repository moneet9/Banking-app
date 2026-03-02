// ============================================================================
// Mock API Client - Simulates Backend REST API
// ============================================================================

import type {
  ApiResponse,
  Chat,
  Message,
  User,
  CreateChatPayload,
  SendMessagePayload,
  UpdateGroupPayload,
  AddParticipantsPayload,
  RemoveParticipantPayload,
  MessagesResponse,
  ChatsResponse,
} from '../types';
import { generateRoomKey } from '../utils/encryption';

// ============================================================================
// Mock Data Store
// ============================================================================

const MOCK_USERS: User[] = [
  {
    id: '1',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
    username: 'Alice',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    status: 'online',
  },
  {
    id: '2',
    address: '0x123456789abcdef123456789abcdef123456789a',
    username: 'Bob',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    status: 'online',
  },
  {
    id: '3',
    address: '0xabcdef123456789abcdef123456789abcdef1234',
    username: 'Charlie',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    status: 'offline',
  },
  {
    id: '4',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    username: 'Diana',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    status: 'away',
  },
];

const MOCK_CHATS: Chat[] = [
  {
    id: 'chat-1',
    type: 'direct',
    participants: ['current-user', '1'],
    lastMessageTime: Date.now() - 1000 * 60 * 5,
    unreadCount: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    encryptionKey: '',
  },
  {
    id: 'chat-2',
    type: 'group',
    name: 'Web3 Developers',
    description: 'Discussion about Web3 development',
    participants: ['current-user', '1', '2', '3'],
    admins: ['current-user'],
    createdBy: 'current-user',
    lastMessageTime: Date.now() - 1000 * 60 * 30,
    unreadCount: 5,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    encryptionKey: '',
  },
  {
    id: 'chat-3',
    type: 'direct',
    participants: ['current-user', '2'],
    lastMessageTime: Date.now() - 1000 * 60 * 60 * 2,
    unreadCount: 0,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
    encryptionKey: '',
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'chat-1': [
    {
      id: 'msg-1',
      chatId: 'chat-1',
      senderId: '1',
      timestamp: Date.now() - 1000 * 60 * 10,
      status: 'delivered',
      type: 'text',
      encryptedContent: JSON.stringify({ ciphertext: 'encrypted_data_1', iv: 'iv_1' }),
      content: 'Hey! How are you?',
    },
    {
      id: 'msg-2',
      chatId: 'chat-1',
      senderId: 'current-user',
      timestamp: Date.now() - 1000 * 60 * 8,
      status: 'delivered',
      type: 'text',
      encryptedContent: JSON.stringify({ ciphertext: 'encrypted_data_2', iv: 'iv_2' }),
      content: "I'm good! Working on the Web3 chat app.",
    },
    {
      id: 'msg-3',
      chatId: 'chat-1',
      senderId: '1',
      timestamp: Date.now() - 1000 * 60 * 5,
      status: 'sent',
      type: 'text',
      encryptedContent: JSON.stringify({ ciphertext: 'encrypted_data_3', iv: 'iv_3' }),
      content: 'Awesome! Need any help?',
    },
  ],
  'chat-2': [
    {
      id: 'msg-4',
      chatId: 'chat-2',
      senderId: '2',
      timestamp: Date.now() - 1000 * 60 * 45,
      status: 'delivered',
      type: 'text',
      encryptedContent: JSON.stringify({ ciphertext: 'encrypted_data_4', iv: 'iv_4' }),
      content: 'What do you think about the new EIP?',
    },
    {
      id: 'msg-5',
      chatId: 'chat-2',
      senderId: '3',
      timestamp: Date.now() - 1000 * 60 * 40,
      status: 'delivered',
      type: 'text',
      encryptedContent: JSON.stringify({ ciphertext: 'encrypted_data_5', iv: 'iv_5' }),
      content: 'I think it has great potential!',
    },
    {
      id: 'msg-6',
      chatId: 'chat-2',
      senderId: 'current-user',
      timestamp: Date.now() - 1000 * 60 * 30,
      status: 'delivered',
      type: 'text',
      encryptedContent: JSON.stringify({ ciphertext: 'encrypted_data_6', iv: 'iv_6' }),
      content: 'Agreed! The gas optimizations are impressive.',
    },
  ],
};

// ============================================================================
// API Delay Simulation
// ============================================================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// Authentication API
// ============================================================================

export async function loginWithSignature(
  address: string,
  signature: string,
  message: string
): Promise<ApiResponse<{ user: User; token: string }>> {
  await delay(800);

  // Simulate signature verification
  if (!signature || !message) {
    return {
      success: false,
      error: 'Invalid signature or message',
    };
  }

  const user: User = {
    id: 'current-user',
    address,
    username: 'You',
    status: 'online',
  };

  const token = `mock_token_${Date.now()}`;

  return {
    success: true,
    data: { user, token },
  };
}

export async function getNonce(address: string): Promise<ApiResponse<{ nonce: string }>> {
  await delay(300);

  return {
    success: true,
    data: {
      nonce: Math.random().toString(36).substring(2, 15),
    },
  };
}

// ============================================================================
// Chat API
// ============================================================================

export async function getChats(cursor?: string): Promise<ApiResponse<ChatsResponse>> {
  await delay(500);

  // Generate encryption keys for mock chats
  const chatsWithKeys = await Promise.all(
    MOCK_CHATS.map(async (chat) => ({
      ...chat,
      encryptionKey: await generateRoomKey(),
      participantDetails: chat.participants
        .map((id) => MOCK_USERS.find((u) => u.id === id))
        .filter(Boolean) as User[],
    }))
  );

  return {
    success: true,
    data: {
      items: chatsWithKeys,
      total: chatsWithKeys.length,
      hasMore: false,
    },
  };
}

export async function getChat(chatId: string): Promise<ApiResponse<Chat>> {
  await delay(300);

  const chat = MOCK_CHATS.find((c) => c.id === chatId);

  if (!chat) {
    return {
      success: false,
      error: 'Chat not found',
    };
  }

  const chatWithDetails = {
    ...chat,
    encryptionKey: await generateRoomKey(),
    participantDetails: chat.participants
      .map((id) => MOCK_USERS.find((u) => u.id === id))
      .filter(Boolean) as User[],
  };

  return {
    success: true,
    data: chatWithDetails,
  };
}

export async function createChat(
  payload: CreateChatPayload
): Promise<ApiResponse<Chat>> {
  await delay(600);

  const newChat: Chat = {
    id: `chat-${Date.now()}`,
    type: payload.type,
    participants: payload.participants,
    lastMessageTime: Date.now(),
    unreadCount: 0,
    createdAt: Date.now(),
    encryptionKey: await generateRoomKey(),
    ...(payload.type === 'group' && {
      name: payload.name || 'New Group',
      description: payload.description,
      admins: [payload.participants[0]],
      createdBy: payload.participants[0],
    }),
  } as Chat;

  MOCK_CHATS.push(newChat);

  return {
    success: true,
    data: newChat,
  };
}

export async function updateGroup(
  payload: UpdateGroupPayload
): Promise<ApiResponse<Chat>> {
  await delay(400);

  const chatIndex = MOCK_CHATS.findIndex((c) => c.id === payload.chatId);

  if (chatIndex === -1) {
    return {
      success: false,
      error: 'Chat not found',
    };
  }

  const chat = MOCK_CHATS[chatIndex];
  if (chat.type !== 'group') {
    return {
      success: false,
      error: 'Not a group chat',
    };
  }

  const updatedChat = {
    ...chat,
    ...(payload.name && { name: payload.name }),
    ...(payload.description && { description: payload.description }),
    ...(payload.avatar && { avatar: payload.avatar }),
  };

  MOCK_CHATS[chatIndex] = updatedChat;

  return {
    success: true,
    data: updatedChat,
  };
}

// ============================================================================
// Message API
// ============================================================================

export async function getMessages(
  chatId: string,
  cursor?: string
): Promise<ApiResponse<MessagesResponse>> {
  await delay(400);

  const messages = MOCK_MESSAGES[chatId] || [];

  return {
    success: true,
    data: {
      items: messages,
      total: messages.length,
      hasMore: false,
    },
  };
}

export async function sendMessage(
  payload: SendMessagePayload
): Promise<ApiResponse<Message>> {
  await delay(600);

  // Simulate 10% failure rate for testing
  if (Math.random() < 0.1) {
    return {
      success: false,
      error: 'Failed to send message',
    };
  }

  const newMessage: Message = {
    id: payload.tempId || `msg-${Date.now()}`,
    chatId: payload.chatId,
    senderId: 'current-user',
    timestamp: Date.now(),
    status: 'sent',
    type: payload.type,
    encryptedContent: payload.encryptedContent,
    ...(payload.type === 'text' && {}),
    ...(payload.type !== 'text' && {
      fileName: payload.fileName!,
      fileSize: payload.fileSize!,
      mimeType: payload.mimeType!,
      encryptedUrl: payload.encryptedUrl!,
    }),
  } as Message;

  if (!MOCK_MESSAGES[payload.chatId]) {
    MOCK_MESSAGES[payload.chatId] = [];
  }

  MOCK_MESSAGES[payload.chatId].push(newMessage);

  return {
    success: true,
    data: newMessage,
  };
}

// ============================================================================
// User API
// ============================================================================

export async function getUsers(): Promise<ApiResponse<User[]>> {
  await delay(400);

  return {
    success: true,
    data: MOCK_USERS,
  };
}

export async function searchUsers(query: string): Promise<ApiResponse<User[]>> {
  await delay(300);

  const results = MOCK_USERS.filter(
    (user) =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.address.toLowerCase().includes(query.toLowerCase())
  );

  return {
    success: true,
    data: results,
  };
}

// ============================================================================
// Group Management API
// ============================================================================

export async function addParticipants(
  payload: AddParticipantsPayload
): Promise<ApiResponse<Chat>> {
  await delay(500);

  const chatIndex = MOCK_CHATS.findIndex((c) => c.id === payload.chatId);

  if (chatIndex === -1) {
    return {
      success: false,
      error: 'Chat not found',
    };
  }

  const chat = MOCK_CHATS[chatIndex];
  if (chat.type !== 'group') {
    return {
      success: false,
      error: 'Not a group chat',
    };
  }

  const updatedChat = {
    ...chat,
    participants: [...new Set([...chat.participants, ...payload.userIds])],
  };

  MOCK_CHATS[chatIndex] = updatedChat;

  return {
    success: true,
    data: updatedChat,
  };
}

export async function removeParticipant(
  payload: RemoveParticipantPayload
): Promise<ApiResponse<Chat>> {
  await delay(500);

  const chatIndex = MOCK_CHATS.findIndex((c) => c.id === payload.chatId);

  if (chatIndex === -1) {
    return {
      success: false,
      error: 'Chat not found',
    };
  }

  const chat = MOCK_CHATS[chatIndex];
  if (chat.type !== 'group') {
    return {
      success: false,
      error: 'Not a group chat',
    };
  }

  const updatedChat = {
    ...chat,
    participants: chat.participants.filter((id) => id !== payload.userId),
  };

  MOCK_CHATS[chatIndex] = updatedChat;

  return {
    success: true,
    data: updatedChat,
  };
}
