import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const dialogIds = [
    'tavern-notes-new-note-menu',
    'tavern-notes-modal',
    'tavern-notes-edit-menu',
    'tavern-notes-tag-library',
    'tavern-notes-export-menu',
    'tavern-notes-floor-capture-menu',
    'tavern-notes-user-input-cleanup-menu',
    'tavern-notes-theme-menu',
    'tavern-notes-share-menu',
];

for (const id of dialogIds) assert.match(source, new RegExp(`['"]${id}['"]`));
assert.match(source, /setAttribute\('data-tn-overlay', 'dialog'\)/);
assert.match(source, /setAttribute\('data-tn-overlay', 'popover'\)/);
assert.match(css, /#tavern-notes-panel > \[data-tn-overlay="dialog"\]/);
assert.match(css, /#tavern-notes-panel\[data-theme-flavor="archive"\] > \[data-tn-overlay="dialog"\]/);
assert.doesNotMatch(css, /:not\(#tavern-notes-modal\)/, 'Archive must not require an overlay ID whitelist.');
for (const token of ['--_tn-z-dialog', '--_tn-z-popover', '--_tn-z-archive-dialog']) assert.match(css, new RegExp(token));
for (const closer of ['closeNewNoteMenu', 'closeFullNote', 'closeEditNote', 'closeTagLibrary', 'closeExportMenu', 'closeFloorCaptureMenu', 'closeUserInputCleanupMenu', 'closeThemeMenu', 'closeShareCard']) {
    assert.match(source, new RegExp(`function closePanel\\(\\) \\{[\\s\\S]*?${closer}\\(\\)`, 'm'));
}
console.log('Full overlay contract smoke test passed.');
