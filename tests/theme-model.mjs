import assert from 'node:assert/strict';
import { createThemeModel } from '../core/theme-model.js';

const defaultTheme = { name: 'Default', variables: { '--tn-paper': '#fff', '--tn-theme-flavor': 'default' }, assets: { brandIcon: 'book' } };
const model = createThemeModel({
    defaultTheme,
    defaultNightVariables: { '--tn-paper': '#111' },
    appleDayVariables: { '--tn-paper': '#eee' },
    appleNightVariables: { '--tn-paper': '#000' },
});

assert.equal(model.normalizeAppleThemeId('apple-glass-night'), 'apple-glass');
assert.equal(model.isAppleThemeId('apple-glass-day'), true);
assert.equal(model.resolveTheme(defaultTheme, { activeThemeId: 'default', defaultMode: 'night' }).variables['--tn-paper'], '#111');
const apple = { variables: { '--tn-theme-flavor': 'apple' } };
assert.equal(model.resolveTheme(apple, { activeThemeId: 'apple-glass', appleMode: 'night' }).variables['--tn-paper'], '#000');
assert.equal(defaultTheme.variables['--tn-paper'], '#fff');
const advanced = model.normalizeTheme({ version: 1, customCss: '.tn-note { color: red; }' });
assert.equal(advanced.version, 2, 'themes using customCss are saved as format version 2');
assert.equal(advanced.customCss, '.tn-note { color: red; }');
const decorated = model.normalizeTheme({ decorations: [
    { slot: 'card-decoration', type: 'image', value: 'https://example.com/corner.png', className: 'Corner Art' },
    { slot: 'card-decoration', type: 'image', value: 'javascript:alert(1)' },
    { slot: 'outside', type: 'text', value: 'no' },
] });
assert.equal(decorated.version, 2);
assert.deepEqual(decorated.decorations, [{
    slot: 'card-decoration', type: 'image', value: 'https://example.com/corner.png', className: 'corner-art', alt: '',
}]);

console.log('Shared theme model test passed.');
