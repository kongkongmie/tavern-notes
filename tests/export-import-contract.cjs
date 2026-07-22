const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const plugin = require('../server-plugin/tavern-notes/index.js');

class RouterMock {
    constructor() { this.routes = new Map(); }
    register(method, route, handler) { this.routes.set(`${method} ${route}`, handler); }
    get(route, handler) { this.register('GET', route, handler); }
    post(route, handler) { this.register('POST', route, handler); }
    patch(route, handler) { this.register('PATCH', route, handler); }
    delete(route, handler) { this.register('DELETE', route, handler); }
}

function request(root, overrides = {}) {
    return { user: { directories: { root }, profile: { handle: 'contract-test' } }, query: {}, params: {}, body: {}, ...overrides };
}

function invoke(router, method, route, req) {
    const response = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    router.routes.get(`${method} ${route}`)(req, response);
    assert.equal(response.statusCode, 200, JSON.stringify(response.body));
    assert.equal(response.body?.ok, true, JSON.stringify(response.body));
    return response.body;
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tavern-notes-contract-'));
    const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-contract-fixture.json'), 'utf8'));
    const router = new RouterMock();
    try {
        await plugin.init(router);
        const first = invoke(router, 'POST', '/import', request(root, { body: fixture }));
        const duplicate = invoke(router, 'POST', '/import', request(root, { body: fixture }));
        const exported = invoke(router, 'GET', '/export.json', request(root));
        assert.deepEqual(first, { ok: true, imported: 3, skipped: 0, received: 3, backup: first.backup });
        assert.equal(duplicate.imported, 0);
        assert.equal(duplicate.skipped, 3);
        assert.equal(exported.format, fixture.format);
        assert.equal(exported.version, fixture.version);
        assert.equal(exported.notes.length, 3);
        const excerpt = exported.notes.find(note => note.content === fixture.notes[0].content);
        const repeat = exported.notes.find(note => note.content === fixture.notes[1].content);
        const manual = exported.notes.find(note => note.content === fixture.notes[2].content);
        assert.deepEqual(excerpt.tags, ['Plot', 'clue']);
        assert.equal(repeat.repeatCount, 3);
        assert.equal(repeat.latestMessageId, 10);
        assert.equal(manual.type, 'manual');
        assert.equal(manual.character.isUser, true);
        console.log('Full export/import contract test passed.');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
