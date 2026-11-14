import assert from 'node:assert/strict';
import { compareVersions, parseChangelog } from '../core/update-model.js';
import { createUpdateController } from '../features/update-controller.js';
import { rememberFont, sanitizeFontCss } from '../core/font-model.js';
import { createFontController } from '../features/font-controller.js';
import { normalizeSystemStatus } from '../core/system-status-model.js';
import { createSystemStatusController } from '../features/system-status-controller.js';

assert.equal(compareVersions('1.10.0', '1.9.9'), 1);
assert.equal(parseChangelog('## 1.2.0\n- A\n## 1.1.0\n- B').length, 2);
assert.equal(sanitizeFontCss('@font-face { font-family:X; src:url(x) } script{}').includes('script'), false);
assert.equal(rememberFont([], { type: 'local', name: 'A' }, 1)[0].id, 'local:A:1');
assert.deepEqual(normalizeSystemStatus({ count: 3, user: 'u', version: '3.0.0' }), { user: 'u', version: '3.0.0', totalNotes: 3, approximateBytes: 0, lastExportAt: '', healthy: true });

let updateResolvers = [];
let updateRenders = [];
let updateHandlers = null;
let updateRuns = 0;
let updateCompleted = 0;
const updateController = createUpdateController({
    repository: {
        check: () => new Promise(resolve => updateResolvers.push(resolve)),
        getInstalledVersion: async () => '1.0.0',
        readNotice: () => ({}),
        writeNotice() {},
        update: async () => { updateRuns += 1; return { isUpToDate: false, shortCommitHash: 'abc1234' }; },
    },
    view: { mount(handlers) { updateHandlers = handlers; }, render: state => updateRenders.push(state), close() {}, destroy() {} },
    fallbackVersion: '1.0.0',
    confirmUpdate: async () => true,
    onUpdated: async () => { updateCompleted += 1; },
});
updateController.mount();
const first = updateController.check();
const second = updateController.check();
updateResolvers[1]({ installedVersion: '1', latestVersion: '2', hasUpdate: true });
assert.equal((await second).latestVersion, '2');
assert.equal((await updateHandlers.onUpdate()).ok, true);
assert.equal(updateRuns, 1);
assert.equal(updateCompleted, 1);
updateResolvers[0]({ installedVersion: '1', latestVersion: '9', hasUpdate: true });
assert.equal((await first).stale, true);
updateController.destroy();

let settings = { importedFonts: [], fontFamily: 'system-ui', fontImport: '' };
let deleted = [];
let fontChanges = 0;
const fontController = createFontController({
    repository: {
        importFont: async () => {},
        deleteFont: async id => deleted.push(id),
        getFont: async () => ({ dataUrl: 'data:font/woff;base64,AA' }),
    },
    view: { mount() {}, destroy() {}, applyCss() {}, loadFont: async () => {}, readFile: async () => 'data:font/woff;base64,AA', waitForFont: async () => {} },
    getSettings: () => settings,
    updateSettings: async patch => { settings = { ...settings, ...patch }; return { ok: true }; },
    fetchImpl: async () => ({
        ok: true,
        text: async () => `@font-face{font-family:"Remote Font";src:url("./part.woff2")}${'x'.repeat(100000)}`,
    }),
    onChanged: () => { fontChanges += 1; },
});
fontController.mount();
await fontController.importLocal({ name: 'Test.woff' });
assert.equal(settings.importedFonts.length, 1);
await fontController.deleteFont(settings.importedFonts[0].id);
assert.equal(deleted.length, 1);
assert.equal(settings.fontFamily, 'system-ui');
assert.equal(fontChanges, 2);
await fontController.importCss('@import url("https://fonts.example/font.css");\nbody { font-family: "Remote Font"; }');
assert.equal(settings.fontImport, '@import url("https://fonts.example/font.css");\n.tavern-notes-share-font-probe { font-family: "Remote Font"; }');
assert.ok(settings.fontImport.length < 500, 'remote response CSS must not be stored in settings');
fontController.destroy();

let statusResolvers = [];
let statuses = [];
const statusController = createSystemStatusController({
    repository: { getStatus: () => new Promise(resolve => statusResolvers.push(resolve)) },
    view: { mount() {}, renderStatus: value => statuses.push(value), setLoading() {}, destroy() {} },
    formatStatus: status => String(status.totalNotes),
});
statusController.mount();
const statusFirst = statusController.refresh();
const statusSecond = statusController.refresh();
statusResolvers[1]({ totalNotes: 2 });
assert.equal((await statusSecond).totalNotes, 2);
statusResolvers[0]({ totalNotes: 1 });
assert.equal((await statusFirst).stale, true);
statusController.destroy();

console.log('peripheral status feature: ok');
