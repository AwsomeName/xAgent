# 路线图

本文件保留阶段摘要；评测方法、系统边界、验收门槛和近期执行清单见
[产品与实施规划](product-plan.md)。

## 项目主线

- 长期建设公平比较不同 Agent、框架和模型的平台，评测结果服务于自研 Agent 框架。
- 第一阶段接入 Enginuity Bench，用一个可自动评分的文档与工程视觉任务对比 Claude
  Code 与 Codex。
- 任务、环境、配置、执行、日志、评分和报告始终由同一个平台维护。

平台固定运行以下闭环：

> 导入数据 → 生成任务 → 选择 Agent → 统一执行 → 自动评分 → 对比分析 →
> 开发自研 Agent → 新版本继续测试。

平台维护数据集、任务、Agent、实验、运行记录和结果六类核心对象。

## Phase 0：可运行骨架（已完成）

- 统一 Task / Agent / Result 协议；
- JSONL 数据集和 exact / contains / regex scorer；
- 内置、外部命令、OpenAI-compatible 三类适配器；
- manifest、逐样本记录、JSON 汇总和 Markdown 报告；
- 单元测试与 CI。

## Phase 1：最小闭环（当前）

- 接入 Enginuity Bench，并从中定义一个可自动评分的最小任务；
- 接入 Claude Code 与 Codex，并统一环境、权限、超时和预算；
- 平台直接创建和跟踪运行，保存日志、输出产物、评分、耗时和用量；
- 每个 Agent 至少重复运行三次，并生成第一份真实对比报告。

## Phase 2：自研 Agent 基线

- 将自研 Agent 作为第三个实现接入同一平台；
- 从 Claude Code 与 Codex 的差距和失败轨迹中确定框架需求；
- 建立 ReAct、计划执行、验证和恢复机制的消融与回归实验。

## Phase 3：公平评测基础设施

- experiment matrix 与并发、重试、超时、随机种子；
- 成本表与统一 token/cost 统计；
- 多次运行置信区间、成对比较和失败聚类；
- 基于 DuckDB/Parquet 的结果仓库；
- Web、CLI 和 Runner 共享配置与结果协议。

## Phase 4：标准 benchmark 与沙箱

- 优先接入 Harbor/Inspect 可复用任务，而不是复制数据；
- 接入 SWE-bench Verified 或更新的防污染代码任务子集；
- 接入 τ³-bench 文本 `base` 子集等工具交互任务；
- Docker/远程沙箱、资源限制、网络策略和副作用审计。

## Phase 5：扩展 Agent 与模型比较

- 接入 OpenAI Agents SDK、LangGraph 和代码行动范式基线；
- 对不同模型固定 Agent scaffold，定位模型与框架的贡献；
- 扩展工具、记忆、检查点、错误恢复和多 Agent 评测。

## Phase 6：数据与公开演示

- 数据卡、许可、版本、污染与隐私审计；
- 结果看板：筛选、置信区间、成本-质量 Pareto 前沿、轨迹回放；
- 可公开的最小演示和可复现实验包；
- CI 定期回归与经人工审核的公开 leaderboard。
