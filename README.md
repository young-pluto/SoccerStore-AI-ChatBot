# 11Yards AI Support Agent

A mini AI support agent for a live chat widget, built for the Spur Founding Full-Stack Engineer take-home assignment.

https://soccer-store-ai-chat-bot.vercel.app

## ⚽ About

**11Yards** is a fictional India-based football merchandise store offering jerseys from clubs and national teams across Europe, South America, Asia, and international tournaments. This project implements an AI-powered customer support chat agent that can answer questions about:

- Jersey types (Fan Edition vs Player Edition)
- Available leagues & teams (Premier League, La Liga, Serie A, etc.)
- Shipping policies (pan-India delivery, metro vs. tier-2/3 cities)
- Payment options (UPI, COD, Cards, Net Banking)
- Customization options (name & number printing)
- Returns & exchange policies

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- OpenAI API key

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd "AI Support agent"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# In the backend directory, create .env file
cd backend
cp ../.env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=sk-your-key-here
```

### 3. Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Vite)                  │
│  ┌─────────────┐  ┌───────────────┐  ┌───────────────────────┐  │
│  │  ChatWidget │──│   useChat     │──│      API Client       │  │
│  │  Components │  │   (Hook)      │  │  (fetch + error handling)│
│  └─────────────┘  └───────────────┘  └───────────────────────┘  │
└────────────────────────────────────┬────────────────────────────┘
                                     │ HTTP
┌────────────────────────────────────▼────────────────────────────┐
│                      Backend (Node.js + Express)                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │   Routes    │──│  Chat Service   │──│   LLM Service       │  │
│  │  /chat/*    │  │ (orchestration) │  │  (OpenAI GPT-4o-mini)│ │
│  └─────────────┘  └─────────────────┘  └─────────────────────┘  │
│         │                  │                                     │
│         │         ┌────────▼────────┐                           │
│         │         │ Database Service│                           │
│         │         │   (SQLite)      │                           │
│         │         └─────────────────┘                           │
│  ┌──────▼──────┐                                                │
│  │ Validation  │  Zod schema validation                         │
│  │ Middleware  │  Input sanitization                            │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
AI Support agent/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry point
│   │   ├── routes/chat.ts        # API routes
│   │   ├── services/
│   │   │   ├── database.ts       # SQLite operations
│   │   │   ├── llm.ts            # OpenAI integration
│   │   │   └── chat.ts           # Business logic
│   │   ├── middleware/
│   │   │   └── validation.ts     # Input validation (Zod)
│   │   ├── types/index.ts        # TypeScript interfaces
│   │   └── config/
│   │       └── storeKnowledge.ts # 11Yards FAQ/policies
│   ├── database/
│   │   ├── schema.sql            # DB schema
│   │   └── chat.db               # SQLite database (auto-created)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ChatWidget.tsx    # Main container
│   │   │   ├── MessageList.tsx   # Scrollable messages
│   │   │   ├── Message.tsx       # Single message
│   │   │   ├── ChatInput.tsx     # Input + send
│   │   │   └── TypingIndicator.tsx
│   │   ├── hooks/useChat.ts      # State management
│   │   ├── services/api.ts       # API client
│   │   └── styles/index.css      # Premium styling
│   └── package.json
│
├── .env.example
└── README.md
```

## 📊 Data Model

### Database Schema (SQLite)

```sql
-- Conversations
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### Session Persistence

- **Backend**: Conversations and messages stored in SQLite
- **Frontend**: Session ID stored in `localStorage` for continuity across page reloads

## 🤖 LLM Integration

### Provider

**OpenAI GPT-4o-mini** - Cost-effective, fast responses, great for customer support

### Prompting Strategy

```typescript
// System prompt includes:
// 1. Agent personality (professional, knowledgeable about football)
// 2. Complete store knowledge (jerseys, shipping, returns, payments)
// 3. Guidelines (don't make up stock info, be clear about jersey authenticity)

