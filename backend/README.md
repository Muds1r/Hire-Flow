# Backend — NestJS API

Recruitment & technical assessment API: NestJS, Prisma, PostgreSQL, OpenAI, local CV storage.

**Full system design:** [../docs/technical-design.md](../docs/technical-design.md)

## Stack (purpose)

| Tech | Purpose |
|------|---------|
| NestJS | HTTP API modules, DI, guards |
| Prisma | ORM + migrations |
| PostgreSQL | All relational data |
| Passport JWT | Session JWT in httpOnly cookie (`hire_flow_access_token`); optional `Authorization: Bearer` |
| nodemailer | Transactional email when `SMTP_HOST` is set |
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

**Seed:** `npm run db:seed` creates local HR/evaluator users; emails are printed to the console (for development only).

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
| `FRONTEND_URL` | CORS + email links |
| `SMTP_HOST` | SMTP server (omit to disable mail) |
| `SMTP_PORT` | Default `1025` (Mailhog) |
| `SMTP_SECURE` | `true` for TLS |
| `SMTP_USER` / `SMTP_PASS` | Optional auth |
| `MAIL_FROM` | From address |
| `AUTH_COOKIE_SECURE` | `true` in production (HTTPS) |
