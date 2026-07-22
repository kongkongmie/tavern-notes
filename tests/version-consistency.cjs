const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const frontend = fs.readFileSync(path.join(root, 'index.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'server-plugin', 'tavern-notes', 'index.js'), 'utf8');
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
const annotationChangelog = fs.readFileSync(path.join(root, 'CHANGELOG.zh-CN.md'), 'utf8');

const frontendVersion = frontend.match(/const EXTENSION_VERSION = '([^']+)'/)?.[1];
const backendVersion = backend.match(/const PLUGIN_VERSION = '([^']+)'/)?.[1];

assert.ok(frontendVersion, 'Missing frontend version constant.');
assert.ok(backendVersion, 'Missing backend version constant.');
assert.equal(frontendVersion, manifest.version);
assert.equal(backendVersion, manifest.version);
assert.match(changelog, new RegExp(`^## ${manifest.version.replaceAll('.', '\\.')}\\s*$`, 'm'));
assert.match(annotationChangelog, new RegExp(`^## ${manifest.version.replaceAll('.', '\\.')}\\s*$`, 'm'));
console.log(`Full version consistency test passed (${manifest.version}).`);
