from __future__ import annotations

import base64
import json
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from context_engine.db import utc_now
from context_engine.models import (
    AUDIT_ACTOR_ADMINISTRATOR,
    AUDIT_ACTOR_KINDS,
    AUDIT_ACTOR_MEMBER,
    AUDIT_ACTOR_SYSTEM,
    AUDIT_EVENT_AUDIT_EVENTS_READ,
    AUDIT_EVENT_NAMES,
    AUDIT_OUTCOME_SUCCEEDED,
    AUDIT_OUTCOMES,
    ROLE_ADMINISTRATOR,
    AuditEvent,
    User,
)
from context_engine.services.auth import iso_utc

MAX_AUDIT_METADATA_BYTES = 4096
MAX_AUDIT_METADATA_STRING_CHARS = 200
ALLOWED_AUDIT_METADATA_KEYS = {
    "operationType",
    "operationStatus",
    "sourceState",
    "indexState",
    "turnStatus",
    "stopReason",
    "redactedTurnCount",
    "diagnosticKind",
    "lineCount",
    "truncated",
    "limit",
    "elapsedMs",
    "wikiContributionState",
    "wikiPageState",
    "revisionNumber",
    "evidenceRefCount",
}


class AuditError(Exception):
    def __init__(self, message: str = "Audit unavailable.") -> None:
        self.status_code = 503
        self.code = "audit_unavailable"
        self.message = message
        super().__init__(message)


class AuditValidationError(Exception):
    def __init__(self, message: str = "Request validation failed.") -> None:
        self.status_code = 422
        self.code = "validation_error"
        self.message = message
        super().__init__(message)


@dataclass(frozen=True)
class AuditContext:
    request_id: str | None = None
    trace_id: str | None = None
    actor_user: User | None = None
    actor_kind: str | None = None


@dataclass(frozen=True)
class AuditEventPage:
    events: list[AuditEvent]
    next_cursor: str | None


def actor_kind_for_user(user: User | None) -> str:
    if user is None:
        return AUDIT_ACTOR_SYSTEM
    if user.role == ROLE_ADMINISTRATOR:
        return AUDIT_ACTOR_ADMINISTRATOR
    return AUDIT_ACTOR_MEMBER


def context_for_request(user: User, request_id: str | None) -> AuditContext:
    return AuditContext(actor_user=user, request_id=request_id)


def worker_audit_context(request_id: str | None = None) -> AuditContext:
    return AuditContext(actor_kind="worker", request_id=request_id)


def _validate_string(value: str, *, max_length: int) -> str:
    if len(value) > max_length:
        raise AuditError()
    return value


def _validated_metadata(metadata: dict[str, Any] | None) -> str | None:
    if not metadata:
        return None
    safe: dict[str, Any] = {}
    for key, value in metadata.items():
        if key not in ALLOWED_AUDIT_METADATA_KEYS:
            raise AuditError()
        if value is None or isinstance(value, bool):
            safe[key] = value
            continue
        if isinstance(value, int):
            safe[key] = value
            continue
        if isinstance(value, str):
            safe[key] = _validate_string(value, max_length=MAX_AUDIT_METADATA_STRING_CHARS)
            continue
        raise AuditError()
    encoded = json.dumps(safe, separators=(",", ":"), sort_keys=True)
    if len(encoded.encode("utf-8")) > MAX_AUDIT_METADATA_BYTES:
        raise AuditError()
    return encoded


def _metadata_dict(event: AuditEvent) -> dict[str, Any]:
    if not event.metadata_json:
        return {}
    try:
        parsed = json.loads(event.metadata_json)
    except ValueError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def safe_audit_event(event: AuditEvent) -> dict[str, Any]:
    return {
        "id": event.id,
        "eventName": event.event_name,
        "actorKind": event.actor_kind,
        "actorUserId": event.actor_user_id,
        "targetKind": event.target_kind,
        "targetId": event.target_id,
        "requestId": event.request_id,
        "traceId": event.trace_id,
        "outcome": event.outcome,
        "safeErrorCode": event.safe_error_code,
        "metadata": _metadata_dict(event),
        "createdAt": iso_utc(event.created_at),
    }


def _encode_cursor(event: AuditEvent) -> str:
    payload = json.dumps({"createdAt": iso_utc(event.created_at), "id": event.id}, separators=(",", ":"))
    return base64.urlsafe_b64encode(payload.encode("utf-8")).decode("ascii").rstrip("=")


