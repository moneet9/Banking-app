// ============================================================================
// Formatting Utilities
// ============================================================================

import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

// ============================================================================
// Date/Time Formatting
// ============================================================================

/**
 * Format timestamp for message display
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return format(date, 'HH:mm');
  }

  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`;
  }

  return format(date, 'MMM d, HH:mm');
}

/**
 * Format timestamp for chat list
 */
export function formatChatTime(timestamp: number): string {
  const date = new Date(timestamp);

  if (isToday(date)) {
    return format(date, 'HH:mm');
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return format(date, 'EEEE');
  }

  return format(date, 'MMM d');
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * Format full date and time
 */
export function formatFullDateTime(timestamp: number): string {
  return format(new Date(timestamp), 'PPpp');
}

// ============================================================================
// Address Formatting
// ============================================================================

/**
 * Format Ethereum address (shortened)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format full Ethereum address
 */
export function formatFullAddress(address: string): string {
  if (!address) return '';
  return address.toLowerCase();
}

// ============================================================================
// File Size Formatting
// ============================================================================

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format unread count (e.g., "99+")
 */
export function formatUnreadCount(count: number): string {
  if (count === 0) return '';
  if (count > 99) return '99+';
  return count.toString();
}

/**
 * Format participant count
 */
export function formatParticipantCount(count: number): string {
  if (count === 0) return 'No participants';
  if (count === 1) return '1 participant';
  return `${count} participants`;
}

// ============================================================================
// Text Formatting
// ============================================================================

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format username from address (if no username)
 */
export function formatUsername(address: string, username?: string): string {
  if (username) return username;
  return formatAddress(address, 4);
}

/**
 * Get initials from username or address
 */
export function getInitials(text: string): string {
  if (!text) return '??';
  
  const parts = text.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  
  return text.slice(0, 2).toUpperCase();
}

// ============================================================================
// Message Formatting
// ============================================================================

/**
 * Format message preview for chat list
 */
export function formatMessagePreview(
  type: string,
  content?: string,
  fileName?: string
): string {
  switch (type) {
    case 'text':
      return truncateText(content || '', 50);
    case 'image':
      return '📷 Image';
    case 'file':
      return `📎 ${fileName || 'File'}`;
    default:
      return 'Message';
  }
}

/**
 * Format typing indicator text
 */
export function formatTypingText(usernames: string[]): string {
  if (usernames.length === 0) return '';
  if (usernames.length === 1) return `${usernames[0]} is typing...`;
  if (usernames.length === 2) return `${usernames[0]} and ${usernames[1]} are typing...`;
  return `${usernames[0]} and ${usernames.length - 1} others are typing...`;
}

// ============================================================================
// Status Formatting
// ============================================================================

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-yellow-500';
    case 'offline':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Get message status icon
 */
export function getMessageStatusIcon(status: string): string {
  switch (status) {
    case 'sending':
      return '○';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'failed':
      return '✕';
    default:
      return '';
  }
}
