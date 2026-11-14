import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const source = read('../index.js');
const storage = read('../storage.js');
const backend = read('../repositories/st-file-note-backend.js');
const legacy = read('../repositories/legacy-sources.js');
const manifest = JSON.parse(read('../manifest.json'));

assert.match(source, /configureNoteBackend\(createStFileNoteBackend\(/, 'notes are stored through SillyTavern files');
assert.match(source, /createLocalThemeRepository\(\{\s*storage: themeFileStore/, 'themes follow the user across devices');
assert.match(source, /runLegacyMigration\(\{ automatic: true \}\)/, 'old 2.x data is offered for migration on start');
assert.match(source, /readLegacyBrowserNotes/, 'old Lite browser data is detected');
assert.match(source, /createLegacyServerRequest\(/, 'old Server Plugin data is detected');
assert.match(backend, /'\/api\/files\/upload'/);
assert.match(backend, /'\/api\/files\/delete'/);
assert.match(backend, /\/user\/files\//);
assert.match(storage, /url\.pathname === '\/backups\/restore' && method === 'POST'/);
assert.doesNotMatch(storage, /indexedDB/i, 'note storage has no browser database path');
assert.doesNotMatch(legacy, /\.put\(|\.delete\(|\.clear\(|method:\s*'(?:POST|PATCH|DELETE)'/, 'legacy sources are read-only');

// One edition: no storage modes, no Server Plugin, no installers.
for (const pattern of [/state\.storageMode|storageMode:/, /\/api\/plugins\/tavern-notes/, /install-server-plugin/, /createModeNoteRepository|createRepositoryRouter/]) {
    assert.doesNotMatch(source, pattern, `index.js must not contain ${pattern}`);
}
for (const removed of ['../server-plugin', '../install-tavern-notes.js', '../install-server-plugin.js', '../Tavern-Notes-Installer.bat', '../features/storage-mode-controller.js', '../features/coexistence-controller.js']) {
    assert.equal(fs.existsSync(new URL(removed, import.meta.url)), false, `${removed} is gone`);
}
assert.equal('server_plugin_update_required' in manifest, false);
assert.equal(manifest.hooks?.install, undefined, 'there is nothing to install besides the extension itself');

console.log('file storage static: ok');