def _decode_cursor(cursor: str) -> tuple[datetime, str]:
    try:
        padded = cursor + ("=" * (-len(cursor) % 4))
        payload = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
        created_at = payload["createdAt"]
        event_id = payload["id"]
        if not isinstance(created_at, str) or not isinstance(event_id, str):
            raise ValueError
        parsed = datetime.fromisoformat(created_at.removesuffix("Z"))
    except Exception as exc:
        raise AuditValidationError() from exc
    return parsed, event_id


class AuditService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def record(
        self,
        event_name: str,
        *,
        context: AuditContext | None = None,
        actor_user: User | None = None,
        actor_kind: str | None = None,
        target_kind: str | None = None,
        target_id: str | None = None,
        request_id: str | None = None,
        trace_id: str | None = None,
        outcome: str = AUDIT_OUTCOME_SUCCEEDED,
        safe_error_code: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditEvent:
        context = context or AuditContext()
        resolved_actor_user = actor_user if actor_user is not None else context.actor_user
        resolved_actor_kind = actor_kind or context.actor_kind or actor_kind_for_user(resolved_actor_user)
        resolved_request_id = request_id if request_id is not None else context.request_id
        resolved_trace_id = trace_id if trace_id is not None else context.trace_id
        if event_name not in AUDIT_EVENT_NAMES or resolved_actor_kind not in AUDIT_ACTOR_KINDS or outcome not in AUDIT_OUTCOMES:
            raise AuditError()
        try:
            event = AuditEvent(
                id=str(uuid.uuid4()),
                event_name=event_name,
                actor_kind=resolved_actor_kind,
                actor_user_id=resolved_actor_user.id if resolved_actor_user is not None else None,
                target_kind=_validate_string(target_kind, max_length=40) if target_kind else None,
                target_id=_validate_string(target_id, max_length=128) if target_id else None,
                request_id=_validate_string(resolved_request_id, max_length=80) if resolved_request_id else None,
                trace_id=_validate_string(resolved_trace_id, max_length=80) if resolved_trace_id else None,
                outcome=outcome,
                safe_error_code=_validate_string(safe_error_code, max_length=64) if safe_error_code else None,
                metadata_json=_validated_metadata(metadata),
                created_at=utc_now(),
            )
            self._db.add(event)
            self._db.flush()
        except (AuditError, SQLAlchemyError):
            self._db.rollback()
            raise AuditError()
        return event

    def list_events(
        self,
        *,
        limit: int = 50,
        cursor: str | None = None,
        event_name: str | None = None,
        actor_kind: str | None = None,
        target_kind: str | None = None,
        target_id: str | None = None,
        request_id: str | None = None,
        trace_id: str | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        include_self_reads: bool = False,
    ) -> AuditEventPage:
        if limit < 1 or limit > 100:
            raise AuditValidationError()
        if event_name is not None and event_name not in AUDIT_EVENT_NAMES:
            raise AuditValidationError()
        if actor_kind is not None and actor_kind not in AUDIT_ACTOR_KINDS:
            raise AuditValidationError()
        filters = []
        if event_name is not None:
            filters.append(AuditEvent.event_name == event_name)
        elif not include_self_reads:
            filters.append(AuditEvent.event_name != AUDIT_EVENT_AUDIT_EVENTS_READ)
        if actor_kind is not None:
            filters.append(AuditEvent.actor_kind == actor_kind)
        if target_kind is not None:
            filters.append(AuditEvent.target_kind == target_kind)
        if target_id is not None:
            filters.append(AuditEvent.target_id == target_id)
        if request_id is not None:
            filters.append(AuditEvent.request_id == request_id)
        if trace_id is not None:
            filters.append(AuditEvent.trace_id == trace_id)
        if created_from is not None:
            filters.append(AuditEvent.created_at >= created_from)
        if created_to is not None:
            filters.append(AuditEvent.created_at <= created_to)
        if cursor is not None:
            cursor_created_at, cursor_id = _decode_cursor(cursor)
            filters.append(
                or_(
                    AuditEvent.created_at < cursor_created_at,
                    and_(AuditEvent.created_at == cursor_created_at, AuditEvent.id < cursor_id),
                )
            )
        try:
            statement = select(AuditEvent).order_by(AuditEvent.created_at.desc(), AuditEvent.id.desc()).limit(limit + 1)
            if filters:
                statement = statement.where(*filters)
            rows = list(self._db.scalars(statement))
        except SQLAlchemyError as exc:
            self._db.rollback()
            raise AuditError() from exc
        next_cursor = _encode_cursor(rows[-1]) if len(rows) > limit else None
        return AuditEventPage(events=rows[:limit], next_cursor=next_cursor)
