# xAgent

xAgent 是一个面向真实任务的 Agent 实验室。长期目标是用统一平台公平比较不同
Agent、框架与模型，但评测不是终点：实验结果最终用于指导和验证自研 Agent 框架。

> 当前是可运行的 `v0.1` 骨架。它优先解决实验可复现和适配边界问题，不把某个
> Agent 框架或模型供应商写死在评测内核中。

## 当前项目主线

1. **长期目标**：建立公平比较不同 Agent、框架和模型的评测平台，持续服务于自研
   Agent 框架的迭代。
2. **第一阶段**：先跑通一个最小闭环。接入 Enginuity Bench，从中定义一个可自动评分
   的文档与工程视觉任务，在相同输入和约束下对比 Claude Code 与 Codex。
3. **统一平台**：由一个平台维护任务版本、运行环境、Agent 配置、执行过程、日志、
   评分和对比报告。CLI 是执行入口之一，不是独立于平台的另一套流程。

## 统一平台闭环

项目所有能力围绕同一条闭环建设：

> 平台导入数据 → 平台生成任务 → 平台选择 Agent → 平台统一执行 → 平台自动评分 →
> 平台对比分析 → 根据结果开发自研 Agent → 新版本回到平台继续测试。

平台统一维护六类核心对象：

1. **数据集**：首个数据集使用 Enginuity Bench，后续可继续扩展。
2. **任务**：从数据集中定义具体输入、目标、约束和评分方式。
3. **Agent**：Claude Code、Codex、自研 Agent 及其版本。
4. **实验**：选择任务、Agent、模型、运行参数和重复次数。
5. **运行记录**：保存输入、过程、日志、产物、耗时和成本。
6. **结果**：保存评分、横向对比和失败原因，并反向指导自研 Agent。

## 项目目标

1. **Agent 评测**：在相同或不同模型下，对比 Agent 的任务成功率、得分、耗时、
   token 消耗、错误与执行轨迹。
2. **自研 Agent**：把对比实验和失败分析转化为框架需求，围绕规划、工具使用、
   记忆、反思、恢复和多 Agent 协作逐步迭代。
3. **平台维护**：用同一套数据和流程维护任务、执行、轨迹、评分、报告与后续展示。

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

## 本地评测平台

`web/` 当前提供本地静态控制台，用于确定任务范围、数据范围、Agent、测试方案和评价
指标。配置只保存在当前浏览器，也可以导入或导出 JSON。后续它将作为统一平台入口，
连接 Runner，并维护任务、执行、日志、评分和报告的完整生命周期。

```bash
cd web
npm install
npm run dev
```

打开 <http://localhost:3000>。网页工具链需要 Node.js 22.13 或更高版本。

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

- [产品与实施规划](docs/product-plan.md)
- [架构说明](docs/architecture.md)
- [开源项目与数据集调研](docs/research/landscape-2026-08.md)
- [路线图](docs/roadmap.md)
- [服务器开发交接](docs/handoff.md)
- [贡献指南](CONTRIBUTING.md)

## 命名说明

GitHub 上已有多个名为 XAgent/xagent 的项目。本仓库当前的 Python 发布名使用
`xagent-eval`，导入包名使用 `xagent_eval`，以降低冲突风险。正式品牌名和开源许可
将在公开发布前确认。
