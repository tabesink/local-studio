from __future__ import annotations

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STACK_SMOKE = ROOT / "scripts" / "stack_smoke.py"

FORBIDDEN_MODULES = {
    "context_engine.worker",
    "context_engine.services.sources",
    "context_engine.services.indexing",
    "context_engine.services.domains",
}
FORBIDDEN_NAMES = {
    "run_once",
    "run_once_pass",
    "SourcePreparationWorker",
    "SourceIndexWorker",
    "DomainDeleteWorker",
    "build_workers",
    "run_loop",
}


def _module_name(node: ast.AST) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        parent = _module_name(node.value)
        return f"{parent}.{node.attr}" if parent else node.attr
    return None


def _forbidden_imports(tree: ast.AST) -> list[str]:
    offenders: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name in FORBIDDEN_MODULES or alias.name.startswith("context_engine.worker"):
                    offenders.append(alias.name)
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            if module in FORBIDDEN_MODULES or module.startswith("context_engine.worker"):
                offenders.append(module)
            for alias in node.names:
                if alias.name in FORBIDDEN_NAMES:
                    offenders.append(f"{module}.{alias.name}" if module else alias.name)
    return offenders


def _forbidden_calls(tree: ast.AST) -> list[str]:
    offenders: list[str] = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        name = _module_name(node.func)
        if name is None:
            continue
        leaf = name.rsplit(".", 1)[-1]
        if leaf in {"run_once", "run_once_pass"} or name in FORBIDDEN_NAMES:
            offenders.append(name)
    return offenders


def test_stack_smoke_ast_forbids_worker_imports_and_run_once() -> None:
    tree = ast.parse(STACK_SMOKE.read_text(encoding="utf-8"), filename=str(STACK_SMOKE))
    assert _forbidden_imports(tree) == []
    assert _forbidden_calls(tree) == []


def test_stack_smoke_ast_detects_injected_run_once_import(tmp_path: Path) -> None:
    poisoned = tmp_path / "stack_smoke_poisoned.py"
    poisoned.write_text(
        "from context_engine.worker import run_once_pass\n\ndef main():\n    run_once_pass(None, None, None, None)\n",
        encoding="utf-8",
    )
    tree = ast.parse(poisoned.read_text(encoding="utf-8"), filename=str(poisoned))
    assert "context_engine.worker" in _forbidden_imports(tree)
    assert "run_once_pass" in _forbidden_calls(tree)
