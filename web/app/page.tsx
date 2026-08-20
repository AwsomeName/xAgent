"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Phase = "首批" | "第二批" | "后续";
type TabId = "overview" | "datasets" | "agents" | "tasks" | "runs" | "results" | "settings";
type Choice = { id: string; name: string; category: string; description: string; phase: Phase; meta: string; count?: number };
type Protocol = { mode: "controlled" | "native"; variants: number; repeats: number; models: number; concurrency: number; timeout: number; maxSteps: number };
type PlanState = { tasks: string[]; datasets: string[]; agents: string[]; metrics: string[]; protocol: Protocol };
type RunRecord = { id: string; createdAt: string; status: "等待 Runner"; taskTemplates: number; agents: number; models: number; totalRuns: number };

const DATASETS: Choice[] = [
  { id: "local-fixtures", name: "Core-20 自建数据", category: "本地数据", description: "固定种子生成文件、代码仓库、数据库和模拟 API 状态。", phase: "首批", meta: "本地生成 / 可离线 / 无账号" },
  { id: "bfcl", name: "BFCL 子集", category: "工具调用", description: "函数调用、多轮和状态相关样本，用于工具选择能力校准。", phase: "首批", meta: "JSON / API 工具模拟" },
  { id: "tau3", name: "τ³ / τ-bench", category: "业务流程", description: "零售、航空等多轮工具交互及最终业务状态验证。", phase: "第二批", meta: "Docker / 模拟用户与工具" },
  { id: "terminal-bench", name: "Terminal-Bench / Harbor", category: "终端任务", description: "复杂终端任务及隔离容器，复用 Harbor 的运行接口。", phase: "第二批", meta: "Linux / Docker / KVM 可选" },
  { id: "swe-bench", name: "SWE-bench 子集", category: "真实仓库", description: "可稳定构建的真实软件缺陷，验证代码修复能力。", phase: "后续", meta: "镜像缓存 / 高磁盘占用" },
  { id: "webarena", name: "WebArena-Verified", category: "浏览器", description: "可验证的真实网页操作流程。", phase: "后续", meta: "多服务 Docker / 浏览器" },
];

const AGENTS: Choice[] = [
  { id: "native-react", name: "Native ReAct", category: "自研基线", description: "最小 Agent 循环和统一工具协议，作为控制组。", phase: "首批", meta: "Python / 低封装" },
  { id: "openai-agents", name: "OpenAI Agents SDK", category: "轻量 SDK", description: "工具调用、handoff 和 tracing。", phase: "首批", meta: "Python / API 模型" },
  { id: "langgraph", name: "LangGraph", category: "图式编排", description: "显式状态、节点、持久化和恢复机制。", phase: "首批", meta: "Python / 状态图" },
  { id: "smolagents", name: "smolagents", category: "代码 Agent", description: "比较代码式行动与结构化工具调用。", phase: "首批", meta: "Python / CodeAgent" },
  { id: "pydantic-ai", name: "Pydantic AI", category: "类型优先", description: "类型、依赖注入与结构化输出。", phase: "第二批", meta: "Python / Typed" },
  { id: "google-adk", name: "Google ADK", category: "工作流", description: "会话、工作流和多 Agent 生态对照。", phase: "第二批", meta: "Python / Workflow" },
  { id: "ms-agent-framework", name: "Microsoft Agent Framework", category: "企业生态", description: "企业集成、状态管理和多 Agent 编排。", phase: "后续", meta: ".NET / Python" },
];

const TASKS: Choice[] = [
  { id: "reasoning", name: "做题与推理", category: "Question Solving", description: "逻辑题、约束题、资料分析和有标准答案的综合题。", phase: "首批", meta: "答案与约束断言", count: 4 },
  { id: "debugging", name: "代码调试", category: "Debugging", description: "阅读项目、定位缺陷、修改代码并通过测试。", phase: "首批", meta: "pytest / diff", count: 4 },
  { id: "web-building", name: "网页开发", category: "Web Building", description: "根据需求实现管理页、表单和交互功能。", phase: "首批", meta: "DOM / Playwright 断言", count: 4 },
  { id: "data-work", name: "文件与数据处理", category: "Data Work", description: "处理 CSV、JSON、SQLite 和工作区文件。", phase: "首批", meta: "文件 / Schema 断言", count: 4 },
  { id: "tool-workflow", name: "工具与业务流程", category: "Tool Workflow", description: "调用模拟 API 完成退款、订单和排期。", phase: "首批", meta: "最终状态断言", count: 2 },
  { id: "recovery-safety", name: "异常恢复与安全", category: "Reliability", description: "处理超时、429、提示注入和越权操作。", phase: "首批", meta: "故障与规则断言", count: 2 },
  { id: "browser", name: "浏览器操作", category: "Browser Use", description: "在可复现网站中导航、检索、填表和提交。", phase: "第二批", meta: "浏览器状态", count: 6 },
  { id: "computer-use", name: "桌面操作", category: "Computer Use", description: "操作桌面应用和系统界面。", phase: "后续", meta: "视觉与状态检查", count: 4 },
];

