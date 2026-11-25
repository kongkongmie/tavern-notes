import assert from 'node:assert/strict';
import { createStFileNoteBackend } from '../repositories/st-file-note-backend.js';
import { buildNotesExport, configureNoteBackend, notesApi, readNotesFresh } from '../storage.js';

const files = new Map();
const client = {
    async read(name) { return files.has(name) ? JSON.parse(files.get(name)) : null; },
    async write(name, value) { files.set(name, JSON.stringify(value)); },
    async remove(name) { files.delete(name); },
};
configureNoteBackend(createStFileNoteBackend({ client, buildBackup: notes => buildNotesExport(notes) }));
const api = (path, options) => notesApi(path, options, 'floor-test');
const post = body => api('/notes', { method: 'POST', body: JSON.stringify(body) });

const character = { id: '3', name: 'Hero', avatar: 'hero.png', isUser: false };
const input = (content, messageId, chat = 'Hero - chat A', tags = [], collapseRepeated = true) => ({
    type: 'user_input',
    content,
    character,
    chat: { id: chat, name: chat, messageId },
    source: 'message_sent',
    tags,
    collapseRepeated,
});
const floorOne = async () => (await api('/notes?limit=50')).notes
    .find(note => note.chat?.messageId === 1 && note.chat?.id === 'Hero - chat A');

await post(input('opening v1', 1, undefined, ['开局']));
await post(input('second floor', 3));

// Edited text on the same floor is a new version; the old one stays.
const edited = await post(input('opening v2', 1));
assert.equal(edited.replaced, 0, 'an edited input does not replace the earlier version');
assert.deepEqual(edited.note.tags, ['开局'], 'a new version keeps the tags of the floor');
let floor = await floorOne();
assert.deepEqual(floor.variants.map(note => note.content), ['opening v1', 'opening v2']);

// The same text again on the same floor keeps a single copy, now the newest version.
const again = await post(input('opening v1', 1));
assert.equal(again.replaced, 1, 'identical text on the same floor replaces its older copy');
floor = await floorOne();
assert.deepEqual(floor.variants.map(note => note.content), ['opening v2', 'opening v1']);
assert.equal(floor.content, 'opening v1', 'the card shows the newest version');

// Sent again right away: no new copy, with or without collapsing repeats.
assert.equal((await post(input('opening v1', 1))).deduplicated, true);
await post(input('opening v1', 1, undefined, [], false));
floor = await floorOne();
assert.deepEqual(floor.variants.map(note => note.content), ['opening v2', 'opening v1']);

// Other chats are separate floors.
await post(input('opening v1', 1, 'Hero - chat B'));
assert.equal((await api('/notes?limit=50')).totalNotes, 3, 'chat A floor 1, chat A floor 3, chat B floor 1');

// History cleanup only removes identical copies on a floor, never other versions.
const v2 = (await readNotesFresh()).find(note => note.content === 'opening v2');
await api('/import', { method: 'POST', body: JSON.stringify({ format: 'tavern-notes-export', notes: [{ ...v2, id: 'dup_copy', createdAt: '2026-01-01T00:00:00.000Z' }] }) });
assert.equal((await readNotesFresh()).filter(note => note.content === 'opening v2').length, 2);
const preview = await api('/user-input-dedupe');
assert.equal(preview.duplicateNotes ?? preview.removed, 1, 'only the identical copy is a duplicate');
await api('/user-input-dedupe', { method: 'POST', body: JSON.stringify({}) });
floor = await floorOne();
assert.deepEqual(floor.variants.map(note => note.content).sort(), ['opening v1', 'opening v2']);
assert.equal((await readNotesFresh()).filter(note => note.content === 'opening v2').length, 1);

const tags = (await api('/tags')).tags;
const tagged = await api(`/notes?tag=${encodeURIComponent('开局')}`);
assert.equal(tags.find(tag => tag.name === '开局').count, tagged.totalNotes, 'tag shelf count matches list');

const characters = (await api('/characters')).characters;
const hero = characters.find(item => item.name === 'Hero');
assert.ok(hero, 'a card with only user inputs still appears');
assert.equal(hero.userInput, 3, 'counted by floor, not by version');
const scoped = await api(`/notes?characterId=${encodeURIComponent(hero.id)}`);
assert.equal(scoped.totalNotes, hero.total, 'card count matches its filtered list');

console.log('user input floor versions: ok');
