import { PlusCircle, Search, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatList } from './ChatList';
import { ConnectButton } from '../web3/ConnectButton';

export function Sidebar() {
  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b bg-background/50 backdrop-blur sticky top-0 z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
          Web3 Chat
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <PlusCircle className="w-5 h-5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-background/50">
        <Input 
          placeholder="Search chats..." 
          leftIcon={<Search className="w-4 h-4" />}
          className="bg-muted/50 border-none focus-visible:ring-1"
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        <ChatList />
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t bg-background/80 backdrop-blur sticky bottom-0">
        <ConnectButton />
      </div>
    </div>
  );
}
