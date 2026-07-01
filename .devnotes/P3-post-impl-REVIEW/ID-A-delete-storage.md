# ID-A - Delete and storage (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** How should P4 store originals and remove source data safely?

### Decision

Store Source Document originals in private server storage, keep only safe file metadata and hash in `source_documents`, and remove source rows/files on source delete and domain delete. API DTOs never expose storage paths or download URLs in P4.

P4 local delete does not call LightRAG. P5 adds remote indexed content delete.

### Why

| Bad | Good |
| --- | --- |
| old `storage_path` in public-ish document model | private storage key/path stays server-only |
| browser direct-to-storage upload | API owns upload and validation |
| duplicate check by filename | duplicate check by hash within domain |
| domain delete ignores source artifacts | domain delete purges sources before row removal |
| source delete leaves prepared blocks | delete cascades or explicitly removes all P4 rows |

### Upload Storage Rules

```text
1. Validate domain and request before writing when possible.
2. Stream original to private temp/final storage.
3. Compute sha256 and size.
4. Insert source_documents with original_sha256.
5. On DB failure, delete the written file.
6. On duplicate hash, delete the written file and return safe 409.
```

Open decision: exact max file size and supported content types must be captured in API-001 before implementation.

### Delete Rules

Source delete:

```text
source.state -> deleting
cancel active prep op if possible
remove source_images rows and private files
remove source_blocks rows
remove source_preparation_operations rows
remove original file
hard-delete source_documents row
```

Domain delete handoff:

```text
P3 delete worker
  -> before hard-deleting domain:
       purge all sources in that domain
  -> then remove runtime resources and domain row
```

If a future P5 indexed source exists, remote LightRAG delete must happen before final local source removal. That is not P4.

### Implement Order

```text
1. Add private source storage helper with path confinement.
2. Add upload rollback tests.
3. Add duplicate hash guard.
4. Add source delete service.
5. Extend domain delete worker with P4 source purge hook.
6. Add storage cleanup assertions.
```

### Red Flags In PR

- API returns storage path, source path, image path, or download URL.
- File cleanup is best-effort with no tests.
- Duplicate detection uses filename only.
- Domain delete drops `domains` row before source cleanup.
- P4 calls LightRAG delete.
- Source delete silently leaves Source Blocks or operation rows.

### Tests

- Upload writes original and stores hash/size metadata.
- Same hash in same domain returns safe duplicate error.
- Same filename with different hash is allowed unless API-001 says otherwise.
- DB failure after file write removes file.
- Source delete removes original, image files, blocks, images, operations, and source row.
- Domain delete purges source rows/files before final domain removal.
- Source API DTO scan excludes paths and URLs.

### One-line Summary

P4 storage is private, hash-addressed for duplicate prevention, and fully purged on source/domain delete without exposing paths or calling LightRAG.
