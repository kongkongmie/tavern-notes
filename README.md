# 酒馆笔记 / Tavern Notes

酒馆笔记是一个给 SillyTavern 使用的本地笔记扩展。
它会按角色卡保存两类内容：

- User 输入：自动记录你发出去的用户消息，方便隔很久以后快速找回、复制、重新放回输入栏。
- 摘抄：保存你在聊天页面选中的文字，支持查看、复制、分享成图片。

数据按你选择的模式保存到当前 SillyTavern 用户自己的 `data/<用户>/tavern-notes/` 文件夹，或当前浏览器原有的 `tavern-notes-lite` IndexedDB。两种模式都不写入世界书，也不会自动发给模型。

## 功能

- 自动记录 User 输入，并可折叠连续重复内容、忽略固定指令、预览后清理历史重复。
- 保存当前页面选中文字为摘抄。
- 按全部、角色、User 输入、摘抄筛选。
- 按角色浏览，并显示角色头像。
- 搜索笔记、角色和聊天。
- User 输入支持同一楼的多个版本左右切换。
- 笔记操作：输入、复制、分享、删除。
- 分享卡：把摘抄或输入做成图片，支持主题、背景色、字体名、网络字体 CSS。
- 导出笔记：JSON 备份格式，TXT 清爽阅读格式。
- 自动备份：新增或删除笔记后，会在本地覆盖保存一份最新备份。
- 主题：默认主题、主题导入导出、主题文件夹。
- 多语言：简体中文、繁体中文、English、한국어，可跟随酒馆语言。
- 手机辅助：可选侧边上下翻页按钮。

## 安装方式

第一次安装请阅读：[Tavern Notes 2.0.0 新用户详细安装指南](docs/新用户安装指南.md)。

酒馆笔记现在采用统一前端。新用户只需安装一次，首次打开时选择保存方式：

- **Full 文件模式**：把笔记保存到 SillyTavern 用户数据目录，支持自动备份和完整主题工具，需要安装一次 Server Plugin。
- **Lite 浏览器模式**：把笔记保存到当前浏览器的 IndexedDB，不需要 Server Plugin，手机和受限环境也能直接使用。

两种模式的数据彼此独立。切换模式不会迁移或删除笔记；需要迁移时请使用 JSON 导出和导入。旧 Full 文件和旧 Lite IndexedDB 的位置都保持不变。

推荐使用 SillyTavern 自带的 Git 扩展安装器。这样以后可以直接检查更新，不需要反复下载压缩包。

### 推荐：在酒馆里粘贴 Git 地址安装

1. 打开 SillyTavern 顶部的“扩展”面板。
2. 进入“安装扩展 / Install extension”。
3. 粘贴这个 GitHub 地址：

```text
https://github.com/kongkongmie/tavern-notes
```

4. 安装完成后，按首次启动页面选择 Full 或 Lite。

选择 Lite 后可以直接使用。选择 Full 后，后端安装器只需要首次运行一次，用来安装 `server-plugin/tavern-notes` 并开启 `enableServerPlugins`。

Windows：

```text
SillyTavern/public/scripts/extensions/third-party/tavern-notes/install-server-plugin.bat
```

安卓 Termux / Linux / Mac / 云服务器：

```bash
node SillyTavern/public/scripts/extensions/third-party/tavern-notes/install-server-plugin.js
```

选择 Full 时，看到“安装完成”后重启 SillyTavern，然后刷新浏览器页面。选择 Lite 时不需要安装后端或重启服务。

以后统一前端可以跟随 SillyTavern 的扩展更新提示更新。Full 后端插件通常不需要更新；如果某个版本明确写了“需要更新后端插件”，再重新运行一次后端安装器即可。

原 `tavern-notes-lite` 仓库继续为现有 Lite 用户提供兼容更新和应急安装，但新用户无需同时安装两个扩展。

### 不方便用 Git 时：单文件安装器

如果你的设备没有 Git，或者不会使用 SillyTavern 的扩展安装器，可以用这个备选方式。

Windows / PC：

1. 先让 SillyTavern 保持运行，也就是酒馆黑窗不要关。
2. 下载 `Tavern-Notes-Installer.bat`。
3. 双击运行。

这个安装器会自动联网下载最新版酒馆笔记，然后完成前端和后端安装。

如果没有识别成功，它才会要求你输入 SillyTavern 根目录路径。

看到“安装完成”后，重启 SillyTavern，然后刷新浏览器页面。

### 离线包安装

1. 到 GitHub Release 下载当前版本的完整 `tavern-notes-*.zip`。
2. 解压压缩包。
3. Windows 用户直接双击最外层的：

```text
Tavern-Notes-Installer.bat
```

压缩包里也会有 `tavern-notes` 文件夹，那是安装器使用的文件，不需要普通用户手动翻找。

完整压缩包是离线包。只要已经下载并解压，安装时不需要再联网。

看到“安装完成”后，重启 SillyTavern，然后刷新浏览器页面。

### 安卓 Termux / Linux / Mac / 云服务器备选安装器

