import assert from 'node:assert/strict';
import { BLUEPRINT_PIXEL_THEME, BLUEPRINT_PIXEL_THEME_ID } from '../core/blueprint-pixel-theme.js';
import { compileThemeCss } from '../core/theme-css.js';

assert.equal(BLUEPRINT_PIXEL_THEME_ID, 'blueprint-pixel');
assert.equal(BLUEPRINT_PIXEL_THEME.name, '蓝图像素');
assert.ok(Object.keys(BLUEPRINT_PIXEL_THEME.variables).every(key => key.startsWith('--tn-')));
const compiled = compileThemeCss(BLUEPRINT_PIXEL_THEME.customCss, { themeId: BLUEPRINT_PIXEL_THEME_ID });
assert.ok(compiled.css.length > 1000, 'pixel theme CSS compiles inside the panel scope');
assert.doesNotMatch(BLUEPRINT_PIXEL_THEME.customCss, /tn-storage-mode-badge|tn-subtitle/, 'no styles for removed UI');

console.log('blueprint pixel preset: ok');
