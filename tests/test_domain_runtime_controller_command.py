from __future__ import annotations

import json
from pathlib import Path

import pytest

from context_engine.tools import domain_runtime_controller as controller


class _Result:
    def __init__(self, returncode: int = 0, stdout: str = "") -> None:
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = ""


def _payload(tmp_path: Path) -> dict[str, str]:
    runtime_dir = tmp_path / "domains" / "commanded" / "11111111-1111-4111-8111-111111111111"
    return {
        "action": "start",
        "domainId": "commanded",
        "runtimeInstanceId": "11111111-1111-4111-8111-111111111111",
        "runtimeName": "ce_domain_commanded_11111111-111",
        "runtimeDir": str(runtime_dir),
    }


def test_domain_runtime_controller_command_rejects_unsafe_runtime_dir(tmp_path: Path) -> None:
    payload = _payload(tmp_path)
    payload["runtimeDir"] = str(tmp_path / "wrong")

    with pytest.raises(controller.ControllerCommandError):
        controller.handle_action("start", payload)


def test_domain_runtime_controller_command_invokes_private_docker_lifecycle(monkeypatch, tmp_path: Path) -> None:
    payload = _payload(tmp_path)
    state = {"exists": False, "running": False}
    calls: list[list[str]] = []

    def fake_run(args: list[str], *, check: bool = True):
        calls.append(args)
        if args == ["inspect", payload["runtimeName"]]:
            if not state["exists"]:
                return _Result(returncode=1)
            inspect_payload = [
                {
                    "Config": {
                        "Labels": {
                            controller.DOMAIN_LABEL: payload["domainId"],
                            controller.INSTANCE_LABEL: payload["runtimeInstanceId"],
                        }
                    },
                    "NetworkSettings": {"Ports": {}},
                    "State": {"Running": state["running"]},
                }
            ]
            return _Result(stdout=json.dumps(inspect_payload))
        if args[:1] == ["run"]:
            state["exists"] = True
            state["running"] = True
            return _Result(stdout="container-id")
        if args == ["stop", "--time", "10", payload["runtimeName"]]:
            state["running"] = False
            return _Result()
        if args == ["rm", "-f", payload["runtimeName"]]:
            state["exists"] = False
            state["running"] = False
            return _Result()
        raise AssertionError(args)

    monkeypatch.setattr(controller, "_run_docker", fake_run)

    provision_payload = {**payload, "action": "provision"}
    assert controller.handle_action("provision", provision_payload) == {}
    assert (Path(payload["runtimeDir"]) / "workspace").exists()

    health_payload = {**payload, "action": "health"}
    assert controller.handle_action("health", health_payload) == {"healthy": False}
    assert controller.handle_action("start", payload) == {}
    assert controller.handle_action("health", health_payload) == {"healthy": True}

    run_call = next(call for call in calls if call[:1] == ["run"])
    assert "--network" in run_call
    assert "none" in run_call
    assert not any(arg.startswith("-p") or arg == "--publish" for arg in run_call)

    stop_payload = {**payload, "action": "stop"}
    assert controller.handle_action("stop", stop_payload) == {}
    assert controller.handle_action("health", health_payload) == {"healthy": False}

    delete_payload = {**payload, "action": "delete"}
    assert controller.handle_action("delete", delete_payload) == {}
    assert not Path(payload["runtimeDir"]).exists()
