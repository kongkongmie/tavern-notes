// Pure rules for the whole-floor long screenshot: canvas sizing and file naming.

export const FLOOR_SNAPSHOT_PREFERRED_SCALE = 2;
// iOS Safari refuses canvases above ~16.7M pixels; stay under it everywhere.
export const FLOOR_SNAPSHOT_MAX_AREA = 16_000_000;
// Keep a single side well inside every browser's canvas limit.
export const FLOOR_SNAPSHOT_MAX_SIDE = 16_384;

export const FLOOR_SNAPSHOT_EXCLUDE_SELECTOR = [
    '.mes_buttons',
    '.mes_edit_buttons',
    '.extraMesButtons',
    '.extraMesButtonsHint',
    '.swipe_left',
    '.swipe_right',
    '.swipeRightBlock',
    '.tn-floor-capture',
    '.tn-floor-snapshot',
    '#tavern-notes-selection-capture',
].join(',');

function positive(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

export function planFloorSnapshot({
    width,
    height,
    preferredScale = FLOOR_SNAPSHOT_PREFERRED_SCALE,
    maxArea = FLOOR_SNAPSHOT_MAX_AREA,
    maxSide = FLOOR_SNAPSHOT_MAX_SIDE,
} = {}) {
    const w = Math.max(1, Math.ceil(positive(width, 1)));
    const h = Math.max(1, Math.ceil(positive(height, 1)));
    const fitScale = Math.min(
        positive(preferredScale, 1),
        Math.sqrt(maxArea / (w * h)),
        maxSide / h,
        maxSide / w,
    );
    if (fitScale >= 1) {
        return { width: w, height: h, scale: Math.floor(fitScale * 100) / 100, slices: [{ y: 0, height: h }] };
    }
    // Too long for one canvas even at 1x: keep 1x (or less for absurdly wide floors) and cut into parts.
    const scale = Math.min(1, maxSide / w, Math.sqrt(maxArea / w / w));
    const sliceHeight = Math.max(1, Math.floor(Math.min(maxSide, maxArea / (w * scale)) / scale));
    const slices = [];
    for (let y = 0; y < h; y += sliceHeight) slices.push({ y, height: Math.min(sliceHeight, h - y) });
    return { width: w, height: h, scale, slices };
}

function sanitize(value, fallback) {
    const text = String(value ?? '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
    return (text || fallback).slice(0, 60);
}

function stamp(date) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

export function createFloorSnapshotFilename({ brand, characterName, messageId, part = 1, parts = 1, date = new Date() } = {}) {
    const floor = Number.isFinite(Number(messageId)) && String(messageId) !== '' ? `-F${Number(messageId)}` : '';
    const suffix = parts > 1 ? `-${part}of${parts}` : '';
    return `${sanitize(brand, 'TavernNotes')}-${sanitize(characterName, 'chat')}${floor}-${stamp(date)}${suffix}.png`;
}

// Blend the semi-transparent backgrounds from the page root down to the message into one opaque color.
export function composeOpaqueBackground(colors, base = [0, 0, 0]) {
    let [r, g, b] = base;
    for (const color of colors) {
        const match = String(color || '').match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/i);
        if (!match) continue;
        let alpha = match[4] === undefined ? 1 : Number.parseFloat(match[4]);
        if (String(match[4] || '').endsWith('%')) alpha /= 100;
        if (!Number.isFinite(alpha) || alpha <= 0) continue;
        alpha = Math.min(alpha, 1);
        r = Number(match[1]) * alpha + r * (1 - alpha);
        g = Number(match[2]) * alpha + g * (1 - alpha);
        b = Number(match[3]) * alpha + b * (1 - alpha);
    }
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
