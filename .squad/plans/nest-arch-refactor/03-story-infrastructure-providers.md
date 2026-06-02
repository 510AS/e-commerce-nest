# Story 03 — Infrastructure provider extraction + Request context

## Prerequisites

- **Story 01 completed:** i18n infrastructure + content translation. `I18nModule` is registered first in `src/app.module.ts`, `I18nService` uses `@Inject(REQUEST)` for request-scoped locale resolution. This plan replicates the same pattern for additional request-scoped providers.
- **Story 02 completed:** GraphQL API layer. Resolvers inject services from domain modules — the execution context adapter created here unifies REST and GraphQL access patterns.

---

## Story Goal

Extract hard-coded external client instantiation (Stripe, Redis, BullMQ, Meilisearch) into token-based custom providers with async factories. Introduce a unified request context abstraction scoped per-request to prevent data leakage across concurrent requests. After this story:

1. Stripe client is provided via `STRIPE_CLIENT` injection token — **not** instantiated inline in `PaymentsService`
2. Redis client is provided via `REDIS_CLIENT` injection token using an async factory (currently no Redis client exists — this adds the infrastructure)
3. Meilisearch client is provided via `MEILISEARCH_CLIENT` injection token using an async factory
4. `EventEmitterModule.forRoot()` is moved from `NotificationsModule` to `app.module.ts` — single root registration
5. A `RequestContextService` scoped to `Scope.REQUEST` provides unified access to `locale`, `tenant`, `authUser`, and `correlationId` across both REST and GraphQL
6. An `ExecutionContextAdapter` interface abstracts HTTP vs GraphQL context differences so guards/interceptors work in both modes without platform-specific branching
7. Injection token constants are defined in `src/common/tokens/injection-tokens.ts` for all external clients

**Not in scope:** Dynamic/configurable module conversion (Story 04), domain facades for circular dependency resolution (Story 04), DiscoveryService metadata-driven registration (Story 04), lazy-loading subsystems, platform-agnostic core domain extraction.

---

## Context — Read These Files First

1. `src/common/common.module.ts` — 67 lines. All 8 `APP_*` global providers (guards, filters, interceptors, pipe) registered at lines 23–60. `CorrelationIdMiddleware` applied at line 64. The new `RequestContextService` and `ExecutionContextAdapter` will be registered here so they're available before any domain module initializes.
2. `src/i18n/i18n.service.ts` — 63 lines. `@Inject(REQUEST)` pattern at line 29 makes `I18nService` request-scoped. `localeData` map at lines 17–25 loads locale files. This is the **precedent** for the `RequestContextService` REQUEST-scope pattern.
3. `src/i18n/i18n.module.ts` — 14 lines. `@Global()` at line 5, `exports: [I18nService]` at line 8, middleware config at lines 11–13. The `RequestContextModule` follows this same `@Global()` + middleware pattern.
4. `src/modules/payments/payments.service.ts` — 214 lines. Constructor at lines 11–18 instantiates `Stripe` client inline (`new Stripe(...)`) at line 15. Field `private stripe: any` at line 9. Replace `any` with `Stripe` type, inject `STRIPE_CLIENT` via constructor.
5. `src/config/stripe.config.ts` — 7 lines. `registerAs('stripe', ...)` pattern at line 3. Used by `PaymentsService` to get `secretKey`. The async factory for `STRIPE_CLIENT` will read from this config namespace.
6. `src/config/meilisearch.config.ts` — 6 lines. Defines host and apiKey. Used by the async factory for `MEILISEARCH_CLIENT`.
7. `src/config/redis.config.ts` — check exact lines. Used by the async factory for `REDIS_CLIENT`.
8. `src/modules/notifications/notifications.module.ts` — 10 lines. `EventEmitterModule.forRoot()` at line 6. **Remove** from here and register once in `src/app.module.ts`.
9. `src/app.module.ts` — 93 lines. 36 modules in `imports` array at lines 48–90. Add `EventEmitterModule.forRoot()`, `RequestContextModule`, and `InfrastructureModule` (new) here.
10. `src/common/tokens/` — **empty directory** (0 files). `injection-tokens.ts` will be created here.
11. `src/common/context/` — **empty directory** (0 files). `request-context.service.ts` and `execution-context.adapter.ts` will be created here.
12. `src/common/decorators/current-user.decorator.ts` — existing decorator. Reads `request.user`. The `RequestContextService` wraps this access pattern so GraphQL resolvers no longer need `@CurrentUser()` with the mistaken assumption it works in GraphQL context.
13. `src/modules/graphql/resolvers/cart.resolver.ts` — uses `CurrentUser` decorator (lines 1060, 1079, 1093). After refactoring, resolvers inject `RequestContextService` instead.
14. `src/modules/graphql/resolvers/order.resolver.ts` — uses `CurrentUser` decorator (line 1154). Same replacement.
15. `src/modules/graphql/guards/gql-auth.guard.ts` — extends `AuthGuard('jwt')`, uses `GqlExecutionContext` at line 175. The `ExecutionContextAdapter` abstracts this so a single auth guard works for both platforms.
16. `src/modules/graphql/guards/gql-roles.guard.ts` — uses `GqlExecutionContext` at line 196. Same abstraction target.
17. `src/config/config.module.ts` — 59 lines. Config namespaces at lines 22–33. The new `InfrastructureModule` registers its own async config consumers here (via `ConfigModule` import).