const METRICS: Choice[] = [
  { id: "success", name: "任务成功率", category: "主指标", description: "最终产物或环境状态是否正确。", phase: "首批", meta: "确定性验证器" },
  { id: "partial", name: "部分完成度", category: "结果质量", description: "复杂任务中通过的断言比例。", phase: "首批", meta: "断言级得分" },
  { id: "stability", name: "稳定性", category: "可重复性", description: "同一配置多次运行的结果波动。", phase: "首批", meta: "方差 / pass@k" },
  { id: "safety", name: "安全违规率", category: "硬门槛", description: "越权、泄密和未确认破坏操作。", phase: "首批", meta: "排名前置门槛" },
  { id: "recovery", name: "恢复成功率", category: "可靠性", description: "故障注入后能否在预算内恢复。", phase: "首批", meta: "恢复率 / 副作用" },
  { id: "cost", name: "成本与 Token", category: "效率", description: "Token 用量和成功任务折算成本。", phase: "首批", meta: "$/成功任务" },
  { id: "latency", name: "延迟", category: "效率", description: "端到端耗时及 P50/P95。", phase: "首批", meta: "P50 / P95" },
  { id: "trajectory", name: "过程行为", category: "诊断", description: "工具调用、重复循环和人工接管。", phase: "第二批", meta: "只诊断，不排名" },
];

const TASK_EXAMPLES = [
  ["reasoning-001", "做题与推理", "解答多约束逻辑题并给出最终选项", "答案 + 约束断言", "Python"],
  ["debug-001", "代码调试", "修复一个失败的 Python 单元测试", "pytest", "Docker"],
  ["web-001", "网页开发", "按需求实现内部管理页面", "DOM + 交互断言", "Browser"],
  ["data-001", "文件与数据", "清洗订单 CSV 并生成汇总文件", "文件 + Schema", "Python"],
  ["workflow-001", "工具流程", "处理退款并同步更新工单", "最终业务状态", "Mock API"],
  ["safety-001", "安全", "识别文件中的提示注入并拒绝越权", "策略断言", "Workspace"],
];

const DEFAULT_PLAN: PlanState = {
  tasks: ["reasoning", "debugging", "web-building", "data-work", "tool-workflow", "recovery-safety"],
  datasets: ["local-fixtures", "bfcl"],
  agents: ["native-react", "openai-agents", "langgraph", "smolagents"],
  metrics: ["success", "partial", "stability", "safety", "recovery", "cost", "latency"],
  protocol: { mode: "controlled", variants: 3, repeats: 1, models: 1, concurrency: 4, timeout: 600, maxSteps: 30 },
};

const NAV: { group: string; items: { id: TabId; label: string; code: string }[] }[] = [
  { group: "工作区", items: [{ id: "overview", label: "概览", code: "OV" }] },
  { group: "评测定义", items: [{ id: "datasets", label: "数据", code: "DA" }, { id: "agents", label: "Agent 架构", code: "AG" }, { id: "tasks", label: "测试任务", code: "TS" }] },
  { group: "运行", items: [{ id: "runs", label: "测试执行", code: "RN" }, { id: "results", label: "测试结果", code: "RS" }] },
  { group: "配置", items: [{ id: "settings", label: "测试方案与指标", code: "ST" }] },
];

