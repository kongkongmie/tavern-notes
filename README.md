# 酒馆笔记 / Tavern Notes

酒馆笔记是 SillyTavern 的笔记扩展。它按角色卡保存两类内容：

- **User 输入**：自动记录你发出去的消息，隔很久也能找回、复制、放回输入栏。
- **摘抄**：保存聊天里选中的文字或整层内容，可以查看、复制、做成分享图片。

笔记只存在你自己的 SillyTavern 里，不写入世界书，也不会发给模型。

## 安装

1. 打开 SillyTavern 顶部的「扩展」面板，进入「安装扩展 / Install extension」。
2. 粘贴：

```text
https://github.com/kongkongmie/tavern-notes
```

3. 安装完成后刷新页面就能用。

不需要后端、安装器，也不用重启酒馆。电脑、手机、云服务器装法都一样。需要 SillyTavern 1.12.0 或更新版本。

## 从 2.x 升级

在扩展面板里更新到 3.0.0 后刷新页面。酒馆笔记会自动找旧版的笔记：

- **用过 Full（装过后端）**：找到后端里的笔记，问你一次，搬过来并逐条核对。搬完会提示：`SillyTavern/plugins/tavern-notes` 这个后端文件夹已经用不到了，可以删掉再重启酒馆。不删也不影响使用。**请先搬完再删后端**，搬的时候要靠它读出旧数据。
- **用过 Lite 模式**：笔记在浏览器里，打开酒馆就会搬。在几个浏览器（比如电脑和手机）都用过的话，每个浏览器各打开一次，会合并到一起，重复的自动去掉。
- **装的是独立的「酒馆笔记 Lite」扩展**：把它更新到最新版，会弹出「一键升级」，点一下就会装好新版、删掉 Lite 并刷新。
- **已经先删了后端**：用「更多 → 导入导出笔记 → 导入 JSON 笔记」选择旧后端留下的每日备份 `data/<用户>/tavern-notes/backups/tavern-notes-daily-backup.json` 即可。

旧数据只读不改，搬完也原样保留。之后想再检查一次，可以点「更多 → 从旧版迁移」。

## 功能

- 自动记录 User 输入：同一楼重发或修改只保留最新一次；可以忽略固定指令，预览后清理历史重复。
- 选中文字摘抄、整层摘抄；整层还能导出成一张长图，状态栏等内容所见即所得。
- 按全部、角色、User 输入、摘抄筛选；按角色浏览并显示头像；搜索笔记、角色、聊天和标签。
- 标签、批量管理、编辑、复制、放回输入栏。
- 分享卡：把笔记做成图片，可换主题、背景、字体（本机字体或网络字体）。
- 导出 JSON（可重新导入）和 TXT（方便阅读）。
- 主题：默认、苹果玻璃、蓝图像素等内置主题，可导入导出，也可以在主题工坊里自己做。
- 简体中文、繁体中文、English、한국어。

## 数据存在哪里

笔记和主题存在 SillyTavern 当前用户自己的文件夹里，用酒馆自带的文件接口读写：

```text
SillyTavern/data/<用户>/user/files/
├── tavern-notes__manifest.json        索引
├── tavern-notes__notes-2026-11.json   笔记，按月份分文件
├── tavern-notes__themes.json          主题
└── tavern-notes__backup-2026-11-14.json  自动备份
```

- 同一个酒馆，电脑和手机看到的是同一份笔记。
- 每天第一次改动时自动备份一份，保留最近 7 份。在「更多 → 自动备份」里可以恢复，恢复前会先把当前笔记再备份一次。
- 备份 SillyTavern 的 `data` 文件夹时，笔记会一起备份。
- 分享卡导入的本地字体存在当前浏览器里。

## 开发与维护

- 开发规则：[AGENTS.md](AGENTS.md)
- 架构设计：[docs/DESIGN.md](docs/DESIGN.md)
- 当前状态：[docs/CURRENT_STATE.md](docs/CURRENT_STATE.md)
- 已知问题：[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)
- 任务流程：[docs/tickets/README.md](docs/tickets/README.md)

测试：`node --test tests/*.mjs`

## 当前版本

v3.0.0：只有一个版本，笔记存成酒馆里的文件，不再需要后端。详见 [CHANGELOG.md](CHANGELOG.md)。
