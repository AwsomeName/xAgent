from __future__ import annotations

import json
import shlex
import subprocess
from typing import Any

from ..models import AgentResult, Task, Usage


class CommandAgent:
    """Bridge to an agent process using one JSON request/response per task."""

    def __init__(
        self,
        command: str,
        *,
        framework: str = "external",
        model: str = "unknown",
        timeout_seconds: float = 300,
    ) -> None:
        self.command = shlex.split(command)
        if not self.command:
            raise ValueError("command cannot be empty")
        self.name = "command"
        self.framework = framework
        self.model = model
        self.timeout_seconds = timeout_seconds

    def run(self, task: Task) -> AgentResult:
        request = {
            "task_id": task.id,
            "prompt": task.prompt,
            "metadata": task.metadata,
        }
        completed = subprocess.run(
            self.command,
            input=json.dumps(request, ensure_ascii=False) + "\n",
            text=True,
            capture_output=True,
            timeout=self.timeout_seconds,
            check=False,
        )
        if completed.returncode != 0:
            stderr = completed.stderr.strip()
            raise RuntimeError(f"agent command exited {completed.returncode}: {stderr[-1000:]}")
        try:
            payload: dict[str, Any] = json.loads(completed.stdout.strip())
            usage_payload = dict(payload.get("usage", {}))
            return AgentResult(
                output=str(payload["output"]),
                usage=Usage(
                    input_tokens=usage_payload.get("input_tokens"),
                    output_tokens=usage_payload.get("output_tokens"),
                    cost_usd=usage_payload.get("cost_usd"),
                ),
                trace=tuple(payload.get("trace", [])),
                metadata=dict(payload.get("metadata", {})),
            )
        except (KeyError, TypeError, json.JSONDecodeError) as exc:
            raise ValueError(
                "agent command must emit one JSON object with an output field"
            ) from exc