const STORAGE_KEY = "xagent-evaluation-plan-v2";
const RUNS_KEY = "xagent-local-runs-v1";
const phaseClass = (phase: Phase) => phase === "首批" ? "phase-now" : phase === "第二批" ? "phase-next" : "phase-later";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [plan, setPlan] = useState<PlanState>(DEFAULT_PLAN);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("配置已就绪");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const storedPlan = window.localStorage.getItem(STORAGE_KEY);
        const storedRuns = window.localStorage.getItem(RUNS_KEY);
        if (storedPlan) setPlan(JSON.parse(storedPlan) as PlanState);
        if (storedRuns) setRuns(JSON.parse(storedRuns) as RunRecord[]);
      } catch { setNotice("本地配置读取失败，已恢复默认值"); }
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  }, [plan, runs, loaded]);

  const taskTemplates = useMemo(() => TASKS.filter((item) => plan.tasks.includes(item.id)).reduce((sum, item) => sum + (item.count ?? 0), 0), [plan.tasks]);
  const estimatedRuns = taskTemplates * plan.protocol.variants * plan.protocol.repeats * plan.agents.length * plan.protocol.models;
  const updateGroup = (key: "tasks" | "datasets" | "agents" | "metrics", values: string[]) => { setPlan((current) => ({ ...current, [key]: values })); setNotice("配置已自动保存"); };
  const toggle = (key: "tasks" | "datasets" | "agents" | "metrics", id: string) => updateGroup(key, plan[key].includes(id) ? plan[key].filter((item) => item !== id) : [...plan[key], id]);
  const updateProtocol = <K extends keyof Protocol>(key: K, value: Protocol[K]) => { setPlan((current) => ({ ...current, protocol: { ...current.protocol, [key]: value } })); setNotice("测试参数已更新"); };

  const exportPlan = () => downloadJson("xagent-evaluation-plan.json", { schema: "xagent-evaluation-plan/v2", exportedAt: new Date().toISOString(), taskTemplates, estimatedRuns, ...plan });
  const importPlan = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const value = JSON.parse(await file.text()) as Partial<PlanState>;
      if (!value.tasks || !value.datasets || !value.agents || !value.metrics || !value.protocol) throw new Error();
      setPlan(value as PlanState); setNotice("方案已导入");
    } catch { setNotice("导入失败：文件格式无效"); }
    event.target.value = "";
  };
  const createRun = () => {
    const record: RunRecord = { id: `run-${new Date().toISOString().slice(0, 10)}-${String(runs.length + 1).padStart(2, "0")}`, createdAt: new Date().toLocaleString("zh-CN", { hour12: false }), status: "等待 Runner", taskTemplates, agents: plan.agents.length, models: plan.protocol.models, totalRuns: estimatedRuns };
    setRuns((current) => [record, ...current]); setNotice(`已创建 ${record.id}`);
  };
  const copyCommand = async () => {
    await navigator.clipboard.writeText("uv run xagent-eval run --dataset examples/datasets/core-20.jsonl --agent native-react --model FRONTIER_MODEL --output-dir runs");
    setNotice("CLI 启动命令已复制");
  };

  const counts: Partial<Record<TabId, number>> = { datasets: plan.datasets.length, agents: plan.agents.length, tasks: taskTemplates, runs: runs.length, results: 0, settings: plan.metrics.length };
  const titles: Record<TabId, [string, string]> = {
    overview: ["概览", "查看当前评测方案的组成和就绪状态。"],
    datasets: ["数据", "管理评测数据来源、接入阶段和运行环境。"],
    agents: ["Agent 架构", "选择参与对比的 Agent 实现；模型配置在测试方案中统一设置。"],
    tasks: ["测试任务", "定义要测试的能力类别，以及后续需要实现的具体任务模板。"],
    runs: ["测试执行", "检查本次运行组合，生成运行任务或复制 CLI 启动命令。"],
    results: ["测试结果", "查看运行历史、状态和评测结果。"],
    settings: ["测试方案与指标", "设置控制变量、运行预算以及结果评价方式。"],
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><span>xA</span><div><strong>xAgent</strong><small>评测控制台</small></div></div>
      <nav>{NAV.map((group) => <div className="nav-group" key={group.group}><p>{group.group}</p>{group.items.map((item) => <button className={activeTab === item.id ? "active" : ""} key={item.id} onClick={() => setActiveTab(item.id)}><span className="nav-code">{item.code}</span><span>{item.label}</span>{counts[item.id] !== undefined && <em>{counts[item.id]}</em>}</button>)}</div>)}</nav>
      <div className="sidebar-footer"><span className="status-dot" /><div><strong>本地模式</strong><small>{notice}</small></div></div>
    </aside>

    <main className="main-area">
      <header className="main-header">
        <div><p>方案 / xagent-core-v0.1</p><h1>{titles[activeTab][0]}</h1><span>{titles[activeTab][1]}</span></div>
        <div className="header-actions"><button onClick={() => importRef.current?.click()}>导入</button><input ref={importRef} type="file" accept="application/json" onChange={importPlan} hidden /><button onClick={exportPlan}>导出方案</button></div>
      </header>

      <div className="content-area">
        {activeTab === "overview" && <Overview plan={plan} taskTemplates={taskTemplates} estimatedRuns={estimatedRuns} runs={runs} onNavigate={setActiveTab} />}
        {activeTab === "datasets" && <SelectPage title="数据来源" items={DATASETS} selected={plan.datasets} onToggle={(id) => toggle("datasets", id)} onReplace={(ids) => updateGroup("datasets", ids)} columns={["类型 / 阶段", "数据集", "用途", "环境", "选择"]} />}
        {activeTab === "agents" && <SelectPage title="Agent 实现" items={AGENTS} selected={plan.agents} onToggle={(id) => toggle("agents", id)} onReplace={(ids) => updateGroup("agents", ids)} columns={["类型 / 阶段", "框架", "定位", "技术栈", "选择"]} />}
        {activeTab === "tasks" && <TasksPage selected={plan.tasks} onToggle={(id) => toggle("tasks", id)} onReplace={(ids) => updateGroup("tasks", ids)} />}
        {activeTab === "runs" && <RunsPage plan={plan} taskTemplates={taskTemplates} estimatedRuns={estimatedRuns} runs={runs} onCreate={createRun} onCopy={copyCommand} />}
        {activeTab === "results" && <ResultsPage runs={runs} />}
        {activeTab === "settings" && <SettingsPage plan={plan} onProtocol={updateProtocol} onToggle={(id) => toggle("metrics", id)} onReplace={(ids) => updateGroup("metrics", ids)} estimatedRuns={estimatedRuns} taskTemplates={taskTemplates} />}
      </div>
    </main>
  </div>;
}

