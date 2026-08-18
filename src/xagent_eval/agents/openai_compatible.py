from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any

from ..models import AgentResult, Task, Usage


class OpenAICompatibleAgent:
    """Minimal Chat Completions adapter with no third-party runtime dependency."""

    name = "openai-compatible"
    framework = "raw-api"

    def __init__(
        self,
        model: str,
        *,
        base_url: str = "https://api.openai.com/v1",
        api_key_env: str = "OPENAI_API_KEY",
        timeout_seconds: float = 300,
    ) -> None:
        if not model:
            raise ValueError("model is required")
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.api_key_env = api_key_env
        self.timeout_seconds = timeout_seconds

    def run(self, task: Task) -> AgentResult:
        api_key = os.environ.get(self.api_key_env)
        if not api_key:
            raise RuntimeError(f"missing API key in environment variable {self.api_key_env}")
        body = json.dumps(
            {
                "model": self.model,
                "messages": [{"role": "user", "content": task.prompt}],
                "temperature": 0,
            }
        ).encode()
        request = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=body,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                payload: dict[str, Any] = json.load(response)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode(errors="replace")[-1000:]
            raise RuntimeError(f"model API returned HTTP {exc.code}: {detail}") from exc
        usage = payload.get("usage", {})
        return AgentResult(
            output=str(payload["choices"][0]["message"]["content"]),
            usage=Usage(
                input_tokens=usage.get("prompt_tokens"),
                output_tokens=usage.get("completion_tokens"),
            ),
            metadata={"response_id": payload.get("id")},
        )
