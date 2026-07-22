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
    return {
        user: { directories: { root }, profile: { handle: 'tombstone-test' } },
        query: {},
        params: {},
        body: {},
        ...overrides,
    };
}

function invoke(router, method, route, req) {
    const response = {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; return this; },
    };
    router.routes.get(`${method} ${route}`)(req, response);
    assert.equal(response.statusCode, 200, JSON.stringify(response.body));
    assert.equal(response.body?.ok, true, JSON.stringify(response.body));
    return response.body;
}

function note(id, seq) {
    return {
        id,
        seq,
        type: 'manual',
        content: id,
        createdAt: '2026-07-21T00:00:00.000Z',
        updatedAt: '2026-07-21T00:00:00.000Z',
        character: { id: null, name: 'Test', avatar: null, isUser: false },
        chat: { id: null, name: '', messageId: null },
        source: 'synthetic-test',
        tags: [],
        repeatCount: 1,
        lastRepeatedAt: null,
        latestMessageId: null,
    };
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tavern-notes-tombstone-'));
    const router = new RouterMock();
    try {
        await plugin.init(router);
        invoke(router, 'GET', '/status', request(root));

        const store = path.join(root, 'tavern-notes');
        const indexPath = path.join(store, 'index.json');
        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        Object.assign(index, {
            nextSeq: 3,
            currentShard: 1,
            currentShardLines: 2,
            totalNotes: 2,
            latest: [],
            deletedIds: ['victim', ...Array.from({ length: 4999 }, (_, i) => `old-${i}`)],
        });
        fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
        fs.writeFileSync(
            path.join(store, 'notes-0001.jsonl'),
            `${JSON.stringify(note('victim', 1))}\n${JSON.stringify(note('fresh', 2))}\n`,
            'utf8',
        );

        invoke(router, 'DELETE', '/notes/:id', request(root, { params: { id: 'fresh' } }));
        const list = invoke(router, 'GET', '/notes', request(root, { query: { limit: 10, offset: 0 } }));
        assert.equal(list.totalNotes, 0, 'An older tombstone was discarded and a deleted note resurfaced.');

        const savedIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        assert.equal(savedIndex.deletedIds.length, 5001);
        assert.ok(savedIndex.deletedIds.includes('victim'));
        assert.ok(savedIndex.deletedIds.includes('fresh'));
        console.log('Full deletion tombstone smoke test passed.');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
