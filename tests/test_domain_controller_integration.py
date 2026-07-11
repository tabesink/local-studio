from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import pytest

from context_engine.config import Settings
from context_engine.db import utc_now
from context_engine.models import DOMAIN_STATE_STOPPED, Domain
from context_engine.services.domains import DockerDomainRuntimeController

pytestmark = pytest.mark.integration_docker

CONTROLLER_SCRIPT = Path("scripts/ce-domain-controller.py")


@pytest.fixture
def require_docker() -> None:
    if shutil.which("docker") is None:
        pytest.skip("docker CLI not available")
    result = subprocess.run(["docker", "info"], capture_output=True, check=False)
    if result.returncode != 0:
        pytest.skip("docker daemon not available")


def test_live_ce_domain_controller_lifecycle(tmp_path: Path, require_docker: None) -> None:
    settings = Settings(
        database_url="sqlite:///:memory:",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_path / "domain-runtimes"),
        domain_runtime_controller_kind="docker",
        domain_controller_command=f"{sys.executable} {CONTROLLER_SCRIPT}",
        testing=True,
    )
    controller = DockerDomainRuntimeController(settings)
    now = utc_now()
    domain = Domain(
        id="ci-domain",
        display_name="CI Domain",
        state=DOMAIN_STATE_STOPPED,
        embedding_profile_id="openai-embedding-default",
        runtime_instance_id="22222222-2222-4222-8222-222222222222",
        control_generation=1,
        created_at=now,
        updated_at=now,
    )

    controller.provision(domain)
    assert controller.health(domain).healthy is False

    controller.start(domain)
    assert controller.health(domain).healthy is True

    controller.stop(domain)
    assert controller.health(domain).healthy is False

    controller.delete(domain)
    assert not controller.runtime_dir(domain.id, domain.runtime_instance_id).exists()
