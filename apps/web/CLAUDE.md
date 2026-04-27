# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mcpflow is a Next.js 16 with app that helps to the users to create task boards and the AI agent like cursor or claude code can work with this boards and manage the tasks

## Development Commands

```bash
# Development
npm run dev              # Start development server on localhost:3000

# Production
npm run build           # Create production build
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
npx tsc --noEmit        # Type check without emitting files
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Clerk Authentication (required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Public URL del deploy (opcional). Se inyecta en el SKILL.md de la pagina /skill al copiar.
# Si no se setea, la pagina usa window.location.origin como fallback.
NEXT_PUBLIC_LIVE_URL=https://tu-dominio.example
```
Whe are using turbo repo to manage the monorepo , so thhe backend functions are in apps/api and the services are in the package `core`

## Architecture

### Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Authentication**: Clerk
- **UI**: Tailwind CSS v4
- **Backend**: Nextjs API Routes

### Data Architecture

The app has two data layers:

1. **Backend** (Primary):
    is hosted in nextjs api routes , and uses services from the package `core`
    so if you need to create some functionallity you need to create it in the package `core` and then use it in the api routes
    but before of creating validate if the functionallity is not already in the package `core`


### Authentication Flow

1. **Clerk Integration**:
   - All routes except `/sign-in` and `/sign-up` are protected (middleware.ts)
   - `ClerkProvider` wraps the app in app/layout.tsx


## Important Rules

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.