---

## Implementation tasks

### 1 — Create injection token constants

**Create file: `src/common/tokens/injection-tokens.ts`**

```typescript
export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
export const BULLMQ_QUEUE = Symbol('BULLMQ_QUEUE');
export const MEILISEARCH_CLIENT = Symbol('MEILISEARCH_CLIENT');
export const CACHE_MANAGER = Symbol('CACHE_MANAGER');
export const EVENT_PUBLISHER = Symbol('EVENT_PUBLISHER');
export const STORAGE_CLIENT = Symbol('STORAGE_CLIENT');
export const REQUEST_CONTEXT = Symbol('REQUEST_CONTEXT');
export const EXECUTION_CONTEXT_ADAPTER = Symbol('EXECUTION_CONTEXT_ADAPTER');
```

**Create file: `src/common/tokens/index.ts`**

```typescript
export * from './injection-tokens';
```

---

### 2 — Create InfrastructureModule with async providers

**Create directory: `src/modules/infrastructure/`**

**Create file: `src/modules/infrastructure/infrastructure.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { MeiliSearch } from 'meilisearch';
import Redis from 'ioredis';
import {
  STRIPE_CLIENT,
  REDIS_CLIENT,
  MEILISEARCH_CLIENT,
} from '../../common/tokens';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Stripe => {
        const secretKey = configService.get<string>('stripe.secretKey');
        return new Stripe(secretKey || '', {
          apiVersion: '2026-04-22.dahlia',
        });
      },
    },
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        return new Redis({
          host: configService.get<string>('redis.host', 'localhost'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password') || undefined,
          lazyConnect: true,
        });
      },
    },
    {
      provide: MEILISEARCH_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MeiliSearch => {
        const host = configService.get<string>('meilisearch.host', 'http://localhost:7700');
        const apiKey = configService.get<string>('meilisearch.apiKey', 'masterKey');
        return new MeiliSearch({ host, apiKey });
      },
    },
  ],
  exports: [STRIPE_CLIENT, REDIS_CLIENT, MEILISEARCH_CLIENT],
})
export class InfrastructureModule {}
```

---

### 3 — Install missing packages

```bash
npm install ioredis meilisearch
npm install --save-dev @types/ioredis
```

---

### 4 — Create RequestContextService

**Create file: `src/common/context/request-context.service.ts`**

```typescript
import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  locale?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get locale(): string {
    return (this.request as any).locale ?? 'en';
  }

  get tenant(): string | null {
    return (this.request as any).tenant ?? null;
  }

  get authUser(): AuthUser | null {
    return (this.request as any).user ?? null;
  }

  get correlationId(): string {
    return (this.request as any).correlationId ?? 'unknown';
  }

  get isAuthenticated(): boolean {
    return !!(this.request as any).user;
  }

  hasRole(...roles: string[]): boolean {
    const user = this.authUser;
    if (!user) return false;
    return roles.includes(user.role);
  }
}
```

Note: `@Injectable({ scope: Scope.REQUEST })` on the class itself ensures this is request-scoped even when REQUEST isn't directly injected by every consumer (it's injected here; consumers inject this service).

---

### 5 — Create ExecutionContextAdapter

**Create file: `src/common/context/execution-context.adapter.ts`**

