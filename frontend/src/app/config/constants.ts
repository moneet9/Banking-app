// ============================================================================
// Application Constants
// ============================================================================

import type { NetworkConfig } from '../types';

// ============================================================================
// Environment Variables
// ============================================================================

export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
} as const;

// ============================================================================
// Network Configuration
// ============================================================================

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    chainName: 'Sepolia',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  // Polygon Mumbai Testnet
  80001: {
    chainId: 80001,
    chainName: 'Polygon Mumbai',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  // Goerli Testnet
  5: {
    chainId: 5,
    chainName: 'Goerli',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://goerli.infura.io/v3/'],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  },
};

export const DEFAULT_CHAIN_ID = 11155111; // Sepolia

// ============================================================================
// SIWE Configuration
// ============================================================================

export const SIWE_CONFIG = {
  domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
  statement: 'Sign in with Ethereum to the Web3 Chat dApp',
  version: '1',
  uri: ENV.APP_URL,
} as const;

// ============================================================================
// Chat Configuration
// ============================================================================

export const CHAT_CONFIG = {
  MESSAGE_BATCH_SIZE: 50,
  TYPING_TIMEOUT: 3000, // 3 seconds
  MAX_MESSAGE_LENGTH: 5000,
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_GROUP_DESCRIPTION_LENGTH: 200,
  MAX_PARTICIPANTS: 100,
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 2000,
} as const;

// ============================================================================
// File Upload Configuration
// ============================================================================

export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
} as const;

// ============================================================================
// Encryption Configuration
// ============================================================================

export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
  TAG_LENGTH: 128,
} as const;

// ============================================================================
// UI Configuration
// ============================================================================

export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  SCROLL_THRESHOLD: 100,
} as const;

// ============================================================================
// Local Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'web3chat_auth_token',
  USER_ADDRESS: 'web3chat_user_address',
  ENCRYPTION_KEY: 'web3chat_encryption_key',
  CHAT_KEYS: 'web3chat_chat_keys',
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  WALLET_NOT_FOUND: 'MetaMask not found. Please install MetaMask.',
  WALLET_REJECTED: 'Connection rejected by user.',
  WRONG_NETWORK: 'Please connect to a supported testnet.',
  SIGNATURE_REJECTED: 'Signature rejected by user.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  MESSAGE_SEND_FAILED: 'Failed to send message.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_CONFIG.MAX_SIZE / 1024 / 1024}MB limit.`,
  FILE_TYPE_NOT_ALLOWED: 'File type not allowed.',
  ENCRYPTION_FAILED: 'Failed to encrypt message.',
  DECRYPTION_FAILED: 'Failed to decrypt message.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SOCKET_DISCONNECTED: 'Lost connection to server.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully.',
  MESSAGE_SENT: 'Message sent.',
  GROUP_CREATED: 'Group created successfully.',
  GROUP_UPDATED: 'Group updated successfully.',
  MEMBER_ADDED: 'Member added to group.',
  MEMBER_REMOVED: 'Member removed from group.',
} as const;
