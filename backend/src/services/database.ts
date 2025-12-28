import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { Message, Conversation, MessageRow, ConversationRow } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(__dirname, '../../database/chat.db');
const SCHEMA_PATH = path.join(__dirname, '../../database/schema.sql');

let db: Database.Database;

/**
 * Initialize the database connection and create tables if they don't exist
 */
export function initializeDatabase(): void {
  // Ensure database directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Read and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);
  
  console.log('✅ Database initialized successfully');
}

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Create a new conversation
 */
export function createConversation(): Conversation {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO conversations (id, created_at, updated_at)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(id, now, now);
  
  return {
    id,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get a conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const stmt = db.prepare(`
    SELECT id, created_at, updated_at
    FROM conversations
    WHERE id = ?
  `);
  
  const row = stmt.get(id) as ConversationRow | undefined;
  
  if (!row) {
    return null;
  }
  
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update conversation's updated_at timestamp
 */
export function updateConversationTimestamp(id: string): void {
  const stmt = db.prepare(`
    UPDATE conversations
    SET updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(new Date().toISOString(), id);
}

/**
 * Add a message to a conversation
 */
export function addMessage(
  conversationId: string,
  sender: 'user' | 'ai',
  content: string
): Message {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, sender, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, conversationId, sender, content, now);
  
  // Update conversation timestamp
  updateConversationTimestamp(conversationId);
  
  return {
    id,
    conversationId,
    sender,
    content,
    createdAt: now,
  };
}

/**
 * Get all messages for a conversation, ordered by creation time
 */
export function getMessages(conversationId: string): Message[] {
  const stmt = db.prepare(`
    SELECT id, conversation_id, sender, content, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `);
  
  const rows = stmt.all(conversationId) as MessageRow[];
  
  return rows.map(row => ({
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    content: row.content,
    createdAt: row.created_at,
  }));
}

/**
 * Get recent messages for a conversation (for LLM context)
 * @param conversationId - The conversation ID
 * @param limit - Maximum number of messages to return (default: 10)
 */
export function getRecentMessages(conversationId: string, limit: number = 10): Message[] {
  const stmt = db.prepare(`
    SELECT id, conversation_id, sender, content, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  
  const rows = stmt.all(conversationId, limit) as MessageRow[];
  
  // Reverse to get chronological order
  return rows.reverse().map(row => ({
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    content: row.content,
    createdAt: row.created_at,
  }));
}

/**
 * Check if a conversation exists
 */
export function conversationExists(id: string): boolean {
  const stmt = db.prepare(`
    SELECT 1 FROM conversations WHERE id = ?
  `);
  
  return stmt.get(id) !== undefined;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    console.log('Database connection closed');
  }
}
