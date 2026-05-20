# Recruitment platform — end-to-end workflow (summary)

Full technical detail (stack, data model, APIs, storage, diagrams): **[technical-design.md](./technical-design.md)**.

---

## Roles

| Role | Responsibility |
|------|----------------|
| **HR** | Creates jobs, manages evaluator accounts, assigns evaluators, publishes, screens CV/JD (pipeline board), sends tests, assigns application evaluators, hiring decision |
| **Evaluator** | Submits assessment plan (first wins), reviews graded tests, **searches evaluation queue** by candidate name/email, section follow-ups, pass/not pass recommendation |
| **Candidate** | Applies with CV, completes timed MCQ test |

---

## Flow (checklist)

1. **HR** creates job + assigns **job** evaluators → draft.
2. **Evaluator** picks skills from taxonomy (up to **10 sections**), sets **one overall test intensity**, submits plan → **first submission wins**.
3. **HR** publishes job → **question bank** preparation (AI fills pool per section). Job is live for applications; tests wait until bank is **READY**.
4. **Candidate** applies (CV saved to server disk + text/AI in Postgres) → background **CV parse + JD match**.
4b. If CV/JD AI **FAILED**, **HR** can **Retry CV / JD analysis** on the application page (`POST …/retry-cv-ai`).
5. **HR** generates test from bank → sends to candidate.
6. Candidate completes timed test → **auto-grade** → scores + analytics in DB.
7. **HR** assigns **application** evaluators → **send to evaluators** → `UNDER_REVIEW`.
8. **Evaluators** use **evaluation queue** on `/eval` (search by name/email), open review, per-section notes, advisory pass/not pass.
9. **HR** **reject** or **move to interview**. `HIRED` reserved (no hire API yet).

---

## Evaluator portal (`/eval`)

| Area | Purpose |
|------|---------|
| **JD drafts** | Configure taxonomy + intensity → send plan to HR |
| **Evaluation queue** | `UNDER_REVIEW` applications assigned to you; **search** filters by candidate **name or email** (compact field beside section title) |

---

## HR desk (short)

| Area | Purpose |
|------|---------|
| **Pipeline** (`/hr/pipeline`) | Jira-style board per published job — primary candidate view (no global candidate search) |
| **Jobs** (`/hr/jobs`) | Create jobs, publish, closed jobs |
| **Evaluators** (`/hr/evaluators`) | Create, edit, deactivate/reactivate evaluator accounts |
| **Application** (`/hr/applications/:id`) | CV match, retry CV/JD AI if failed, test, assign evaluators, hiring actions |

---

## Section notes (evaluator posts)

- Keyed by assessment **section title** (`sectionTitle`).
- Multiple comments per section; no separate note title field.
- Evaluators: create/edit/delete only while `UNDER_REVIEW`.
- HR: read-only in the same UI layout as evaluators.

---

## CV storage (short)

| Location | Contents |
|----------|----------|
| **Disk** (`backend/uploads/`) | Original PDF/DOCX |
| **Postgres** | Path, MIME, extracted text, AI parse + match JSON |

View CV: secured API `GET /api/applications/:id/cv` (not a public folder).

---

## Out of scope (for now)

- Hire API / marking `HIRED` from UI
- Email notifications
- Cloud object storage for CVs
- HR global candidate search (pipeline per job is sufficient)
