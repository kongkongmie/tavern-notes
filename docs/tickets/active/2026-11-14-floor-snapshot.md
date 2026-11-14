# Ticket: 整层长图（所见即所得）

- 状态：等待本地验收
- 创建日期：2026-11-14
- 目标版本：不改版本号
- 发布权限：仅本地

## 目标

楼层操作栏「摘录整层」旁多一个相机按钮「整层长图」：把这一整层（头像、名字、时间、状态栏、美化 HTML、同源 iframe）按屏幕上的样子截成一张长图下载，相当于滑动截图。

## 允许修改

- `features/capture-view.js`、`features/floor-snapshot-renderer.js`（新）、`core/floor-snapshot-model.js`（新）、`index.js`、`shared/base.css`、`vendor/modern-screenshot/`（新，MIT）、`tests/floor-snapshot-*.mjs`（新）

## 明确不做

- 不把图片存进笔记；收藏的笔记仍只存文字。
- 跨域 iframe 无法读取，截出来是空白。

## 验收条件

- [x] 真实酒馆（鹤山，8000+px、5 个状态栏 iframe）桌面 1100 宽与手机 375 宽各出图一次，与屏幕对照一致；约 18–21 秒。
- [x] 按钮→保存对话框→PNG 写入的完整路径跑通（测试时替换了保存对话框，没有真的下载）。
- [x] `node --test tests/*.mjs` 48/48。
- [ ] 用户实机：桌面点一次；iPhone 局域网访问点一次（Safari 未验证）。
