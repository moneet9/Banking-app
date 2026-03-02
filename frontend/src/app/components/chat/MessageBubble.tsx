// ============================================================================
// Message Bubble Component
// ============================================================================

import { useChatStore } from '../../store/useChatStore';
import type { Message } from '../../types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';
import { formatMessageTime, getInitials, getMessageStatusIcon } from '../../utils/format';
import { FileText, ImageIcon, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showName,
}: MessageBubbleProps) {
  const users = useChatStore((state) => state.users);
  const sender = users[message.senderId];

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="whitespace-pre-wrap break-words">
            {(message as any).content || '[Encrypted]'}
          </p>
        );

      case 'image':
        const imageMessage = message as any;
        return (
          <div className="space-y-2">
            {imageMessage.url ? (
              <img
                src={imageMessage.url}
                alt={imageMessage.fileName}
                className="rounded-lg max-w-sm w-full h-auto"
              />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <ImageIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm">{imageMessage.fileName}</span>
              </div>
            )}
          </div>
        );

      case 'file':
        const fileMessage = message as any;
        return (
          <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg min-w-[200px]">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{fileMessage.fileName}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(fileMessage.fileSize)}
              </p>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">Unsupported message type</p>;
    }
  };

  return (
    <div className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8">
        {showAvatar && !isOwn && (
          <Avatar className="w-8 h-8">
            <AvatarImage src={sender?.avatar} />
            <AvatarFallback className="text-xs">
              {getInitials(sender?.username || sender?.address || '')}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col max-w-[70%] md:max-w-[50%]',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* Sender Name */}
        {showName && !isOwn && (
          <p className="text-xs text-gray-600 mb-1 px-3">
            {sender?.username || 'Unknown'}
          </p>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2 shadow-sm',
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-white border border-gray-200 rounded-bl-md'
          )}
        >
          {renderContent()}

          {/* Status & Time */}
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1 text-xs',
              isOwn ? 'text-indigo-100 justify-end' : 'text-gray-500'
            )}
          >
            <span>{formatMessageTime(message.timestamp)}</span>
            {isOwn && (
              <span className="flex items-center">
                {message.status === 'failed' ? (
                  <AlertCircle className="w-3 h-3 text-red-300" />
                ) : (
                  <span>{getMessageStatusIcon(message.status)}</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
