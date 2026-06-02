# nest-arch-refactor — plan overview

Entry point for the **nest-arch-refactor** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 03 | `03-story-infrastructure-providers.md` | Infrastructure provider extraction + Request context | — | Story 01, Story 02 |
| 04 | `04-story-dynamic-modules.md` | Dynamic modules, lifecycle hooks, domain facades | — | Story 03 |
| 05 | `05-story-advanced-patterns.md` | DiscoveryService, platform agnosticism | — | Story 04 |

## Dependency notes

- Story 03 depends on Story 01 (needs `I18nModule` registered, `@Inject(REQUEST)` pattern established) and Story 02 (GraphQL resolvers using `GqlExecutionContext` — the `ExecutionContextAdapter` unifies this).
- Story 04 depends on Story 03 (needs `InfrastructureModule` with Redis lifecycle, `RequestContextService`, token-based providers).
- Story 05 depends on Story 04 (needs `B2BModule.forRoot()`, `NotificationsModule.forRoot()`, `CheckoutFacade`). This is the final story for the nest-arch-refactor feature.
- The `RequestContextService` must NOT be injected into singleton-scoped domain services — pass context values as method parameters instead.
