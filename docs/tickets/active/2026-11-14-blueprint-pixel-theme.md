# Ticket: 内置「蓝图像素」主题 + 通知占位修复

- 状态：等待本地验收
- 创建日期：2026-11-14
- 目标版本：不改版本号
- 发布权限：仅本地

## 目标

1. 修：主题槽改造把 `.tn-notice` 改成了占位的相对定位，顶栏下面空出一条约 44px 的空带。
2. 新增内置主题「蓝图像素」（id `blueprint-pixel`）：Win98 像素窗口皮，和酒馆本体的蓝图像素主题同一套设计语言；配色直接读酒馆根上的 `--px-*`，所以跟着酒馆日夜切换；没装那套主题时用夜间默认色。

## 允许修改

- `style.css`、`core/blueprint-pixel-theme.js`（新，唯一事实源）、`core/theme-presets.js`、`core/local-theme-repository.js`、`server-plugin/tavern-notes/index.js`、`server-plugin/tavern-notes/presets/blueprint-pixel.json`（新，由同一脚本生成）、`tests/theme-presets.mjs`、`tests/blueprint-pixel-preset.cjs`（新）

## 明确不做

- 不改用户已有主题文件、不切换用户的当前主题。
- 不动 Soft Neomorphism / Apple Glass。

## 验收条件

- [x] 在真实酒馆里临时套用（未保存）：桌面 1280、手机 375、夜 / 日（模拟酒馆日间 `--px-*`）都看过；主面板、「更多」菜单、笔记窗、主题对话框正常。
- [x] `node --test tests/*.mjs` 48/48；`tests/blueprint-pixel-preset.cjs` 校验前后端两份一致、Full 能列出 / 激活 / 不能删除。
- [ ] 用户重启酒馆后在主题面板里选「蓝图像素」，看日夜各一次；Lite 抽查一次。
