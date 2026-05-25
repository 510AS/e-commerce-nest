# Story 01 — i18n infrastructure + content translation

## Prerequisites

- None. This is the first story in the `i18n-graphql` feature.

---

## Story Goal

Add multi-language support to the API layer. After this story:

1. Every API response includes a `Content-Language` header matching the user's locale
2. Error messages from `HttpExceptionFilter` are translated into the requested locale
3. Enum values (`OrderStatus`, `PaymentStatus`, `UserRole`, etc.) appear in the user's language
4. `Product.name`, `Product.description`, and `Category.name` can be stored in multiple languages and resolved via `Accept-Language`
5. Users can set a `locale` preference via registration or profile update
6. Email notifications render in the user's stored locale (order confirmation, abandoned cart, waitlist)
7. RTL locales (`ar`) set a `dir` field in the response wrapper

**Not in scope:** GraphQL API layer (Story 02), UI-level i18n, vendor storefront translations, automatic currency conversion.

---

## Context — Read These Files First

1. `src/common/interceptors/transform.interceptor.ts` (~lines 1–15) — Current interceptor wraps response in `{ success, data }`. This is where `Content-Language` and `dir` fields are added. Contains `TransformInterceptor` class.
2. `src/common/filters/http-exception.filter.ts` (~lines 1–31) — Catches all `HttpException` instances. The `catch()` method at line 8 constructs the error response with `statusCode`, `error`, `message`, `correlationId`, `timestamp`, `path`. Message translation logic hooks in at line 15–18.
3. `src/common/common.module.ts` (~lines 1–48) — Registers all global providers (`APP_FILTER`, `APP_INTERCEPTOR`, `APP_PIPE`, `APP_GUARD`) and applies `CorrelationIdMiddleware` on `'*'` at line 46. The new i18n middleware must be applied **before** `CorrelationIdMiddleware` on the same `'*'` routes.
4. `prisma/schema.prisma`:
   - Lines 111–125: `User` model — 15 fields; `locale` field goes here
   - Lines 236–251: `Category` model — 16 fields; `translations Json` goes here
   - Lines 264–291: `Product` model — 22 fields; `translations Json` goes here
5. `src/modules/auth/dto/auth.dto.ts` (~lines 1–42) — `RegisterDto` at line 4 needs optional `locale` field. `LoginDto` at line 28 unchanged.
6. `src/modules/users/dto/user.dto.ts` (~lines 1–42) — `UpdateUserDto` at line 25 needs optional `locale` field. `CreateUserDto` at line 4 may optionally accept `locale`.
7. `src/modules/catalog/products/dto/create-product.dto.ts` (~lines 1–76) — `CreateProductDto` at line 15 needs `translations` JSON field. `UpdateProductDto` at line 50 needs `translations` JSON field. Both currently accept flat `name`/`description` strings — **keep those as fallback** and add `translations` as optional.
8. `src/modules/catalog/categories/dto/create-category.dto.ts` (~lines 1–82) — `CreateCategoryDto` at line 4 and `UpdateCategoryDto` at line 43 need optional `translations` JSON field.
9. `src/modules/auth/auth.service.ts` (~lines 1–117) — `register()` at line 16 throws `ConflictException('Email already registered')` at line 19. All exception messages in this file (~6 throw sites) must be wrapped for i18n.
10. `src/modules/catalog/products/products.service.ts` (~lines 1–109) — `findBySlug()` at line 39 returns product with hardcoded English name/description. This is where locale-aware resolution goes.
11. `src/modules/notifications/notifications.service.ts` (~lines 1–51) — Three `@OnEvent` handlers: `handleOrderCreated` (line 17), `handleOrderStatusChanged` (line 27), `handleCheckoutAbandoned` (line 43). Each calls `sendEmail()` (line 9) with hardcoded English subjects and `data` payloads. Subject lines and template data must include locale.
12. `src/config/config.module.ts` (~lines 1–52) — `ConfigModule.forRoot()` at line 17 registers 8 config namespaces. New `i18nConfig` namespace will be added to the `load` array at line 21 and `Joi.object()` at line 29.
13. `src/config/features.config.ts` (~lines 1–7) — Pattern for registering a new feature-flag-style config namespace.
14. `src/config/index.ts` (~lines 1–8) — Barrel export. New `i18nConfig` export will be added.
15. `src/common/index.ts` (~lines 1–9) — Barrel for common exports. New `@Lang()` decorator and `I18nService` will be exported from here.
16. `src/app.module.ts` (~lines 1–47) — 42 modules registered in the `imports` array at line 45. `I18nModule` must be added **first** in the array (before `CommonModule`) so its middleware runs first.
17. `src/common/decorators/public.decorator.ts` (~lines 1–4) — Example of creating a custom decorator using `SetMetadata`. The new `@Lang()` decorator follows this pattern.
18. `src/common/decorators/index.ts` — Barrel export for decorators; `Lang` must be added.
19. `.squad/stories/i18n-graphql/multi-language-i18n-support-graphql-integration/intake.md` — Full story intake with acceptance criteria.

