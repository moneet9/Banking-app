import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarFallback } from '../../utils/format';
import { Loader2, Video, Phone, Info } from 'lucide-react';
import { Button } from '../ui/button';

export function ChatWindow() {
  const { 
    activeConversationId, 
    conversations, 
    messages, 
    isLoading, 
    sendMessage,
    initializeSocket,
    disconnectSocket
  } = useChatStore();
  
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  // Initialize socket on mount/user change
  useEffect(() => {
    if (user) {
      initializeSocket(user);
    }
    return () => {
      disconnectSocket();
    };
  }, [user]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const currentMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && isScrolledToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, isScrolledToBottom]);

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl">👋</span>
          </div>
          <h2 className="text-xl font-semibold">Welcome to Web3 Chat</h2>
          <p className="text-muted-foreground max-w-sm">
            Select a conversation from the sidebar to start encrypted messaging.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      setIsScrolledToBottom(isBottom);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={activeConversation.avatarUrl} />
            <AvatarFallback>{getAvatarFallback(activeConversation.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">
              {activeConversation.name || 'Chat'}
            </h3>
            <span className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Encrypted Connection
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Info className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
            <div className="p-4 rounded-full bg-muted/50">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-sm">Messages are end-to-end encrypted.</p>
            <p className="text-xs opacity-50">No one outside of this chat, not even the server, can read them.</p>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isMe={msg.senderId === 'me' || msg.senderId === user?.id}
              sender={activeConversation.participants.find(p => p.id === msg.senderId)}
            />
          ))
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={sendMessage} />
    </div>
  );
}
