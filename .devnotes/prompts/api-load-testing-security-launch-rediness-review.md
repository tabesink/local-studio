

# Senior Software Architect Review — API Load Testing, Security, Reliability, and Launch Readiness

Review the target application/codebase as a senior software architect, backend engineer, security reviewer, SRE-minded developer, and API performance engineer.

Your goal is to produce an evidence-based implementation documentation package that junior developers and coding agents can use to safely prepare this application for production launch.

The application may have been built quickly or with AI-assisted “vibe coding.” Treat every important assumption as unverified until confirmed in source code, configuration, infrastructure definitions, tests, or live-runtime evidence.

Do not redesign working parts without evidence. Prefer small, understandable changes that directly reduce launch risk.

---

## Operating Principles

### KISS — Keep It Simple
- Prefer the simplest implementation that fully satisfies the current requirement.
- Favor explicit control flow, clear ownership, standard framework features, and conventional deployment patterns.
- Do not add services, queues, feature flags, abstraction layers, compatibility paths, or frameworks unless a concrete current requirement justifies them.
- Reduce existing complexity only where it is safe, in scope, and testable.

### YAGNI — You Aren’t Gonna Need It
- Build for known users, known workflows, stated capacity targets, and proven failure cases.
- Do not build hypothetical enterprise-scale infrastructure without present evidence that it is needed.
- Document deferred scaling ideas separately; do not implement them prematurely.

### DRY — Don’t Repeat Yourself
- Keep business rules, schemas, authorization rules, validation rules, environment configuration, and API contracts canonical.
- Eliminate duplication only when consolidation improves clarity and reduces real maintenance risk.
- Do not create shared abstractions merely because two short blocks look similar.

### Additional Engineering Standards
- Make state, ownership, and failure behavior explicit.
- Treat authentication, authorization, tenant/domain isolation, and secrets as first-class architecture concerns.
- Preserve backward compatibility only where it is actually required.
- Never expose secrets, tokens, stack traces, internal infrastructure details, or sensitive user data through browser code, logs, API responses, or error messages.
- Every recommendation must identify its evidence, risk, implementation owner, validation method, and rollback path.

---

# 1. Review Scope

Inspect the application end-to-end:

1. Frontend/browser client
2. API routes and request handlers
3. Authentication and authorization
4. Database schema, queries, indexes, transactions, and migrations
5. Background jobs, queues, workers, polling, and scheduled tasks
6. File upload, document processing, external API calls, and model/provider calls
7. Caching, rate limits, retries, timeouts, and connection pooling
8. Containerization, Docker Compose, environment variables, CI/CD, and deployment configuration
9. Logging, monitoring, tracing, health checks, alerting, and operational runbooks
10. Existing tests and test coverage
11. API performance, capacity limits, failure behavior, and production launch risks

Where the repository does not prove something, clearly label it as:

- `Verified in source`
- `Likely inference`
- `Missing information`
- `Requires runtime validation`

Do not present assumptions as facts.

---

# 2. Required Output Package

Create a junior-developer-friendly implementation documentation package with the following documents.

## A. Executive Launch Readiness Assessment

Explain in plain language:

- What the application does
- Who uses it
- Main user journeys
- Main API and data flows
- Current production readiness level
- Highest-risk launch blockers
- Risks that are acceptable for the first release
- Risks that must be fixed before launch
- Recommended phased path to launch

Include a concise readiness scorecard:

| Area | Status | Evidence | Risk | Required Action |
|---|---|---|---|---|
| Authentication | | | | |
| Authorization | | | | |
| API validation | | | | |
| Database integrity | | | | |
| API performance | | | | |
| Load handling | | | | |
| Error handling | | | | |
| Observability | | | | |
| Deployment safety | | | | |
| Backup/recovery | | | | |
| Security/secrets | | | | |
| Test coverage | | | | |

Use only: `Ready`, `Needs Work`, `Blocked`, or `Unknown`.

---

## B. Current Architecture Map

Document the actual architecture found in the repository.

Include:

1. System context diagram
2. Request lifecycle diagram
3. API request/response boundaries
4. Authentication and authorization flow
5. Database ownership and table relationships
6. Background processing flow, where applicable
7. External-service dependency map
8. Deployment topology
9. Configuration and secret ownership map
10. Failure-path diagram for critical workflows

Use Mermaid diagrams where useful.

For every component, state:

| Component | Responsibility | Inputs | Outputs | State Owner | Failure Behavior | Scaling Concern |
|---|---|---|---|---|---|---|

---

## C. API Contract and Validation Review

For each important API endpoint, document:

| Endpoint | Caller | Auth Requirement | Authorization Rule | Input Validation | Success Response | Error Responses | Idempotency Need | Performance Risk |
|---|---|---|---|---|---|---|---|---|

Review specifically for:

