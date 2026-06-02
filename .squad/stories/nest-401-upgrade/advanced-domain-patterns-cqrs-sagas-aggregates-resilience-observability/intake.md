# Story intake

Fill this template for each story you want planned. Keep it copy-paste-friendly: the planner reads **this file and the files in `attachments/`**, nothing else.

- Folder: `.squad/stories/nest-401-upgrade/advanced-domain-patterns-cqrs-sagas-aggregates-resilience-observability/intake.md`
- Binaries (screenshots, PDFs, exports): put them in `attachments/` next to this file and list them below.
- Do **not** rely on external links (tracker URLs, wiki, chat) — the planner cannot open them. Paste the content you want considered.

This is **not** an implementation prompt. It is the input to the plan-generation meta-prompt bundled with squad-kit (`generate-plan.md` in the installed package).

---

## Feature

- **Feature name (display):** NestJS 401 — Advanced Domain Patterns
- **Feature slug (folder under `plans/`):** `nest-401-upgrade`

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
Advanced Domain Patterns: CQRS, Sagas, Aggregates, Resilience, Observability
```

---

## Description

*(Paste the full work item description. Prefilled when fetched from a tracker.)*

```
Upgrade the codebase from NestJS 301 (infrastructure patterns) to 401 (domain patterns):

1. CQRS: Convert the checkout flow from procedural service calls to Command/Query/Event/Saga pattern using @nestjs/cqrs.

2. Domain Aggregates: Create domain models with invariants (ProductAggregate) that enforce business rules.

3. Saga with Compensation: Orchestrate multi-step workflows with automatic rollback on failure.

4. Resilience: Add circuit breakers for external service calls (Stripe, Redis).

5. Observability: Structured JSON logging with correlation IDs and trace spans.
```

---

## Acceptance criteria

*(Checklist, bullets, Gherkin, etc. Prefilled for Azure DevOps when the work item has acceptance criteria.)*

```
- [ ] CqrsModule.forRoot() registered in app.module.ts
- [ ] Checkout flow converted to Command/Event/Saga pattern
- [ ] CheckoutSaga orchestrates checkout with compensation
- [ ] CommandBus wired into CheckoutController
- [ ] ProductAggregate enforces domain invariants
- [ ] @CircuitBreaker applied to Stripe calls in PaymentsService
- [ ] ObservabilityService provides structured JSON logging
- [ ] ObservabilityService injected into CQRS handlers
- [ ] npx tsc --noEmit passes with zero errors
- [ ] npm run lint passes (no new errors)
- [ ] All existing endpoints continue working
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

- **Blocked by / related ids:** Story 06 (all 11 NestJS 301 patterns complete)
- **Depends on code areas or other stories:** CheckoutService, CheckoutController, PaymentsService, ProductsService, InventoryService, OrdersService, PrismaService, @nestjs/cqrs package

## Extra notes (optional)

- Story 07 implemented: CQRS checkout saga, ProductAggregate, CircuitBreaker, ObservabilityService. All wired into running code paths (Steps 46-47).

## Technical hints (optional)

- APIs, screens, services already discussed. Repos/roots: `.`. Primary language: `typescript`.

## Out of scope

- What this story explicitly does **not** cover:
