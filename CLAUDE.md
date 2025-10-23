# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kroolo BSM** - A comprehensive Business Service Management (BSM) platform built with Next.js 14, React, TypeScript, Supabase, and GraphQL. The system handles tickets, service requests, workflows, knowledge base, asset management (CMDB), and AI-powered assistance.

## Development Commands

### Environment Setup
```bash
# Development with schema validation (REQUIRED for first-time setup)
npm run dev

# Quick dev (skip schema validation, use only if DB is already synced)
npm run dev:quick

# Unsafe dev (skip all validation, development only)
npm run dev:unsafe

# Setup dev environment with auto-table creation
npm run dev:setup
```

### Database Management
```bash
# Validate database schema against source of truth
npm run schema:validate

# Create missing tables from schema
npm run schema:create

# Test database connection and CRUD operations
npm run test:db

# Full database test suite
npm run test:db:full

# Initialize and verify database
npm run init:check
```

### Build & Deployment
```bash
npm run build    # Production build (includes schema validation)
npm start        # Start production server
npm run lint     # Run ESLint
```

### Testing
```bash
# GraphQL testing
npm run test:graphql               # Test GraphQL connection
npm run test:graphql:reads         # Test read operations
npm run test:graphql:validate      # Validate all CRUD
npm run test:graphql:all           # Run all GraphQL tests
npm run test:graphql:service-requests
npm run test:graphql:users
npm run test:graphql:tickets

# Workflow testing
npm run test:workflows
npm run test:workflows:crud
npm run test:workflows:engine
```

## Critical Architecture Patterns

### Database Schema Management

**SINGLE SOURCE OF TRUTH**: `database-config/db.sql`

The entire application enforces strict schema validation via `scripts/init-dev.js`:
- All dev/build commands validate the database against `database-config/db.sql`
- Mismatches between schema file and actual database will **block execution**
- Use `--create-missing` flag to auto-create missing tables
- Use `--skip-validation` only in legacy scenarios (not recommended)

When modifying database structure:
1. Update `database-config/db.sql` (the source of truth)
2. Run `npm run schema:create` to apply changes
3. Never manually modify database without updating the schema file

### Data Access Layer Hierarchy

The application uses a **triple-layer data access strategy**:

1. **Supabase Client** (`lib/supabase/client.ts`)
   - Browser-side authentication and session management
   - PKCE flow for secure auth
   - Auto-refresh tokens, session persistence
   - Use for: Auth operations, RLS-protected queries

2. **GraphQL Client** (`lib/graphql/client.ts`)
   - Primary data access layer for authenticated operations
   - Two variants:
     - `createGraphQLClient()`: Uses user session (RLS enforced)
     - `createServerGraphQLClient()`: Service role (bypasses RLS, server-only)
   - Endpoint: `{SUPABASE_URL}/graphql/v1`
   - Use for: All CRUD operations, complex queries with joins

3. **Direct Supabase Queries**
   - Fallback for operations not supported by GraphQL
   - Use sparingly; prefer GraphQL for consistency

### Workflow Engine Architecture

**Location**: `lib/workflow/engine.ts`

The workflow engine implements a sophisticated state machine with:

- **Conditions**: Pre-transition validation (permissions, field values, time-based)
- **Validators**: Field validation, regex patterns, date constraints
- **Post-Functions**: Side effects after transitions (status updates, assignments, notifications)
- **Execution Context**: Thread-safe execution with detailed logging

Workflow execution pattern:
```typescript
const result = await workflowEngine.executeTransition(
  { actionId, currentStepId, context },
  workflow,
  entity,
  user
)
// result.success, result.validationErrors, result.logs
```

Supported condition types:
- `jira.permission.condition` - Permission checks
- `jira.field.required` - Required field validation
- `jira.user.condition` - User-based conditions (assignee, reporter)
- `jira.role.condition` - Role-based access
- `jira.field.value` / `jira.field.comparison` - Field value checks
- `jira.time.condition` - Time-based rules
- `custom.script` - Custom JavaScript evaluation

### State Management

**Zustand stores** in `lib/stores/`:
- `custom-columns-store.ts`: User-defined column configurations
- `ticket-filters-store.ts`: Ticket filtering state

Pattern: Minimal global state, prefer React Query for server state.

### AI Integration

**Location**: `app/api/ai/ask/route.ts`

AI capabilities:
- Context-aware ticket search and analysis
- User information lookup with ticket correlation
- Real-time database context injection
- Web search integration (DuckDuckGo API)
- Portkey.ai gateway for LLM routing
- Conversation history management
- Tool usage transparency