function Overview({ plan, taskTemplates, estimatedRuns, runs, onNavigate }: { plan: PlanState; taskTemplates: number; estimatedRuns: number; runs: RunRecord[]; onNavigate: (tab: TabId) => void }) {
  const cards: [string, string | number, TabId, string][] = [["数据来源", plan.datasets.length, "datasets", "已选择"], ["Agent 实现", plan.agents.length, "agents", "参与对比"], ["任务模板", taskTemplates, "tasks", "计划实现"], ["预计运行", estimatedRuns, "runs", "当前组合"]];
  return <div className="overview-grid">
    <section className="stats-row">{cards.map(([label, value, tab, note]) => <button key={label} onClick={() => onNavigate(tab)}><span>{label}</span><strong>{value}</strong><small>{note}　→</small></button>)}</section>
    <section className="panel overview-plan"><PanelTitle title="当前方案" subtitle="首批基线实验" /><div className="plan-flow"><FlowItem no="01" label="数据" value={`${plan.datasets.length} 个来源`} ready={plan.datasets.length > 0} /><FlowItem no="02" label="Agent" value={`${plan.agents.length} 个实现`} ready={plan.agents.length > 0} /><FlowItem no="03" label="任务" value={`${taskTemplates} 个模板`} ready={taskTemplates > 0} /><FlowItem no="04" label="执行" value={`${estimatedRuns} 次运行`} ready={estimatedRuns > 0} /><FlowItem no="05" label="结果" value={runs.length ? `${runs.length} 个记录` : "暂无结果"} ready={false} /></div></section>
    <section className="panel environment-panel"><PanelTitle title="执行环境" subtitle="已确认的基础设施约束" /><dl><div><dt>运行节点</dt><dd>Linux / Ubuntu 24.04</dd></div><div><dt>隔离方式</dt><dd>Docker</dd></div><div><dt>模型调用</dt><dd>前沿 API 模型</dd></div><div><dt>GPU</dt><dd>不使用</dd></div><div><dt>并发</dt><dd>{plan.protocol.concurrency}</dd></div><div><dt>单任务超时</dt><dd>{plan.protocol.timeout} 秒</dd></div></dl></section>
    <section className="panel next-panel"><PanelTitle title="下一步" subtitle="按顺序完成" /><ol><li className="done"><span>1</span><div><strong>确认数据范围</strong><small>首批建议使用 Core-20 和 BFCL 子集。</small></div></li><li className="done"><span>2</span><div><strong>确认 Agent 架构</strong><small>先固定模型，比较 4 个 Agent 实现。</small></div></li><li><span>3</span><div><strong>实现 20 个任务模板</strong><small>从做题、调试、网页开发和数据处理开始。</small></div></li><li><span>4</span><div><strong>接入 Runner 并正式执行</strong><small>运行结果写入统一记录格式。</small></div></li></ol></section>
  </div>;
}

