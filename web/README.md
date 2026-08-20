# xAgent 评测平台

长期目标是由一个平台维护任务版本、运行环境、Agent 配置、执行过程、日志、评分和
对比报告，并用公平评测持续指导自研 Agent 框架。

当前第一阶段将接入 Enginuity Bench，从中定义一个可自动评分的文档与工程视觉任务，
在相同条件下对比 Claude Code 与 Codex。现有页面只实现了任务范围、数据范围、Agent、
测试方案和评价指标的本地定义与保存；下一步是接入 Runner，让真实执行和结果也回到
同一个平台。

平台产品流程固定为：导入数据、生成任务、选择 Agent、统一执行、自动评分、对比分析，
再把结果用于开发自研 Agent，并让新版本回到平台继续测试。

页面和后端最终共同维护数据集、任务、Agent、实验、运行记录和结果六类对象。第一阶段
使用 Enginuity Bench，首批对照为 Claude Code 与 Codex。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。选择会自动保存到当前浏览器的 `localStorage`，也可以通过页面导入或导出 JSON；数据不会上传。

## 验证

```bash
npm run lint
npm test
```
