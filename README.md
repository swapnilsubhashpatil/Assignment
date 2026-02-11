# AI Customer Support System

AI-powered customer support with multi-agent architecture. A router agent classifies queries and delegates to specialized sub-agents (Support, Order, Billing) with database tool access.

## Architecture Overview

```
┌─────────────────┐
│  Router Agent   │ (Classifies intent)
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌───────┐ ┌───────┐ ┌─────────┐ ┌───────┐
│Support│ │ Order │ │ Billing │ │Fallback│
│ Agent │ │ Agent │ │  Agent  │ │  Agent │
└───────┘ └───────┘ └─────────┘ └───────┘
```

## Tech Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| Frontend | React + Vite | UI with streaming chat |
| Backend | Hono + Nitro | Fast API with type safety |
| AI | Vercel AI SDK + Google Gemini | Agent orchestration |
| Database | PostgreSQL + Prisma | Data persistence |
| Monorepo | Turborepo | Workspace management |

## Project Structure

```
├── api/               # Backend (Hono + Nitro)
│   ├── src/
│   │   ├── agents/    # Router + Sub-agents
│   │   ├── routes/    # API routes
│   │   └── services/  # Business logic
│   └── prisma/
│       └── seed.ts
│
└── web/               # Frontend (React + Vite)
    └── src/
        └── components/
            └── chat/
```

## Features

- Multi-agent routing system
- Streaming AI responses
- Conversation context with compaction
- Tool-based data access
- Rate limiting
- Workflow post-processing

## Getting Started

```bash
npm install
npm run dev
```

## License
MIT
