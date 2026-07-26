import assert from 'node:assert/strict';
import { createLocalThemeRepository } from '../core/local-theme-repository.js';

const values = new Map();
const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
};
const defaultTheme = { id: 'default', name: 'Default', variables: { '--tn-paper': '#fff' } };
const appleTheme = { id: 'apple-glass', name: 'Apple', variables: { '--tn-paper': '#eee' } };
const request = createLocalThemeRepository({
    storage,
    themeStorageKey: 'themes',
    activeThemeKey: 'active',
    appleThemeId: 'apple-glass',
    getBuiltInThemes: () => [
        { id: 'default', name: 'Default', builtIn: true, theme: defaultTheme },
        { id: 'apple-glass', name: 'Apple', builtIn: true, theme: appleTheme },
    ],
    normalizeTheme: theme => theme,
    isRetiredTheme: record => record.id === 'archive',
    translate: key => key,
});

assert.equal((await request('/theme')).activeId, 'default');
const saved = await request('/themes', { method: 'POST', body: JSON.stringify({ theme: { name: 'Custom', variables: {} } }) });
assert.equal(saved.activeId, saved.id);
assert.equal((await request(`/themes/${saved.id}/activate`, { method: 'POST' })).activeId, saved.id);
assert.equal((await request(`/themes/${saved.id}`, { method: 'DELETE' })).activeId, 'default');
await assert.rejects(() => request('/themes', { method: 'POST', body: JSON.stringify({ id: 'archive', theme: { name: 'Retired' } }) }));

console.log('Local theme repository test passed.');