function SelectPage({ title, items, selected, onToggle, onReplace, columns }: { title: string; items: Choice[]; selected: string[]; onToggle: (id: string) => void; onReplace: (ids: string[]) => void; columns: string[] }) {
  return <section className="panel table-panel"><div className="table-toolbar"><div><strong>{title}</strong><span>已选 {selected.length} / {items.length}</span></div><div><button onClick={() => onReplace(items.filter((item) => item.phase === "首批").map((item) => item.id))}>使用首批配置</button><button onClick={() => onReplace([])}>清空</button></div></div><div className="data-table choice-table"><div className="table-head">{columns.map((column) => <span key={column}>{column}</span>)}</div>{items.map((item) => { const checked = selected.includes(item.id); return <button className={`table-row ${checked ? "selected" : ""}`} key={item.id} onClick={() => onToggle(item.id)}><span><b>{item.category}</b><i className={`phase ${phaseClass(item.phase)}`}>{item.phase}</i></span><span><strong>{item.name}</strong></span><span>{item.description}</span><span className="mono-cell">{item.meta}</span><span className={`table-check ${checked ? "checked" : ""}`}>{checked ? "✓" : ""}</span></button>; })}</div></section>;
}

function TasksPage({ selected, onToggle, onReplace }: { selected: string[]; onToggle: (id: string) => void; onReplace: (ids: string[]) => void }) {
  return <div className="stack"><SelectPage title="任务类别" items={TASKS} selected={selected} onToggle={onToggle} onReplace={onReplace} columns={["类别 / 阶段", "任务类型", "测试内容", "验证方式", "选择"]} /><section className="panel table-panel"><PanelTitle title="首批任务模板" subtitle="示例结构；下一步将在仓库中实现为可执行任务" /><div className="data-table example-table"><div className="table-head"><span>任务 ID</span><span>类别</span><span>任务描述</span><span>验证器</span><span>环境</span></div>{TASK_EXAMPLES.map((row) => <div className="table-row" key={row[0]}>{row.map((cell, index) => <span className={index === 0 ? "mono-cell" : ""} key={cell}>{cell}</span>)}</div>)}</div></section></div>;
}

function RunsPage({ plan, taskTemplates, estimatedRuns, runs, onCreate, onCopy }: { plan: PlanState; taskTemplates: number; estimatedRuns: number; runs: RunRecord[]; onCreate: () => void; onCopy: () => void }) {
  return <div className="runs-layout"><section className="panel run-config"><PanelTitle title="新建测试执行" subtitle="当前静态控制台可以生成运行记录和 CLI 命令；Runner 接入后再从这里直接启动。" /><div className="runner-status"><span /><div><strong>Runner 未连接</strong><small>执行服务接口尚未实现</small></div></div><div className="run-summary"><SummaryLine label="数据来源" value={`${plan.datasets.length} 个`} /><SummaryLine label="Agent 实现" value={`${plan.agents.length} 个`} /><SummaryLine label="任务模板" value={`${taskTemplates} 个`} /><SummaryLine label="数据变体" value={`${plan.protocol.variants} 组`} /><SummaryLine label="模型" value={`${plan.protocol.models} 个`} /><SummaryLine label="预计运行" value={`${estimatedRuns} 次`} strong /></div><div className="run-actions"><button className="primary-action" disabled={estimatedRuns === 0} onClick={onCreate}>创建待执行任务</button><button onClick={onCopy}>复制 CLI 启动命令</button></div></section><section className="panel queue-panel"><PanelTitle title="本地执行队列" subtitle={`${runs.length} 个任务记录`} />{runs.length === 0 ? <Empty title="队列为空" detail="创建一次测试执行后，运行记录会显示在这里。" /> : <div className="run-list">{runs.map((run) => <div key={run.id}><span className="run-status">{run.status}</span><strong>{run.id}</strong><small>{run.createdAt} · {run.taskTemplates} 模板 · {run.totalRuns} 次运行</small></div>)}</div>}</section></div>;
}

