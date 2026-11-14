import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createThemeStudio, renderThemeStudioMarkup } from '../features/theme-studio.js';

function element(value = '') {
    const listeners = new Set();
    return {
        value,
        textContent: '',
        checked: true,
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener(type, listener) { if (type === 'click') listeners.add(listener); },
        removeEventListener(type, listener) { if (type === 'click') listeners.delete(listener); },
        listeners,
    };
}
const elements = new Map([
    ['#tavern-notes-theme-name-input', element()],
    ['#tavern-notes-theme-code', element()],
    ['#tavern-notes-theme-custom-css', element()],
    ['#tavern-notes-theme-css-status', element()],
    ['#tavern-notes-theme-preview-save', element()],
    ['#tavern-notes-theme-merge-st', element()],
    ['#tavern-notes-theme-save-as', element()],
    ...['paper', 'paper-2', 'ink', 'muted', 'gold', 'font', 'font-size', 'radius', 'shadow', 'background', 'background-opacity']
        .map(name => [`#tavern-notes-theme-basic-${name}`, element()]),
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
    variables: { '--tn-paper': '#ffffff', '--tn-paper-2': '#f5f5f5', '--tn-ink': '#222222', '--tn-muted': '#777777', '--tn-gold': '#cc9900', '--tn-font-family': 'inherit', '--tn-font-size': '15px', '--tn-radius-panel': '24px', '--tn-panel-shadow': 'none' },
    assets: { backgroundImage: '', backgroundOpacity: 1 },
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

studio.syncEditor({ ...defaultTheme, name: 'Edited', customCss: '.tn-note { color: red; }' });
assert.equal(elements.get('#tavern-notes-theme-name-input').value, 'Edited');
assert.equal(JSON.parse(elements.get('#tavern-notes-theme-code').value).name, 'Edited');
assert.equal(elements.get('#tavern-notes-theme-custom-css').value, '.tn-note { color: red; }');
assert.equal(elements.get('#tavern-notes-theme-basic-paper').value, '#ffffff');
assert.equal(elements.get('#tavern-notes-theme-basic-background-opacity').value, '100');
elements.get('#tavern-notes-theme-code').value = JSON.stringify({ name: 'JSON CSS', customCss: '.tn-note { color: blue; }' });
assert.equal(studio.getThemeFromEditor().customCss, '.tn-note { color: blue; }', 'direct JSON edits remain supported when the separate CSS editor was untouched');
elements.get('#tavern-notes-theme-code').value = JSON.stringify({ name: 'From JSON', variables: { '--tn-paper': '#000' } });
elements.get('#tavern-notes-theme-name-input').value = 'From input';
elements.get('#tavern-notes-theme-custom-css').value = '.tn-note::before { content: ""; }';
assert.equal(studio.getThemeFromEditor().name, 'From input');
assert.equal(studio.getThemeFromEditor().customCss, '.tn-note::before { content: ""; }');
elements.get('#tavern-notes-theme-basic-paper').value = '#123456';
elements.get('#tavern-notes-theme-basic-font-size').value = '17';
elements.get('#tavern-notes-theme-basic-radius').value = '20';
elements.get('#tavern-notes-theme-basic-background').value = 'https://example.com/paper.png';
elements.get('#tavern-notes-theme-basic-background-opacity').value = '45';
const visualTheme = studio.getThemeFromEditor();
assert.equal(visualTheme.variables['--tn-paper'], '#123456');
assert.equal(visualTheme.variables['--tn-font-size'], '17px');
assert.equal(visualTheme.variables['--tn-radius-card'], '16px');
assert.equal(visualTheme.assets.backgroundImage, 'https://example.com/paper.png');
assert.equal(visualTheme.assets.backgroundOpacity, 0.45);
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
assert.match(markup, /<details class="tn-theme-advanced">/);
assert.match(markup, /data-theme-studio data-tn-theme-protected="surface"/);
assert.match(markup, /theme-preview-save" data-tn-theme-protected="control"/);
assert.match(markup, /data-theme-basic-field="paper" type="color"/);
assert.match(markup, /data-theme-basic-field="backgroundOpacity" type="range"/);
assert.doesNotMatch(markup, /<details class="tn-theme-advanced" open/);
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
assert.match(source, /suffix === 'background' \? 'change' : 'input'/, 'background URLs should preview after editing, not while partially typed');

console.log('Theme studio controller test passed.');
