import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../index.js', import.meta.url), 'utf8');
const themeView = await readFile(new URL('../features/theme-view.js', import.meta.url), 'utf8');
const systemStatusView = await readFile(new URL('../features/system-status-view.js', import.meta.url), 'utf8');
const style = await readFile(new URL('../style.css', import.meta.url), 'utf8');

for (const functionName of ['setActiveFilter', 'setCharacterFilter', 'clearCharacterFilter']) {
    const match = source.match(new RegExp(`function ${functionName}\\([^]*?\\n\\}`));
    assert.ok(match, `${functionName} must remain present`);
    assert.match(match[0], /noteListRenderer\.render\(\)/, `${functionName} must refresh the view even when the data query is unchanged`);
}

assert.match(style, /#tavern-notes-install-guide,[^]*?#tavern-notes-storage-choice\s*\{[^]*?z-index:\s*120000;/);
assert.match(systemStatusView, /await chooseLite\(\);\s*overlay\.remove\(\);/, 'closing onboarding must remove the full-screen interaction blocker');
assert.doesNotMatch(themeView, /button\.classList\.toggle\('active',\s*supported && isNight\)/, 'the day/night action must not look permanently selected');

console.log('interaction regression static checks passed');
