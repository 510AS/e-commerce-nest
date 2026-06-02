# nest-arch-refactor — plan overview

Entry point for the **nest-arch-refactor** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 03 | `03-story-infrastructure-providers.md` | Infrastructure provider extraction + Request context | — | Story 01, Story 02 |
| 04 | `04-story-dynamic-modules.md` | Dynamic modules, lifecycle hooks, domain facades | — | Story 03 |
| 05 | `05-story-advanced-patterns.md` | DiscoveryService, platform agnosticism | — | Story 04 |
| 06 | `06-story-missing-patterns.md` | forwardRef, ModuleRef, LazyModuleLoader, DTO mappers | — | Story 05 |

## Dependency notes

- Story 03 depends on Story 01 (needs `I18nModule` registered, `@Inject(REQUEST)` pattern established) and Story 02 (GraphQL resolvers using `GqlExecutionContext` — the `ExecutionContextAdapter` unifies this).
- Story 04 depends on Story 03 (needs `InfrastructureModule` with Redis lifecycle, `RequestContextService`, token-based providers).
- Story 06 is the final story. All 11 NestJS advanced patterns are now present in the codebase.
- The `RequestContextService` must NOT be injected into singleton-scoped domain services — pass context values as method parameters instead.
