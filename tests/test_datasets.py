from pathlib import Path

import pytest

from xagent_eval.datasets import load_jsonl


def test_load_smoke_dataset() -> None:
    tasks = load_jsonl(Path("examples/datasets/smoke.jsonl"))
    assert len(tasks) == 3
    assert tasks[0].id == "math-1"


def test_duplicate_ids_are_rejected(tmp_path: Path) -> None:
    dataset = tmp_path / "duplicate.jsonl"
    dataset.write_text(
        '{"id":"same","prompt":"a","expected":"a"}\n'
        '{"id":"same","prompt":"b","expected":"b"}\n',
        encoding="utf-8",
    )
    with pytest.raises(ValueError, match="duplicate task id"):
        load_jsonl(dataset)