---

## Implementation tasks

### 1 — Install i18n package

```bash
npm install nestjs-i18n
```

### 2 — Create i18n config namespace

**Create file: `src/config/i18n.config.ts`**

```typescript
import { registerAs } from '@nestjs/config';

export const i18nConfig = registerAs('i18n', () => ({
  defaultLocale: process.env.I18N_DEFAULT_LOCALE || 'en',
  supportedLocales: (process.env.I18N_SUPPORTED_LOCALES || 'en,ar,fr,es').split(',').map((l) => l.trim()),
  fallbackLocale: process.env.I18N_FALLBACK_LOCALE || 'en',
}));
```

**Edit file: `src/config/index.ts`** — add `export { i18nConfig } from './i18n.config';` at line 8.

**Edit file: `src/config/config.module.ts`** — add `i18nConfig` to the `load` array at line 21, and add `I18N_DEFAULT_LOCALE`, `I18N_SUPPORTED_LOCALES`, `I18N_FALLBACK_LOCALE` to the `Joi.object()` at line 29.

### 3 — Create locale resource files

**Create directory: `src/i18n/en/`**
**Create file: `src/i18n/en/enums.json`** — Translate all 16 Prisma enums (English base):
```json
{
  "UserRole": { "CUSTOMER": "Customer", "ADMIN": "Admin" },
  "OrderStatus": { "PENDING": "Pending", "CONFIRMED": "Confirmed", "PROCESSING": "Processing", "SHIPPED": "Shipped", "DELIVERED": "Delivered", "CANCELLED": "Cancelled", "REFUND_REQUESTED": "Refund Requested", "REFUNDED": "Refunded", "PARTIALLY_REFUNDED": "Partially Refunded" },
  "PaymentStatus": { "PENDING": "Pending", "PROCESSING": "Processing", "COMPLETED": "Completed", "FAILED": "Failed", "REFUNDED": "Refunded", "PARTIALLY_REFUNDED": "Partially Refunded", "CANCELLED": "Cancelled" },
  "PaymentMethod": { "STRIPE": "Stripe", "PAYPAL": "PayPal" },
  "ProductStatus": { "DRAFT": "Draft", "ACTIVE": "Active", "ARCHIVED": "Archived" },
  "ProductOwner": { "PLATFORM": "Platform", "VENDOR": "Vendor" },
  "VendorStatus": { "PENDING": "Pending", "ACTIVE": "Active", "SUSPENDED": "Suspended", "REJECTED": "Rejected" },
  "VendorPlan": { "FREE": "Free", "BASIC": "Basic", "PRO": "Pro", "PREMIUM": "Premium" },
  "CheckoutStatus": { "PENDING": "Pending", "VALIDATED": "Validated", "PAYMENT_PENDING": "Payment Pending", "COMPLETED": "Completed", "FAILED": "Failed", "EXPIRED": "Expired" },
  "PromotionType": { "COUPON": "Coupon", "FLASH_SALE": "Flash Sale", "BUY_X_GET_Y": "Buy X Get Y", "FREE_SHIPPING": "Free Shipping", "TIER": "Tier" },
  "PromotionScope": { "ORDER": "Order", "PRODUCT": "Product", "CATEGORY": "Category", "VENDOR": "Vendor", "CUSTOMER_GROUP": "Customer Group" },
  "StackingRule": { "NONE": "None", "COMBINABLE": "Combinable", "APPLY_BEST": "Apply Best", "SEQUENTIAL": "Sequential" },
  "DiscountType": { "PERCENTAGE": "Percentage", "FIXED_AMOUNT": "Fixed Amount" },
  "ShipmentStatus": { "PENDING": "Pending", "PROCESSING": "Processing", "SHIPPED": "Shipped", "IN_TRANSIT": "In Transit", "OUT_FOR_DELIVERY": "Out for Delivery", "DELIVERED": "Delivered", "FAILED": "Failed", "RETURNED": "Returned" },
  "FulfillmentMode": { "VENDOR_SELF": "Vendor Self", "PLATFORM_MANAGED": "Platform Managed", "DROPSHIP": "Dropship" },
  "RelationType": { "RELATED": "Related", "CROSS_SELL": "Cross Sell", "UP_SELL": "Up Sell", "BUNDLE": "Bundle" },
  "BundleType": { "FIXED": "Fixed", "CUSTOMIZABLE": "Customizable" },
  "POStatus": { "DRAFT": "Draft", "SUBMITTED": "Submitted", "APPROVED": "Approved", "REJECTED": "Rejected", "CONVERTED": "Converted", "CANCELLED": "Cancelled" },
  "QuoteStatus": { "PENDING": "Pending", "RESPONDED": "Responded", "ACCEPTED": "Accepted", "REJECTED": "Rejected", "EXPIRED": "Expired" },
  "VerificationStatus": { "PENDING": "Pending", "UNDER_REVIEW": "Under Review", "APPROVED": "Approved", "REJECTED": "Rejected" },
  "TaxClass": { "GENERAL": "General", "FOOD": "Food", "DIGITAL": "Digital", "CLOTHING": "Clothing", "EXEMPT": "Exempt" },
  "WaitlistStatus": { "WAITING": "Waiting", "NOTIFIED": "Notified", "PURCHASED": "Purchased" }
}
```

