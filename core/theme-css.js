import { generate, parse, walk } from '../vendor/css-tree/csstree.esm.js';

const MAX_THEME_CSS_LENGTH = 100_000;
const ALLOWED_AT_RULES = new Set(['media', 'supports', 'container', 'keyframes', '-webkit-keyframes', 'font-face']);
const EXTERNAL_IDS = new Set(['chat', 'send_but', 'extensionsmenu', 'sheld']);
const EXTERNAL_TYPES = new Set(['html', 'body', 'head']);
const ESCAPING_PSEUDOS = new Set(['root', 'host', 'host-context']);
const ESCAPING_PSEUDO_ELEMENTS = new Set(['part', 'slotted']);
const UNSAFE_PROPERTIES = new Set(['behavior', '-moz-binding']);

export class ThemeCssError extends Error {
    constructor(message, node = null) {
        const line = node?.loc?.start?.line;
        const column = node?.loc?.start?.column;
        super(line ? `${message}（第 ${line} 行，第 ${column} 列）` : message);
        this.name = 'ThemeCssError';
        this.line = line || null;
        this.column = column || null;
    }
}

export function normalizeThemeCssId(value) {
    const clean = String(value || 'theme').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    return (clean || 'theme').slice(0, 48);
}

function fail(message, node) {
    throw new ThemeCssError(message, node);
}

function validateSelector(selector) {
    walk(selector, node => {
        if (node.type === 'TypeSelector' && EXTERNAL_TYPES.has(String(node.name).toLowerCase())) {
            fail(`主题选择器不能指向 ${node.name}`, node);
        }
        if (node.type === 'IdSelector' && EXTERNAL_IDS.has(String(node.name).toLowerCase())) {
            fail(`主题选择器不能指向 #${node.name}`, node);
        }
        if (node.type === 'PseudoClassSelector' && ESCAPING_PSEUDOS.has(String(node.name).toLowerCase())) {
            fail(`主题选择器不能使用 :${node.name}`, node);
        }
        if (node.type === 'PseudoElementSelector' && ESCAPING_PSEUDO_ELEMENTS.has(String(node.name).toLowerCase())) {
            fail(`主题选择器不能使用 ::${node.name}`, node);
        }
    });
}

function scopeSelector(selector, scopeSelectorAst) {
    validateSelector(selector);
    const first = selector.children.first;
    if (first?.type === 'PseudoClassSelector' && first.name.toLowerCase() === 'scope') {
        const firstItem = selector.children.head;
        selector.children.insertList(scopeSelectorAst.children.copy(), firstItem);
        selector.children.remove(firstItem);
        return;
    }
    let nestedScope = null;
    walk(selector, node => {
        if (node.type === 'PseudoClassSelector' && node.name.toLowerCase() === 'scope') nestedScope = node;
    });
    if (nestedScope) fail(':scope 只能放在选择器开头', nestedScope);
    selector.children.prependData({ type: 'Combinator', loc: null, name: ' ' });
    selector.children.prependList(scopeSelectorAst.children.copy());
}

