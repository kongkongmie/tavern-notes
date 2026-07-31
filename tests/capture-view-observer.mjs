import assert from 'node:assert/strict';
import { createCaptureView } from '../features/capture-view.js';

let observerCallback = null;
let observedRoot = null;
globalThis.MutationObserver = class {
    constructor(callback) { observerCallback = callback; }
    observe(root) { observedRoot = root; }
    disconnect() {}
};

let appended = 0;
const message = {
    querySelector: () => null,
    append: () => { appended += 1; },
};
const body = {};
const documentRef = {
    body,
    addEventListener() {},
    createElement: () => ({
        addEventListener() {},
        className: '',
        innerHTML: '',
        title: '',
        type: '',
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
};
const view = createCaptureView({
    documentRef,
    windowRef: { addEventListener() {}, getSelection: () => null },
    selectors: {
        selectionButton: '#selection',
        selectionClass: 'tn-selection-capture',
        floorButton: '.tn-floor-capture',
        chat: '#chat',
        messages: '.mes, [mesid], [data-mesid]',
        message: '.mes, [mesid], [data-mesid]',
    },
    classPrefix: 'tn',
    translate: key => key,
    escapeHtml: String,
    isSelectionEnabled: () => false,
    isFloorEnabled: () => true,
    getSelectionSnapshot: () => null,
    onSelectionCapture() {},
    onFloorCapture() {},
});

view.mount();
assert.equal(observedRoot, body, 'observer must stay on the stable page body');

observerCallback([{
    addedNodes: [{
        nodeType: 11,
        matches: () => false,
        querySelectorAll: () => [message],
    }],
}]);
assert.equal(appended, 1, 'messages inserted through a DocumentFragment must receive floor capture');

view.destroy();
console.log('capture view observer: ok');
