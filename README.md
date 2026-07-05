# 酒馆笔记 / Tavern Notes

酒馆笔记是一个给 SillyTavern 使用的本地笔记扩展。

它会按角色卡保存两类内容：

- User 输入：自动记录你发出去的用户消息，方便过很久以后快速找回、复制、重新放回输入栏。
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
- 主题：默认主题、主题导入导出、主题文件夹。
- 手机辅助：可选输入栏向下翻页按钮。

## 安装方式

酒馆笔记由两部分组成：

1. 前端扩展：显示按钮、面板和分享卡。
2. 后端插件：负责把笔记保存为本地文件。

只装前端会看到界面，但不能保存笔记。必须安装后端插件。

### 1. 安装前端扩展

在 SillyTavern 的扩展安装页面里，填入本仓库 Git 地址安装。

如果你手动安装，把整个仓库文件夹放到：

```text
SillyTavern/public/scripts/extensions/third-party/tavern-notes/
```

确认这个目录下有：

```text
manifest.json
index.js
style.css
README.md
server-plugin/
```

### 2. 安装后端插件

把本仓库里的：

```text
server-plugin/tavern-notes/
```

复制到你的 SillyTavern：

```text
SillyTavern/plugins/tavern-notes/
```

复制后应当能看到：

```text
SillyTavern/plugins/tavern-notes/index.js
```

### 3. 开启 Server Plugins

打开 SillyTavern 的 `config.yaml`，确认有：

```yaml
enableServerPlugins: true
```

修改后重启 SillyTavern。

### 4. 检查是否成功

进入聊天页面后，输入栏附近会出现酒馆笔记按钮。

打开酒馆笔记面板，底部状态如果显示“已连接”，就说明前端和后端都正常。

如果提示“后端未连接”或“找不到酒馆笔记后端”，请检查：

- `plugins/tavern-notes/index.js` 是否存在。
- `config.yaml` 是否开启了 `enableServerPlugins: true`。
- 修改配置后是否重启过 SillyTavern。
- 浏览器是否刷新过页面。

## 数据位置

酒馆笔记按 SillyTavern 登录用户分别保存。

```text
SillyTavern/data/<当前用户>/tavern-notes/
├─ index.json
├─ notes-0001.jsonl
├─ themes/
├─ exports/
├─ cards/
└─ backups/
```

例如：

```text
SillyTavern/data/default-user/tavern-notes/
SillyTavern/data/li/tavern-notes/
```

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

网络字体需要浏览器能访问对应网址。

## 安全说明

酒馆笔记包含 SillyTavern Server Plugin。

Server Plugin 不是沙盒环境，理论上可以访问本机文件系统。请只安装你信任来源的版本。

酒馆笔记 V1.0 的后端只在当前 SillyTavern 用户目录下创建和读写 `tavern-notes` 文件夹，用于保存笔记、主题和导出文件。

## 发布说明

当前公开仓库：

```text
https://github.com/kongkongmie/tavern-notes
```

发布 Release 时请继续提醒用户：本扩展需要额外安装 `server-plugin/tavern-notes`，并且不要把自己的 `data/<用户>/tavern-notes/` 数据上传到仓库。

## 版本

V1.0.0

- 第一个可分享安装版本。
- 内置默认主题和分享卡 V1。
- 支持本地文件保存、多用户目录、角色分类、输入版本、导出和分享卡。
