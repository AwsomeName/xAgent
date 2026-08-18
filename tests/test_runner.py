import json
from pathlib import Path

from xagent_eval.agents import BaselineAgent
from xagent_eval.datasets import load_jsonl
from xagent_eval.runner import EvaluationRunner


def test_runner_writes_reproducible_artifacts(tmp_path: Path) -> None:
    tasks = load_jsonl("examples/datasets/smoke.jsonl")
    output = EvaluationRunner(BaselineAgent(), repetitions=2).run(tasks, tmp_path)
    summary = json.loads((output / "summary.json").read_text(encoding="utf-8"))
    records = (output / "records.jsonl").read_text(encoding="utf-8").splitlines()

    assert summary["samples"] == 6
    assert summary["metrics"]["pass_rate"] == 1
    assert len(records) == 6
    assert (output / "manifest.json").exists()
    assert (output / "report.md").exists()
