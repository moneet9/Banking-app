// ============================================================================
// Core Type Definitions for Web3 dApp Chat
// ============================================================================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';
export type MessageType = 'text' | 'image' | 'file';
export type ChatType = 'direct' | 'group';
export type UserStatus = 'online' | 'offline' | 'away';

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  address: string; // Ethereum address
  username: string;
  avatar?: string;
  status: UserStatus;
  lastSeen?: number;
  publicKey?: string; // For encryption
}

export interface CurrentUser extends User {
  signature?: string;
  nonce?: string;
}

// ============================================================================
// Message Types
// ============================================================================

export interface BaseMessage {
  id: string;
  chatId: string;
  senderId: string;
  timestamp: number;
  status: MessageStatus;
  type: MessageType;
  encryptedContent: string; // Always encrypted
  replyTo?: string;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  content?: string; // Decrypted content (client-side only)
}

export interface FileMessage extends BaseMessage {
  type: 'image' | 'file';
  fileName: string;
  fileSize: number;
  mimeType: string;
  encryptedUrl: string;
  url?: string; // Decrypted URL (client-side only)
  content?: string; // Decrypted content
}

export type Message = TextMessage | FileMessage;

export interface OptimisticMessage extends Message {
  optimistic: true;
  tempId: string;
}

// ============================================================================
// Chat Types
// ============================================================================

export interface BaseChat {
  id: string;
  type: ChatType;
  lastMessage?: Message;
  lastMessageTime: number;
  unreadCount: number;
  createdAt: number;
  encryptionKey?: string; // Room encryption key
}

export interface DirectChat extends BaseChat {
  type: 'direct';
  participants: [string, string]; // Two user IDs
  participantDetails?: User[];
}

export interface GroupChat extends BaseChat {
  type: 'group';
  name: string;
  description?: string;
  avatar?: string;
  participants: string[]; // Array of user IDs
  participantDetails?: User[];
  admins: string[];
  createdBy: string;
}

export type Chat = DirectChat | GroupChat;

// ============================================================================
// Typing Indicator Types
// ============================================================================

export interface TypingIndicator {
  chatId: string;
  userId: string;
  username: string;
  timestamp: number;
}

// ============================================================================
// WebSocket Event Types
// ============================================================================

export interface SocketEvents {
  // Client -> Server
  'auth:login': (data: { address: string; signature: string; message: string }) => void;
  'chat:join': (chatId: string) => void;
  'chat:leave': (chatId: string) => void;
  'message:send': (data: SendMessagePayload) => void;
  'typing:start': (chatId: string) => void;
  'typing:stop': (chatId: string) => void;
  'message:read': (data: { chatId: string; messageIds: string[] }) => void;

  // Server -> Client
  'auth:success': (data: { user: User; token: string }) => void;
  'auth:error': (error: string) => void;
  'message:new': (message: Message) => void;
  'message:status': (data: { messageId: string; status: MessageStatus }) => void;
  'typing:update': (data: TypingIndicator) => void;
  'user:status': (data: { userId: string; status: UserStatus }) => void;
  'chat:updated': (chat: Chat) => void;
  'error': (error: string) => void;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface SendMessagePayload {
  chatId: string;
  type: MessageType;
  encryptedContent: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  encryptedUrl?: string;
  replyTo?: string;
  tempId?: string; // For optimistic updates
}

export interface CreateChatPayload {
  type: ChatType;
  participants: string[];
  name?: string;
  description?: string;
}

export interface UpdateGroupPayload {
  chatId: string;
  name?: string;
  description?: string;
  avatar?: string;
}

export interface AddParticipantsPayload {
  chatId: string;
  userIds: string[];
}

export interface RemoveParticipantPayload {
  chatId: string;
  userId: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface MessagesResponse extends PaginatedResponse<Message> {}

export interface ChatsResponse extends PaginatedResponse<Chat> {}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthState {
  isAuthenticated: boolean;
  user: CurrentUser | null;
  token: string | null;
  isConnecting: boolean;
  error: string | null;
}

export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface UIState {
  isMobile: boolean;
  sidebarOpen: boolean;
  activeModal: ModalType | null;
  selectedChat: string | null;
  selectedUsers: string[];
  drawerOpen: boolean;
  drawerContent: DrawerContent | null;
}

export type ModalType = 'createGroup' | 'editGroup' | 'profile' | 'settings';
export type DrawerContent = 'groupMembers' | 'chatInfo' | 'profile';

// ============================================================================
// Store Types
// ============================================================================

export interface ChatState {
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  users: Record<string, User>;
  typingIndicators: Record<string, TypingIndicator[]>;
  loading: {
    chats: boolean;
    messages: Record<string, boolean>;
  };
  error: string | null;
}

// ============================================================================
// Encryption Types
// ============================================================================

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag?: string;
}

export interface DecryptedData {
  content: string;
}

export interface EncryptionKeyPair {
  publicKey: string;
  privateKey: string;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'encrypting' | 'complete' | 'error';
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================================
// Network Types
// ============================================================================

export interface NetworkConfig {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}
