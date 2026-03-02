// ============================================================================
// Group Members Drawer
// ============================================================================

import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Users, Crown, Shield } from 'lucide-react';
import { getInitials, formatAddress, getStatusColor } from '../../utils/format';
import type { GroupChat } from '../../types';

export function GroupMembersDrawer() {
  const { drawerOpen, drawerContent, closeDrawer, selectedChat } = useUIStore();
  const chats = useChatStore((state) => state.chats);
  const { user: currentUser } = useAuthStore();

  const isOpen = drawerOpen && drawerContent === 'groupMembers';
  const chat = selectedChat ? chats[selectedChat] : null;

  if (!chat || chat.type !== 'group') return null;

  const groupChat = chat as GroupChat;
  const isAdmin = groupChat.admins.includes(currentUser?.id || '');

  return (
    <Sheet open={isOpen} onOpenChange={closeDrawer}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Group Members
          </SheetTitle>
          <SheetDescription>{groupChat.name}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Group Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-center mb-3">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                {groupChat.avatar ? (
                  <img
                    src={groupChat.avatar}
                    alt={groupChat.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-10 h-10 text-indigo-600" />
                )}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-center">{groupChat.name}</h3>
            
            {groupChat.description && (
              <p className="text-sm text-gray-600 text-center">
                {groupChat.description}
              </p>
            )}

            <p className="text-sm text-gray-500 text-center pt-2">
              {groupChat.participants.length} members
            </p>
          </div>

          {/* Members List */}
          <div>
            <h4 className="font-semibold mb-3">Members</h4>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {groupChat.participantDetails?.map((member) => {
                  const isGroupAdmin = groupChat.admins.includes(member.id);
                  const isCreator = groupChat.createdBy === member.id;
                  const isCurrentUser = member.id === currentUser?.id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-white border rounded-lg"
                    >
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {getInitials(member.username || member.address)}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Status indicator */}
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${getStatusColor(
                            member.status
                          )}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate">
                            {member.username}
                            {isCurrentUser && ' (You)'}
                          </p>
                          
                          {isCreator && (
                            <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" title="Creator" />
                          )}
                          
                          {isGroupAdmin && !isCreator && (
                            <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Admin" />
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 truncate">
                          {formatAddress(member.address)}
                        </p>
                      </div>

                      <Badge
                        variant={member.status === 'online' ? 'default' : 'secondary'}
                        className="text-xs capitalize"
                      >
                        {member.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" disabled>
                Add Members (Coming Soon)
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
