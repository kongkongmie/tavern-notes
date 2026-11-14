# Ticket: Full / Lite 合并为「文件模式」（免后端）

- 状态：已迁移用户数据并核对，等待用户在 Pake / 手机实机验收
- 创建日期：2026-11-14
- 目标版本：不改版本号（发版时需要大版本说明）
- 发布权限：仅本地（用户已批准方案：只保留新模式；迁移前先备份、迁移后逐条核对）

## 目标

笔记和主题不再依赖 Server Plugin，也不再存在浏览器里；改用 SillyTavern 自带的文件接口（`/api/files/upload`、`/api/files/delete`、`GET /user/files/<名>`）存到 `data/<用户>/user/files/`。手机电脑共用，每天自动备份，旧数据一键迁移。

## 设计

- 文件都以 `tavern-notes__` 开头（接口不允许子文件夹，也没有列目录）：
  - `manifest.json`：分片清单（每片 revision / 条数）、meta（nextSeq 等）、备份列表、lastBackupDay
  - `notes-YYYY-MM.json`：按创建月份分片；写入只重写受影响的分片
  - `backup-YYYY-MM-DD[-标签-时分秒].json`：每天第一次写入时自动整份备份，连同带标签的一共保留 7 份；「恢复」前先存一份 `before-restore`
  - `themes.json`：自定义主题与当前主题（同步式 KV，替代 localStorage）
  - `migration-source-*.json`：迁移时读到的原始数据原样留底
- 缓存：读取时先拿清单，只重新下载 revision 变了的分片；1.5 秒内的多次读取共用一次同步。写入前强制同步，写清单前再读一次清单合并，尽量保住另一台设备刚写的内容。
- 业务逻辑仍是 `storage.js` 的 liteApi（路由不变），只把持久化换成可插拔后端：`createStFileNoteBackend`（正式）/`createIndexedDbNoteBackend`（只给迁移读旧 Lite）。
- 运行时内部仍走 `state.storageMode === 'lite'` 这条路径，启动时强制设为 lite；界面上不再有 Full/Lite 选择，状态栏显示「文件模式」。
- 迁移（`features/legacy-migration.js`）：读旧 Full 的 `/export.json`（已套用编辑、排除删除）+ 旧 Lite IndexedDB → 留底 → 文件为空时按原 id / 时间原样写入，已有数据时走导入去重 → 重新从文件读回逐条核对（内容、类型、时间、标签、角色、聊天）→ 搬旧 Full 自定义主题和当前主题。旧数据只读不改。

## 验收条件

- [x] 自动测试：`node --test tests/*.mjs` 50/50（新增 `st-file-note-backend`、`legacy-migration`、`file-storage-static`）。
- [x] 用户真实数据：旧 Full 实际有效笔记 901 条 → 文件模式 901 条；插件自检逐条一致；另外在 VM 里直接读磁盘上的原始 jsonl + 编辑记录，算出的 SHA-256 与文件模式读回的内容完全相同。5 个自定义主题、当前主题（蓝图像素）都已搬过去。已存一份「迁移完成时的备份」。
- [ ] 用户在 Pake 和手机上各刷新一次，确认笔记、主题、自动记录正常；Lite 旧用户路径用测试覆盖，没有真机。
