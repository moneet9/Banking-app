// ============================================================================
// Chat Header
// ============================================================================

import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import type { Chat } from '../../types';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ArrowLeft, Users, MoreVertical, Info } from 'lucide-react';
import { formatAddress, getInitials } from '../../utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface ChatHeaderProps {
  chat: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  const { user: currentUser } = useAuthStore();
  const { setSelectedChat, openDrawer, isMobile } = useUIStore();

  // Get chat display info
  const getChatInfo = () => {
    if (chat.type === 'group') {
      return {
        name: chat.name,
        avatar: chat.avatar,
        subtitle: `${chat.participants.length} members`,
        status: null,
      };
    }

    // Direct chat - show other participant
    const otherParticipant = chat.participantDetails?.find(
      (p) => p.id !== currentUser?.id
    );

    return {
      name: otherParticipant?.username || 'Unknown',
      avatar: otherParticipant?.avatar,
      subtitle: formatAddress(otherParticipant?.address || ''),
      status: otherParticipant?.status,
    };
  };

  const { name, avatar, subtitle, status } = getChatInfo();

  return (
    <div className="h-16 border-b px-4 flex items-center gap-3 bg-white">
      {/* Back button (mobile) */}
      {isMobile && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setSelectedChat(null)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10 cursor-pointer" onClick={() => openDrawer(chat.type === 'group' ? 'groupMembers' : 'chatInfo')}>
          <AvatarImage src={avatar} />
          <AvatarFallback>
            {chat.type === 'group' ? (
              <Users className="w-5 h-5 text-gray-500" />
            ) : (
              getInitials(name)
            )}
          </AvatarFallback>
        </Avatar>

        {/* Online status */}
        {status === 'online' && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openDrawer(chat.type === 'group' ? 'groupMembers' : 'chatInfo')}>
        <h2 className="font-semibold truncate">{name}</h2>
        <p className="text-sm text-gray-500 truncate">
          {status === 'online' ? 'Online' : subtitle}
        </p>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openDrawer(chat.type === 'group' ? 'groupMembers' : 'chatInfo')}>
            <Info className="w-4 h-4 mr-2" />
            {chat.type === 'group' ? 'Group Info' : 'Chat Info'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
