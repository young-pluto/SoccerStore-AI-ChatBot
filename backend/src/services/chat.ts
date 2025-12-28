import type { Message, ChatResponse, HistoryResponse } from '../types/index.js';
import {
  createConversation,
  getConversation,
  addMessage,
  getMessages,
  getRecentMessages,
  conversationExists,
} from './database.js';
import { generateReply, getWelcomeMessage } from './llm.js';

// Maximum messages to include in LLM context (for cost control)
const MAX_CONTEXT_MESSAGES = 10;

/**
 * Handle an incoming chat message
 * Creates a new session if none provided, persists messages, and generates AI reply
 */
export async function handleMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  try {
    let conversationId = sessionId;
    let isNewConversation = false;

    // Create new conversation if no session ID provided or session doesn't exist
    if (!conversationId || !conversationExists(conversationId)) {
      const conversation = createConversation();
      conversationId = conversation.id;
      isNewConversation = true;
    }

    // Get recent conversation history for context
    const history = getRecentMessages(conversationId, MAX_CONTEXT_MESSAGES);

    // Save user message to database
    addMessage(conversationId, 'user', message);

    // Generate AI reply
    const reply = await generateReply(history, message);

    // Save AI reply to database
    addMessage(conversationId, 'ai', reply);

    return {
      reply,
      sessionId: conversationId,
    };
  } catch (error) {
    console.error('Error in handleMessage:', error);
    
    return {
      reply: "I'm sorry, something went wrong. Please try again or contact our support team at support@desibazaar.in for help.",
      sessionId: sessionId || '',
      error: 'Internal server error',
    };
  }
}

/**
 * Get conversation history for a session
 */
export function getHistory(sessionId: string): HistoryResponse | null {
  // Check if conversation exists
  const conversation = getConversation(sessionId);
  
  if (!conversation) {
    return null;
  }

  // Get all messages
  const messages = getMessages(sessionId);

  return {
    messages,
    sessionId,
  };
}

/**
 * Start a new conversation and return welcome message
 */
export function startNewConversation(): ChatResponse {
  const conversation = createConversation();
  const welcomeMessage = getWelcomeMessage();
  
  // Save welcome message to database
  addMessage(conversation.id, 'ai', welcomeMessage);

  return {
    reply: welcomeMessage,
    sessionId: conversation.id,
  };
}
