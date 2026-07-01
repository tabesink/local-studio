from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Request, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from context_engine.api.dependencies import CurrentSession, get_db, get_settings, require_admin, require_current_session
from context_engine.api.errors import ApiError
from context_engine.config import Settings
from context_engine.models import User
from context_engine.services.auth import (
    authenticate_user,
    create_auth_session,
    iso_utc,
    revoke_session_token,
    safe_user,
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


@api_router.get("/admin/runtime-settings")
def admin_runtime_settings(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    return runtime_settings_snapshot(db)


@api_router.put("/admin/runtime-settings/providers/{provider_kind}")
def admin_rotate_provider_credential(
    provider_kind: str,
    payload: ProviderCredentialRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        provider = rotate_provider_credential(db, provider_kind, payload.credential, SecretCrypto.from_settings(settings))
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"provider": safe_provider(provider)}


@api_router.post("/admin/runtime-settings/model-profiles", status_code=201)
def admin_create_model_profile(
    payload: ModelProfileCreateRequest,
    _: User = Depends(require_admin),
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
        )
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"modelProfile": safe_model_profile(profile)}


@api_router.patch("/admin/runtime-settings/model-profiles/{profile_id}")
def admin_update_model_profile(
    profile_id: str,
    payload: ModelProfilePatchRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        profile = update_model_profile(db, profile_id, payload.model_dump(exclude_unset=True))
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"modelProfile": safe_model_profile(profile)}


@api_router.delete("/admin/runtime-settings/model-profiles/{profile_id}", status_code=204)
def admin_delete_model_profile(
    profile_id: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    try:
        delete_model_profile(db, profile_id)
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return Response(status_code=204)


@api_router.patch("/admin/runtime-settings")
def admin_update_runtime_settings(
    payload: RuntimeSettingsPatchRequest,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        settings = update_runtime_settings(db, payload.model_dump(exclude_unset=True))
    except RuntimeConfigError as exc:
        raise _runtime_config_api_error(exc) from exc
    return {"runtimeSettings": safe_runtime_settings(settings)}


@api_router.post("/admin/domains", status_code=201)
def admin_create_domain(
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
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        domain = start_domain(db, settings=settings, domain_id=domain_id, requested_by_user=admin)
    except DomainError as exc:
        raise _domain_api_error(exc) from exc
    return {"domain": safe_domain_admin(db, domain, controller_from_settings(settings))}


@api_router.post("/admin/domains/{domain_id}/stop")
def admin_stop_domain(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    try:
        domain = stop_domain(db, settings=settings, domain_id=domain_id, requested_by_user=admin)
    except DomainError as exc:
        raise _domain_api_error(exc) from exc
    return {"domain": safe_domain_admin(db, domain, controller_from_settings(settings))}


@api_router.delete("/admin/domains/{domain_id}", status_code=202)
def admin_delete_domain(
    domain_id: str = Path(pattern=DOMAIN_ID_PATTERN),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    try:
        operation = enqueue_delete_domain(db, domain_id=domain_id, requested_by_user=admin)
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


@api_router.get("/domains")
def list_available_domains(
    _: CurrentSession = Depends(require_current_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    return {"domains": member_domain_list(db, settings)}