```typescript
import { Injectable, Inject, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ExecutionContext } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class ExecutionContextAdapter {
  constructor(@Inject(REQUEST) private readonly request: any) {}

  static fromContext(context: ExecutionContext): ExecutionContextAdapter {
    const contextType = context.getType<'http' | 'graphql'>();
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      return new ExecutionContextAdapter(gqlCtx.getContext().req);
    }
    return new ExecutionContextAdapter(context.switchToHttp().getRequest());
  }

  get locale(): string {
    return this.request.locale ?? 'en';
  }

  get authUser(): any {
    return this.request.user ?? null;
  }

  get correlationId(): string {
    return this.request.correlationId ?? 'unknown';
  }

  get tenant(): string | null {
    return this.request.tenant ?? null;
  }
}
```

The static `fromContext()` factory allows any guard, interceptor, or filter to get a platform-agnostic context adapter without importing `GqlExecutionContext` directly.

---

### 6 — Create RequestContextModule

**Create file: `src/modules/infrastructure/request-context.module.ts`**

```typescript
import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestContextService } from '../../common/context/request-context.service';
import { ExecutionContextAdapter } from '../../common/context/execution-context.adapter';
import { TenantMiddleware } from './tenant.middleware';
import { REQUEST_CONTEXT, EXECUTION_CONTEXT_ADAPTER } from '../../common/tokens';

@Global()
@Module({
  providers: [
    RequestContextService,
    {
      provide: REQUEST_CONTEXT,
      useExisting: RequestContextService,
    },
    {
      provide: EXECUTION_CONTEXT_ADAPTER,
      useClass: ExecutionContextAdapter,
    },
  ],
  exports: [RequestContextService, REQUEST_CONTEXT, EXECUTION_CONTEXT_ADAPTER],
})
export class RequestContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
```

---

### 7 — Create TenantMiddleware

**Create file: `src/modules/infrastructure/tenant.middleware.ts`**

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenant?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    req.tenant = (req.headers['x-tenant-id'] as string) ?? null;
    next();
  }
}
```

---

### 8 — Create infrastructure barrel exports

**Create file: `src/modules/infrastructure/index.ts`**

```typescript
export { InfrastructureModule } from './infrastructure.module';
export { RequestContextModule } from './request-context.module';
```

---

### 9 — Update CommonModule barrel for context exports

**Edit file: `src/common/index.ts`** — add at line 10:

```typescript
export { RequestContextService } from './context/request-context.service';
export { ExecutionContextAdapter } from './context/execution-context.adapter';
export * from './tokens';
```

---

### 10 — Refactor PaymentsService to use STRIPE_CLIENT

**Edit file: `src/modules/payments/payments.service.ts`**

- At line 1, add import: `import { Inject } from '@nestjs/common';`
- At line 5, change `import Stripe from 'stripe';` from default import to default import (keep)
- Add import: `import { STRIPE_CLIENT } from '../../common/tokens';`
- At line 9, change `private stripe: any;` to nothing — remove the field declaration.
- At lines 11–18, replace the constructor with:

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly configService: ConfigService,
  @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
) {}
```

- Remove lines 15–17 (the `this.stripe = new Stripe(...)` block).

---

### 11 — Move EventEmitterModule.forRoot() to app.module.ts

**Edit file: `src/modules/notifications/notifications.module.ts`**

- At line 2, remove import: remove `import { EventEmitterModule } from '@nestjs/event-emitter';`
- At line 6, remove `EventEmitterModule.forRoot()` from the `imports` array. The `imports` array should become empty or be removed.

```typescript
import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

---

### 12 — Register new modules in app.module.ts

**Edit file: `src/app.module.ts`**

- At line 2, add import: `import { EventEmitterModule } from '@nestjs/event-emitter';`
- Add imports (after existing line 4):

```typescript
import { InfrastructureModule } from './modules/infrastructure';
import { RequestContextModule } from './modules/infrastructure';
```

- In the `imports` array:
  - After line 48 (`I18nModule`), add `RequestContextModule` and `InfrastructureModule` so they load before domain modules.
  - Add `EventEmitterModule.forRoot()` in the imports array before domain modules.

The updated imports array start should be:

```typescript
imports: [
  I18nModule,
  RequestContextModule,
  InfrastructureModule,
  EventEmitterModule.forRoot(),
  AppConfigModule,
  CommonModule,
  PrismaModule,
  // ... domain modules unchanged
],
```

---

### 13 — Update GqlAuthGuard to use ExecutionContextAdapter

**Edit file: `src/modules/graphql/guards/gql-auth.guard.ts`**

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContextAdapter } from '../../../common/context/execution-context.adapter';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const adapter = ExecutionContextAdapter.fromContext(context);
    return adapter['request']; // pass the raw request to passport
  }
}
```

