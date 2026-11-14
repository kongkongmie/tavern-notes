import assert from 'node:assert/strict';
import { createNoteBatchController } from '../features/note-batch-controller.js';
import { createNoteRepository } from '../repositories/note-repository.js';
import { createStFileNoteBackend } from '../repositories/st-file-note-backend.js';
import { buildNotesExport, configureNoteBackend, notesApi, readNotesFresh } from '../storage.js';

const files = new Map();
const client = {
    async read(name) { return files.has(name) ? JSON.parse(files.get(name)) : null; },
    async write(name, value) { files.set(name, JSON.stringify(value)); },
    async remove(name) { files.delete(name); },
};
configureNoteBackend(createStFileNoteBackend({ client, buildBackup: notes => buildNotesExport(notes) }));
const post = body => notesApi('/notes', { method: 'POST', body: JSON.stringify(body) }, 'test');
const hero = { id: '1', name: 'Hero', avatar: 'hero.png' };
await post({ type: 'excerpt', content: 'excerpt one', character: hero, chat: { id: 'c', name: 'c', messageId: 2 } });
await post({ type: 'user_input', content: 'input a', character: hero, chat: { id: 'c', name: 'c', messageId: 1 } });
await post({ type: 'user_input', content: 'input b', character: hero, chat: { id: 'c', name: 'c', messageId: 3 } });
await post({ type: 'manual', content: 'keep me', character: hero, chat: { id: null, name: '' } });

// The list shows user inputs as floor groups whose id is a group id, not a stored note id.
const listed = (await notesApi('/notes?limit=50', {}, 'test')).notes;
const groups = listed.filter(note => note.type === 'user_input');
assert.ok(groups.every(note => note.id.startsWith('tnlg_')), 'user inputs are listed as floor groups');

const repository = createNoteRepository({
    request: (path, options) => notesApi(path, options, 'test'),
    getAllNotes: async () => [],
    importData: async () => ({}),
    exportData: async () => ({}),
    markExported: async () => {},
});
let listener = null;
const panel = {
    addEventListener: (type, handler) => { if (type === 'click') listener = handler; },
    classList: { toggle() {} },
    querySelector: () => null,
    querySelectorAll: () => [],
};
const events = [];
const batch = createNoteBatchController({
    root: panel,
    getVisibleNotes: () => listed,
    renderList: () => {},
    exportController: {},
    mutationController: { deleteNotes: async ids => { await repository.deleteNotes(ids); return { ok: true }; } },
    confirmDelete: async () => true,
    onEvent: (type, value) => events.push([type, value]),
});
batch.mount();
const click = matches => listener({ target: { closest: selector => (selector === 'button' ? { id: matches.id || '', matches: test => test === matches.selector } : null) } });
click({ id: 'tavern-notes-batch-open' });
click({ selector: '.tn-batch-all' });
const toDelete = listed.filter(note => note.content !== 'keep me');
const keep = listed.find(note => note.content === 'keep me');
// Deselect the note that should stay.
batch.getState();
click({ selector: '.tn-batch-invert' });
click({ selector: '.tn-batch-invert' });
listener({ target: { closest: selector => (selector === 'button' ? null : selector === '.tn-note' ? { dataset: { noteId: keep.id } } : null) }, preventDefault() {}, stopPropagation() {} });
assert.equal(batch.getState().count, toDelete.length);
click({ selector: '.tn-batch-delete' });
await new Promise(resolve => setTimeout(resolve, 20));

const remaining = await readNotesFresh();
assert.deepEqual(remaining.map(note => note.content), ['keep me'], 'every selected card is deleted, including floor groups');
assert.deepEqual(events.at(-1), ['deleted', 3]);
console.log('note batch delete: ok');
