# CLAUDE.md

This file provides guidance to Claude Code and AI agents when working with this repository.

## Project Overview

**Zenboard** is a personal task-board platform. Users organize work into Boards, each with Columns and Tasks. AI agents (Cursor, Claude Code, custom scripts) can read and write the same data via the REST API authenticated with personal access tokens (`zb_pat_*`).

The repo is a single Next.js 16 app following Feature-Based Architecture (FBA). There is no monorepo, no Turborepo, no MCP server.

## Repo Layout

```
zenboard/
├── src/
│   ├── app/           # Next.js App Router (pages, layouts, API routes)
│   ├── features/      # Feature modules per domain (UI + client/server HTTP services)
│   ├── server/        # Server-only domain logic + Drizzle queries (ex @repo/core)
│   ├── components/    # Shared UI (shadcn primitives + cross-feature components)
│   ├── hooks/         # Cross-feature hooks
│   ├── lib/           # Pure utilities (api, config, formatters, utils)
│   ├── types/         # Global TypeScript types
│   └── middleware.ts  # Clerk middleware
├── drizzle/           # Generated SQL migrations + meta
├── public/            # Static assets
├── drizzle.config.ts  # Drizzle Kit config
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── package.json
└── .env / .env.example
```

The path alias `@/*` resolves to `./src/*`.

## Architecture

### Feature-Based Architecture (FBA)

Code is organized by domain, not by technical layer. The convention:

```
src/features/<feature>/
├── components/                        # UI for this feature
├── hooks/                             # feature-specific hooks
├── services/
│   ├── <feature>.service.ts           # server-side HTTP wrapper (next/headers + apiFetch)
│   └── <feature>.client-service.ts    # client-side HTTP wrapper (fetch + API_URL)
├── types/                             # TypeScript types of this domain
└── index.ts                           # public barrel — only exports client-safe modules
```

**Import rules:**

1. `app/` pages may import from any number of features (`@/features/<x>`) and from `@/server/`.
2. Features may import from `@/components/`, `@/lib/`, `@/hooks/`, `@/lib/services/` — but **never from another feature**.
3. Always import from a feature's barrel (`@/features/x`), not from a deep file path.
4. Server pages import server services directly: `@/features/x/services/x.service`.
5. Client components import via the barrel.

**Where business logic + DB queries live:**

The FBA `services/` files inside features are HTTP wrappers. The actual domain logic + Drizzle queries live in `src/server/` (server-only, never imported by client components):

```
src/server/
├── boards.ts        # boardService — Board CRUD, archive
├── columns.ts       # columnService, ColumnHasTasksError
├── tasks.ts         # taskService — task CRUD, move
├── api-keys.ts      # apiKeyService — create/revoke/findByToken
├── entities.ts      # Zod schemas + types
├── db/              # Drizzle schema + connection
└── index.ts         # barrel
```

`src/app/api/<route>/route.ts` files import services from `@/server/` directly.

### Authentication

- **Clerk** for the UI: every route is protected by `src/middleware.ts` except `/`, `/sign-in`, `/sign-up`, `/public/boards/*`.
- **Personal access tokens (`zb_pat_*`)** for programmatic access: middleware exempts `/api/boards`, `/api/boards/*`, `/api/tasks`, `/api/public/*`. Each handler runs `getAuth(request)` (`src/lib/auth.ts`) which accepts either a Clerk session OR `Authorization: Bearer zb_pat_*` (resolved via `apiKeyService.findByToken`).
- The `/skill` page generates a token + instructions for AI agents. `/api-docs` documents the REST surface. `/api-keys` manages tokens.

### Database

NeonDB (PostgreSQL serverless) accessed via Drizzle ORM. Schema lives in `src/server/db/schema/`. Migrations are checked into `drizzle/`.

```bash
npm run db:generate   # generate a new migration from schema changes
npm run db:migrate    # apply pending migrations
npm run db:push       # push schema directly (dev only)
npm run db:studio     # Drizzle Studio
```

## Development Commands

```bash
npm install            # install deps (root, single package.json)
npm run dev            # next dev on :3000
npm run build          # next build
npm start              # next start
npm run lint           # eslint
npm run check-types    # tsc --noEmit
npm run format         # prettier
```

## Environment

Single `.env` at the repo root. Required:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

Optional:

```env
NEXT_PUBLIC_LIVE_URL=https://your-domain.example
```

See `.env.example`.

## Adding a New Feature

1. **Check if it's an extension of an existing domain.** Boards, Tasks, Columns, ApiKeys are already covered. If yes, extend the corresponding `src/server/<x>.ts` first.

2. **Add or update domain logic in `src/server/<x>.ts`** — Drizzle queries + Zod validation here. Throws domain errors. No HTTP, no Clerk, no `next/headers`.

3. **Add or update an API route in `src/app/api/<x>/route.ts`** — call `getAuth(request)`, then call the service from `@/server/<x>`. This is the HTTP surface.

4. **If the UI needs a new feature module**, create `src/features/<x>/` following FBA. The feature's `services/` are thin HTTP wrappers around the API route — they do not talk to the DB.

## Important Rules

1. **Never** import from `@/server/` in a Client Component or browser bundle. It will leak DB credentials. Server-only code stays server-only.
2. **Never** import from one feature into another (`@/features/a` cannot import `@/features/b`). Compose features at the page (`app/`) layer instead.
3. **All UI/API routes for archived boards must filter via `archived_at IS NULL`** — the filter lives in the service layer (`src/server/`) so every consumer (UI, REST routes) gets it for free.
4. **Use Context7 / find-docs** when you need library documentation (Next.js, Drizzle, Clerk, etc.) — your training data may be outdated.

## Troubleshooting

### Module resolution issues

```bash
rm -rf node_modules .next
npm install
```

### Database connection issues

- Verify `DATABASE_URL` in `.env` includes `?sslmode=require`.
- Test connection with `npm run db:studio`.

### TypeScript errors

```bash
npm run check-types
```

## Resources

- [Next.js 16 docs](https://nextjs.org/docs)
- [Drizzle ORM docs](https://orm.drizzle.team/docs)
- [Clerk docs](https://clerk.com/docs)
- [Domain glossary](./CONTEXT.md)
