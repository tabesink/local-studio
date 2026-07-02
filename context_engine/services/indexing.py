from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from context_engine.config import Settings
from context_engine.db import utc_now
from context_engine.models import (
    DOMAIN_STATE_DELETING,
    SOURCE_INDEX_REMOTE_STATES,
    SOURCE_INDEX_STATE_ACCEPTED,
    SOURCE_INDEX_STATE_CANCELLED,
    SOURCE_INDEX_STATE_CANCELLING,
    SOURCE_INDEX_STATE_FAILED,
    SOURCE_INDEX_STATE_NOT_REQUESTED,
    SOURCE_INDEX_STATE_QUEUED,
    SOURCE_INDEX_STATE_READY,
    SOURCE_INDEX_STATE_SUBMITTING,
    SOURCE_STATE_DELETING,
    SOURCE_STATE_PREPARED,
    Domain,
    SourceBlock,
    SourceDocument,
)
from context_engine.services.domains import LocalDomainRuntimeController, controller_from_settings, domain_available

_RENDER_HEADER_RE = re.compile(r"^\[CE_BLOCK id=([^\] ]+) order=(\d+)\]$", re.MULTILINE)
_REQUEST_ID_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,96}$")


class SourceIndexError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


@dataclass(frozen=True)
class RenderedLightRAGInput:
    text: str
    content_hash: str
    block_ids: tuple[str, ...]


@dataclass(frozen=True)
class IndexSubmitResult:
    remote_document_id: str


@dataclass(frozen=True)
class IndexReadiness:
    ready: bool
    failed: bool = False
    error_code: str | None = None
    error_message: str | None = None


@dataclass(frozen=True)
class RawRetrievalHit:
    text: str


def _safe_error(code: str, message: str) -> SourceIndexError:
    return SourceIndexError(502, code, message)


