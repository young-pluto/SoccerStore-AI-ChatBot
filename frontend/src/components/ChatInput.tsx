import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  placeholder?: string;
}

/**
 * Detect if we're on a mobile device
 * Used to prevent auto-focus on mobile which can cause keyboard to pop up unexpectedly
 */
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 520;
};

export function ChatInput({ onSend, disabled, placeholder = 'Type your message...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount - but only on desktop to avoid keyboard popping up on mobile
  useEffect(() => {
    if (!isMobile()) {
      inputRef.current?.focus();
    }
  }, []);

  // Refocus after sending - on all platforms
  useEffect(() => {
    if (!disabled && inputRef.current) {
      // On mobile, the keyboard should already be open, so refocus is fine
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;
    
    onSend(trimmedMessage);
    setMessage('');
    
    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  // Auto-resize textarea
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = 'auto';
    // Set height to scrollHeight (capped at max-height via CSS)
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }, []);

  // Handle focus - ensure the input stays visible when keyboard opens
  const handleFocus = useCallback(() => {
    // Small delay to let the visual viewport update
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }, []);

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="chat-input-field"
        aria-label="Chat message input"
        // Mobile keyboard optimizations
        enterKeyHint="send"
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck="true"
        // Prevent iOS zoom on double-tap
        style={{ touchAction: 'manipulation' }}
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="chat-send-button"
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </form>
  );
}
