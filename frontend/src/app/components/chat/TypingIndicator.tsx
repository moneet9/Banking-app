// ============================================================================
// Typing Indicator Component
// ============================================================================

import { useChatStore } from '../../store/useChatStore';
import { formatTypingText } from '../../utils/format';
import { motion, AnimatePresence } from 'motion/react';

interface TypingIndicatorProps {
  chatId: string;
}

export function TypingIndicator({ chatId }: TypingIndicatorProps) {
  const typingIndicators = useChatStore(
    (state) => state.typingIndicators[chatId] || []
  );

  const usernames = typingIndicators
    .filter((indicator) => indicator.timestamp > 0)
    .map((indicator) => indicator.username);

  if (usernames.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-lg flex items-center gap-2"
      >
        <div className="flex gap-1">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            className="w-2 h-2 bg-gray-400 rounded-full"
          />
        </div>
        <span className="text-sm text-gray-600">{formatTypingText(usernames)}</span>
      </motion.div>
    </AnimatePresence>
  );
}
