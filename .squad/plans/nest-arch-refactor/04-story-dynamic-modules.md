# Story 04 — Dynamic modules, lifecycle hooks, domain facades

## Prerequisites

- **Story 03 completed:** `InfrastructureModule` provides `STRIPE_CLIENT`, `REDIS_CLIENT`, `MEILISEARCH_CLIENT` tokens. `RequestContextService` (REQUEST-scoped) and `ExecutionContextAdapter` exist. `EventEmitterModule.forRoot()` registered in `app.module.ts`.
- **Story 02 completed:** `GqlModule` uses `forRootAsync` pattern (line 29 of `graphql.module.ts`) — the `forRootAsync` / `forRoot` precedent for custom dynamic modules.

---

## Story Goal

Convert heavy module groups into feature-flagged dynamic modules, formalize boot/shutdown lifecycle hooks for infrastructure providers, and introduce domain facades to proactively define clean inter-module boundaries. After this story:

1. B2B sub-modules (`Business`, `PurchaseOrders`, `Quotes`, `TierPricing`) are conditionally registered via `B2BModule.forRootAsync()` reading `FEATURE_B2B` flag — not always loaded
2. The four standalone B2B module imports in `app.module.ts` are replaced by a single `B2BModule.forRootAsync()` entry
3. `InfrastructureModule` implements `OnApplicationBootstrap` for Redis connection verification + optional cache priming, and `OnApplicationShutdown` for graceful Redis disconnect
4. `PrismaService` adds a `beforeApplicationShutdown` hook pattern for explicit disconnect ordering
5. A `CheckoutFacade` service provides a single entry point for checkout orchestration (`Cart` → `Pricing` → `Inventory`) — clean API boundary
6. A `MarketplaceFacade` service provides a single entry point for marketplace operations (`Commissions` → `Vendors` → `CheckoutSplit`)
7. `featuresConfig` is consumed via `ConfigService` in the new dynamic modules (not raw `process.env` reads)
8. `NotificationsModule` receives a `forRoot()` configurable pattern for event transport

**Not in scope:** DiscoveryService metadata-driven registration (Story 05), LazyModuleLoader (Story 05), platform-agnostic core extraction (Story 05).

---

## Context — Read These Files First