**Create file: `src/i18n/en/errors.json`** — Common error messages as translation keys:
```json
{
  "NOT_FOUND": "Not found",
  "USER_NOT_FOUND": "User not found",
  "PRODUCT_NOT_FOUND": "Product not found",
  "CATEGORY_NOT_FOUND": "Category not found",
  "EMAIL_ALREADY_REGISTERED": "Email already registered",
  "INVALID_EMAIL_OR_PASSWORD": "Invalid email or password",
  "ACCOUNT_DEACTIVATED": "Account is deactivated",
  "INVALID_REFRESH_TOKEN": "Invalid or expired refresh token",
  "WRONG_PASSWORD": "Current password is incorrect",
  "PASSWORD_CHANGED": "Password changed successfully",
  "SLUG_EXISTS": "Slug already exists",
  "SLUG_IN_USE": "Slug already in use",
  "PARENT_NOT_FOUND": "Parent category not found",
  "VARIANT_NOT_FOUND": "Variant not found",
  "ORDER_NOT_FOUND": "Order not found",
  "CART_NOT_FOUND": "Cart not found",
  "INVALID_CHECKOUT": "Checkout validation failed",
  "UNAUTHORIZED": "Unauthorized"
}
```

**Create file: `src/i18n/en/emails.json`** — Email subjects:
```json
{
  "order_confirmed": "Order Confirmed",
  "order_status_update": "Order Status Update",
  "abandoned_cart": "You left items in your cart"
}
```

**Create directories and files for `ar/`, `fr/`, `es/`** — Same JSON structure with translated values. Arabic entries must use appropriate Arabic text. French and Spanish must use actual translations (not machine-translated placeholders). Minimum: translate `enums.json`, `errors.json`, and `emails.json` for each locale.

### 4 — Create I18nModule

**Create file: `src/i18n/i18n.module.ts`**

```typescript
import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { I18nService } from './i18n.service';
import { LocaleMiddleware } from './locale.middleware';

@Global()
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LocaleMiddleware).forRoutes('*');
  }
}
```

**Create file: `src/i18n/locale.middleware.ts`**

