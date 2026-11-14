# Current State

最后核对：2026-11-14

## 发布状态

- 主仓库：`https://github.com/kongkongmie/tavern-notes`
- 主分支：`main`
- 已发布版本：`2.0.5`（提交 `c97e81e`）
- 本地待发布：`3.0.0`，在本地 `tavern-notes-v3` 文件夹准备，用户测试通过并明确同意后才推送。
- 独立 Lite 仓库 `kongkongmie/tavern-notes-lite` 准备最终版 `1.0.0`（一键升级到主扩展），同样等用户同意后推送。

## 当前产品形态

- 只有一个版本，没有 Full/Lite 模式，没有 Server Plugin，没有安装器。
- 笔记、主题存在 `data/<user>/user/files/`，文件名以 `tavern-notes__` 开头：`manifest.json` 记录分片与备份，笔记按月份分片，主题一个文件，每天第一次写入时自动备份（保留 7 份）。
- 读写走 SillyTavern 自带的 `/api/files/upload`、`/api/files/delete` 和 `/user/files/<name>`，需要 SillyTavern 1.12.0 或更新。
- 分享卡导入的本地字体仍存在当前浏览器的 IndexedDB。
- 启动时自动检测 2.x 旧数据（Server Plugin 的 `/export.json`、浏览器 `tavern-notes-lite` IndexedDB），征得同意后迁移并逐条核对；旧数据只读。

## 自动验证基线

- `node --test tests/*.mjs` 全部通过（不再有 `.cjs` 测试）。
- 四语言完整性：`tests/i18n-completeness.mjs`；版本一致性：`tests/version-consistency.mjs`。

## 本地测试位置

当前维护环境使用：

```text
H:/sillytavern/SillyTavern/public/scripts/extensions/third-party/tavern-notes
```

不要在代码、测试或公开文档中依赖这个绝对路径。

## 下一任务如何开始

1. 从 `docs/tickets/TEMPLATE.md` 新建一个 active ticket。
2. 只更新 ticket 涉及的状态和代码。
3. 先本地测试，不默认推送。
4. 完成后移动 ticket，并按事实更新本文件。
