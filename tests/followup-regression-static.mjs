import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const backend = fs.readFileSync(new URL('../server-plugin/tavern-notes/index.js', import.meta.url), 'utf8');

assert.doesNotMatch(source, /root\.addEventListener\('keyup', scheduleSelectionCaptureButton\)/);
assert.match(source, /new MutationObserver\(records =>/);
assert.match(source, /messages\.forEach\(ensureFloorCaptureButton\)/);
assert.doesNotMatch(source, /new MutationObserver\(\(\) => addFloorCaptureButtons\(chatContainer\)\)/);
assert.match(source, /document\.addEventListener\('pointerdown', closeHeaderPopoverFromOutside, true\)/);
assert.match(source, /class="tn-floor-content-tag-section"/);
assert.doesNotMatch(source, /<details class="tn-floor-capture-advanced">/);
assert.match(css, /#tavern-notes-tag-search[\s\S]*?background: var\(--tn-input-bg\) !important/);
assert.match(css, /\.tn-floor-exclude-tag code[\s\S]*?background: transparent/);
assert.doesNotMatch(css, /\.tn-header-secondary\s*\{\s*display:\s*contents/);
assert.match(css, /\.tn-header-actions\s*\{[^}]*grid-column:\s*1\s*\/\s*-1[^}]*grid-template-columns:\s*repeat\(var\(--tn-header-action-columns/);
assert.match(css, /#tavern-notes-more-open\s*\{\s*display:\s*inline-flex/);
assert.match(source, /<div class="tn-window-actions">[\s\S]*?id="tavern-notes-theme"[\s\S]*?<div class="tn-header-actions">/);
assert.match(source, /new ResizeObserver\(scheduleHeaderActionLayout\)/);
assert.match(source, /const directLimit = [^;]*panelWidth[^;]*;/);
assert.match(css, /repeat\(var\(--tn-header-action-columns, 5\)/);
assert.match(css, /\.tn-window-actions > \.tn-language-select[\s\S]*?border-radius:\s*50% !important/);
assert.match(backend, /note\.source !== 'manual_inspiration'/);
assert.doesNotMatch(source, /params\.set\('includeUserInput'/, 'recording toggle must not hide stored notes');
assert.match(source, /async function captureUserMessage[\s\S]*?if \(!state\.autoCaptureUserInput\) return;/, 'recording toggle must still stop automatic capture');
console.log('Full follow-up regression test passed.');
