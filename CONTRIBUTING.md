# 贡献指南

## 本地开发

```bash
uv sync --extra dev
uv run pytest
uv run ruff check .
```

提交前请保证新增功能有测试，且不要提交 API Key、真实用户数据、`runs/` 或模型原始
隐私内容。

## 扩展约定

- 新 Agent 优先通过 `command` 协议桥接；通用且轻量的实现再考虑加入核心包。
- 新 scorer 必须是确定性的，或显式记录 judge 模型、prompt 与版本。
- 新 benchmark 必须说明来源、版本、许可、数据切分与潜在污染风险。
- 对外部环境有写操作的任务必须在一次性沙箱中执行。
