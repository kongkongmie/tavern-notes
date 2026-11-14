# Tavern Notes Design

本文只描述长期稳定的结构。具体版本状态见 `CURRENT_STATE.md`，临时任务见 `tickets/active/`。

## 1. 产品边界

Tavern Notes 是 SillyTavern 的笔记扩展，只有一个版本：纯前端扩展，笔记和主题通过 SillyTavern 自带的文件接口保存在当前用户的 `data/<user>/user/files/` 里，不需要 Server Plugin。同一个 SillyTavern 的所有设备看到同一份数据。

## 2. 顶层结构

| 路径 | 职责 | 不应包含 |
| --- | --- | --- |
| `index.js` | 组合应用、注入依赖、连接 SillyTavern 事件 | 可复用业务算法、大段独立组件实现 |
| `storage.js` | 笔记业务规则：新增、同楼替换、分组、标签、去重、导入导出、备份入口 | 具体持久化方式 |
| `core/` | 纯模型、规范化、契约、状态计算 | DOM、网络请求、文件系统访问 |
| `features/` | controller/view 和用户操作流程 | 存储细节 |
| `repositories/` | SillyTavern 文件读写、笔记/标签/主题等仓库、2.x 旧数据只读来源 | 页面布局和交互状态 |
| `services/` | 应用启动、生命周期、设置服务、事件适配 | 具体页面 UI |
| `shared/`、`style.css` | 公共样式与主题变量 | 业务数据处理 |
| `tests/` | 模型、契约、静态结构和发布回归测试 | 生产时状态 |

## 3. 运行数据流

### 启动

`SillyTavern → index.js → application bootstrap → settings → theme file → feature controllers/views → 2.x 旧数据检测`

应用销毁必须通过生命周期注册表解除观察器、事件和动态节点，避免刷新或重载后重复监听。

### 笔记读写

`View → Feature Controller → Note Repository Contract → note-repository → storage.js（notesApi）→ st-file-note-backend → /api/files/*`

- controller 只依赖统一 note repository contract。
- `storage.js` 只管业务规则，持久化由 `configureNoteBackend()` 注入。
- `st-file-note-backend.js` 管 manifest、月份分片、每日备份；写入前先重读 manifest 合并其他设备的改动。

### 设置

`UI → settings-service → settings-model normalize → settings repository → app store → UI refresh`

新增设置时必须同时完成：默认值、规范化、状态映射、控件同步、四语言文案和测试。

### 动态聊天集成

整层摘录、选区摘录和 Quick Reply 都依赖 SillyTavern 动态 DOM。实现必须同时考虑：

- 初次挂载。
- `CHAT_CHANGED`。
- 消息节点或操作按钮组被替换。
- destroy 后完全解除监听。

对于会被宿主重建的按钮，优先采用稳定根节点上的事件委托，不把有效性绑定到一次生成的 DOM 节点。

## 4. 数据与存储不变量

- 笔记与主题位于 `data/<user>/user/files/`，文件名统一以 `tavern-notes__` 开头（酒馆的文件接口不允许子文件夹）。
- `tavern-notes__manifest.json` 是唯一索引：记录分片、修订号和备份；酒馆没有列目录接口，不要依赖文件名扫描。
- 笔记按 `createdAt` 的月份分片；一条改动只重写所在分片和 manifest。
- 每天第一次写入时生成一份完整备份，保留 7 份；恢复前先备份当前状态。
- JSON（`tavern-notes-export`）是可重新导入的备份格式；导入也接受 2.x Server Plugin 的 `tavern-notes-daily-backup`。TXT 是阅读格式。
- 2.x 旧数据只读：迁移前先保存一份来源快照，迁移后逐条核对；绝不写回或删除旧位置。
- 破坏性操作必须有明确确认，并在完成后刷新列表、计数和状态。

## 5. UI 与主题不变量

- 四种语言：简体中文、繁体中文、English、한국어；新增 key 必须全部补齐。
- 主题只通过受控变量和主题 runtime 应用，功能状态不能写进主题 JSON。
- 分享卡字体设置与主界面字号设置相互独立。
- 移动端布局必须使用真实窄宽度测试，不能只依赖静态 CSS 检查。

## 6. 更新与发布

- `manifest.json` 是远端最新版本的机器来源。
- `index.js` 的 `EXTENSION_VERSION` 是运行时版本来源。
- `CHANGELOG.md` 和 `CHANGELOG.zh-CN.md` 分别服务默认日志与中文作者注释。
- 发布前必须运行版本一致性、`node --test tests/*.mjs` 和 `git diff --check`。

## 7. 架构变更条件

只有以下情况才修改本文：

- 新增或删除顶层模块边界。
- 改变文件存储的数据流或职责划分。
- 改变持久化、导入导出或发布契约。
- 引入新的应用级依赖或生命周期机制。

普通功能、文案、样式和 bug 修复不应扩写本文。
