# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/i18n-graphql/multi-language-i18n-support-graphql-integration/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):**
- **Feature slug (folder under `plans/`):** `i18n-graphql`

## Tracker (metadata only)

- **Tracker type:** `none`
- **Work item id:** `` *(used in filenames and plan tables; fill manually if empty)*
- **Work item type:** ``
- **Status:** ``
- **Assignee:** ``
- **Labels:** ``

External tracker links are **not** followed by the planner. Keep the id for naming and traceability only.

---

## Title

*(Paste the work item title verbatim. Prefilled when `squad new-story` fetched from a tracker.)*

```
Multi-language i18n support + GraphQL integration
```

---

## Description

Enhance the e-commerce platform with **multi-language support (i18n)** and a **GraphQL API layer** alongside the existing 120+ REST endpoints.

### Part A — Internationalization (i18n)

The platform currently returns all responses in hardcoded English: error messages, enum labels (OrderStatus, PaymentStatus, UserRole, etc.), email notifications, and product/category content. We need a language layer that detects the user's locale and returns translated content.

**Scope:**
- Add `Accept-Language` header parsing middleware (before CorrelationIdMiddleware)
- Store user locale preference on the User model (`locale` field, default `en`)
- Make all API error messages translatable — hook into `HttpExceptionFilter` and all service-layer thrown exceptions
- Translate enum display labels (16 enums: UserRole, OrderStatus, PaymentStatus, ProductStatus, VendorStatus, ShipmentStatus, etc.) via a resource file per locale
- Add i18n JSON columns to Product and Category for translatable content (name, description) — use Prisma `Json` fields
- Translate email/notification templates (order confirmation, abandoned cart reminders, waitlist notifications)
- Set `Content-Language` response header in TransformInterceptor
- Support locales: `en` (default), `ar` (RTL), `fr`, `es` as initial set
- RTL-aware response metadata for `ar` locale

### Part B — GraphQL API Layer

Add a parallel GraphQL interface using `@nestjs/graphql` (code-first approach) with Apollo Server. The REST API remains fully functional — GraphQL is additive.

**Scope:**
- Bootstrap `@nestjs/graphql` + Apollo Server Express at `/graphql`
- Enable GraphQL playground in dev mode
- Core Queries: `product`, `products`, `category`, `categories`, `cart`, `me`, `order`, `orders`, `vendor`, `vendors`
- Core Mutations: `register`, `login`, `addToCart`, `updateCartItem`, `removeFromCart`, `initiateCheckout`, `createOrderFromCheckout`, `createPaymentIntent`
- GraphQL types mirror Prisma models: User, Product, ProductVariant, Category, Cart, CartItem, Order, OrderItem, Payment, Vendor, etc.
- Relay-style cursor pagination on list queries (products, orders, categories)
- JWT auth via GraphQL context (reuse existing JwtAuthGuard logic)
- Role-based field access: ADMIN-only fields/mutations gated by `@Roles` equivalent in GraphQL
- GraphQL validation via `class-validator` DTOs mapped to input types
- Feign REST responses untouched — dual protocol, not a replacement

---

## Acceptance criteria

### i18n

- [ ] `GET /products/:slug` returns translated name+description when `Accept-Language: fr` is sent; falls back to `en` for missing translations
- [ ] `GET /categories/tree` returns translated category names based on `Accept-Language` header
- [ ] All `HttpExceptionFilter` error messages are translated (e.g., `NotFoundException('User not found')` resolves to French)
- [ ] Enum values in API responses appear in the requested locale (e.g., `order.status` returns `"Expédié"` instead of `"SHIPPED"` for `fr`)
- [ ] `POST /auth/register` accepts optional `locale` field; `GET /users/:id` returns the stored `locale`
- [ ] `PATCH /users/:id` allows changing `locale` preference
- [ ] Email notifications (order confirmation, waitlist notify, abandoned cart remind) render in the user's stored locale
- [ ] `Content-Language` response header matches resolved locale
- [ ] RTL locales (`ar`) set appropriate response metadata (`dir: rtl`)
- [ ] Missing translation keys fall back to English key name (no crashes)
- [ ] Product create/update DTOs accept `translations: { name: { en, ar, fr, es }, description: { en, ar, fr, es } }` JSON structures
- [ ] Category create/update DTOs accept `translations: { name: { en, ar, fr, es } }`

### GraphQL

