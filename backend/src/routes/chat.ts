import { Router, Request, Response } from 'express';
import { handleMessage, getHistory, startNewConversation } from '../services/chat.js';
import { validateChatMessage, validateSessionId } from '../middleware/validation.js';
import { isLLMConfigured } from '../services/llm.js';

const router = Router();

/**
 * Health check endpoint
 * GET /chat/health
 */
router.get('/health', (req: Request, res: Response) => {
  const llmConfigured = isLLMConfigured();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    llmConfigured,
    ...(llmConfigured ? {} : { warning: 'OpenAI API key not configured' }),
  });
});

/**
 * Start a new conversation
 * POST /chat/start
 * Returns a welcome message and new session ID
 */
router.post('/start', (req: Request, res: Response) => {
  try {
    const result = startNewConversation();
    res.json(result);
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      error: 'Failed to start conversation',
    });
  }
});

/**
 * Send a message and get AI reply
 * POST /chat/message
 * Body: { message: string, sessionId?: string }
 * Returns: { reply: string, sessionId: string }
 */
router.post('/message', validateChatMessage, async (req: Request, res: Response) => {
  try {
    const { message, sessionId, truncated } = req.body;

    // Check if LLM is configured
    if (!isLLMConfigured()) {
      res.status(503).json({
        error: 'AI service is not configured. Please set OPENAI_API_KEY.',
        sessionId: sessionId || '',
      });
      return;
    }

    const result = await handleMessage(message, sessionId);

    // Add truncation warning if message was too long
    if (truncated) {
      result.reply = `I noticed your message was quite long. Just to let you know, I'm here to help with questions about 11Yards jerseys, orders, shipping, and store policies. I'm not able to assist with coding tasks, technical questions, or other unrelated topics.\n\nFor store-related questions, I'm happy to help! What would you like to know?`;
    }

    res.json(result);
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({
      error: 'Failed to process message',
      reply: "I'm sorry, something went wrong. Please try again.",
      sessionId: req.body.sessionId || '',
    });
  }
});

/**
 * Get conversation history
 * GET /chat/history/:sessionId
 * Returns: { messages: Message[], sessionId: string }
 */
router.get('/history/:sessionId', validateSessionId, (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const history = getHistory(sessionId);

    if (!history) {
      res.status(404).json({
        error: 'Conversation not found',
      });
      return;
    }

    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      error: 'Failed to fetch conversation history',
    });
  }
});

export default router;
