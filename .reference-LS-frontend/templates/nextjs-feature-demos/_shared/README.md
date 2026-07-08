# Shared Demo Support

Shared code is intentionally small. It exists only to keep the feature demos visually consistent with Local Studio without forcing every slice to copy the same primitives.

Use:

- `ui/` for compact Local Studio-shaped primitives.
- `shell/` for the minimal feature demo shell.
- `api/` for mock latency and normalized mock errors.
- `fixtures/` for shared route/feature metadata.
- `styles/` for token guidance and a minimal CSS token file.

Do not add broad providers, router registries, auth systems, or data-fetching frameworks here.
