const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const plugin = require('../server-plugin/tavern-notes/index.js');

class RouterMock {
    constructor() {
        this.routes = new Map();
    }

    register(method, route, handler) {
        this.routes.set(`${method} ${route}`, handler);
    }

    get(route, handler) { this.register('GET', route, handler); }
    post(route, handler) { this.register('POST', route, handler); }
    patch(route, handler) { this.register('PATCH', route, handler); }
    delete(route, handler) { this.register('DELETE', route, handler); }
}

function responseMock() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(value) {
            this.body = value;
            return this;
        },
    };
}

function request(root, overrides = {}) {
    return {
        user: { directories: { root }, profile: { handle: 'test-user' } },
        query: {},
        params: {},
        body: {},
        ...overrides,
    };
}

function invoke(router, method, route, req) {
    const handler = router.routes.get(`${method} ${route}`);
    assert.ok(handler, `Missing route: ${method} ${route}`);
    const res = responseMock();
    handler(req, res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body?.ok, true, JSON.stringify(res.body));
    return res.body;
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tavern-notes-edit-'));
    const router = new RouterMock();

    try {
        await plugin.init(router);

        const created = invoke(router, 'POST', '/notes', request(root, {
            body: {
                type: 'excerpt',
                content: 'Original excerpt',
                tags: ['draft'],
                character: { id: 'char-1', name: 'Test Character' },
            },
        })).note;

        const edited = invoke(router, 'PATCH', '/notes/:id', request(root, {
            params: { id: created.id },
            body: { content: 'Edited excerpt', tags: ['Favorite', 'scene', 'favorite'] },
        })).note;
        assert.equal(edited.content, 'Edited excerpt');
        assert.deepEqual(edited.tags, ['Favorite', 'scene']);
        assert.ok(edited.updatedAt);

        const filtered = invoke(router, 'GET', '/notes', request(root, {
            query: { tag: 'favorite' },
        }));
        assert.equal(filtered.totalNotes, 1);
        assert.equal(filtered.notes[0].content, 'Edited excerpt');

        const tags = invoke(router, 'GET', '/tags', request(root));
        assert.deepEqual(tags.tags, [
            { name: 'Favorite', count: 1 },
            { name: 'scene', count: 1 },
        ]);
        const exportedEdit = invoke(router, 'GET', '/export.json', request(root));
        assert.equal(exportedEdit.notes[0].content, 'Edited excerpt');
        assert.deepEqual(exportedEdit.notes[0].tags, ['Favorite', 'scene']);

        const removedTag = invoke(router, 'DELETE', '/tags/:tag', request(root, {
            params: { tag: 'favorite' },
        }));
        assert.equal(removedTag.updated, 1);
        const afterTagDelete = invoke(router, 'GET', '/notes', request(root));
        assert.equal(afterTagDelete.totalNotes, 1);
        assert.deepEqual(afterTagDelete.notes[0].tags, ['scene']);

        invoke(router, 'DELETE', '/notes/:id', request(root, {
            params: { id: created.id },
        }));
        const afterDelete = invoke(router, 'GET', '/notes', request(root));
        assert.equal(afterDelete.totalNotes, 0);

        console.log('Full note edit/tag smoke test passed.');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
