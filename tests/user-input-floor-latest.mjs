import assert from 'node:assert/strict';
import { createStFileNoteBackend } from '../repositories/st-file-note-backend.js';
import { buildNotesExport, configureNoteBackend, notesApi } from '../storage.js';

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
const input = (content, messageId, chat = 'Hero - chat A', tags = []) => ({
    type: 'user_input',
    content,
    character,
    chat: { id: chat, name: chat, messageId },
    source: 'message_sent',
    tags,
    collapseRepeated: true,
});

await post(input('opening v1', 1, undefined, ['开局']));
await post(input('second floor', 3));
const replaced = await post(input('opening v2', 1));
assert.equal(replaced.replaced, 1, 'same floor input replaces the older one');
assert.deepEqual(replaced.note.tags, ['开局'], 'tags of the replaced input are kept');
await post(input('opening v1', 1, 'Hero - chat B'));

const list = await api('/notes?limit=50');
assert.deepEqual(list.notes.map(note => note.content).sort(), ['opening v1', 'opening v2', 'second floor']);
assert.ok(list.notes.every(note => !note.variantCount || note.variantCount === 1));

const tags = (await api('/tags')).tags;
const tagged = await api(`/notes?tag=${encodeURIComponent('开局')}`);
assert.equal(tags.find(tag => tag.name === '开局').count, tagged.totalNotes, 'tag shelf count matches list');

const characters = (await api('/characters')).characters;
const hero = characters.find(item => item.name === 'Hero');
assert.ok(hero, 'a card with only user inputs still appears');
assert.equal(hero.userInput, 3);
const scoped = await api(`/notes?characterId=${encodeURIComponent(hero.id)}`);
assert.equal(scoped.totalNotes, hero.total, 'card count matches its filtered list');

console.log('user input floor latest: ok');
