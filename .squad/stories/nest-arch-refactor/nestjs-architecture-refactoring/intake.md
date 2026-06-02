# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/nest-arch-refactor/nestjs-architecture-refactoring/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** NestJS Architecture Refactoring
- **Feature slug (folder under `plans/`):** `nest-arch-refactor`

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
NestJS Architecture Refactoring
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
Refactor the codebase to improve maintainability, modularity, and advanced patterns. The current architecture includes global cross-cutting setup in CommonModule, PrismaService lifecycle management, domain-split feature modules, a dedicated GraphQL module, and global i18n integration. However, the codebase remains "basic" due to direct controller/service pairs, hard-wired dependencies, informal request-aware flows, lack of a modular composition layer for cross-cutting behaviors, and loose domain boundaries.

1. Dependency Inversion & Abstraction: Transition from hard-coded setup to token-based custom providers (Stripe, event publishers, cache, search, storage) and implement async factories for Redis, BullMQ, and Meilisearch.

2. Module Sophistication: Convert heavy modules (GraphQL, Notifications, Payments, Search, B2B) into dynamic, configurable modules to support feature toggles and environment-based composition.

3. Scope & Context Management: Implement strict injection scopes (REQUEST scope) for request context, locale, tenant, and auth context to prevent data leakage, and standardize execution context abstraction (adapters) to unify REST and GraphQL access for auth, roles, and locale.

4. Dependency & Lifecycle Management: Establish strategies to resolve circular dependencies (using domain facades instead of forwardRef) and formalize boot/shutdown lifecycle hooks for Prisma, cache priming, and queue registration.

5. Advanced Patterns: Implement metadata-driven registration using DiscoveryService for handlers/resolvers/jobs, introduce lazy-loading for expensive subsystems, and enforce platform agnosticism by separating core domain logic from delivery adapters.

Prioritized sequence: Story 03 covers items 1 and 3 (infrastructure provider extraction + request context). Story 04 covers items 2, 4, and 5 (dynamic modules, domain facades, lifecycle hooks, DiscoveryService, lazy-loading, platform agnosticism).
```

```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- [ ] Injection tokens defined for all external clients (STRIPE_CLIENT, REDIS_CLIENT, MEILISEARCH_CLIENT, etc.)
- [ ] InfrastructureModule provides async factories for Stripe, Redis, Meilisearch as @Global() providers
- [ ] PaymentsService receives Stripe client via @Inject(STRIPE_CLIENT) — no inline instantiation
- [ ] EventEmitterModule.forRoot() registered once in app.module.ts — not duplicated in feature modules
- [ ] RequestContextService (REQUEST-scoped) provides locale, tenant, authUser, correlationId, isAuthenticated, hasRole()
- [ ] ExecutionContextAdapter unifies HTTP and GraphQL context access for guards/interceptors
- [ ] TenantMiddleware reads x-tenant-id header into req.tenant
- [ ] Heavy modules (GraphQL, Notifications, Payments, B2B) converted to dynamic configurable modules with feature toggle support
- [ ] Domain facades resolve circular dependencies without forwardRef()
- [ ] OnModuleInit/OnModuleDestroy lifecycle hooks formalized for Prisma connect/disconnect, cache priming, queue registration
- [ ] DiscoveryService used for metadata-driven registration of handlers/resolvers/jobs
- [ ] Lazy-loading implemented for expensive subsystems (GraphQL, Search, B2B)
- [ ] Platform agnosticism: core domain logic separated from delivery adapters (REST/GraphQL)
- [ ] npx tsc --noEmit passes with zero errors
- [ ] npm run lint passes (no new errors)
- [ ] docker-compose up -d; npm run start:dev boots without errors
- [ ] All 120+ REST endpoints continue working identically — no regression
- [ ] GraphQL queries continue working identically — no regression
```

```

---

## Attachments

Place files in `attachments/` next to this `intake.md`, then list them here so the planner knows what to open.

| File (relative to this folder) | What it is |
| ------------------------------ | ---------- |
| *(e.g. `attachments/flow.png`)* | *(e.g. UX flow)* |

*(Add rows per file. If none, write "None.")*

---

## Dependencies

- **Blocked by / related ids:** Story 01 (i18n infrastructure), Story 02 (GraphQL API layer)
- **Depends on code areas or other stories:** CommonModule, PrismaService, GraphQL module, PaymentsService, NotificationsModule, B2B modules, event-emitter, Stripe, Redis, Meilisearch configs

## Extra notes (optional)

- Story 03 implemented: infrastructure provider extraction + request context. Story 04 covers remaining items: dynamic modules, domain facades, lifecycle hooks, DiscoveryService, lazy-loading, platform agnosticism.

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- Replacing existing module patterns with @nestjs/cqrs or event-sourcing
- Database schema changes
- Migration to microservices architecture
- UI/frontend changes