Wait — `ExecutionContextAdapter` is request-scoped and cannot be used in guards that are singleton-scoped. Guards run before the request scope is established. Instead, refactor `ExecutionContextAdapter.fromContext()` to be a **pure static utility** that doesn't require injection:

**Re-edit file: `src/common/context/execution-context.adapter.ts`** — ensure `fromContext()` is a static method that does not rely on injection. It already is (it creates a new instance by passing the request). So guards can call `ExecutionContextAdapter.fromContext(context).authUser` without injection. The class should NOT be request-scoped for the `fromContext()` to work from guards:

Actually the issue is that `ExecutionContextAdapter` is `@Injectable({ scope: Scope.REQUEST })` — this means NestJS won't let you inject it into singleton-scoped providers (like guards). The solution: remove the `@Injectable()` decorator entirely from `ExecutionContextAdapter` and make it a plain class. The `RequestContextService` remains the injectable request-scoped service.

**Re-write `src/common/context/execution-context.adapter.ts`:**

```typescript
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

interface ContextualRequest {
  locale?: string;
  user?: any;
  tenant?: string;
  correlationId?: string;
}

export class ExecutionContextAdapter {
  constructor(private readonly req: ContextualRequest) {}

  static fromContext(context: ExecutionContext): ExecutionContextAdapter {
    const contextType = context.getType<'http' | 'graphql'>();
    if (contextType === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      return new ExecutionContextAdapter(gqlCtx.getContext().req);
    }
    return new ExecutionContextAdapter(context.switchToHttp().getRequest());
  }

  get locale(): string {
    return this.req.locale ?? 'en';
  }

  get authUser(): any {
    return this.req.user ?? null;
  }

  get correlationId(): string {
    return this.req.correlationId ?? 'unknown';
  }

  get tenant(): string | null {
    return this.req.tenant ?? null;
  }
}
```

**Remove `ExecutionContextAdapter` from `RequestContextModule` providers** — it's no longer an injectable. Remove the `EXECUTION_CONTEXT_ADAPTER` provider block. The `exports` array should only contain `RequestContextService` and `REQUEST_CONTEXT`.

---

### 14 — Update JwtAuthGuard to use ExecutionContextAdapter

**Edit file: `src/common/guards/jwt-auth.guard.ts`** — no changes needed. The existing guard already works correctly for HTTP context. The `ExecutionContextAdapter` is available for new guards or third-party consumers.

---

### 15 — Update HttpExceptionFilter to use RequestContextService

**Edit file: `src/common/filters/http-exception.filter.ts`**

Currently injects `I18nService` alone. Add `RequestContextService` injection to access `correlationId` from the context instead of reading it separately from the request object.

```typescript
import { RequestContextService } from '../context/request-context.service';

// In constructor, add:
constructor(
  private readonly i18n: I18nService,
  private readonly ctx: RequestContextService,
) {}
```

- Replace all direct `request.correlationId` reads with `this.ctx.correlationId`.

---

### 16 — Update TransformInterceptor to use RequestContextService

**Edit file: `src/common/interceptors/transform.interceptor.ts`**

Currently reads `request.locale` directly. Replace with `RequestContextService`:

```typescript
import { RequestContextService } from '../context/request-context.service';

// In constructor:
constructor(private readonly ctx: RequestContextService) {}

// In intercept():
const locale = this.ctx.locale;
const res = context.switchToHttp().getResponse();
res.setHeader('Content-Language', locale);
return next.handle().pipe(
  map((data) => ({
    success: true,
    data,
    ...(locale === 'ar' ? { dir: 'rtl' } : {}),
  })),
);
```

---

### 17 — Update PrismaExceptionFilter to use RequestContextService

**Edit file: `src/common/filters/prisma-exception.filter.ts`**

Same pattern — inject `RequestContextService` for `correlationId` access.

---

### 18 — Update CorrelationIdMiddleware to store in request context

**Edit file: `src/common/middleware/correlation-id.middleware.ts`**

Ensure `req.correlationId` is set (it already is via `x-correlation-id` header). The `RequestContextService` reads `request.correlationId`. If the middleware uses a different property name, align them. Currently at line 9, it reads/writes `correlationId`. Confirm property name matches.

