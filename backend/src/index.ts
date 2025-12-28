import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import { initializeDatabase, closeDatabase } from './services/database.js';
import { errorHandler } from './middleware/validation.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://soccer-store-ai-chat-bot.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' })); // Limit payload size

// Routes
app.use('/chat', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: '11Yards AI Support Agent',
    version: '1.0.0',
    endpoints: {
      health: 'GET /chat/health',
      message: 'POST /chat/message',
      history: 'GET /chat/history/:sessionId',
      start: 'POST /chat/start',
    },
  });
});

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
try {
  initializeDatabase();
  
  const server = app.listen(PORT, () => {
    console.log(`
⚽  11Yards AI Support Agent
================================
Server running on http://localhost:${PORT}
Health check: http://localhost:${PORT}/chat/health

Endpoints:
  POST /chat/message  - Send a message
  POST /chat/start    - Start new conversation
  GET  /chat/history/:sessionId - Get chat history
    `);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    closeDatabase();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down...');
    closeDatabase();
    server.close(() => {
      process.exit(0);
    });
  });

} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}

export default app;
