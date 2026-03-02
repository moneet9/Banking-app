import { useEffect, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { Sidebar } from '../components/layout/Sidebar';
import { ChatWindow } from '../components/chat/ChatWindow';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function ChatLayout() {
  const { isConnected } = useAccount();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore(); // Mock auth check
  const { activeConversationId, setActiveConversation } = useChatStore();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected && !isAuthenticated && !isAuthLoading) {
      navigate('/login');
    }
  }, [isConnected, isAuthenticated, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex h-screen w-screen bg-background overflow-hidden">
        {activeConversationId ? (
          <div className="flex-1 flex flex-col h-full w-full">
             <div className="p-2 border-b flex items-center">
               <button 
                 onClick={() => setActiveConversation(null)}
                 className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground"
               >
                 ← Back
               </button>
             </div>
             <ChatWindow />
          </div>
        ) : (
          <div className="flex-1 h-full w-full">
            <Sidebar />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      <PanelGroup direction="horizontal">
        <Panel defaultSize={25} minSize={20} maxSize={40} className="border-r">
          <Sidebar />
        </Panel>
        <PanelResizeHandle className="w-1 bg-border/50 hover:bg-primary/50 transition-colors" />
        <Panel className="flex-1">
          <ChatWindow />
        </Panel>
      </PanelGroup>
    </div>
  );
}
