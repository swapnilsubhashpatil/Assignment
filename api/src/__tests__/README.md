# Unit & Integration Tests

This folder contains tests for the AI Customer Support API.

## Test Structure

```
api/src/__tests__/
├── router.agent.test.ts      # Router Agent classification tests
├── chat.service.test.ts      # Context compaction & token management
├── tools.test.ts             # Tool data isolation security tests
└── integration.test.ts       # Full API integration tests
```

## Test Coverage

### 1. Router Agent Tests (`router.agent.test.ts`)
Tests the intent classification logic:
- ✅ Order-related queries → Order Agent
- ✅ Billing/refund queries → Billing Agent
- ✅ General questions → Support Agent (default)
- ✅ Error fallback → Support Agent
- ✅ Context-aware routing (refund after order discussion)

### 2. Chat Service Tests (`chat.service.test.ts`)
Tests conversation management:
- ✅ Token counting & limit detection
- ✅ Context compaction when >8000 tokens
- ✅ Old message summarization with AI
- ✅ Conversation CRUD operations

### 3. Tools Tests (`tools.test.ts`)
Tests data isolation & security:
- ✅ Users can only access their own orders
- ✅ Payment data isolation by userId
- ✅ Invoice access restricted to owner
- ✅ Cross-user data access prevention

### 4. Integration Tests (`integration.test.ts`)
Tests full API endpoints:
- ✅ Message sending & streaming
- ✅ Conversation persistence
- ✅ Multi-agent routing in single thread
- ✅ Rate limiting
- ✅ Error handling (400, 404)

## How to Run Tests

### Run all tests once
```bash
cd api
npm test
```

### Run in watch mode (during development)
```bash
cd api
npm test -- --watch
```

### Run specific test file
```bash
cd api
npm test -- router.agent.test.ts
```

### Run with coverage report
```bash
cd api
npm test -- --coverage
```

### Run with verbose output
```bash
cd api
npm test -- --reporter=verbose
```

## Key Test Scenarios

### Multi-Agent Flow
```typescript
// 1. User: "Hi" → Support Agent
// 2. User: "List my orders" → Order Agent
// 3. User: "I need a refund" → Billing Agent
// All in ONE conversation thread
```

### Data Isolation
```typescript
// User A cannot access User B's orders
// Tools filter by userId in every query
```

### Context Compaction
```typescript
// When >8000 tokens: old messages summarized
// Recent 10 messages kept intact
// AI-generated summary inserted as system message
```

## Mocking Strategy

- **AI SDK**: Mocked to return predictable responses
- **Prisma**: Mocked to simulate database without real connection
- **No external API calls**: All tests run offline

## Continuous Integration

Add to your CI pipeline:
```yaml
- name: Run Tests
  run: |
    cd api
    npm ci
    npm test
```
