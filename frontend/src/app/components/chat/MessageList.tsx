// ============================================================================
// Message List with Virtual Scrolling
// ============================================================================

import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { ScrollArea } from '../ui/scroll-area';
import { formatMessageTime } from '../../utils/format';

interface MessageListProps {
  messages: Message[];
  chatId: string;
}

export function MessageList({ messages, chatId }: MessageListProps) {
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Only scroll if it's a new message
    if (lastMessage.id !== lastMessageRef.current) {
      lastMessageRef.current = lastMessage.id;
      
      // Scroll to bottom
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const container = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      });
    }
  }, [messages]);

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp).toLocaleDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({ date: messageDate, messages: [] });
      }

      groups[groups.length - 1].messages.push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="mb-2">No messages yet</p>
          <p className="text-sm">Send a message to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="h-full">
      <div className="px-4 py-6 space-y-4">
        {messageGroups.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date Divider */}
            <div className="flex items-center justify-center my-6">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDateDivider(group.date)}
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {group.messages.map((message, index) => {
                const isOwn = message.senderId === user?.id;
                const prevMessage = index > 0 ? group.messages[index - 1] : null;
                const nextMessage =
                  index < group.messages.length - 1 ? group.messages[index + 1] : null;

                const showAvatar =
                  !nextMessage || nextMessage.senderId !== message.senderId;
                const showName =
                  !isOwn &&
                  (!prevMessage || prevMessage.senderId !== message.senderId);

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    showName={showName}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Helper function to format date divider
function formatDateDivider(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toLocaleDateString() === today.toLocaleDateString()) {
    return 'Today';
  }

  if (date.toLocaleDateString() === yesterday.toLocaleDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}
