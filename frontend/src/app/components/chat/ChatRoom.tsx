// ============================================================================
// Chat Room - Main message area
// ============================================================================

import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useChat } from '../../hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { Loader2 } from 'lucide-react';

interface ChatRoomProps {
  chatId: string;
}

export function ChatRoom({ chatId }: ChatRoomProps) {
  const chat = useChatStore((state) => state.chats[chatId]);
  const messages = useChatStore((state) => state.messages[chatId] || []);
  const loading = useChatStore((state) => state.loading.messages[chatId]);
  const { user } = useAuthStore();
  const { loadMessages, sendMessage, sendTyping } = useChat();
  
  const hasLoadedRef = useRef(false);

  // Load messages when chat opens
  useEffect(() => {
    if (chatId && !hasLoadedRef.current) {
      loadMessages(chatId);
      hasLoadedRef.current = true;
    }

    return () => {
      hasLoadedRef.current = false;
    };
  }, [chatId, loadMessages]);

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Chat not found</p>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <ChatHeader chat={chat} />

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <MessageList messages={messages} chatId={chatId} />
        
        {/* Typing Indicator */}
        <TypingIndicator chatId={chatId} />
      </div>

      {/* Input */}
      <ChatInput
        chatId={chatId}
        onSendMessage={(content) => sendMessage(chatId, content)}
        onTyping={(isTyping) => sendTyping(chatId, isTyping)}
      />
    </div>
  );
}
