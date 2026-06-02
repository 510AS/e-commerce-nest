# Story 05 — DiscoveryService, lazy-loading, platform agnosticism

## Prerequisites

- **Story 03 completed:** `InfrastructureModule`, `RequestContextService`, `ExecutionContextAdapter` exist.
- **Story 04 completed:** `B2BModule.forRoot()`, `MarketplaceModule`, `CheckoutFacade`, lifecycle hooks, `NotificationsModule.forRoot()`.

---

## Story Goal

Introduce advanced NestJS patterns for metadata-driven registration, lazy module loading, and platform-agnostic core logic. After this story:

1. `@Subscriber(eventName)` decorator + `SubscriberExplorer` auto-discovers event handlers via `DiscoveryService` — no manual `@OnEvent` coupling needed
2. `GqlModule` and `B2BModule` are lazy-loaded via `LazyModuleLoader` — not loaded at bootstrap unless `FEATURE_GRAPHQL` / `FEATURE_B2B` enabled
3. `src/core/` directory provides shared interfaces, response types, and error codes decoupled from REST/GraphQL adapters
4. `NotificationsService` event handlers are refactored to use `@Subscriber` metadata-driven discovery

**Not in scope:** Full CQRS migration, event sourcing, microservices.

---

## Context — Read These Files First

1. `src/common/decorators/public.decorator.ts` — 4 lines. `SetMetadata` + `IS_PUBLIC_KEY` pattern at lines 1–4. The `@Subscriber` decorator follows this same `SetMetadata` pattern.
2. `src/common/decorators/roles.decorator.ts` — 3 lines. `Reflector.createDecorator<string[]>()` pattern.
3. `src/modules/notifications/notifications.service.ts` — 67 lines. Three `@OnEvent` handlers at lines 19, 37, 56. Story 05 replaces `@OnEvent` with `@Subscriber` metadata decorators.
4. `src/app.module.ts` — 81 lines. Lines 78 conditionally loads `GqlModule`. Line 74 calls `B2BModule.forRoot()`. Lazy loading replaces both.
5. `src/modules/graphql/graphql.module.ts` — 70 lines. Heavy module (9 domain imports + 8 resolvers). Target for lazy loading.
6. `src/modules/b2b/b2b.module.ts` — 22 lines. Conditionally loads 4 sub-modules. Target for lazy loading.

---

## Implementation tasks

### 1 — Create @Subscriber decorator

**Create file: `src/common/decorators/subscriber.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';

export const SUBSCRIBER_EVENT = 'subscriber:event';
export const Subscriber = (event: string) => SetMetadata(SUBSCRIBER_EVENT, event);
```

**Edit file: `src/common/decorators/index.ts`** — add export:
```typescript
export { Subscriber, SUBSCRIBER_EVENT } from './subscriber.decorator';
```

---

### 2 — Create SubscriberExplorer

**Create file: `src/common/discovery/subscriber-explorer.service.ts`**

```typescript
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { SUBSCRIBER_EVENT } from '../decorators/subscriber.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface SubscriberHandler {
  instance: any;
  methodName: string;
  event: string;
}

@Injectable()
export class SubscriberExplorer implements OnModuleInit {
  private readonly logger = new Logger(SubscriberExplorer.name);

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    const providers = this.discoveryService.getProviders();
    const handlers: SubscriberHandler[] = [];

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== 'object') continue;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const event = Reflect.getMetadata(SUBSCRIBER_EVENT, instance[methodName]);
        if (event) {
          handlers.push({ instance, methodName, event });
        }
      }
    }

    for (const handler of handlers) {
      this.eventEmitter.on(handler.event, (...args: any[]) => {
        handler.instance[handler.methodName](...args);
      });
      this.logger.log(`Registered subscriber: ${handler.instance.constructor.name}.${handler.methodName} → "${handler.event}"`);
    }
  }
}
```

**Create file: `src/common/discovery/index.ts`**

```typescript
export { SubscriberExplorer } from './subscriber-explorer.service';
```

---

### 3 — Create DiscoveryModule

**Create file: `src/common/discovery/discovery.module.ts`**

```typescript
import { Module, Global } from '@nestjs/common';
import { DiscoveryModule as NestDiscoveryModule } from '@nestjs/core';
import { SubscriberExplorer } from './subscriber-explorer.service';

@Global()
@Module({
  imports: [NestDiscoveryModule],
  providers: [SubscriberExplorer],
})
export class DiscoveryModule {}
```

**Edit file: `src/app.module.ts`** — add `DiscoveryModule` to imports after `InfrastructureModule`:
```typescript
DiscoveryModule,
```

---

### 4 — Refactor NotificationsService to use @Subscriber

**Edit file: `src/modules/notifications/notifications.service.ts`**

Replace `@OnEvent(...)` decorators with `@Subscriber(...)`:

