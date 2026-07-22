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

        const userBase = { type: 'user_input', content: '/qr fixed', character: { id: 'char-1', name: 'Test Character' }, chat: { id: 'chat-1', name: 'Chat', messageId: 10 } };
        const firstInput = invoke(router, 'POST', '/notes', request(root, { body: userBase }));
        const repeatedInput = invoke(router, 'POST', '/notes', request(root, { body: { ...userBase, chat: { ...userBase.chat, messageId: 11 } } }));
        assert.equal(firstInput.deduplicated, undefined);
        assert.equal(repeatedInput.deduplicated, true);
        assert.equal(repeatedInput.note.repeatCount, 2);
        assert.equal(repeatedInput.note.latestMessageId, 11);
        invoke(router, 'PATCH', '/notes/:id', request(root, { params: { id: repeatedInput.note.id }, body: { content: '/qr fixed', tags: ['repeat-tag'] } }));
        invoke(router, 'DELETE', '/tags/:tag', request(root, { params: { tag: 'repeat-tag' } }));
        const repeatAfterTagDelete = invoke(router, 'GET', '/notes', request(root, { query: { q: '/qr fixed' } }));
        assert.equal(repeatAfterTagDelete.notes[0].repeatCount, 2);

        invoke(router, 'POST', '/notes', request(root, { body: { ...userBase, content: 'break', chat: { ...userBase.chat, messageId: 12 } } }));
        const afterBreak = invoke(router, 'POST', '/notes', request(root, { body: { ...userBase, chat: { ...userBase.chat, messageId: 13 } } }));
        assert.notEqual(afterBreak.deduplicated, true);

        invoke(router, 'POST', '/notes', request(root, { body: { ...userBase, content: 'legacy', collapseRepeated: false, chat: { ...userBase.chat, messageId: 14 } } }));
        invoke(router, 'POST', '/notes', request(root, { body: { ...userBase, content: 'legacy', collapseRepeated: false, chat: { ...userBase.chat, messageId: 15 } } }));
        invoke(router, 'POST', '/notes', request(root, { body: { ...userBase, content: 'legacy two', collapseRepeated: false, chat: { ...userBase.chat, messageId: 16 } } }));
        invoke(router, 'POST', '/notes', request(root, { body: { ...userBase, content: 'legacy two', collapseRepeated: false, chat: { ...userBase.chat, messageId: 17 } } }));
        const preview = invoke(router, 'GET', '/user-input-dedupe', request(root));
        assert.equal(preview.duplicateNotes, 2);
        const legacyPreview = preview.items.find(item => item.content === 'legacy');
        assert.equal(legacyPreview.occurrences, 2);
        const cleaned = invoke(router, 'POST', '/user-input-dedupe', request(root, { body: { ids: [legacyPreview.id] } }));
        assert.equal(cleaned.duplicateNotes, 1);
        const legacy = invoke(router, 'GET', '/notes', request(root, { query: { q: 'legacy' } }));
        assert.equal(legacy.totalNotes, 3);
        assert.equal(legacy.notes.find(note => note.content === 'legacy').repeatCount, 2);
        assert.equal(legacy.notes.filter(note => note.content === 'legacy two').length, 2);

        const manualBase = { ...userBase, content: 'idea', source: 'manual_inspiration', collapseRepeated: false, tags: ['灵感笔记'], character: { id: 'tavern-notes-user', name: 'Tester', avatar: 'persona.png', isUser: true } };
        invoke(router, 'POST', '/notes', request(root, { body: { ...manualBase, chat: { ...userBase.chat, messageId: null } } }));
        invoke(router, 'POST', '/notes', request(root, { body: { ...manualBase, chat: { ...userBase.chat, messageId: null } } }));
        const previewAfterManual = invoke(router, 'GET', '/user-input-dedupe', request(root));
        assert.equal(previewAfterManual.duplicateNotes, 1);
        const manualWithAutoInputOff = invoke(router, 'GET', '/notes', request(root, { query: { includeUserInput: 'false', tag: '灵感笔记' } }));
        assert.equal(manualWithAutoInputOff.totalNotes, 2);
        const autoWithAutoInputOff = invoke(router, 'GET', '/notes', request(root, { query: { includeUserInput: 'false', q: '/qr fixed' } }));
        assert.equal(autoWithAutoInputOff.totalNotes, 0);
        const renamed = invoke(router, 'PATCH', '/tags/:tag', request(root, { params: { tag: '灵感笔记' }, body: { name: '剧情脑洞' } }));
        assert.equal(renamed.updated, 2);
        const renamedNotes = invoke(router, 'GET', '/notes', request(root, { query: { tag: '剧情脑洞' } }));
        const renamedExport = invoke(router, 'GET', '/export.json', request(root));
        assert.equal(renamedExport.notes.filter(note => note.tags.includes('剧情脑洞')).length, 2);
        assert.equal(renamedNotes.notes[0].character.isUser, true);

        invoke(router, 'DELETE', '/notes/:id', request(root, {
            params: { id: created.id },
        }));
        const afterDelete = invoke(router, 'GET', '/notes', request(root));
        assert.equal(afterDelete.totalNotes, 8);

        console.log('Full note edit/tag smoke test passed.');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
