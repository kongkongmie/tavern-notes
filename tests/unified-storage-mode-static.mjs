import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const installer = fs.readFileSync(new URL('../install-tavern-notes.js', import.meta.url), 'utf8');
const storage = fs.readFileSync(new URL('../storage.js', import.meta.url), 'utf8');

assert.match(source, /from '\.\/storage\.js'/, 'unified entry must bundle the Lite repository adapter');
assert.match(source, /async function serverApi\(/, 'Full server adapter must remain available');
assert.match(source, /createRepositoryRouter\(\{[\s\S]*?liteRequest:\s*liteApi/, 'Lite mode must route note operations to IndexedDB');
assert.match(source, /showStorageModeChooser\(\)/, 'first launch must offer a storage choice');
assert.match(source, /shouldResumeFullMode\(\{ hasLegacySettings: hasLegacyFullSettings, totalNotes: status\.totalNotes \}\)/, 'existing Full users must reconnect while a fresh empty backend still leaves the choice to the user');
assert.match(source, /try \{ await serverApi\('\/status'\); \} catch \{ showBackendInstallGuide\(\); \}/, 'install hook must not show a false backend warning when Full is already connected');
assert.match(source, /data-storage-mode="full"/);
assert.match(source, /data-storage-mode="lite"/);
assert.match(source, /changeStorageModeWarning/, 'mode switching must warn that data is not migrated');
assert.match(source, /getLiteExport\(getLiteUserName\(\)\)/, 'Lite all-notes export must stay local');
assert.match(source, /tavern-notes-theme-open-folder[^\n]*classList\.toggle\('tn-hidden', isLite\)/);
assert.match(storage, /const DB_NAME = 'tavern-notes-lite'/, 'unified Lite mode must reconnect the existing Lite database');
assert.match(storage, /url\.pathname === '\/import' && method === 'POST'/, 'Full UI JSON import must route into Lite IndexedDB');
assert.match(installer, /copyDirectory\(sourceDirectory, target\)/, 'the installer must copy the bundled storage adapter');

console.log('Unified Full/Lite storage-mode static test passed.');
