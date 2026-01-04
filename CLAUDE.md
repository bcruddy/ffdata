# CLAUDE.md - AI Coding Instructions

## Project Overview

FF Data is a Next.js 16.1 app for visualizing ESPN fantasy football historical data. League members only access via Clerk auth.

## Core Values

- It's ok to not know things
- Never guess or make something up, ask clarifying questions instead
- Never commit code or modify git history without explicit approval
- NEVER run data migrations without explicit approval
- Solve the problem where the user is

## Architecture

### Stack

- Next.js 16.1 (App Router) with React 19.2
- TypeScript strict mode
- Tailwind CSS v4 with shadcn/ui (dark mode default)
- NeonDB PostgreSQL with node-pg-migrate
- Clerk for authentication
- TanStack Query for client state
- Zod for validation
- Anthropic SDK for AI features (future)

### Key Directories

- `src/app/` - Next.js App Router pages
- `src/app/(dashboard)/` - Protected route group (requires auth)
- `src/app/api/analytics/` - Analytics API routes
- `src/components/ui/` - shadcn components (don't modify)
- `src/components/layout/` - App layout components (header, footer)
- `src/components/analytics/` - Analytics feature components
- `src/components/standings/` - Standings page components
- `src/lib/db/` - Database client and queries
- `src/lib/hooks/` - TanStack Query and utility hooks
- `src/lib/espn/` - ESPN API service (stub)
- `src/schemas/` - Zod validation schemas
- `src/types/` - TypeScript types
- `migrations/` - node-pg-migrate SQL migrations

### Database Schema

5 tables: leagues, owners, seasons, teams, matchups

- owners persist across seasons (for multi-year analytics)
- teams belong to a season and an owner
- matchups track week-by-week game results with playoff/championship flags

### Authentication

- Clerk middleware protects all routes except `/`, `/sign-in`, `/sign-up`
- Use `auth()` from `@clerk/nextjs/server` in server components
- Use `useUser()` from `@clerk/nextjs` in client components

### Routes

- `/` - Landing page (redirects to /standings if authenticated)
- `/standings` - Historical standings with year range filters and aggregate/average views
- `/analytics` - Analytics dashboard with tabs: Hall of Fame, Playoffs, Head-to-Head, Records, Weekly Scores, Rivalry

### API Routes

- `/api/analytics/hall-of-fame` - Championships and Sacko records
- `/api/analytics/matchups` - H2H records, matchup records, weekly scores
- `/api/analytics/playoffs` - Playoff leaderboard, records, and insights
- `/api/analytics/rivalry` - Rivalry stats between two owners

## Coding Conventions

### Components

- Server Components by default
- Add `'use client'` only when needed (hooks, events, browser APIs)
- Use shadcn/ui components from `@/components/ui/`
- Keep components small and focused

### Data Fetching

- Server Components: fetch directly or use db client
- Client Components: use TanStack Query hooks
- API routes in `src/app/api/`

### Styling

- Tailwind CSS only, no inline styles
- Use `cn()` from `@/lib/utils` for conditional classes
- Follow shadcn/ui patterns

### Validation

- Use Zod schemas for all inputs
- Schemas in `src/schemas/`
- Types derived from schemas when possible

### Database

- Use `sql` from `@/lib/db/client` for queries
- Snake_case in database, camelCase in TypeScript
- Always use parameterized queries

## Patterns

### Sortable Tables

Use `SortableHeader` and `useTableSort` for sortable table columns:

- `src/components/ui/sortable-header.tsx` - Clickable header with sort indicators
- `src/lib/hooks/use-table-sort.ts` - Generic sorting hook

```tsx
const { sortField, sortDirection, handleSort, sortedData } = useTableSort(
	data,
	(a, b, field) => {
		switch (field) {
			case 'name':
				return a.name.localeCompare(b.name);
			case 'wins':
				return a.wins - b.wins;
			default:
				return 0;
		}
	},
	{ defaultField: 'wins', textFields: ['name'] },
);
```

### TanStack Query Conventions

- Query keys: Use `analyticsKeys` factory in `src/lib/hooks/use-analytics.ts`
- Stale time: 30 minutes (`STALE_TIME = 30 * 60 * 1000`)
- GC time: 60 minutes (`GC_TIME = 60 * 60 * 1000`)
- Hooks live in `src/lib/hooks/`

## Commands

```bash
pnpm dev                # Start dev server
pnpm build              # Production build
pnpm start              # Start production server
pnpm lint               # Run ESLint
pnpm format             # Format with Prettier
pnpm format:check       # Check formatting
pnpm db:migrate         # Run migrations
pnpm db:migrate:down    # Rollback migration
pnpm db:migrate:create  # Create new migration
```

## ESPN Integration (Future)

ESPN API stub is in `src/lib/espn/client.ts`. Will require:

- espn_s2 cookie
- SWID cookie
- Rate limiting consideration

## AI Features (Future)

Anthropic SDK installed. Infrastructure ready for:

- Natural language queries about league data
- AI-generated insights and summaries
