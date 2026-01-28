# AI Employee - Implementation Plan

## Goal Description
Build a WhatsApp automation platform where AI understands intents but "System/Human" makes the final decision. The goal is reliability and trust, minimizing AI risks via a robust approval workflow.

## Proposed Architecture

### High-Level Flow
WhatsApp (User) -> Webhook (Backend) -> AI (Intent/Confidence) -> Rules Engine -> (Approval if needed) -> Action -> WhatsApp (Reply)

### Tech Stack
- **Backend**: NestJS (Modular: `auth`, `whatsapp`, `ai`, `workflows`, `approvals`, `users`)
- **Frontend**: React + Tailwind (Admin Panel for Approvals & Logs)
- **Database**: PostgreSQL (Prisma or TypeORM recommended)
- **AI**: LLM (e.g., OpenAI/Anthropic) for Intent Classification

## Database Schema (Core Tables)
- `businesses`: Tenant info
- `users`: Admin users/owners
- `conversations`: Chat sessions
- `messages`: Raw message logs
- `intents`: AI analysis results
- `workflows`: SOPs and rules
- `approvals`: Human review queue
- `action_logs`: Audit trail

## Proposed Changes (Phase 1)
### Backend Setup
#### [NEW] NestJS Project Structure
- `src/whatsapp/`: Webhook handling
- `src/conversations/`: History management
- `src/common/`: Database connection

### Frontend Setup
#### [NEW] React Admin
- Basic scaffold with Tailwind
- Login screen placeholder

## Verification Plan
### Automated Tests
- Unit tests for Intent Detection logic.
- E2E tests for Webhook handling (simulating WhatsApp payloads).

### Manual Verification
- Use Postman to simulate WhatsApp Webhook events.
- Verify DB records are created for incoming messages.
