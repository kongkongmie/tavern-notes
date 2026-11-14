function normalizeThemeState(data = {}, fallback = {}) {
    const themes = Array.isArray(data.themes)
        ? data.themes
        : (Array.isArray(fallback.themes) ? fallback.themes : []);
    const activeId = String(data.activeId || data.id || fallback.activeId || 'default');
    const activeTheme = data.activeTheme
        || data.theme
        || fallback.activeTheme
        || {};
    return { themes, activeId, activeTheme };
}

export function createThemeRepository({ request }) {
    if (typeof request !== 'function') {
        throw new TypeError('Theme Repository requires a request adapter.');
    }

    async function listThemes() {
        return normalizeThemeState(await request('/themes'));
    }

    async function getActiveTheme() {
        return normalizeThemeState(await request('/theme'));
    }

    async function activateTheme(id) {
        return normalizeThemeState(await request(`/themes/${encodeURIComponent(id || 'default')}/activate`, {
            method: 'POST',
        }));
    }

    async function importTheme(theme, options = {}) {
        return normalizeThemeState(await request('/themes', {
            method: 'POST',
            body: JSON.stringify({
                theme,
                id: options.id || null,
                activate: options.activate !== false,
            }),
        }));
    }

    async function deleteTheme(id) {
        return normalizeThemeState(await request(`/themes/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        }));
    }

    return {
        listThemes,
        getActiveTheme,
        activateTheme,
        importTheme,
        deleteTheme,
    };
}
