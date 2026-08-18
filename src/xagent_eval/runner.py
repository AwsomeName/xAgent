from __future__ import annotations

import hashlib
import json
import math
import platform
import statistics
import sys
import time
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .models import RunRecord, Task, Usage
from .protocols import Agent
from .scorers import score


def _percentile(values: list[float], percentile: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = max(0, math.ceil(percentile * len(ordered)) - 1)
    return ordered[index]


def _sum_optional(values: list[int | float | None]) -> int | float | None:
    present = [value for value in values if value is not None]
    return sum(present) if present else None


class EvaluationRunner:
    def __init__(self, agent: Agent, *, repetitions: int = 1) -> None:
        if repetitions < 1:
            raise ValueError("repetitions must be at least 1")
        self.agent = agent
        self.repetitions = repetitions

    def run(
        self,
        tasks: list[Task],
        output_root: str | Path,
        *,
        dataset_name: str | None = None,
    ) -> Path:
        started_at = datetime.now(UTC)
        run_id = f"{started_at.strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
        output_dir = Path(output_root) / run_id
        output_dir.mkdir(parents=True, exist_ok=False)

        records = [
            self._run_one(task, repetition)
            for task in tasks
            for repetition in range(1, self.repetitions + 1)
        ]
        finished_at = datetime.now(UTC)
        manifest = {
            "schema_version": 1,
            "run_id": run_id,
            "started_at": started_at.isoformat(),
            "finished_at": finished_at.isoformat(),
            "agent": {
                "name": self.agent.name,
                "framework": self.agent.framework,
                "model": self.agent.model,
            },
            "task_count": len(tasks),
            "repetitions": self.repetitions,
            "dataset": {
                "source": dataset_name,
                "fingerprint_sha256": self._task_fingerprint(tasks),
            },
            "environment": {
                "python": sys.version.split()[0],
                "platform": platform.platform(),
            },
        }
        summary = self._summarize(records, manifest)
        self._write_json(output_dir / "manifest.json", manifest)
        self._write_json(output_dir / "summary.json", summary)
        with (output_dir / "records.jsonl").open("w", encoding="utf-8") as handle:
            for record in records:
                handle.write(json.dumps(record.to_dict(), ensure_ascii=False) + "\n")
        (output_dir / "report.md").write_text(
            self._render_report(summary, records), encoding="utf-8"
        )
        return output_dir

    @staticmethod
    def _task_fingerprint(tasks: list[Task]) -> str:
        payload = [
            {
                "id": task.id,
                "prompt": task.prompt,
                "expected": task.expected,
                "scorer": task.scorer,
                "tags": task.tags,
                "metadata": task.metadata,
            }
            for task in tasks
        ]
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode()).hexdigest()

    def _run_one(self, task: Task, repetition: int) -> RunRecord:
        start = time.perf_counter()
        try:
            result = self.agent.run(task)
            task_score = score(task, result.output)
            output = result.output
            usage = result.usage
            trace = result.trace
            error = None
        except Exception as exc:  # The record is more valuable than aborting an experiment.
            task_score = 0.0
            output = ""
            usage = Usage()
            trace = ()
            error = f"{type(exc).__name__}: {exc}"
        latency_ms = (time.perf_counter() - start) * 1000
        return RunRecord(
            task_id=task.id,
            repetition=repetition,
            output=output,
            expected=task.expected,
            scorer=task.scorer,
            score=task_score,
            passed=task_score >= 1.0,
            latency_ms=round(latency_ms, 3),
            usage=usage,
            trace=trace,
            error=error,
        )

    @staticmethod
    def _summarize(records: list[RunRecord], manifest: dict[str, Any]) -> dict[str, Any]:
        latencies = [record.latency_ms for record in records]
        scores = [record.score for record in records]
        return {
            "schema_version": 1,
            "run_id": manifest["run_id"],
            "agent": manifest["agent"],
            "samples": len(records),
            "metrics": {
                "mean_score": round(statistics.fmean(scores), 6),
                "pass_rate": round(sum(record.passed for record in records) / len(records), 6),
                "error_count": sum(record.error is not None for record in records),
                "latency_ms_mean": round(statistics.fmean(latencies), 3),
                "latency_ms_p50": round(_percentile(latencies, 0.50), 3),
                "latency_ms_p95": round(_percentile(latencies, 0.95), 3),
                "input_tokens": _sum_optional(
                    [record.usage.input_tokens for record in records]
                ),
                "output_tokens": _sum_optional(
                    [record.usage.output_tokens for record in records]
                ),
                "cost_usd": _sum_optional([record.usage.cost_usd for record in records]),
            },
        }

    @staticmethod
    def _write_json(path: Path, payload: dict[str, Any]) -> None:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    @staticmethod
    def _render_report(summary: dict[str, Any], records: list[RunRecord]) -> str:
        agent = summary["agent"]
        metrics = summary["metrics"]
        rows = [
            "# xAgent evaluation report",
            "",
            f"- Run: `{summary['run_id']}`",
            f"- Agent: `{agent['name']}`",
            f"- Framework: `{agent['framework']}`",
            f"- Model: `{agent['model']}`",
            f"- Samples: {summary['samples']}",
            f"- Mean score: {metrics['mean_score']:.2%}",
            f"- Pass rate: {metrics['pass_rate']:.2%}",
            f"- Errors: {metrics['error_count']}",
            f"- Mean / p95 latency: {metrics['latency_ms_mean']:.3f} / "
            f"{metrics['latency_ms_p95']:.3f} ms",
            "",
            "| Task | Rep | Score | Latency (ms) | Error |",
            "|---|---:|---:|---:|---|",
        ]
        rows.extend(
            f"| {record.task_id} | {record.repetition} | {record.score:.3f} | "
            f"{record.latency_ms:.3f} | {record.error or ''} |"
            for record in records
        )
        return "\n".join(rows) + "\n"
