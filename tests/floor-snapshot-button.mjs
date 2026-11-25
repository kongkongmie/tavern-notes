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

// Each button has its own switch, and both can live in SillyTavern's "…" menu.
function harness({ capture = true, snapshot = true, inMenu = false } = {}) {
    const holders = [];
    // Like the DOM: prepending an element moves it out of its previous parent.
    const holder = name => ({ name, items: [], prepend(element) {
        holders.forEach(other => { other.items = other.items.filter(item => item !== element); });
        this.items.unshift(element);
        element.parentElement = this;
    } });
    const bar = holder('bar');
    const menu = holder('menu');
    holders.push(bar, menu);
    const floor = {
        querySelector: selector => {
            if (selector === '.mes_buttons') return bar;
            if (selector === '.mes_buttons .extraMesButtons') return menu;
            const all = [...bar.items, ...menu.items];
            if (selector === '.tn-floor-snapshot') return all.find(item => /tn-floor-snapshot/.test(item.className)) || null;
            if (selector.startsWith('.tn-floor-capture')) return all.find(item => !/tn-floor-snapshot/.test(item.className)) || null;
            return null;
        },
        closest: () => floor,
    };
    const removed = [];
    const options = { capture, snapshot, inMenu };
    const doc = {
        body: {},
        addEventListener() {},
        createElement: makeElement,
        querySelector: () => null,
        querySelectorAll: selector => {
            if (selector.includes('.mes')) return [floor];
            const all = [...bar.items, ...menu.items];
            const pick = selector === '.tn-floor-snapshot'
                ? all.filter(item => /tn-floor-snapshot/.test(item.className))
                : all.filter(item => !/tn-floor-snapshot/.test(item.className));
            return pick.map(item => ({ remove() {
                removed.push(item);
                for (const holder of [bar, menu]) holder.items = holder.items.filter(entry => entry !== item);
            } }));
        },
    };
    const captureView = createCaptureView({
        documentRef: doc,
        windowRef: { addEventListener() {}, getSelection: () => null, setTimeout },
        selectors: {
            selectionButton: '#selection', selectionClass: 'tn-selection-capture',
            floorButton: '.tn-floor-capture:not(.tn-floor-snapshot)', floorSnapshotButton: '.tn-floor-snapshot',
            floorActions: '.mes_buttons', floorMenu: '.mes_buttons .extraMesButtons',
            chat: '#chat', messages: '.mes', message: '.mes',
        },
        translate: key => key,
        escapeHtml: String,
        isSelectionEnabled: () => false,
        isFloorEnabled: () => options.capture,
        isSnapshotEnabled: () => options.snapshot,
        isInMenu: () => options.inMenu,
        getSelectionSnapshot: () => null,
        onSelectionCapture() {},
        onFloorCapture() {},
        onFloorSnapshot() {},
    });
    captureView.mount();
    return { bar, menu, options, view: captureView };
}

{
    const h = harness({ capture: false, snapshot: true });
    assert.equal(h.bar.items.length, 1, 'only the long-image button when capture is off');
    assert.match(h.bar.items[0].className, /tn-floor-snapshot/);
    h.options.snapshot = false;
    h.view.refreshFloorButtons();
    assert.equal(h.bar.items.length, 0, 'both off: no floor buttons at all');
    h.view.destroy();
}
{
    const h = harness({ capture: true, snapshot: false });
    assert.equal(h.bar.items.length, 1);
    assert.doesNotMatch(h.bar.items[0].className, /tn-floor-snapshot/, 'only the capture button when long image is off');
    h.view.destroy();
}
{
    const h = harness({ inMenu: true });
    assert.equal(h.bar.items.length, 0, 'nothing directly on the message');
    assert.equal(h.menu.items.length, 2, 'both buttons inside the "…" menu');
    h.options.inMenu = false;
    h.view.refreshFloorButtons();
    assert.equal(h.menu.items.length, 0);
    assert.equal(h.bar.items.length, 2, 'switching back moves them out of the menu');
    h.view.destroy();
}

console.log('floor snapshot button: ok');