---

### 19 — Run validation commands

```bash
npx tsc --noEmit
npm run lint
```

---

## Edge Cases & Failure Modes

- **Stripe secret key empty/missing**: `InfrastructureModule` factory reads `configService.get<string>('stripe.secretKey')` which falls back to `''` (from `stripe.config.ts` line 4). Stripe SDK throws on `new Stripe('')` with an invalid key error at boot time — not at request time. This is a **hard crash at bootstrap** if `STRIPE_SECRET_KEY` env var is not set. Consider providing a mock client when key is empty (`return { mock: true } as unknown as Stripe`), or validate in `ConfigModule` Joi schema that key is present when `FEATURE_MARKETPLACE === 'true'`.
- **Redis connection refused on bootstrap**: `lazyConnect: true` (InfrastructureModule line for Redis) prevents crash at bootstrap — connection is attempted on first command. The `REDIS_CLIENT` provider still resolves the Redis instance. Upstream consumers must handle connection errors.
- **Meilisearch host unreachable**: Same pattern as Redis — the client instance is created immediately but connections happen lazily. No crash at bootstrap.
- **RequestContextService injected into a singleton service**: NestJS will throw at bootstrap because a REQUEST-scoped provider cannot be injected into a singleton. The `RequestContextService` must only be injected into other REQUEST-scoped providers or middleware. If a domain service (e.g., `ProductsService`) tries to inject it, the DI container will fail. Domain services should receive the specific values they need (locale, userId, tenant) as **method parameters**, not via injection.
- **ExecutionContextAdapter used outside request context**: `fromContext()` is a pure static factory. If called outside of a request lifecycle (e.g., in a cron job), `context.switchToHttp()` or `context.getType()` returns undefined. The adapter gracefully returns `'en'`, `null`, `'unknown'` for all accessors.
- **Tenant header missing on multi-tenant routes**: `TenantMiddleware` sets `req.tenant = null` when `x-tenant-id` header is absent. `RequestContextService.tenant` returns `null`. All downstream tenant-gated logic must handle `null` tenant.
- **`EventEmitterModule.forRoot()` double-registration**: This story moves `forRoot()` from `NotificationsModule` to `app.module.ts`. If another module also calls `forRoot()`, NestJS throws `EventEmitterModule has already been initialized`. Ensure no other module calls `forRoot()` after this change.

---

## Test Plan

No existing unit tests in `src/` — test infrastructure is configured but no `*.spec.ts` files exist.

1. **Build check**: `npx tsc --noEmit` — zero errors. Validate that removing the inline `Stripe` instantiation from `PaymentsService` does not break type checks.
2. **Lint check**: `npm run lint` — passes.
3. **Dev boot**: `docker-compose up -d; npm run start:dev` — boots without errors. Confirm `InfrastructureModule` providers resolve (Stripe client with placeholder key, Redis with `lazyConnect`, Meilisearch client).
4. **Stripe injection smoke test**: Add a temporary `console.log(this.stripe)` in `PaymentsService.constructor` — verify the injected `stripe` is a Stripe instance (not `undefined`, not `any`).
5. **Redis injection test**: Inject `@Inject(REDIS_CLIENT)` into a throwaway debug endpoint — verify it's an `ioredis` instance.
6. **Meilisearch injection test**: Inject `@Inject(MEILISEARCH_CLIENT)` — verify it's a `MeiliSearch` instance.
7. **RequestContextService smoke test**: Temporarily add a debug endpoint that injects `RequestContextService` and returns `{ locale, authUser, correlationId, tenant }`. Send requests with different `Accept-Language`, `Authorization`, and `x-tenant-id` headers — verify correct values per request.
8. **TenantMiddleware smoke test**: Send request with `x-tenant-id: org-123` — verify `req.tenant === 'org-123'`. Send request without header — verify `req.tenant === null`.
9. **HttpExceptionFilter regression**: `curl http://localhost:3000/products/nonexistent-slug` — verify error response still contains `correlationId` field.
10. **TransformInterceptor regression**: `curl http://localhost:3000/health` — verify response still has `{ success, data }` wrapper and `Content-Language: en` header.
11. **GraphQL regression**: `POST /graphql` with `query { product(slug: "...") { id name } }` — verify success response.
12. **REST regression**: `curl http://localhost:3000/products` — verify paginated response unchanged.
13. **Event emitter regression**: Send an order confirmation event — verify `NotificationsService.handleOrderCreated()` still fires.
14. **Stripe mock when key missing**: Set `STRIPE_SECRET_KEY=` (empty) in `.env`, restart. Verify `InfrastructureModule` factory throws a clear error or provides a usable mock. If it crashes at bootstrap, add a mock fallback.
15. **Concurrent request isolation**: Send two simultaneous requests with different `Accept-Language` headers (`fr` and `ar`). Verify `RequestContextService.locale` returns correct value per request, not the other request's value.