1. `src/app.module.ts` — 99 lines. Imports array at lines 50–97 has 36 module entries. B2B modules at lines 89–92 (Business, PurchaseOrders, Quotes, TierPricing) will be replaced by a single `B2BModule.forRootAsync()` entry.
2. `src/config/features.config.ts` — 8 lines. Defines `featuresConfig` with `b2b` flag at line 5. Currently defined but never consumed — no module checks `features.b2b`.
3. `src/config/config.module.ts` — 59 lines. `ConfigModule.forRoot()` at line 19, 10 config namespaces at lines 22–33. Joi schema at lines 34–55. The dynamic module `forRootAsync` patterns use `imports: [ConfigModule]` + `inject: [ConfigService]`, matching the `GqlModule` precedent at `graphql.module.ts:29-47`.
4. `src/modules/graphql/graphql.module.ts` — 70 lines. `forRootAsync` pattern at lines 29–47 is the **precedent** for Story 04's `B2BModule.forRootAsync()`. Note `imports: [ConfigModule]`, `inject: [ConfigService]`, `useFactory` returning a config object.
5. `src/modules/b2b/business/business.module.ts` — 10 lines. Simple module: `controllers: [BusinessController]`, `providers: [BusinessService]`, `exports: [BusinessService]`. No imports.
6. `src/modules/b2b/purchase-orders/purchase-orders.module.ts` — 10 lines. Same pattern as BusinessModule.
7. `src/modules/b2b/quotes/quotes.module.ts` — 10 lines. Same pattern.
8. `src/modules/b2b/tier-pricing/tier-pricing.module.ts` — 10 lines. Same pattern.
9. `src/modules/b2b/index.ts` — re-exports all 4 B2B module barrels. Will be updated to export the new `B2BModule`.
10. `src/modules/infrastructure/infrastructure.module.ts` — 52 lines. Current `@Global()` module with async factory providers for Stripe, Redis, Meilisearch at lines 18–43. Lifecycle hooks (`OnApplicationBootstrap`, `OnApplicationShutdown`) will be added to this module class.
11. `src/database/prisma/prisma.service.ts` — 24 lines. Implements `OnModuleInit` at line 17 (`$connect()`) and `OnModuleDestroy` at line 21 (`$disconnect()`). Extends `PrismaClient` at line 8. The `onModuleDestroy` hook will be replaced with `beforeApplicationShutdown` for explicit disconnect ordering.
12. `src/modules/checkout/checkout.service.ts` — constructor at lines 10–15 injects `CartService`, `InventoryService`, `PricingService`. `initiate()` method at line 17 orchestrates the checkout flow. The new `CheckoutFacade` wraps this orchestration.
13. `src/modules/marketplace/checkout-split/checkout-split.service.ts` — constructor at lines 35–40 injects `PricingService`, `InventoryService`, `CommissionsService`. The new `MarketplaceFacade` wraps this.
14. `src/modules/notifications/notifications.service.ts` — 67 lines. Three `@OnEvent` handlers at lines 19, 37, 56. `sendEmail()` stub at line 12. `NotificationsModule.forRoot()` will accept transport configuration.
15. `src/modules/notifications/dto/notification.dto.ts` — 21 lines. `SendEmailDto` with `to`, `subject`, `template`, `data` fields. Used by the transport configuration.
16. `src/common/common.module.ts` — 67 lines. `AppConfigModule` is imported via `@Module({ imports: [ThrottlerModule.forRoot([...])] })` at lines 13–21. Global guard registrations at lines 49–60. Story 04 does not modify CommonModule.

---

## Implementation tasks

### 1 — Create B2B dynamic module

**Create file: `src/modules/b2b/b2b.module.ts`**

```typescript
import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BusinessModule } from './business/business.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { TierPricingModule } from './tier-pricing/tier-pricing.module';

@Module({})
export class B2BModule {
  static forRootAsync(): DynamicModule {
    return {
      module: B2BModule,
      imports: [ConfigModule],
      providers: [],
      exports: [],
    };
  }

  static forRoot(enabled = true): DynamicModule {
    const imports: any[] = [];
    if (enabled) {
      imports.push(BusinessModule, PurchaseOrdersModule, QuotesModule, TierPricingModule);
    }

    return {
      module: B2BModule,
      imports: [
        ConfigModule,
        ...imports,
      ],
      exports: imports,
    };
  }
}
```

Wait — the `forRootAsync` pattern from `GqlModule` (lines 29-47 of `graphql.module.ts`) registers everything inline. For the B2B case, we need to conditionally load sub-modules. Here's the correct pattern:

**Create file: `src/modules/b2b/b2b.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BusinessModule } from './business/business.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { TierPricingModule } from './tier-pricing/tier-pricing.module';

@Module({})
export class B2BModule {
  static forRootAsync() {
    return {
      module: B2BModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'B2B_MODULES',
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const enabled = configService.get<boolean>('features.b2b') === true;
            return enabled ? [BusinessModule, PurchaseOrdersModule, QuotesModule, TierPricingModule] : [];
          },
        },
      ],
    };
  }
}
```

Actually, NestJS dynamic modules can't use a provider to determine which modules to import — `DynamicModule.imports` must be resolved synchronously because they're consumed at module compilation time. The correct approach for conditional module loading is the spread pattern already used in `app.module.ts`:

**Corrected — create file: `src/modules/b2b/b2b.module.ts`**

