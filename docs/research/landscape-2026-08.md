# Agent 评测与数据调研（2026-08）

本调研优先引用项目官方仓库和文档。结论是：不应从零复制成熟 benchmark，xAgent
更适合先成为统一适配、实验编排和结果治理层，再按任务类型复用上游数据与环境。

## 评测基础设施

| 项目 | 值得借鉴 | 对 xAgent 的启示 |
|---|---|---|
| [Harbor](https://github.com/harbor-framework/harbor) | 统一运行多类 Agent；容器任务；本地/云端并发；也服务 RL rollout | 中期优先做兼容或转换层，避免自建一套不兼容的容器任务标准 |
| [Inspect AI](https://inspect.aisi.org.uk/) | solver/scorer/模型解耦，日志查看，Agent 与多 Agent 支持 | scorer 必须是一等对象；报告要能下钻到完整样本和轨迹 |
| [AgentBench](https://github.com/THUDM/AgentBench) | OS、DB、知识图谱、WebShop 等多环境；任务/Agent/客户端解耦 | 环境服务和 Agent 运行时应独立部署；不要假设所有任务资源需求相同 |
| [AgentCompass](https://github.com/open-compass/AgentCompass) | benchmark、harness 和 Docker 环境的配置化组合 | experiment matrix 和显式版本配置应进入 Phase 1 |

## 代表性任务与数据

| 项目 | 测什么 | 注意事项 |
|---|---|---|
| [SWE-bench](https://github.com/SWE-bench/SWE-bench) | 真实 GitHub issue 的仓库级代码修复 | 环境构建昂贵；热门老任务有训练污染风险，结果必须记录数据版本 |
| [τ²-bench](https://github.com/sierra-research/tau2-bench) | Agent、用户与工具环境的多轮交互及策略遵循 | 适合衡量工具调用可靠性；不能只看最终文本相似度 |
| [GAIA](https://huggingface.co/datasets/gaia-benchmark/GAIA) | 搜索、浏览、文件、多模态和推理组成的通用助手任务 | 测试答案受控；附件、网络与网页变化会影响复现 |
| [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany) | 在模拟软件公司环境中执行长程知识工作 | 真实度高但运行成本高，适合后期系统能力评测 |
| [WebArena](https://github.com/web-arena-x/webarena) | 自托管网站上的浏览器 Agent | 需要环境重置、动作轨迹和副作用控制 |
| [OSWorld](https://github.com/xlang-ai/OSWorld) | 真实桌面应用与操作系统交互 | 视觉/GUI 环境较重，评测需严格固定镜像和初始状态 |

## Agent 框架候选

建议首轮在同一模型、同一任务和尽量等价的工具集合下比较：

- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python)：轻量 agent loop、handoff、guardrail 和 tracing；
- [LangGraph](https://github.com/langchain-ai/langgraph)：显式状态图、持久化和可恢复流程；
- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)：多语言与企业集成方向；
- [CrewAI](https://github.com/crewAIInc/crewAI)：角色/团队式多 Agent 编排；
- [smolagents](https://github.com/huggingface/smolagents)：代码 Agent 与轻量工具抽象；
- 无框架的自研 ReAct 基线：用于判断框架复杂度是否真的带来收益。

不同框架常包含不同默认 prompt、重试、上下文裁剪和工具 schema。比较时要同时报告两种
结果：一是“开箱即用表现”，二是“控制变量表现”。否则很容易把默认配置差异误当成模型
或框架能力差异。

## 建议的首批实验

1. **协议 smoke test**：确定性小任务，验证各 adapter 的 I/O、错误和 token 记录。
2. **工具调用可靠性**：20–50 个本地可重置工具任务，统计成功率、无效调用和恢复次数。
3. **代码任务小样本**：选择许可明确、可稳定构建、近期创建的 issue，避免先承担完整
   SWE-bench 的成本。
4. **长程任务**：固定预算，记录检查点、重复动作、人工介入和终止原因。
5. **同模型跨框架 / 同框架跨模型**：每项至少多次运行，报告置信区间而非单点排行榜。

## 数据治理清单

- 来源 URL、上游 commit/version、许可与本地修改；
- train/dev/test 切分与答案可见性；
- 创建时间和潜在训练污染；
- PII、凭据、恶意内容与 prompt injection 风险；
- 环境镜像 digest、依赖锁、随机种子与网络快照；
- scorer 的误差、LLM judge 的模型/提示词/重复次数和人工复核流程。
