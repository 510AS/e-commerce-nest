# Story 06 — Missing advanced patterns

## Prerequisites

- Story 03-05 completed. All architecture refactoring patterns in place.
- Zero circular deps currently. Zero ModuleRef usage. Zero LazyModuleLoader usage.

## Story Goal

Implement the 3 missing NestJS advanced patterns + strengthen platform agnosticism:

1. **forwardRef** — Introduce a realistic circular dependency between PricingModule and OrdersModule (loyalty pricing needs order history). Resolve with `forwardRef()` + domain facade interface.
2. **ModuleRef** — Add `ModuleRef`-based dynamic service resolution in `SubscriberExplorer` for handler injection.
3. **LazyModuleLoader** — Load `GqlModule` and `B2BModule` lazily — not at bootstrap.
4. **Platform agnosticism** — Create a proper `ProductDto` / `CategoryDto` mapping layer that converts Prisma models to platform-agnostic DTOs, usable by both REST and GraphQL.

## Implementation tasks

### 1 — Loyalty pricing with forwardRef (circular dependency resolution)

**Edit file: `src/modules/pricing/pricing.module.ts`** — add forwardRef import for OrdersModule:
```typescript
import { Module, forwardRef } from '@nestjs/common';
import { PricingService } from './pricing.service';
// OrdersModule is forwarded because OrdersService is used in loyalty pricing
// and OrdersModule already imports CartModule which imports PricingModule

@Module({
  imports: [forwardRef(() => require('../orders/orders.module').OrdersModule)],
  providers: [PricingService],
  exports: [PricingService],
})
```

**Edit file: `src/modules/pricing/pricing.service.ts`** — add loyalty discount:
```typescript
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async calculateLoyaltyDiscount(userId: string, subtotal: number): Promise<number> {
    const recentOrders = await this.prisma.order.count({
      where: { userId, status: 'DELIVERED' },
    });

    if (recentOrders >= 10) return Math.round(subtotal * 0.05 * 100) / 100;
    if (recentOrders >= 5) return Math.round(subtotal * 0.02 * 100) / 100;
    return 0;
  }
}
```

### 2 — ModuleRef in SubscriberExplorer

**Edit file: `src/common/discovery/subscriber-explorer.service.ts`** — add ModuleRef:
```typescript
import { ModuleRef } from '@nestjs/core';

// In constructor, add ModuleRef:
constructor(
  ...
  private readonly moduleRef: ModuleRef,
) {}

// In onModuleInit(), after registering handlers:
this.logger.log(`SubscriberExplorer loaded with ${handlers.length} handlers via ModuleRef`);
```

### 3 — LazyModuleLoader for GqlModule and B2BModule

**Edit file: `src/app.module.ts`** — replace eager loading with lazy loading pattern.

### 4 — Platform-agnostic DTOs

**Create file: `src/core/mappers/product.mapper.ts`** — converts Prisma Product to ProductDto.
**Create file: `src/core/dto/product.dto.ts`** — platform-agnostic Product DTO.

## Done Criteria

- [ ] forwardRef used in PricingModule → OrdersModule circular dependency
- [ ] LoyaltyDiscountService separates Pricing concern from Orders concern
- [ ] ModuleRef used in SubscriberExplorer
- [ ] LazyModuleLoader loads GqlModule on first /graphql request
- [ ] platform-agnostic ProductDto + CategoryDto with mapper functions

**STOP HERE. Final story. All 11 NestJS patterns now present.**