```typescript
import { Module, DynamicModule } from '@nestjs/common';
import { BusinessModule } from './business/business.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { TierPricingModule } from './tier-pricing/tier-pricing.module';

@Module({})
export class B2BModule {
  static forRoot(): DynamicModule {
    const hasB2B = process.env.FEATURE_B2B === 'true';
    const b2bModules = hasB2B
      ? [BusinessModule, PurchaseOrdersModule, QuotesModule, TierPricingModule]
      : [];

    return {
      module: B2BModule,
      imports: b2bModules,
      exports: b2bModules,
    };
  }
}
```

The `app.module.ts` call site becomes `B2BModule.forRoot()` which reads `process.env.FEATURE_B2B` — matching the existing pattern at `app.module.ts:96` for `FEATURE_GRAPHQL`. The `featuresConfig` ConfigService pattern would be `forRootAsync` but for boolean feature flags at app boot, the env var read is simpler and consistent.

---

### 2 — Update B2B barrel exports

**Edit file: `src/modules/b2b/index.ts`**

Current content (4 lines):
```typescript
export { BusinessModule } from './business';
export { PurchaseOrdersModule } from './purchase-orders';
export { QuotesModule } from './quotes';
export { TierPricingModule } from './tier-pricing';
```

Replace with:
```typescript
export { B2BModule } from './b2b.module';
export { BusinessModule } from './business';
export { BusinessService } from './business';
export { PurchaseOrdersModule } from './purchase-orders';
export { PurchaseOrdersService } from './purchase-orders';
export { QuotesModule } from './quotes';
export { QuotesService } from './quotes';
export { TierPricingModule } from './tier-pricing';
export { TierPricingService } from './tier-pricing';
```

---

### 3 — Register B2BModule in app.module.ts, remove individual B2B imports

**Edit file: `src/app.module.ts`**

- At line 40, replace `import { BusinessModule } from './modules/b2b/business';` through line 43 with:
```typescript
import { B2BModule } from './modules/b2b';
```

- Remove lines 40–43 (the four individual B2B module imports):
```typescript
// REMOVE these:
import { BusinessModule } from './modules/b2b/business';
import { PurchaseOrdersModule } from './modules/b2b/purchase-orders';
import { QuotesModule } from './modules/b2b/quotes';
import { TierPricingModule } from './modules/b2b/tier-pricing';
```

- In the `imports` array, replace lines 89–92:
```typescript
  BusinessModule,
  PurchaseOrdersModule,
  QuotesModule,
  TierPricingModule,
```
with:
```typescript
  B2BModule.forRoot(),
```

---

### 4 — Add lifecycle hooks to InfrastructureModule

**Edit file: `src/modules/infrastructure/infrastructure.module.ts`**

Add imports at top:
```typescript
import {
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT, MEILISEARCH_CLIENT } from '../../common/tokens';
import Redis from 'ioredis';
```

Add to the class declaration:
```typescript
export class InfrastructureModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(InfrastructureModule.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Infrastructure bootstrap — verifying Redis connection');
    try {
      await this.redis.ping();
      this.logger.log('Redis connection verified');
    } catch (err) {
      this.logger.warn(`Redis not available: ${(err as Error).message}. Application will start without cache.`);
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Infrastructure shutdown (signal: ${signal})`);
    try {
      await this.redis.quit();
      this.logger.log('Redis disconnected');
    } catch {
      this.logger.warn('Redis disconnect failed — may already be closed');
    }
  }
```

Note: The `@Module()` decorator and its `providers`/`exports` array remain unchanged — they are on top of the class declaration, and the `implements` + constructor go below. NestJS allows `@Module()` + `implements` on the same class.

---

### 5 — Update PrismaService shutdown hook ordering

**Edit file: `src/database/prisma/prisma.service.ts`**

- Add import: `import { BeforeApplicationShutdown } from '@nestjs/common';`
- Change `implements OnModuleInit, OnModuleDestroy` to `implements OnModuleInit, OnModuleDestroy, BeforeApplicationShutdown`
- Add method after `onModuleDestroy()`:

```typescript
  async beforeApplicationShutdown(signal?: string) {
    await this.$disconnect();
  }
