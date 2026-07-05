# 酒馆笔记后端插件 / Tavern Notes Server Plugin

这是酒馆笔记的 SillyTavern Server Plugin。

前端扩展负责显示界面，后端插件负责把笔记保存到本地文件。只装前端不能保存笔记。

## 安装位置

把整个 `tavern-notes` 文件夹放到：

```text
SillyTavern/plugins/tavern-notes/
```

确认存在：

```text
SillyTavern/plugins/tavern-notes/index.js
```

## 开启方式

在 SillyTavern 的 `config.yaml` 中开启：

```yaml
enableServerPlugins: true
```

修改后重启 SillyTavern。

## 数据位置

插件会按当前登录用户保存数据：

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

## 安全说明

Server Plugin 可以读写本地文件。请只安装可信来源。

酒馆笔记只读写当前用户目录下的 `tavern-notes` 文件夹，不写入世界书，也不会默认把笔记发送给模型。
