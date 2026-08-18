from pathlib import Path

from xagent_eval.agents import CommandAgent
from xagent_eval.models import Task


def test_command_agent_bridge() -> None:
    script = Path("examples/agents/command_agent.py")
    agent = CommandAgent(f"python3 {script}", framework="demo", model="rules")
    result = agent.run(Task("1", "Echo exactly: hello", "hello"))
    assert result.output == "hello"
