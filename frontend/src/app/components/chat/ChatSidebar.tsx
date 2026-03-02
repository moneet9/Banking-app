// ============================================================================
// Chat Sidebar - List of conversations
// ============================================================================

import { useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';
import { useWeb3Auth } from '../../hooks/useWeb3Auth';
import { ChatListItem } from './ChatListItem';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { MessageSquarePlus, Search, MoreVertical, LogOut, User } from 'lucide-react';
import { formatAddress, getInitials } from '../../utils/format';

export function ChatSidebar() {
  const chats = useChatStore((state) => Object.values(state.chats));
  const { openModal, openDrawer } = useUIStore();
  const { user, signOut } = useWeb3Auth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    
    if (chat.type === 'group') {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Filter direct chats by participant username/address
    return chat.participantDetails?.some((p) =>
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Messages</h1>
          
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openModal('createGroup')}
              title="New Chat"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback>
                      {getInitials(user?.username || user?.address || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="font-medium text-sm">{user?.username || 'You'}</p>
                  <p className="text-xs text-gray-500">
                    {formatAddress(user?.address || '')}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openDrawer('profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquarePlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery ? 'No chats found' : 'No conversations yet'}
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={() => openModal('createGroup')}
                className="mt-2"
              >
                Start a conversation
              </Button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
