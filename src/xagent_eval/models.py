from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True, slots=True)
class Task:
    id: str
    prompt: str
    expected: str
    scorer: str = "exact"
    tags: tuple[str, ...] = ()
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class Usage:
    input_tokens: int | None = None
    output_tokens: int | None = None
    cost_usd: float | None = None


@dataclass(frozen=True, slots=True)
class AgentResult:
    output: str
    usage: Usage = field(default_factory=Usage)
    trace: tuple[dict[str, Any], ...] = ()
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class RunRecord:
    task_id: str
    repetition: int
    output: str
    expected: str
    scorer: str
    score: float
    passed: bool
    latency_ms: float
    usage: Usage
    trace: tuple[dict[str, Any], ...]
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