- Missing authentication
- Missing role or tenant/domain checks
- Insecure direct object references
- Missing request schema validation
- Unsafe file upload handling
- Missing size/type limits
- Missing pagination
- Large unbounded responses
- N+1 database queries
- Missing request timeouts
- Missing retry limits
- Unsafe error serialization
- Missing rate limiting on expensive endpoints
- Duplicate endpoint behavior or conflicting contracts
- Lack of request correlation IDs
- Lack of idempotency for create/payment/upload/job-start actions

Define canonical API response conventions, including:

- Success payload shape
- Validation-error shape
- Authentication-error shape
- Authorization-error shape
- Not-found shape
- Conflict shape
- Rate-limit shape
- Internal-error shape
- Correlation/request ID behavior

---

## D. Security and Abuse-Resistance Review

Review the application for common launch-stage security risks.

Cover:

1. Authentication
   - Password storage
   - Session/JWT handling
   - Token expiration
   - Token storage in browser
   - Refresh behavior
   - Logout/invalidation behavior
   - Brute-force protection

2. Authorization
   - Role checks
   - Admin-only routes
   - Direct URL access
   - API-level enforcement
   - Tenant/domain/user isolation
   - Object ownership validation

3. Browser/client safety
   - Secrets in frontend bundles
   - Local storage/session storage risk
   - CSRF exposure
   - XSS exposure
   - CORS configuration
   - Unsafe HTML/markdown rendering

4. API safety
   - Rate limiting
   - Payload limits
   - File validation
   - SSRF risks
   - SQL injection protection
   - Prompt injection handling, if AI/RAG is used
   - Logging of sensitive data
   - Error leakage

5. Infrastructure safety
   - Secret management
   - Environment separation
   - Debug mode
   - Container privileges
   - Network exposure
   - TLS/HTTPS
   - Database credentials
   - Backup access

For every issue, include:

| Finding | Severity | Evidence | Exploit/Failure Scenario | Minimal Fix | Validation Test |
|---|---|---|---|---|---|

Use severity: `Critical`, `High`, `Medium`, `Low`, `Informational`.

---

## E. API Performance and Load-Test Strategy

The application must be load tested before launch.

Design a pragmatic API load-testing plan appropriate to the current application size and expected user count. Do not recommend enterprise-scale tooling unless it is needed.

Start by identifying realistic capacity assumptions:

| Variable | Assumption / Evidence | Required Confirmation |
|---|---|---|
| Expected registered users | | |
| Expected concurrent users | | |
| Peak concurrent users | | |
| Average requests per user | | |
| Most expensive endpoint | | |
| Largest expected upload | | |
| Longest-running request | | |
| Database size at launch | | |
| External dependency limits | | |
| Target API latency | | |
| Acceptable error rate | | |

### Required Load-Test Types

Design the following tests where applicable:

1. **Smoke test**
   - Confirm the test environment, authentication, endpoints, and metrics work.
   - Very low traffic.
   - Must be run before every larger test.

2. **Baseline test**
   - Establish normal latency, throughput, CPU, memory, database behavior, and error rate under ordinary usage.

3. **Expected-load test**
   - Simulate normal peak usage for the initial launch target.
   - Include realistic endpoint mixes, authentication, reads, writes, uploads, background jobs, and polling where applicable.

4. **Stress test**
   - Increase traffic until the first important failure threshold appears.
   - Identify whether failure occurs at the app server, database, worker, external provider, network, queue, or rate limiter.

5. **Spike test**
   - Simulate sudden bursts, such as many users logging in, uploading, querying, or refreshing simultaneously.

6. **Soak test**
   - Run expected load for a long enough period to detect memory leaks, connection leaks, queue buildup, database exhaustion, token expiry problems, and slow degradation.

7. **Failure/dependency test**
   - Test predictable dependency failures:
     - Database temporarily unavailable
     - External API timeout
     - AI provider rate limit or error
     - Worker unavailable
     - Queue backlog
     - Invalid upload
     - User cancellation during a long operation

### Test Scenarios

For each critical workflow, define a scenario like:

| Scenario | User Type | API Flow | Virtual Users | Duration | Pass Criteria | Metrics |
|---|---|---|---:|---:|---|---|
| Login burst | Member/Admin | login → authenticated request | | | | |
| Read/query flow | Member | auth → list → retrieve/query | | | | |
| Admin write flow | Admin | auth → create/update/upload | | | | |
| Upload and process | Admin | upload → job start → polling/status | | | | |
| Concurrent domain access | Multiple users | select domain → retrieve/query | | | | |
| External provider delay | Member/Admin | request → provider timeout/retry | | | | |

### Required Metrics

Define how to collect and interpret:

- Requests per second
- Median latency
- p95 latency
- p99 latency
- Error rate
- HTTP status distribution
- Timeout rate
- Database query count and duration
- Database connection pool usage
- CPU
- Memory
- Disk space
- Network usage
- Queue depth
- Worker throughput
- Job wait time
- External provider latency and failures
- Rate-limit events
- Retry counts
- Container restarts
- Memory growth over time

### Performance Acceptance Criteria

Define explicit initial release targets, for example:

