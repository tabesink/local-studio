# Next Steps:

## Features 

1. Exploring the codebase for tab UI, API contracts, and runtime behavior of tab shells like a chatshell in og-local-studio and smart composer

2. The ability to branch from a conversation 


3. Using page/section to enhance retrieval based on document structure 

    # Would page/section in the marker expand what users can ask?

    **Short answer:** A little, for **page-number-style** questions. Not much for **section** questions. It does **not** turn the product into structured search or unlock new question *types*.

    ---

    ## How questions actually work in this app

    ```text
    User question (P7 chat or P6 evidence-only)
            |
            v
    Pick ONE Knowledge Domain          <-- scope limit (always)
            |
            v
    Filter: source_is_query_eligible() <-- P5: prepared + index ready + not deleted
            |
            v
    LightRAG semantic retrieve           <-- matches embedded TEXT only
            |
            v
    Hit text must contain [CE_BLOCK id=...]  <-- P6 maps to source_blocks row
            |
            v
    Evidence card: excerpt + labels      <-- page/section from DB, not from marker
    ```

    Pilot chat is **RAG-only within a domain**. Users cannot ask general knowledge questions. Marker grammar does not change that boundary.

    ---

    ## What marker page/section would vs would not do

    | If you add page/section to marker | Effect |
    |-----------------------------------|--------|
    | User asks *"What's on page 5?"* | **Maybe helps** — page numbers often are **not** in `canonical_markdown`, so embedding `"page=5"` in the marker gives LightRAG extra tokens to match |
    | User asks *"What does the Inspection section say?"* | **Usually little gain** — section titles are often already in the block text as headings (`# Inspection`, etc.) |
    | User asks *"Search only pages 10–20"* | **No** — that needs **structured pre-filter**, not extra marker fields. Not in P6 spec today |
    | User sees page/section on Evidence cards | **No change** — P6 reads `page_start`, `section_path` from `source_blocks` **after** mapping by `CE_BLOCK id` |
    | Outline / source navigation (P4) | **No change** — outline API already has page/section from DB |
    | Query eligibility | **No change** — still `index_state == ready` etc. |
    | Citation correctness | **No change** — still exact `CE_BLOCK id`, not page number |

    So: marker metadata is a **retrieval hint inside embedded text**, not a new product capability.

    ---

    ## Two copies of page/section (important)

    ```text
    source_blocks (DB)                    marker text (LightRAG input)
    -------------------                   ---------------------------
    page_start, page_end                  optional: page=5 in [CE_BLOCK ...]
    section_path                          optional: section="Inspection"
            |                                      |
            +---- used for outline UI --------------+
            +---- used for Evidence labels ---------+
            |
            +---- NOT used for semantic match unless also in indexed text
    ```

    **DB fields** → structure, UI, Evidence labels  
    **Marker fields** → only affect **which blocks LightRAG retrieves** for fuzzy semantic questions

    Including page/section in the marker duplicates data already in DB, mainly to help **embedding similarity**, not to expose new APIs.

    ---

    ## Would users ask *more kinds* of questions?

    ```text
    WITHOUT page/section in marker:
    "Summarize the torque spec"           OK (semantic)
    "What does Inspection cover?"       OK (heading often in markdown)
    "What's on page 5?"                 WEAK (page # may not appear in text)

    WITH page/section in marker:
    "What's on page 5?"                 BETTER (page token in indexed text)
    "Inspection section requirements"   SLIGHTLY BETTER (redundant if heading exists)
    "Only page 5, ignore rest"          STILL NO (needs filter logic, not markers)
    "Compare domain A vs B"             STILL NO (one domain per turn)
    "What's the weather?"               STILL NO (RAG-only)
    ```

    **Net:** Slightly better **recall** for location-flavored questions. Not a new **feature class**.

    ---

    ## Why v1 still says no (recommendation unchanged)

    1. **Evidence spine is `CE_BLOCK id`, not page** — P6 discards hits without exact marker; extra grammar increases mangling risk in T-001.
    2. **Section names often already indexed** — they live in `canonical_markdown`.
    3. **Real page-filter questions need P6/P7 work anyway** — e.g. parse "page 5" → narrow eligible blocks before retrieve. Markers alone do not give hard filters.
    4. **Cost/benefit** — small retrieval gain vs. grammar complexity, escaping, golden tests, fixture proof.

    ---

    ## If you later need page-aware questions

    Prefer this order (does not require marker change first):

    ```text
    1. Rely on canonical_markdown (headings, "Page 5" in body if parser kept it)
    2. P6 pre-filter: detect page/section intent -> limit blocks before retrieve
    3. P9: user picks outline node -> scoped retrieve (explicit, not NLP guess)
    4. LAST RESORT: add page/section to marker IF T-001 shows recall gap
    + escaping rules + golden tests + re-prove CE_BLOCK survival
    ```

    ---

    ## One-line takeaway

    **Including page/section in the marker might help LightRAG *find* page-oriented questions slightly better; it does not expand the product’s question scope, eligibility rules, or Evidence provenance model.** Keep v1 minimal; add marker metadata only if T-001 + real queries show a recall gap that DB/outline/pre-filter cannot fix.