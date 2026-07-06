#!/usr/bin/env sh
set -eu

echo "Tavern Notes online installer"
echo "Keep your SillyTavern terminal running while installing."
echo

REPO_ZIP="https://github.com/kongkongmie/tavern-notes/archive/refs/heads/main.zip"
TMP_ROOT="${TMPDIR:-/tmp}/tavern-notes-online-$$"
ZIP_PATH="$TMP_ROOT/tavern-notes.zip"
EXTRACT_PATH="$TMP_ROOT/extract"

cleanup() {
    rm -rf "$TMP_ROOT"
}
trap cleanup EXIT INT TERM

download_file() {
    url="$1"
    output="$2"

    if command -v curl >/dev/null 2>&1; then
        curl -L "$url" -o "$output"
        return
    fi

    if command -v wget >/dev/null 2>&1; then
        wget -O "$output" "$url"
        return
    fi

    echo "[Tavern Notes] Missing curl or wget."
    echo "[Tavern Notes] Termux can install curl with: pkg install curl"
    exit 1
}

extract_zip() {
    zip_path="$1"
    output_dir="$2"

    if command -v unzip >/dev/null 2>&1; then
        unzip -q "$zip_path" -d "$output_dir"
        return
    fi

    if command -v python3 >/dev/null 2>&1; then
        python3 -m zipfile -e "$zip_path" "$output_dir"
        return
    fi

    echo "[Tavern Notes] Missing unzip or python3."
    echo "[Tavern Notes] Termux can install unzip with: pkg install unzip"
    exit 1
}

if ! command -v node >/dev/null 2>&1; then
    echo "[Tavern Notes] Missing node."
    echo "[Tavern Notes] Please start SillyTavern first, or install Node.js."
    exit 1
fi

mkdir -p "$TMP_ROOT" "$EXTRACT_PATH"

echo "[Tavern Notes] Downloading latest package..."
download_file "$REPO_ZIP" "$ZIP_PATH"

echo "[Tavern Notes] Extracting package..."
extract_zip "$ZIP_PATH" "$EXTRACT_PATH"

INSTALLER="$(find "$EXTRACT_PATH" -name install-tavern-notes.js -type f | head -n 1)"
if [ -z "$INSTALLER" ]; then
    echo "[Tavern Notes] install-tavern-notes.js was not found in the downloaded package."
    exit 1
fi

echo "[Tavern Notes] Running installer..."
node "$INSTALLER"

echo
echo "[Tavern Notes] Installation completed. Restart SillyTavern, then refresh the browser page."
