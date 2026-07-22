const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

assert.doesNotMatch(source, /moveEvent\.preventDefault\(\)/, 'floor capture must use its click event');
assert.match(source, /button\.addEventListener\('click', event => \{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\);\s*captureMessageFloor/s);
assert.doesNotMatch(source, /'--tn-input-bg':\s*inputSolid/, 'merged themes must not copy arbitrary host input backgrounds');
assert.match(source, /'--tn-input-bg':\s*cardLift/);
assert.match(css, /\.tn-modal-kicker\s*\{[^}]*color:\s*var\(--tn-em\)/s);
assert.match(css, /\.tn-variant-next\s*\{[^}]*right:\s*44px/s);
assert.match(source, /id="tavern-notes-update-indicator"[^>]*tn-hidden/);
assert.match(source, /indicator\?\.classList\.toggle\('tn-hidden', !hasUpdate\)/);
assert.doesNotMatch(source, /tavern-notes-update-banner/);

console.log('Full UI regression static checks passed.');
