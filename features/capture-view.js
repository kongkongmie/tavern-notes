export function createSelectionSnapshotReader({
    documentRef = document,
    windowRef = window,
    ignoredSelector,
    inputSelector,
}) {
    function messageId(selection) {
        if (!selection?.rangeCount) return null;
        for (const start of [selection.anchorNode, selection.focusNode]) {
            const message = (start?.nodeType === 1 ? start : start?.parentElement)?.closest?.('[mesid], .mes');
            const raw = message?.getAttribute?.('mesid') ?? message?.dataset?.mesid;
            if (raw !== undefined && raw !== null) return Number.isFinite(Number(raw)) ? Number(raw) : raw;
        }
        return null;
    }

    function ignored(selection) {
        return [selection?.anchorNode, selection?.focusNode].some(start => {
            const element = start?.nodeType === 1 ? start : start?.parentElement;
            return Boolean(element?.closest?.(ignoredSelector));
        });
    }

    function fromInput(element, offset = null) {
        if (!['INPUT', 'TEXTAREA'].includes(String(element?.tagName || '').toUpperCase())) return null;
        if (element.closest?.(ignoredSelector) || element.selectionStart === element.selectionEnd) return null;
        const text = String(element.value || '').slice(element.selectionStart, element.selectionEnd).trim();
        if (!text) return null;
        const rect = element.getBoundingClientRect();
        return {
            text,
            messageId: null,
            source: element.matches?.(inputSelector) ? 'input_selection' : 'selected_text',
            rect: offset ? { ...rect, left: rect.left + offset.left, right: rect.right + offset.left, top: rect.top + offset.top, bottom: rect.bottom + offset.top } : rect,
        };
    }

    function fromSelection(selection, offset = null) {
        const text = selection?.toString?.().trim();
        if (!text || !selection.rangeCount || ignored(selection)) return null;
        const range = selection.getRangeAt(selection.rangeCount - 1);
        const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
        const rect = rects.at(-1) || range.getBoundingClientRect();
        return {
            text,
            messageId: messageId(selection),
            source: 'selected_text',
            rect: offset ? { ...rect, left: rect.left + offset.left, right: rect.right + offset.left, top: rect.top + offset.top, bottom: rect.bottom + offset.top } : rect,
        };
    }

    return function readSelectionSnapshot() {
        const active = fromInput(documentRef.activeElement);
        if (active) return active;
        const selected = fromSelection(windowRef.getSelection?.());
        if (selected) return selected;
        for (const frame of documentRef.querySelectorAll('iframe')) {
            try {
                const offset = frame.getBoundingClientRect();
                const input = fromInput(frame.contentDocument?.activeElement, offset);
                if (input) return input;
                const snapshot = fromSelection(frame.contentWindow?.getSelection?.(), offset);
                if (snapshot) return snapshot;
            } catch { /* cross-origin */ }
        }
        return null;
    };
}

