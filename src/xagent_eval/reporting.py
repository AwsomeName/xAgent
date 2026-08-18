from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_summaries(paths: list[str | Path]) -> list[dict[str, Any]]:
    summaries: list[dict[str, Any]] = []
    for path in paths:
        source = Path(path)
        try:
            payload = json.loads(source.read_text(encoding="utf-8"))
            if payload.get("schema_version") != 1:
                raise ValueError("unsupported schema_version")
            payload["_source"] = str(source)
            summaries.append(payload)
        except (OSError, json.JSONDecodeError, AttributeError, ValueError) as exc:
            raise ValueError(f"invalid summary {source}: {exc}") from exc
    if len(summaries) < 2:
        raise ValueError("comparison requires at least two summaries")
    return summaries


def render_comparison(summaries: list[dict[str, Any]]) -> str:
    ordered = sorted(
        summaries,
        key=lambda item: (
            -float(item["metrics"]["mean_score"]),
            float(item["metrics"]["latency_ms_mean"]),
        ),
    )
    rows = [
        "# xAgent comparison",
        "",
        "| Agent | Framework | Model | Samples | Score | Pass rate | Errors | Mean latency (ms) |",
        "|---|---|---|---:|---:|---:|---:|---:|",
    ]
    for summary in ordered:
        agent = summary["agent"]
        metrics = summary["metrics"]
        rows.append(
            f"| {agent['name']} | {agent['framework']} | {agent['model']} | "
            f"{summary['samples']} | {metrics['mean_score']:.2%} | "
            f"{metrics['pass_rate']:.2%} | {metrics['error_count']} | "
            f"{metrics['latency_ms_mean']:.3f} |"
        )
    return "\n".join(rows) + "\n"
