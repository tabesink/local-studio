---
id: F-001
title: Trusted Application Foundation Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-000]
supersedes: []
---


# F-001 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `./.venv/bin/python -m pytest`; `./.venv/bin/python -m alembic upgrade head --sql` | pass | Pytest ran Alembic fresh upgrade against SQLite and inspected `users`, `auth_sessions`, and `alembic_version`; offline Alembic SQL generation used `PostgresqlImpl` for revision `20260630_0001`. |
| AC-002 | `test_startup_seeds_admin_and_rotates_password` in `tests/test_foundation_auth.py`; `./.venv/bin/python -m pytest` | pass | Startup creates an Administrator from environment-backed settings and a second startup rotates the Argon2id password hash. |
| AC-003 | `test_login_sets_http_only_cookie_and_never_returns_token` in `tests/test_foundation_auth.py`; `./.venv/bin/python -m pytest` | pass | Login response includes safe user/session expiry only; recursive response assertion rejects token and password keys. |
| AC-004 | `test_login_sets_http_only_cookie_and_never_returns_token` in `tests/test_foundation_auth.py`; `./.venv/bin/python -m pytest` | pass | `Set-Cookie` contains `ce_session`, `HttpOnly`, and `SameSite=lax`; raw token is only present in the cookie and DB stores its hash. |
| AC-005 | `test_revoked_expired_and_disabled_sessions_return_safe_401` in `tests/test_foundation_auth.py`; `./.venv/bin/python -m pytest` | pass | Revoked session, expired session, and disabled user all return canonical safe `401` envelopes with request IDs. |
| AC-006 | `test_logout_revokes_session_and_clears_cookie`, `test_admin_route_forbids_members_and_allows_administrators`, `test_health_and_error_envelope_include_request_id`, and `test_openapi_snapshot_matches`; `./.venv/bin/python -m pytest` | pass | Responses and admin DTOs omit tokens, passwords, and password hashes; errors use safe messages; OpenAPI snapshot covers the P1 route surface. |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
