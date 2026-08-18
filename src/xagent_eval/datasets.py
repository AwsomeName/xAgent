from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .models import Task


def load_jsonl(path: str | Path) -> list[Task]:
    source = Path(path)
    tasks: list[Task] = []
    seen: set[str] = set()
    with source.open(encoding="utf-8") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            line = raw_line.strip()
            if not line:
                continue
            try:
                item: dict[str, Any] = json.loads(line)
                task_id = str(item["id"])
                if task_id in seen:
                    raise ValueError(f"duplicate task id: {task_id}")
                task = Task(
                    id=task_id,
                    prompt=str(item["prompt"]),
                    expected=str(item["expected"]),
                    scorer=str(item.get("scorer", "exact")),
                    tags=tuple(str(tag) for tag in item.get("tags", [])),
                    metadata=dict(item.get("metadata", {})),
                )
            except (KeyError, TypeError, json.JSONDecodeError, ValueError) as exc:
                raise ValueError(f"invalid dataset line {line_number}: {exc}") from exc
            seen.add(task_id)
            tasks.append(task)
    if not tasks:
        raise ValueError(f"dataset is empty: {source}")
    return tasks
