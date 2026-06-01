# E-Commerce Nest — Agent Instructions

NestJS + Prisma + PostgreSQL hybrid marketplace backend. Monolith REST API.

## Critical Commands

```bash
npx tsc --noEmit              # Type-check — run after every schema or code change
npx prisma generate            # Regenerate Prisma client — REQUIRED after schema changes; output at src/generated/ is gitignored
npm run lint                   # ESLint + Prettier
npm test                       # Jest unit tests (all *.spec.ts files)
npm run test:e2e               # E2E tests (config exists at test/jest-e2e.json, no test files yet)
npm run start:dev              # Dev server (requires Docker services)
docker-compose up -d           # PostgreSQL, Redis, RabbitMQ, MeiliSearch, MinIO
```

**Always run `prisma generate` then `tsc --noEmit` after any Prisma schema change.** The client at `src/generated/prisma/` is gitignored — skipping generate breaks all TypeScript checks.

## Prisma Schema

- Single file: `prisma/schema.prisma` (839 lines, all models + enums)
- Client output: `src/generated/prisma/` (CJS format, gitignored)
- `prisma.config.ts` loads `.env` via `dotenv/config`
- **PrismaService is `@Global()`** — injectable everywhere without importing PrismaModule
- PrismaService uses `@prisma/adapter-pg` with raw `pg.Pool`, not the default driver
- `ProductVariant` has NO `price: Decimal` field — price is in `ProductPrice` (1:1 relation)
- `Product.ownerType` is `ProductOwner` enum (`PLATFORM` | `VENDOR`), default `PLATFORM`
- **Migrations are gitignored** (`prisma/migrations/` in .gitignore) — use `prisma migrate dev` locally

## Architecture

### Global middleware (applied by CommonModule — do not re-register)
- `JwtAuthGuard` — GLOBAL guard, ALL endpoints require auth by default. Use `@Public()` to skip.
- `RolesGuard` — GLOBAL, use `@Roles(['ADMIN'])` to restrict.
- `ValidationPipe` — GLOBAL with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. DTOs must declare all accepted fields; extra fields are rejected.
- `TransformInterceptor` — wraps all controller returns in `{ success, data, meta }`
- `HttpExceptionFilter`, `PrismaExceptionFilter` — GLOBAL error filters
- `ThrottlerBehindProxyGuard` — rate limiting: 100 req/60s
- `CorrelationIdMiddleware` — on all routes
- Pino logger (via `nestjs-pino`) — JSON logs in production
- API prefix: `/api/v1`, Swagger at `/api/docs`

### Module pattern
```
src/modules/<domain>/<name>/
  dto/<name>.dto.ts           # class-validator + @nestjs/swagger DTOs
  dto/index.ts                # barrel export
  <name>.service.ts           # business logic
  <name>.controller.ts        # REST endpoints
  <name>.module.ts            # NestJS module, exports service if needed by other modules
  index.ts                    # barrel export Module + Service
```

Some modules are nested: `src/modules/catalog/products/`, `src/modules/marketplace/settlements/`, `src/modules/b2b/business/`, `src/modules/auth/social/`, `src/modules/cart/abandoned/`, `src/modules/cms/seo/`.

### Module registration
Every new module must be added to `src/app.module.ts` imports array (39 modules currently registered).

### Common imports
```typescript
import { PrismaService } from '../../database/prisma/prisma.service';
import { Public, Roles, CurrentUser, ParseObjectIdPipe } from '../../common';
```
- `@Public()` — skip JWT auth
- `@Roles(['ADMIN'])` — require role(s)
- `@CurrentUser()` — extract authenticated user from request
- `@ApiBearerAuth()` — Swagger auth docs
- `ParseObjectIdPipe` — validates UUID params (misleading name, validates UUIDs)

### Key module dependency graph
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
- **Imports use relative paths**, not `@/` aliases (aliases configured in tsconfig but unused)
- **Every DTO folder has a barrel `index.ts`**
- **Services export from module** when other modules need them (`exports: [XService]`)
- **Controller responses are plain returns** — `TransformInterceptor` wraps them
- **Git commits**: `Step N - Description` with bullet-point details under `## What Changed`

## Testing

- Jest config: `jest.config.js`, tests matched by `*.spec.ts$`, rootDir `.`
- `npm test` — all unit tests; Docker services NOT required (mock PrismaService)
- Mock pattern: use `jest.Mocked<ServiceType>` for injected deps, `useValue` with jest mocks

## Environment

- `.env` loaded by both `prisma.config.ts` and NestJS ConfigModule
- Feature flags: `FEATURE_MARKETPLACE`, `FEATURE_B2B`, `FEATURE_SEARCH` (defined in `src/config/features.config.ts`)
- Stripe keys are placeholders (real integration needs live keys)
- Docker services: PostgreSQL (5432), Redis (6379), RabbitMQ (5672/mgmt:15672), MeiliSearch (7700), MinIO (9000/console:9001)