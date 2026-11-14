export const THEME_DECORATION_SLOTS = Object.freeze([
    'panel-background',
    'header-decoration',
    'card-decoration',
    'empty-state-decoration',
    'footer-decoration',
]);

const SLOT_SET = new Set(THEME_DECORATION_SLOTS);
const TYPE_SET = new Set(['image', 'text', 'shape']);
const SHAPE_SET = new Set(['circle', 'square', 'line']);

export function isSafeThemeImage(value) {
    return /^https:\/\//i.test(String(value || '').trim())
        || /^data:image\/[a-z0-9.+-]+(?:;|,)/i.test(String(value || '').trim());
}

export function normalizeThemeDecorations(value) {
    if (!Array.isArray(value)) return [];
    const normalized = [];
    for (const item of value) {
        if (!item || !SLOT_SET.has(item.slot) || !TYPE_SET.has(item.type)) continue;
        const type = item.type;
        let content = String(item.value || '').trim();
        if (type === 'image' && !isSafeThemeImage(content)) continue;
        if (type === 'shape' && !SHAPE_SET.has(content)) content = 'circle';
        if (!content && type !== 'shape') continue;
        normalized.push({
            slot: item.slot,
            type,
            value: content.slice(0, type === 'image' ? 50_000 : 500),
            className: String(item.className || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40),
            alt: type === 'image' ? String(item.alt || '').slice(0, 200) : '',
        });
        if (normalized.length >= 20) break;
    }
    return normalized;
}
