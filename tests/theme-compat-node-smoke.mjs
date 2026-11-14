import assert from 'node:assert/strict';
import { toThemeVariables } from '../core/theme-compat.js';

const converted = toThemeVariables({
    '--tnl-paper': '#efefeb',
    '--tnl-note-bg': 'linear-gradient(var(--tnl-paper), var(--tnl-paper-2))',
    '--tn-ink': '#171717',
    color: 'red',
});

assert.equal(converted['--tn-paper'], '#efefeb');
assert.equal(converted['--tn-note-bg'], 'linear-gradient(var(--tn-paper), var(--tn-paper-2))');
assert.equal(converted['--tn-ink'], '#171717');
assert.equal(converted['--tnl-paper'], undefined);
assert.equal(converted.color, undefined);

console.log('Theme variable compatibility smoke test passed.');
