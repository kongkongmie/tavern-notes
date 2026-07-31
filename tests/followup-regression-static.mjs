import assert from 'node:assert/strict';
import fs from 'node:fs';

const entry = fs.readFileSync(new URL('../index.js', import.meta.url), 'utf8');
const shell = fs.readFileSync(new URL('../repositories/full-app-shell-markup.js', import.meta.url), 'utf8');
const sharedShell = fs.readFileSync(new URL('../features/app-shell-markup.js', import.meta.url), 'utf8');
const observerController = fs.readFileSync(new URL('../features/observer-controller.js', import.meta.url), 'utf8');
const source = `${entry}\n${shell}\n${sharedShell}`;
const captureView = fs.readFileSync(new URL('../features/capture-view.js', import.meta.url), 'utf8');
const userCapture = fs.readFileSync(new URL('../features/user-input-capture-controller.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const sharedCss = fs.readFileSync(new URL('../shared/base.css', import.meta.url), 'utf8');
const effectiveCss = `${sharedCss}\n${css}`;
const backend = fs.readFileSync(new URL('../server-plugin/tavern-notes/index.js', import.meta.url), 'utf8');
const shareRenderer = fs.readFileSync(new URL('../features/share-card-renderer.js', import.meta.url), 'utf8');

assert.doesNotMatch(source, /root\.addEventListener\('keyup', scheduleSelectionCaptureButton\)/);
assert.match(captureView, /new MutationObserver\(records =>/);
assert.match(captureView, /querySelectorAll\?\.\(selectors\.message\)\.forEach\(ensureFloorButton\)/);
assert.doesNotMatch(source, /new MutationObserver\(\(\) => addFloorCaptureButtons\(chatContainer\)\)/);
assert.match(source, /document\.addEventListener\('pointerdown', closeHeaderPopoverFromOutside, true\)/);
assert.match(source, /class="\$\{classPrefix\}-floor-content-tag-section"/);
assert.doesNotMatch(source, /<details class="\$\{classPrefix\}-floor-capture-advanced">/);
assert.match(css, /#tavern-notes-tag-search[\s\S]*?background: var\(--tn-input-bg\) !important/);
assert.match(css, /\.tn-floor-exclude-tag code[\s\S]*?background: transparent/);
assert.doesNotMatch(css, /\.tn-header-secondary\s*\{\s*display:\s*contents/);
assert.match(css, /\.tn-header-actions\s*\{[^}]*grid-column:\s*1\s*\/\s*-1[^}]*grid-template-columns:\s*repeat\(var\(--tn-header-action-columns/);
assert.match(css, /#tavern-notes-more-open\s*\{\s*display:\s*inline-flex/);
assert.match(source, /id="\$\{idPrefix\}-more-open"/);
assert.match(source, /<div class="\$\{ui\('window-actions'\)\}">[\s\S]*?id="\$\{idPrefix\}-theme"[\s\S]*?<div class="\$\{ui\('header-actions'\)\}">/);
assert.match(entry, /createObserverController/);
assert.match(observerController, /observer\?\.observe|observer\.observe/);
assert.match(source, /const directLimit = [^;]*panelWidth[^;]*;/);
assert.match(css, /repeat\(var\(--tn-header-action-columns, 5\)/);
assert.match(
    effectiveCss,
    /\.tn-window-actions[\s\S]*?>\s*\.tn-language-select\s*\{[^}]*border-radius:\s*50% !important/,
    'language button circle rule must exist in shared/base.css or style.css',
);
assert.match(backend, /note\.source !== 'manual_inspiration'/);
assert.doesNotMatch(source, /params\.set\('includeUserInput'/, 'recording toggle must not hide stored notes');
assert.match(userCapture, /prepareUserInputCapture/, 'recording toggle must still stop automatic capture');
const autoCaptureToggle = entry.match(/async function toggleAutoCaptureUserInput\(\) \{[\s\S]*?\n\}/)?.[0] || '';
assert.match(autoCaptureToggle, /notify\(state\.autoCaptureUserInput/);
assert.doesNotMatch(autoCaptureToggle, /renderFilterTabs/, 'recording toggle must not call an undefined filter renderer');
assert.match(shareRenderer, /await waitForFont\(descriptor\.font, fontSample\)/, 'canvas fonts must preload the actual note characters');
assert.match(css, /--tn-panel-shadow:\s*0 18px 48px rgba\(74, 68, 58, 0\.18\)/, 'default day panel should use one restrained outer shadow');
assert.doesNotMatch(css, /26px 26px 58px[\s\S]{0,120}-18px -18px 42px/, 'default day panel must not restore the bidirectional glow');
assert.match(css, /\.tn-share-bg\s*\{[\s\S]*?box-shadow:\s*0 2px 7px rgba\(0, 0, 0, 0\.16\)/, 'share background swatches should not use a white outer glow');
assert.match(captureView, /selectionDismissedUntil = Date\.now\(\) \+ 1000/);
assert.match(captureView, /frame\.contentWindow\?\.getSelection\?\.\(\)/, 'capture dismissal should also clear embedded selections');
console.log('Full follow-up regression test passed.');