The middleware reads `Accept-Language` from request headers, resolves it against the supported locales (`i18n.supportedLocales` from config), and attaches `req.locale` as a string. Falls back to `i18n.defaultLocale`. Also reads `req.user.locale` (from JWT) if available and prefers it over the header.

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

declare global {
  namespace Express {
    interface Request {
      locale?: string;
    }
  }
}

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const supported = this.configService.get<string[]>('i18n.supportedLocales') ?? ['en'];
    const fallback = this.configService.get<string>('i18n.fallbackLocale') ?? 'en';

    let locale: string | undefined;

    if ((req as any).user?.locale) {
      locale = (req as any).user.locale;
    } else {
      const header = req.headers['accept-language'];
      if (header) {
        const primary = header.split(',')[0].split('-')[0].trim().toLowerCase();
        locale = supported.includes(primary) ? primary : undefined;
      }
    }

    req.locale = locale ?? fallback;
    next();
  }
}
```

**Create file: `src/i18n/i18n.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class I18nService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getLocale(): string {
    return this.request.locale ?? 'en';
  }

  translateEnum(enumType: string, value: string): string {
    const locale = this.getLocale();
    try {
      const enums = require(`./${locale}/enums.json`);
      return enums[enumType]?.[value] ?? value;
    } catch {
      try {
        const enums = require(`./en/enums.json`);
        return enums[enumType]?.[value] ?? value;
      } catch {
        return value;
      }
    }
  }

  translateError(key: string, fallback: string): string {
    const locale = this.getLocale();
    try {
      const errors = require(`./${locale}/errors.json`);
      return errors[key] ?? this.translateFallbackEnError(key, fallback);
    } catch {
      return this.translateFallbackEnError(key, fallback);
    }
  }

  translateEmail(template: string, key: string, fallback: string): string {
    const locale = this.getLocale();
    try {
      const emails = require(`./${locale}/emails.json`);
      return emails[key] ?? fallback;
    } catch {
      return fallback;
    }
  }

  resolveTranslation(translations: Record<string, string> | null | undefined, field: string): string | null {
    if (!translations || typeof translations !== 'object') return null;
    const locale = this.getLocale();
    return translations[locale] ?? translations['en'] ?? translations[Object.keys(translations)[0]] ?? null;
  }

  private translateFallbackEnError(key: string, fallback: string): string {
    try {
      const errors = require('./en/errors.json');
      return errors[key] ?? fallback;
    } catch {
      return fallback;
    }
  }
}
```

**Create file: `src/i18n/index.ts`**
```typescript
export { I18nModule } from './i18n.module';
export { I18nService } from './i18n.service';
export { LocaleMiddleware } from './locale.middleware';
```

### 5 — Create @Lang() decorator

**Create file: `src/common/decorators/lang.decorator.ts`**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Lang = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.locale ?? 'en';
  },
);
```

**Edit file: `src/common/decorators/index.ts`** — add `export { Lang } from './lang.decorator';`.

**Edit file: `src/common/index.ts`** — at line 8, add `Lang` to the decorators export: change `export { Public, Roles, CurrentUser } from './decorators';` to `export { Public, Roles, CurrentUser, Lang } from './decorators';`.

**Edit file: `src/common/index.ts`** — add `export { I18nService } from '../../i18n/i18n.service';` at the end. *(Wait — this creates a circular dependency since `CommonModule` imports `I18nModule`. Instead, import `I18nService` directly from `../../i18n` in files that need it, not from `common/index.ts`.)*

### 6 — Update Prisma schema and run migration

**Edit file: `prisma/schema.prisma`**

- At line 118, after `role` field, add: `locale    String    @default("en")`
- At line 249, after `isActive` field in `Category` model, add: `translations Json      @default("{}")`
- At line 283, after `tierPrices` field in `Product` model, add: `translations Json      @default("{}")`

**Run:**
```bash
npx prisma migrate dev --name add_i18n_fields
npx prisma generate
```

### 7 — Update DTOs for i18n fields

