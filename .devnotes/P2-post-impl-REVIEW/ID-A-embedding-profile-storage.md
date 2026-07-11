# ID-A — Embedding profile storage (junior dev explainer)

Part of the **ID-A** working set. Parent: [ID-A.md](./ID-A.md). **Which profiles admin can pick:** [ID-A-model-catalog-and-defaults.md](./ID-A-model-catalog-and-defaults.md).

This section answers: **when someone creates a Knowledge Domain, which embedding model does it use, where is that stored, and what rules protect it?**

---

### What problem are we solving?

A **domain** (e.g. `fatigue`) is a knowledge space backed by vector search. Vector search needs an **embedding model** — which provider, which model name, and how many dimensions (e.g. 1536).

That choice must be:

1. **Stored clearly** — not buried in JSON
2. **Validated at create** — bad IDs fail before anything runs
3. **Locked once in use** — you can’t swap models mid-flight and break indexed vectors

---

### 1. FK column `embedding_profile_id` NOT NULL on `domains`

**What it means:** Every row in the `domains` table has a required column pointing at a row in `model_profiles`.

```text
model_profiles                    domains
┌─────────────────────┐          ┌──────────────────────────┐
│ id (UUID)           │◄─────────│ embedding_profile_id   │
│ profile_kind        │   FK     │ id (slug, e.g. fatigue)  │
│ provider_kind       │          │ display_name             │
│ model_name          │          │ state                    │
│ vector_dimensions   │          │ ...                      │
└─────────────────────┘          └──────────────────────────┘
```

From the contract:

| Column | Type | Rule |
|--------|------|------|
| `embedding_profile_id` | `String(36)` NOT NULL | FK → `model_profiles.id`; must be `profile_kind = embedding` |

**Why NOT NULL?** Every domain must declare its embedding model at create. No “use global default later” (old server allowed that; greenfield does not).

**Why a real FK, not JSON `meta`?** The doc rejects generic JSON on `domains` — typed columns + DB constraints are harder to drift and easier to enforce.

**API shape:** Admin sends `embeddingProfileId` on `POST /admin/domains` and gets it back on domain DTOs. It’s part of the domain’s identity for admins, alongside `id` and `displayName`. The UI preselects **OpenAI Default Embedding** from the seeded catalog; admin may choose another embedding profile before create — see [ID-A-model-catalog-and-defaults.md](./ID-A-model-catalog-and-defaults.md).

**Important:** The domain’s embedding profile is **immutable after create** — there is no PATCH field to change it later. The diagram in the doc labels this explicitly: `embedding_profile_id (immutable after create)`.

---

### 2. Validate via `TrustedRuntimeResolver` at create

**What it means:** When handling `POST /admin/domains`, don’t just check “UUID exists in DB.” Run it through the same trusted validation path used for runtime config (F-002 / P2).

**Checks you need (adapted from old server, wired into greenfield):**

| Check | Failure |
|-------|---------|
| Profile exists | `404 embedding_profile_not_found` |
| `profile_kind == 'embedding'` (not synthesis) | `400 embedding_profile_invalid` |
| Provider for that profile is configured/ready | `400 embedding_profile_invalid` or provider-not-ready style error |

The P3 review shows the intended pattern:

```424:432:.devnotes/p3/F-003-P3-review.md
### Embedding profile validation (adapt to `TrustedRuntimeResolver`)
    def resolve_embedding_profile(self, embedding_profile_id: str | None = None) -> AIModelProfileRow:
        if embedding_profile_id:
            profile = self.service.get_profile(embedding_profile_id)
            if profile is None:
                raise ValueError(f"Profile '{embedding_profile_id}' does not exist")
            if profile.kind != "embedding":
                raise ValueError(f"Profile '{embedding_profile_id}' is not an embedding profile")
```

**Note for juniors:** Today’s `TrustedRuntimeResolver.resolve()` only resolves **synthesis + parser** for chat/runtime — it does not yet expose `resolve_embedding_profile()`. P3 domain create is where you add (or extend) that validation. Same trust boundary: DB + provider readiness, **no network calls** to provider APIs.

**Flow:**

```text
POST /admin/domains { id, displayName, embeddingProfileId }
        │
        ▼
TrustedRuntimeResolver (or equivalent service method)
  → load profile
  → assert embedding kind
  → assert provider ready
        │
        ▼
INSERT domains row with embedding_profile_id
  state = stopped, available = false
```

---

### 3. Lock immutability: FK presence blocks profile PATCH/DELETE

**What it means:** Once **any** domain row references an embedding profile, that profile becomes **read-only** for admin mutation APIs.

This is already specified in API-001 P2:

```105:107:specs/03-contracts/api/context-engine-v1.md
`PATCH /admin/runtime-settings/model-profiles/{profile_id}` may update `name`, `modelName`, or `vectorDimensions`. Used embedding profiles are immutable once a domain references them.

`DELETE /admin/runtime-settings/model-profiles/{profile_id}` deletes an unused profile. Active synthesis profiles and profiles referenced by a domain cannot be deleted.
```

**How the lock works conceptually:**

```text
Admin tries PATCH or DELETE on model_profiles/{id}
        │
        ▼
Query: EXISTS domain WHERE embedding_profile_id = :id ?
        │
   yes ─┴─► 409 reject (profile in use / immutable)
   no  ───► allow (if not also active synthesis profile)
```

The **FK is the lock signal**. You don’t need a separate “locked” flag on `model_profiles` — domain references *are* the lock.

**Why?** Embedding model + `vector_dimensions` must stay stable for indexed vectors. Changing model or dimensions after indexing would make existing vectors incompatible with search.

**Two layers of immutability (don’t confuse them):**

| Layer | What’s locked | When |
|-------|----------------|------|
| Domain → profile | Domain’s `embeddingProfileId` | Set at create; never changed |
| Profile itself | PATCH/DELETE on `model_profiles` | Blocked while any domain FK points at it |

---

### Mental model vs old server

| Old server | Greenfield (this doc) |
|------------|------------------------|
| Embedding lived in manifest / `meta.desired_manifest` | Typed FK on `domains` |
| Optional; could fall back to default | Required at create |
| Less strict DB enforcement | FK + CHECK + service validation |

---

### What you implement (order)

1. Migration: add `embedding_profile_id` NOT NULL FK on `domains` (+ index)
2. Domain create handler: require `embeddingProfileId`, validate via resolver
3. Profile PATCH/DELETE: before mutating, check for referencing domains (API-001 P2 rule — may need wiring in `update_model_profile` / `delete_model_profile`; current P2 code only blocks delete for **active synthesis**, not domain FK yet)
4. Tests: invalid/missing profile, wrong kind, profile in use → PATCH/DELETE rejected

---

### One-line summary

**Each domain permanently points at one embedding profile via a DB foreign key; create validates that profile through trusted runtime rules; and once a domain exists, that profile can’t be edited or deleted because changing embeddings would break the domain’s vector index.**