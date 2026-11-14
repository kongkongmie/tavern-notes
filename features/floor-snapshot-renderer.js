import {
    FLOOR_SNAPSHOT_EXCLUDE_SELECTOR,
    composeOpaqueBackground,
    planFloorSnapshot,
} from '../core/floor-snapshot-model.js';

const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function defaultLoadLibrary() {
    return import('../vendor/modern-screenshot/modern-screenshot.esm.js');
}

function svgToDataUrl(svg) {
    const markup = new XMLSerializer().serializeToString(svg)
        .replace(/[\u0000-\u0008\v\f\u000E-\u001F\uD800-\uDFFF￾￿]/gu, '');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => (blob && blob.size ? resolve(blob) : reject(new Error('floor-snapshot-empty-result'))), 'image/png');
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const NOWRAP_ATTRIBUTE = 'data-tn-snapshot-nowrap';
const PSEUDO_NOWRAP_ATTRIBUTE = 'data-tn-snapshot-label';
const MAX_LABEL_LENGTH = 24;

// Short ::before/::after labels (badges such as "LOG") get a rounded width in the clone too.
function hasShortPseudoLabel(element) {
    const view = element.ownerDocument?.defaultView;
    if (!view) return false;
    return ['::before', '::after'].some(pseudo => {
        const content = view.getComputedStyle(element, pseudo).content;
        const match = /^(["'])(.*)\1$/s.exec(String(content || ''));
        return Boolean(match && match[2].trim() && match[2].length <= MAX_LABEL_LENGTH);
    });
}

function collectDocuments(root) {
    const roots = [root];
    for (const frame of root.querySelectorAll?.('iframe') || []) {
        try {
            const body = frame.contentDocument?.documentElement;
            if (body) roots.push(...collectDocuments(body));
        } catch { /* cross-origin frames are rendered empty */ }
    }
    return roots;
}

// Computed widths are rounded, so a label that exactly fits one line on screen can wrap
// inside the SVG image. Mark every element whose own text is on one line so the clone keeps it there.
function markSingleLineText(root) {
    const marked = [];
    for (const scope of collectDocuments(root)) {
        const documentRef = scope.ownerDocument || scope;
        const range = documentRef.createRange?.();
        if (!range) continue;
        const elements = [scope, ...scope.querySelectorAll('*')];
        for (const element of elements) {
            if (hasShortPseudoLabel(element) && !element.hasAttribute(PSEUDO_NOWRAP_ATTRIBUTE)) {
                element.setAttribute(PSEUDO_NOWRAP_ATTRIBUTE, '');
                marked.push([element, PSEUDO_NOWRAP_ATTRIBUTE]);
            }
            const ownText = Array.from(element.childNodes).some(node => node.nodeType === 3 && /\S/.test(node.data));
            if (!ownText || element.hasAttribute(NOWRAP_ATTRIBUTE)) continue;
            range.selectNodeContents(element);
            const rects = Array.from(range.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
            if (!rects.length) continue;
            const top = Math.min(...rects.map(rect => rect.top));
            const lowestTop = Math.max(...rects.map(rect => rect.top));
            const lineHeight = Math.min(...rects.map(rect => rect.height));
            if (lowestTop - top >= lineHeight * 0.6) continue;
            element.setAttribute(NOWRAP_ATTRIBUTE, '');
            marked.push([element, NOWRAP_ATTRIBUTE]);
        }
    }
    return () => marked.forEach(([element, attribute]) => element.removeAttribute(attribute));
}

const FRAME_ATTRIBUTE = 'data-tn-snapshot-frame';

function sameOriginFrames(root) {
    return Array.from(root.querySelectorAll?.('iframe') || []).filter(frame => {
        try {
            return Boolean(frame.contentDocument?.documentElement) && frame.clientWidth > 0 && frame.clientHeight > 0;
        } catch {
            return false;
        }
    });
}

// The clone keeps the marker attribute; this rule (with !important, so it also beats the
// library's per-element and ::before/::after rules) holds those lines together.
const NOWRAP_CSS = `[${NOWRAP_ATTRIBUTE}], [${NOWRAP_ATTRIBUTE}] *, [${NOWRAP_ATTRIBUTE}]::before, [${NOWRAP_ATTRIBUTE}]::after, [${NOWRAP_ATTRIBUTE}] *::before, [${NOWRAP_ATTRIBUTE}] *::after { white-space: nowrap !important; text-wrap-mode: nowrap !important; }\n[${PSEUDO_NOWRAP_ATTRIBUTE}]::before, [${PSEUDO_NOWRAP_ATTRIBUTE}]::after { white-space: nowrap !important; text-wrap-mode: nowrap !important; }`;

function addNowrapRule(svg) {
    const style = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = NOWRAP_CSS;
    svg.append(style);
}

// Captures one rendered chat floor exactly as it is laid out on screen, including
// regex-beautified HTML and same-origin iframes (status bars), as one or more PNG blobs.
export function createFloorSnapshotRenderer({
    documentRef = document,
    windowRef = window,
    loadLibrary = defaultLoadLibrary,
    excludeSelector = FLOOR_SNAPSHOT_EXCLUDE_SELECTOR,
} = {}) {
    function resolveBackground(element) {
        const chain = [];
        for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
            chain.unshift(windowRef.getComputedStyle(node).backgroundColor);
        }
        return composeOpaqueBackground(chain);
    }

    function measure(messageElement) {
        if (!messageElement?.getBoundingClientRect) throw new Error('floor-snapshot-missing-message');
        const rect = messageElement.getBoundingClientRect();
        const width = Math.ceil(Math.max(messageElement.offsetWidth || 0, rect.width));
        const height = Math.ceil(Math.max(messageElement.scrollHeight || 0, messageElement.offsetHeight || 0, rect.height));
        return planFloorSnapshot({ width, height });
    }

    function nodeFilter(rootDocument) {
        return node => {
            if (node?.nodeType === 1 && excludeSelector && node.matches?.(excludeSelector)) return false;
            // Iframe contents are drawn from their own pre-rendered picture (see renderFrames).
            if (node?.ownerDocument && node.ownerDocument !== rootDocument && !node.hasAttribute?.(FRAME_ATTRIBUTE)) return false;
            return true;
        };
    }

    function baseOptions(rootDocument, frames) {
        return {
            filter: nodeFilter(rootDocument),
            fetch: { requestInit: { cache: 'force-cache' }, placeholderImage: TRANSPARENT_PIXEL },
            timeout: 30000,
            onCreateForeignObjectSvg: addNowrapRule,
            onCloneEachNode: cloned => {
                if (cloned?.nodeType !== 1 || !cloned.hasAttribute?.(FRAME_ATTRIBUTE)) return;
                const frame = frames[Number(cloned.getAttribute(FRAME_ATTRIBUTE))];
                cloned.removeAttribute(FRAME_ATTRIBUTE);
                if (!frame) return;
                cloned.replaceChildren();
                cloned.style.setProperty('width', `${frame.width}px`);
                cloned.style.setProperty('height', `${frame.height}px`);
                cloned.style.setProperty('overflow', 'hidden');
                const image = cloned.ownerDocument.createElement('img');
                image.src = frame.url;
                image.setAttribute('style', `display:block;width:${frame.width}px;height:${frame.height}px;max-width:none`);
                cloned.append(image);
            },
        };
    }

    // Each same-origin iframe (status bars, front-end cards) is rendered inside its own document,
    // where its fonts and styles resolve exactly as on screen, then pasted back as a picture.
    async function renderFrames(root, library, scale) {
        const frames = [];
        const marked = [];
        for (const frame of sameOriginFrames(root)) {
            const documentElement = frame.contentDocument.documentElement;
            const width = frame.clientWidth;
            const height = frame.clientHeight;
            const nested = await renderFrames(documentElement, library, scale);
            try {
                const url = await library.domToPng(documentElement, {
                    ...baseOptions(frame.contentDocument, nested.frames),
                    width,
                    height,
                    scale,
                    backgroundColor: null,
                });
                documentElement.setAttribute(FRAME_ATTRIBUTE, String(frames.length));
                marked.push(documentElement);
                frames.push({ url, width, height });
            } finally {
                nested.unmark();
            }
        }
        return { frames, unmark: () => marked.forEach(element => element.removeAttribute(FRAME_ATTRIBUTE)) };
    }

    async function render(messageElement, { onProgress = () => {} } = {}) {
        const plan = measure(messageElement);
        const library = await loadLibrary();
        const backgroundColor = resolveBackground(messageElement);
        const unmarkText = markSingleLineText(messageElement);
        let unmarkFrames = () => {};
        let context = null;
        let svg = null;
        try {
            onProgress({ stage: 'frames' });
            const rendered = await renderFrames(messageElement, library, plan.scale);
            unmarkFrames = rendered.unmark;
            context = await library.createContext(messageElement, {
                ...baseOptions(messageElement.ownerDocument, rendered.frames),
                width: plan.width,
                height: plan.height,
                scale: plan.scale,
                backgroundColor,
                progress: (current, total) => onProgress({ stage: 'assets', current, total }),
            });
            svg = await library.domToForeignObjectSvg(context);
        } catch (error) {
            if (context) library.destroyContext?.(context);
            throw error;
        } finally {
            unmarkFrames();
            unmarkText();
        }
        try {
            const redraws = Math.max(0, Number(context.drawImageCount) || 0);
            const interval = Math.max(0, Number(context.drawImageInterval) || 100);
            const image = await library.loadMedia(svgToDataUrl(svg), { ownerDocument: documentRef, timeout: 30000 });
            const blobs = [];
            for (const [index, slice] of plan.slices.entries()) {
                onProgress({ stage: 'draw', current: index + 1, total: plan.slices.length });
                const canvas = documentRef.createElement('canvas');
                canvas.width = Math.max(1, Math.floor(plan.width * plan.scale));
                canvas.height = Math.max(1, Math.floor(slice.height * plan.scale));
                const context2d = canvas.getContext('2d');
                if (!context2d) throw new Error('floor-snapshot-canvas-unavailable');
                const draw = () => {
                    context2d.fillStyle = backgroundColor;
                    context2d.fillRect(0, 0, canvas.width, canvas.height);
                    context2d.drawImage(image, 0, -slice.y * plan.scale, plan.width * plan.scale, plan.height * plan.scale);
                };
                draw();
                // Safari/Firefox may decode images nested in the SVG late; redraw like the library does.
                for (let attempt = 0; attempt < redraws; attempt += 1) {
                    await wait(attempt + interval);
                    draw();
                }
                blobs.push(await canvasToBlob(canvas));
                canvas.width = 0;
                canvas.height = 0;
            }
            return { blobs, width: plan.width, height: plan.height, scale: plan.scale };
        } finally {
            library.destroyContext?.(context);
        }
    }

    return { measure, render };
}
