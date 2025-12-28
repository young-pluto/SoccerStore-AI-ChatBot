import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessage, getHistory, startNewConversation, type Message } from '../services/api';

const SESSION_STORAGE_KEY = 'desi_bazaar_session_id';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  sendUserMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  clearError: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const initRef = useRef(false);

  // Load session from localStorage on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    
    if (savedSessionId) {
      // Try to load existing conversation
      loadHistory(savedSessionId);
    } else {
      // Start a new conversation
      initNewConversation();
    }
  }, []);

  // Load conversation history
  const loadHistory = async (sid: string) => {
    try {
      setIsLoading(true);
      const response = await getHistory(sid);
      setMessages(response.messages);
      setSessionId(response.sessionId);
    } catch (err) {
      console.log('No existing conversation found, starting new one');
      // If history not found, start fresh
      localStorage.removeItem(SESSION_STORAGE_KEY);
      initNewConversation();
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize a new conversation
  const initNewConversation = async () => {
    try {
      setIsLoading(true);
      const response = await startNewConversation();
      setSessionId(response.sessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, response.sessionId);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        conversationId: response.sessionId,
        sender: 'ai',
        content: response.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    } catch (err) {
      setError('Failed to start conversation. Please refresh the page.');
      console.error('Failed to start conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message
  const sendUserMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);

    // Optimistically add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      conversationId: sessionId || '',
      sender: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await sendMessage(message, sessionId || undefined);

      // Update session ID if this was first message
      if (!sessionId && response.sessionId) {
        setSessionId(response.sessionId);
        localStorage.setItem(SESSION_STORAGE_KEY, response.sessionId);
      }

      // Add AI response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        conversationId: response.sessionId,
        sender: 'ai',
        content: response.reply,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      
      // Add error message in chat
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        conversationId: sessionId || '',
        sender: 'ai',
        content: `Sorry, I couldn't process your message. ${errorMessage}`,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  // Clear chat and start fresh
  const clearChat = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setMessages([]);
    setSessionId(null);
    setError(null);
    initNewConversation();
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendUserMessage,
    clearChat,
    clearError,
  };
}
