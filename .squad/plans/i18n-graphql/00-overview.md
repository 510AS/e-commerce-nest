# i18n-graphql — plan overview

Entry point for the **i18n-graphql** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 01 | `01-story-i18n-infrastructure.md` | i18n infrastructure + content translation | — | None |
| 02 | `02-story-graphql-api.md` | GraphQL API layer | — | Story 01 |

## Dependency notes

- Story 02 depends on Story 01 (needs `I18nModule`, `I18nService`, `LocaleMiddleware` to be registered)
- Both stories are additive — no existing REST controller or service is deleted or altered in behavior
- Executor sessions should attach ONE plan file at a time; do not combine both stories in a single implementation session