```typescript
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { SendEmailDto } from './dto';
import { I18nService } from '../../i18n';
import { NotificationsModuleOptions } from './notifications.module';
import { Subscriber } from '../../common/decorators/subscriber.decorator';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly i18n: I18nService,
    @Optional() @Inject('NOTIFICATIONS_OPTIONS') private readonly options?: NotificationsModuleOptions,
  ) {}

  // ... sendEmail unchanged ...

  @Subscriber('order.created')
  async handleOrderCreated(payload: { ... }) { ... }

  @Subscriber('order.status_changed')
  async handleOrderStatusChanged(payload: { ... }) { ... }

  @Subscriber('checkout.abandoned')
  async handleCheckoutAbandoned(payload: { ... }) { ... }
}
```

Remove `import { OnEvent } from '@nestjs/event-emitter';` from the imports.

---

### 5 — Update barrel exports

**Edit file: `src/common/index.ts`** — add DiscoveryService exports:
```typescript
export { Subscriber, SUBSCRIBER_EVENT } from './decorators/subscriber.decorator';
export { SubscriberExplorer } from './discovery/subscriber-explorer.service';
export { DiscoveryModule } from './discovery/discovery.module';
```

---

### 6 — Create core layer for platform agnosticism

**Create directory: `src/core/`**

**Create file: `src/core/response.types.ts`**

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  dir?: 'ltr' | 'rtl';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  correlationId: string;
  timestamp: string;
  path: string;
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}
```

**Create file: `src/core/index.ts`**

```typescript
export * from './response.types';
```

---

### 7 — Run validation commands

```bash
npx tsc --noEmit
npm run lint
```

---

## Edge Cases & Failure Modes

- **SubscriberExplorer finds a provider with multiple @Subscriber methods**: All are registered. No conflict — each method bound to its own event.
- **Subscriber method called without provider being properly initialized**: `onModuleInit` runs after all providers are instantiated. Safe.
- **DiscoveryService finds providers from disabled lazy modules**: DiscoveryService only scans loaded modules. If B2BModule is not loaded (FEATURE_B2B=false), its subscribers are not registered.
- **LazyModuleLoader fails to load module**: NestJS throws at request time (not bootstrap). The route that triggers lazy-loading will 500. Graceful degradation — other modules continue working.
- **@Subscriber conflicts with @OnEvent**: NotificationsService removes @OnEvent. Only @Subscriber is used. No double-registration.
- **Core types unused by existing code**: Response types in `src/core/` are reference material. Existing TransformInterceptor continues to shape responses. No breaking change.

---

## Test Plan

1. **Build check**: `npx tsc --noEmit` — zero errors.
2. **Lint check**: `npm run lint` — no new errors.
3. **Dev boot**: `docker-compose up -d; npm run start:dev` — boots.
4. **Subscriber registration log**: Verify `"Registered subscriber: NotificationsService.handleOrderCreated → 'order.created'"` appears in startup logs.
5. **Order created event**: Place an order. Verify notification event still fires (via log).
6. **B2B disabled boot**: `FEATURE_B2B=false`. Verify app boots, no B2B subscribers registered.
7. **REST regression**: `curl http://localhost:3000/health` returns 200.
8. **GraphQL regression**: `POST /graphql` returns data.

---

## Verification Steps

1. **Backend builds:** `npx tsc --noEmit` from project root — zero errors.
2. **Lint passes:** `npm run lint` — no new errors.
3. **Dev server boots without B2B:** Set `FEATURE_B2B=false`, `docker-compose up -d; npm run start:dev` — boots, B2B modules not loaded.
4. **Dev server boots with B2B:** Set `FEATURE_B2B=true`, restart — B2B modules load, subscriber registered.
5. **Subscriber fires:** Create order → check logs → `"[EMAIL] To: ..."` appears.
6. **REST health check:** `curl http://localhost:3000/health` → `{ success: true, data: { status: "ok" } }`.

---

## Done Criteria

- [ ] `@Subscriber(event)` decorator defined in `src/common/decorators/subscriber.decorator.ts`
- [ ] `SubscriberExplorer` uses `DiscoveryService` + `MetadataScanner` to auto-register event handlers
- [ ] `DiscoveryModule` is `@Global()`, registered in `app.module.ts`
- [ ] `NotificationsService` uses `@Subscriber` instead of `@OnEvent` — events still fire
- [ ] `src/core/response.types.ts` defines `ApiResponse`, `PaginatedResponse`, `ErrorResponse`, `SortOrder`
- [ ] `src/core/index.ts` barrel re-exports
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes (no new errors)
- [ ] `docker-compose up -d; npm run start:dev` boots without errors
- [ ] All 120+ REST endpoints continue working — no regression
- [ ] GraphQL queries continue working — no regression

**STOP HERE. This is the final story for the nest-arch-refactor feature.**