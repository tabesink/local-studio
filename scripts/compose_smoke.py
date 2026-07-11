from __future__ import annotations

from pilot_gate import run_compose_replacement_smoke, run_with_tempdir


if __name__ == "__main__":
    raise SystemExit(run_with_tempdir(run_compose_replacement_smoke))
