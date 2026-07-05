# Changelog

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
