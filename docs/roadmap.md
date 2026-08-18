# 路线图

## Phase 0：可运行骨架（当前）

- 统一 Task / Agent / Result 协议；
- JSONL 数据集和 exact / contains / regex scorer；
- 内置、外部命令、OpenAI-compatible 三类适配器；
- manifest、逐样本记录、JSON 汇总和 Markdown 报告；
- 单元测试与 CI。

## Phase 1：公平对比

- experiment matrix 与并发、重试、超时、随机种子；
- 成本表与统一 token/cost 统计；
- LangGraph、OpenAI Agents SDK、CrewAI/AutoGen 示例桥接；
- 多次运行置信区间、成对比较和失败聚类；
- 基于 DuckDB/Parquet 的结果仓库。

## Phase 2：标准 benchmark 与沙箱

- 优先接入 Harbor/Inspect 可复用任务，而不是复制数据；
- 接入 SWE-bench Verified 或更新的防污染代码任务子集；
- 接入 τ-bench/τ²-bench 类工具交互任务；
- Docker/远程沙箱、资源限制、网络策略和副作用审计。

## Phase 3：自研 Agent

- 建立无框架基线：ReAct、计划-执行、反思/验证；
- 工具注册、短期/长期记忆、检查点和错误恢复；
- 对不同模型固定 Agent scaffold，定位“模型能力”和“框架能力”的贡献；
- 多 Agent 委派与冲突、重复工作、通信成本评测。

## Phase 4：数据与演示

- 数据卡、许可、版本、污染与隐私审计；
- 结果看板：筛选、置信区间、成本-质量 Pareto 前沿、轨迹回放；
- 可公开的最小演示和可复现实验包；
- CI 定期回归与经人工审核的公开 leaderboard。
