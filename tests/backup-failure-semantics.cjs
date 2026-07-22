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
    return { user: { directories: { root }, profile: { handle: 'backup-failure-test' } }, query: {}, params: {}, body: {}, ...overrides };
}

function invoke(router, method, route, req) {
    const response = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    router.routes.get(`${method} ${route}`)(req, response);
    return response;
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tavern-notes-backup-failure-'));
    const router = new RouterMock();
    const originalRename = fs.renameSync;
    try {
        await plugin.init(router);
        fs.renameSync = (source, destination) => {
            if (String(destination).includes(`${path.sep}backups${path.sep}`)) throw new Error('synthetic backup destination failure');
            return originalRename(source, destination);
        };
        const create = invoke(router, 'POST', '/notes', request(root, { body: { type: 'manual', content: 'Synthetic backup failure note.' } }));
        assert.equal(create.statusCode, 500);
        assert.equal(create.body.ok, false);
        assert.match(create.body.error, /自动备份失败/);

        fs.renameSync = originalRename;
        const list = invoke(router, 'GET', '/notes', request(root));
        assert.equal(list.statusCode, 200);
        assert.equal(list.body.totalNotes, 1, 'The write currently succeeds even though the API reports failure.');
        console.log('Full backup failure semantics baseline passed (500 response with persisted write).');
    } finally {
        fs.renameSync = originalRename;
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
