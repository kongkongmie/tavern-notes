# Ticket: 首条 User 输入自动添加开局标签

- 状态：等待本地验收
- 创建日期：2026-08-12
- 目标版本：不改版本号
- 发布权限：仅本地

## 目标

每个聊天中第一条 User 输入被自动记录为笔记时，自动添加 `开局` 标签；其他 User 输入不添加。

## 允许修改

- `core/user-input-model.js`
- `index.js` 中 User 输入上下文装配的最小片段
- `tests/user-input-model.mjs`
- 本 ticket

## 明确不做

- 不修改主题、美化、样式、主题制作器或主题测试。
- 不回填已有历史笔记。
- 不增加设置开关。
- 不修改版本号，不提交或推送。

## 验收条件

- [x] 每个聊天第一条 User 消息自动记录时包含 `开局` 标签。
- [x] 同一聊天后续 User 消息不包含该自动标签。
- [x] 消息编辑或重复事件不会重复添加标签。
- [x] Full 与 Lite 走同一输入模型。

## 必须运行的测试

```bash
node --test tests/user-input-model.mjs
node --test tests/*.mjs
git diff --check
```

## 实现记录

- 与主题系统并行开发；修改范围不包含任何主题文件。
- 使用当前聊天中第一个 `is_user` 消息的位置判断开局，不写死消息编号。
- 自动标签只作用于新捕获的笔记，不回填历史数据。

## 验证结果

- `tests/user-input-model.mjs`：通过。
- 全部 `tests/*.mjs`：46 通过，0 失败。
- 本地 SillyTavern：相关前端文件已同步，等待用户实测。
- 提交/推送：未执行。
