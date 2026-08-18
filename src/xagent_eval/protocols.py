from __future__ import annotations

from typing import Protocol

from .models import AgentResult, Task


class Agent(Protocol):
    """Minimal boundary implemented by every evaluated agent."""

    name: str
    framework: str
    model: str

    def run(self, task: Task) -> AgentResult: ...
