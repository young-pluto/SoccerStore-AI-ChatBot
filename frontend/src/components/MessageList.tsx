import { useRef, useEffect } from 'react';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';

interface MessageData {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  createdAt: string;
}

interface MessageListProps {
  messages: MessageData[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="message-list">
      {messages.length === 0 && !isLoading && (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>Loading conversation...</p>
        </div>
      )}
      
      {messages.map((msg) => (
        <Message
          key={msg.id}
          sender={msg.sender}
          content={msg.content}
          timestamp={msg.createdAt}
        />
      ))}
      
      {isLoading && (
        <TypingIndicator />
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}