**Edit file: `src/modules/auth/dto/auth.dto.ts`** — In `RegisterDto` (lines 4–26), add after `lastName`:
```typescript
  @ApiPropertyOptional({ example: 'ar', default: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  locale?: string;
```
Add `IsOptional, MaxLength` to the import from `class-validator` at line 1.

**Edit file: `src/modules/users/dto/user.dto.ts`** — In `UpdateUserDto` (lines 25–42), add after `isActive`:
```typescript
  @ApiPropertyOptional({ example: 'fr' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  locale?: string;
```

**Edit file: `src/modules/catalog/products/dto/create-product.dto.ts`** — In `CreateProductDto` (lines 15–38), add after `ownerType`:
```typescript
  @ApiPropertyOptional({
    example: { name: { en: 'iPhone 15', ar: 'آيفون ١٥' }, description: { en: 'Latest model', ar: 'أحدث طراز' } },
  })
  @IsOptional()
  @IsObject()
  translations?: Record<string, Record<string, string>>;
```
Add `IsObject` to the import from `class-validator` at line 1.

In `UpdateProductDto` (lines 50–76), add after `categoryId`:
```typescript
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  translations?: Record<string, Record<string, string>>;
```

**Edit file: `src/modules/catalog/categories/dto/create-category.dto.ts`** — In `CreateCategoryDto` (lines 4–41), add after `isActive`:
```typescript
  @ApiPropertyOptional({
    example: { name: { en: 'Electronics', ar: 'إلكترونيات' } },
  })
  @IsOptional()
  @IsObject()
  translations?: Record<string, Record<string, string>>;
```

In `UpdateCategoryDto` (lines 43–82), add after `isActive`:
```typescript
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  translations?: Record<string, Record<string, string>>;
```

### 8 — Update AuthService for i18n errors and locale on register

**Edit file: `src/modules/auth/auth.service.ts`**

- At line 1, add `I18nService` import: `import { I18nService } from '../../i18n';`
- In constructor (line 10–14), inject `private readonly i18n: I18nService`
- At line 19, replace `throw new ConflictException('Email already registered');` with:
  ```typescript
  throw new ConflictException(this.i18n.translateError('EMAIL_ALREADY_REGISTERED', 'Email already registered'));
  ```
- At line 42, replace `throw new UnauthorizedException('Invalid email or password');` with the i18n-wrapped version for key `INVALID_EMAIL_OR_PASSWORD`.
- At line 47, same replacement for the second `Invalid email or password` throw.
- At line 51, replace `throw new UnauthorizedException('Account is deactivated');` with key `ACCOUNT_DEACTIVATED`.
- At line 77, replace `throw new UnauthorizedException('Invalid or expired refresh token');` with key `INVALID_REFRESH_TOKEN`.
- At line 86, `throw new BadRequestException('User not found');` — key `USER_NOT_FOUND`.
- At line 91, `throw new BadRequestException('Current password is incorrect');` — key `WRONG_PASSWORD`.
- At line 24, in `usersService.create()`, pass `locale: dto.locale` if `dto.locale` is present.
- Add `locale` to `RegisterDto` validation — already done in step 7.

### 9 — Update services to resolve locale-aware content

**Edit file: `src/modules/catalog/products/products.service.ts`**

- At line 1, add import: `import { I18nService } from '../../../i18n';`
- In constructor (line 7), inject `private readonly i18n: I18nService`
- In `create()` at line 51, when writing Prisma `data`, include `translations: dto.translations ?? {}`
- In `update()` at line 67, include `translations: dto.translations` when provided
- In `findAll()` (line 9), `findById()` (line 27), `findBySlug()` (line 39) — after fetching each product, map over results and resolve `name` and `description` from `translations` JSON field. Use `i18n.resolveTranslation(product.translations as any, 'name')` to get locale-aware name; fall back to `product.name`. Do the same for `description`. Return the resolved values **without mutating the original Prisma object** — return a new shape for the API response.
- In `findAll()`, also resolve `category.name` from category translations.

**Edit file: `src/modules/catalog/categories/categories.service.ts`**

