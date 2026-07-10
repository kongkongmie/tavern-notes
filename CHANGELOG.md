# Changelog

## 1.0.14

- Added automatic local daily backup after note changes.
- The backup is written to `data/<user>/tavern-notes/backups/tavern-notes-daily-backup.json` and is overwritten with the latest state.
- Improved backend connection and missing-plugin error messages, including automatic guidance when the backend is not installed.
- This version requires rerunning the backend installer to enable automatic backups.

## 1.0.13

- Added a beginner-friendly post-install guide that appears after installing from the SillyTavern extension installer.
- The guide explains the required backend installer step and provides one-click copy buttons for Windows and terminal commands.

## 1.0.12

- Added a built-in update reminder that checks the latest GitHub manifest and notifies users when a newer Tavern Notes version is available.
- The reminder works for both Git-installed users and installer-installed users, and limits repeated reminders for the same version.

## 1.0.11

- Added a floating launcher mode for users who do not want Tavern Notes occupying the input toolbar.
- Improved floating launcher positioning so it stays visible on narrow browser windows.
- Made toolbar action buttons more consistent across responsive widths.
- Added persistent local imported font storage for share-card generation.
- Refined share-card layout details, including the Móbái-style vertical date/header treatment.

## 1.0.10

- Added Simplified Chinese, Traditional Chinese, English, and Korean UI language support with a top-right language selector.
- Improved the theme editor layout, including a combined preview-and-save action that reads the current JSON editor content.
- Refined share-card themes, font-size controls, page buttons, theme isolation behavior, and dark/background presets.
- Fixed remaining untranslated labels and tooltips in the theme panel, share-card controls, and side page buttons.

## 1.0.9

- Added repository line-ending rules so shell installers stay compatible with Android, Linux, Mac, and cloud servers.

## 1.0.8

- Added one-line online installer for Android Termux, Linux, Mac, and cloud servers.
- Added offline shell installer guidance for the full zip package.
- Cleaned the local shell installer completion message.

## 1.0.7

- Improved online installer auto-detection of a running SillyTavern process.
- The online installer now scans parent processes, so it can find common Windows launches such as `Start.bat -> node server.js`.
- Fixed the case where the installer still asked for the SillyTavern root path even while SillyTavern was running.

## 1.0.6

- Renamed the one-file Windows online installer to `Tavern-Notes-Installer.bat`.
- Fixed Windows filename collision between `Install-Tavern-Notes.bat` and `install-tavern-notes.bat`.
- The zip package now uses `Tavern-Notes-Installer.bat` as the outermost install entry.

## 1.0.5

- Fixed Windows batch installers failing when `chcp` or `powershell` is missing from PATH.
- `Install-Tavern-Notes.bat` now uses the absolute Windows PowerShell path.
- Local batch installers no longer call `chcp`.
- Restored `install-tavern-notes.bat` as the local zip installer instead of the online installer.

## 1.0.4

- Added `Install-Tavern-Notes.bat` as a one-file Windows online installer.
- Added `install-online.ps1`, used by the one-file installer to download the latest package and run installation.
- Release zip packaging now places `Install-Tavern-Notes.bat` at the outermost level, with the extension files in a `tavern-notes` folder.
- Batch files now avoid Chinese text to prevent Windows CMD encoding issues.

## 1.0.3

- The all-in-one installer now tries to detect a running SillyTavern process before asking for a path.
- Windows users can keep the SillyTavern console running, then double-click `install-tavern-notes.bat` to complete installation automatically in most common setups.

## 1.0.2

- Added all-in-one installers: `install-tavern-notes.bat`, `install-tavern-notes.js`, and `install-tavern-notes.sh`.
- The all-in-one installer copies the frontend extension, installs the server plugin, backs up old files, backs up `config.yaml`, and enables `enableServerPlugins`.
- Users can now download the release zip, extract it, and run one installer instead of manually installing the frontend first.

## 1.0.1

- Added installer scripts for the required server plugin.
- Windows users can run `install-server-plugin.bat`.
- Android Termux, Linux, macOS, and cloud server users can run `install-server-plugin.js`.
- The installer copies `server-plugin/tavern-notes`, backs up existing plugin files, backs up `config.yaml`, and enables `enableServerPlugins`.

## 1.0.0

- First installable release.
- Save User inputs and selected excerpts per SillyTavern user.
- Browse notes by all notes, character, User input, and excerpt.
- Support character avatars, per-character views, and input variants.
- Copy, insert into input box, share, and delete notes.
- Export JSON backups and clean TXT reading files.
- Generate share-card PNG images with themes, backgrounds, local font names, and network font CSS.
- Include a default theme system with theme import/export.
- Include `server-plugin/tavern-notes` for local file storage.


