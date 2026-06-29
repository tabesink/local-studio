# Vertical Slice Delivery Map

```text
01 runtime foundation
  -> 02 login/cookie/session
     -> 03 shell/role nav
        -> 04 general settings
        -> 05 users
        -> 06 domains
        -> 07 providers
        -> 08 parser
        -> 09 library
           -> 10 upload/jobs
           -> 16 source nav
        -> 11 chat shell
           -> 12 SSE/evidence
        -> 13 graph
        -> 14 lifecycle
           -> 15 recovery
        -> 17 audit/diagnostics
```

## Critical path

```text
02 -> 03 -> 06 -> 07 -> 11 -> 12 -> 09 -> 10 -> 13 -> 14 -> 15 -> 17
```

Do not build feature visuals before token/primitives/shell contract exists.
