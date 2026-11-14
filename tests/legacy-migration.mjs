import assert from 'node:assert/strict';
import { combineLegacyNotes, verifyMigratedNotes } from '../core/legacy-migration-model.js';
import { createLegacyMigration } from '../features/legacy-migration.js';
import { createStFileNoteBackend } from '../repositories/st-file-note-backend.js';
import { createStFileKeyValueStore } from '../repositories/st-file-kv-store.js';
import {
    buildNotesExport,
    configureNoteBackend,
    importNotes,
    readNotesFresh,
    replaceAllNotes,
    hasStoredNotes,
} from '../storage.js';

const full = [
    { id: 'tn_1', seq: 1, type: 'user_input', content: 'hello', createdAt: '2026-08-01T00:00:00.000Z', character: { name: 'A' }, chat: { id: 'c1', messageId: 1 }, tags: ['开局'] },
    { id: 'tn_2', seq: 2, type: 'excerpt', content: 'quote', createdAt: '2026-11-02T00:00:00.000Z', character: { name: 'B' }, chat: { id: 'c2', messageId: 3 }, tags: [] },
];
const lite = [
    { id: 'tnl_9', seq: 1, type: 'excerpt', content: 'quote', createdAt: '2026-11-02T00:00:00.000Z', character: { name: 'B' }, chat: { id: 'c2' }, tags: [] },
    { id: 'tnl_8', seq: 2, type: 'manual', content: 'only in lite', createdAt: '2026-10-01T00:00:00.000Z', character: { name: 'C' }, chat: { id: null }, tags: [] },
];
assert.deepEqual(combineLegacyNotes({ fullNotes: full, liteNotes: lite }).map(note => note.id), ['tn_1', 'tn_2', 'tnl_8']);
assert.equal(verifyMigratedNotes(full, [{ ...full[0] }]).problems[0].reason, 'missing');
assert.equal(verifyMigratedNotes(full, [full[0], { ...full[1], content: 'changed' }]).problems[0].reason, 'content');

const files = new Map();
const client = {
    async read(name) { return files.has(name) ? JSON.parse(files.get(name)) : null; },
    async write(name, value) { files.set(name, JSON.stringify(value)); },
    async remove(name) { files.delete(name); },
};
const backend = createStFileNoteBackend({ client, buildBackup: notes => buildNotesExport(notes) });
configureNoteBackend(backend);
const themeStore = createStFileKeyValueStore({ client, file: 'tavern-notes__themes.json' });
await themeStore.ready();

const server = {
    '/status': { ok: true, totalNotes: 2 },
    '/export.json': { ok: true, notes: full },
    '/themes': { ok: true, activeId: 'mine', themes: [{ id: 'default' }, { id: 'apple-glass' }, { id: 'mine', name: 'Mine' }] },
    '/themes/mine': { ok: true, theme: { name: 'Mine', variables: { '--tn-paper': '#123' } } },
};
const migration = createLegacyMigration({
    serverRequest: async path => { if (!server[path]) throw new Error('404'); return server[path]; },
    readLegacyBrowserNotes: async () => lite,
    storage: {
        buildNotesExport,
        saveSnapshot: payload => client.write('tavern-notes__migration-source.json', payload),
        hasStoredNotes,
        importNotes: importNotes,
        replaceAllNotes,
        readNotesFresh,
    },
    themeStore,
    themeKeys: { themes: 'themes', active: 'active' },
});
const found = await migration.detect();
assert.deepEqual([found.full, found.browser, found.count], [true, true, 3]);
const report = await migration.run(found);
assert.equal(report.ok, true, JSON.stringify(report.problems));
assert.equal(report.expected, 3);
assert.equal(report.themes, 1);
assert.equal(themeStore.getItem('active'), 'mine');
assert.ok(files.has('tavern-notes__migration-source.json'), 'a copy of the source is kept');
const stored = await readNotesFresh();
assert.deepEqual(stored.map(note => note.id).sort(), ['tn_1', 'tn_2', 'tnl_8']);
assert.equal(stored.find(note => note.id === 'tn_1').createdAt, '2026-08-01T00:00:00.000Z');

// Running again after notes exist merges instead of replacing.
const again = await migration.run(found);
assert.equal(again.merged, true);
assert.equal(again.ok, true);
assert.equal((await readNotesFresh()).length, 3, 'a second migration does not duplicate notes');

console.log('legacy migration: ok');