Context building:
1. Fetch recent tickets (last 50)
2. Extract user-specific tickets if `userContext` provided
3. Search tickets/users based on query intent
4. Optional web search with `/search` or `webSearch=true`
5. Inject context into system prompt

Streaming response pattern using Server-Sent Events (SSE).

### React Hooks Architecture

**Location**: `hooks/`

Key custom hooks:
- `use-knowledge-base.ts` / `use-knowledge-articles.ts`: Knowledge base CRUD with caching
- `use-tickets-gql.ts`: Ticket operations via GraphQL
- `use-users-gql.ts`: User management with role handling
- `use-services-assets-gql.ts`: Service catalog management
- `use-graphql.ts`: Generic GraphQL query wrapper
- `use-ai-stream.ts`: AI streaming response handler

Pattern: Hooks encapsulate data fetching, caching, and mutations using React Query.

### Component Organization

```
components/
├── ui/              # Shadcn/ui primitives (52 components)
├── tickets/         # Ticket management components
├── dashboard/       # Dashboard widgets and layouts
├── layout/          # App shell, navigation, sidebar
├── services/        # Service catalog components
├── workflows/       # Workflow builder and execution
├── knowledge-base/  # Knowledge base UI
├── ai/              # AI assistant modal and chat
└── [others]         # Auth, providers, analytics, etc.
```

**Shadcn/ui**: Extensive use of Radix UI primitives with Tailwind styling.

## TypeScript Configuration

**Path alias**: `@/*` maps to root directory
- Import example: `import { createClient } from '@/lib/supabase/client'`
- Compiler target: ES6
- Module resolution: bundler
- Strict mode enabled

## Environment Variables

Required:
```bash
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY         # Service role key (server-only)
PORTKEY_API_KEY                   # Portkey.ai gateway key
VIRTUAL_KEY_OPENAI                # OpenAI virtual key for Portkey
```

## Key Database Tables

Core entities (see `database-config/db.sql` for complete schema):

- **Organizations**: Multi-tenant isolation root
- **Profiles**: User profiles linked to `auth.users`
- **Tickets**: Incident/request tracking with workflow support
- **Service Requests**: Formal service catalog requests with approvals
- **Services**: IT service catalog
- **Workflows**: Configurable state machines with conditions/validators
- **Knowledge Articles**: Knowledge base with categories, comments, versions
- **Assets**: CMDB for hardware/software inventory
- **Teams**: Team structure and membership
- **Roles/Permissions**: RBAC system

Key relationships:
- Most tables have `organization_id` for multi-tenancy
- Tickets can link to Service Requests via `service_requests.ticket_id`
- Workflows can be triggered by Tickets or Service Requests
- Assets can map to Business Services via `service_asset_mappings`

## Security Patterns

- **Row Level Security (RLS)**: Enforced on all tables in Supabase
- **Multi-tenancy**: `organization_id` filtering on all operations
- **Role-Based Access Control**: `roles`, `permissions`, `user_roles`, `user_permissions` tables
- **Audit Logging**: All mutations logged to `audit_logs` table
- **Service Role Key**: Used only in server-side API routes, never exposed to client

## Common Patterns

### Creating a new GraphQL-based feature:

1. Add GraphQL query to `hooks/queries/[domain]-queries.ts`
2. Create custom hook in `hooks/use-[feature]-gql.ts`
3. Build UI component in `components/[domain]/[feature].tsx`
4. Wire up to page in `app/(dashboard)/[route]/page.tsx`

### Adding a new workflow transition:

1. Update workflow definition in database
2. Add conditions/validators as needed
3. Use `workflowEngine.executeTransition()` for execution
4. Log results to `workflow_executions` and `workflow_step_executions`

### Extending AI capabilities:

1. Modify context building in `app/api/ai/ask/route.ts`
2. Add new database queries for context enrichment
3. Update system prompt to reflect new capabilities
4. Add tool usage logging for transparency

## Testing Patterns

- GraphQL queries tested via `tests/test-graphql-*.ts`
- CRUD operations verified via `scripts/init-dev.js --test`
- Workflow transitions tested via `scripts/test-workflows.js`
- All test data auto-cleaned after execution

## Notes

- ESLint and TypeScript errors ignored during builds (`next.config.mjs`)
- Images unoptimized for faster builds
- Next.js App Router with React Server Components
- Tailwind CSS v4 with custom animations
