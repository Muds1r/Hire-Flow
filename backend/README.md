# Backend — NestJS API

Recruitment & technical assessment API: NestJS, Prisma, PostgreSQL, OpenAI, local CV storage.

**Full system design:** [../docs/technical-design.md](../docs/technical-design.md)

## Stack (purpose)

| Tech | Purpose |
|------|---------|
| NestJS | HTTP API modules, DI, guards |
| Prisma | ORM + migrations |
| PostgreSQL | All relational data |
| Passport JWT | Auth (`Authorization: Bearer`) |
| Multer | CV upload (memory → disk) |
| pdf-parse / mammoth | CV text extraction |
| OpenAI | CV parse, JD match, MCQ bank generation |
| @nestjs/schedule | Cron CV cleanup for closed jobs |

## Local setup

1. Create database `recruitment_mvp` and set `DATABASE_URL` in `.env` (see `.env.example`).
2. `npm install`
4. `npx prisma migrate deploy`
5. `npm run db:seed`
6. Set `OPENAI_API_KEY` for CV/JD AI and question-bank MCQ generation.
7. `npm run start:dev` → http://localhost:3000/api

**Email (Mailhog):** `docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog` — set `SMTP_*` in `.env`, inbox at http://localhost:8025. Sends on register, test sent, reject, move to interview.

**Seed logins:** `hr@example.com`, `evaluator@example.com`, password `Password123!`.

**CV files:** written to `UPLOAD_DIR` (default `./uploads/`). Served only via `GET /api/applications/:id/cv` (JWT + role check).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile Nest (`dist/main.js`) |
| `npm test` | Jest unit tests |
| `npm run db:seed` | Seed HR/evaluator users |
| `npm run db:reset-candidates` | Dev utility to reset candidate data |

## AI code location

- Prompts: `src/ai/ai.prompts.ts`
- Schemas: `src/ai/ai.schemas.ts`
- API calls: `src/ai/ai.service.ts`

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres |
| `JWT_SECRET` | JWT signing |
| `OPENAI_API_KEY` | AI features |
| `OPENAI_MODEL` | Default `gpt-4o-mini` |
| `UPLOAD_DIR` | CV storage root |
| `FRONTEND_URL` | CORS |
