FROM python:3.12-slim AS runtime

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml README.md alembic.ini ./
COPY context_engine ./context_engine
COPY migrations ./migrations
COPY vendor ./vendor

RUN python -m pip install --upgrade pip \
    && python -m pip install .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "context_engine.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
