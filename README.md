# AI Customer Support System

AI-powered customer support with multi-agent architecture. A router agent classifies queries and delegates to specialized sub-agents (Support, Order, Billing) with database tool access.

## Tech Stack

| Layer    | Tech                          | Purpose                         |
| -------- | ----------------------------- | ------------------------------- |
| Frontend | React + Vite                  | UI with streaming chat          |
| Backend  | Hono + Nitro                  | Fast API with type safety       |
| AI       | Vercel AI SDK + Google Gemini | Agent orchestration & responses |
| Database | PostgreSQL + Prisma           | Data persistence                |
| Monorepo | Turborepo                     | Workspace management            |

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Environment Setup

Create `api/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/customer_support?schema=public"
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
PORT=3001
```

Create `web/.env`:

```env
VITE_API_URL="http://localhost:3001"
```

### 3. Database Setup

```bash
cd api
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## API Routes

```
/api/chat
  POST   /messages                # Send message (streaming)
  GET    /conversations/:id       # Get conversation
  GET    /conversations           # List conversations
  DELETE /conversations/:id       # Delete conversation

/api/agents
  GET    /                        # List agents
  GET    /:type/capabilities      # Get agent capabilities

/api/health                        # Health check
```

## Project Structure

```
├── api/               # Backend (Hono + Nitro)
│   ├── src/
│   │   ├── agents/    # Router + Sub-agents with tools
│   │   ├── routes/    # API routes
│   │   └── services/  # Business logic
│   └── prisma/
│       └── seed.ts    # Mock data
│
└── web/               # Frontend (React + Vite)
    └── src/
        └── components/
            └── chat/  # Chat UI
```

## Agents

- **Router Agent**: Classifies intent (support/order/billing)
- **Support Agent**: FAQs, troubleshooting
- **Order Agent**: Order status, tracking
- **Billing Agent**: Payments, refunds, invoices

## Development Tools

Additional UIs for development and debugging:

### Workflow UI (`npx workflow web`)

Interactive workflow visualization tool for testing agents and viewing message flows.

```bash
cd api
npx workflow web
```

- Opens a web UI for debugging agent conversations
- Useful for testing routing logic and agent responses

### Prisma Studio (`npx prisma studio`)

Visual database management UI for browsing and editing data.

```bash
cd api
npx prisma studio
```

- Browse database tables (Users, Conversations, Orders, etc.)
- Edit records directly
- View relationships between entities