function validateUrl(node) {
    const value = String(node.value || '').trim();
    if (/^https:\/\//i.test(value) || /^data:image\/[a-z0-9.+-]+(?:;|,)/i.test(value)) return;
    fail('主题资源只允许 HTTPS 图片或 data:image URL', node);
}

function renameKeyframes(ast, themeId) {
    const names = new Map();
    walk(ast, {
        visit: 'Atrule',
        enter(node) {
            const name = String(node.name || '').toLowerCase();
            if (!['keyframes', '-webkit-keyframes'].includes(name)) return;
            const identifier = node.prelude?.children?.first;
            if (identifier?.type !== 'Identifier') fail('@keyframes 必须使用普通动画名称', node);
            const original = identifier.name;
            const renamed = `tn-${themeId}-${normalizeThemeCssId(original)}`;
            names.set(original, renamed);
            identifier.name = renamed;
        },
    });
    if (!names.size) return names;
    walk(ast, {
        visit: 'Declaration',
        enter(node) {
            if (!['animation', 'animation-name', '-webkit-animation', '-webkit-animation-name'].includes(String(node.property).toLowerCase())) return;
            walk(node.value, child => {
                if (child.type === 'Identifier' && names.has(child.name)) child.name = names.get(child.name);
            });
        },
    });
    return names;
}

function renameFontFamilies(ast, themeId) {
    const names = new Map();
    walk(ast, {
        visit: 'Declaration',
        enter(node) {
            if (String(this.atrule?.name || '').toLowerCase() !== 'font-face' || String(node.property).toLowerCase() !== 'font-family') return;
            const family = node.value?.children?.first;
            if (!['String', 'Identifier'].includes(family?.type)) fail('@font-face 必须使用普通字体名称', node);
            const original = family.value ?? family.name;
            const renamed = `tn-${themeId}-${normalizeThemeCssId(original)}`;
            names.set(original, renamed);
            if (family.type === 'String') family.value = renamed;
            else family.name = renamed;
        },
    });
    if (!names.size) return names;
    walk(ast, {
        visit: 'Declaration',
        enter(node) {
            if (!['font', 'font-family'].includes(String(node.property).toLowerCase())) return;
            walk(node.value, child => {
                if (child.type === 'String' && names.has(child.value)) child.value = names.get(child.value);
                if (child.type === 'Identifier' && names.has(child.name)) child.name = names.get(child.name);
            });
        },
    });
    return names;
}

export function compileThemeCss(source, { themeId = 'theme', panelSelector = '#tavern-notes-panel' } = {}) {
    const css = String(source || '');
    const normalizedId = normalizeThemeCssId(themeId);
    if (!css.trim()) return { css: '', themeId: normalizedId, keyframes: [], fonts: [] };
    if (css.length > MAX_THEME_CSS_LENGTH) throw new ThemeCssError('主题 CSS 不能超过 100 KB');

    let ast;
    try {
        ast = parse(css, { context: 'stylesheet', positions: true, filename: 'theme.css' });
    } catch (error) {
        const line = error?.loc?.line || error?.line;
        const column = error?.loc?.column || error?.column;
        const wrapped = new ThemeCssError('主题 CSS 解析失败');
        wrapped.line = line || null;
        wrapped.column = column || null;
        wrapped.message = line ? `主题 CSS 解析失败（第 ${line} 行，第 ${column} 列）` : '主题 CSS 解析失败';
        throw wrapped;
    }

    walk(ast, {
        visit: 'Atrule',
        enter(node) {
            const name = String(node.name || '').toLowerCase();
            if (!ALLOWED_AT_RULES.has(name)) fail(`主题 CSS 不允许 @${node.name}`, node);
        },
    });
    walk(ast, { visit: 'Url', enter: validateUrl });
    walk(ast, {
        visit: 'Declaration',
        enter(node) {
            const property = String(node.property || '').toLowerCase();
            if (UNSAFE_PROPERTIES.has(property)) fail(`主题 CSS 不允许 ${node.property}`, node);
            const value = generate(node.value);
            if (/expression\s*\(|(?:java|vb)script\s*:/i.test(value)) fail('主题 CSS 包含不安全的声明值', node);
        },
    });

    const keyframes = renameKeyframes(ast, normalizedId);
    const fonts = renameFontFamilies(ast, normalizedId);
    const scope = parse(`${panelSelector}[data-tn-theme-id="${normalizedId}"]`, { context: 'selector' });
    walk(ast, {
        visit: 'Rule',
        enter(node) {
            if (['keyframes', '-webkit-keyframes'].includes(String(this.atrule?.name || '').toLowerCase())) return;
            if (node.prelude?.type !== 'SelectorList') fail('主题 CSS 包含无法识别的选择器', node);
            node.prelude.children.forEach(selector => scopeSelector(selector, scope));
        },
    });

    return { css: generate(ast), themeId: normalizedId, keyframes: [...keyframes.values()], fonts: [...fonts.values()] };
}
