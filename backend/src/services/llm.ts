import OpenAI from 'openai';
import type { Message, LLMMessage } from '../types/index.js';
import { SYSTEM_PROMPT, STORE_NAME } from '../config/storeKnowledge.js';

// Lazy-initialize OpenAI client to avoid crashing if API key is not set
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// Configuration
const MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.7;

// Error messages for different failure scenarios
const ERROR_MESSAGES = {
  rateLimit: `I'm sorry, we're experiencing high traffic right now. Please try again in a moment. 🙏`,
  invalidKey: `I'm having trouble connecting to my brain right now. Our team has been notified. Please try again later or contact support@desibazaar.in for immediate help.`,
  timeout: `I'm taking longer than usual to respond. Please try again, and if the issue persists, feel free to reach out to our support team.`,
  generic: `Oops! Something went wrong on my end. Please try again, or contact our support team at support@desibazaar.in if you need immediate assistance.`,
};

/**
 * Convert our Message type to OpenAI message format
 */
function convertToLLMMessages(history: Message[]): LLMMessage[] {
  return history.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));
}

/**
 * Generate a reply using OpenAI
 * @param history - Previous messages in the conversation (for context)
 * @param userMessage - The new message from the user
 * @returns The AI's reply
 */
export async function generateReply(
  history: Message[],
  userMessage: string
): Promise<string> {
  try {
    // Build messages array with system prompt and conversation history
    const messages: LLMMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...convertToLLMMessages(history),
      { role: 'user', content: userMessage },
    ];

    const response = await getOpenAIClient().chat.completions.create({
      model: MODEL,
      messages: messages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) {
      console.error('Empty response from OpenAI');
      return ERROR_MESSAGES.generic;
    }

    return reply.trim();
  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.status, error.message);

      switch (error.status) {
        case 429:
          return ERROR_MESSAGES.rateLimit;
        case 401:
          console.error('Invalid API key!');
          return ERROR_MESSAGES.invalidKey;
        case 500:
        case 502:
        case 503:
          return ERROR_MESSAGES.timeout;
        default:
          return ERROR_MESSAGES.generic;
      }
    }

    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      console.error('Request timeout:', error.message);
      return ERROR_MESSAGES.timeout;
    }

    // Generic error handling
    console.error('Unexpected error in generateReply:', error);
    return ERROR_MESSAGES.generic;
  }
}

/**
 * Check if OpenAI API key is configured
 */
export function isLLMConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Generate a welcome message for new conversations
 */
export function getWelcomeMessage(): string {
  return `Namaste! 🙏 Welcome to ${STORE_NAME}! 

I'm here to help you with any questions about our products, shipping, returns, or anything else. 

How can I assist you today?`;
}
