---
"r2-explorer": minor
---

## 中文本地化 + Vercel 风格 UI + HTTP 元数据修复

### 用户可见改动

- **全面汉化界面**：左侧栏、顶部栏、文件列表、右键菜单、对话框、通知与登录页等所有面向用户的英文文案均已替换为中文。HTML `lang` 也已改为 `zh-CN`。
- **UI 视觉刷新**：换上 Vercel 风格的黑白灰主色板与 Inter 字体，弱化阴影并细化边框；左侧栏按钮、表格、面包屑等均做了相应调整，整体更克制干净。
- **Markdown 预览更好看**：解析器从手写正则换成 [`marked`](https://github.com/markedjs/marked) 并配上 GitHub 风格样式（标题分隔线、引用、代码块、表格、行内代码），HTML 输出在前端做了一层轻量消毒（移除 `<script>` / 内联事件 / `javascript:` URL）。
- **HTTP 元数据键名修复**：以前在「编辑元数据」里手动写 `Content-Type` 是不生效的——R2 SDK 只识别 `contentType` 这种驼峰键名，其它形式会被静默丢弃。现在 Worker 端会自动把常见的 HTTP 头风格写法（`Content-Type`、`content-type`、`Cache-Control` 等）映射为正确的 R2 字段；对话框内同时新增了下拉提示，列出受支持的 6 个键：`contentType` / `cacheControl` / `contentDisposition` / `contentLanguage` / `contentEncoding` / `cacheExpiry`。

### 兼容性

- API 路由、Worker 配置、部署脚本与现有变量/函数名均未改动，已部署实例直接拉取新代码即可。
- 元数据键名规范化是纯加性的：已经在用驼峰键名的调用方仍按原样转发到 R2，无需调整。
