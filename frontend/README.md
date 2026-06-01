# Frontend — Hire Flow SPA

React + Vite client for the recruitment platform.

**System design:** [../docs/technical-design.md](../docs/technical-design.md) · **Workflow:** [../docs/end-to-end-workflow.md](../docs/end-to-end-workflow.md)

## Quick start

```bash
cp .env.example .env   # optional; default VITE_API_URL=/api uses dev proxy
npm install
npm run dev            # http://localhost:5173
```

Requires the backend at `http://localhost:3000` (Vite proxies `/api` for httpOnly cookies).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production bundle |
| `npm test` | Vitest unit tests |

## Key paths

| Path | Purpose |
|------|---------|
| `src/routes/AppRoutes.tsx` | Routes and role guards |
| `src/api/client.ts` | Axios + `withCredentials` |
| `src/features/auth/AuthBootstrap.tsx` | Session restore via `/auth/me` |
| `src/constants/testIntensity.ts` | Test intensity enum + UI labels (sync with backend + Prisma) |
