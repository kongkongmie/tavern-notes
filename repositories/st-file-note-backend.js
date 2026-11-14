// Stores notes as JSON files in the SillyTavern user folder through SillyTavern's own file API
// (POST /api/files/upload, POST /api/files/delete, GET /user/files/<name>). No Server Plugin needed.
// The API cannot create folders or list the folder, so every file shares the `tavern-notes__` prefix
// and a manifest records the note shards and automatic backups.

export const FILE_PREFIX = 'tavern-notes__';
export const MANIFEST_FILE = `${FILE_PREFIX}manifest.json`;
export const MAX_DAILY_BACKUPS = 7;

const MANIFEST_FORMAT = 'tavern-notes-files';
const SHARD_FORMAT = 'tavern-notes-shard';
const SYNC_REUSE_MS = 1500;

function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }
    return btoa(binary);
}

export function shardKeyForNote(note) {
    const stamp = String(note?.createdAt || '');
    return /^\d{4}-\d{2}/.test(stamp) ? stamp.slice(0, 7) : 'undated';
}

export function shardFileName(key) {
    return `${FILE_PREFIX}notes-${key}.json`;
}

export function backupFileName(date = new Date(), suffix = '') {
    const pad = value => String(value).padStart(2, '0');
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return `${FILE_PREFIX}backup-${day}${suffix ? `-${suffix}` : ''}.json`;
}

function localDay(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function newRevision() {
    const random = globalThis.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10);
    return `${Date.now().toString(36)}-${random}`;
}

function emptyManifest() {
    return { format: MANIFEST_FORMAT, version: 1, revision: '', updatedAt: '', meta: {}, shards: {}, backups: [], lastBackupDay: '' };
}

function normalizeManifest(value) {
    if (!value || value.format !== MANIFEST_FORMAT) return null;
    return {
        ...emptyManifest(),
        ...value,
        meta: value.meta && typeof value.meta === 'object' ? value.meta : {},
        shards: value.shards && typeof value.shards === 'object' ? value.shards : {},
        backups: Array.isArray(value.backups) ? value.backups : [],
    };
}

export function createStFileClient({ getHeaders, fetchImpl = (...args) => fetch(...args) }) {
    async function read(name) {
        const response = await fetchImpl(`/user/files/${encodeURIComponent(name)}`, { cache: 'no-store' });
        if (response.status === 404) return null;
        if (!response.ok) throw new Error(`读取笔记文件失败（${response.status}）：${name}`);
        const text = await response.text();
        if (!text.trim()) return null;
        try {
            return JSON.parse(text);
        } catch {
            // SillyTavern answers unknown paths with an HTML page on some setups.
            return null;
        }
    }

    async function write(name, value) {
        const response = await fetchImpl('/api/files/upload', {
            method: 'POST',
            headers: { ...getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, data: utf8ToBase64(JSON.stringify(value)) }),
        });
        if (!response.ok) throw new Error(`保存笔记文件失败（${response.status}）：${name}`);
    }

    async function remove(name) {
        const response = await fetchImpl('/api/files/delete', {
            method: 'POST',
            headers: { ...getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: `/user/files/${name}` }),
        });
        if (!response.ok && response.status !== 404) throw new Error(`删除笔记文件失败（${response.status}）：${name}`);
    }

    return { read, write, remove };
}

