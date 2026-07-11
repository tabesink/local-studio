from __future__ import annotations

from pilot_gate import run_pilot_flow, run_with_tempdir


if __name__ == "__main__":
    raise SystemExit(run_with_tempdir(run_pilot_flow))
