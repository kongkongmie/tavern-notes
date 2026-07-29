const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = [
    fs.readFileSync(path.join(root, 'index.js'), 'utf8'),
    fs.readFileSync(path.join(root, 'repositories', 'full-app-shell-markup.js'), 'utf8'),
    fs.readFileSync(path.join(root, 'features', 'app-shell-markup.js'), 'utf8'),
].join('\n');
const themeStudio = fs.readFileSync(path.join(root, 'features', 'theme-studio.js'), 'utf8');
const captureView = fs.readFileSync(path.join(root, 'features', 'capture-view.js'), 'utf8');
const updateView = fs.readFileSync(path.join(root, 'features', 'update-view.js'), 'utf8');
const css = [
    fs.readFileSync(path.join(root, 'shared', 'base.css'), 'utf8'),
    fs.readFileSync(path.join(root, 'style.css'), 'utf8'),
].join('\n');

assert.doesNotMatch(source, /moveEvent\.preventDefault\(\)/, 'floor capture must use its click event');
assert.match(captureView, /button\.addEventListener\('click', event => \{[\s\S]*?event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\);[\s\S]*?onFloorCapture\(message\)/);
assert.doesNotMatch(themeStudio, /'--tn-input-bg':\s*inputSolid/, 'merged themes must not copy arbitrary host input backgrounds');
assert.match(themeStudio, /'--tn-input-bg':\s*cardLift/);
assert.match(css, /\.tn-modal-kicker\s*\{[^}]*color:\s*var\(--tn-em\)/s);
assert.match(css, /\.tn-variant-next\s*\{[^}]*right:\s*44px/s);
assert.match(source, /id="\\?\$\{idPrefix\}-update-indicator"[^>]*\$\{ui\('hidden'\)\}/);
assert.match(updateView, /indicator\?\.classList\.toggle\(`\$\{classPrefix\}-hidden`, !hasUpdate\)/);
assert.doesNotMatch(source, /tavern-notes-update-banner/);
assert.match(css, /Compact main shell:[\s\S]*?\.tn-header\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/s);
assert.match(css, /grid-template-columns:\s*repeat\(var\(--tn-header-action-columns,\s*var\(--tnl-header-action-columns,\s*4\)\),\s*minmax\(0,\s*1fr\)\)\s*!important/);
assert.match(css, /\.tn-shell\s*\{[\s\S]*?grid-template-rows:\s*auto minmax\(0,\s*1fr\)[\s\S]*?gap:\s*6px/s);
assert.match(css, /\.tn-subtitle::after\s*\{\s*display:\s*none;/s);

console.log('Full UI regression static checks passed.');
