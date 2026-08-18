"""Minimal external-agent bridge example; reads one request and emits one response."""

from __future__ import annotations

import json
import sys

request = json.loads(sys.stdin.readline())
prompt = request["prompt"]
output = prompt.removeprefix("Echo exactly: ") if prompt.startswith("Echo exactly: ") else prompt
print(json.dumps({"output": output, "trace": [{"type": "final"}]}))
