// Core domain types for the chat application

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types
export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  error?: string;
}

export interface HistoryResponse {
  messages: Message[];
  sessionId: string;
}

// Database row types (for better-sqlite3)
export interface ConversationRow {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai';
  content: string;
  created_at: string;
}

// LLM types
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