| Area | Target |
|---|---|
| Authenticated read endpoint p95 | ≤ target milliseconds |
| Standard API request error rate | < target percentage |
| Login burst success rate | ≥ target percentage |
| File upload validation | Fails safely and predictably |
| Background job status | Does not block API workers |
| Database pool | Does not exhaust under expected load |
| App recovery | Restores health after dependency recovery |
| Memory behavior | No continuous unbounded growth during soak test |

Do not invent values without noting that they are proposed defaults. Explain how the team should calibrate them against actual hardware, user counts, and service limits.

### Tool Recommendation

Recommend one lightweight load-testing tool based on the application stack, such as:

- k6
- Locust
- Artillery
- JMeter only where already adopted

Justify the selection based on:

- Current stack
- Developer skill level
- CI compatibility
- Authentication support
- Scenario readability
- Metrics output
- Ease of local and staging execution

Provide complete example test scaffolding and commands, but do not include real credentials.

---

## F. Observability and Incident Readiness

Document the minimum operational visibility required before launch.

Include:

1. Structured logs
2. Correlation/request IDs
3. Error tracking
4. Health and readiness endpoints
5. Metrics collection
6. API latency dashboards
7. Database health monitoring
8. Worker/queue monitoring
9. External dependency monitoring
10. Sensitive-data redaction rules
11. Alert thresholds
12. Manual incident triage procedure

Create a simple incident runbook:

| Symptom | Likely Causes | Immediate Checks | Safe Mitigation | Escalation Condition |
|---|---|---|---|---|
| API latency rises | | | | |
| 5xx errors increase | | | | |
| Login failures spike | | | | |
| Uploads fail | | | | |
| Jobs remain queued | | | | |
| Database unavailable | | | | |
| External provider fails | | | | |

---

## G. Database and Data Integrity Review

Review:

- Schema ownership
- Primary/foreign keys
- Required indexes
- Query patterns
- Transaction boundaries
- Race conditions
- Concurrent update behavior
- Migration safety
- Seed data
- Backups
- Restore process
- Soft-delete versus permanent-delete behavior
- Data retention
- Audit needs, only where currently required

For each critical table/model, document:

| Entity | Owner | Create Rule | Read Rule | Update Rule | Delete Rule | Indexes Needed | Concurrency Risk |
|---|---|---|---|---|---|---|---|

Include a migration and rollback checklist.

---

## H. Deployment and Release Checklist

Create a production launch checklist that covers:

### Before deployment
- Configuration review
- Secret validation
- Database migration review
- Backup verification
- Smoke test
- Security scan/review
- Load-test completion
- Dependency health check
- Rollback artifact availability

### During deployment
- Deployment order
- Migration order
- Health verification
- Error-rate monitoring
- Canary/manual verification steps
- Rollback trigger conditions

### After deployment
- Critical-path test
- Dashboard review
- Error-log review
- Performance comparison against baseline
- Background job verification
- Admin and member authorization check
- Backup confirmation

---

# 3. Implementation Plan Requirements

Convert all findings into phased vertical-slice implementation plans.

Each phase must be small enough for a junior developer or coding agent to implement, test, review, and merge safely.

For every phase, include:

## Phase Title

### Goal
What risk or capability this phase addresses.

### Scope
Exact files, components, routes, database tables, configuration, and tests expected to change.

### Out of Scope
What must not be changed.

### Implementation Steps
Ordered, concrete steps with enough detail for a junior developer to follow.

### API/Data Contract Changes
Document exact request/response schemas, event types, error behavior, migrations, and compatibility impact.

### Test Plan
Include unit, integration, API, security, and load-test coverage as applicable.

### Acceptance Criteria
Use observable outcomes, not vague statements.

Example:

- `docker compose up` starts all required services successfully.
- A member can authenticate and access only member-allowed APIs.
- A member receives `403` from an admin API even through direct HTTP requests.
- No credential is stored in local storage.
- The expected-load test completes with error rate below the agreed threshold.
- p95 latency remains within the agreed launch target.
- The database connection pool does not exhaust.
- An external provider timeout returns a safe, typed error response.
- Logs contain request IDs but no secrets or sensitive user content.

### Validation Commands
Include copy-ready commands where possible.

### Rollback Plan
State exactly how to revert the change safely.

### Risks and Decisions
State tradeoffs, assumptions, and unresolved decisions.

---

# 4. Coding-Agent Work Packets

For each implementation phase, create a coding-agent-ready work packet.

Use this format:

```md
## Work Packet: [Name]

### Objective
[One clear outcome.]

### Repository Areas
- [Exact folders/files]

### Required Changes
1. ...
2. ...
3. ...

### Constraints
- Maintain existing API compatibility unless explicitly changed.
- Do not introduce a new framework or service without approval.
- Do not store secrets in source, logs, tests, or browser storage.
- Keep changes narrowly scoped.
- Add or update tests with every behavior change.

### Definition of Done
- [Observable criteria]
- [Test criteria]
- [Security/performance criteria]

### Validation Commands
```bash
# commands here