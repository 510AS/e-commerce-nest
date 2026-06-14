# 🛒 E-Commerce NestJS — Hybrid Marketplace Platform

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-7.8-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/GraphQL-16-E10098?style=for-the-badge&logo=graphql&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
</p>

A **production-grade** hybrid e-commerce platform (Marketplace + Platform-Owned Products) built with NestJS, implementing enterprise-level architectural patterns. This isn't a simple CRUD app — it demonstrates mastery of distributed system design, domain-driven development, and advanced NestJS internals.

---

## 🏗 Architecture & Design Patterns

| Pattern | Implementation |
|---------|---------------|
| **CQRS** | Command/Query Responsibility Segregation via `@nestjs/cqrs` — separates read/write paths for scalability |
| **Saga Pattern** | Checkout orchestration with multi-step transactions and automatic rollback on failure |
| **DDD Aggregates** | Domain-driven aggregate roots for order, cart, and inventory bounded contexts |
| **Circuit Breaker** | Resilience pattern preventing cascade failures on external services (Stripe, Meilisearch) |
| **Event-Driven** | Domain events with `@nestjs/event-emitter` for loose module coupling |
| **Command Bus** | Decoupled command execution pipeline with middleware support |
| **Observability** | Structured logging via Pino + custom tracing decorators |
| **Dynamic Modules** | Runtime module loading with `ModuleRef` and `forwardRef` |
| **Lazy Loading** | On-demand module initialization for performance optimization |

---

## 📦 Modules (27 Domain Modules)

```
src/modules/
├── auth/               # JWT + Passport authentication & RBAC
├── users/              # User profiles, addresses, preferences
├── catalog/            # Product listings, categories, attributes
├── cart/               # Persistent shopping cart with sessions
├── checkout/           # Checkout saga with payment orchestration
├── orders/             # Order lifecycle & status management
├── payments/           # Stripe integration with webhook handling
├── inventory/          # Stock management with reservation system
├── shipping/           # Shipping calculation & tracking
├── marketplace/        # Multi-vendor marketplace logic
├── vendors/            # Vendor onboarding & management
├── b2b/                # Business-to-business pricing & orders
├── promotions/         # Coupons, discounts, and promotional rules
├── pricing/            # Dynamic pricing engine with tier support
├── customer-groups/    # Customer segmentation & group pricing
├── wishlist/           # Product wishlist per user
├── recently-viewed/    # Browsing history tracking
├── waitlist/           # Out-of-stock waitlist notifications
├── notifications/      # Email, push, and in-app notifications
├── import-export/      # Bulk product import/export (CSV, JSON)
├── tax/                # Tax calculation per region
├── cms/seo/            # SEO metadata & content pages
├── graphql/            # Alternative GraphQL API layer
├── audit/              # Audit trail for admin actions
├── health/             # Health check endpoints for monitoring
├── infrastructure/     # Event bus, CQRS infrastructure
└── lazy/               # Lazy-loaded feature modules
```

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | NestJS 11 (latest) |
| **Language** | TypeScript 5.7 (strict mode) |
| **Database** | PostgreSQL via Prisma 7.8 ORM |
| **Cache/Queue** | Redis (ioredis) + BullMQ for background jobs |
| **Search** | Meilisearch for full-text product search |
| **Auth** | JWT + Passport with refresh token rotation |
| **Payments** | Stripe SDK with webhook verification |
| **API** | REST (Swagger/OpenAPI) + GraphQL (Apollo Server 5) |
| **Validation** | class-validator + Joi for config schemas |
| **i18n** | nestjs-i18n for multilingual responses |
| **Security** | Helmet, CORS, rate limiting (@nestjs/throttler), compression |
| **Logging** | Pino (structured JSON logs) + pino-pretty |
| **Scheduling** | @nestjs/schedule for cron-based tasks |
| **Testing** | Jest + Supertest |
| **Containerization** | Docker + Docker Compose |