function ResultsPage({ runs }: { runs: RunRecord[] }) {
  return <section className="panel table-panel"><div className="table-toolbar"><div><strong>运行结果</strong><span>真实结果将在 Runner 写入报告后出现</span></div><button disabled>导出结果</button></div>{runs.length === 0 ? <Empty title="暂无测试结果" detail="先在“测试执行”中创建并运行测试。结果页不会展示虚构或示例成绩。" /> : <div className="data-table results-table"><div className="table-head"><span>运行 ID</span><span>状态</span><span>任务数</span><span>成功率</span><span>成本</span><span>创建时间</span></div>{runs.map((run) => <div className="table-row" key={run.id}><span className="mono-cell">{run.id}</span><span><i className="status-waiting">{run.status}</i></span><span>{run.totalRuns}</span><span>—</span><span>—</span><span>{run.createdAt}</span></div>)}</div>}</section>;
}

function SettingsPage({ plan, onProtocol, onToggle, onReplace, estimatedRuns, taskTemplates }: { plan: PlanState; onProtocol: <K extends keyof Protocol>(key: K, value: Protocol[K]) => void; onToggle: (id: string) => void; onReplace: (ids: string[]) => void; estimatedRuns: number; taskTemplates: number }) {
  return <div className="stack"><section className="panel settings-panel"><PanelTitle title="测试协议" subtitle="第一轮建议固定模型、提示、工具和预算，比较 Agent 架构。" /><div className="mode-switch"><button className={plan.protocol.mode === "controlled" ? "active" : ""} onClick={() => onProtocol("mode", "controlled")}><strong>控制变量</strong><small>统一模型、提示、工具和预算</small></button><button className={plan.protocol.mode === "native" ? "active" : ""} onClick={() => onProtocol("mode", "native")}><strong>原生最佳实践</strong><small>允许框架使用各自推荐配置</small></button></div><div className="parameter-grid"><NumberControl label="每模板数据变体" suffix="组" value={plan.protocol.variants} min={1} max={20} onChange={(v) => onProtocol("variants", v)} /><NumberControl label="每变体重复" suffix="次" value={plan.protocol.repeats} min={1} max={10} onChange={(v) => onProtocol("repeats", v)} /><NumberControl label="前沿模型数量" suffix="个" value={plan.protocol.models} min={1} max={6} onChange={(v) => onProtocol("models", v)} /><NumberControl label="并发运行" suffix="路" value={plan.protocol.concurrency} min={1} max={24} onChange={(v) => onProtocol("concurrency", v)} /><NumberControl label="单任务超时" suffix="秒" value={plan.protocol.timeout} min={60} max={3600} step={60} onChange={(v) => onProtocol("timeout", v)} /><NumberControl label="最大行动步数" suffix="步" value={plan.protocol.maxSteps} min={5} max={100} step={5} onChange={(v) => onProtocol("maxSteps", v)} /></div><div className="formula"><span>{taskTemplates} 任务模板</span><b>×</b><span>{plan.protocol.variants} 数据变体</span><b>×</b><span>{plan.protocol.repeats} 重复</span><b>×</b><span>{plan.agents.length} Agent</span><b>×</b><span>{plan.protocol.models} 模型</span><b>=</b><strong>{estimatedRuns} 次运行</strong></div></section><SelectPage title="评价指标" items={METRICS} selected={plan.metrics} onToggle={onToggle} onReplace={onReplace} columns={["层级 / 阶段", "指标", "定义", "统计方式", "选择"]} /></div>;
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div className="panel-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div>; }
function FlowItem({ no, label, value, ready }: { no: string; label: string; value: string; ready: boolean }) { return <div><span>{no}</span><div><strong>{label}</strong><small>{value}</small></div><i className={ready ? "ready" : ""}>{ready ? "✓" : "—"}</i></div>; }
function SummaryLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div><span>{label}</span><b className={strong ? "highlight" : ""}>{value}</b></div>; }
function Empty({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><span>∅</span><strong>{title}</strong><p>{detail}</p></div>; }
function NumberControl({ label, suffix, value, min, max, step = 1, onChange }: { label: string; suffix: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) { return <label className="number-control"><span>{label}</span><div><input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(clamp(Number(event.target.value), min, max))} /><small>{suffix}</small></div></label>; }
function downloadJson(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); }
