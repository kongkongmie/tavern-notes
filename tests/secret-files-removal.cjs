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

function invoke(router, route, root) {
    const request = { user: { directories: { root }, profile: { handle: 'theme-removal-test' } }, query: {}, params: {}, body: {} };
    const response = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
    router.routes.get(`GET ${route}`)(request, response);
    assert.equal(response.statusCode, 200, JSON.stringify(response.body));
    return response.body;
}

(async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tavern-notes-theme-removal-'));
    const router = new RouterMock();
    try {
        await plugin.init(router);
        invoke(router, '/status', root);
        const store = path.join(root, 'tavern-notes');
        fs.writeFileSync(path.join(store, 'theme-active.json'), JSON.stringify({ activeId: 'secret-files' }), 'utf8');
        const themes = invoke(router, '/themes', root);
        assert.equal(themes.themes.some(theme => theme.id === 'secret-files'), false);
        assert.equal(themes.activeId, 'default');
        assert.equal(themes.activeTheme.name, 'Soft Neomorphism');
        console.log('Secret Files built-in removal test passed.');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
