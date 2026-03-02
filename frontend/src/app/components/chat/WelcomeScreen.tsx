// ============================================================================
// Welcome Screen - Shown when no chat is selected
// ============================================================================

import { useUIStore } from '../../store/useUIStore';
import { Button } from '../ui/button';
import { MessageSquare, Lock, Zap, Users } from 'lucide-react';

export function WelcomeScreen() {
  const { openModal } = useUIStore();

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl mb-6">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-3">Welcome to Web3 Chat</h2>
        <p className="text-gray-600 mb-8">
          Start a conversation and experience secure, encrypted messaging on the blockchain
        </p>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => openModal('createGroup')}
          className="mb-12"
        >
          <Users className="w-5 h-5 mr-2" />
          Start a Conversation
        </Button>

        {/* Features */}
        <div className="grid gap-4 text-left">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">End-to-End Encrypted</h3>
              <p className="text-sm text-gray-600">
                Your messages are encrypted locally before being sent
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Real-time Delivery</h3>
              <p className="text-sm text-gray-600">
                Messages are delivered instantly through WebSocket
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Group Conversations</h3>
              <p className="text-sm text-gray-600">
                Create groups and chat with multiple people at once
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