- [ ] `GET /graphql` serves Apollo Sandbox playground in dev mode
- [ ] `query { products(first: 10) { edges { node { id name slug } } pageInfo { hasNextPage } } }` returns cursor-paginated products
- [ ] `query { product(slug: "...") { ...ProductFragment } }` resolves product with variants, prices, relations, and vendor
- [ ] `query { me { id email firstName lastName role } }` returns authenticated user from JWT context
- [ ] `mutation { addToCart(input: { productId, variantId, quantity }) { cart { items { product { name } } } } }` works with JWT
- [ ] `mutation { login(input: { email, password }) { accessToken refreshToken } }` echoes auth/social module behavior
- [ ] `mutation { initiateCheckout(input: { cartId, ... }) { checkout { id status total } } }` calls existing CheckoutService
- [ ] ADMIN-only queries (`orders`, `settlements/payouts`) reject non-admin JWT tokens
- [ ] Unauthenticated queries (no JWT) return `UNAUTHENTICATED` error
- [ ] Existing REST endpoints continue working identically — no regression on any of the 120+ endpoints
- [ ] GraphQL input validation mirrors class-validator rules (e.g., `email: IsEmail`, `quantity: Min(1)`)
- [ ] Relay cursor-based pagination consistent across all list queries
- [ ] TypeScript strict — no `any` types in resolver signatures

### Cross-cutting

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes
- [ ] All existing unit tests still pass
- [ ] `docker-compose up -d` + `npm run start:dev` boots without errors
- [ ] GraphQL i18n: query/mutation error messages are also translated via the same i18n layer

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |
| None. | |

---

## Dependencies

- **Blocked by / related ids:** none
- **Depends on code areas or other stories:**
  - `src/common/` — All shared infrastructure lives here: interceptors (`TransformInterceptor`, `LoggingInterceptor`), guards (`JwtAuthGuard`, `RolesGuard`), filters (`HttpExceptionFilter`), middleware (`CorrelationIdMiddleware`), pipes (`ParseObjectIdPipe`), decorators (`@Public`, `@Roles`, `@CurrentUser`), and shared DTOs (`PaginationDto`)
  - `src/app.module.ts` — All 42 modules registered here; GraphQL module and i18n module must be added
  - `src/main.ts` — Bootstrap: Apollo middleware registration, no global prefix currently
  - `src/config/` — ConfigModule with Joi validation; new `i18n.config.ts` + `graphql.config.ts` namespaces needed
  - `prisma/schema.prisma` — User model needs `locale` field; Product and Category need `translations Json` fields; Prisma migration required
  - `src/database/prisma/prisma.service.ts` — Unchanged (adapter already configured)
  - `src/modules/auth/` — `login()` and `register()` endpoints need i18n error messages and locale capture
  - `src/modules/users/` — User CRUD gains `locale` field in DTOs + service
  - `src/modules/catalog/products/` — Product DTOs gain `translations` JSON; service resolves locale-aware content
  - `src/modules/catalog/categories/` — Category DTOs gain `translations` JSON; tree endpoint resolves locale
  - `src/modules/orders/` — Order status enum labels + email templates need i18n
  - `src/modules/notifications/` — Email templates (`order.created`, `order.status_changed`, `checkout.abandoned`) need i18n rendering
  - `src/modules/cart/` — Cart service consumed by GraphQL cart mutations
  - `src/modules/checkout/` — CheckoutService consumed by GraphQL checkout mutation
  - `src/modules/payments/` — PaymentService consumed by GraphQL payment intent mutation
  - `src/modules/pricing/` — Already consumed by Cart/Checkout; GraphQL product queries need active price resolution
  - `src/modules/inventory/` — Stock data needed by GraphQL product variant queries
  - `src/modules/marketplace/vendors/` — Vendor public endpoint + marketplace vendor module need i18n
  - `src/modules/shipping/` — Shipping method names + status enum labels need translation
  - `src/modules/promotions/` — Promotion names/descriptions + coupon error messages need i18n
  - `src/modules/marketplace/settlements/` — Settlement status labels
  - All 29 controllers — Enum value serialization across the board is affected

## Extra notes (optional)

- This story is large and should be planned in **two execution phases**: Phase 1 = i18n infrastructure + core content translation, Phase 2 = GraphQL API layer. The squad planner may split these into separate plan files.
- The project currently has **zero** i18n dependencies and **zero** GraphQL dependencies. Both are greenfield additions.
- The project uses `PrismaService` injected into every service — GraphQL resolvers should follow the same pattern (inject services, not raw Prisma).
- Enum translation approach: resource JSON files per locale (`src/i18n/en/enums.json`, `src/i18n/fr/enums.json`, etc.) keyed by `EnumName.VALUE`. A shared `I18nService` resolves enum labels.
- Content translation approach: Product/Category `translations` JSON field stores locale-keyed content. Fallback chain: requested locale → `en` → first available locale.
- Feature flag suggestion: add `FEATURE_GRAPHQL` env flag (default `true`) so GraphQL can be toggled off in prod while iterating.

## Technical hints

### i18n

