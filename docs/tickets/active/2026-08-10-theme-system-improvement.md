# Ticket: 主题系统完善

- 状态：全量隔离视觉回归完成，等待登录态实机最终验收
- 创建日期：2026-08-10
- 目标版本：不改版本号
- 发布权限：仅本地

## 目标

在不使用 Shadow DOM、不大规模重写应用的前提下，建立“基础可视化变量 + 面板内高级 CSS + 少量安全装饰插槽”的主题能力；先恢复官方主题和控件隔离，再逐阶段扩展制作器、示例与作者文档。

## 当前证据

- 当前格式是 `format/version/name/author/variables/assets`，版本固定为 `1`。`theme-model` 会用默认主题补齐缺失的 `variables` 与 `assets`，因此简单旧主题可以自然继续工作。
- Lite 自定义主题保存在 `localStorage`，最多 20 个；Full 自定义主题保存在用户目录的 `themes/*.json`，激活 ID 单独保存。两端共用 `Theme Repository` 契约。
- 主题变量已经由 `theme-view.applyTheme()` 写到 `#tavern-notes-panel`，背景图片也写成面板内联变量；不存在把主题变量写到 `:root` 的现行路径。
- Full Server Plugin 与前端/Lite 分别重复维护默认主题和 Apple Glass，已经漂移：Server Plugin 默认主题缺少前端已有的 `--tn-panel-shadow`、输入框变量等，多个阴影值也不同；Server Plugin 的 Apple Glass 仍含卡片几何变量，而共享 preset 已明确不让主题改变笔记几何。Full/Lite 官方主题因此不能视为同一实现。
- 当前内置主题只有 Soft Neomorphism 与 Apple Glass。Secret Files/`archive` 的大量旧 CSS 和服务端主题函数仍留在源码，但它已被标记为 retired、从主题列表过滤，并把旧 ID 归一到默认主题；本 ticket 不擅自恢复或删除它。
- “融合当前酒馆主题”会读取页面最终计算样式和 `--SmartTheme*` 变量，生成独立 JSON 草稿；当前不会立即预览或覆盖活动主题，另存为使用 `activate: false`。现状基本符合草稿边界，但制作器按钮命名和“应用并保存”流程仍不够清楚。
- `style.css` 与 `shared/base.css` 中大量 `.tn-*` / `:is(.tn-*, .tnl-*)` 基础规则没有以面板根节点限定。类名前缀降低了碰撞概率，但尚未形成“所有内部主题 CSS 必须在面板内”的可验证不变量。
- 面板内部仍在 markup 中使用宿主外观类：搜索/编辑输入使用 `text_pole`，笔记操作和保存按钮使用 `menu_button`。这会让 SillyTavern 主题或第三方美化参与内部控件级联。插入 `#chat` 原生消息操作区的整层摘录/Quick Reply 按钮应继续保留宿主类与宿主样式。
- 现有主题制作器主要是三个范围控件、主题名和整份 JSON 文本框；手机仅把动作按钮改成单列，高级编辑器仍默认展开，也没有手机/桌面预览、动画总开关或可视化基础变量表单。
- 当前 CSS 没有面板 `container-type`，也没有主题制作器的 `@container` 预览基础；没有统一 `prefers-reduced-motion` 主题处理。
- 项目本身没有 `package.json`，本地 SillyTavern 的直接依赖和 lockfile 中也未发现 PostCSS、CSSTree、CSSOM、Lightning CSS 或 Stylis。阶段 3 已选用并 vendoring `css-tree 3.2.1` 的官方浏览器 ESM bundle（MIT），不依赖 CDN 或运行时安装。
- 现有主题测试覆盖模型补全、仓库契约、预览不落盘、融合草稿不激活、内置主题列表和变量替换；尚未覆盖 CSS AST 作用域、动画改名、危险规则、装饰插槽、控件去宿主类、移动预览和 reduced motion。

## 最小格式扩展方案

采用版本 `2`，保留现有字段及语义，只新增可选字段。V1 或没有新字段的主题继续由同一 `normalizeTheme` 路径补齐，不建立 migration 层。

```json
{
  "format": "tavern-notes-theme",
  "version": 2,
  "name": "主题名称",
  "author": "作者",
  "description": "",
  "variables": {},
  "assets": {
    "backgroundImage": ""
  },
  "customCss": "",
  "decorations": []
}
```

