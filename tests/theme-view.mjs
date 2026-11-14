import assert from 'node:assert/strict';
import { createThemeView, renderThemeViewMarkup } from '../features/theme-view.js';

const listeners = new Map();
const document = {
    addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
        listeners.get(type)?.delete(listener);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return {}; },
    createTextNode(value) { return value; },
};
const view = createThemeView({
    document,
    window: {},
    getComputedStyle: () => ({}),
    requestAnimationFrame: callback => callback(),
    idPrefix: 'test',
    classPrefix: 'tn',
    variablePrefix: '--tn-',
    translate: key => key,
    exportFile: () => {},
});
view.mount({});
view.mount({});
assert.equal(listeners.get('click').size, 1, 'repeated mount keeps one click delegate');
assert.equal(listeners.get('change').size, 1, 'repeated mount keeps one change delegate');
view.destroy();
assert.equal(listeners.get('click').size, 0, 'destroy removes click delegate');
assert.equal(listeners.get('change').size, 0, 'destroy removes change delegate');

const liteMarkup = renderThemeViewMarkup({
    idPrefix: 'lite',
    classPrefix: 'tnl',
    translate: key => key,
    escapeHtml: value => value,
    capabilities: { themeStudio: false, exportTheme: false },
});
assert.doesNotMatch(liteMarkup, /theme-export|data-theme-studio/);
assert.match(liteMarkup, /theme-card" data-tn-theme-protected="surface"/);
assert.match(liteMarkup, /theme-delete[^>]+data-tn-theme-protected="control"/);

const panelClasses = new Set();
const panelValues = new Map();
const decorationSlot = {
    children: [],
    getAttribute(name) { return name === 'data-tn-theme-slot' ? 'card-decoration' : null; },
    replaceChildren(...children) { this.children = children; },
};
const backgroundStyle = {};
const backgroundSlot = {
    style: backgroundStyle,
    children: [],
    getAttribute(name) { return name === 'data-tn-theme-slot' ? 'panel-background' : null; },
    replaceChildren(...children) { this.children = children; },
};
const panel = {
    dataset: {},
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); },
    querySelector(selector) { return selector === '[data-tn-theme-slot="panel-background"]' ? backgroundSlot : null; },
    querySelectorAll(selector) { return selector === '[data-tn-theme-slot]' ? [backgroundSlot, decorationSlot] : []; },
    style: {
        get length() { return panelValues.size; },
        item(index) { return [...panelValues.keys()][index]; },
        setProperty(key, value) { panelValues.set(key, value); },
        removeProperty(key) { panelValues.delete(key); },
    },
    classList: {
        toggle(name, force) { if (force) panelClasses.add(name); else panelClasses.delete(name); },
        remove(name) { panelClasses.delete(name); },
    },
};
const secretFilesView = createThemeView({
    document: { ...document, querySelector: selector => selector === '#test-panel' ? panel : null },
    window: {},
    getComputedStyle: () => ({}),
    requestAnimationFrame: callback => callback(),
    idPrefix: 'test',
    classPrefix: 'tn',
    variablePrefix: '--tn-',
    translate: key => key,
    exportFile: () => {},
});
secretFilesView.applyTheme({ name: 'Secret Files', variables: {}, assets: {} }, {}, { resolveTheme: theme => theme });
assert.equal(panel.dataset.themeFlavor, 'secret-files');
assert.equal(panelClasses.has('tn-secret-files-theme'), true);
assert.doesNotMatch((await import('node:fs')).readFileSync(new URL('../features/theme-view.js', import.meta.url), 'utf8'), /classPrefix\}-archive-reading/, 'theme switching must clear the current reading-mode class');

let customStyle = null;
const customDocument = {
    ...document,
    head: { appendChild(element) { customStyle = element; } },
    createElement(tagName) {
        return {
            tagName: String(tagName).toUpperCase(),
            setAttribute() {},
            remove() { customStyle = null; },
            textContent: '',
        };
    },
    querySelector(selector) {
        if (selector === '#test-panel') return panel;
        if (selector === '#test-theme-custom-css') return customStyle;
        return null;
    },
};
const customCssView = createThemeView({
    document: customDocument,
    window: {},
    getComputedStyle: () => ({}),
    requestAnimationFrame: callback => callback(),
    idPrefix: 'test',
    classPrefix: 'tn',
    variablePrefix: '--tn-',
    translate: key => key,
    exportFile: () => {},
});
customCssView.applyTheme({
    name: 'Custom', variables: {}, assets: {},
    customCss: '.tn-note::before { content: ""; } .tn-theme-card { display: none; } .tn-theme-preview-save { opacity: 0; pointer-events: none; }',
}, { activeId: 'custom' }, { resolveTheme: theme => theme });
assert.equal(panel.attributes.get('data-tn-theme-id'), 'custom');
assert.match(customStyle.textContent, /^#test-panel\[data-tn-theme-id="custom"\] \.tn-note::before/);
assert.match(customStyle.textContent, /\[data-tn-theme-protected\] \{ visibility: visible !important/);
assert.ok(customStyle.textContent.lastIndexOf('[data-tn-theme-protected]') > customStyle.textContent.lastIndexOf('pointer-events:none'), 'protected controls override non-layout hiding rules at the end of the theme style');
assert.doesNotMatch(customStyle.textContent, /z-index:\s*2147483647|data-tn-theme-protected[^}]+position:/, 'theme recovery styles must not alter overlay layout');
customCssView.applyTheme({
    name: 'Decorated', variables: {}, assets: {}, customCss: '',
    decorations: [{ slot: 'card-decoration', type: 'text', value: 'CONFIDENTIAL', className: 'stamp', alt: '' }],
}, { activeId: 'decorated' }, { resolveTheme: theme => theme });
assert.equal(decorationSlot.children.length, 1);
assert.equal(decorationSlot.children[0].textContent, 'CONFIDENTIAL');
assert.match(decorationSlot.children[0].className, /tn-theme-decoration-user-stamp/);
customCssView.applyTheme({ name: 'Background', variables: {}, assets: { backgroundImage: 'https://example.com/paper.png', backgroundOpacity: 0.4 }, customCss: '' }, { activeId: 'background' }, { resolveTheme: theme => theme });
assert.match(backgroundStyle.backgroundImage, /paper\.png/);
assert.equal(backgroundStyle.opacity, '0.4');
customCssView.applyTheme({ name: 'Grid', variables: {}, assets: { backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 20px, rgba(0, 0, 0, 0.05) 20px 21px)' }, customCss: '' }, { activeId: 'grid' }, { resolveTheme: theme => theme });
assert.match(backgroundStyle.backgroundImage, /^repeating-linear-gradient/);
customCssView.applyTheme({ name: 'Plain', variables: {}, assets: {}, customCss: '' }, { activeId: 'default' }, { resolveTheme: theme => theme });
assert.equal(customStyle, null, 'switching to a simple theme removes the previous custom style node');
assert.equal(decorationSlot.children.length, 0, 'switching themes removes previous decorations');
console.log('theme view: ok');
