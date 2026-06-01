# Futurenostics — Hire Flow

Multi-role recruitment MVP: HR job pipeline, evaluator assessment plans, candidate timed MCQs, CV/JD AI screening, and secured CV viewing.

## Documentation

| Document | Description |
|----------|-------------|
| **[docs/technical-design.md](docs/technical-design.md)** | Full TDD: technologies, architecture, data model, flows, APIs, config, deployment |
| **[docs/end-to-end-workflow.md](docs/end-to-end-workflow.md)** | Short workflow summary for product/QA |

## Quick start

**Requirements:** Node.js 20+, PostgreSQL, OpenAI API key (optional but needed for CV match and question bank).

```bash
# Backend
cd backend && cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, OPENAI_API_KEY
npm install && npx prisma migrate deploy && npm run db:seed
npm run start:dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

- API: http://localhost:3000/api (frontend dev proxies `/api` → backend for httpOnly cookies)  
- App: http://localhost:5173  
- Seed: `hr@example.com` / `evaluator@example.com` — password `Password123!`
- Email (optional): run [Mailhog](https://github.com/mailhog/MailHog), set `SMTP_HOST` / `SMTP_PORT` in `backend/.env` (see `.env.example`), view mail at http://localhost:8025

## Project structure

```
frontend/   React + Vite + TanStack Query
backend/    NestJS + Prisma + PostgreSQL
docs/       Technical design & workflow
```

See [docs/technical-design.md](docs/technical-design.md) for the complete technology list and end-to-end flow.
