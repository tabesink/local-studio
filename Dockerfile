FROM python:3.12-slim AS runtime

ARG CE_STACK_LIVE_IMAGE=0

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml README.md alembic.ini ./
COPY context_engine ./context_engine
COPY migrations ./migrations
COPY vendor ./vendor

# Default slim image: package only. Live overlay builds with CE_STACK_LIVE_IMAGE=1
# install Docker CLI + LightRAG runtime extras for native fidelity proofs.
RUN python -m pip install --upgrade pip \
    && if [ "$CE_STACK_LIVE_IMAGE" = "1" ]; then \
         apt-get update \
         && apt-get install -y --no-install-recommends ca-certificates curl \
         && install -m 0755 -d /etc/apt/keyrings \
         && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
         && chmod a+r /etc/apt/keyrings/docker.asc \
         && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
         && apt-get update \
         && apt-get install -y --no-install-recommends docker-ce-cli \
         && rm -rf /var/lib/apt/lists/* \
         && python -m pip install '.[lightrag-runtime]'; \
       else \
         python -m pip install .; \
       fi

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "context_engine.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
