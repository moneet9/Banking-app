// ============================================================================
// Chat List Item - Individual chat in sidebar
// ============================================================================

import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import type { Chat } from '../../types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import {
  formatChatTime,
  formatMessagePreview,
  formatUnreadCount,
  getInitials,
} from '../../utils/format';
import { Users } from 'lucide-react';

interface ChatListItemProps {
  chat: Chat;
}

export function ChatListItem({ chat }: ChatListItemProps) {
  const { user: currentUser } = useAuthStore();
  const { selectedChat, setSelectedChat } = useUIStore();

  const isSelected = selectedChat === chat.id;

  // Get chat display info
  const getChatInfo = () => {
    if (chat.type === 'group') {
      return {
        name: chat.name,
        avatar: chat.avatar,
        subtitle: `${chat.participants.length} members`,
      };
    }

    // Direct chat - show other participant
    const otherParticipant = chat.participantDetails?.find(
      (p) => p.id !== currentUser?.id
    );

    return {
      name: otherParticipant?.username || 'Unknown',
      avatar: otherParticipant?.avatar,
      subtitle: otherParticipant?.address,
    };
  };

  const { name, avatar, subtitle } = getChatInfo();
  const unreadCount = formatUnreadCount(chat.unreadCount);

  return (
    <button
      onClick={() => setSelectedChat(chat.id)}
      className={cn(
        'w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left',
        isSelected && 'bg-indigo-50 hover:bg-indigo-50'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarImage src={avatar} />
          <AvatarFallback>
            {chat.type === 'group' ? (
              <Users className="w-6 h-6 text-gray-500" />
            ) : (
              getInitials(name)
            )}
          </AvatarFallback>
        </Avatar>
        
        {/* Online indicator for direct chats */}
        {chat.type === 'direct' && chat.participantDetails?.[0]?.status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3
            className={cn(
              'font-semibold truncate',
              isSelected && 'text-indigo-600'
            )}
          >
            {name}
          </h3>
          {chat.lastMessageTime > 0 && (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
              {formatChatTime(chat.lastMessageTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-gray-600 truncate flex-1">
            {chat.lastMessage
              ? formatMessagePreview(
                  chat.lastMessage.type,
                  (chat.lastMessage as any).content,
                  (chat.lastMessage as any).fileName
                )
              : subtitle}
          </p>
          
          {/* Unread badge */}
          {unreadCount && (
            <Badge
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-600 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
