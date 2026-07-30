import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createThemeStudio, renderThemeStudioMarkup } from '../features/theme-studio.js';

function element(value = '') {
    const listeners = new Set();
    return {
        value,
        addEventListener(type, listener) { if (type === 'click') listeners.add(listener); },
        removeEventListener(type, listener) { if (type === 'click') listeners.delete(listener); },
        listeners,
    };
}
const elements = new Map([
    ['#tavern-notes-theme-name-input', element()],
    ['#tavern-notes-theme-code', element()],
    ['#tavern-notes-theme-preview-save', element()],
    ['#tavern-notes-theme-merge-st', element()],
    ['#tavern-notes-theme-save-as', element()],
]);
const document = {
    body: {},
    documentElement: {},
    querySelector: selector => elements.get(selector) || null,
};
const defaultTheme = {
    format: 'tavern-notes-theme',
    version: 1,
    name: 'Default',
    variables: { '--tn-paper': '#fff' },
    assets: {},
};
const normalizeTheme = theme => ({
    ...defaultTheme,
    ...theme,
    variables: { ...defaultTheme.variables, ...(theme.variables || {}) },
    assets: { ...defaultTheme.assets, ...(theme.assets || {}) },
});
const themeState = { theme: defaultTheme, draft: false, activeId: 'default' };
const controllerCalls = [];
let promptResult = null;
const themeController = {
    getThemeState: () => ({ ...themeState }),
    previewTheme: (theme, options) => controllerCalls.push(['preview', theme, options]),
    saveTheme: async (theme, options) => controllerCalls.push(['save', theme, options]),
    setDraft: draft => { themeState.draft = draft; },
    isAppleThemeId: () => false,
};
const studio = createThemeStudio({
    document,
    window: { prompt: () => promptResult },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    defaultTheme,
    normalizeTheme,
    themeController,
    translate: key => key,
    notify: () => {},
});

studio.syncEditor({ ...defaultTheme, name: 'Edited' });
assert.equal(elements.get('#tavern-notes-theme-name-input').value, 'Edited');
assert.equal(JSON.parse(elements.get('#tavern-notes-theme-code').value).name, 'Edited');
elements.get('#tavern-notes-theme-code').value = JSON.stringify({ name: 'From JSON', variables: { '--tn-paper': '#000' } });
elements.get('#tavern-notes-theme-name-input').value = 'From input';
assert.equal(studio.getThemeFromEditor().name, 'From input');
elements.get('#tavern-notes-theme-code').value = JSON.stringify({ format: 'other-format' });
assert.throws(() => studio.getThemeFromEditor(), /invalidThemeFile/);
elements.get('#tavern-notes-theme-code').value = JSON.stringify(defaultTheme);
await studio.mergeCurrentSillyTavernTheme();
assert.equal(themeState.draft, true);
assert.equal(controllerCalls.some(([action]) => action === 'preview'), false, 'merge must not preview on the active panel');
promptResult = 'Saved draft';
await studio.saveAsFromEditor();
assert.equal(controllerCalls.at(-1)[0], 'save');
assert.equal(controllerCalls.at(-1)[2].activate, false, 'save as must not activate the draft');

const mergedStudio = createThemeStudio({
    document,
    window: { prompt: () => null },
    getComputedStyle: target => ({
        getPropertyValue(name) {
            if (target === document.documentElement) {
                if (name === '--SmartThemeBlurTintColor') return 'rgba(40, 60, 80, 0.5)';
                if (name === '--SmartThemeBorderColor') return 'rgba(220, 180, 120, 0.45)';
                if (name === '--SmartThemeBodyColor') return 'rgb(235, 235, 235)';
                if (name === '--SmartThemeQuoteColor') return 'rgb(220, 180, 120)';
            }
            if (target === document.body && name === 'background-color') return 'rgb(10, 20, 30)';
            return '';
        },
    }),
    defaultTheme: {
        ...defaultTheme,
        variables: {
            '--tn-paper': '#fff', '--tn-paper-2': '#fff', '--tn-ink': '#222', '--tn-line': '#999',
            '--tn-gold': '#b88a34', '--tn-radius-card': '20px',
        },
    },
    normalizeTheme,
    themeController,
    translate: key => key,
    notify: () => {},
});
const merged = mergedStudio.extractCurrentSillyTavernTheme();
assert.equal(merged.variables['--tn-paper'], 'rgb(25, 40, 55)', 'translucent Tavern tint must be composited over the real page background');
assert.match(merged.variables['--tn-panel-border'], /46%/, 'dark merged themes must soften the Tavern border color');
assert.equal(merged.variables['--tn-input-border'], merged.variables['--tn-panel-border']);

const markup = renderThemeStudioMarkup({ translate: key => key, escapeHtml: value => String(value) });
assert.match(markup, /data-theme-studio/);
assert.match(markup, /tavern-notes-theme-code/);
const liteMarkup = renderThemeStudioMarkup({
    translate: key => key,
    escapeHtml: value => String(value),
    idPrefix: 'tavern-notes-lite',
    classPrefix: 'tnl',
});
assert.match(liteMarkup, /id="tavern-notes-lite-theme-code"/);
assert.match(liteMarkup, /class="tnl-theme-studio"/);
studio.mount();
studio.mount();
assert.equal(elements.get('#tavern-notes-theme-preview-save').listeners.size, 1);
studio.destroy();
assert.equal(elements.get('#tavern-notes-theme-preview-save').listeners.size, 0);

const source = fs.readFileSync(new URL('../features/theme-studio.js', import.meta.url), 'utf8');
assert.match(source, /styleOf\(\['#bg1', '#bg_custom', '#chat', '#sheld', '\.drawer-content'\]\)/, 'theme merge must sample the visible Tavern backdrop');
assert.doesNotMatch(source, /\bstate\.(?:theme|activeThemeId|previewTheme|themeDraft|themePreviewActive)\b/);
assert.doesNotMatch(source, /\bapplyTheme\b|\bsaveTheme\s*[,}]/);
assert.match(source, /themeController\.previewTheme/);
assert.match(source, /themeController\.saveTheme/);
assert.match(source, /activate:\s*false/);

console.log('Theme studio controller test passed.');