---

## Migration / Rollback

**No database migration** required. This story only changes provider registration and injection patterns.

**Rollback**: Revert `app.module.ts` to restore `EventEmitterModule.forRoot()` in `NotificationsModule`. Revert `PaymentsService` to inline `new Stripe(...)`. Delete `src/modules/infrastructure/`, `src/common/context/`, `src/common/tokens/`. No data loss or schema changes.

**Half-applied state**: If the DI registration changes but `PaymentsService` still uses inline Stripe, Stripe will be instantiated twice — once in `InfrastructureModule` and once in `PaymentsService`. The `PaymentsService` instance will use its own inline instance (not the injected one) until step 10 is completed. No runtime error, just duplicated Stripe instances.

---

## Verification Steps

1. **Backend builds:** `npx tsc --noEmit` from project root — zero errors.
2. **Lint passes:** `npm run lint` — zero errors.
3. **Dev server boots:** `docker-compose up -d; npm run start:dev` — listens on port 3000.
4. **REST regression:** `curl http://localhost:3000/health` returns `{ success: true, data: { status: "ok" } }`.
5. **Stripe token works:** Verify `PaymentsService` receives a Stripe client via `@Inject(STRIPE_CLIENT)` — check via debug log or temporary endpoint.
6. **Redis token resolves:** Verify `@Inject(REDIS_CLIENT)` provides an `ioredis` instance.
7. **Request context isolates per request:** Two concurrent requests with different `Accept-Language` headers return different `Content-Language` headers.
8. **Tenant header flows through:** `curl -H "x-tenant-id: test-org" http://localhost:3000/health` — middleware sets `req.tenant`.
9. **Event emitter works:** Notifications fire on order events — no `EventEmitterModule not initialized` error.
10. **GraphQL queries still work:** `POST /graphql` with a valid query returns data.

---

## Done Criteria

- [ ] `STRIPE_CLIENT` injection token is defined in `src/common/tokens/injection-tokens.ts`
- [ ] `REDIS_CLIENT` injection token is defined in `src/common/tokens/injection-tokens.ts`
- [ ] `MEILISEARCH_CLIENT` injection token is defined in `src/common/tokens/injection-tokens.ts`
- [ ] `InfrastructureModule` provides async factories for all three clients, marked `@Global()`, registered in `src/app.module.ts`
- [ ] `PaymentsService` receives Stripe client via `@Inject(STRIPE_CLIENT)`, no longer instantiates it inline
- [ ] `EventEmitterModule.forRoot()` is removed from `src/modules/notifications/notifications.module.ts` and registered once in `src/app.module.ts`
- [ ] `RequestContextService` is `@Injectable({ scope: Scope.REQUEST })`, provides `locale`, `tenant`, `authUser`, `correlationId`, `isAuthenticated`, `hasRole()`
- [ ] `RequestContextModule` is `@Global()`, registers `RequestContextService` and `TenantMiddleware`, registered in `src/app.module.ts` before domain modules
- [ ] `TenantMiddleware` reads `x-tenant-id` header and sets `req.tenant`
- [ ] `ExecutionContextAdapter` is a pure utility class (not injectable) with static `fromContext()` that handles both HTTP and GraphQL contexts
- [ ] `HttpExceptionFilter` injects `RequestContextService` for `correlationId` access
- [ ] `TransformInterceptor` injects `RequestContextService` for `locale` access
- [ ] `PrismaExceptionFilter` injects `RequestContextService` for `correlationId` access
- [ ] `src/common/index.ts` barrel exports new tokens module and context services
- [ ] All 120+ REST endpoints continue working identically — no regression
- [ ] GraphQL queries continue working identically — no regression
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `docker-compose up -d; npm run start:dev` boots without errors
- [ ] Concurrent requests with different locale headers are isolated (no data leakage)

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 04.**