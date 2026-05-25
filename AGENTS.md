# E-Commerce Nest — Agent Instructions

NestJS + Prisma + PostgreSQL hybrid marketplace backend. Greenfield project, 54 modules, monolith API.

## Critical Commands

```bash
# Type-check (run after EVERY schema or code change)
npx tsc --noEmit

# After EVERY Prisma schema change — regenerate client (output is gitignored at src/generated/)
npx prisma generate

# Lint
npm run lint

# Start dev server (requires Docker services running)
docker-compose up -d          # PostgreSQL, Redis, RabbitMQ, MeiliSearch, MinIO
npm run start:dev
```

**Always run `prisma generate` then `tsc --noEmit` after schema changes.** The Prisma client at `src/generated/prisma/` is gitignored — skipping generate breaks all TypeScript checks.

## Architecture

### Module pattern
Every module follows this structure:
```
src/modules/<name>/
  dto/<name>.dto.ts      # class-validator + @nestjs/swagger DTOs
  dto/index.ts           # barrel export
  <name>.service.ts      # business logic, always injects PrismaService
  <name>.controller.ts   # REST endpoints
  <name>.module.ts       # NestJS module, exports service
  index.ts               # barrel export Module + Service
```

### Module registration
Every new module must be added to `src/app.module.ts` imports array.

### Common imports (use these, don't reimplement)
```typescript
import { PrismaService } from '../../database/prisma/prisma.service';
import { Public, Roles, CurrentUser, ParseObjectIdPipe } from '../../common';
```

- `@Public()` — skip JWT auth on an endpoint
- `@Roles(['ADMIN'])` — require specific role(s)
- `@CurrentUser()` — extract authenticated user from request
- `@ApiBearerAuth()` — Swagger auth docs for protected endpoints
- `ParseObjectIdPipe` — validates UUID params

### Prisma schema
- Config at `prisma.config.ts` (uses `dotenv/config` auto-load)
- Client output: `src/generated/prisma/` (CJS format, gitignored)
- Single `prisma/schema.prisma` file, all models + enums in one file
- `ProductVariant` has NO `price: Decimal` field — price is in `ProductPrice` (1:1 relation)
- `Product.ownerType` is `ProductOwner` enum (`PLATFORM` | `VENDOR`), default `PLATFORM`

### Key module graph (Phase 2-3 dependencies)
```
Cart ← Pricing
Checkout ← Cart, Inventory, Pricing
Orders ← Checkout (createFromCheckout), Audit
Payments ← Orders (Stripe PaymentIntents)
Settlements ← VendorOrderSplit, Vendor
CheckoutSplit ← Cart, Commissions, Pricing, Inventory
```

## Conventions

- **No comments** in code unless absolutely necessary
- **Imports use relative paths**, not `@/` aliases (aliases configured in tsconfig but not used in any module files)
- **Every DTO folder has a barrel `index.ts`**
- **Services export from module** when other modules need them (`exports: [XService]`)
- **Controller responses are plain returns** — the global `TransformInterceptor` wraps them in `{ success, data, meta }`
- **Git commits**: `Step N - Description` with bullet-point details under `## What Changed`

## Testing

- Jest configured for `*.spec.ts` files (rootDir: `..` means tests run from workspace root)
- `npm test` runs all unit tests
- No E2E tests yet (config exists at `test/jest-e2e.json` but no test files)
- Docker services NOT required for unit tests (mock PrismaService)

## Environment

- `.env` file loaded by `prisma.config.ts` and NestJS ConfigModule
- Feature flags: `FEATURE_MARKETPLACE`, `FEATURE_B2B`, `FEATURE_SEARCH`
- Stripe keys are placeholders (real integration needs live keys)