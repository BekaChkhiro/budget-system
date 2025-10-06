# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack budget tracking application built with Next.js 15, TypeScript, Supabase, and Tailwind CSS v4. The application helps users manage projects, track payments through installments or single payments, and monitor financial transactions.

**Key characteristics:**
- Uses Next.js App Router with Server Components
- Georgian language UI (`ka` locale)
- Turbopack for faster builds
- Comprehensive TypeScript types in `/types/index.ts`
- Supabase for database, authentication, and storage
- Rate limiting with Upstash Redis
- Zod v4 for validation

## Development Commands

```bash
# Development (with Turbopack)
npm run dev

# Build (with Turbopack)
npm run build

# Production server
npm run start

# Linting
npm run lint
```

## Environment Setup

Copy `env.example` to `.env.local` and configure:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for server operations
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` - For rate limiting

**Optional:**
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY` - Analytics
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

## Architecture

### Directory Structure

```
/app                    # Next.js App Router pages and API routes
  /projects            # Projects management pages
    /components        # Project-specific components
    actions.ts         # Server actions for projects
  /transactions        # Transactions pages
    /components        # Transaction-specific components
    actions.ts         # Server actions for transactions
  /auth               # Authentication actions
  /login, /signup     # Auth pages
  layout.tsx          # Root layout with navigation

/components            # Shared UI components
  /ui                  # shadcn/ui components
  /dashboard          # Dashboard-specific components
  navigation.tsx      # Main navigation component
  analytics.tsx       # Analytics integration

/lib                   # Core utilities and configurations
  /supabase           # Supabase client factories and data access
    client.ts         # Browser client
    server.ts         # Server component client
    middleware.ts     # Middleware client
    projects.ts       # Project CRUD operations
    transactions.ts   # Transaction CRUD operations
    installments.ts   # Installment CRUD operations
    dashboard.ts      # Dashboard queries
  /utils              # Utility functions (error handling, IP utils, etc.)
  /validations        # Zod schemas for form validation
  constants.ts        # App-wide constants
  utils.ts            # cn() utility for classnames

/hooks                 # React hooks
  use-projects.ts     # Project management hook
  use-transactions.ts # Transaction management hook
  use-installments.ts # Installment management hook
  use-dashboard.ts    # Dashboard data hook
  use-debounce.ts     # Debounce hook

/types                 # TypeScript type definitions
  database.types.ts   # Generated Supabase types
  index.ts            # Comprehensive app types (350+ lines)
  hooks.ts            # Hook return types
  utils.ts            # Utility types

/migrations            # SQL migration files

middleware.ts          # Authentication, rate limiting, security headers
```

### Database Schema

Three main tables with views for computed statistics:

**Tables:**
- `projects` - Core project info (title, total_budget, payment_type)
- `payment_installments` - Installment breakdown (project_id, amount, due_date, is_paid)
- `transactions` - Payment records (project_id, installment_id?, amount, transaction_date)

**Views:**
- `project_summary` - Projects with computed payment progress
- `installment_summary` - Installments with payment status
- `dashboard_stats` - Platform-wide statistics

All tables use UUID primary keys and cascade deletion.

### Key Architecture Patterns

1. **Data Access Layer**: All Supabase queries are in `/lib/supabase/[entity].ts` files with comprehensive error handling via `withErrorHandling()` wrapper

2. **Type System**:
   - Database types generated in `database.types.ts`
   - Enhanced types in `/types/index.ts` (e.g., `ProjectWithStats`, `TransactionWithRelations`)
   - Separate Insert/Update types for each entity
   - Hook return types defined explicitly

3. **Server Actions**: Located in `actions.ts` files alongside routes (e.g., `app/projects/actions.ts`)

4. **Validation**: Zod schemas in `/lib/validations/index.ts` for all forms

5. **Custom Hooks**: React Query-like hooks (`use-projects.ts`, etc.) handle loading states, errors, and mutations

6. **Middleware Flow**:
   - Rate limiting on API routes (100 req/min via Upstash)
   - Authentication checks (redirects to `/login` if not authenticated)
   - Security headers (CSP, HSTS, etc.)
   - Public paths: `/`, `/login`, `/signup`, static assets

### Component Patterns

- UI components use shadcn/ui with Radix UI primitives
- Forms use `react-hook-form` with `@hookform/resolvers` for Zod integration
- Loading states with skeleton components (e.g., `projects-table-skeleton.tsx`)
- Toast notifications via `sonner`
- Dialogs for CRUD operations (create/edit/delete confirmation)

## Common Tasks

### Adding a New Entity

1. Update database schema in a new migration file (`migrations/YYYYMMDD_description.sql`)
2. Run migration in Supabase SQL editor
3. Generate types: Use Supabase CLI to update `database.types.ts`
4. Add enhanced types to `/types/index.ts`
5. Create data access file in `/lib/supabase/[entity].ts`
6. Create validation schemas in `/lib/validations/index.ts`
7. Create hook in `/hooks/use-[entity].ts`
8. Create server actions in `app/[entity]/actions.ts`
9. Create UI components in `app/[entity]/components/`

### Working with Forms

Forms use `react-hook-form` with Zod validation:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { mySchema } from '@/lib/validations'

const form = useForm({
  resolver: zodResolver(mySchema),
  defaultValues: {...}
})
```

### Database Queries

Always use the abstracted functions in `/lib/supabase/[entity].ts`. These include:
- Error handling via `withErrorHandling()`
- Type safety with comprehensive TypeScript types
- Pagination support
- Filter support

Example:
```typescript
import { getProjects } from '@/lib/supabase/projects'

const result = await getProjects(
  { search: 'keyword', is_completed: false },
  1,  // page
  20  // pageSize
)
```

### Authentication

- Auth handled by Supabase Auth
- Middleware protects routes (see `middleware.ts:19-35` for path configuration)
- Use `createClient()` from appropriate context:
  - Browser: `@/lib/supabase/client`
  - Server Component: `@/lib/supabase/server`
  - Middleware: `@/lib/supabase/middleware`

## Important Notes

- **Georgian Language**: UI text is in Georgian. Keep this consistent when adding new features
- **Path Alias**: Use `@/*` to reference project root (configured in `tsconfig.json`)
- **Turbopack**: Build commands use `--turbopack` flag
- **Zod Version**: Uses Zod v4.x (check for breaking changes from v3)
- **Tailwind v4**: Using Tailwind CSS v4 with PostCSS plugin
- **Rate Limiting**: Requires Upstash Redis environment variables
- **Type Generation**: Database types should be regenerated after schema changes
