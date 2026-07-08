from __future__ import annotations

from datetime import datetime
from email.parser import BytesParser
from email.policy import default as email_policy
from typing import Literal

from fastapi import APIRouter, Body, Depends, Path, Query, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from context_engine.api.dependencies import CurrentSession, get_db, get_settings, require_admin, require_current_session
from context_engine.api.errors import ApiError, request_id_from
from context_engine.config import Settings
from context_engine.models import (
    AUDIT_ACTOR_KINDS,
    AUDIT_EVENT_AUDIT_EVENTS_READ,
    AUDIT_EVENT_DIAGNOSTICS_READ,
    AUDIT_EVENT_NAMES,
    AUDIT_OUTCOME_FAILED,
    User,
)
from context_engine.services.audit import AuditContext, AuditService, AuditValidationError, safe_audit_event
from context_engine.services.auth import (
    authenticate_user,
    create_auth_session,
    iso_utc,
    revoke_session_token,
    safe_user,
)
from context_engine.services.chat_turns import (
    ChatTurnError,
    encode_sse_event,
    stream_turn_events,
    conversation_turn_summaries,
)
from context_engine.services.composer_refs import (
    ComposerRefError,
    MAX_COMPOSER_REFS,
    MAX_DISCOVERY_LIMIT,
    discover_composer_refs,
)
from context_engine.services.conversations import (
    ConversationError,
    create_conversation,
    delete_conversation,
    get_owned_conversation,
    list_conversations,
    safe_conversation_summary,
    update_conversation_title,
)
from context_engine.services.wiki import (
    WikiError,
    admin_get_wiki_contribution,
    admin_list_wiki_contributions,
    create_wiki_contribution,
    get_wiki_contribution,
    get_wiki_page_detail,
    list_wiki_page_revisions,
    list_wiki_pages,
    list_wiki_contributions,
    publish_wiki_contribution,
    reject_wiki_contribution,
    safe_wiki_contribution,
    safe_wiki_page,
    safe_wiki_revision,
    submit_wiki_contribution,
    update_wiki_contribution,
)
from context_engine.services.runtime_config import (
    RuntimeConfigError,
    SecretCrypto,
    create_model_profile,
    delete_model_profile,
    rotate_provider_credential,
    runtime_settings_snapshot,
    safe_model_profile,
    safe_provider,
    safe_runtime_settings,
    update_model_profile,
    update_runtime_settings,
)
from context_engine.services.domains import (
    DOMAIN_ID_PATTERN,
    DomainError,
    admin_domain_list,
    create_domain,
    domain_detail,
    domain_operations,
    domain_status,
    enqueue_delete_domain,
    member_domain_list,
    safe_domain_admin,
    safe_domain_operation,
    start_domain,
    stop_domain,
    controller_from_settings,
)
from context_engine.services.diagnostics import (
    DiagnosticsError,
    read_lightrag_diagnostics,
    safe_lightrag_diagnostics,
)
from context_engine.services.evidence import EvidenceRetrievalError, retrieve_scoped_evidence
from context_engine.services.indexing import SourceIndexError, cancel_source_index, retry_source_index
from context_engine.services.sources import (
    MAX_SOURCE_FILE_SIZE_BYTES,
    SourceError,
    cancel_source,
    delete_source,
    list_sources,
    retry_source,
    safe_source,
    safe_source_operation,
    source_detail,
    source_operations,
    source_outline,
    upload_source_bytes,
)


class LoginRequest(BaseModel):
    username: str
    password: str

    model_config = ConfigDict(extra="forbid")


class ProviderCredentialRequest(BaseModel):
    credential: str = Field(min_length=1, max_length=20000)

    model_config = ConfigDict(extra="forbid")


class ModelProfileCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    profile_kind: str = Field(alias="profileKind")
    provider_kind: str = Field(alias="providerKind")
    model_name: str = Field(alias="modelName", min_length=1, max_length=200)
    vector_dimensions: int | None = Field(default=None, alias="vectorDimensions", gt=0)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class ModelProfilePatchRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    model_name: str | None = Field(default=None, alias="modelName", min_length=1, max_length=200)
    vector_dimensions: int | None = Field(default=None, alias="vectorDimensions", gt=0)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class RuntimeSettingsPatchRequest(BaseModel):
    active_synthesis_profile_id: str | None = Field(default=None, alias="activeSynthesisProfileId")
    active_parser_kind: str | None = Field(default=None, alias="activeParserKind")

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class DomainCreateRequest(BaseModel):
    id: str = Field(pattern=DOMAIN_ID_PATTERN)
    display_name: str | None = Field(default=None, alias="displayName", min_length=1, max_length=120)
    embedding_profile_id: str = Field(alias="embeddingProfileId", min_length=1, max_length=36)

    model_config = ConfigDict(extra="forbid")


class EvidenceRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)

    model_config = ConfigDict(extra="forbid")

    @field_validator("question")
    @classmethod
    def strip_question(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Question is required.")
        return stripped


class ComposerRefDiscoverRequest(BaseModel):
    conversation_id: str | None = Field(default=None, alias="conversationId", max_length=36)
    domain_id: str | None = Field(default=None, alias="domainId", max_length=64)
    kinds: list[Literal["source", "evidence", "wiki", "template"]] | None = Field(default=None, max_length=4)
    query: str | None = Field(default=None, max_length=200)
    limit: int = Field(default=MAX_COMPOSER_REFS, ge=1, le=MAX_DISCOVERY_LIMIT)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    @field_validator("query")
    @classmethod
    def strip_query(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class ConversationTitleRequest(BaseModel):
    title: str | None = None

    model_config = ConfigDict(extra="forbid")


class WikiContributionCreateRequest(BaseModel):
    target_page_id: str | None = Field(default=None, alias="targetPageId", max_length=36)
    title: str = Field(min_length=1, max_length=160)
    body: str = Field(min_length=1, max_length=20000)
    evidence_ref_ids: list[str] = Field(default_factory=list, alias="evidenceRefIds", max_length=50)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class WikiContributionPatchRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    body: str | None = Field(default=None, min_length=1, max_length=20000)
    evidence_ref_ids: list[str] | None = Field(default=None, alias="evidenceRefIds", max_length=50)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class WikiContributionRejectRequest(BaseModel):
    reviewer_note: str | None = Field(default=None, alias="reviewerNote", max_length=500)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class TurnStreamRequest(BaseModel):
    client_request_id: str = Field(alias="clientRequestId", min_length=1, max_length=80)
    message: str = Field(min_length=1, max_length=4000)
    domain_id: str | None = Field(default=None, alias="domainId", max_length=64)
    composer_ref_tokens: list[str] = Field(default_factory=list, alias="composerRefTokens", max_length=MAX_COMPOSER_REFS)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class EvidenceItemResponse(BaseModel):
    excerpt: str = Field(max_length=500)
    source_label: str = Field(alias="sourceLabel", max_length=255)

    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class EvidenceResponse(BaseModel):
    result: Literal["evidence_found", "no_grounded_context"]
    evidence: list[EvidenceItemResponse]

    model_config = ConfigDict(extra="forbid")


api_router = APIRouter()
health_router = APIRouter()


@health_router.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok"}


@health_router.get("/health/ready")
def ready(db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise ApiError(503, "service_unavailable", "Service unavailable.") from exc
    return {"status": "ok"}


@api_router.post("/auth/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    user = authenticate_user(db, payload.username, payload.password)
    if user is None:
        raise ApiError(401, "invalid_credentials", "Invalid username or password.")

    token, auth_session = create_auth_session(db, user, settings)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_ttl_seconds,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )
    return {"user": safe_user(user), "session": {"expiresAt": iso_utc(auth_session.expires_at)}}


@api_router.get("/auth/me")
def me(current: CurrentSession = Depends(require_current_session)) -> dict[str, object]:
    return {"user": safe_user(current.user), "session": {"expiresAt": iso_utc(current.auth_session.expires_at)}}


@api_router.post("/auth/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, bool]:
    token = request.cookies.get(settings.session_cookie_name)
    if token:
        revoke_session_token(db, token)
    response.set_cookie(
        key=settings.session_cookie_name,
        value="",
        max_age=0,
        expires=0,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )
    return {"ok": True}


@api_router.get("/admin/users")
def admin_users(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    users = list(db.scalars(select(User).order_by(User.username)))
    return {"users": [safe_user(user) for user in users]}


def _runtime_config_api_error(exc: RuntimeConfigError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _domain_api_error(exc: DomainError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _source_api_error(exc: SourceError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _source_index_api_error(exc: SourceIndexError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _evidence_api_error(exc: EvidenceRetrievalError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _conversation_api_error(exc: ConversationError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _wiki_api_error(exc: WikiError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _composer_ref_api_error(exc: ComposerRefError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _chat_turn_api_error(exc: ChatTurnError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _audit_context(request: Request, user: User) -> AuditContext:
    return AuditContext(actor_user=user, request_id=request_id_from(request))


def _audit_validation_api_error(exc: AuditValidationError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _diagnostics_api_error(exc: DiagnosticsError) -> ApiError:
    return ApiError(exc.status_code, exc.code, exc.message)


def _parse_optional_iso(value: str | None) -> datetime | None:
    if value is None:
        return None
    try:
        return datetime.fromisoformat(value.removesuffix("Z"))
    except ValueError as exc:
        raise ApiError(422, "validation_error", "Request validation failed.") from exc


def _multipart_file_from_request(request: Request, body: bytes) -> tuple[str | None, str | None, bytes]:
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type.lower():
        raise ApiError(422, "validation_error", "Request validation failed.")
    header = f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8")
    message = BytesParser(policy=email_policy).parsebytes(header + body)
    if not message.is_multipart():
        raise ApiError(422, "validation_error", "Request validation failed.")
    for part in message.iter_parts():
        disposition = part.get("content-disposition", "")
        if part.get_param("name", header="content-disposition") == "file" and "form-data" in disposition:
            payload = part.get_payload(decode=True)
            if payload is None:
                raise ApiError(422, "validation_error", "Request validation failed.")
            return part.get_filename(), part.get_content_type(), payload
    raise ApiError(422, "validation_error", "Request validation failed.")


@api_router.post("/composer-refs:discover")
def post_composer_refs_discover(
    payload: ComposerRefDiscoverRequest,
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        refs = discover_composer_refs(
            db,
            settings=settings,
            owner=current.user,
            conversation_id=payload.conversation_id,
            domain_id=payload.domain_id,
            kinds=payload.kinds,
            query=payload.query,
            limit=payload.limit,
        )
    except ComposerRefError as exc:
        raise _composer_ref_api_error(exc) from exc
    return {"refs": refs}


@api_router.get("/conversations")
def get_conversations(
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return {"conversations": list_conversations(db, owner=current.user)}


@api_router.post("/conversations", status_code=201)
def post_conversation(
    payload: ConversationTitleRequest | None = Body(default=None),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        conversation = create_conversation(db, owner=current.user, title=payload.title if payload else None)
    except ConversationError as exc:
        raise _conversation_api_error(exc) from exc
    return {"conversation": safe_conversation_summary(conversation)}


@api_router.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str = Path(min_length=1, max_length=36),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        conversation = get_owned_conversation(db, owner=current.user, conversation_id=conversation_id)
    except ConversationError as exc:
        raise _conversation_api_error(exc) from exc
    return {"conversation": safe_conversation_summary(conversation), "turns": conversation_turn_summaries(db, conversation)}


@api_router.patch("/conversations/{conversation_id}")
def patch_conversation(
    payload: ConversationTitleRequest,
    conversation_id: str = Path(min_length=1, max_length=36),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        conversation = update_conversation_title(
            db,
            owner=current.user,
            conversation_id=conversation_id,
            title=payload.title,
        )
    except ConversationError as exc:
        raise _conversation_api_error(exc) from exc
    return {"conversation": safe_conversation_summary(conversation)}


@api_router.delete("/conversations/{conversation_id}", status_code=204)
def remove_conversation(
    conversation_id: str = Path(min_length=1, max_length=36),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> Response:
    try:
        delete_conversation(db, owner=current.user, conversation_id=conversation_id)
    except ConversationError as exc:
        raise _conversation_api_error(exc) from exc
    return Response(status_code=204)


@api_router.get("/wiki/pages")
def get_wiki_pages(
    _: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return {"pages": list_wiki_pages(db)}


@api_router.get("/wiki/pages/{page_id}/revisions")
def get_wiki_page_revisions(
    page_id: str = Path(min_length=1, max_length=36),
    _: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        revisions = list_wiki_page_revisions(db, page_id)
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {"revisions": revisions}


@api_router.get("/wiki/pages/{page_id}")
def get_wiki_page(
    page_id: str = Path(min_length=1, max_length=36),
    _: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        return get_wiki_page_detail(db, page_id)
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc


@api_router.get("/wiki/contributions")
def get_wiki_contributions(
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return {"contributions": list_wiki_contributions(db, user=current.user)}


@api_router.post("/wiki/contributions", status_code=201)
def post_wiki_contribution(
    payload: WikiContributionCreateRequest,
    request: Request,
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        contribution = create_wiki_contribution(
            db,
            user=current.user,
            target_page_id=payload.target_page_id,
            title=payload.title,
            body=payload.body,
            evidence_ref_ids=payload.evidence_ref_ids,
            audit_context=_audit_context(request, current.user),
        )
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {"contribution": safe_wiki_contribution(contribution)}


@api_router.post("/wiki/contributions/{contribution_id}:submit")
def submit_wiki_contribution_route(
    request: Request,
    contribution_id: str = Path(min_length=1, max_length=36),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        contribution = submit_wiki_contribution(
            db,
            user=current.user,
            contribution_id=contribution_id,
            audit_context=_audit_context(request, current.user),
        )
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {"contribution": safe_wiki_contribution(contribution)}


@api_router.get("/wiki/contributions/{contribution_id}")
def get_wiki_contribution_route(
    contribution_id: str = Path(min_length=1, max_length=36),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        contribution = get_wiki_contribution(db, user=current.user, contribution_id=contribution_id)
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {"contribution": safe_wiki_contribution(contribution)}


@api_router.patch("/wiki/contributions/{contribution_id}")
def patch_wiki_contribution(
    payload: WikiContributionPatchRequest,
    request: Request,
    contribution_id: str = Path(min_length=1, max_length=36),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        contribution = update_wiki_contribution(
            db,
            user=current.user,
            contribution_id=contribution_id,
            title=payload.title,
            body=payload.body,
            evidence_ref_ids=payload.evidence_ref_ids,
            audit_context=_audit_context(request, current.user),
        )
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {"contribution": safe_wiki_contribution(contribution)}


@api_router.get("/admin/wiki/contributions")
def get_admin_wiki_contributions(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return {"contributions": admin_list_wiki_contributions(db)}


@api_router.post("/admin/wiki/contributions/{contribution_id}:publish")
def publish_admin_wiki_contribution(
    request: Request,
    contribution_id: str = Path(min_length=1, max_length=36),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        page, revision, contribution = publish_wiki_contribution(
            db,
            admin=admin,
            contribution_id=contribution_id,
            audit_context=_audit_context(request, admin),
        )
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {
        "page": safe_wiki_page(page),
        "revision": safe_wiki_revision(revision),
        "contribution": safe_wiki_contribution(contribution),
    }


@api_router.post("/admin/wiki/contributions/{contribution_id}:reject")
def reject_admin_wiki_contribution(
    request: Request,
    contribution_id: str = Path(min_length=1, max_length=36),
    payload: WikiContributionRejectRequest | None = Body(default=None),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        contribution = reject_wiki_contribution(
            db,
            admin=admin,
            contribution_id=contribution_id,
            reviewer_note=payload.reviewer_note if payload is not None else None,
            audit_context=_audit_context(request, admin),
        )
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {"contribution": safe_wiki_contribution(contribution)}


@api_router.get("/admin/wiki/contributions/{contribution_id}")
def get_admin_wiki_contribution(
    contribution_id: str = Path(min_length=1, max_length=36),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        contribution = admin_get_wiki_contribution(db, contribution_id=contribution_id)
    except WikiError as exc:
        raise _wiki_api_error(exc) from exc
    return {"contribution": safe_wiki_contribution(contribution)}


def _streaming_sse_response(first_event, remaining_events) -> StreamingResponse:
    def body():
        try:
            yield encode_sse_event(first_event)
            for event in remaining_events:
                yield encode_sse_event(event)
        finally:
            close = getattr(remaining_events, "close", None)
            if close is not None:
                close()

    return StreamingResponse(body(), media_type="text/event-stream")


@api_router.post("/conversations/{conversation_id}/turns:stream")
def post_conversation_turn_stream(
    payload: TurnStreamRequest,
    request: Request,
    conversation_id: str = Path(min_length=1, max_length=36),
    current: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> StreamingResponse:
    events = stream_turn_events(
        db,
        settings=settings,
        owner=current.user,
        conversation_id=conversation_id,
        client_request_id=payload.client_request_id,
        message=payload.message,
        domain_id=payload.domain_id,
        composer_ref_tokens=payload.composer_ref_tokens,
        request_id=request_id_from(request),
        synthesis_adapter=getattr(request.app.state, "synthesis_stream_adapter", None),
        retrieval_port=getattr(request.app.state, "retrieval_port", None),
    )
    try:
        first_event = next(events)
    except ConversationError as exc:
        raise _conversation_api_error(exc) from exc
    except ChatTurnError as exc:
        raise _chat_turn_api_error(exc) from exc
    except StopIteration as exc:  # pragma: no cover - defensive guard for a broken projector
        raise ApiError(500, "internal_error", "Internal server error.") from exc
    return _streaming_sse_response(first_event, events)


@api_router.get("/admin/runtime-settings")
def admin_runtime_settings(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return runtime_settings_snapshot(db)


@api_router.get("/admin/audit-events")
def admin_audit_events(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
    cursor: str | None = Query(default=None),
    event_name: str | None = Query(default=None, alias="eventName"),
    actor_kind: str | None = Query(default=None, alias="actorKind"),
    target_kind: str | None = Query(default=None, alias="targetKind"),
    target_id: str | None = Query(default=None, alias="targetId"),
    request_id: str | None = Query(default=None, alias="requestId"),
    trace_id: str | None = Query(default=None, alias="traceId"),
    created_from: str | None = Query(default=None, alias="createdFrom"),
    created_to: str | None = Query(default=None, alias="createdTo"),
    include_self_reads: bool = Query(default=False, alias="includeSelfReads"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    if event_name is not None and event_name not in AUDIT_EVENT_NAMES:
        raise ApiError(422, "validation_error", "Request validation failed.")
    if actor_kind is not None and actor_kind not in AUDIT_ACTOR_KINDS:
        raise ApiError(422, "validation_error", "Request validation failed.")
    service = AuditService(db)
    service.record(
        AUDIT_EVENT_AUDIT_EVENTS_READ,
        context=_audit_context(request, admin),
        metadata={"limit": limit},
    )
    db.commit()
    try:
        page = service.list_events(
            limit=limit,
            cursor=cursor,
            event_name=event_name,
            actor_kind=actor_kind,
            target_kind=target_kind,
            target_id=target_id,
            request_id=request_id,
            trace_id=trace_id,
            created_from=_parse_optional_iso(created_from),
            created_to=_parse_optional_iso(created_to),
            include_self_reads=include_self_reads,
        )
    except AuditValidationError as exc:
        raise _audit_validation_api_error(exc) from exc
    return {"auditEvents": [safe_audit_event(event) for event in page.events], "nextCursor": page.next_cursor}


@api_router.get("/admin/domains/{domain_id}/diagnostics/lightrag")
def admin_lightrag_diagnostics(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    tail: int = Query(default=100, ge=1, le=200),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    audit_context = _audit_context(request, admin)
    service = AuditService(db)
    try:
        diagnostics = read_lightrag_diagnostics(db, settings=settings, domain_id=domain_id, tail=tail)
    except DiagnosticsError as exc:
        service.record(
            AUDIT_EVENT_DIAGNOSTICS_READ,
            context=audit_context,
            target_kind="domain",
            target_id=domain_id,
            outcome=AUDIT_OUTCOME_FAILED,
            safe_error_code=exc.code,
            metadata={"diagnosticKind": "lightrag"},
        )
        db.commit()
        raise _diagnostics_api_error(exc) from exc
    service.record(
        AUDIT_EVENT_DIAGNOSTICS_READ,
        context=audit_context,
        target_kind="domain",
        target_id=domain_id,
        metadata={
            "diagnosticKind": "lightrag",
            "lineCount": diagnostics.line_count,
            "truncated": diagnostics.truncated,
        },
    )
    db.commit()
    return {"diagnostics": safe_lightrag_diagnostics(diagnostics)}


@api_router.put("/admin/runtime-settings/providers/{provider_kind}")
def admin_rotate_provider_credential(
    request: Request,
    provider_kind: str,
    payload: ProviderCredentialRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        provider = rotate_provider_credential(
            db,
            provider_kind,
            payload.credential,
            SecretCrypto.from_settings(settings),
            audit_context=_audit_context(request, admin),
        )
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"provider": safe_provider(provider)}


@api_router.post("/admin/runtime-settings/model-profiles", status_code=201)
def admin_create_model_profile(
    request: Request,
    payload: ModelProfileCreateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        profile = create_model_profile(
            db,
            name=payload.name,
            profile_kind=payload.profile_kind,
            provider_kind=payload.provider_kind,
            model_name=payload.model_name,
            vector_dimensions=payload.vector_dimensions,
            audit_context=_audit_context(request, admin),
        )
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"modelProfile": safe_model_profile(profile)}


@api_router.patch("/admin/runtime-settings/model-profiles/{profile_id}")
def admin_update_model_profile(
    request: Request,
    profile_id: str,
    payload: ModelProfilePatchRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        profile = update_model_profile(
            db,
            profile_id,
            payload.model_dump(exclude_unset=True),
            audit_context=_audit_context(request, admin),
        )
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"modelProfile": safe_model_profile(profile)}


@api_router.delete("/admin/runtime-settings/model-profiles/{profile_id}", status_code=204)
def admin_delete_model_profile(
    request: Request,
    profile_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    try:
        delete_model_profile(db, profile_id, audit_context=_audit_context(request, admin))
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return Response(status_code=204)


@api_router.patch("/admin/runtime-settings")
def admin_update_runtime_settings(
    request: Request,
    payload: RuntimeSettingsPatchRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        settings = update_runtime_settings(
            db,
            payload.model_dump(exclude_unset=True),
            audit_context=_audit_context(request, admin),
        )
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"runtimeSettings": safe_runtime_settings(settings)}


@api_router.post("/admin/domains", status_code=201)
def admin_create_domain(
    request: Request,
    payload: DomainCreateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        domain = create_domain(
            db,
            settings=settings,
            domain_id=payload.id,
            display_name=payload.display_name,
            embedding_profile_id=payload.embedding_profile_id,
            requested_by_user=admin,
            audit_context=_audit_context(request, admin),
        )
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    except DomainError as exc:
        raise _domain_api_error(exc) from exc
    return {"domain": safe_domain_admin(db, domain, controller_from_settings(settings))}


@api_router.get("/admin/domains")
def admin_list_domains(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    return {"domains": admin_domain_list(db, settings)}


@api_router.get("/admin/domains/{domain_id}")
def admin_get_domain(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        return {"domain": domain_detail(db, settings, domain_id)}
    except DomainError as exc:
        raise _domain_api_error(exc) from exc


@api_router.get("/admin/domains/{domain_id}/status")
def admin_get_domain_status(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        return domain_status(db, settings, domain_id)
    except DomainError as exc:
        raise _domain_api_error(exc) from exc


@api_router.post("/admin/domains/{domain_id}/start")
def admin_start_domain(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        domain = start_domain(
            db,
            settings=settings,
            domain_id=domain_id,
            requested_by_user=admin,
            audit_context=_audit_context(request, admin),
        )
    except DomainError as exc:
        raise _domain_api_error(exc) from exc
    return {"domain": safe_domain_admin(db, domain, controller_from_settings(settings))}


@api_router.post("/admin/domains/{domain_id}/stop")
def admin_stop_domain(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        domain = stop_domain(
            db,
            settings=settings,
            domain_id=domain_id,
            requested_by_user=admin,
            audit_context=_audit_context(request, admin),
        )
    except DomainError as exc:
        raise _domain_api_error(exc) from exc
    return {"domain": safe_domain_admin(db, domain, controller_from_settings(settings))}


@api_router.delete("/admin/domains/{domain_id}", status_code=202)
def admin_delete_domain(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        operation = enqueue_delete_domain(
            db,
            domain_id=domain_id,
            requested_by_user=admin,
            audit_context=_audit_context(request, admin),
        )
    except DomainError as exc:
        raise _domain_api_error(exc) from exc
    return {"operation": safe_domain_operation(operation)}


@api_router.get("/admin/domains/{domain_id}/operations")
def admin_domain_operations(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        return {"operations": domain_operations(db, domain_id)}
    except DomainError as exc:
        raise _domain_api_error(exc) from exc


@api_router.post(
    "/admin/domains/{domain_id}/sources",
    status_code=201,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": {
                        "type": "object",
                        "required": ["file"],
                        "properties": {"file": {"type": "string", "format": "binary"}},
                    }
                }
            },
        }
    },
)
async def admin_upload_source(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    filename, content_type, data = _multipart_file_from_request(request, await request.body())
    if len(data) > MAX_SOURCE_FILE_SIZE_BYTES:
        raise _source_api_error(SourceError(413, "source_file_too_large", "File is too large."))
    try:
        source, operation = upload_source_bytes(
            db,
            settings=settings,
            domain_id=domain_id,
            filename=filename,
            content_type=content_type,
            data=data,
            requested_by_user=admin,
            audit_context=_audit_context(request, admin),
        )
    except SourceError as exc:
        raise _source_api_error(exc) from exc
    return {"source": safe_source(db, source), "operation": safe_source_operation(operation)}


@api_router.get("/admin/domains/{domain_id}/sources")
def admin_list_sources(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        return {"sources": list_sources(db, domain_id)}
    except SourceError as exc:
        raise _source_api_error(exc) from exc


@api_router.get("/admin/domains/{domain_id}/sources/{source_id}")
def admin_get_source(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        return {"source": source_detail(db, domain_id, source_id)}
    except SourceError as exc:
        raise _source_api_error(exc) from exc


@api_router.get("/admin/domains/{domain_id}/sources/{source_id}/outline")
def admin_get_source_outline(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        return {"items": source_outline(db, domain_id, source_id)}
    except SourceError as exc:
        raise _source_api_error(exc) from exc


@api_router.get("/admin/domains/{domain_id}/sources/{source_id}/operations")
def admin_source_operations(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        return {"operations": source_operations(db, domain_id, source_id)}
    except SourceError as exc:
        raise _source_api_error(exc) from exc


@api_router.post("/admin/domains/{domain_id}/sources/{source_id}/index/retry", status_code=202)
def admin_retry_source_index(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        source = retry_source_index(
            db,
            settings=settings,
            domain_id=domain_id,
            source_id=source_id,
            audit_context=_audit_context(request, admin),
        )
    except SourceIndexError as exc:
        raise _source_index_api_error(exc) from exc
    return {"source": safe_source(db, source)}


@api_router.post("/admin/domains/{domain_id}/sources/{source_id}/index/cancel")
def admin_cancel_source_index(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        source = cancel_source_index(
            db,
            settings=settings,
            domain_id=domain_id,
            source_id=source_id,
            audit_context=_audit_context(request, admin),
        )
    except SourceIndexError as exc:
        raise _source_index_api_error(exc) from exc
    return {"source": safe_source(db, source)}


@api_router.post("/admin/domains/{domain_id}/sources/{source_id}/retry", status_code=202)
def admin_retry_source(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        operation = retry_source(
            db,
            domain_id=domain_id,
            source_id=source_id,
            requested_by_user=admin,
            audit_context=_audit_context(request, admin),
        )
    except SourceError as exc:
        raise _source_api_error(exc) from exc
    return {"operation": safe_source_operation(operation)}


@api_router.post("/admin/domains/{domain_id}/sources/{source_id}/cancel")
def admin_cancel_source(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        operation = cancel_source(
            db,
            domain_id=domain_id,
            source_id=source_id,
            audit_context=_audit_context(request, admin),
        )
    except SourceError as exc:
        raise _source_api_error(exc) from exc
    return {"operation": safe_source_operation(operation)}


@api_router.delete("/admin/domains/{domain_id}/sources/{source_id}", status_code=204)
def admin_delete_source(
    request: Request,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    source_id: str = Path(min_length=1, max_length=36),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    try:
        delete_source(
            db,
            settings=settings,
            domain_id=domain_id,
            source_id=source_id,
            audit_context=_audit_context(request, admin),
        )
    except SourceError as exc:
        raise _source_api_error(exc) from exc
    except SourceIndexError as exc:
        raise _source_index_api_error(exc) from exc
    return Response(status_code=204)


@api_router.post("/domains/{domain_id}/evidence", response_model=EvidenceResponse)
def retrieve_domain_evidence(
    payload: EvidenceRequest,
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    _: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        return retrieve_scoped_evidence(db, settings=settings, domain_id=domain_id, question=payload.question)
    except EvidenceRetrievalError as exc:
        raise _evidence_api_error(exc) from exc


@api_router.get("/domains")
def list_available_domains(
    _: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    return {"domains": member_domain_list(db, settings)}