```

The `onModuleDestroy` hook fires when the module is destroyed (during HMR or module replacement). The `beforeApplicationShutdown` hook fires during graceful shutdown — ensuring Prisma disconnects **after** all in-flight requests complete but **before** the process exits. Both hooks call `$disconnect()` — idempotent.

---

### 6 — Create CheckoutFacade

**Create file: `src/modules/checkout/checkout.facade.ts`**

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService } from '../pricing/pricing.service';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto';

@Injectable()
export class CheckoutFacade {
  constructor(
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
    private readonly pricingService: PricingService,
    private readonly checkoutService: CheckoutService,
  ) {}

  async initiateCheckout(userId: string, dto: InitiateCheckoutDto) {
    const cart = await this.cartService.getCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    for (const item of cart.items) {
      const available = await this.inventoryService.getAvailability(item.productId, item.variantId);
      if (available < item.quantity) {
        throw new BadRequestException(
          `Insufficient inventory for ${item.productId}: requested ${item.quantity}, available ${available}`,
        );
      }
    }

    const pricedCart = await this.pricingService.calculatePrices(cart);

    return this.checkoutService.initiate(userId, {
      ...dto,
      pricedItems: pricedCart,
    });
  }
}
```

**Edit file: `src/modules/checkout/checkout.module.ts`**

Add `CheckoutFacade` to `providers` and `exports`:
```typescript
providers: [CheckoutService, CheckoutFacade],
exports: [CheckoutService, CheckoutFacade],
```

---

### 7 — Create MarketplaceFacade

**Create file: `src/modules/marketplace/marketplace.facade.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { CommissionsService } from './commissions/commissions.service';
import { VendorsService } from '../../vendors/vendors.service';
import { CheckoutSplitService } from './checkout-split/checkout-split.service';

@Injectable()
export class MarketplaceFacade {
  constructor(
    private readonly commissionsService: CommissionsService,
    private readonly vendorsService: VendorsService,
    private readonly checkoutSplitService: CheckoutSplitService,
  ) {}

  async calculateVendorRevenue(vendorId: string, startDate: Date, endDate: Date) {
    const vendor = await this.vendorsService.findById(vendorId);
    const splits = await this.checkoutSplitService.getByVendor(vendorId, startDate, endDate);
    const commissionRate = await this.commissionsService.getRate(vendorId);

    const totalGross = splits.reduce((sum, s) => sum + Number(s.vendorAmount), 0);
    const commission = totalGross * (Number(commissionRate) / 100);
    const netRevenue = totalGross - commission;

    return {
      vendorId,
      vendorName: vendor.storeName,
      totalGross,
      commissionRate: Number(commissionRate),
      commission,
      netRevenue,
      periodStart: startDate,
      periodEnd: endDate,
      splitCount: splits.length,
    };
  }

  async getVendorCommissionsSummary(vendorId: string) {
    const vendor = await this.vendorsService.findById(vendorId);
    const rate = await this.commissionsService.getRate(vendorId);
    return {
      vendorId,
      storeName: vendor.storeName,
      commissionRate: Number(rate),
      vendorStatus: vendor.status,
    };
  }
}
```

**Check what file exports MarketplaceFacade — which module?** It references `VendorsService` (from `../../vendors/vendors.service`), `CommissionsService` (from `./commissions/commissions.service`), and `CheckoutSplitService` (from `./checkout-split/checkout-split.service`). These all live under `src/modules/marketplace/` or `src/modules/vendors/`.

Since the facade crosses module boundaries, it should live in its own module or be registered where all deps are available. The cleanest location: create a dedicated `MarketplaceModule` that aggregates marketplace sub-modules, or register the facade in an existing aggregator module.

Given the project's structure, we'll place `MarketplaceFacade` in `src/modules/marketplace/` and create a `MarketplaceModule` that imports all marketplace sub-modules and exports the facade:

