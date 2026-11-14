# Ticket: 建立仓库项目记忆

- 状态：完成
- 创建日期：2026-08-10
- 目标版本：不改版本号
- 发布权限：仅本地

## 目标

建立 `AGENTS.md → Design → Tickets → Current State → Known Issues` 的维护链路，让后续任务只读取当前 ticket 和必要项目状态。

## 允许修改

- `AGENTS.md`
- `README.md`
- `docs/`

## 明确不做

- 不修改运行代码、数据格式或版本号。
- 不提交或推送。

## 验收条件

- [x] 稳定规则、架构、当前状态和已知问题各自独立。
- [x] 提供 active/done ticket 工作流和可复制模板。
- [x] README 提供维护入口。
- [x] 历史 refactor 文档不再被当作当前事实来源。

## 验证结果

- 文档入口与相对链接检查通过。
- `git diff --check` 通过。
- 未改运行代码，因此未重复运行功能测试。
- 未提交、未推送。
