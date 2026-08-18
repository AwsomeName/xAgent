# xAgent

xAgent 是一个面向真实任务的 Agent 实验室，目标是用统一协议公平比较不同 Agent
框架与模型，并逐步沉淀自研 Agent、任务数据、评测报告和演示应用。

> 当前是可运行的 `v0.1` 骨架。它优先解决实验可复现和适配边界问题，不把某个
> Agent 框架或模型供应商写死在评测内核中。

## 项目目标

1. **Agent 评测**：在相同或不同模型下，对比 Agent 的任务成功率、得分、耗时、
   token 消耗、错误与执行轨迹。
2. **自研 Agent**：围绕规划、工具使用、记忆、反思、恢复和多 Agent 协作迭代；
   也允许基于合适的开源项目二次开发。
3. **周边生态**：收集任务数据，建设结果看板、公开演示和可复现实验档案。

## 30 秒运行

项目只要求 Python 3.11+；内置 smoke benchmark 不调用网络，也不需要 API Key。

```bash
uv sync --extra dev
uv run xagent-eval run \
  --dataset examples/datasets/smoke.jsonl \
  --agent baseline \
  --output-dir runs
```

终端会输出本次运行目录，其中包含：

- `manifest.json`：实验配置和运行环境；
- `records.jsonl`：每个任务、每次重复的原始记录；
- `summary.json`：机器可读的汇总指标；
- `report.md`：便于人工阅读和版本归档的报告。

对比两次或更多运行：

```bash
uv run xagent-eval compare runs/*/summary.json --output comparison.md
```

运行测试与静态检查：

```bash
uv run pytest
uv run ruff check .
```

## 接入真实 Agent

### 命令行桥接（推荐用于不同框架）

`command` 适配器通过 stdin 发送一行 JSON，并从 stdout 读取一行 JSON。因此
LangGraph、OpenAI Agents SDK、CrewAI、AutoGen 或自研服务都可以在各自环境中运行，
不必污染评测器依赖。

```bash
uv run xagent-eval run \
  --dataset examples/datasets/smoke.jsonl \
  --agent command \
  --command "python examples/agents/command_agent.py" \
  --framework my-framework \
  --model my-model
```

请求格式：

```json
{"task_id":"math-1","prompt":"计算：2 + 2","metadata":{}}
```

响应至少包含 `output`，也可返回 token 用量和轨迹：

```json
{"output":"4","usage":{"input_tokens":8,"output_tokens":1},"trace":[]}
```

### OpenAI-compatible API

```bash
export OPENAI_API_KEY="..."
uv run xagent-eval run \
  --dataset examples/datasets/smoke.jsonl \
  --agent openai-compatible \
  --model YOUR_MODEL \
  --base-url https://api.openai.com/v1
```

API Key 只从环境变量读取，不会写入实验记录。

## 数据集格式

每行是一个任务。`scorer` 首版支持 `exact`、`contains` 和 `regex`。

```json
{"id":"demo","prompt":"只回答 OK","expected":"OK","scorer":"exact","tags":["smoke"]}
```

完整设计、调研和路线图见：

- [架构说明](docs/architecture.md)
- [开源项目与数据集调研](docs/research/landscape-2026-08.md)
- [路线图](docs/roadmap.md)
- [贡献指南](CONTRIBUTING.md)

## 命名说明

GitHub 上已有多个名为 XAgent/xagent 的项目。本仓库当前的 Python 发布名使用
`xagent-eval`，导入包名使用 `xagent_eval`，以降低冲突风险。正式品牌名和开源许可
将在公开发布前确认。
