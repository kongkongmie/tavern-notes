# 酒馆笔记 / Tavern Notes

酒馆笔记是一个给 SillyTavern 使用的本地笔记扩展。
它会按角色卡保存两类内容：

- User 输入：自动记录你发出去的用户消息，方便隔很久以后快速找回、复制、重新放回输入栏。
- 摘抄：保存你在聊天页面选中的文字，支持查看、复制、分享成图片。

数据会写入当前 SillyTavern 用户自己的 `data/<用户>/tavern-notes/` 文件夹，不写入世界书，也不会自动发给模型。

## 功能

- 自动记录 User 输入。
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

酒馆笔记由两部分组成：

1. 前端扩展：显示按钮、面板和分享卡。
2. 后端插件：负责把笔记保存为本地文件。

推荐先用 SillyTavern 自带的 Git 扩展安装器安装前端。这样以后酒馆可以提示更新，不需要每次重新下载压缩包。

### 推荐：在酒馆里粘贴 Git 地址安装

1. 打开 SillyTavern 顶部的“扩展”面板。
2. 进入“安装扩展 / Install extension”。
3. 粘贴这个 GitHub 地址：

```text
https://github.com/kongkongmie/tavern-notes
```

4. 安装完成后，再运行一次后端安装器。

后端安装器只需要首次安装时运行一次，用来安装 `server-plugin/tavern-notes` 并开启 `enableServerPlugins`。

Windows：

```text
SillyTavern/public/scripts/extensions/third-party/tavern-notes/install-server-plugin.bat
```

安卓 Termux / Linux / Mac / 云服务器：

```bash
node SillyTavern/public/scripts/extensions/third-party/tavern-notes/install-server-plugin.js
```

看到“安装完成”后，重启 SillyTavern，然后刷新浏览器页面。

以后前端扩展可以跟随 SillyTavern 的扩展更新提示更新。后端插件通常不需要更新；如果某个版本明确写了“需要更新后端插件”，再重新运行一次后端安装器即可。

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

1. 到 GitHub Release 下载 `tavern-notes-v1.0.20.zip`。
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

进入聊天页面后，输入栏附近会出现酒馆笔记按钮。

打开酒馆笔记面板，底部状态如果显示“已连接”，就说明前端和后端都正常。

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

酒馆笔记 v1.0.20 的后端只在当前 SillyTavern 用户目录下创建和读写 `tavern-notes` 文件夹，用于保存笔记、主题和导出文件。

## 仓库

```text
https://github.com/kongkongmie/tavern-notes
```

## 版本

v1.0.20

- 支持直接编辑笔记正文，并为每条笔记添加、移除标签。
- 支持按标签搜索和筛选，提供最近/常用标签及独立的全部标签页面。
- 支持从所有相关笔记中安全移除某个标签，不会删除笔记。
- 编辑后的正文和标签会保留在搜索、统计、导入导出及每日备份中。
- Full 版更新后需要同步更新 Server Plugin，并重启一次 SillyTavern。






