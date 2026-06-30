from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from context_engine.api.errors import (
    ApiError,
    api_error_handler,
    http_error_handler,
    unhandled_error_handler,
    validation_error_handler,
)
from context_engine.api.routes import api_router, health_router
from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory
from context_engine.services.auth import seed_admin
from context_engine.services.runtime_config import seed_runtime_config, validate_config_encryption_key


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or Settings.from_env()
    validate_config_encryption_key(app_settings)
    engine = create_db_engine(app_settings)
    session_factory = create_session_factory(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.settings = app_settings
        app.state.engine = engine
        app.state.session_factory = session_factory
        db = session_factory()
        try:
            seed_admin(db, app_settings)
            seed_runtime_config(db)
        finally:
            db.close()
        try:
            yield
        finally:
            engine.dispose()

    app = FastAPI(title="Context Engine API", version="0.1.0", lifespan=lifespan)
    app.state.settings = app_settings
    app.state.engine = engine
    app.state.session_factory = session_factory

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get(app_settings.request_id_header) or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers[app_settings.request_id_header] = request_id
        return response

    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)

    app.include_router(health_router)
    app.include_router(api_router, prefix=app_settings.api_prefix)
    return app
