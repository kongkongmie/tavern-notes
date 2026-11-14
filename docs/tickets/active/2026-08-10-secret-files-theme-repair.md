# Ticket: 恢复 Secret Files 自定义主题

- 状态：等待本地验收
- 创建日期：2026-08-10
- 目标版本：不改版本号
- 发布权限：仅本地

## 目标

让用户提供的 Secret Files V1 主题能够重新导入并启用现存的 `archive` 专属样式，同时补齐重构后新增的主题变量。

## 当前证据

- 两次实机截图证明只有变量生效，文件夹、编号页签与 INDEX 结构 CSS 未命中；活动 Full 主题文件本身已正确保存 `secret-files`。
- Lite repository 会按主题名称和 flavor 拒绝/清理 Secret Files。
- `style.css` 仍完整保留 `data-theme-flavor="archive"` 的专属组件、弹层层级和移动端样式。
- 原主题缺少面板阴影、输入框和分享滑杆共 10 个新变量。

## 允许修改

- `core/theme-runtime.js`
- `core/theme-presets.js`
- `core/local-theme-repository.js`
- `index.js`
- `tests/theme-runtime.mjs`
- `tests/local-theme-repository.mjs`
- 用户 Downloads 中的修复版主题 JSON

## 明确不做

- 不把 Secret Files 恢复成内置官方主题。
- 不修改现有 `archive` CSS、组件结构、版本号或发布文件。
- 不提交、不推送。

## 验收条件

- [x] runtime 按 flavor 或主题名给面板挂载稳定的 `.tn-secret-files-theme`；112 个档案专属选择器直接绑定该类。
- [x] Full/Lite 可保存自定义 Secret Files；旧内置 ID 仍不出现在官方列表。
- [x] 修复版覆盖当前 77 个面板主题变量。
- [x] 已同步本地 SillyTavern 安装。
- [ ] 用户完成登录后的桌面与手机视觉验收。

## 必须运行的测试

```bash
node --test tests/*.mjs
node --test tests/secret-files-removal.cjs
git diff --check
```

## 验证结果

- 自动测试：面板类修正后 44 个 MJS 通过；新增测试确认主题名会生成 `secret-files` flavor 与稳定面板类。
- JSON：解析通过，当前面板变量 77/77。
- 本地 SillyTavern：四个修改文件已同步并通过 SHA-256 对比；浏览器因登录页未完成视觉检查。
- 提交/推送：未执行。
