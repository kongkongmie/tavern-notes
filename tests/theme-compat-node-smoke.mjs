import assert from 'node:assert/strict';
import { toFullThemeVariables, toLiteThemeVariables } from '../theme-compat.js';

const lite = toLiteThemeVariables({
    '--tn-paper': '#efefeb',
    '--tn-note-bg': 'linear-gradient(var(--tn-paper), var(--tn-paper-2))',
    '--tn-ink': '#171717',
});
const full = toFullThemeVariables(lite);

assert.equal(full['--tn-paper'], '#efefeb');
assert.equal(full['--tn-note-bg'], 'linear-gradient(var(--tn-paper), var(--tn-paper-2))');
assert.equal(full['--tn-ink'], '#171717');
assert.equal(full['--tnl-paper'], undefined);

console.log('Unified theme compatibility smoke test passed.');
