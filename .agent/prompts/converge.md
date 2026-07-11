# Agent Prompt — Converge

Detect and close specification drift after implementation.

1. Start from active feature specs and contracts.
2. Compare each required behaviour with code, tests, migrations, UI, and operational evidence.
3. Then inspect code/tests for behaviour with no active specification or contract justification.
4. Correct small drift now when the intended behaviour is unambiguous.
5. For material drift, create an open decision or follow-up task; do not retrofit the spec to excuse accidental code.
6. Update traceability evidence and feature status.

Report:
- compliant areas;
- corrected drift;
- remaining drift;
- required decisions;
- stale/superseded documents to archive.
