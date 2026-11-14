# Tavern Notes 开发入口

本文件保存长期稳定的开发规则。不要把临时进度、单次排查记录或长篇历史写进这里。

## 每次任务的最小读取顺序

1. 阅读本文件。
2. 阅读用户指定的 ticket；若没有 ticket，先按 `docs/tickets/TEMPLATE.md` 建立一个短 ticket。
3. 阅读 `docs/CURRENT_STATE.md`。
4. 只有任务涉及架构边界时才读取 `docs/DESIGN.md` 的对应章节。
5. 只有任务命中风险项时才读取 `docs/KNOWN_ISSUES.md`。
6. 最后只搜索 ticket 所涉及的源码和测试，不要默认通读整个仓库。

入口链路：

`AGENTS.md → docs/DESIGN.md → docs/tickets/ → docs/CURRENT_STATE.md → docs/KNOWN_ISSUES.md`

## 实现规则

- 不保留向后兼容。过时实现直接删除，不增加兼容层、migration 或 fallback。唯一例外是 3.0 的一次性升级：`repositories/legacy-sources.js` 只读地取出 2.x（Server Plugin / 浏览器 IndexedDB）的旧笔记供迁移，不得往旧位置写入。
- 选择满足当前 ticket 的最简单实现，不做预防性抽象或多余配置。
- 先跑通最小端到端路径，再补边界和测试；不要为未完成的复杂度拆掉可运行路径。
- 保持关注点分离：纯规则放 `core/`，交互编排放 `features/`，存储与外部接口放 `repositories/`，生命周期放 `services/`。
- 优先使用项目已有依赖和浏览器/SillyTavern 已提供的能力；新增依赖前先确认现有能力不足。
- 架构决策必须能长期维护，不接受计划稍后推翻的临时层。
- 常见交互优先采用成熟产品和 SillyTavern 已验证的模式，不自创不必要的交互范式。
- 只有一个版本：笔记和主题通过 SillyTavern 自带的文件接口存成 `data/<user>/user/files/tavern-notes__*.json`。不要重新引入后端、存储模式或安装器。
- 不改变用户数据格式、存储位置或导入导出契约，除非 ticket 明确授权破坏性变更。
- 不自动推送。先同步到本地 SillyTavern 安装并由用户测试；用户明确批准后才能提交和推送。
- 发布时只修改统一主仓库 `kongkongmie/tavern-notes`。版本号、双语日志和清单必须一致。

## Ticket 必填内容

每项实现任务必须写明：

- 一个明确目标。
- 允许修改的目录或文件。
- 明确不做的内容。
- 可验证的验收条件。
- 必须运行的测试。
- 是否只做本地测试，还是已获准提交/推送。

任务完成后，把 ticket 从 `docs/tickets/active/` 移到 `docs/tickets/done/`，并只在确有变化时更新 Current State 或 Known Issues。

## 测试基线

按风险从小到大执行：

```bash
# 只运行与改动直接相关的测试
node --test tests/<相关测试>.mjs

# 前端完整自动测试
node --test tests/*.mjs

# 提交前
git diff --check
```

涉及真实 DOM、移动端、字体、图片导出、文件存储或 SillyTavern 扩展更新时，自动测试不能替代本地实机测试。

## 文档维护边界

- `docs/DESIGN.md`：只写稳定架构、数据流和不变量。
- `docs/CURRENT_STATE.md`：保持简短，只写当前版本的事实。
- `docs/KNOWN_ISSUES.md`：只写尚未解决的问题、限制和实机风险。
- `docs/tickets/active/`：当前正在做的任务，是单次任务的主要上下文。
- `docs/tickets/done/`：完成记录；不要在新任务中默认读取。
