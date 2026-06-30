# Agent Prompt — Discover

You are performing discovery only. Do not modify code yet.

1. Read `AGENTS.md` and the applicable governance documents.
2. Identify the requested feature ID. If none exists, propose the next `F-###` ID.
3. Read the relevant feature spec, contracts, architecture, quality docs, and existing implementation/tests.
4. Produce a concise evidence-based report:
   - user/business outcome;
   - active acceptance criteria;
   - affected contracts and ownership;
   - current code/test state;
   - contradictions, missing decisions, and implementation risk;
   - smallest likely vertical slice;
   - documents that must change.
5. Separate facts from assumptions.
6. Do not decide undocumented product policy. Mark it `OPEN DECISION`.

Output exactly:

```text
Feature:
Specifications read:
Current state:
Contracts affected:
Known gaps/contradictions:
Recommended next slice:
Open decisions:
No-code changes made:
```
