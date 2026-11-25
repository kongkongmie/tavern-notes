import assert from 'node:assert/strict';
import { createStFileNoteBackend, MANIFEST_FILE, shardFileName } from '../repositories/st-file-note-backend.js';
import {
    buildNotesExport,
    configureNoteBackend,
    notesApi,
    readNotesFresh,
    replaceAllNotes,
} from '../storage.js';

const files = new Map();
const client = {
    async read(name) { return files.has(name) ? JSON.parse(files.get(name)) : null; },
    async write(name, value) { files.set(name, JSON.stringify(value)); },
    async remove(name) { files.delete(name); },
};
let clock = new Date(2026, 10, 14, 9, 0, 0);
const now = () => clock;
const buildBackup = notes => buildNotesExport(notes, 'test');
const deviceA = createStFileNoteBackend({ client, now, buildBackup });
const deviceB = createStFileNoteBackend({ client, now, buildBackup });

const post = body => notesApi('/notes', { method: 'POST', body: JSON.stringify(body) }, 'test');
const note = (content, extra = {}) => ({
    type: 'manual',
    content,
    character: { id: '1', name: 'Hero', avatar: 'hero.png' },
    chat: { id: 'chat-a', name: 'chat-a', messageId: null },
    ...extra,
});

configureNoteBackend(deviceA);
const first = await post(note('first'));
assert.ok(first.note.id);
assert.ok(files.has(MANIFEST_FILE), 'manifest is written');
assert.ok([...files.keys()].some(name => name.startsWith('tavern-notes__notes-')), 'notes go into a monthly shard');
assert.ok([...files.keys()].some(name => name.startsWith('tavern-notes__backup-2026-11-14')), 'first write of the day makes a backup');

configureNoteBackend(deviceB);
const seen = await notesApi('/notes?limit=50', {}, 'test');
assert.deepEqual(seen.notes.map(item => item.content), ['first'], 'another device reads the same files');
await post(note('second from B'));

configureNoteBackend(deviceA);
await post(note('third from A'));
const fresh = await readNotesFresh();
assert.deepEqual(fresh.map(item => item.content).sort(), ['first', 'second from B', 'third from A'], 'writes from both devices are kept');

// Same chat floor on files: edited text adds a version, identical text keeps one copy.
const hero = { id: '1', name: 'Hero', avatar: 'hero.png' };
await post({ type: 'user_input', content: 'opening v1', character: hero, chat: { id: 'c', name: 'c', messageId: 1 }, tags: ['开局'] });
const version = await post({ type: 'user_input', content: 'opening v2', character: hero, chat: { id: 'c', name: 'c', messageId: 1 } });
assert.equal(version.replaced, 0);
assert.deepEqual(version.note.tags, ['开局']);
const same = await post({ type: 'user_input', content: 'opening v1', character: hero, chat: { id: 'c', name: 'c', messageId: 1 }, collapseRepeated: false });
assert.equal(same.replaced, 1);
assert.deepEqual((await readNotesFresh()).filter(item => item.chat?.id === 'c').map(item => item.content).sort(), ['opening v1', 'opening v2']);

// Edits and deletes rewrite the right shard.
const target = (await readNotesFresh()).find(item => item.content === 'first');
await notesApi(`/notes/${target.id}`, { method: 'PATCH', body: JSON.stringify({ content: 'first edited', tags: ['x'] }) }, 'test');
await notesApi(`/notes/${(await readNotesFresh()).find(item => item.content === 'third from A').id}`, { method: 'DELETE' }, 'test');
assert.deepEqual((await readNotesFresh()).map(item => item.content).sort(), ['first edited', 'opening v1', 'opening v2', 'second from B']);

// Notes from another month land in their own shard; exact replace keeps ids and timestamps.
const migrated = buildNotesExport([
    { id: 'tn_old_1', seq: 1, type: 'excerpt', content: 'old excerpt', createdAt: '2026-07-31T04:25:56.137Z', updatedAt: '2026-07-31T04:25:56.137Z', character: { id: '5', name: 'A', avatar: 'a.png' }, chat: { id: 'x', name: 'x', messageId: 3 }, tags: ['t'] },
    { id: 'tn_old_2', seq: 2, type: 'user_input', content: 'old input', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z', character: { id: '5', name: 'A', avatar: 'a.png' }, chat: { id: 'x', name: 'x', messageId: 4 }, tags: [] },
]);
await replaceAllNotes(migrated);
const afterReplace = await readNotesFresh();
assert.deepEqual(afterReplace.map(item => [item.id, item.createdAt]).sort(), [['tn_old_1', '2026-07-31T04:25:56.137Z'], ['tn_old_2', '2026-08-01T00:00:00.000Z']]);
assert.ok(files.has(shardFileName('2026-07')) && files.has(shardFileName('2026-08')));
assert.ok(!files.has(shardFileName('2026-11')), 'emptied shards are deleted');

// Backups: one per day, restore puts the old state back and keeps a safety copy first.
clock = new Date(2026, 10, 15, 9, 0, 0);
await post(note('next day'));
const { backups } = await notesApi('/backups', {}, 'test');
assert.ok(backups.some(item => item.day === '2026-11-14') && backups.some(item => item.day === '2026-11-15'));
const yesterday = backups.find(item => item.day === '2026-11-14' && !item.label);
const restored = await notesApi('/backups/restore', { method: 'POST', body: JSON.stringify({ name: yesterday.name }) }, 'test');
assert.equal(restored.restored, 1, 'the first backup held the single note written that morning');
assert.deepEqual((await readNotesFresh()).map(item => item.content), ['first']);
assert.ok((await notesApi('/backups', {}, 'test')).backups.some(item => item.label === 'before-restore'));

// Only the newest seven daily backups are kept.
for (let day = 16; day <= 26; day += 1) {
    clock = new Date(2026, 10, day, 9, 0, 0);
    await post(note(`day ${day}`));
}
const daily = (await notesApi('/backups', {}, 'test')).backups.filter(item => !item.label);
assert.equal(daily.length, 7);
assert.equal([...files.keys()].filter(name => /tavern-notes__backup-\d{4}-\d{2}-\d{2}\.json$/.test(name)).length, 7);

console.log('st file note backend: ok');
