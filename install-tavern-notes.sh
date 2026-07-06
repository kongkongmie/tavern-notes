#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
node "$SCRIPT_DIR/install-tavern-notes.js" "$@"

echo
echo "If the installer says it completed, restart SillyTavern and refresh the browser page."