- `description`：可选纯文本。
- `variables`：继续只接受 `--tn-*`；基础制作器也只写变量，不另建一套设置格式。背景透明度、字号、按钮、输入框、卡片和类型色均以明确变量扩展。
- `assets`：延续当前对象。第一阶段保留现有键，资源验证集中处理 HTTPS、允许的 `data:image/*`、渐变与字体来源；不把任意 HTML 放入资源。
- `customCss`：可选字符串。保存/预览前解析为 AST、校验、作用域化并生成运行时 CSS；原始 CSS 留在主题 JSON 供继续编辑。
- `decorations`：建议保留为可选数组，因为伪元素无法可靠表达多层、可配置图片和可访问文本。每项最小结构为 `{ "slot", "type", "value", "className", "alt" }`；`slot` 只允许五个稳定插槽，`type` 只允许 `image/text/shape`，`className` 只允许安全短标识，禁止 HTML。
- 主题 ID 继续由 Full/Lite repository 管理，不复制进主题 JSON。运行时用 repository ID 生成安全的 `data-tn-theme-id`、动画名前缀和样式节点 ID。

这套扩展不要求转换当前简单主题。唯一需要单独处理的是两套重复的官方主题定义：应收敛到前端共享 preset 作为唯一事实源，而不是给用户主题建立兼容或 migration 系统。

## 高级 CSS 最小处理方案

- 引入一个浏览器可用、维护中的 CSS AST 库；优先验证 `css-tree` 的浏览器构建、体积、许可证和对现代 at-rule 的保真度，若验证不满足再选 PostCSS。不得手写复杂 CSS parser。
- 对普通规则的每个选择器增加当前面板与主题 ID 作用域：`#tavern-notes-panel[data-tn-theme-id="..."]`。`:scope` 映射到该根节点。
- 拒绝会尝试指定外部根或宿主节点的选择器，包括 `html`、`body`、`:root`、`#chat`、Tavern Notes 面板之外的宿主 ID，以及 Shadow DOM 穿透相关目标；不能因为最终“可能匹配不到”就静默接受。
- 允许并递归处理 `@media`、`@supports`、`@container`；面板设置稳定命名的 inline-size container。
- `@keyframes` 名称加主题 ID 前缀，并在 `animation` / `animation-name` 声明中通过 AST 同步改名。
- 允许 `@font-face` 的 HTTPS、允许的 data URL 与 `local()`；字体族名称也应按主题 ID 隔离，避免跨主题冲突。禁止 `@import`、脚本协议、`expression()`、行为绑定及其他可执行/可逃逸结构。
- 生成的 `<style>` 只服务当前面板；切换、预览、关闭预览和 destroy 时替换或移除，不累积样式节点。
- 动画总开关和 `prefers-reduced-motion` 由运行时在面板根节点统一压制主题 animation/transition，不修改主题原文。

## 允许修改

阶段 1 仅允许：

- `docs/tickets/active/2026-08-10-theme-system-improvement.md`

后续阶段预计按需修改（每阶段开始前再收窄）：

- `core/theme-model.js`
- `core/theme-runtime.js`
- `core/theme-presets.js`
- `core/local-theme-repository.js`
- `core/theme-repository.js`
- `features/theme-controller.js`
- `features/theme-view.js`
- `features/theme-studio.js`
- `features/app-shell-markup.js`
- `core/note-card.js`
- `shared/base.css`
- `style.css`
- `index.js` 中主题常量、装配与相关四语言文本
- `server-plugin/tavern-notes/index.js` 中主题保存、校验与官方 preset 来源
- 新增单一职责的 CSS 解析/作用域模块及其 vendored 依赖文件（具体路径在阶段 3 确认）
- 相关 `tests/*theme*.mjs`、控件结构测试、Server Plugin 主题测试
- 阶段 8 的主题作者文档与示例主题

## 明确不做

- 阶段 1 不修改任何运行代码、样式、测试、版本号或发布文件。
- 不使用 Shadow DOM，不重写整个应用，不建立多层 design system、migration 或 fallback。
- 不允许 JavaScript、脚本/事件属性、任意 HTML、宿主节点修改或主题作用域逃逸。
- 不把插入 SillyTavern 原生消息操作区的整层摘录/Quick Reply 按钮纳入面板主题。
- Secret Files 的继续修复已按用户要求冻结；本阶段不再调整其专属视觉。
- 不提交、不推送；每阶段先同步到本地 SillyTavern 测试位置验证。

## 分阶段准备修改

