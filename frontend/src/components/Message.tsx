import React from 'react';

interface MessageProps {
  sender: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

/**
 * Parse text and convert **bold** markers to <strong> elements
 */
function parseFormattedText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the bold text
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Render message content with line breaks and bold text support
 */
function renderContent(content: string): React.ReactNode {
  const lines = content.split('\n');
  
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {parseFormattedText(line)}
      {lineIndex < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

export function Message({ sender, content, timestamp }: MessageProps) {
  const isUser = sender === 'user';

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-ai'}`}>
      <div className="message-avatar">
        {isUser ? (
          <div className="avatar avatar-user">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        ) : (
          <div className="avatar avatar-ai">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
        )}
      </div>
      <div className="message-content">
        <div className="message-bubble">
          {renderContent(content)}
        </div>
        {timestamp && (
          <span className="message-time">
            {new Date(timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  );
}
