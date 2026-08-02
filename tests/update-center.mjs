import assert from 'node:assert/strict';
import { compareVersions, fetchUpdateInfo, parseChangelog } from '../core/update-center.js';
import { createUpdateRepository } from '../repositories/update-repository.js';

assert.equal(compareVersions('1.0.24', '1.0.23'), 1);
assert.equal(compareVersions('v1.0.23', '1.0.23'), 0);
assert.equal(compareVersions('1.0.9', '1.0.10'), -1);

const changelogText = '# Changelog\n\n## 1.0.24\n\n- First fix\n- Second fix\n\n## 1.0.23\n\n- Previous fix';
const annotationText = '# Author notes\n\n## 1.0.24\n\n- 作者补充说明';
assert.deepEqual(parseChangelog(changelogText), [
    { version: '1.0.24', items: ['First fix', 'Second fix'] },
    { version: '1.0.23', items: ['Previous fix'] },
]);

const fetchImpl = async url => url.includes('manifest.json')
    ? { ok: true, json: async () => ({ version: '1.0.24' }) }
    : { ok: true, text: async () => url.includes('zh-CN') ? annotationText : changelogText };
const info = await fetchUpdateInfo({ fetchImpl, installedVersion: '1.0.23', manifestUrl: 'manifest.json', changelogUrl: 'CHANGELOG.md', annotationUrl: 'CHANGELOG.zh-CN.md' });
assert.equal(info.hasUpdate, true);
assert.equal(info.changelog[0].version, '1.0.24');
assert.deepEqual(info.annotations[0], { version: '1.0.24', items: ['作者补充说明'] });

const updateCalls = [];
const repository = createUpdateRepository({
    fetchImpl: async (url, options = {}) => {
        if (url === '/api/extensions/update') {
            updateCalls.push(JSON.parse(options.body));
            return { ok: true, json: async () => ({ isUpToDate: false, shortCommitHash: 'abc1234' }) };
        }
        if (url.startsWith('/installed')) return { ok: true, json: async () => ({ version: '1.0.23' }) };
        if (url.startsWith('/manifest')) return { ok: true, json: async () => ({ version: '1.0.24', server_plugin_update_required: true }) };
        return { ok: true, text: async () => changelogText };
    },
    installedManifestUrl: '/installed', fallbackVersion: '1.0.23', manifestUrl: '/manifest', changelogUrl: '/changelog',
    noticeStorage: { getItem: () => '', setItem() {} }, noticeKey: 'notice', getRequestHeaders: () => ({ 'X-CSRF-Token': 'token' }),
});
assert.equal((await repository.check()).serverPluginUpdateRequired, true);
assert.equal((await repository.update()).shortCommitHash, 'abc1234');
assert.deepEqual(updateCalls[0], { extensionName: '/tavern-notes', global: false });
console.log('Shared update center test passed.');