1. 基础隔离：`style.css`、`shared/base.css`、内部控件 markup 与结构测试；变量继续只写面板根。
2. 格式与 runtime：theme model/runtime/controller/view、Full/Lite repository 校验、CSS AST 模块及测试。
3. 官方主题：消除 Full/Lite 重复 preset 来源，修复 Soft Neomorphism、Apple Glass，保留 retired 主题决策门。
4. 融合：把融合草稿接入新的基础字段、高级 CSS、装饰与明确的“应用并保存”。
5. 新官方主题：先只做一款展示纹理、装饰、轻动画、手机与 reduced-motion 的主题。
6. 制作器：单列触控表单、折叠高级编辑、两种宽度预览、错误定位、导入导出与动画开关。
7. 作者框架：格式、变量、稳定选择器、插槽、模板、示例和性能/安全文档。

## 验收条件

### 阶段 1

- [x] 指定文档与主题相关代码、repository、样式和测试已调查。
- [x] 当前格式、存储、官方主题漂移、融合行为、作用域风险、宿主类依赖、依赖现状和手机缺口已记录。
- [x] 给出不破坏简单主题的最小字段扩展与 CSS AST 处理边界。
- [x] 未修改运行代码、版本号，未提交或推送。

### 后续总体验收

- [ ] 主题变量、生成样式和装饰节点只存在于 `#tavern-notes-panel`；测试证明高级选择器不能影响面板外节点。
- [ ] 面板内部按钮、输入框、选择框和滑杆不依赖 SillyTavern 外观类；宿主消息操作区按钮仍跟随宿主样式。
- [ ] V1/简单 `variables + assets` 主题在 Full 与 Lite 中继续导入、保存、激活和导出。
- [ ] `customCss` 支持伪元素、渐变、filter、mask、transform、transition、animation、媒体/容器/支持查询和手机布局。
- [ ] 外部根选择器、脚本协议、HTML/JS 注入和宿主节点修改被拒绝，并返回可定位的 CSS 错误。
- [ ] keyframes、字体名和运行时 style 节点按主题 ID 隔离；切换/预览不残留。
- [x] Soft Neomorphism 与 Apple Glass 在 Full/Lite、桌面/窄屏/手机、日/夜组合下使用同一官方定义并适配当前组件。
- [ ] 融合只生成可编辑草稿；另存为不切换；只有“应用并保存”切换；保存结果不继续依赖 SillyTavern 变量。
- [ ] 制作器手机单列、控件可触摸、高级 CSS 默认折叠，提供手机/桌面预览且不依赖 hover。
- [ ] 动画总开关与 `prefers-reduced-motion` 生效；主题切换和滚动无明显性能回退。
- [ ] 装饰仅能进入五个稳定插槽，不能覆盖安全确认或系统操作按钮。
- [ ] Full/Lite 或桌面/移动端的必要组合已覆盖，未引入重复监听、数据丢失或无关界面变化。

### 阶段 2 第一轮

- [x] 顶部直接操作限制为最多四项，其余稳定收进“更多”，避免窄面板横向露出。
- [x] Full 面板建立按实际面板宽度生效的 inline-size container；窄面板将文件夹筛选恢复为横向四列。
- [x] Secret Files 标签栏保持单行横向滚动，并为边框、阴影保留上下空间。
- [x] 打开笔记详情时退出折叠阅读模式，并隐藏重复的面板关闭按钮。
- [x] 面板内部 markup 与笔记卡片不再使用 `text_pole` / `menu_button`；融合功能仍可读取宿主样式生成草稿。
- [ ] 完成所有基础样式的面板根作用域审计，并做真实桌面、窄屏和手机截图验收。

### 阶段 3 第一轮

