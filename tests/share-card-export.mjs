import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canvasToBlob } from '../features/share-card-renderer.js';

const pngBytes = Buffer.from('png-result');
const rendererSource = await readFile(new URL('../features/share-card-renderer.js', import.meta.url), 'utf8');
const drawShareCardSource = rendererSource.slice(
    rendererSource.indexOf('async function drawShareCard'),
    rendererSource.indexOf('async function drawFullLengthShareCard'),
);
assert.equal((drawShareCardSource.match(/return canvas;/g) || []).length, 4);
assert.doesNotMatch(drawShareCardSource, /^\s*return;\s*$/m);
assert.ok((drawShareCardSource.match(/settings\.showCharacter/g) || []).length >= 6);
assert.ok((drawShareCardSource.match(/settings\.showDate/g) || []).length >= 4);
const fullLengthSource = rendererSource.slice(
    rendererSource.indexOf('async function drawFullLengthShareCard'),
    rendererSource.indexOf('function dataUrlToBlob'),
);
assert.match(fullLengthSource, /const width = 1080/);
assert.match(fullLengthSource, /lines\.length \* lineHeight/);
assert.doesNotMatch(fullLengthSource, /drawMultilineFit/);
assert.match(fullLengthSource, /const headerHeight = 270/);
assert.match(fullLengthSource, /drawCircleImage\(ctx, characterAvatar, padding, 70/);

const direct = await canvasToBlob({
    toBlob(callback) {
        callback(new Blob([pngBytes], { type: 'image/png' }));
    },
}, 'image/png');
assert.ok(direct instanceof Blob);
assert.ok(direct.size > 0);

let fallbackCalls = 0;
const fallback = await canvasToBlob({
    toBlob(callback) {
        callback(null);
    },
    toDataURL() {
        fallbackCalls += 1;
        return `data:image/png;base64,${pngBytes.toString('base64')}`;
    },
}, 'image/png');
assert.ok(fallback instanceof Blob);
assert.ok(fallback.size > 0);
assert.equal(fallbackCalls, 1);

await assert.rejects(
    canvasToBlob({
        toBlob(callback) {
            callback(null);
        },
        toDataURL() {
            return 'data:image/png;base64,';
        },
    }),
    /share-card-export-empty-result/,
);

await assert.rejects(
    canvasToBlob({
        toBlob(callback) {
            callback(new Blob([], { type: 'image/png' }));
        },
        toDataURL() {
            return 'data:image/png;base64,';
        },
    }),
    /share-card-export-empty-result/,
);

console.log('share-card export tests passed');

// Truncation keeps the ellipsis on the last visible line (it used to add a line that overlapped the footer).
{
    const { fitTruncatedLines } = await import('../features/share-card-renderer.js');
    const ctx = { measureText: text => ({ width: Array.from(text).length * 10 }) };
    const fitted = fitTruncatedLines(ctx, ['一二三四五', '', '六七八九十', '尾巴'], 3, 50);
    assert.equal(fitted.length, 3);
    assert.equal(fitted[2], '六七八九…');
    assert.deepEqual(fitTruncatedLines(ctx, ['a', 'b'], 3, 50), ['a', 'b']);
}
