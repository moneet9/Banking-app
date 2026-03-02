// ============================================================================
// Input Validation and Sanitization Utilities
// ============================================================================

import type { ValidationResult } from '../types';
import { FILE_CONFIG, CHAT_CONFIG } from '../config/constants';

// ============================================================================
// Text Validation
// ============================================================================

/**
 * Validate and sanitize text input
 */
export function validateText(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (text.length > CHAT_CONFIG.MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message exceeds ${CHAT_CONFIG.MAX_MESSAGE_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize text input (prevent XSS)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validate file upload
 */
export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > FILE_CONFIG.MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${FILE_CONFIG.MAX_SIZE / 1024 / 1024}MB limit`,
    };
  }

  // Check file type
  if (!FILE_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    };
  }

  return { valid: true };
}

/**
 * Validate image file
 */
export function validateImage(file: File): ValidationResult {
  const fileValidation = validateFile(file);
  if (!fileValidation.valid) {
    return fileValidation;
  }

  if (!FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only image files are allowed',
    };
  }

  return { valid: true };
}

/**
 * Get safe file name
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}

// ============================================================================
// Group Validation
// ============================================================================

/**
 * Validate group name
 */
export function validateGroupName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Group name cannot be empty' };
  }

  if (name.length > CHAT_CONFIG.MAX_GROUP_NAME_LENGTH) {
    return {
      valid: false,
      error: `Group name exceeds ${CHAT_CONFIG.MAX_GROUP_NAME_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate group description
 */
export function validateGroupDescription(description: string): ValidationResult {
  if (description && description.length > CHAT_CONFIG.MAX_GROUP_DESCRIPTION_LENGTH) {
    return {
      valid: false,
      error: `Description exceeds ${CHAT_CONFIG.MAX_GROUP_DESCRIPTION_LENGTH} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate participants count
 */
export function validateParticipantsCount(count: number): ValidationResult {
  if (count < 2) {
    return { valid: false, error: 'At least 2 participants required' };
  }

  if (count > CHAT_CONFIG.MAX_PARTICIPANTS) {
    return {
      valid: false,
      error: `Maximum ${CHAT_CONFIG.MAX_PARTICIPANTS} participants allowed`,
    };
  }

  return { valid: true };
}

// ============================================================================
// Ethereum Address Validation
// ============================================================================

/**
 * Validate Ethereum address
 */
export function validateEthereumAddress(address: string): ValidationResult {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (!addressRegex.test(address)) {
    return { valid: false, error: 'Invalid Ethereum address' };
  }

  return { valid: true };
}

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): ValidationResult {
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Invalid URL protocol' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ============================================================================
// General Sanitization
// ============================================================================

/**
 * Remove dangerous characters from input
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