- At line 1, add import: `import { I18nService } from '../../../i18n';`
- In constructor (line 7), inject `private readonly i18n: I18nService`
- In `create()` at line 59, include `translations: dto.translations ?? {}`
- In `update()` at line 74, include `translations: dto.translations` when provided
- In `findAll()` (line 9), `findTree()` (line 19), `findById()` (line 35), `findBySlug()` (line 47) — resolve `name` from `translations` JSON using `i18n.resolveTranslation()`. Fall back to `category.name`. Apply to `parent.name`, `children[].name`, and nested tree children.

**Edit file: `src/modules/users/users.service.ts`**

- In `create()` at line 49, pass `locale: dto.locale ?? 'en'` in the `data` object
- In `update()` at line 62, pass `locale: dto.locale` when provided

### 10 — Update HttpExceptionFilter to translate messages

**Edit file: `src/common/filters/http-exception.filter.ts`**

- At line 1, add import: `import { I18nService } from '../../i18n';`
- At line 6, inject `I18nService` via constructor: `constructor(private readonly i18n: I18nService)`
- At lines 15–18, wrap the message resolution: after extracting `message`, call `this.i18n.translateError(message, message)` to attempt translation. The key is the message string itself (services already pass translation keys from step 8). If the message is not a known key, `translateError` will fall back to the original string.
- Note: `HttpExceptionFilter` is currently a pure class without `@Injectable()` dependency injection capability for constructor params — check line 5: it already has `@Injectable()` via `@Catch(HttpException)`. Actually, the class is decorated with `@Catch(HttpException)` which makes it injectable. Add the constructor injection.

### 11 — Update TransformInterceptor for Content-Language and RTL

**Edit file: `src/common/interceptors/transform.interceptor.ts`**

