import { normalizeThemeDecorations } from './theme-decorations.js';

export function createThemeModel({
    defaultTheme,
    convertVariables = variables => ({ ...(variables || {}) }),
    variablePrefix = '--tn-',
    appleThemeId = 'apple-glass',
    legacyAppleThemeIds = ['apple-glass-day', 'apple-glass-night'],
    defaultNightVariables = {},
    appleDayVariables = {},
    appleNightVariables = {},
}) {
    const flavorVariable = `${variablePrefix}theme-flavor`;

    function normalizeTheme(theme) {
        const description = String(theme?.description || '');
        const customCss = String(theme?.customCss || '');
        const decorations = normalizeThemeDecorations(theme?.decorations);
        const usesVersionTwo = Boolean(description || customCss || decorations.length);
        return {
            ...defaultTheme,
            ...(theme || {}),
            version: usesVersionTwo ? 2 : (theme?.version ?? defaultTheme.version),
            variables: {
                ...defaultTheme.variables,
                ...convertVariables(theme?.variables),
            },
            assets: {
                ...defaultTheme.assets,
                ...(theme?.assets || {}),
            },
            description,
            customCss,
            decorations,
        };
    }

    function normalizeAppleThemeId(id) {
        return legacyAppleThemeIds.includes(id) ? appleThemeId : id;
    }

    function themeIsApple(theme) {
        return String(theme?.variables?.[flavorVariable] || '').toLowerCase() === 'apple';
    }

    function isAppleThemeId(id) {
        return normalizeAppleThemeId(id) === appleThemeId;
    }

    function resolveTheme(theme, {
        activeThemeId = 'default',
        appleMode = 'day',
        defaultMode = 'day',
    } = {}) {
        const clean = normalizeTheme(theme);
        if (themeIsApple(clean)) {
            return {
                ...clean,
                variables: {
                    ...clean.variables,
                    ...(appleMode === 'night' ? appleNightVariables : appleDayVariables),
                },
            };
        }
        const isDefault = normalizeAppleThemeId(activeThemeId) === 'default'
            && String(clean.variables[flavorVariable] || 'default').toLowerCase() === 'default';
        if (!isDefault || defaultMode !== 'night') return clean;
        return {
            ...clean,
            variables: {
                ...clean.variables,
                ...defaultNightVariables,
            },
        };
    }

    return {
        normalizeTheme,
        normalizeAppleThemeId,
        themeIsApple,
        isAppleThemeId,
        resolveTheme,
    };
}
