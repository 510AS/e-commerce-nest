# nest-401-upgrade — plan overview

Entry point for the **nest-401-upgrade** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 07 | `07-story-domain-patterns.md` | CQRS, Sagas, Aggregates, Resilience, Observability | — | Story 06 |

## Dependency notes

- Story 07 depends on Story 06 (all 11 NestJS 301 patterns complete — DI, dynamic modules, forwardRef, ModuleRef, LazyModuleLoader, etc.).
- The checkout saga replaces the synchronous `CheckoutService.initiate()` flow with CQRS commands, events, and compensation.
- All remaining 401 patterns (OrderAggregate, Redis circuit breaker, Meilisearch circuit breaker) can be added in follow-up stories.