- [x] V1 简单主题保持原版本；使用 `description/customCss` 的主题规范化为 V2。
- [x] `customCss` 在预览、保存、导入和应用路径中保留；保存前先完成 AST 解析与校验。
- [x] 普通选择器及 `@media/@supports/@container` 内选择器自动限定到当前面板和主题 ID。
- [x] 支持 `::before/::after`、渐变、filter、mask、transform、transition 与 HTTPS/data 图片。
- [x] `@keyframes` 名称及动画引用按主题 ID 改名；`@font-face` 字体名及引用按主题 ID 改名，支持 HTTPS 网络字体和 `local()`。
- [x] 拒绝 `html/body/:root/#chat`、Shadow DOM 穿透目标、`@import`、非 HTTPS/data:image URL、`behavior/-moz-binding/expression()`，并返回行列位置。
- [x] 当前主题只保留一个运行时 style 节点；切换到简单主题或 destroy 时移除。
- [x] 增加持久化“启用主题动画”总开关，并统一处理 `prefers-reduced-motion`。
- [x] 增加五个安全装饰插槽；只使用 JSON、DOM API 和白名单字段创建图片、文本或简单形状，不接受 HTML。
- [x] 制作器增加默认折叠的独立高级 CSS 编辑区，保存前显示 AST 校验结果，同时保留直接编辑整份 JSON 的能力。
- [x] 主题管理卡片和保存、另存、恢复、删除等恢复通道带稳定保护标记；末尾最小保护样式保证它们不会被高级主题隐藏或禁用。

### 基础制作器第一轮

- [x] 可视化编辑主背景、次级背景、正文、次要文字、强调色、字体、正文大小、圆角和三档阴影。
- [x] 可输入 HTTPS/data:image 图片或 CSS 渐变，并通过现有面板背景插槽控制独立透明度。
- [x] 基础控件改动即时预览并同步主题 JSON；未改动的控件不会覆盖手写 JSON 中的复杂变量。
- [x] 手机宽度使用单列布局，颜色和数值控件保持至少 40px 触控高度。

### 全量视觉回归（2026-08-29）

- [x] Soft Neomorphism 日间、Twilight Blue 夜间、Apple Glass 日间/夜间、Secret Files 修复版均完成桌面、窄屏、手机截图。
- [x] 主列表、主题制作器顶部/底部、编辑弹层和详情弹层均完成溢出、遮挡、控件可见性检查。
- [x] 浏览器控制台无新增错误，隔离夹具只使用合成笔记，不读取或修改真实笔记。
- [x] 150 个 Full/Lite 组合未发现需要修改运行代码的视觉回归；全量自动测试与截图矩阵均通过。

## 必须运行的测试

阶段 1（只改 ticket）：

```bash
git diff --check
```

后续各阶段至少运行：

```bash
node --test tests/theme-model.mjs tests/theme-runtime.mjs tests/theme-presets.mjs
node --test tests/theme-controller.mjs tests/theme-view.mjs tests/theme-studio.mjs
node --test tests/theme-repository.mjs tests/theme-repository-contract.mjs tests/local-theme-repository.mjs
node --test tests/theme-structure.mjs tests/theme-compat-node-smoke.mjs
node --test tests/*.mjs
git diff --check
```

涉及 Full 主题持久化/校验时追加相关 `tests/*.cjs`；涉及 DOM、手机、动画、字体、图片和 SillyTavern 主题污染时必须同步到本地 SillyTavern，并做真实桌面、窄屏、手机与 reduced-motion 验证。

## 实现记录

