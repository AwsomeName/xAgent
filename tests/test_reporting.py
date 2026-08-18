import json
from pathlib import Path

from xagent_eval.reporting import load_summaries, render_comparison


def _write_summary(path: Path, name: str, score: float, latency: float) -> None:
    path.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "run_id": name,
                "agent": {"name": name, "framework": "test", "model": "test"},
                "samples": 2,
                "metrics": {
                    "mean_score": score,
                    "pass_rate": score,
                    "error_count": 0,
                    "latency_ms_mean": latency,
                },
            }
        ),
        encoding="utf-8",
    )


def test_comparison_orders_by_score(tmp_path: Path) -> None:
    slower = tmp_path / "slower.json"
    better = tmp_path / "better.json"
    _write_summary(slower, "slower", 0.5, 10)
    _write_summary(better, "better", 1.0, 20)

    report = render_comparison(load_summaries([slower, better]))
    assert report.index("| better |") < report.index("| slower |")
