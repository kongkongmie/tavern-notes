import assert from 'node:assert/strict';
import { buildFloorExcludeSelector, normalizeExcludedTagNames } from '../floor-capture.js';

assert.deepEqual(normalizeExcludedTagNames('thinking, <status> thinking invalid.class'), ['thinking', 'status']);
assert.deepEqual(normalizeExcludedTagNames(['Reasoning', '</tool-log>', 'bad selector']), ['reasoning', 'tool-log']);
assert.equal(buildFloorExcludeSelector('button,script', ['thinking', 'status']), 'button,script,thinking,status');
console.log('Floor excluded-tag normalization test passed.');