def _normalize_markdown(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n").strip()


def render_lightrag_input(db: Session, source: SourceDocument) -> RenderedLightRAGInput:
    if source.state != SOURCE_STATE_PREPARED:
        raise SourceIndexError(409, "source_state_conflict", "Source state does not allow this operation.")

    blocks = list(
        db.scalars(
            select(SourceBlock)
            .where(SourceBlock.source_document_id == source.id)
            .order_by(SourceBlock.source_order, SourceBlock.id)
        )
    )
    if not blocks:
        raise SourceIndexError(422, "source_index_input_invalid", "Source cannot be indexed.")

    seen_ids: set[str] = set()
    rendered_blocks: list[str] = []
    block_ids: list[str] = []
    for block in blocks:
        if block.id in seen_ids:
            raise SourceIndexError(422, "source_index_input_invalid", "Source cannot be indexed.")
        seen_ids.add(block.id)
        body = _normalize_markdown(block.canonical_markdown or "")
        if not body:
            raise SourceIndexError(422, "source_index_input_invalid", "Source cannot be indexed.")
        rendered_blocks.append(f"[CE_BLOCK id={block.id} order={block.source_order}]\n{body}")
        block_ids.append(block.id)

    text = f"[CE_SOURCE schema=1 source_id={source.id} sha256={source.original_sha256}]\n\n" + "\n\n".join(rendered_blocks)
    content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return RenderedLightRAGInput(text=text, content_hash=content_hash, block_ids=tuple(block_ids))


def compute_index_request_id(source_id: str, generation: int, content_hash: str) -> str:
    return f"{source_id}-{generation}-{content_hash[:16]}"


def _current_request_identity(source: SourceDocument) -> bool:
    if source.index_generation < 1 or not source.index_request_id or not source.index_content_hash:
        return False
    return source.index_request_id == compute_index_request_id(source.id, source.index_generation, source.index_content_hash)


def _queue_new_generation(db: Session, source: SourceDocument) -> RenderedLightRAGInput:
    rendered = render_lightrag_input(db, source)
    now = utc_now()
    source.index_generation += 1
    source.index_request_id = compute_index_request_id(source.id, source.index_generation, rendered.content_hash)
    source.index_content_hash = rendered.content_hash
    source.index_remote_document_id = None
    source.index_state = SOURCE_INDEX_STATE_QUEUED
    source.index_error_code = None
    source.index_error_message = None
    source.index_lease_owner = None
    source.index_lease_expires_at = None
    source.index_accepted_at = None
    source.index_ready_at = None
    source.index_updated_at = now
    source.updated_at = now
    return rendered


def queue_source_index_after_publish(db: Session, source: SourceDocument) -> None:
    if source.state != SOURCE_STATE_PREPARED:
        raise SourceIndexError(409, "source_state_conflict", "Source state does not allow this operation.")
    _queue_new_generation(db, source)


def _domain_or_404(db: Session, domain_id: str) -> Domain:
    domain = db.get(Domain, domain_id)
    if domain is None:
        raise SourceIndexError(404, "domain_not_found", "Domain not found.")
    if domain.state == DOMAIN_STATE_DELETING:
        raise SourceIndexError(409, "domain_state_conflict", "Domain lifecycle state does not allow this operation.")
    return domain


def _source_or_404(db: Session, domain_id: str, source_id: str) -> SourceDocument:
    source = db.get(SourceDocument, source_id)
    if source is None or source.domain_id != domain_id:
        raise SourceIndexError(404, "source_not_found", "Source not found.")
    return source


def _safe_request_id(request_id: str) -> str:
    if _REQUEST_ID_RE.fullmatch(request_id) is None:
        raise _safe_error("source_index_unavailable", "Source index runtime unavailable.")
    return request_id


def _private_remote_id(request_id: str) -> str:
    return hashlib.sha256(f"ce-index:{request_id}".encode("utf-8")).hexdigest()[:32]


def _rendered_block_ids(rendered_text: str) -> list[str]:
    return [match.group(1) for match in _RENDER_HEADER_RE.finditer(rendered_text)]


def _rendered_hit_chunks(rendered_text: str) -> list[dict[str, str]]:
    matches = list(_RENDER_HEADER_RE.finditer(rendered_text))
    chunks: list[dict[str, str]] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(rendered_text)
        text = rendered_text[start:end].strip()
        if text:
            chunks.append({"blockId": match.group(1), "text": text})
    return chunks


class LocalLightRAGIndexClient:
    def __init__(self, settings: Settings, controller: LocalDomainRuntimeController | None = None) -> None:
        self._settings = settings
        self._controller = controller or controller_from_settings(settings)

    def _index_dir(self, domain: Domain) -> Path:
        return self._controller.runtime_dir(domain.id, domain.runtime_instance_id) / "index"

    def _record_path(self, domain: Domain, request_id: str) -> Path:
        return self._index_dir(domain) / f"{_safe_request_id(request_id)}.json"

    def submit(self, domain: Domain, *, request_id: str, content_hash: str, rendered_text: str) -> IndexSubmitResult:
        if not self._controller.health(domain).healthy:
            raise _safe_error("source_index_unavailable", "Source index runtime unavailable.")
        block_ids = _rendered_block_ids(rendered_text)
        if not block_ids:
            raise SourceIndexError(422, "source_index_input_invalid", "Source cannot be indexed.")
        record_path = self._record_path(domain, request_id)
        remote_id = _private_remote_id(request_id)
        if record_path.exists():
            try:
                existing = json.loads(record_path.read_text(encoding="utf-8"))
            except (OSError, ValueError) as exc:
                raise _safe_error("source_index_unavailable", "Source index runtime unavailable.") from exc
            if existing.get("contentHash") != content_hash:
                raise SourceIndexError(409, "source_index_conflict", "Source index request conflict.")
            return IndexSubmitResult(remote_document_id=str(existing.get("remoteDocumentId") or remote_id))
        record = {
            "requestId": request_id,
            "contentHash": content_hash,
            "remoteDocumentId": remote_id,
            "blockIds": block_ids,
            "chunks": _rendered_hit_chunks(rendered_text),
            "status": "ready",
        }
        try:
            record_path.parent.mkdir(parents=True, exist_ok=True)
            record_path.write_text(json.dumps(record, sort_keys=True), encoding="utf-8")
        except OSError as exc:
            raise _safe_error("source_index_unavailable", "Source index runtime unavailable.") from exc
        return IndexSubmitResult(remote_document_id=remote_id)

    def readiness(self, domain: Domain, *, request_id: str) -> IndexReadiness:
        if not self._controller.health(domain).healthy:
            return IndexReadiness(ready=False, failed=True, error_code="source_index_unavailable", error_message="Source index runtime unavailable.")
        record_path = self._record_path(domain, request_id)
        if not record_path.exists():
            return IndexReadiness(ready=False, failed=True, error_code="source_index_missing", error_message="Source index content is unavailable.")
        try:
            record = json.loads(record_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return IndexReadiness(ready=False, failed=True, error_code="source_index_unavailable", error_message="Source index runtime unavailable.")
        if record.get("status") == "failed":
            return IndexReadiness(ready=False, failed=True, error_code="source_index_failed", error_message="Source index failed.")
        return IndexReadiness(ready=record.get("status") == "ready")

    def delete(self, domain: Domain, *, request_id: str) -> None:
        record_path = self._record_path(domain, request_id)
        try:
            if record_path.exists():
                record_path.unlink()
        except OSError as exc:
            raise _safe_error("source_index_delete_failed", "Source index content could not be removed.") from exc

    def is_absent(self, domain: Domain, *, request_id: str) -> bool:
        return not self._record_path(domain, request_id).exists()

    def retrieve(self, domain: Domain, *, question: str) -> tuple[RawRetrievalHit, ...]:
        if not question.strip() or not self._controller.health(domain).healthy:
            raise _safe_error("source_index_unavailable", "Source index runtime unavailable.")
        index_dir = self._index_dir(domain)
        if not index_dir.exists():
            return ()
        hits: list[RawRetrievalHit] = []
        try:
            record_paths = sorted(index_dir.glob("*.json"))
        except OSError as exc:
            raise _safe_error("source_index_unavailable", "Source index runtime unavailable.") from exc
        for record_path in record_paths:
            try:
                record = json.loads(record_path.read_text(encoding="utf-8"))
            except (OSError, ValueError) as exc:
                raise _safe_error("source_index_unavailable", "Source index runtime unavailable.") from exc
            if record.get("status") != "ready":
                continue
            chunks = record.get("chunks")
            if not isinstance(chunks, list):
                continue
            for chunk in chunks:
                if isinstance(chunk, dict) and isinstance(chunk.get("text"), str):
                    hits.append(RawRetrievalHit(text=chunk["text"]))
        return tuple(hits)

    def preserved_block_ids(self, domain: Domain, *, request_id: str) -> tuple[str, ...]:
        record_path = self._record_path(domain, request_id)
        if not record_path.exists():
            return ()
        try:
            record = json.loads(record_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return ()
        values = record.get("blockIds")
        if not isinstance(values, list):
            return ()
        return tuple(str(value) for value in values)


def index_client_from_settings(settings: Settings) -> LocalLightRAGIndexClient:
    return LocalLightRAGIndexClient(settings)


def _remote_delete_required(source: SourceDocument) -> bool:
    return bool(source.index_request_id and (source.index_state in SOURCE_INDEX_REMOTE_STATES or source.index_remote_document_id))


def _delete_remote_if_needed(
    db: Session,
    settings: Settings,
    source: SourceDocument,
    request_id: str | None,
    client: LocalLightRAGIndexClient | None = None,
) -> None:
    if not request_id:
        return
    domain = db.get(Domain, source.domain_id)
    if domain is None:
        return
    client = client or index_client_from_settings(settings)
    client.delete(domain, request_id=request_id)
    if not client.is_absent(domain, request_id=request_id):
        raise SourceIndexError(502, "source_index_delete_failed", "Source index content could not be removed.")


def retry_source_index(
    db: Session,
    *,
    settings: Settings,
    domain_id: str,
    source_id: str,
    client: LocalLightRAGIndexClient | None = None,
) -> SourceDocument:
    _domain_or_404(db, domain_id)
    source = _source_or_404(db, domain_id, source_id)
    if source.state != SOURCE_STATE_PREPARED:
        raise SourceIndexError(409, "source_state_conflict", "Source state does not allow this operation.")
    if source.index_state in {SOURCE_INDEX_STATE_QUEUED, SOURCE_INDEX_STATE_SUBMITTING, SOURCE_INDEX_STATE_CANCELLING}:
        raise SourceIndexError(409, "source_index_in_progress", "Source indexing is already in progress.")

    old_request_id = source.index_request_id
    if _remote_delete_required(source):
        _delete_remote_if_needed(db, settings, source, old_request_id, client)

    _queue_new_generation(db, source)
    db.commit()
    db.refresh(source)
    return source


def cancel_source_index(
    db: Session,
    *,
    settings: Settings,
    domain_id: str,
    source_id: str,
    client: LocalLightRAGIndexClient | None = None,
) -> SourceDocument:
    _domain_or_404(db, domain_id)
    source = _source_or_404(db, domain_id, source_id)
    if source.state != SOURCE_STATE_PREPARED:
        raise SourceIndexError(409, "source_state_conflict", "Source state does not allow this operation.")
    if source.index_state in {SOURCE_INDEX_STATE_NOT_REQUESTED, SOURCE_INDEX_STATE_CANCELLED}:
        raise SourceIndexError(409, "source_state_conflict", "Source state does not allow this operation.")

    old_request_id = source.index_request_id
    needs_remote_delete = _remote_delete_required(source) or source.index_state == SOURCE_INDEX_STATE_SUBMITTING
    now = utc_now()
    source.index_generation += 1
    source.index_state = SOURCE_INDEX_STATE_CANCELLING
    source.index_error_code = None
    source.index_error_message = None
    source.index_lease_owner = None
    source.index_lease_expires_at = None
    source.index_updated_at = now
    source.updated_at = now
    db.commit()
    db.refresh(source)

    try:
        if needs_remote_delete:
            _delete_remote_if_needed(db, settings, source, old_request_id, client)
    except SourceIndexError:
        current = db.get(SourceDocument, source.id)
        if current is not None:
            current.index_error_code = "source_index_delete_failed"
            current.index_error_message = "Source index content could not be removed."
            current.index_updated_at = utc_now()
            db.commit()
        raise

    source.index_state = SOURCE_INDEX_STATE_CANCELLED
    source.index_request_id = None
    source.index_content_hash = None
    source.index_remote_document_id = None
    source.index_accepted_at = None
    source.index_ready_at = None
    source.index_updated_at = utc_now()
    source.updated_at = source.index_updated_at
    db.commit()
    db.refresh(source)
    return source


def cleanup_index_before_source_delete(
    db: Session,
    *,
    settings: Settings,
    source: SourceDocument,
    client: LocalLightRAGIndexClient | None = None,
) -> None:
    old_request_id = source.index_request_id
    needs_remote_delete = _remote_delete_required(source) or source.index_state == SOURCE_INDEX_STATE_SUBMITTING
    if source.index_state not in {SOURCE_INDEX_STATE_NOT_REQUESTED, SOURCE_INDEX_STATE_CANCELLED}:
        now = utc_now()
        source.index_generation += 1
        source.index_state = SOURCE_INDEX_STATE_CANCELLING if needs_remote_delete else SOURCE_INDEX_STATE_CANCELLED
        source.index_error_code = None
        source.index_error_message = None
        source.index_lease_owner = None
        source.index_lease_expires_at = None
        source.index_updated_at = now
        source.updated_at = now
        db.commit()
        db.refresh(source)

    try:
        if needs_remote_delete:
            _delete_remote_if_needed(db, settings, source, old_request_id, client)
    except SourceIndexError:
        current = db.get(SourceDocument, source.id)
        if current is not None:
            current.index_error_code = "source_index_delete_failed"
            current.index_error_message = "Source index content could not be removed."
            current.index_updated_at = utc_now()
            db.commit()
        raise

    if source.index_state != SOURCE_INDEX_STATE_CANCELLED:
        source.index_state = SOURCE_INDEX_STATE_CANCELLED
        source.index_request_id = None
        source.index_content_hash = None
        source.index_remote_document_id = None
        source.index_accepted_at = None
        source.index_ready_at = None
        source.index_updated_at = utc_now()
        source.updated_at = source.index_updated_at
        db.commit()
        db.refresh(source)


def _worker_result_is_current(source: SourceDocument, generation: int, request_id: str) -> bool:
    return (
        source.index_generation == generation
        and source.index_request_id == request_id
        and source.state == SOURCE_STATE_PREPARED
        and source.index_state not in {SOURCE_INDEX_STATE_CANCELLING, SOURCE_INDEX_STATE_CANCELLED}
    )


def mark_index_accepted_if_current(
    db: Session,
    *,
    source_id: str,
    generation: int,
    request_id: str,
    remote_document_id: str,
) -> bool:
    source = db.get(SourceDocument, source_id)
    if source is None or source.index_state != SOURCE_INDEX_STATE_SUBMITTING or not _worker_result_is_current(source, generation, request_id):
        return False
    now = utc_now()
    source.index_state = SOURCE_INDEX_STATE_ACCEPTED
    source.index_remote_document_id = remote_document_id
    source.index_error_code = None
    source.index_error_message = None
    source.index_accepted_at = now
    source.index_ready_at = None
    source.index_lease_owner = None
    source.index_lease_expires_at = None
    source.index_updated_at = now
    source.updated_at = now
    db.commit()
    return True


def mark_index_ready_if_current(db: Session, *, source_id: str, generation: int, request_id: str) -> bool:
    source = db.get(SourceDocument, source_id)
    if source is None or source.index_state != SOURCE_INDEX_STATE_ACCEPTED or not _worker_result_is_current(source, generation, request_id):
        return False
    now = utc_now()
    source.index_state = SOURCE_INDEX_STATE_READY
    source.index_error_code = None
    source.index_error_message = None
    source.index_ready_at = now
    source.index_lease_owner = None
    source.index_lease_expires_at = None
    source.index_updated_at = now
    source.updated_at = now
    db.commit()
    return True


def mark_index_failed_if_current(db: Session, *, source_id: str, generation: int, request_id: str, code: str, message: str) -> bool:
    source = db.get(SourceDocument, source_id)
    if source is None or not _worker_result_is_current(source, generation, request_id):
        return False
    now = utc_now()
    source.index_state = SOURCE_INDEX_STATE_FAILED
    source.index_error_code = code
    source.index_error_message = message
    source.index_lease_owner = None
    source.index_lease_expires_at = None
    source.index_updated_at = now
    source.updated_at = now
    db.commit()
    return True


class SourceIndexWorker:
    def __init__(self, settings: Settings, client: LocalLightRAGIndexClient | None = None) -> None:
        self._settings = settings
        self._client = client or index_client_from_settings(settings)

    def run_once(self, db: Session) -> bool:
        source = self._claim_next_source(db)
        if source is None:
            return False
        domain = db.get(Domain, source.domain_id)
        if domain is None:
            return True
        generation = source.index_generation
        request_id = source.index_request_id
        if not request_id:
            return True

        if source.index_state == SOURCE_INDEX_STATE_SUBMITTING:
            try:
                rendered = render_lightrag_input(db, source)
                if rendered.content_hash != source.index_content_hash:
                    raise SourceIndexError(409, "source_index_conflict", "Source index request conflict.")
                result = self._client.submit(domain, request_id=request_id, content_hash=rendered.content_hash, rendered_text=rendered.text)
            except SourceIndexError as exc:
                db.rollback()
                mark_index_failed_if_current(db, source_id=source.id, generation=generation, request_id=request_id, code=exc.code, message=exc.message)
                return True
            mark_index_accepted_if_current(
                db,
                source_id=source.id,
                generation=generation,
                request_id=request_id,
                remote_document_id=result.remote_document_id,
            )
            return True

        if source.index_state == SOURCE_INDEX_STATE_ACCEPTED:
            readiness = self._client.readiness(domain, request_id=request_id)
            if readiness.failed:
                mark_index_failed_if_current(
                    db,
                    source_id=source.id,
                    generation=generation,
                    request_id=request_id,
                    code=readiness.error_code or "source_index_failed",
                    message=readiness.error_message or "Source index failed.",
                )
            elif readiness.ready:
                mark_index_ready_if_current(db, source_id=source.id, generation=generation, request_id=request_id)
            return True

        return True

    def _claim_next_source(self, db: Session) -> SourceDocument | None:
        now = utc_now()
        source = db.scalar(
            select(SourceDocument)
            .where(
                SourceDocument.state == SOURCE_STATE_PREPARED,
                or_(
                    SourceDocument.index_state == SOURCE_INDEX_STATE_QUEUED,
                    (
                        (SourceDocument.index_state == SOURCE_INDEX_STATE_SUBMITTING)
                        & (SourceDocument.index_lease_expires_at.is_not(None))
                        & (SourceDocument.index_lease_expires_at < now)
                    ),
                    SourceDocument.index_state == SOURCE_INDEX_STATE_ACCEPTED,
                ),
            )
            .order_by(SourceDocument.index_updated_at, SourceDocument.created_at, SourceDocument.id)
        )
        if source is None:
            return None
        if source.index_state == SOURCE_INDEX_STATE_QUEUED:
            source.index_state = SOURCE_INDEX_STATE_SUBMITTING
            source.index_lease_owner = self._settings.source_index_worker_id
            source.index_lease_expires_at = now + timedelta(seconds=self._settings.source_index_lease_seconds)
            source.index_updated_at = now
            source.updated_at = now
            db.commit()
            db.refresh(source)
        return source


def source_is_query_eligible(
    db: Session,
    source: SourceDocument,
    domain: Domain,
    *,
    settings: Settings | None = None,
    controller: LocalDomainRuntimeController | None = None,
) -> bool:
    controller = controller or (controller_from_settings(settings) if settings is not None else None)
    if controller is None or not domain_available(db, domain, controller):
        return False
    if source.domain_id != domain.id or source.state != SOURCE_STATE_PREPARED:
        return False
    if source.index_state != SOURCE_INDEX_STATE_READY:
        return False
    if source.state == SOURCE_STATE_DELETING or source.index_state in {SOURCE_INDEX_STATE_CANCELLING, SOURCE_INDEX_STATE_CANCELLED}:
        return False
    return _current_request_identity(source)