- **Package**: `nestjs-i18n` (`nestjs-i18n`) with `I18nModule.forRoot()` using JSON loader, resolvers for `Accept-Language` header, cookie, and query param
- **Middleware order**: i18n locale detection middleware → CorrelationIdMiddleware → guards → interceptors
- **User model change**: `locale String @default("en")` — single migration
- **Product model change**: `translations Json @default("{}")` — shape: `{ name: { en: "...", fr: "..." }, description: { en: "...", fr: "..." } }`
- **Category model change**: `translations Json @default("{}")` — shape: `{ name: { en: "...", fr: "..." } }`
- **DTO updates**: `CreateProductDto`, `UpdateProductDto`, `CreateCategoryDto`, `UpdateCategoryDto`, `RegisterDto`, `UpdateUserDto`
- **Error message i18n**: `I18nService.translate('errors.USER_NOT_FOUND', { lang })` in all service `throw new NotFoundException(...)` calls — this touches ~20 services
- **Email i18n**: `src/modules/notifications/notifications.service.ts` — template rendering must accept locale; all `@OnEvent()` handlers pass locale from event payload
- **Enum labels**: Centralize in `src/i18n/enums/` resource files; create `I18nService.formatEnum(enumType, value, lang)` helper used in all controller responses and the TransformInterceptor
- **RTL support**: Add `dir` field to `TransformInterceptor` response wrapper when locale is `ar`

### GraphQL

- **Package**: `@nestjs/graphql` + `@nestjs/apollo` + `@apollo/server` + `graphql` (v16+)
- **Module structure**: `src/modules/graphql/` with `graphql.module.ts` registering `GraphQLModule.forRootAsync<ApolloDriverConfig>({ driver: ApolloDriver })`
- **Code-first approach**: Use `@ObjectType()`, `@Field()`, `@InputType()`, `@ArgsType()`, `@Query()`, `@Mutation()`, `@Resolver()` decorators
- **Auth in context**: Create `GqlAuthGuard` extending `AuthGuard('jwt')` that reads from GraphQL execution context; use `@nestjs/graphql`'s `GqlExecutionContext`
- **Pagination**: Implement Relay cursor connections — `ConnectionType`, `EdgeType` helpers, base64-encoded cursors from `{ id, createdAt }`
- **Resolver pattern**: Each resolver class injects the same service the REST controller uses (e.g., `ProductsService`, `CartService`, `OrdersService`). Zero business logic duplication — resolvers are thin wrappers.
- **DTO reuse**: Map existing class-validator DTOs to `@InputType()` where possible. Example: `AddToCartDto` already validates `productId`, `variantId`, `quantity` — add `@InputType()` decorator and reuse.
- **Field resolution**: Use `@ResolveField()` for nested relations (e.g., `Product.variants` resolves via `ProductVariantsLoader` using Prisma `findMany`)
- **N+1 prevention**: Use `@nestjs/graphql`'s `@ResolveField` with DataLoader pattern for batch loading relations (variants, prices, inventory per product)
- **Config namespace**: `graphql.config.ts` — `playground: NODE_ENV !== 'production'`, `introspection`, `sortSchema: true`, `autoSchemaFile`
- **Keep REST untouched**: GraphQL runs as a parallel protocol. No existing controller code should be removed or altered in behavior.

### Key files to touch (non-exhaustive)
| File | Change |
|---|---|
| `src/main.ts` | No Apollo middleware needed here — `GraphQLModule` auto-registers |
| `src/app.module.ts` | Import `I18nModule`, `GraphQLModule` |
| `prisma/schema.prisma` | `locale` on User, `translations` on Product + Category |
| `src/common/interceptors/transform.interceptor.ts` | Add `Content-Language` + `dir` for RTL |
| `src/common/filters/http-exception.filter.ts` | Call `I18nService.translate()` on exception message |
| `src/common/decorators/` | Add `@Lang()` param decorator (extracts resolved locale from request) |
| `src/modules/graphql/` | New module: `graphql.module.ts`, `resolvers/`, `types/`, `guards/`, `dataloaders/` |
| `src/i18n/` | New directory: `en/`, `ar/`, `fr/`, `es/` resource JSON files + `i18n.module.ts`

## Out of scope

- Real-time GraphQL subscriptions (WebSocket) — only Queries and Mutations
- i18n for admin dashboard UI (this is API-level i18n only)
- Translating product/category content from a CMS or external translation service — content is stored as-is
- Removing or deprecating any REST endpoints
- GraphQL schema stitching or federation with external services
- Database-level full-text search in multiple languages (MeiliSearch i18n config)
- Right-to-left email template rendering for `ar` locale (API metadata only)
- Automatic currency conversion for multi-currency pricing (i18n is language only, not locale-based currency)
- Vendor storefront content i18n (store name translations) — out of scope for initial release
- GraphQL file uploads (product images via GraphQL multipart)
