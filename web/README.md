# xAgent 评测定义台

用于在正式运行评测前，定义并保存五类信息：任务范围、数据范围、Agent 框架、测试方案和评价指标。

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
