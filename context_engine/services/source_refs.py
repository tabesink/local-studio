from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from context_engine.config import Settings
from context_engine.models import (
    SOURCE_STATE_DELETING,
    Conversation,
    ConversationTurn,
    ConversationTurnEvidenceRef,
    SourceBlock,
    SourceDocument,
    User,
)
from context_engine.services.sources import SourceError, require_available_domain_for_member_sources


class SourceRefError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


def _unavailable() -> SourceRefError:
    return SourceRefError(404, "source_ref_unavailable", "Source reference is unavailable.")


def resolve_evidence_source_ref(
    db: Session,
    *,
    settings: Settings,
    owner: User,
    evidence_ref_id: str,
) -> dict[str, Any]:
    """Resolve a public evidence ref id to Library-safe navigation metadata."""
    evidence_ref = db.scalar(
        select(ConversationTurnEvidenceRef)
        .join(ConversationTurn, ConversationTurnEvidenceRef.turn_id == ConversationTurn.id)
        .join(Conversation, ConversationTurn.conversation_id == Conversation.id)
        .where(
            ConversationTurnEvidenceRef.id == evidence_ref_id,
            Conversation.owner_user_id == owner.id,
        )
    )
    if evidence_ref is None or evidence_ref.redacted_at is not None:
        raise _unavailable()

    source = db.get(SourceDocument, evidence_ref.source_document_id)
    if source is None or source.state == SOURCE_STATE_DELETING:
        raise _unavailable()

    turn = db.get(ConversationTurn, evidence_ref.turn_id)
    if turn is None or turn.domain_id is None or turn.domain_id != source.domain_id:
        raise _unavailable()

    try:
        require_available_domain_for_member_sources(db, settings=settings, domain_id=source.domain_id)
    except SourceError as exc:
        if exc.code == "domain_state_conflict":
            raise SourceRefError(409, "domain_state_conflict", exc.message) from exc
        raise _unavailable() from exc

    page: int | None = None
    block = db.get(SourceBlock, evidence_ref.source_block_id)
    if (
        block is not None
        and block.source_document_id == source.id
        and block.domain_id == source.domain_id
        and block.page_start is not None
    ):
        page = block.page_start

    payload: dict[str, Any] = {
        "domainId": source.domain_id,
        "sourceId": source.id,
        "page": page,
    }
    if evidence_ref.source_label:
        payload["sourceLabel"] = evidence_ref.source_label
    return payload
