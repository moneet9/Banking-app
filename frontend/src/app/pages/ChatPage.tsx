// ============================================================================
// Chat Page - Main chat interface
// ============================================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useChat } from '../hooks/useChat';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatRoom } from '../components/chat/ChatRoom';
import { CreateGroupModal } from '../components/modals/CreateGroupModal';
import { GroupMembersDrawer } from '../components/drawers/GroupMembersDrawer';
import { ProfileDrawer } from '../components/drawers/ProfileDrawer';
import { WelcomeScreen } from '../components/chat/WelcomeScreen';
import { Loader2 } from 'lucide-react';

export function ChatPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { selectedChat, isMobile } = useUIStore();
  const { isInitialized, loading } = useChat();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Setup responsive listener
  useEffect(() => {
    const handleResize = () => {
      useUIStore.getState().setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isInitialized) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar - hidden on mobile when chat is selected */}
      <div
        className={`${
          isMobile && selectedChat ? 'hidden' : 'flex'
        } ${isMobile ? 'w-full' : 'w-80'} flex-col border-r bg-white`}
      >
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div
        className={`${
          isMobile && !selectedChat ? 'hidden' : 'flex'
        } flex-1 flex-col`}
      >
        {selectedChat ? <ChatRoom chatId={selectedChat} /> : <WelcomeScreen />}
      </div>

      {/* Modals & Drawers */}
      <CreateGroupModal />
      <GroupMembersDrawer />
      <ProfileDrawer />
    </div>
  );
}
