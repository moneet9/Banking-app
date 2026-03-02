import { useEffect } from 'react';
import { useChatStore } from '../../store/chatStore';
import { ChatListItem } from './ChatListItem';

export function ChatList() {
  const { conversations, activeConversationId, setActiveConversation, isLoading } = useChatStore();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
        <p>No conversations yet.</p>
        <p className="text-sm">Start a new chat!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2 overflow-y-auto h-full">
      {conversations.map((conversation) => (
        <div key={conversation.id} onClick={() => setActiveConversation(conversation.id)}>
          <ChatListItem
            conversation={conversation}
            isActive={activeConversationId === conversation.id}
          />
        </div>
      ))}
    </div>
  );
}