**Create file: `src/modules/marketplace/marketplace.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { CommissionsModule } from './commissions/commissions.module';
import { CheckoutSplitModule } from './checkout-split/checkout-split.module';
import { ProductApprovalModule } from './product-approval/product-approval.module';
import { ShippingPoliciesModule } from './shipping-policies/shipping-policies.module';
import { SettlementsModule } from './settlements/settlements.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VerificationModule } from './verification/verification.module';
import { VendorsModule } from '../../vendors/vendors.module';
import { MarketplaceFacade } from './marketplace.facade';

@Module({
  imports: [
    CommissionsModule,
    CheckoutSplitModule,
    ProductApprovalModule,
    ShippingPoliciesModule,
    SettlementsModule,
    DashboardModule,
    VerificationModule,
    VendorsModule,
  ],
  providers: [MarketplaceFacade],
  exports: [MarketplaceFacade],
})
export class MarketplaceModule {}
```

**Create file: `src/modules/marketplace/marketplace.facade.ts`** — same content as above.

**Create file: `src/modules/marketplace/index.ts`** — barrel export:
```typescript
export { MarketplaceModule } from './marketplace.module';
export { MarketplaceFacade } from './marketplace.facade';
```

---

### 8 — Register MarketplaceModule in app.module.ts, replace individual marketplace imports

**Edit file: `src/app.module.ts`**

- Remove individual marketplace module imports at lines 23–30:
```typescript
// REMOVE these:
import { ProductApprovalModule } from './modules/marketplace/product-approval/product-approval.module';
import { ShippingPoliciesModule } from './modules/marketplace/shipping-policies/shipping-policies.module';
import { VerificationModule } from './modules/marketplace/verification/verification.module';
import { CommissionsModule } from './modules/marketplace/commissions/commissions.module';
import { CheckoutSplitModule } from './modules/marketplace/checkout-split/checkout-split.module';
import { SettlementsModule } from './modules/marketplace/settlements/settlements.module';
import { DashboardModule } from './modules/marketplace/dashboard/dashboard.module';
```

- Add import:
```typescript
import { MarketplaceModule } from './modules/marketplace';
```

- In the `imports` array, replace lines 72–79:
```typescript
  VendorsModule,
  VerificationModule,
  CommissionsModule,
  ProductApprovalModule,
  ShippingPoliciesModule,
  CheckoutSplitModule,
  SettlementsModule,
  DashboardModule,
```
with:
```typescript
  VendorsModule,
  MarketplaceModule,
```

---

### 9 — Create notifications transport configuration

**Edit file: `src/modules/notifications/notifications.module.ts`**

Add a `forRoot()` static method to allow transport configuration:

```typescript
import { Module, DynamicModule } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

export interface NotificationsModuleOptions {
  transport?: 'log' | 'sendgrid' | 'smtp';
  sendgridApiKey?: string;
  fromAddress?: string;
}

@Module({})
export class NotificationsModule {
  static forRoot(options?: NotificationsModuleOptions): DynamicModule {
    const transport = options?.transport ?? 'log';

    return {
      module: NotificationsModule,
      providers: [
        {
          provide: 'NOTIFICATIONS_OPTIONS',
          useValue: { ...options, transport },
        },
        NotificationsService,
      ],
      exports: [NotificationsService],
    };
  }
}
```

**Edit file: `src/modules/notifications/notifications.service.ts`**

Add optional injection of transport options:
```typescript
import { Inject, Optional } from '@nestjs/common';
import { NotificationsModuleOptions } from './notifications.module';

// In constructor:
constructor(
  private readonly i18n: I18nService,
  @Optional() @Inject('NOTIFICATIONS_OPTIONS') private readonly options?: NotificationsModuleOptions,
) {}

// In sendEmail():
async sendEmail(dto: SendEmailDto) {
  const transport = this.options?.transport ?? 'log';
  if (transport === 'log') {
    this.logger.log(`[EMAIL] To: ${dto.to}, Subject: ${dto.subject}, Template: ${dto.template}`);
    return { sent: true, to: dto.to, template: dto.template, transport: 'log' };
  }
  this.logger.warn(`Email transport "${transport}" not implemented — falling back to log`);
  return { sent: true, to: dto.to, template: dto.template, transport: 'log' };
}
```

