import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controller = await readFile(new URL('../features/note-batch-controller.js', import.meta.url), 'utf8');
const markup = await readFile(new URL('../features/app-shell-markup.js', import.meta.url), 'utf8');
const card = await readFile(new URL('../core/note-card.js', import.meta.url), 'utf8');

assert.match(controller, /exportSelectedJson/);
assert.match(controller, /mutationController\.deleteNotes/);
assert.match(controller, /confirmDelete\(selected\.size\)/);
assert.match(markup, /batch-open/);
assert.match(markup, /batch-export-json/);
assert.match(card, /batch-checkbox/);

console.log('note batch static checks passed');
