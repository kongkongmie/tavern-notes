// Read-only access to the places Tavern Notes 2.x kept notes, used only to migrate them into
// file storage: the old Server Plugin (Full mode) and the old browser database (Lite mode).
// Nothing here writes to the old data.

const LEGACY_DB_NAME = 'tavern-notes-lite';
const LEGACY_NOTE_STORE = 'notes';
const LEGACY_API_BASE = '/api/plugins/tavern-notes';

export async function readLegacyBrowserNotes({ indexedDb = globalThis.indexedDB } = {}) {
    if (!indexedDb) return [];
    if (typeof indexedDb.databases === 'function') {
        const databases = await indexedDb.databases().catch(() => null);
        if (databases && !databases.some(database => database?.name === LEGACY_DB_NAME)) return [];
    }
    const database = await new Promise((resolve, reject) => {
        const request = indexedDb.open(LEGACY_DB_NAME);
        // The database did not exist: cancel instead of creating an empty one.
        request.onupgradeneeded = () => request.transaction.abort();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => reject(new Error('The old Tavern Notes Lite storage is open in another page.'));
    });
    if (!database) return [];
    try {
        if (!database.objectStoreNames.contains(LEGACY_NOTE_STORE)) return [];
        return await new Promise((resolve, reject) => {
            const request = database.transaction(LEGACY_NOTE_STORE, 'readonly').objectStore(LEGACY_NOTE_STORE).getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error || new Error('Reading old Lite notes failed.'));
        });
    } finally {
        database.close();
    }
}

// Requests to the old Server Plugin, if it is still installed and running.
export function createLegacyServerRequest({ getHeaders, fetchImpl = (...args) => globalThis.fetch(...args) }) {
    return async function legacyServerRequest(path) {
        const response = await fetchImpl(`${LEGACY_API_BASE}${path}`, { headers: getHeaders() });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.ok === false) {
            const error = new Error(`Old Tavern Notes backend: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return data;
    };
}
