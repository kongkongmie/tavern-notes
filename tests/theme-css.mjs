import assert from 'node:assert/strict';
import { compileThemeCss, ThemeCssError } from '../core/theme-css.js';

const compiled = compileThemeCss(`
.tn-note::before { content: ""; background: linear-gradient(#fff, #ddd); }
:scope > .tn-header { backdrop-filter: blur(8px); }
@media (max-width: 600px) { .tn-note { transform: none; } }
@container tavern-notes-panel (max-width: 500px) { .tn-filters { grid-template-columns: 1fr 1fr; } }
@supports (mask-image: linear-gradient(#000, transparent)) { .tn-note { mask-image: linear-gradient(#000, transparent); } }
@keyframes float { from { transform: translateY(0); } to { transform: translateY(-4px); } }
@font-face { font-family: "Paper Font"; src: local("Arial"), url("https://example.com/paper.woff2"); }
.tn-note { animation: float 1s ease-in-out infinite; background-image: url("https://example.com/paper.png"); font-family: "Paper Font", serif; }
`, { themeId: 'My Theme' });

assert.match(compiled.css, /#tavern-notes-panel\[data-tn-theme-id="my-theme"\] \.tn-note::before/);
assert.match(compiled.css, /#tavern-notes-panel\[data-tn-theme-id="my-theme"\]>.tn-header/);
assert.match(compiled.css, /@media \(max-width:600px\)\{#tavern-notes-panel/);
assert.match(compiled.css, /@container tavern-notes-panel \(max-width:500px\)/);
assert.match(compiled.css, /@keyframes tn-my-theme-float/);
assert.match(compiled.css, /animation:tn-my-theme-float 1s/);
assert.deepEqual(compiled.keyframes, ['tn-my-theme-float']);
assert.match(compiled.css, /font-family:"tn-my-theme-paper-font"/);
assert.deepEqual(compiled.fonts, ['tn-my-theme-paper-font']);

for (const unsafe of [
    'body .x { color: red; }',
    ':root { --x: red; }',
    '#chat .mes { display: none; }',
    '@import url("https://example.com/x.css");',
    '.x { background: url("http://example.com/x.png"); }',
    '.x { behavior: url("https://example.com/x.htc"); }',
    '.x:not(:scope) { color: red; }',
]) {
    assert.throws(() => compileThemeCss(unsafe), ThemeCssError, unsafe);
}

const dataImage = compileThemeCss('.x { background: url(data:image/png;base64,AAAA); }');
assert.match(dataImage.css, /data:image\/png;base64,AAAA/);

console.log('theme css compiler: ok');
