from __future__ import annotations

import re

from .models import Task


def score(task: Task, output: str) -> float:
    actual = output.strip()
    expected = task.expected.strip()
    if task.scorer == "exact":
        return float(actual == expected)
    if task.scorer == "contains":
        return float(expected in actual)
    if task.scorer == "regex":
        return float(re.search(expected, actual) is not None)
    raise ValueError(f"unknown scorer: {task.scorer}")
