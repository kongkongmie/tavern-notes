import assert from 'node:assert/strict';
import { renderFullAppShellMarkup } from '../repositories/full-app-shell-markup.js';

const html = renderFullAppShellMarkup({
    state: {
        storageMode: 'full',
        launcherMode: 'toolbar',
        language: 'auto',
        showSelectionCaptureButton: true,
        showFloorCaptureButton: true,
        autoCaptureUserInput: true,
        collapseRepeatedUserInput: true,
    },
    translate: key => key,
    escapeHtml: value => String(value),
    languageOptions: [{ id: 'auto', label: 'auto' }],
    getVisibleFilters: () => [{ id: 'all', icon: 'fa-book', label: 'all', hint: 'allHint' }],
    getFloorCaptureTagName: () => 'floor',
    extensionVersion: 'test',
    renderThemeViewMarkup: options => `<div data-theme-view="${options.idPrefix}">${options.studioMarkup}</div>`,
    renderThemeStudioMarkup: options => `<div data-theme-studio="${options.idPrefix}:${options.classPrefix}"></div>`,
    themeCapabilities: { openThemeFolder: true },
    shareCardThemes: [{ id: 'test-theme', labelKey: 'testTheme' }],
    shareCardBackgrounds: [{ id: 'test-background', labelKey: 'testBackground', value: '#fff' }],
});

assert.match(html, /id="tavern-notes-panel"/);
assert.match(html, /class="tn-header"/);
assert.match(html, /class="tn-brand-mark"><i class="fa-solid fa-book-open"><\/i>/);
assert.match(html, /id="tavern-notes-storage-mode"/);
assert.match(html, /id="tavern-notes-storage-mode-open"/);
assert.doesNotMatch(html, /class="tn-lite-full-info"/);
assert.match(html, /data-theme-view="tavern-notes"/);
assert.match(html, /data-theme-studio="tavern-notes:tn"/);
assert.match(html, /id="tavern-notes-input-dedupe-scan"[\s\S]*?<span>scanDuplicates<\/span>/);
assert.ok(html.indexOf('id="tavern-notes-search"') < html.indexOf('id="tavern-notes-list"'));
assert.ok(html.indexOf('id="tavern-notes-list"') < html.indexOf('class="tn-footer"'));
for (const name of ['dedupe-preview-list', 'dedupe-preview-summary', 'edit-save', 'export-choice', 'export-scope-choice', 'new-note-save', 'share-bg', 'share-choice']) {
    assert.match(html, new RegExp(`\\btn-${name}\\b`), `Full must emit the canonical class for ${name}`);
}
for (const classValue of html.matchAll(/class="([^"]*)"/g)) {
    const tokens = classValue[1].split(/\s+/).filter(Boolean);
    assert.equal(new Set(tokens).size, tokens.length, `duplicate class token in: ${classValue[0]}`);
    assert.equal(tokens.some(token => token.startsWith('tnl-')), false, `Full must not emit Lite class: ${classValue[0]}`);
}

console.log('Full app shell markup test passed.');