- 决定：采用可选 `description/customCss/decorations` 的最小 V2；不转换简单 V1 主题。
- 决定：高级 CSS 必须经过 AST 解析、校验、作用域化和动画/字体改名。
- 决定：建议保留五个有限装饰插槽；不允许任意 HTML。
- 修改：阶段 1 仅新增本 ticket。
- 修改：阶段 2 第一轮修复实际面板宽度响应、工具栏溢出、Secret Files 标签裁切、详情页重复关闭按钮，并移除面板内部宿主外观类。
- 修改：阶段 3 第一轮新增 `core/theme-css.js`，使用 vendored `css-tree 3.2.1` 完成 `customCss` AST 解析、校验、作用域、动画和字体改名，并接入 Full/Lite 共用主题模型、控制器和运行时。
- 修改：阶段 3 第二轮新增 `core/theme-decorations.js`，实现 `panel-background/header-decoration/card-decoration/empty-state-decoration/footer-decoration` 五个稳定插槽；装饰只通过 `createElement`、`textContent` 和经过校验的图片地址生成。
- 修改：主题制作器新增默认折叠的独立高级 CSS 编辑区、行列错误提示与实时校验；Full Server Plugin 同步保存和规范化 V2 的 `description/customCss/decorations`。
- 修改：阶段 3 第三轮仅保护主题管理卡片及保存、另存、恢复、删除等恢复通道；保护样式追加在用户 CSS 之后，不扫描或限制普通主题选择器。
- 修改：基础制作器第一轮直接读写现有 `variables + assets`，加入颜色、字体、正文大小、圆角、阴影、背景图片和透明度；不建立第二套主题配置模型。
- 回归与修复：背景插槽曾用通用直属子元素规则写入 `position: relative`，覆盖了详情、主题等弹层的绝对定位，造成页面进入普通文档流并穿模；已改为只提升 header/search/shell/footer 等正常内容区，并移除主题恢复样式中的 `display/position/z-index` 强制。
- 回归与修复：卡片/页眉/页脚插槽的同类子元素规则也覆盖了笔记侧边操作、变体按钮和淡出层的绝对定位，造成卡片异常留白与按钮跑位；已保留层级但不再改写 `position`。
- 回归与修复：基础滑杆补齐完整轨道/滑块外观，清除宿主背景图；背景地址改为完成编辑后预览，并补回 `repeating-*gradient` 支持。
- 主题修复：保留原 Secret Files 文件，另生成 V2 修复版；用主题自身 `customCss` 适配当前四项筛选、角色卡、笔记底部常驻操作栏和手机宽度，不再增加公共主题特例。
- Secret Files 复验修复：档案页眉旧层级高于所有 dialog，导致制作器穿模；已把页眉降到弹层之下。旧专属样式仍使用废弃的 `tn-archive-reading`，已统一为当前 `tn-reading-mode`，并避免保留滚动位置时重新打开面板立即折叠。
- Secret Files 制作器修复：旧的界面大小/悬浮按钮滑杆补齐背景图清除和强制轨道/圆形滑块样式；修复版 JSON 同步收紧阅读模式列表顶部留白。
- 未解决：卡片、按钮、输入框和笔记类型颜色的细分可视化设置，以及手机/桌面预览仍待实现；Secret Files 个别视觉问题按用户要求冻结。
- 视觉回归：在 `H:\酒馆笔记tavern notes\work\visual-regression` 建立不进入发布仓库的隔离夹具，直接加载当前工作树的真实 markup、CSS、主题编译器和 Secret Files V2 文件；覆盖 Full/Lite、5 种主题状态、3 种宽度、5 个界面面，共 150 例。
- 视觉回归结论：自动几何检查为 0 横向溢出、0 可见控件逃出面板、0 弹层控件碰撞；人工检查 15 张主题对照图，未发现需要修改运行代码的新回归。

## 验证结果

- 自动测试：全部 `tests/*.mjs`（含主题 CSS、插槽、制作器和视图覆盖）、`tests/secret-files-removal.cjs`、新增 `tests/theme-v2-server.cjs` 与相关 `node --check` 通过；全量 CJS 中既有 installer 版本断言 `2.0.5 !== 2.0.3` 未由本阶段处理，本阶段未改版本号。
- 静态检查：`git diff --check` 通过。
- 回归测试：新增断言，禁止背景插槽再次通过 `#tavern-notes-panel > :not(...)` 改写所有直属子元素；详情、通用弹层和主题视图测试通过。
- 回归测试：新增笔记卡片绝对定位、基础滑杆宿主隔离、背景地址事件和 repeating gradient 覆盖；全量测试再次通过。
- 主题验证：Secret Files 修复版 JSON 可解析，`customCss` 通过现有 AST 编译与作用域处理；等待导入后的桌面/手机视觉复验。
- Secret Files 第二次验证：弹层、阅读模式、主题切换和滑杆污染回归测试通过；全量测试通过，本地 HTTP 实际提供的 `index.js/style.css/theme-view.js` 与源文件 SHA-256 一致。
- 本地 SillyTavern：基础制作器第一轮前端、样式与 Full Server Plugin 默认资源字段已同步，关键文件 SHA-256 与源仓库一致；Server Plugin 改动需随下次 SillyTavern 重启加载。
- 用户验收：浏览器已访问本地 SillyTavern，但当前自动化浏览器停在 `/login`，没有可复用的登录状态，因此本轮不能算已完成登录后的界面、手机宽度和装饰视觉验收；Secret Files 暂不继续验收。
- 2026-08-30 隔离浏览器：150/150 组合通过，控制台 0 error；46 个 MJS、2 个主题 CJS、相关语法检查和 `git diff --check` 通过。源码、测试安装和本地 HTTP 提供的关键主题文件 SHA-256 一致。
- 登录态边界：Chrome 控制插件缺少配套 `browser-service.mjs` 路径，未修改插件环境；真实 SillyTavern 仍重定向到 `/login`。隔离结果证明当前源码渲染与响应式布局，不替代登录后的真实用户界面最终验收。
- 提交/推送：未执行。
