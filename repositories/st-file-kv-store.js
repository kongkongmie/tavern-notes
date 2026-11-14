// A small key/value store kept in one JSON file in the SillyTavern user folder, with a
// synchronous getItem/setItem surface so it can stand in for localStorage (used for themes,
// which should follow the user across devices just like the notes).
export function createStFileKeyValueStore({ client, file, seed = () => ({}) }) {
    let values = {};
    let loaded = false;
    let loading = null;
    let queue = Promise.resolve();

    function save() {
        const snapshot = JSON.stringify({ format: 'tavern-notes-kv', version: 1, values });
        queue = queue.then(() => client.write(file, JSON.parse(snapshot))).catch(error => {
            console.error('[Tavern Notes] failed to save', file, error);
        });
        return queue;
    }

    async function load() {
        const stored = await client.read(file);
        if (stored?.format === 'tavern-notes-kv' && stored.values && typeof stored.values === 'object') {
            values = { ...stored.values };
        } else {
            values = { ...(seed() || {}) };
            if (Object.keys(values).length) await save();
        }
        loaded = true;
    }

    return {
        ready() {
            if (loaded) return Promise.resolve();
            if (!loading) loading = load().finally(() => { loading = null; });
            return loading;
        },
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
        },
        setItem(key, value) {
            values[key] = String(value);
            save();
        },
        removeItem(key) {
            delete values[key];
            save();
        },
        flush: () => queue,
    };
}