// Context: Last 10 messages included for conversational continuity
// Max tokens: 500 (cost control)
// Temperature: 0.7 (balanced creativity/consistency)
```

### Error Handling

| Error Type        | User Message                                        |
| ----------------- | --------------------------------------------------- |
| Rate Limit (429)  | "We're experiencing high traffic, please try again" |
| Invalid Key (401) | "Having trouble connecting, team notified"          |
| Timeout           | "Taking longer than usual, please retry"            |
| Generic           | "Something went wrong, contact support"             |

## 🛡️ Robustness & Validation

### Input Validation (Zod)

- ❌ Empty messages rejected
- ✂️ Messages > 2000 chars truncated (with warning)
- 🧹 Control characters sanitized
- ✅ UUID format validation for session IDs

### Error Handling

- All API errors return friendly messages
- Backend never crashes on bad input
- Network failures caught and displayed in UI
- Graceful degradation when LLM is unavailable

### Security

- No secrets in code (env vars only)
- CORS configured for frontend origin
- Request payload size limited (100kb)

## 🎨 Design Decisions

| Decision                      | Rationale                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| **SQLite + better-sqlite3**   | Synchronous API simplifies code, perfect for single-server deployment, zero config |
| **GPT-4o-mini**               | Cost-effective (~$0.15/1M input tokens), fast, good for support conversations      |
| **localStorage for session**  | Simple persistence without auth complexity, survives page reloads                  |
| **10-message context window** | Balances context awareness with API costs                                          |
| **Zod validation**            | Runtime type safety at API boundary, great error messages                          |
| **Premium dark theme**        | Modern aesthetic with football green accents, glassmorphism effects                |

## 🔜 Trade-offs & If I Had More Time...

### Current Trade-offs

| What's Missing       | Why                                                         |
| -------------------- | ----------------------------------------------------------- |
| No authentication    | Scope management - would add JWT/session auth in production |
| SQLite only          | Perfect for demo, but PostgreSQL for production scale       |
| No real-time updates | HTTP polling works; WebSockets for true live chat           |
| Single LLM provider  | Would add Claude/Gemini fallback for reliability            |

### Future Enhancements

- [ ] **WebSocket support** - Real-time typing indicators
- [ ] **Product catalog integration** - Dynamic jersey availability
- [ ] **Order tracking** - Integration with courier APIs
- [ ] **Size guide assistant** - Interactive size recommendation
- [ ] **Multi-language** - Hindi support for Indian customers
- [ ] **Admin dashboard** - View all conversations
- [ ] **Rate limiting** - Prevent abuse

## 🧪 Testing

### Manual Testing Checklist

- [x] Start new conversation → Welcome message appears
- [x] Send message → AI responds contextually
- [x] Refresh page → Conversation history preserved
- [x] Send empty message → Validation prevents submission
- [x] Send very long message → Truncation warning shown
- [x] Backend down → Graceful error in UI
- [x] Ask about shipping → Correct policy returned
- [x] Ask about returns → 7-day policy explained
- [x] Ask about jerseys → Accurate product info

### Sample Queries to Test

```
"Do you have the new Barcelona home jersey?"
"What's your return policy?"
"Do you ship to Chennai?"
"Can I pay with UPI?"
"How long does delivery take?"
"Can I customize a jersey with my name?"
"Do you sell player edition jerseys?"
```

## 📝 API Reference

### POST /chat/message

Send a message and get AI response.

**Request:**

```json
{
  "message": "Do you have Manchester United jerseys?",
  "sessionId": "uuid-optional"
}
```

**Response:**

```json
{
  "reply": "Yes! We have Manchester United jerseys...",
  "sessionId": "uuid-string"
}
```

### GET /chat/history/:sessionId

Get conversation history.

**Response:**

```json
{
  "messages": [
    { "id": "...", "sender": "ai", "content": "...", "createdAt": "..." }
  ],
  "sessionId": "uuid"
}
```

### POST /chat/start

Start a new conversation with welcome message.

### GET /chat/health

Health check endpoint.

---

Built with ⚽ for the Spur take-home assignment.
