import assert from 'node:assert/strict';
import {
    composeOpaqueBackground,
    createFloorSnapshotFilename,
    planFloorSnapshot,
} from '../core/floor-snapshot-model.js';

const small = planFloorSnapshot({ width: 390, height: 2400 });
assert.equal(small.scale, 2, 'ordinary floors render at 2x');
assert.deepEqual(small.slices, [{ y: 0, height: 2400 }]);

const tall = planFloorSnapshot({ width: 390, height: 12000 });
assert.equal(tall.slices.length, 1, 'a long phone floor still fits one image');
assert.ok(tall.scale >= 1 && tall.scale < 2);
assert.ok(tall.width * tall.scale * tall.height * tall.scale <= 16_000_000);
assert.ok(tall.height * tall.scale <= 16_384);

const huge = planFloorSnapshot({ width: 900, height: 60000 });
assert.ok(huge.slices.length > 1, 'absurdly long floors are cut into parts');
assert.equal(huge.slices.reduce((total, slice) => total + slice.height, 0), 60000);
for (const slice of huge.slices) {
    assert.ok(slice.height * huge.scale <= 16_384);
    assert.ok(huge.width * huge.scale * slice.height * huge.scale <= 16_000_000);
}

const name = createFloorSnapshotFilename({
    brand: '酒馆笔记',
    characterName: 'A/B:C',
    messageId: 12,
    date: new Date(2026, 10, 14, 9, 5),
});
assert.equal(name, '酒馆笔记-A_B_C-F12-20261114-0905.png');
assert.match(createFloorSnapshotFilename({ characterName: 'x', messageId: 1, part: 2, parts: 3 }), /-2of3\.png$/);

assert.equal(composeOpaqueBackground(['rgba(0, 0, 0, 0)', 'rgb(20, 30, 40)']), 'rgb(20, 30, 40)');
assert.equal(composeOpaqueBackground(['rgb(255, 255, 255)', 'rgba(0, 0, 0, 0.5)']), 'rgb(128, 128, 128)');
assert.equal(composeOpaqueBackground([]), 'rgb(0, 0, 0)');

console.log('floor snapshot model: ok');