---

## ✨ Key Features

### Commerce
- 🛍 **Hybrid Model** — Platform-owned products + third-party marketplace vendors
- 📦 **Product Variants** — Size, color, material with SKU management
- 🏷 **Dynamic Pricing** — Tier pricing, B2B rates, customer group discounts
- 🎟 **Promotions Engine** — Coupons, percentage/fixed discounts, minimum order rules
- 📊 **Inventory Tracking** — Stock reservations, low-stock alerts, waitlist auto-notify
- 🔍 **Full-Text Search** — Meilisearch-powered product search with facets & filters

### Architecture
- ⚡ **CQRS + Sagas** — Complex checkout flow with compensating transactions
- 🔄 **Circuit Breaker** — Auto-fallback when Stripe or Meilisearch is down
- 📡 **Event-Driven** — `OrderPlaced`, `PaymentCompleted`, `InventoryReserved` domain events
- 🧩 **Modular Monolith** — Clean boundaries, ready for microservice extraction
- 🔒 **Rate Limiting** — Per-route throttling with configurable windows

### Developer Experience
- 📖 **Swagger UI** — Auto-generated REST API documentation
- 🎮 **GraphQL Playground** — Interactive GraphQL query builder
- 🏥 **Health Checks** — `/health` endpoint for container orchestrators
- 📝 **Audit Trail** — Track every admin action with before/after snapshots

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/510AS/e-commerce-nest.git
cd e-commerce-nest

# Start infrastructure (PostgreSQL + Redis + Meilisearch)
docker-compose up -d

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ecommerce"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET="your-secret"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-key"
```

---

## 📡 API Access

| Interface | URL | Description |
|-----------|-----|-------------|
| REST API | `http://localhost:3000/api` | Swagger documentation |
| GraphQL | `http://localhost:3000/graphql` | GraphQL Playground |
| Health | `http://localhost:3000/health` | Service health status |
| Prisma Studio | `npx prisma studio` | Database GUI |

---

## 🧪 Testing

```bash
npm run test          # Unit tests
npm run test:cov      # Coverage report
npm run test:e2e      # End-to-end tests
```

---

## 📁 Full Project Structure

```
├── prisma/
│   └── schema.prisma           # Database schema (30+ models)
├── src/
│   ├── common/                 # Shared infrastructure
│   │   ├── context/            # Request context (tenant, user)
│   │   ├── decorators/         # Custom decorators (@CurrentUser, @Public)
│   │   ├── discovery/          # Module discovery & auto-registration
│   │   ├── dto/                # Shared DTOs & pagination
│   │   ├── filters/            # Global exception filters
│   │   ├── guards/             # Auth, roles, throttle guards
│   │   ├── interceptors/       # Transform, logging, timeout
│   │   ├── middleware/         # Correlation ID, tenant resolution
│   │   ├── pipes/              # Validation, parse pipes
│   │   ├── resilience/         # Circuit breaker implementation
│   │   └── tokens/             # DI injection tokens
│   ├── config/                 # Typed configuration (Joi-validated)
│   ├── core/                   # Domain core
│   │   ├── aggregates/         # DDD aggregate roots
│   │   ├── dto/                # Core DTOs
│   │   ├── mappers/            # Entity ↔ DTO mappers
│   │   └── observability/      # Tracing & metrics
│   ├── database/prisma/        # Prisma service & extensions
│   ├── i18n/                   # Translation files (en, ar)
│   ├── modules/                # 27 feature modules (see above)
│   ├── types/                  # Global TypeScript types
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Bootstrap (Helmet, CORS, Swagger, Compression)
├── docker-compose.yml          # PostgreSQL + Redis + Meilisearch
├── jest.config.js              # Test configuration
└── tsconfig.json               # TypeScript strict config
```

---

## 📄 License

MIT — Built for learning and demonstrating advanced NestJS patterns at production scale.
