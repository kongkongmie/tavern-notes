#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
node "$SCRIPT_DIR/install-server-plugin.js" "$@"

echo
echo "如果上面显示“安装完成”，请重启 SillyTavern，然后刷新浏览器页面。"
