import assert from 'node:assert/strict';
import { createLegacyServerRequest, readLegacyBrowserNotes } from '../repositories/legacy-sources.js';

// No old browser database: nothing is read and nothing is created.
let opened = 0;
const emptyDb = { databases: async () => [{ name: 'something-else' }], open: () => { opened += 1; } };
assert.deepEqual(await readLegacyBrowserNotes({ indexedDb: emptyDb }), []);
assert.equal(opened, 0, 'a missing old database is not opened (and so not created)');
assert.deepEqual(await readLegacyBrowserNotes({ indexedDb: null }), []);

// Old Server Plugin: GET only, through SillyTavern's own headers.
const calls = [];
const request = createLegacyServerRequest({
    getHeaders: () => ({ 'X-CSRF-Token': 't' }),
    fetchImpl: async (url, options) => {
        calls.push([url, options]);
        if (url.endsWith('/status')) return { ok: true, status: 200, json: async () => ({ ok: true }) };
        return { ok: false, status: 404, json: async () => ({}) };
    },
});
assert.deepEqual(await request('/status'), { ok: true });
await assert.rejects(() => request('/export.json'), error => error.status === 404);
assert.equal(calls[0][0], '/api/plugins/tavern-notes/status');
assert.equal(calls[0][1].method, undefined, 'only reads');
assert.equal(calls[0][1].headers['X-CSRF-Token'], 't');

console.log('legacy sources: ok');
