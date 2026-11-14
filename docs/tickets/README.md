# Tickets

Ticket 是单次实现任务的唯一主要上下文，用来避免每次重新理解整个仓库。

## 目录

- `active/`：正在实现或等待本地验收的任务。
- `done/`：已经完成并验证的任务。
- `TEMPLATE.md`：新任务模板。

默认只允许一个 active ticket。只有互不依赖、修改范围不重叠的任务才可并行。

## 生命周期

1. 从模板复制一个 ticket 到 `active/YYYY-MM-DD-short-name.md`。
2. 在写代码前填完目标、范围、验收条件和测试。
3. 实现过程中只更新事实、决定和验证结果，不粘贴冗长聊天记录。
4. 本地验证后，把状态改为“等待用户验收”。
5. 用户确认后，若获准则提交和推送。
6. 完成后移动到 `done/`；同步更新 Current State，解决的问题从 Known Issues 删除。

## 命名

使用日期和简短英文 slug：

```text
docs/tickets/active/2026-08-10-floor-capture.md
```

不要用“修复一下”“继续开发”之类无法搜索的名称。
