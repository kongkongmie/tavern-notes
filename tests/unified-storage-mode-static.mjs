import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const themeController = fs.readFileSync(new URL('../features/theme-controller.js', import.meta.url), 'utf8');
const installer = fs.readFileSync(new URL('../install-tavern-notes.js', import.meta.url), 'utf8');
const storage = fs.readFileSync(new URL('../storage.js', import.meta.url), 'utf8');
const modeNoteRepository = fs.readFileSync(new URL('../repositories/mode-note-repository.js', import.meta.url), 'utf8');
const storageModeView = fs.readFileSync(new URL('../features/storage-mode-view.js', import.meta.url), 'utf8');
const storageModeController = fs.readFileSync(new URL('../features/storage-mode-controller.js', import.meta.url), 'utf8');
const systemStatusView = fs.readFileSync(new URL('../features/system-status-view.js', import.meta.url), 'utf8');
const httpAdapter = fs.readFileSync(new URL('../repositories/full-http-adapter.js', import.meta.url), 'utf8');

assert.match(source, /from '\.\/storage\.js'/, 'unified entry must bundle the Lite repository adapter');
assert.match(source, /createFullHttpAdapter/, 'Full server adapter must remain available');
assert.match(httpAdapter, /async function request\(/);
assert.match(source, /createModeNoteRepository\(\{[\s\S]*?lite:\s*createLiteNoteRepository/, 'Lite mode must route note operations through its IndexedDB Note Repository');
assert.match(modeNoteRepository, /validated\[getMode\(\)\]/, 'storage-mode selection must stay inside the Repository adapter layer');
assert.match(source, /UNIFIED_ONBOARDING_KEY = 'tavern-notes-unified-onboarding-v1'/);
assert.doesNotMatch(source, /needsUnifiedOnboarding[\s\S]{0,900}?settingsService\.update\(\{ storageMode: 'lite' \}\)/, 'first installation must not silently choose Lite');
assert.match(source, /if \(!state\.storageMode\) \{\s*storageModeController\.open\(\);\s*return;\s*\}/, 'first installation must open the Full/Lite choice');
assert.match(source, /shouldResumeFullMode\(\{ hasLegacySettings: hasLegacyFullSettings, totalNotes: status\.totalNotes \}\)/, 'existing Full users must still reconnect to their Full storage');
assert.match(source, /systemStatusController\.refresh\(\)/, 'install hook must check backend status through the System Status Controller');
assert.match(storageModeView, /data-storage-mode="full"/);
assert.match(storageModeView, /data-storage-mode="lite"/);
assert.match(systemStatusView, /await chooseLite\(\);[\s\S]*?overlay\.remove\(\)/, 'closing the install guide must keep or switch the user to Lite');
assert.match(source, /storageModeController\.select\('lite', \{ skipConfirm: true \}\)/, 'the install guide Lite path must not show a storage-switch warning');
assert.doesNotMatch(storageModeController, /storageMode === ['"](?:full|lite)/);
assert.match(source, /changeStorageModeWarning/, 'mode switching must warn that data is not migrated');
assert.match(source, /exportData:\s*getLiteExport/, 'Lite all-notes export must stay local behind the Note Repository');
assert.match(source, /const THEME_CAPABILITIES = Object\.freeze\(\{[\s\S]*?themeStudio:\s*true/, 'the unified Full product exposes Theme Studio through capabilities');
assert.match(source, /openThemeFolder:\s*state\.storageMode === 'full'/, 'Lite browser mode must not expose the Full theme folder action');
assert.doesNotMatch(themeController, /\bstorageMode\b/, 'the public Theme Controller must not branch on storage mode');
assert.match(storage, /const DB_NAME = 'tavern-notes-lite'/, 'unified Lite mode must reconnect the existing Lite database');
assert.match(storage, /url\.pathname === '\/import' && method === 'POST'/, 'Full UI JSON import must route into Lite IndexedDB');
assert.match(installer, /copyDirectory\(sourceDirectory, target\)/, 'the installer must copy the bundled storage adapter');

console.log('Unified Full/Lite storage-mode static test passed.');
