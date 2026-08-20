# Agent 评测与数据调研（2026-08）

本调研优先引用项目官方仓库和文档。结论是：不应从零复制成熟 benchmark，xAgent
更适合先成为统一适配、实验编排和结果治理层，再按任务类型复用上游数据与环境。

## 与当前项目主线的关系

长期仍要建设公平比较不同 Agent、框架和模型的平台，但评测能力最终服务于自研 Agent
框架。当前不立即铺开下列 benchmark，而是先接入 Enginuity Bench，从中定义一个可
自动评分的文档与工程视觉任务，由统一平台完整维护数据、任务、配置、执行、日志、评分
和报告，并对比 Claude Code 与 Codex。本文调研结果用于最小闭环之后的任务扩展和
框架选型。

外部数据集不直接进入临时评测脚本，而是先登记为平台 `Dataset`，再由平台生成和维护
`TaskDefinition`。首个接入数据集确定为 Enginuity Bench；后续数据集沿用相同流程。

## 取舍结论

| 优先级 | 项目 | 建议 |
|---|---|---|
| 立即借鉴 | Inspect AI / Inspect Evals | 借鉴评测有效性、错误归因、scorer 和轨迹审查规范，不急于替换当前内核 |
| 首批复用 | BFCL、τ³-bench 文本 `base` 子集、本地工具任务 | 覆盖结构化工具调用、多轮策略遵循和错误恢复，成本相对可控 |
| 首个环境兼容 | Harbor + Terminal-Bench 2.1 | 做任务/结果兼容层，复用容器环境、验证器和 Agent 插件生态 |
| 第二批复用 | WebArena-Verified Hard、SWE-bench 小子集 | 有程序化验证和真实任务价值，但环境、成本和污染治理更复杂 |
| 后期专项 | OSWorld 2.0、WorkArena、AndroidWorld | GUI/企业/移动任务价值高，但部署重，不适合作为 MVP 依赖 |

框架首轮只选原生 ReAct、OpenAI Agents SDK、LangGraph 和一个代码行动范式基线。
Google ADK、Pydantic AI、Microsoft Agent Framework 可作为第二轮；AutoGen 新项目应优先
转向其官方后继 Microsoft Agent Framework。CrewAI 适合后续多 Agent 产品形态实验，
不适合作为最初的控制变量基线。

## 评测基础设施

