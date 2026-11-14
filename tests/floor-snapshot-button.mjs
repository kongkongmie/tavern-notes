import assert from 'node:assert/strict';
import { createCaptureView } from '../features/capture-view.js';

globalThis.MutationObserver = class { observe() {} disconnect() {} };

function makeElement() {
    const element = {
        classList: { add(...names) { element.className = `${element.className} ${names.join(' ')}`.trim(); } },
        className: '',
        innerHTML: '',
        setAttribute() {},
        addEventListener() {},
    };
    return element;
}

const prepended = [];
const actionBar = { prepend: element => prepended.unshift(element) };
const message = {
    querySelector: selector => (selector === '.mes_buttons' ? actionBar : null),
    closest: () => message,
};
const listeners = {};
const documentRef = {
    body: {},
    addEventListener: (type, handler) => { listeners[type] = handler; },
    createElement: makeElement,
    querySelector: () => null,
    querySelectorAll: selector => (selector.includes('.mes') ? [message] : []),
};
const calls = [];
const view = createCaptureView({
    documentRef,
    windowRef: { addEventListener() {}, getSelection: () => null, setTimeout },
    selectors: {
        selectionButton: '#selection',
        selectionClass: 'tn-selection-capture',
        floorButton: '.tn-floor-capture:not(.tn-floor-snapshot)',
        floorSnapshotButton: '.tn-floor-snapshot',
        floorActions: '.mes_buttons',
        chat: '#chat',
        messages: '.mes',
        message: '.mes',
    },
    translate: key => key,
    escapeHtml: String,
    isSelectionEnabled: () => false,
    isFloorEnabled: () => true,
    getSelectionSnapshot: () => null,
    onSelectionCapture() {},
    onFloorCapture: () => calls.push('capture'),
    onFloorSnapshot: () => calls.push('snapshot'),
});
view.mount();

assert.equal(prepended.length, 2, 'both floor buttons are added to the action bar');
assert.match(prepended[0].className, /tn-floor-capture/);
assert.doesNotMatch(prepended[0].className, /tn-floor-snapshot/, 'text capture stays first');
assert.match(prepended[1].className, /tn-floor-snapshot/);
assert.match(prepended[1].innerHTML, /fa-camera/);

const click = button => listeners.click({
    type: 'click',
    target: {
        closest: selector => {
            const found = { closest: () => message };
            if (selector === '.tn-floor-snapshot') return button === 'snapshot' ? found : null;
            return found;
        },
    },
    preventDefault() {},
    stopPropagation() {},
});
click('snapshot');
click('capture');
assert.deepEqual(calls, ['snapshot', 'capture']);

view.destroy();
console.log('floor snapshot button: ok');