export function createCaptureView({
    documentRef = document,
    windowRef = window,
    selectors,
    classPrefix = 'tn',
    translate,
    escapeHtml,
    isSelectionEnabled,
    isFloorEnabled,
    getSelectionSnapshot,
    onSelectionCapture,
    onFloorCapture,
    onChatChanged = null,
}) {
    let mounted = false;
    let observer = null;
    let unsubscribeChatChanged = null;
    let timer = null;
    let abortController = null;
    let lastSelection = null;
    let selectionDismissedUntil = 0;

    function clearSelections() {
        const selections = [windowRef.getSelection?.()];
        for (const frame of documentRef.querySelectorAll('iframe')) {
            try { selections.push(frame.contentWindow?.getSelection?.()); } catch { /* cross-origin */ }
        }
        for (const selection of new Set(selections.filter(Boolean))) {
            try { selection.removeAllRanges(); } catch { /* embedded selection may reject clearing */ }
        }
    }

    function hideSelectionButton() {
        documentRef.querySelector(selectors.selectionButton)?.classList.remove('show');
    }

    function ensureSelectionButton() {
        let button = documentRef.querySelector(selectors.selectionButton);
        if (button) return button;
        button = documentRef.createElement('button');
        button.id = selectors.selectionButton.replace(/^#/, '');
        button.className = selectors.selectionClass;
        button.type = 'button';
        button.innerHTML = `<i class="fa-solid fa-highlighter"></i><span>${escapeHtml(translate('captureSelected'))}</span>`;
        button.addEventListener('mousedown', event => event.preventDefault(), { signal: abortController.signal });
        button.addEventListener('click', event => {
            event.preventDefault();
            onSelectionCapture(lastSelection);
            lastSelection = null;
            selectionDismissedUntil = Date.now() + 1000;
            clearSelections();
            hideSelectionButton();
        }, { signal: abortController.signal });
        documentRef.body.append(button);
        return button;
    }

    function updateSelectionButton() {
        if (!mounted || !isSelectionEnabled() || Date.now() < selectionDismissedUntil) return hideSelectionButton();
        const snapshot = getSelectionSnapshot();
        if (!snapshot?.text || !snapshot.rect) return hideSelectionButton();
        lastSelection = snapshot;
        const button = ensureSelectionButton();
        const margin = 8;
        const left = Math.min(Math.max(snapshot.rect.right + margin, margin), windowRef.innerWidth - (button.offsetWidth || 92) - margin);
        const top = Math.min(Math.max(snapshot.rect.bottom + margin, margin), windowRef.innerHeight - (button.offsetHeight || 34) - margin);
        button.style.left = `${left}px`;
        button.style.top = `${top}px`;
        button.classList.add('show');
    }

    function scheduleSelectionButton() {
        clearTimeout(timer);
        timer = setTimeout(updateSelectionButton, 80);
    }

    function ensureFloorButton(candidate) {
        const message = candidate?.closest?.('.mes') || candidate;
        if (!message?.querySelector) return;
        if (!isFloorEnabled()) return;
        const actionBar = message.querySelector(selectors.floorActions || '.mes_buttons');
        const existing = message.querySelector(selectors.floorButton);
        if (existing) {
            if (actionBar && existing.parentElement !== actionBar) {
                existing.classList.add('mes_button', uiClass('floor-capture-integrated', { classPrefix }));
                actionBar.prepend(existing);
            }
            return;
        }
        const button = documentRef.createElement('div');
        button.setAttribute?.('role', 'button');
        button.tabIndex = 0;
        button.className = uiClass('floor-capture', { classPrefix });
        button.title = translate('captureFloorTitle');
        button.setAttribute?.('aria-label', translate('captureFloorTitle'));
        button.innerHTML = `<i class="fa-solid fa-file-lines"></i><span>${escapeHtml(translate('captureFloor'))}</span>`;
        if (actionBar) {
            button.classList.add('mes_button', uiClass('floor-capture-integrated', { classPrefix }));
            actionBar.prepend(button);
        } else {
            message.append(button);
        }
    }

    function handleFloorButton(event) {
        const button = event.target?.closest?.(selectors.floorButton);
        if (!button) return;
        if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
        const messageSelector = selectors.message || selectors.messages;
        const message = button.closest?.(messageSelector);
        if (!message) return;
        event.preventDefault();
        event.stopPropagation();
        onFloorCapture(message);
    }

    function refreshFloorButtons(root = documentRef) {
        if (!isFloorEnabled()) {
            documentRef.querySelectorAll(selectors.floorButton).forEach(button => button.remove());
            return;
        }
        const messageSelector = selectors.messages || selectors.message;
        const messages = new Set();
        const containingMessage = root?.closest?.(messageSelector);
        if (containingMessage) messages.add(containingMessage);
        if (root?.matches?.(messageSelector)) messages.add(root);
        root.querySelectorAll?.(messageSelector).forEach(message => messages.add(message));
        messages.forEach(ensureFloorButton);
    }

    function mount() {
        destroy();
        mounted = true;
        abortController = new AbortController();
        documentRef.addEventListener('selectionchange', scheduleSelectionButton, { signal: abortController.signal });
        documentRef.addEventListener('mouseup', scheduleSelectionButton, { signal: abortController.signal });
        documentRef.addEventListener('scroll', hideSelectionButton, { capture: true, signal: abortController.signal });
        documentRef.addEventListener('click', handleFloorButton, { capture: true, signal: abortController.signal });
        documentRef.addEventListener('keydown', handleFloorButton, { capture: true, signal: abortController.signal });
        windowRef.addEventListener('resize', hideSelectionButton, { signal: abortController.signal });
        refreshFloorButtons();
        unsubscribeChatChanged = onChatChanged?.(() => {
            windowRef.setTimeout(() => refreshFloorButtons(), 0);
            windowRef.setTimeout(() => refreshFloorButtons(), 120);
        }) || null;
        // Observe the stable page body because SillyTavern may replace #chat.
        const observationRoot = documentRef.body || documentRef.querySelector(selectors.chat);
        if (observationRoot) {
            observer = new MutationObserver(records => {
                if (!mounted) return;
                records.forEach(record => record.addedNodes.forEach(node => {
                    if (![1, 11].includes(node?.nodeType)) return;
                    refreshFloorButtons(node);
                }));
            });
            observer.observe(observationRoot, { childList: true, subtree: true });
        }
    }

    function destroy() {
        mounted = false;
        clearTimeout(timer);
        timer = null;
        observer?.disconnect();
        observer = null;
        unsubscribeChatChanged?.();
        unsubscribeChatChanged = null;
        abortController?.abort();
        abortController = null;
        documentRef.querySelector(selectors.selectionButton)?.remove();
        documentRef.querySelectorAll(selectors.floorButton).forEach(button => button.remove());
    }

    return { mount, destroy, refreshFloorButtons, hideSelectionButton };
}
import { uiClass } from '../core/ui-class-names.js';