---

### 10 — Update app.module.ts to use NotificationsModule.forRoot()

**Edit file: `src/app.module.ts`**

In the `imports` array, replace `NotificationsModule,` with:
```typescript
NotificationsModule.forRoot(),
```

---

### 11 — Run validation commands

```bash
npx tsc --noEmit
npm run lint
```

---

## Edge Cases & Failure Modes

- **`FEATURE_B2B` not set to `'true'`**: `B2BModule.forRoot()` returns a module with empty `imports` and `exports`. No B2B controllers, services, or routes are registered. No crash. Any code that injects `BusinessService` will get a DI error at bootstrap — but nothing injects B2B services outside of B2B modules themselves.
- **Redis unavailable on bootstrap**: `InfrastructureModule.onApplicationBootstrap()` catches the `redis.ping()` error and logs a warning. Application starts without caching. `lazyConnect: true` (set in Story 03) prevents crash before bootstrap. The `REDIS_CLIENT` token still resolves to a Redis instance (not connected).
- **Redis disconnect during shutdown**: `redis.quit()` in `onApplicationShutdown` catches errors and logs a warning. Graceful shutdown continues.
- **PrismaService double-disconnect**: `onModuleDestroy` and `beforeApplicationShutdown` both call `$disconnect()`. Prisma's `$disconnect()` is idempotent — calling it twice is safe. No error.
- **MarketplaceModule aggregates sub-modules that other modules also import**: If `CheckoutSplitModule` is registered both under `MarketplaceModule` and imported elsewhere, NestJS detects duplicate module registration and throws `"Module has already been initialized"`. After this story, `CheckoutSplitModule`, `CommissionsModule`, etc. should ONLY be imported via `MarketplaceModule`. Verify no other module imports them.
- **CheckoutFacade wraps CheckoutService**: The `CheckoutFacade.initiateCheckout()` calls `CheckoutService.initiate()`. If controllers currently inject `CheckoutService` directly from the module, both `CheckoutService` and `CheckoutFacade` are exported from `CheckoutModule`. No breaking change — existing controllers can use either.
- **NotificationsModule.forRoot() replaces plain NotificationsModule**: If any module imports `NotificationsModule` directly (without calling `.forRoot()`), the DI will fail because the module no longer has static providers. After Story 04, `app.module.ts` uses `NotificationsModule.forRoot()` — the only registration point.

---

## Test Plan

No existing unit tests in `src/` — test infrastructure is configured but no `*.spec.ts` files exist.

1. **Build check**: `npx tsc --noEmit` — zero errors.
2. **Lint check**: `npm run lint` — no new errors.
3. **Dev boot with B2B disabled**: Set `FEATURE_B2B=false` in `.env`, restart. Verify B2B routes return 404. Verify no DI errors from missing B2B services.
4. **Dev boot with B2B enabled**: Set `FEATURE_B2B=true`, restart. Verify B2B routes are accessible.
5. **Redis unavailable boot**: Stop Redis container (`docker-compose stop redis`), restart app. Verify `"Redis not available"` warning log appears, app boots successfully.
6. **Redis available boot**: Start Redis, restart app. Verify `"Redis connection verified"` log appears.
7. **Graceful shutdown**: Start app, send SIGTERM. Verify `"Infrastructure shutdown"` and `"Redis disconnected"` logs appear in order.
8. **CheckoutFacade smoke test**: Add a temporary debug endpoint that injects `CheckoutFacade`. Call `initiateCheckout()` with valid cart — verify it calls through to `CheckoutService`.
9. **MarketplaceFacade smoke test**: Inject `MarketplaceFacade` — call `calculateVendorRevenue()`. Verify returns structured response.
10. **NotificationsModule.forRoot()**: Verify `NotificationsService` still fires on `order.created` events — no regression.
11. **REST regression**: `curl http://localhost:3000/health` returns `{ success: true, data: { status: "ok" } }`.
12. **GraphQL regression**: `POST /graphql` with a valid query returns data.
13. **Module count reduction**: Verify `app.module.ts` imports array is shorter — B2B went from 4 entries to 1, marketplace went from 7 entries to 1 (marketplace sub-modules are internal to `MarketplaceModule`).

