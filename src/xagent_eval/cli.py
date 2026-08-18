from __future__ import annotations

import argparse
from collections.abc import Sequence
from pathlib import Path

from .agents import BaselineAgent, CommandAgent, OpenAICompatibleAgent
from .datasets import load_jsonl
from .protocols import Agent
from .reporting import load_summaries, render_comparison
from .runner import EvaluationRunner


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="xagent-eval", description="Run reproducible agent evals")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)
    run = subparsers.add_parser("run", help="run a JSONL benchmark")
    run.add_argument("--dataset", type=Path, required=True)
    run.add_argument(
        "--agent", choices=("baseline", "command", "openai-compatible"), required=True
    )
    run.add_argument("--output-dir", type=Path, default=Path("runs"))
    run.add_argument("--repetitions", type=int, default=1)
    run.add_argument("--command")
    run.add_argument("--framework", default="external")
    run.add_argument("--model")
    run.add_argument("--base-url", default="https://api.openai.com/v1")
    run.add_argument("--api-key-env", default="OPENAI_API_KEY")
    run.add_argument("--timeout", type=float, default=300)

    compare = subparsers.add_parser("compare", help="compare two or more summary files")
    compare.add_argument("summaries", nargs="+", type=Path)
    compare.add_argument("--output", type=Path)
    return parser


def _build_agent(args: argparse.Namespace, parser: argparse.ArgumentParser) -> Agent:
    if args.agent == "baseline":
        return BaselineAgent()
    if args.agent == "command":
        if not args.command:
            parser.error("--command is required when --agent=command")
        return CommandAgent(
            args.command,
            framework=args.framework,
            model=args.model or "unknown",
            timeout_seconds=args.timeout,
        )
    if not args.model:
        parser.error("--model is required when --agent=openai-compatible")
    return OpenAICompatibleAgent(
        args.model,
        base_url=args.base_url,
        api_key_env=args.api_key_env,
        timeout_seconds=args.timeout,
    )


def main(argv: Sequence[str] | None = None) -> int:
    parser = _parser()
    args = parser.parse_args(argv)
    if args.subcommand == "compare":
        try:
            report = render_comparison(load_summaries(args.summaries))
        except ValueError as exc:
            parser.error(str(exc))
        if args.output:
            args.output.write_text(report, encoding="utf-8")
            print(args.output)
        else:
            print(report, end="")
        return 0
    agent = _build_agent(args, parser)
    tasks = load_jsonl(args.dataset)
    output_dir = EvaluationRunner(agent, repetitions=args.repetitions).run(
        tasks, args.output_dir, dataset_name=str(args.dataset)
    )
    print(output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
