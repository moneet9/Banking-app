// ============================================================================
// Client-Side Encryption Utilities
// ============================================================================

import type { EncryptedData, DecryptedData } from '../types';
import { ENCRYPTION_CONFIG } from '../config/constants';

// ============================================================================
// Key Management
// ============================================================================

/**
 * Generate a random encryption key for a chat room
 */
export async function generateRoomKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: ENCRYPTION_CONFIG.ALGORITHM,
      length: ENCRYPTION_CONFIG.KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import a base64 room key
 */
export async function importRoomKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyBase64);
  
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    {
      name: ENCRYPTION_CONFIG.ALGORITHM,
      length: ENCRYPTION_CONFIG.KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// ============================================================================
// Encryption Functions
// ============================================================================

/**
 * Encrypt text content with AES-GCM
 */
export async function encryptMessage(
  content: string,
  roomKeyBase64: string
): Promise<EncryptedData> {
  try {
    const key = await importRoomKey(roomKeyBase64);
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH));
    const encodedContent = new TextEncoder().encode(content);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      key,
      encodedContent
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypt text content with AES-GCM
 */
export async function decryptMessage(
  encrypted: EncryptedData,
  roomKeyBase64: string
): Promise<DecryptedData> {
  try {
    const key = await importRoomKey(roomKeyBase64);
    const iv = base64ToArrayBuffer(encrypted.iv);
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      key,
      ciphertext
    );

    const content = new TextDecoder().decode(decrypted);

    return { content };
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

// ============================================================================
// File Encryption
// ============================================================================

/**
 * Encrypt file data
 */
export async function encryptFile(
  fileData: ArrayBuffer,
  roomKeyBase64: string
): Promise<EncryptedData> {
  try {
    const key = await importRoomKey(roomKeyBase64);
    const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.IV_LENGTH));

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      key,
      fileData
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt file data
 */
export async function decryptFile(
  encrypted: EncryptedData,
  roomKeyBase64: string
): Promise<ArrayBuffer> {
  try {
    const key = await importRoomKey(roomKeyBase64);
    const iv = base64ToArrayBuffer(encrypted.iv);
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_CONFIG.ALGORITHM,
        iv,
      },
      key,
      ciphertext
    );

    return decrypted;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================================================
// Format Encrypted Payload
// ============================================================================

/**
 * Format encrypted data for API transmission
 */
export function formatEncryptedPayload(encrypted: EncryptedData): string {
  return JSON.stringify(encrypted);
}

/**
 * Parse encrypted payload from API
 */
export function parseEncryptedPayload(payload: string): EncryptedData {
  try {
    const parsed = JSON.parse(payload);
    if (!parsed.ciphertext || !parsed.iv) {
      throw new Error('Invalid encrypted payload format');
    }
    return parsed as EncryptedData;
  } catch (error) {
    console.error('Failed to parse encrypted payload:', error);
    throw new Error('Invalid encrypted data');
  }
}

// ============================================================================
// Key Storage
// ============================================================================

/**
 * Store room key in local storage (encrypted with user's key in production)
 */
export function storeRoomKey(chatId: string, key: string): void {
  try {
    const keys = getRoomKeys();
    keys[chatId] = key;
    localStorage.setItem('web3chat_chat_keys', JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to store room key:', error);
  }
}

/**
 * Retrieve room key from local storage
 */
export function getRoomKey(chatId: string): string | null {
  try {
    const keys = getRoomKeys();
    return keys[chatId] || null;
  } catch (error) {
    console.error('Failed to retrieve room key:', error);
    return null;
  }
}

/**
 * Get all stored room keys
 */
function getRoomKeys(): Record<string, string> {
  try {
    const stored = localStorage.getItem('web3chat_chat_keys');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to get room keys:', error);
    return {};
  }
}

/**
 * Delete room key from storage
 */
export function deleteRoomKey(chatId: string): void {
  try {
    const keys = getRoomKeys();
    delete keys[chatId];
    localStorage.setItem('web3chat_chat_keys', JSON.stringify(keys));
  } catch (error) {
    console.error('Failed to delete room key:', error);
  }
}
