import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// Maximum message length (characters)
const MAX_MESSAGE_LENGTH = 2000;

// Chat message validation schema
const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Message cannot be empty or whitespace only'),
  sessionId: z.string().uuid().optional(),
});

// Type for validated chat request
export type ValidatedChatRequest = z.infer<typeof chatMessageSchema>;

/**
 * Middleware to validate chat message requests
 */
export function validateChatMessage(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Parse and validate request body
    const result = chatMessageSchema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => e.message);
      res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    let { message, sessionId } = result.data;

    // Handle very long messages
    let truncated = false;
    if (message.length > MAX_MESSAGE_LENGTH) {
      message = message.substring(0, MAX_MESSAGE_LENGTH);
      truncated = true;
    }

    // Attach validated data to request
    req.body = {
      message,
      sessionId,
      truncated, // Flag to optionally warn user
    };

    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({
      error: 'Invalid request format',
    });
  }
}

/**
 * Middleware to validate session ID in params
 */
export function validateSessionId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { sessionId } = req.params;

  if (!sessionId) {
    res.status(400).json({
      error: 'Session ID is required',
    });
    return;
  }

  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(sessionId)) {
    res.status(400).json({
      error: 'Invalid session ID format',
    });
    return;
  }

  next();
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

/**
 * Sanitize input to prevent potential issues
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}
