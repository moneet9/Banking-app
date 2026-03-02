// ============================================================================
// Chat Input Component
// ============================================================================

import { useState, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Paperclip, Image as ImageIcon, Smile } from 'lucide-react';
import { validateText, validateFile, sanitizeText } from '../../utils/validation';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

interface ChatInputProps {
  chatId: string;
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export function ChatInput({ chatId, onSendMessage, onTyping }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Typing indicator
    if (value && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 1000);
  };

  // Handle send
  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    // Validate
    const validation = validateText(trimmedMessage);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    // Sanitize and send
    const sanitized = sanitizeText(trimmedMessage);
    onSendMessage(sanitized);

    // Clear input
    setMessage('');
    setIsTyping(false);
    onTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Focus textarea
    textareaRef.current?.focus();
  }, [message, onSendMessage, onTyping]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle file upload (placeholder - actual implementation would upload & encrypt)
  const handleFileSelect = (type: 'file' | 'image') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : '*/*';
    
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      // TODO: Implement file upload & encryption
      toast.info('File upload coming soon!');
    };

    input.click();
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        {/* Actions */}
        <div className="flex gap-1 mb-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => handleFileSelect('image')}
            title="Send image"
          >
            <ImageIcon className="w-5 h-5 text-gray-500" />
          </Button>
          
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => handleFileSelect('file')}
            title="Send file"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
        </div>

        {/* Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-[120px] resize-none pr-10"
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim()}
          size="icon"
          className={cn(
            'flex-shrink-0 h-11 w-11 mb-0.5',
            !message.trim() && 'opacity-50'
          )}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {/* Character count for long messages */}
      {message.length > 4000 && (
        <p className="text-xs text-gray-500 mt-1 text-right">
          {message.length} / 5000
        </p>
      )}
    </div>
  );
}
