from __future__ import annotations

import ast
import operator

from ..models import AgentResult, Task

_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def _safe_calculate(expression: str) -> int | float:
    def evaluate(node: ast.AST) -> int | float:
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in _OPERATORS:
            return _OPERATORS[type(node.op)](evaluate(node.left), evaluate(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _OPERATORS:
            return _OPERATORS[type(node.op)](evaluate(node.operand))
        raise ValueError("unsupported expression")

    return evaluate(ast.parse(expression, mode="eval").body)


class BaselineAgent:
    """Tiny deterministic agent used to verify the evaluation pipeline."""

    name = "baseline"
    framework = "xagent-native"
    model = "rules-v1"

    def run(self, task: Task) -> AgentResult:
        prompt = task.prompt.strip()
        if prompt.startswith("计算："):
            output = str(_safe_calculate(prompt.removeprefix("计算：").strip()))
        elif prompt.startswith("反转字符串："):
            output = prompt.removeprefix("反转字符串：").strip()[::-1]
        elif prompt.startswith("Echo exactly: "):
            output = prompt.removeprefix("Echo exactly: ")
        else:
            output = prompt
        return AgentResult(output=output, trace=({"type": "final", "output": output},))
