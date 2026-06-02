# Story 07 — CQRS, Sagas, Aggregates, Resilience, Observability

## Prerequisites

- Story 06 completed: all 11 NestJS 301 patterns in place.
- `@nestjs/cqrs` installed, `CqrsModule.forRoot()` in `app.module.ts`.

## Story Goal

Upgrade from NestJS 301 (infrastructure patterns) to NestJS 401 (domain patterns). After this story:

1. Checkout flow uses CQRS: commands, events, saga with compensation
2. ProductAggregate enforces domain invariants at creation time
3. CircuitBreaker protects Stripe-dependent payment methods
4. ObservabilityService provides structured logging with trace spans

## Implementation tasks

### 1 — CQRS infrastructure
- Installed `@nestjs/cqrs`
- Created 4 commands: `InitiateCheckoutCommand`, `ReserveInventoryCommand`, `ReleaseInventoryCommand`, `CreateOrderCommand`
- Created 4 events: `CheckoutInitiatedEvent`, `InventoryReservedEvent`, `InventoryReleaseFailedEvent`, `OrderCreatedEvent`
- Created 4 handlers with proper separation of concerns
- Created `CheckoutSaga` with 3-step orchestration + compensation

### 2 — Wiring
- `CheckoutController` uses `CommandBus` to dispatch `InitiateCheckoutCommand`
- `CheckoutModule` registers `CqrsModule`, command handlers, saga, `ObservabilityService`

### 3 — Domain aggregates
- `ProductAggregate` validates: name length, variant count for active products, positive prices
- `ProductsService.create()` constructs `ProductAggregate` to enforce invariants

### 4 — Resilience
- `@CircuitBreaker()` decorator with CLOSED/OPEN/HALF_OPEN states
- Applied to `PaymentsService.createPaymentIntent()`

### 5 — Observability
- `ObservabilityService` with structured JSON logging and trace span IDs
- Injected into `InitiateCheckoutHandler` for trace context propagation

## Files created

| File | Purpose |
|---|---|
| `src/modules/checkout/cqrs/commands/*.ts` | 4 CQRS commands |
| `src/modules/checkout/cqrs/events/*.ts` | 4 CQRS events |
| `src/modules/checkout/cqrs/handlers/*.ts` | 4 command handlers |
| `src/modules/checkout/cqrs/sagas/checkout.saga.ts` | Checkout orchestration saga |
| `src/core/aggregates/product.aggregate.ts` | Product domain aggregate |
| `src/common/resilience/circuit-breaker.decorator.ts` | Circuit breaker decorator |
| `src/core/observability/observability.service.ts` | Structured logging service |

## Files modified

| File | Change |
|---|---|
| `src/app.module.ts` | Added `CqrsModule.forRoot()` |
| `src/modules/checkout/checkout.module.ts` | Registered CqrsModule, handlers, saga, ObservabilityService |
| `src/modules/checkout/checkout.controller.ts` | Uses CommandBus instead of CheckoutService |
| `src/modules/payments/payments.service.ts` | Added @CircuitBreaker to createPaymentIntent |
| `src/modules/catalog/products/products.service.ts` | Uses ProductAggregate for domain validation |
| `src/modules/checkout/cqrs/handlers/initiate-checkout.handler.ts` | Injects ObservabilityService for tracing |

## Edge Cases & Failure Modes

- **Inventory reservation fails midway**: `ReserveInventoryHandler` catches the error, releases already-reserved items, publishes `InventoryReleaseFailedEvent`
- **Circuit breaker OPEN**: `PaymentsService.createPaymentIntent()` throws `Error('Circuit breaker stripe-create-payment is OPEN')` — caller receives 503
- **ProductAggregate validation fails**: `ProductsService.create()` throws before Prisma write — no dirty data
- **Saga duplicate events**: `@nestjs/cqrs` sagas are idempotent by default — no double-processing

## Done Criteria

- [x] CqrsModule.forRoot() registered
- [x] Checkout flow converted to CQRS saga
- [x] CheckoutSaga with compensation
- [x] CommandBus wired into CheckoutController
- [x] ProductAggregate enforces invariants
- [x] @CircuitBreaker applied to Stripe calls
- [x] ObservabilityService with structured logging
- [x] npx tsc --noEmit = 0 errors
- [x] npm run lint = 0 errors

**FINAL STORY complete.**