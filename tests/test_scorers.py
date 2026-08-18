from xagent_eval.models import Task
from xagent_eval.scorers import score


def test_supported_scorers() -> None:
    assert score(Task("1", "", "ok", "exact"), " ok\n") == 1
    assert score(Task("2", "", "needle", "contains"), "a needle here") == 1
    assert score(Task("3", "", r"v\d+", "regex"), "release v12") == 1
