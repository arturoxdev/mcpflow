# Zenboard

Personal task-board platform. Users organize work into Boards with Columns and Tasks. AI agents (Cursor, Claude Code, custom scripts) operate the same data via the REST API with personal access tokens.

Built with Next.js 16, Drizzle ORM, NeonDB, Clerk, Tailwind v4.

See [CONTEXT.md](./CONTEXT.md) for the domain glossary and [CLAUDE.md](./CLAUDE.md) for architecture and AI-agent guidance.

## Quick start

```bash
npm install
cp .env.example .env   # fill DATABASE_URL + Clerk keys
npm run db:migrate     # apply Drizzle migrations
npm run dev            # http://localhost:3000
```

## Scripts

```bash
npm run dev            # next dev on :3000
npm run build          # production build
npm start              # production server
npm run lint           # eslint
npm run check-types    # tsc --noEmit
npm run format         # prettier
npm run db:generate    # generate a migration from schema changes
npm run db:migrate     # apply pending migrations
npm run db:push        # push schema directly (dev only)
npm run db:studio      # open Drizzle Studio
```

## Programmatic access for AI agents

Generate a personal access token at `/api-keys`. Pass it as `Authorization: Bearer zb_pat_*`. See `/api-docs` for the full REST surface, or the `/skill` page to get a copy-pasteable agent skill bundle.
