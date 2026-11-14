import { combineLegacyNotes, isLegacyCustomThemeId, verifyMigratedNotes } from '../core/legacy-migration-model.js';

// Moves notes (and Full custom themes) from the old Server Plugin or the old Lite IndexedDB
// into file storage. The old data is only read, never changed or deleted.
export function createLegacyMigration({
    serverRequest,
    readLegacyBrowserNotes,
    storage,
    themeStore,
    themeKeys,
    user = () => 'default-user',
    onProgress = () => {},
}) {
    async function readFullNotes() {
        try {
            await serverRequest('/status');
        } catch {
            return null;
        }
        const exported = await serverRequest('/export.json');
        return Array.isArray(exported?.notes) ? exported.notes : [];
    }

    // Reads whatever old data exists. Nothing is written here.
    async function detect() {
        const [fullNotes, browserNotes] = await Promise.all([
            readFullNotes().catch(() => null),
            readLegacyBrowserNotes().catch(() => []),
        ]);
        const notes = combineLegacyNotes({ fullNotes: fullNotes || [], liteNotes: browserNotes });
        return {
            full: Boolean(fullNotes?.length),
            fullThemes: fullNotes !== null,
            browser: browserNotes.length > 0,
            fullNotes: fullNotes || [],
            browserNotes,
            count: notes.length,
        };
    }

    async function collectThemes() {
        const listing = await serverRequest('/themes');
        const custom = [];
        for (const summary of listing?.themes || []) {
            if (!isLegacyCustomThemeId(summary.id)) continue;
            const loaded = await serverRequest(`/themes/${encodeURIComponent(summary.id)}`).catch(() => null);
            if (loaded?.theme) custom.push({ id: String(summary.id), theme: loaded.theme });
        }
        return { custom, activeId: String(listing?.activeId || 'default') };
    }

    function mergeThemes({ custom, activeId }) {
        let records = [];
        try {
            records = JSON.parse(themeStore.getItem(themeKeys.themes) || '[]');
        } catch {
            records = [];
        }
        if (!Array.isArray(records)) records = [];
        let added = 0;
        for (const { id, theme } of custom) {
            if (records.some(record => record.id === id)) continue;
            records.push({ id, name: theme.name || id, author: theme.author || '', builtIn: false, theme });
            added += 1;
        }
        if (added) themeStore.setItem(themeKeys.themes, JSON.stringify(records));
        if (activeId && (!isLegacyCustomThemeId(activeId) || records.some(record => record.id === activeId))) {
            themeStore.setItem(themeKeys.active, activeId);
        }
        return added;
    }

    async function run(found) {
        const sourceNotes = combineLegacyNotes({ fullNotes: found.fullNotes, liteNotes: found.browserNotes });
        const source = found.full && found.browser ? 'full+lite' : (found.full ? 'full' : 'lite');
        const payload = storage.buildNotesExport(sourceNotes, user(), `migration-${source}`);

        onProgress('snapshot');
        await storage.saveSnapshot(payload);

        onProgress('write');
        const hadNotes = await storage.hasStoredNotes();
        if (hadNotes) await storage.importNotes(payload);
        else await storage.replaceAllNotes(payload);

        onProgress('verify');
        const stored = await storage.readNotesFresh();
        const report = verifyMigratedNotes(sourceNotes, stored, { matchBy: hadNotes ? 'signature' : 'id' });

        let themes = 0;
        if (found.fullThemes) {
            onProgress('themes');
            themes = mergeThemes(await collectThemes().catch(() => ({ custom: [], activeId: '' })));
        }
        return { ...report, source, merged: hadNotes, themes };
    }

    return { detect, run };
}
