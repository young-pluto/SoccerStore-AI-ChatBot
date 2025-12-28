import { useChat } from '../hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { QuickQuestions } from './QuickQuestions';

export function ChatWidget() {
  const { messages, isLoading, error, sendUserMessage, clearChat, clearError } = useChat();

  // Show quick questions only when there's just the welcome message (1 AI message)
  const showQuickQuestions = messages.length === 1 && messages[0]?.sender === 'ai';

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 2a10 10 0 0 0-7.07 2.93L12 12l7.07-7.07A10 10 0 0 0 12 2z" opacity="0.7"/>
              <path d="M12 22a10 10 0 0 0 7.07-2.93L12 12l-7.07 7.07A10 10 0 0 0 12 22z" opacity="0.7"/>
            </svg>
          </div>
          <div className="chat-header-text">
            <h1>11Yards</h1>
            <span className="chat-status">
              <span className="status-dot"></span>
              Online
            </span>
          </div>
        </div>
        <button 
          className="chat-header-action"
          onClick={clearChat}
          title="Start new conversation"
          aria-label="Start new conversation"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="chat-error">
          <span>{error}</span>
          <button onClick={clearError} aria-label="Dismiss error">×</button>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Quick Questions */}
      <QuickQuestions
        onSelect={sendUserMessage}
        disabled={isLoading}
        visible={showQuickQuestions}
      />

      {/* Input */}
      <ChatInput
        onSend={sendUserMessage}
        disabled={isLoading}
        placeholder="Ask about jerseys, shipping, size guide..."
      />
    </div>
  );
}
