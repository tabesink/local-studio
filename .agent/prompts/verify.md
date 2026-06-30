# Agent Prompt — Verify

Verify the implementation against active specs, contracts, and quality rules.

1. Read `AGENTS.md`, feature docs, touched contracts, acceptance evidence, and changed code/tests.
2. Build a requirements-to-evidence table:
   - acceptance criterion/rule;
   - implementation location;
   - test/check;
   - result;
   - gap or risk.
3. Check for contract drift, authorization gaps, data lifecycle issues, logging/privacy leaks, missing failure handling, and undocumented scope growth.
4. Classify findings as:
   - blocker;
   - required follow-up;
   - optional improvement;
   - documentation correction.
5. Update `acceptance.md` only with evidence actually observed.

Do not claim pass for unexecuted tests, missing dashboards, or assumed runtime behaviour.