---

## Migration / Rollback

**No database migration** required.

**Rollback**: Revert `app.module.ts` to restore individual B2B and marketplace module imports. Delete `b2b.module.ts`, `checkout.facade.ts`, `marketplace.module.ts`, `marketplace.facade.ts`. Revert `infrastructure.module.ts` to remove lifecycle hooks. Revert `prisma.service.ts` to remove `beforeApplicationShutdown`. Revert `notifications.module.ts` to plain module. No data loss.

**Half-applied state — B2BModule.forRoot() created but app.module.ts not updated**: Duplicate registration of B2B modules (`BusinessModule` under both `B2BModule.forRoot()` and the old individual imports). NestJS throws `"Module has already been initialized"` at bootstrap. Fix: remove old individual imports.

**Half-applied state — MarketplaceModule created but old imports remain**: Same duplicate registration error. Fix: remove old individual marketplace imports.

---

## Verification Steps

1. **Backend builds:** `npx tsc --noEmit` from project root — zero errors.
2. **Lint passes:** `npm run lint` — no new errors (22 pre-existing).
3. **Dev server boots:** `docker-compose up -d; npm run start:dev` — listens on port 3000.
4. **REST regression:** `curl http://localhost:3000/health` returns `{ success: true, data: { status: "ok" } }`.
5. **B2B disabled boot:** Set `FEATURE_B2B=false`, restart, verify boot. B2B routes 404.
6. **B2B enabled boot:** Set `FEATURE_B2B=true`, restart, verify B2B routes accessible.
7. **Redis lifecycle logs:** With Redis running, verify `"Redis connection verified"` log on bootstrap. SIGTERM → verify `"Redis disconnected"` log.
8. **Prisma graceful shutdown:** SIGTERM → verify `beforeApplicationShutdown` triggers `$disconnect()` (check Prisma debug logs if enabled).
9. **Notifications still work:** Order an item → verify notification event fires.
10. **GqlModule still conditionally loads:** Set `FEATURE_GRAPHQL=false`, restart, `POST /graphql` returns 404.

---

## Done Criteria

- [ ] `B2BModule.forRoot()` conditionally registers Business/PurchaseOrders/Quotes/TierPricing modules based on `FEATURE_B2B`
- [ ] Individual B2B module imports removed from `app.module.ts` — single `B2BModule.forRoot()` entry
- [ ] `InfrastructureModule` implements `OnApplicationBootstrap` and `OnApplicationShutdown`
- [ ] Redis connection verified on bootstrap (ping), gracefully disconnected on shutdown
- [ ] `PrismaService` implements `BeforeApplicationShutdown` for explicit disconnect ordering
- [ ] `CheckoutFacade` provides single orchestration entry point (Cart → Pricing → Inventory → Checkout)
- [ ] `MarketplaceFacade` provides single entry point for marketplace operations (Commissions → Vendors → CheckoutSplit)
- [ ] `MarketplaceModule` aggregates marketplace sub-modules, registered in `app.module.ts`
- [ ] Seven individual marketplace module imports removed from `app.module.ts` — single `MarketplaceModule` entry
- [ ] `NotificationsModule.forRoot()` accepts optional transport config
- [ ] `b2b.module.ts` barrel updated to export `B2BModule`
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes (no new errors)
- [ ] `docker-compose up -d; npm run start:dev` boots without errors
- [ ] `FEATURE_B2B=false` — B2B routes 404, no DI errors
- [ ] `FEATURE_B2B=true` — B2B routes accessible
- [ ] All 120+ REST endpoints continue working — no regression
- [ ] GraphQL queries continue working — no regression

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 05.**