- At line 1, add: `import { I18nService } from '../../i18n';`
- Inject `I18nService` via constructor: `constructor(private readonly i18n: I18nService)`
- In the `intercept()` method at line 7, before `return next.handle()`, extract the locale from the request: `const request = context.switchToHttp().getRequest(); const locale = request.locale ?? 'en';`
- After the `map()` callback (#9–12), add `.pipe(tap(() => { ... }))` or modify the `map` callback to also set response headers:
  ```typescript
  map((responseData) => {
    const res = context.switchToHttp().getResponse();
    res.setHeader('Content-Language', locale);
    return {
      success: true,
      data: responseData,
      ...(locale === 'ar' ? { dir: 'rtl' } : {}),
    };
  }),
  ```

### 12 — Wire I18nModule into app.module.ts

**Edit file: `src/app.module.ts`**

- Add import: `import { I18nModule } from './i18n';` at line 4 (after CommonModule import)
- Add `I18nModule` **first** in the `imports` array at line 45, before `AppConfigModule`

### 13 — Update NotificationsService for i18n email subjects

**Edit file: `src/modules/notifications/notifications.service.ts`**

- At line 1, add import: `import { I18nService } from '../../i18n';`
- Inject `I18nService` via constructor
- In `handleOrderCreated()` at line 17, change the subject from hardcoded `Order Confirmed #${...}` to `this.i18n.translateEmail('order-confirmation', 'order_confirmed', 'Order Confirmed')` — note: the I18nService resolves locale from request, but in event handlers there is no request. Store `locale` in the event payload. Update the event emitter call sites (in `OrdersService`) to include `locale` in the payload.
- Same pattern for `handleOrderStatusChanged()` (line 27) and `handleCheckoutAbandoned()` (line 43).
- The event payloads at their emission sites — `src/modules/orders/orders.service.ts` — must include `locale` in the `order.created` and `order.status_changed` event payloads. Find the emit calls and add `locale` from the current request's `I18nService.getLocale()`.

---

## Edge Cases & Failure Modes

- **Missing translation key in locale file**: `I18nService.translateError()` and `resolveTranslation()` must never throw. Fall back to English key name or the original string. Enforced in `src/i18n/i18n.service.ts` — the `try/catch` blocks around `require()`.
- **`Accept-Language` header absent**: `LocaleMiddleware` defaults to `i18n.defaultLocale` ('en'). No crash.
- **Unsupported locale in header**: `LocaleMiddleware` checks against `supportedLocales` array and falls back to default. No crash.
- **Empty `translations` JSON on Product/Category**: `I18nService.resolveTranslation()` returns `null` when `translations` is falsy or empty. Service layer falls back to the flat `name`/`description` field. Verified in products.service.ts and categories.service.ts.
- **Arabic RTL**: Only the response wrapper gets `dir: 'rtl'`. Email templates and DB storage are not affected. Enforced in `src/common/interceptors/transform.interceptor.ts`.
- **Prisma migration half-applied**: Roll forward only — the migration adds nullable-friendly fields (`@default("en")`, `@default("{}")`). Existing rows get defaults automatically.
- **Concurrent locale change during checkout**: Locale is per-request, not per-user-session. No shared state. Safe.
- **JSON parse errors on translations field**: Prisma `Json` type handles valid JSON. Invalid JSON is rejected by `class-validator` + Prisma at the input layer.
- **Event emitter payload missing locale**: Backward-compatible — `locale` is optional in event payload. NotificationsService falls back to `en`.

---

## Test Plan

No existing unit tests in `src/` — test infrastructure (Jest, `jest.config.js`) is configured but no `*.spec.ts` files exist.

1. **Manual smoke test — i18n middleware**: Start server, `curl -H "Accept-Language: fr" http://localhost:3000/health`. Verify `Content-Language: fr` header in response.
2. **Manual smoke test — product translations**: `POST /products` with `translations: { name: { en: "Phone", fr: "Téléphone" } }`. Then `GET /products/:slug` with `Accept-Language: fr` — verify response `data.name` is `"Téléphone"`.
3. **Manual smoke test — category tree**: `GET /categories/tree` with `Accept-Language: ar` — verify Arabic names if translations exist, otherwise English fallback.
4. **Manual smoke test — enum translation**: Place an order, then `GET /orders/:id` with `Accept-Language: fr`. Verify `status` returns `"Confirmé"` (not `"CONFIRMED"`).
5. **Manual smoke test — error translation**: `GET /products/nonexistent-slug` with `Accept-Language: ar`. Verify error `message` is in Arabic.
6. **Manual smoke test — RTL dir field**: Any request with `Accept-Language: ar` returns `{ success: true, data: ..., dir: "rtl" }`.
7. **Manual smoke test — register with locale**: `POST /auth/register` with `locale: "fr"`. Then `GET /users/:id` — verify `locale` is `"fr"`.
8. **Build check**: `npx tsc --noEmit` — zero errors.
9. **Lint check**: `npm run lint` — passes.
10. **Dev boot**: `docker-compose up -d; npm run start:dev` — boots without errors.

---

## Migration / Rollback

**Migration:** `npx prisma migrate dev --name add_i18n_fields` adds 3 columns with defaults. No data migration needed — existing rows get `locale = 'en'`, `translations = {}`.

**Rollback:** Not supported via this plan. The migration is forward-only. If rollback is needed, create a new migration that drops the 3 columns.

**Half-applied state:** If the migration succeeds but the server fails to start (due to code errors), the DB has the new columns with defaults — existing queries are unaffected because the columns are nullable/have defaults.

---

## Verification Steps

1. **Backend builds:** `npx tsc --noEmit` from project root — zero errors.
2. **Lint passes:** `npm run lint` — zero errors.
3. **Prisma client regenerates:** `npx prisma generate` — no errors.
4. **Dev server boots:** `docker-compose up -d; npm run start:dev` — boots and listens on port 3000.
5. **Regression:** `curl http://localhost:3000/health` returns `{ success: true, data: { status: "ok" } }` with `Content-Language: en`.
6. **i18n header works:** `curl -H "Accept-Language: fr" http://localhost:3000/products` returns `Content-Language: fr`.
7. **RTL metadata present:** `curl -H "Accept-Language: ar" http://localhost:3000/products` returns response with `dir: "rtl"`.

---

## Done Criteria

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
- [ ] Product create/update DTOs accept `translations` JSON structures
- [ ] Category create/update DTOs accept `translations` JSON structures
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes
- [ ] `docker-compose up -d` + `npm run start:dev` boots without errors
- [ ] All existing endpoints continue working identically — no regression on any of the 120+ endpoints

**STOP HERE. Report to the user and wait for confirmation before proceeding to Story 02.**