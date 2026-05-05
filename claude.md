# CLAUDE.md

This file provides guidance to Claude Code and AI agents when working with this repository.

## Project Overview

**Zenboard** is a task board management platform built as a Turborepo monorepo. It enables AI agents (like Claude Code, Cursor) and users to create and manage task boards collaboratively. The project includes a web application, an MCP (Model Context Protocol) server, and shared core services.

## Monorepo Structure

```
zenboard/
├── apps/
│   ├── web/          # Next.js 16 web application (main UI)
│   └── mcp/          # MCP server for AI agent integration
├── packages/
│   ├── core/         # Shared business logic and database layer
│   ├── eslint-config/
│   └── typescript-config/
```

## Development Commands

### Root Level (Turborepo)

```bash
# Development (all workspaces)
npm run dev              # Start all dev servers in parallel

# Development (specific workspace)
turbo dev --filter=web   # Only web app
turbo dev --filter=mcp   # Only MCP server

# Build
npm run build            # Build all workspaces
turbo build --filter=web # Build specific workspace

# Code Quality
npm run lint             # Lint all workspaces
npm run format           # Format code with Prettier
npm run check-types      # Type check all workspaces
```

### Web App (apps/web)

```bash
cd apps/web
npm run dev              # Start on localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # ESLint check
```

### MCP Server (apps/mcp)

```bash
cd apps/mcp
npm run dev              # Start MCP server
npm run build            # TypeScript compilation
npm start                # Run compiled server
```

## Environment Configuration

### Root `.env`
```env
DATABASE_URL=postgresql://... # NeonDB connection string
```

### Web App `.env` (apps/web/.env)
```env
# Clerk Authentication (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=postgresql://... # Inherited from root or override
```

See `.env.example` files in root and `apps/web/` for complete configuration.

## Architecture

### Tech Stack

- **Monorepo**: Turborepo
- **Web Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5.9
- **Database**: NeonDB (PostgreSQL) with Drizzle ORM
- **Authentication**: Clerk
- **UI**: Tailwind CSS v4, Lucide Icons
- **MCP Integration**: @modelcontextprotocol/sdk, @vercel/mcp-adapter
- **Drag & Drop**: @dnd-kit/core

### Workspace Dependencies

- `apps/web` → depends on `@repo/core`
- `apps/mcp` → depends on `@repo/core`
- `@repo/core` → shared by both apps

### Data Architecture

**Three-Layer Architecture:**

1. **Database Layer** (`packages/core/src/db/`):
   - Drizzle ORM schemas
   - Database connection management
   - Direct SQL queries via NeonDB serverless driver

2. **Service Layer** (`packages/core/src/`):
   - `board.ts` - Board CRUD operations
   - `tasks.ts` - Task management logic
   - `entities.ts` - Type definitions
   - Business logic and data validation (Zod)

3. **Application Layer**:
   - **Web App** (`apps/web/app/`): Next.js API routes and UI components
   - **MCP Server** (`apps/mcp/`): MCP tools for AI agent integration

### Authentication Flow

**Clerk Integration** (Web App only):
- Protected routes via `middleware.ts` (all except `/sign-in`, `/sign-up`)
- `ClerkProvider` wraps app in `app/layout.tsx`
- User authentication required for all board/task operations

### MCP Server

The MCP server (`apps/mcp`) exposes task board operations as tools for AI agents:
- List projects/boards
- List/create/update/delete tasks
- Repository management
- Workspace session handling

## Development Workflow

### Adding New Features

1. **Check `@repo/core` first**: Before creating new functionality, verify if it exists in the core package.

2. **Service Layer** (`packages/core/src/`):
   ```typescript
   // Add new service function
   export async function newFeature(params) {
     // Business logic here
     // Use Drizzle ORM for database operations
   }
   ```

3. **Web API Route** (`apps/web/app/api/...`):
   ```typescript
   import { newFeature } from '@repo/core';

   export async function POST(req: Request) {
     const data = await newFeature(params);
     return Response.json(data);
   }
   ```

4. **MCP Tool** (if needed for AI agents):
   ```typescript
   // Add tool in apps/mcp/index.ts
   server.addTool({
     name: 'new_feature',
     // ...implementation
   });
   ```

### Database Changes

```bash
cd packages/core
# Edit src/db/schema.ts
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

### Type Safety

- All packages use strict TypeScript
- Shared types in `packages/core/src/entities.ts`
- Zod validation for runtime type checking
- Use `npx tsc --noEmit` for type checking without compilation

## Important Rules

1. **Always use Context7 MCP** when you need library/API documentation, code generation, setup, or configuration steps.

2. **Service Layer First**: All business logic goes in `@repo/core`, not in API routes or components.

3. **Type Safety**: Use Zod schemas for validation, TypeScript for compile-time safety.

4. **Authentication**: All web routes (except auth pages) require Clerk authentication.

5. **Monorepo Awareness**: Changes in `@repo/core` affect both web and MCP apps. Test both when modifying core.

6. **Environment Variables**: Use Turborepo's env handling. Define variables in `turbo.json` for proper caching.

## Common Patterns

### Creating a New Service

```typescript
// packages/core/src/my-feature.ts
import { db } from './db';
import { z } from 'zod';

const InputSchema = z.object({
  // ...
});

export async function myFeature(input: z.infer<typeof InputSchema>) {
  const validated = InputSchema.parse(input);
  // Use db for queries
  return await db.query...
}
```

### Creating a New API Route

```typescript
// apps/web/app/api/my-feature/route.ts
import { myFeature } from '@repo/core';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const result = await myFeature(body);
  return Response.json(result);
}
```

## Troubleshooting

### Module Resolution Issues
```bash
# Clear all build caches
rm -rf node_modules .turbo apps/*/.next apps/*/.turbo packages/*/.turbo
npm install
```

### Database Connection Issues
- Check `DATABASE_URL` in root `.env` and `apps/web/.env`
- Verify NeonDB connection string is valid
- Ensure `?sslmode=require` is in connection string

### TypeScript Errors
```bash
# Type check all workspaces
npm run check-types

# Type check specific workspace
cd apps/web && npx tsc --noEmit
```

## Additional Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turborepo.dev/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)