推荐保持 SillyTavern 正在运行，然后在 Termux 或服务器终端里粘贴这一行：

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/kongkongmie/tavern-notes/main/install-online.sh)"
```

如果设备没有 `curl`，可以用：

```bash
wget -O - https://raw.githubusercontent.com/kongkongmie/tavern-notes/main/install-online.sh | sh
```

离线安装也可以。下载完整压缩包并解压后，进入解压出来的 `tavern-notes` 文件夹，运行：

```bash
sh install-tavern-notes.sh
```

看到“安装完成”后，重启 SillyTavern，然后刷新浏览器页面。

### 安装器会做什么？

安装器会自动完成这些事：

- 找到 SillyTavern 根目录。
- 把前端扩展复制到 `SillyTavern/public/scripts/extensions/third-party/tavern-notes`。
- 把 `server-plugin/tavern-notes` 复制到 `SillyTavern/plugins/tavern-notes`。
- 如果旧的前端扩展已经存在，会先备份成 `tavern-notes.backup-时间`。
- 如果旧的后端插件已经存在，会先备份成 `tavern-notes.backup-时间`。
- 备份 `config.yaml`。
- 把 `enableServerPlugins` 改成 `true`。

安装器不会删除你的笔记数据。

## 更新方式

如果你是通过 SillyTavern 的“安装扩展 / Install extension”粘贴 GitHub 地址安装的：

- 前端扩展会跟随 SillyTavern 的扩展更新机制提示更新。
- `manifest.json` 已开启 `auto_update`。
- 酒馆笔记也会在启动后检查 GitHub 最新版本；发现新版本时会提示你更新。
- 正常小版本更新只需要在酒馆扩展面板里更新前端，不需要重新安装。

如果你最初是通过 `.bat`、`.sh` 或 zip 安装器安装的：

- 也可以直接在 SillyTavern 里用 GitHub 地址重新安装一次前端，之后就能走酒馆扩展更新。
- 后端插件保留原来的即可。
- 如果版本说明写了“需要更新后端插件”，再重新运行一次安装器。

如果你只想手动覆盖更新，也可以继续使用 `Tavern-Notes-Installer.bat` 或 `install-online.sh`。它不会删除已有笔记。

### 检查是否成功

进入聊天页面后，工具栏或悬浮位置会出现酒馆笔记入口。

打开酒馆笔记面板后，标题旁会显示当前保存方式。Full 文件模式底部显示“已连接”代表前后端正常；Lite 浏览器模式显示 IndexedDB 状态即可直接使用。

如果提示“后端未连接”或“找不到酒馆笔记后端”，请检查：

- 是否运行过安装器。
- `SillyTavern/plugins/tavern-notes/index.js` 是否存在。
- `config.yaml` 里是否有 `enableServerPlugins: true`。
- 修改配置后是否重启过 SillyTavern。
- 浏览器页面是否刷新过。

## 数据位置

酒馆笔记按 SillyTavern 登录用户分别保存。

```text
SillyTavern/data/<当前用户>/tavern-notes/
├── index.json
├── notes-0001.jsonl
├── themes/
├── exports/
├── cards/
└── backups/
```

例如：

```text
SillyTavern/data/default-user/tavern-notes/
SillyTavern/data/li/tavern-notes/
```

自动备份文件固定覆盖写入：

```text
SillyTavern/data/<当前用户>/tavern-notes/backups/tavern-notes-daily-backup.json
```

新增或删除笔记后会自动更新这份备份。它只保存在本地，不会上传。

## 分享卡字体

分享卡支持两种字体方式：

1. 本机已有字体：在“字体”里填字体名，例如 `SimSun`、`Microsoft YaHei`、`STDongGuanTi`。
2. 网络字体：在“字体地址或 @import”里粘贴字体 CSS 地址，然后点“导入字体”。

示例：

```text
https://fontsapi.zeoseven.com/488/main/result.css
```

也可以粘贴完整 CSS：

```css
@import url("https://fontsapi.zeoseven.com/488/main/result.css");
body { font-family: "STDongGuanTi"; }
```

网络字体需要浏览器能访问对应网站。

## 安全说明

酒馆笔记包含 SillyTavern Server Plugin。
Server Plugin 不是沙盒环境，理论上可以访问本机文件系统。请只安装你信任来源的版本。

酒馆笔记后端只在当前 SillyTavern 用户目录下创建和读写 `tavern-notes` 文件夹，用于保存笔记、主题和导出文件。

## 仓库

```text
https://github.com/kongkongmie/tavern-notes
```

## 当前版本

v2.0.2

- 修复同一角色因内部 ID 变化而被拆成多个角色分类的问题；现在会优先按稳定头像归并。
- 修复切换对话后“摘录整层”按钮可能失效的问题。
- Full 与 Lite 采用一致的共享卡片、主题运行时和更新中心核心，同时保留各自仓库、安装路径与存储方式。
- 重新设计笔记卡片、详情操作区、顶部图标栏及自适应“更多”菜单。
- 新增整楼摘录排除标签、正文标签直观设置和应用内版本更新页面。
- 移除内置 Secret Files 主题，并完善简中、繁中、英语和韩语界面。
- “记录输入”现在只控制自动采集，不再隐藏已有 User 输入或主动灵感笔记。
- 本版本同时更新前端与 Server Plugin；安装或更新后需要重启一次 SillyTavern。