| 项目 | 值得借鉴 | 对 xAgent 的启示 |
|---|---|---|
| [Harbor](https://github.com/harbor-framework/harbor) | 统一运行多类 Agent；容器任务；本地/云端并发；也服务 RL rollout | 中期优先做兼容或转换层，避免自建一套不兼容的容器任务标准 |
| [Inspect AI](https://inspect.aisi.org.uk/) | solver/scorer/模型解耦，日志查看，Agent 与多 Agent 支持 | scorer 必须是一等对象；报告要能下钻到完整样本和轨迹 |
| [AgentBench](https://github.com/THUDM/AgentBench) | OS、DB、知识图谱、WebShop 等多环境；任务/Agent/客户端解耦 | 环境服务和 Agent 运行时应独立部署；不要假设所有任务资源需求相同 |
| [AgentCompass](https://github.com/open-compass/AgentCompass) | benchmark、harness 和 Docker 环境的配置化组合 | experiment matrix 和显式版本配置在最小闭环后进入 Phase 3 |

## 代表性任务与数据

| 项目 | 测什么 | 注意事项 |
|---|---|---|
| [Terminal-Bench 2.1](https://github.com/harbor-framework/terminal-bench) | 编译、服务部署、数据处理等真实终端长程任务 | 当前应通过 Harbor 运行；2.1 修复了 2.0 中一批任务，必须固定数据版本 |
| [BFCL](https://github.com/ShishirPatil/gorilla/tree/main/berkeley-function-call-leaderboard) | 单轮、多轮、并行工具调用，以及搜索、记忆、格式和错误恢复 | Apache-2.0 数据、程序化评价，适合做首批工具能力基线；它更偏模型/工具调用而非完整 Agent |
| [SWE-bench](https://github.com/SWE-bench/SWE-bench) | 真实 GitHub issue 的仓库级代码修复 | 环境构建昂贵；热门老任务有训练污染风险，结果必须记录数据版本 |
| [τ³-bench](https://github.com/sierra-research/tau2-bench) | Agent、模拟用户与工具环境的多轮交互；当前还扩展了语音和知识检索 | 首批只使用 Python 文本模式的 `base` 子集并固定版本；不要一开始安装语音/RAG扩展 |
| [GAIA](https://huggingface.co/datasets/gaia-benchmark/GAIA) | 搜索、浏览、文件、多模态和推理组成的通用助手任务 | 测试答案受控；附件、网络与网页变化会影响复现 |
| [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany) | 在模拟软件公司环境中执行长程知识工作 | 真实度高但运行成本高，适合后期系统能力评测 |
| [WebArena-Verified](https://github.com/ServiceNow/webarena-verified) | 自托管网站上的浏览器 Agent，提供审核任务、确定性评价和 Hard 子集 | 比原始 WebArena 更适合作为接入目标；仍需部署网站、浏览器和状态重置 |
| [OSWorld 2.0](https://github.com/xlang-ai/OSWorld-V2) | 长程真实桌面和多应用操作 | 发布物必须成套固定版本；任务/资产部分 gated，环境和视觉推理成本高 |
| [WorkArena](https://github.com/ServiceNow/workarena) | ServiceNow 上的企业知识工作 | 业务价值高但需要受控实例；适合后期企业 Agent 专项 |
| [AndroidWorld](https://github.com/google-research/android_world) | Android 模拟器中 20 个应用的动态任务 | 参数化任务利于防污染，但 Apple Silicon/Docker 环境和视觉运行成本较高 |

## Agent 框架候选

建议首轮在同一模型、同一任务和尽量等价的工具集合下比较：

- [OpenAI Agents SDK](https://github.com/openai/openai-agents-python)：轻量 agent loop、handoff、guardrail 和 tracing；
- [LangGraph](https://github.com/langchain-ai/langgraph)：显式状态图、持久化和可恢复流程；
- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)：多语言与企业集成方向；
- [Google ADK](https://github.com/google/adk-python)：工具、MCP/A2A、开发 UI、评测和多 Agent 较完整；
- [Pydantic AI](https://github.com/pydantic/pydantic-ai)：类型安全、结构化输出、模型无关和 OpenTelemetry 方向；
- [CrewAI](https://github.com/crewAIInc/crewAI)：角色/团队式多 Agent 编排；
- [smolagents](https://github.com/huggingface/smolagents)：代码 Agent 与轻量工具抽象；
- 无框架的自研 ReAct 基线：用于判断框架复杂度是否真的带来收益。

不同框架常包含不同默认 prompt、重试、上下文裁剪和工具 schema。比较时要同时报告两种
结果：一是“开箱即用表现”，二是“控制变量表现”。否则很容易把默认配置差异误当成模型
或框架能力差异。

## 建议的首批实验

1. **Enginuity 最小闭环**：接入一个版本化数据切片和可自动评分的任务，先对比 Claude
   Code 与 Codex，并验证平台能维护完整运行生命周期。
2. **协议 smoke test**：确定性小任务，验证各 adapter 的 I/O、错误和 token 记录。
3. **工具调用可靠性**：20–50 个本地可重置工具任务，加 BFCL 子集，统计成功率、无效调用和恢复次数。
4. **代码任务小样本**：选择许可明确、可稳定构建、近期创建的 issue，避免先承担完整
   SWE-bench 的成本。
5. **长程任务**：固定预算，记录检查点、重复动作、人工介入和终止原因。
6. **同模型跨框架 / 同框架跨模型**：每项至少多次运行，报告置信区间而非单点排行榜。

## 有价值但不直接复制的内容

- Inspect Evals 的有效性检查要求任务既有成功路径也有失败路径，scorer 必须衡量真实结果，
  并将 grader 故障与被测 Agent 失败分开。这些应直接转化为 xAgent 的任务审核清单。
- Terminal-Bench 每个任务包含 instruction、验证脚本和 oracle solution，适合参考为 xAgent
  的环境任务包格式；环境本身交给 Harbor 管理。
- WebArena-Verified 用网络轨迹和类型感知比较替代模糊字符串/LLM judge，并提供 258 项 Hard
  子集，适合控制早期浏览器评测成本。
- AndroidWorld 通过随机参数动态实例化任务，能降低死记答案和单一静态样本的问题。这个思想
  值得用于自建本地任务，即使暂不接入 Android 环境。
- OpenAI Agents SDK 的生命周期 hooks/tracing、LangGraph 的 checkpoint/store、Pydantic AI
  的结构化类型边界，都适合成为统一轨迹协议和恢复能力评测的参考，但不应照搬内部对象。

## 数据治理清单

- 来源 URL、上游 commit/version、许可与本地修改；
- train/dev/test 切分与答案可见性；
- 创建时间和潜在训练污染；
- PII、凭据、恶意内容与 prompt injection 风险；
- 环境镜像 digest、依赖锁、随机种子与网络快照；
- scorer 的误差、LLM judge 的模型/提示词/重复次数和人工复核流程。
