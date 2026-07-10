#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.stack.local}"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
BACKEND_PORT_EXPLICIT="${BACKEND_PORT-}"
FRONTEND_PORT_EXPLICIT="${FRONTEND_PORT-}"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3002}"
FRONTEND_MODE="${FRONTEND_MODE:-dev}"
if [[ -n "${CONTEXT_ENGINE_API_BASE:-}" ]]; then
  CONTEXT_ENGINE_API_BASE_SET=1
fi
CONTEXT_ENGINE_API_BASE="${CONTEXT_ENGINE_API_BASE:-http://$BACKEND_HOST:$BACKEND_PORT}"

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [[ -z "$line" || "$line" != *"="* ]] && continue
    local key="${line%%=*}"
    local value="${line#*=}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    if [[ -z "${!key:-}" ]]; then
      export "$key=$value"
    fi
  done < "$file"
}

is_placeholder_value() {
  local value="$1"
  [[ -z "$value" || "$value" == "<set locally>" || "$value" == "<set-locally>" ]]
}

port_listener_pid() {
  local port="$1"
  ss -tlnp 2>/dev/null | awk -v port=":${port}" '$4 ~ port { if (match($0, /pid=([0-9]+)/, m)) { print m[1]; exit } }'
}

port_in_use() {
  local port="$1"
  [[ -n "$(port_listener_pid "$port" || true)" ]]
}

resolve_dev_port() {
  local name="$1"
  local preferred="$2"
  local explicit="$3"
  local port="$preferred"
  local attempts=0
  local max_attempts=20

  if [[ -n "$explicit" ]]; then
    if port_in_use "$port"; then
      echo "Port ${port} is already in use (${name})." >&2
      ps -fp "$(port_listener_pid "$port")" 2>/dev/null || true
      echo "Stop that process or choose another port, for example:" >&2
      echo "  BACKEND_PORT=8001 FRONTEND_PORT=3003 bash scripts/dev.sh" >&2
      exit 1
    fi
    printf '%s' "$port"
    return
  fi

  while port_in_use "$port" && ((attempts < max_attempts)); do
    if ((attempts == 0)); then
      echo "Port ${preferred} is in use (${name}); trying alternatives..." >&2
    fi
    port=$((port + 1))
    attempts=$((attempts + 1))
  done

  if port_in_use "$port"; then
    echo "Could not find a free ${name} port near ${preferred}." >&2
    exit 1
  fi

  if [[ "$port" != "$preferred" ]]; then
    echo "Using ${name} port ${port} (default ${preferred} was busy)." >&2
  fi
  printf '%s' "$port"
}

configure_runtime_env() {
  load_env_file "$ENV_FILE"

  local required=(
    POSTGRES_DB
    POSTGRES_USER
    POSTGRES_PASSWORD
    CE_ADMIN_USERNAME
    CE_ADMIN_PASSWORD
    CONFIG_ENCRYPTION_KEY
  )
  local missing=()
  local placeholder=()
  local key value

  for key in "${required[@]}"; do
    value="${!key:-}"
    if is_placeholder_value "$value"; then
      placeholder+=("$key")
    elif [[ -z "$value" ]]; then
      missing+=("$key")
    fi
  done

  if ((${#placeholder[@]} > 0 || ${#missing[@]} > 0)); then
    echo "Incomplete local environment in ${ENV_FILE}."
    if ((${#placeholder[@]} > 0)); then
      echo "Replace placeholder values for: ${placeholder[*]}"
    fi
    if ((${#missing[@]} > 0)); then
      echo "Set missing values for: ${missing[*]}"
    fi
    echo "Start from .env.stack.example, then set real local values."
    echo "For host-native dev against a published Postgres container, also set POSTGRES_PORT (for example 5438)."
    exit 1
  fi

  if ! "$PYTHON_BIN" -c "from cryptography.fernet import Fernet; Fernet('${CONFIG_ENCRYPTION_KEY}'.encode('utf-8'))" 2>/dev/null; then
    echo "CONFIG_ENCRYPTION_KEY in ${ENV_FILE} is not a valid Fernet key."
    echo "Generate one with:"
    echo "  python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
    exit 1
  fi

  if [[ -z "${CONTEXT_ENGINE_DATABASE_URL:-}" ]]; then
    POSTGRES_HOST="${POSTGRES_HOST:-127.0.0.1}"
    POSTGRES_PORT="${POSTGRES_PORT:-5432}"
    export CONTEXT_ENGINE_DATABASE_URL="postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
  fi

  export CE_SESSION_COOKIE_SECURE="${CE_SESSION_COOKIE_SECURE:-false}"
}

sync_api_base() {
  if [[ -z "${CONTEXT_ENGINE_API_BASE_SET:-}" ]]; then
    export CONTEXT_ENGINE_API_BASE="http://$BACKEND_HOST:$BACKEND_PORT"
  fi
}

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Missing Python venv at $PYTHON_BIN"
  echo "Run: python3 -m venv .venv && .venv/bin/python -m pip install -e '.[test]'"
  exit 1
fi

if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  echo "Missing frontend dependencies."
  echo "Run: cd frontend && npm ci"
  exit 1
fi

configure_runtime_env

BACKEND_PORT="$(resolve_dev_port "backend" "$BACKEND_PORT" "$BACKEND_PORT_EXPLICIT")"
FRONTEND_PORT="$(resolve_dev_port "frontend" "$FRONTEND_PORT" "$FRONTEND_PORT_EXPLICIT")"
sync_api_base

echo "Migrating database..."
(cd "$ROOT_DIR" && "$PYTHON_BIN" -m alembic upgrade head)

echo "Starting backend on http://$BACKEND_HOST:$BACKEND_PORT"
(cd "$ROOT_DIR" && "$PYTHON_BIN" -m uvicorn context_engine.app:create_app --factory --reload --reload-dir context_engine --reload-dir migrations --host "$BACKEND_HOST" --port "$BACKEND_PORT") &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:$FRONTEND_PORT"
if [[ "$FRONTEND_MODE" == "prod" ]]; then
  (
    cd "$ROOT_DIR/frontend"
    npm run build
    CONTEXT_ENGINE_API_BASE="$CONTEXT_ENGINE_API_BASE" npx next start -H 0.0.0.0 -p "$FRONTEND_PORT"
  ) &
else
  (
    cd "$ROOT_DIR/frontend"
    WATCHPACK_POLLING="${WATCHPACK_POLLING:-true}" \
    CHOKIDAR_USEPOLLING="${CHOKIDAR_USEPOLLING:-true}" \
    CONTEXT_ENGINE_API_BASE="$CONTEXT_ENGINE_API_BASE" npm run dev -- --webpack -p "$FRONTEND_PORT"
  ) &
fi
FRONTEND_PID=$!

echo
echo "Backend:  http://$BACKEND_HOST:$BACKEND_PORT"
echo "Frontend: http://localhost:$FRONTEND_PORT/chat"
echo "Stop both with Ctrl+C."
echo

wait -n "$BACKEND_PID" "$FRONTEND_PID"
