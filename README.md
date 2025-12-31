# FF Data - Fantasy Football Analytics

Visualize and analyze historical ESPN fantasy football data.

## Features

- **Standings**: Historical standings with year range filters and aggregate/average views
- **Hall of Fame**: Championship and Sacko records
- **Playoffs**: Leaderboard, records, blowouts, close games, cinderella runs, droughts, dynasties
- **Head-to-Head**: Win/loss matrix between all owners
- **Records**: Biggest blowouts and closest games
- **Weekly Scores**: Highest and lowest weekly performances
- **Rivalry**: Deep comparison between any two owners

## Tech Stack

- **Framework**: Next.js 16.1 (App Router) / TypeScript
- **UI**: React 19.2 + shadcn/ui + Tailwind CSS v4 (dark mode)
- **Database**: NeonDB PostgreSQL + node-pg-migrate
- **Validation**: Zod
- **State/API**: TanStack Query (React Query)
- **Auth**: Clerk
- **AI**: Anthropic SDK (infrastructure ready)
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Getting Started

### Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL=postgresql://...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Anthropic (for future AI features)
ANTHROPIC_API_KEY=

# ESPN (for future integration)
ESPN_S2=
ESPN_SWID=
```

## Database

### Schema

- **leagues**: ESPN league information
- **owners**: Human owners (persist across seasons)
- **seasons**: League years
- **teams**: Season-specific team data
- **matchups**: Week-by-week game results (scores, playoff flags)

### Migrations

```bash
# Run pending migrations
pnpm db:migrate

# Rollback last migration
pnpm db:migrate:down

# Create new migration
pnpm db:migrate:create -- <migration-name>
```
