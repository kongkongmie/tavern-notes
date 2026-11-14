import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('../manifest.json'));
const frontendVersion = read('../index.js').match(/const EXTENSION_VERSION = '([^']+)'/)?.[1];

assert.ok(frontendVersion, 'Missing frontend version constant.');
assert.equal(frontendVersion, manifest.version);
assert.match(read('../CHANGELOG.md'), new RegExp(`^## ${manifest.version.replaceAll('.', '\\.')}\\s*$`, 'm'));
assert.match(read('../CHANGELOG.zh-CN.md'), /^# Tavern Notes 作者中文注释\s*$/m, 'Author annotation changelog must remain present.');
console.log(`Version consistency test passed (${manifest.version}).`);