export function createStFileNoteBackend({ client, now = () => new Date(), buildBackup, maxBackups = MAX_DAILY_BACKUPS }) {
    let manifest = null;
    const shards = new Map();
    let syncedAt = 0;
    let syncing = null;
    let queue = Promise.resolve();

    function serial(task) {
        const run = queue.then(task, task);
        queue = run.then(() => undefined, () => undefined);
        return run;
    }

    async function syncNow() {
        const fresh = normalizeManifest(await client.read(MANIFEST_FILE)) || emptyManifest();
        for (const [key, info] of Object.entries(fresh.shards)) {
            const cached = shards.get(key);
            if (cached && cached.revision === info.revision) continue;
            const file = await client.read(shardFileName(key));
            const notes = Array.isArray(file?.notes) ? file.notes : [];
            shards.set(key, { revision: info.revision, notes: new Map(notes.map(note => [String(note.id), note])) });
        }
        for (const key of [...shards.keys()]) if (!fresh.shards[key]) shards.delete(key);
        manifest = fresh;
        syncedAt = Date.now();
    }

    function sync({ force = false } = {}) {
        if (!force && manifest && Date.now() - syncedAt < SYNC_REUSE_MS) return Promise.resolve();
        if (!syncing) syncing = syncNow().finally(() => { syncing = null; });
        return syncing;
    }

    function allNotes() {
        return [...shards.values()].flatMap(shard => [...shard.notes.values()]);
    }

    function findShardKey(id) {
        for (const [key, shard] of shards) if (shard.notes.has(String(id))) return key;
        return null;
    }

    function ensureShard(key) {
        if (!shards.has(key)) shards.set(key, { revision: '', notes: new Map() });
        return shards.get(key);
    }

    async function writeBackupIfDue(next) {
        const today = localDay(now());
        if (next.lastBackupDay === today || typeof buildBackup !== 'function') return;
        const name = backupFileName(now());
        const notes = allNotes();
        await client.write(name, buildBackup(notes));
        next.backups = [{ name, day: today, count: notes.length, createdAt: now().toISOString() },
            ...next.backups.filter(item => item.name !== name)];
        const expired = next.backups.slice(maxBackups);
        next.backups = next.backups.slice(0, maxBackups);
        for (const item of expired) await client.remove(item.name).catch(() => {});
        next.lastBackupDay = today;
    }

    async function persist(changedKeys, metaPatch, { backup = true } = {}) {
        const revisions = {};
        for (const key of changedKeys) {
            const shard = ensureShard(key);
            if (!shard.notes.size) {
                await client.remove(shardFileName(key)).catch(() => {});
                shards.delete(key);
                revisions[key] = null;
                continue;
            }
            const notes = [...shard.notes.values()].sort((left, right) => Number(left.seq || 0) - Number(right.seq || 0));
            await client.write(shardFileName(key), { format: SHARD_FORMAT, version: 1, shard: key, notes });
            shard.revision = newRevision();
            revisions[key] = { revision: shard.revision, count: notes.length };
        }
        // Re-read the manifest right before writing so a change saved from another device is kept.
        const latest = normalizeManifest(await client.read(MANIFEST_FILE)) || manifest || emptyManifest();
        const next = { ...latest, shards: { ...latest.shards }, meta: { ...latest.meta, ...metaPatch } };
        if (Number.isFinite(Number(latest.meta?.nextSeq)) && Number.isFinite(Number(metaPatch?.nextSeq))) {
            next.meta.nextSeq = Math.max(Number(latest.meta.nextSeq), Number(metaPatch.nextSeq));
        }
        for (const [key, value] of Object.entries(revisions)) {
            if (value) next.shards[key] = value;
            else delete next.shards[key];
        }
        if (backup && changedKeys.length) await writeBackupIfDue(next);
        next.revision = newRevision();
        next.updatedAt = now().toISOString();
        await client.write(MANIFEST_FILE, next);
        manifest = next;
        syncedAt = Date.now();
    }

    async function commitNow({ put = [], remove = [], meta = {} } = {}, options = {}) {
        await sync({ force: true });
        const changed = new Set();
        for (const id of remove) {
            const key = findShardKey(id);
            if (!key) continue;
            shards.get(key).notes.delete(String(id));
            changed.add(key);
        }
        for (const note of put) {
            const id = String(note.id);
            const previousKey = findShardKey(id);
            const key = shardKeyForNote(note);
            if (previousKey && previousKey !== key) {
                shards.get(previousKey).notes.delete(id);
                changed.add(previousKey);
            }
            ensureShard(key).notes.set(id, { ...note });
            changed.add(key);
        }
        await persist([...changed], meta, options);
    }

    return {
        kind: 'st-files',
        async readAll() {
            await sync();
            return allNotes().map(note => ({ ...note }));
        },
        async readMeta(key, fallback = null) {
            await sync();
            return manifest?.meta?.[key] ?? fallback;
        },
        commit: change => serial(() => commitNow(change)),
        // Replace every note (used by migration and backup restore). Old shard files are removed.
        replaceAll: (notes, meta = {}, options = {}) => serial(async () => {
            await sync({ force: true });
            const changed = new Set(shards.keys());
            for (const shard of shards.values()) shard.notes.clear();
            for (const note of notes) {
                const key = shardKeyForNote(note);
                ensureShard(key).notes.set(String(note.id), { ...note });
                changed.add(key);
            }
            await persist([...changed], meta, options);
        }),
        async hasData() {
            await sync({ force: true });
            return Boolean(manifest?.revision);
        },
        async readFresh() {
            shards.clear();
            manifest = null;
            await sync({ force: true });
            return allNotes().map(note => ({ ...note }));
        },
        async listBackups() {
            await sync({ force: true });
            return [...(manifest?.backups || [])];
        },
        async readBackup(name) {
            if (!String(name || '').startsWith(`${FILE_PREFIX}backup-`)) throw new Error('不是酒馆笔记的自动备份文件。');
            return client.read(name);
        },
        async writeSnapshot(name, value) {
            if (!String(name || '').startsWith(FILE_PREFIX)) throw new Error('Snapshot files must use the Tavern Notes prefix.');
            await client.write(name, value);
        },
        // Save a named copy of the current notes and list it with the automatic backups.
        saveBackup: (suffix = 'manual') => serial(async () => {
            await sync({ force: true });
            if (typeof buildBackup !== 'function') return null;
            const stamp = now();
            const pad = value => String(value).padStart(2, '0');
            const name = backupFileName(stamp, `${suffix}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}`);
            const notes = allNotes();
            await client.write(name, buildBackup(notes));
            const latest = normalizeManifest(await client.read(MANIFEST_FILE)) || manifest || emptyManifest();
            const next = { ...latest, backups: [{ name, day: localDay(stamp), count: notes.length, createdAt: stamp.toISOString(), label: suffix }, ...latest.backups] };
            const expired = next.backups.slice(maxBackups + 3);
            next.backups = next.backups.slice(0, maxBackups + 3);
            for (const item of expired) await client.remove(item.name).catch(() => {});
            next.revision = newRevision();
            next.updatedAt = stamp.toISOString();
            await client.write(MANIFEST_FILE, next);
            manifest = next;
            return name;
        }),
        describe() {
            return { kind: 'st-files', manifest: manifest ? { ...manifest } : null };
        },
    };
}
