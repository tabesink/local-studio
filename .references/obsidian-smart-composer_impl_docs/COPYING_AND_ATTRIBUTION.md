# Copying and Attribution

The pinned Smart Composer repository declares an MIT licence. MIT normally permits reuse subject to retaining the licence and copyright notice. Confirm the licence file at `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/LICENSE` before copying any code.

## Allowed reference use

- UI composition ideas.
- Small presentational components after dependency removal.
- Pure formatting, diff, parsing, and test-pattern ideas after security review.

## Prohibited transfer into Context Engine

- Obsidian `App`, `Plugin`, `WorkspaceLeaf`, `ItemView`, `TFile`, `Notice`, or vault APIs.
- Plugin data and PGlite/Drizzle persistence paths.
- Browser or desktop client model-provider calls.
- OAuth subscription-connect code or OAuth client configuration.
- Secrets in `src/constants.ts`; never repeat their values.
- MCP tool execution / local process management.
- Direct filesystem writes or direct “apply” behaviour.

When copying a source file rather than re-implementing the idea, include a nearby attribution comment with the source path, commit, and retained notice.
