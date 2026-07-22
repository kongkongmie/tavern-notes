# Changelog

## 1.1.0

- Introduced shared note-card, theme-runtime, and update-center modules aligned with Tavern Notes Lite while preserving the existing Full repository, install path, and file-backed storage.
- Redesigned note cards for denser previews, clear User/excerpt color distinction, expandable full-detail reading, and direct actions from the detail view.
- Reworked the header into consistent icon controls with width-aware overflow: more actions appear when the panel is wide and move into the More menu when space is limited.
- Moved theme access into the top window toolbar and retired the built-in Secret Files theme, including cleanup of legacy active-theme selections and blocked re-import of the retired built-in file.
- Added whole-message exclusion tags and a directly visible body-tag editor for removing configured tagged blocks before capture.
- Added an in-app update center with version checks, the default changelog, and optional author-maintained Chinese annotations from `CHANGELOG.zh-CN.md`.
- Kept manual USER inspiration notes visible when automatic User input recording is disabled; the recording switch now controls capture only, not visibility.
- Reduced broad DOM rescans during selection, message, and toolbar observation to improve responsiveness while messages stream.
- Completed Simplified Chinese, Traditional Chinese, English, and Korean coverage for the new controls and states.
- This release updates both the frontend extension and Server Plugin. Reinstall/update the Full package and restart SillyTavern once.

## 1.0.23

- Added draggable floating launcher positioning with reset support.
- Added manual USER inspiration notes and global tag renaming.
- Reorganized the responsive toolbar into primary actions and an adaptive More menu.
- Added a day/night switch for the default theme with a redesigned Twilight Blue night mode.
- Refined narrow-screen icons, modal controls, note actions, tags, pagination, and Secret Files menu layering.
- This version updates the backend plugin; reinstall it and restart SillyTavern once after updating.

## 1.0.22

- Added automatic collapsing for consecutive identical User inputs with preserved repeat counts.
- Added searchable exact-match and prefix ignore-rule management for fixed Quick Reply commands.
- Added a review-first historical duplicate cleanup that shows every affected entry before confirmation.
- Limited cleanup confirmation to the groups shown in the preview and preserved repeat metadata through later edits.
- Refined the cleanup panel across desktop, mobile, light, and archive themes.

## 1.0.21

- Fixed mobile viewport drift that could move the top toolbar outside the visible screen.
- Kept Tavern Notes toolbar controls contained within the SillyTavern input bar on narrow screens.
- Replaced incompatible masked launcher icons with adaptive high-contrast PNG icons for light and dark themes.
- Isolated imported share-card font CSS so third-party styles cannot affect the SillyTavern interface.
- Completed localized export and share-card notifications in Simplified Chinese, Traditional Chinese, English, and Korean.
- This is a frontend-only update; Full users do not need to reinstall the backend plugin.

## 1.0.20

- Added editable note text and per-note tags, including removable tag chips and existing-tag suggestions.
- Added tag search, filtering, recent/common tags, and a dedicated tag library that scales to large collections.
- Added a guided empty state so tag controls remain discoverable before the first tag is created.
- Added safe global tag deletion that removes a tag from matching notes without deleting any notes.
- Preserved edited text and tags in JSON/TXT exports, imports, daily backups, search, counts, and character views.
- Refined tag-library and edit-dialog layouts across built-in themes and prevented SillyTavern themes from recoloring editor controls.
- Improved import/export wording, outdated-backend guidance, and Apple Glass theme-preview isolation.
- This version adds backend editing and tag routes. Full users must update the backend plugin and restart SillyTavern once.

## 1.0.18

- Added JSON backup import so notes can migrate between Tavern Notes Full and Lite without sharing storage.
- Added duplicate detection during import and imports large backups in smaller batches.
- Increased the maximum content length of a single note from 20,000 to 200,000 characters for long whole-message excerpts.
- Fixed whole-message capture returning only a collapsed summary such as `正文（8000+字）`; the user-configured body tag (default: `content`) is now recovered from the original message before visible-text fallback.
- When one message contains multiple matching body tags, their text is collected and merged in source order.
- This version updates the backend import and content-length handling, so rerun the backend installer and restart SillyTavern after updating.

## 1.0.17

- Added Apple Glass as a built-in theme, with day/night switching available from the main panel.
- Added Secret Files as a built-in theme so new installs can select it immediately without importing theme JSON.
- Added whole-message floor capture with a dedicated settings page and configurable body tag detection.
- Added an optional floating selection capture button for selected text, including rendered HTML blocks and input fields.
- Added fixed default launcher/capture icons that no longer change with custom themes.
- Refined share-card controls, including unified font-size slider styling across built-in themes.
- Removed redundant main-panel paging and refresh buttons while keeping internal list refresh behavior.
- Fixed several UI consistency issues in floating launcher, theme panels, share-card panels, and Secret Files layout.

## 1.0.16

- Added an optional `Record input` toggle for users who do not want Tavern Notes to automatically save sent User inputs.
- When input recording is disabled, User input notes are excluded from All notes, counts, character summaries, and the User input filter.
- Existing User input notes are not deleted; turning the toggle back on makes them visible again.
- This version updates backend filtering, so rerun the backend installer and restart SillyTavern after updating.

## 1.0.15

- Fixed the post-install backend guide on mobile so the full dialog starts inside the visible viewport and can scroll normally.

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



