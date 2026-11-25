// Note business logic (adding, grouping floors, tags, dedupe, import/export, backups).
// Persistence is pluggable: the extension stores notes as files in the SillyTavern user folder
// through repositories/st-file-note-backend.js.
const MAX_CONTENT_LENGTH = 200000;

let backend = null;

export function configureNoteBackend(nextBackend) {
    backend = nextBackend;
}

function currentBackend() {
    if (!backend) throw new Error('Tavern Notes storage is not ready yet.');
    return backend;
}

async function readMeta(key, fallback = null) {
    return currentBackend().readMeta(key, fallback);
}

async function writeMeta(key, value) {
    await currentBackend().commit({ meta: { [key]: value } });
}

async function readAllNotes() {
    return currentBackend().readAll();
}

async function commit(change) {
    await currentBackend().commit(change);
}

function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function makeId(seq) {
    const random = globalThis.crypto?.randomUUID?.().replaceAll('-', '').slice(0, 12)
        || Math.random().toString(36).slice(2, 14);
    return `tnl_${Date.now().toString(36)}_${String(seq).padStart(6, '0')}_${random}`;
}

function normalizeTags(tags) {
    const values = Array.isArray(tags) ? tags : String(tags || '').split(/[,，\n]/);
    const unique = [];
    for (const value of values) {
        const tag = String(value || '').trim().replace(/^#+/, '').slice(0, 40);
        if (!tag || unique.some(item => item.toLocaleLowerCase() === tag.toLocaleLowerCase())) continue;
        unique.push(tag);
        if (unique.length >= 20) break;
    }
    return unique;
}

function cleanNote(input, seq, preserveIdentity = false) {
    const content = String(input?.content || '').trim();
    if (!content) throw new Error('Note content is empty.');
    const now = new Date().toISOString();
    const type = ['user_input', 'excerpt', 'manual'].includes(input?.type) ? input.type : 'manual';
    return {
        id: preserveIdentity && input.id ? String(input.id) : makeId(seq),
        seq: preserveIdentity && Number.isFinite(Number(input.seq)) ? Number(input.seq) : seq,
        type,
        content: content.slice(0, MAX_CONTENT_LENGTH),
        createdAt: preserveIdentity && input.createdAt ? String(input.createdAt) : now,
        updatedAt: preserveIdentity && input.updatedAt ? String(input.updatedAt) : now,
        character: {
            id: input?.character?.id ?? null,
            name: String(input?.character?.name || '未命名角色'),
            avatar: input?.character?.avatar ?? null,
            isUser: input?.character?.isUser === true,
        },
        chat: {
            id: input?.chat?.id ?? null,
            name: String(input?.chat?.name || ''),
            messageId: input?.chat?.messageId !== null
                && input?.chat?.messageId !== undefined
                && input?.chat?.messageId !== ''
                && Number.isFinite(Number(input.chat.messageId))
                ? Number(input.chat.messageId)
                : null,
        },
        source: String(input?.source || ''),
        tags: normalizeTags(input?.tags),
        repeatCount: Math.max(1, safeNumber(input?.repeatCount, 1)),
        lastRepeatedAt: input?.lastRepeatedAt ? String(input.lastRepeatedAt) : null,
        latestMessageId: input?.latestMessageId !== null
            && input?.latestMessageId !== undefined
            && input?.latestMessageId !== ''
            && Number.isFinite(Number(input.latestMessageId))
            ? Number(input.latestMessageId)
            : (input?.chat?.messageId !== null
                && input?.chat?.messageId !== undefined
                && input?.chat?.messageId !== ''
                && Number.isFinite(Number(input.chat.messageId))
                ? Number(input.chat.messageId)
                : null),
    };
}

function normalizeRepeatContent(value) {
    return String(value || '').trim().replace(/\r\n?/g, '\n');
}

function userInputContextKey(note) {
    return [note?.character?.id ?? '', note?.character?.name ?? '', note?.chat?.id ?? '', note?.chat?.name ?? '']
        .map(value => String(value).replaceAll('|', '\\|')).join('|');
}

function excerptDedupeKey(note) {
    if (note?.type !== 'excerpt') return '';
    return [
        note?.character?.id ?? '',
        note?.character?.name ?? '',
        note?.chat?.id ?? '',
        note?.chat?.name ?? '',
        note?.chat?.messageId ?? '',
        String(note?.content || '').trim().replace(/\s+/g, ' '),
    ].map(value => String(value).replaceAll('|', '\\|')).join('|');
}

function userInputFloorKey(note) {
    if (note?.type !== 'user_input' || note?.source === 'manual_inspiration') return '';
    const chatId = note?.chat?.id;
    const messageId = note?.chat?.messageId;
    if (chatId === null || chatId === undefined || chatId === '' || messageId === null || messageId === undefined) return '';
    return [note.character?.avatar || note.character?.name || '', chatId, messageId]
        .map(value => String(value).replaceAll('|', '\\|')).join('|');
}

function mergeNoteTags(notes) {
    return normalizeTags(notes.flatMap(note => normalizeTags(note?.tags)));
}

// Same floor and the same text: only one copy is kept. Different text on the same floor are versions
// (swiped left / right in the list) and are all kept.
function sameFloorSameText(left, right) {
    const floorKey = userInputFloorKey(left);
    return Boolean(floorKey)
        && floorKey === userInputFloorKey(right)
        && normalizeRepeatContent(left.content) === normalizeRepeatContent(right.content);
}

function findFloorDedupeGroups(notes) {
    const floors = new Map();
    for (const note of [...notes].sort((left, right) => safeNumber(left.seq) - safeNumber(right.seq))) {
        const floorKey = userInputFloorKey(note);
        if (!floorKey) continue;
        const key = `${floorKey}\u0001${normalizeRepeatContent(note.content)}`;
        if (!floors.has(key)) floors.set(key, []);
        floors.get(key).push(note);
    }
    return Array.from(floors.values())
        .filter(items => items.length > 1)
        .map(items => {
            const latest = items[items.length - 1];
            return { kind: 'floor', canonical: { ...latest, tags: mergeNoteTags(items) }, duplicates: items.slice(0, -1) };
        });
}

function findUserInputDedupeGroups(notes) {
    const floorGroups = findFloorDedupeGroups(notes);
    const retired = new Set(floorGroups.flatMap(group => group.duplicates.map(note => note.id)));
    const merged = new Map(floorGroups.map(group => [group.canonical.id, group.canonical]));
    const remaining = notes.filter(note => !retired.has(note.id)).map(note => merged.get(note.id) || note);
    return [...floorGroups, ...findRepeatDedupeGroups(remaining)];
}

function findRepeatDedupeGroups(notes) {
    const groups = new Map();
    const previousByContext = new Map();
    for (const note of [...notes].sort((left, right) => safeNumber(left.seq) - safeNumber(right.seq))) {
        if (note.type !== 'user_input' || note.source === 'manual_inspiration') continue;
        const contextKey = userInputContextKey(note);
        const contentKey = normalizeRepeatContent(note.content);
        const previous = previousByContext.get(contextKey);
        if (previous && previous.contentKey === contentKey) {
            if (!groups.has(previous.canonical.id)) groups.set(previous.canonical.id, { kind: 'repeat', canonical: previous.canonical, duplicates: [] });
            groups.get(previous.canonical.id).duplicates.push(note);
            continue;
        }
        previousByContext.set(contextKey, { canonical: note, contentKey });
    }
    return Array.from(groups.values());
}

function variantGroupKey(note) {
    if (note.type !== 'user_input' || note.chat?.messageId === null || note.chat?.messageId === undefined) return '';
    return [
        note.type,
        note.character?.id ?? '',
        note.character?.avatar ?? '',
        note.character?.name ?? '',
        note.chat?.id ?? '',
        note.chat?.name ?? '',
        note.chat.messageId,
    ].map(value => String(value).replaceAll('|', '\\|')).join('|');
}

function groupId(groupKey) {
    let hash = 2166136261;
    for (let index = 0; index < groupKey.length; index += 1) {
        hash ^= groupKey.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return `tnlg_${(hash >>> 0).toString(36)}`;
}

function groupNotesForDisplay(notes) {
    const groups = new Map();
    const display = [];
    for (const note of notes) {
        const key = variantGroupKey(note);
        if (!key) {
            display.push(note);
            continue;
        }
        let group = groups.get(key);
        if (!group) {
            group = {
                ...note,
                id: groupId(key),
                groupId: groupId(key),
                variantGroupKey: key,
                activeVariantId: note.id,
                variants: [],
                variantCount: 0,
            };
            groups.set(key, group);
            display.push(group);
        }
        if (!group.variants.some(variant => variant.content === note.content)) group.variants.push(note);
    }
    for (const group of groups.values()) {
        group.variants.sort((left, right) => safeNumber(left.seq) - safeNumber(right.seq));
        group.variantCount = group.variants.length;
        const latest = group.variants[group.variants.length - 1] || group;
        Object.assign(group, {
            activeVariantId: latest.id,
            content: latest.content,
            createdAt: latest.createdAt,
            seq: latest.seq,
            chat: latest.chat,
            source: latest.source,
            tags: latest.tags,
        });
    }
    return display.sort((left, right) => safeNumber(right.seq) - safeNumber(left.seq));
}

function matchesCharacter(note, id, name) {
    if (String(id || '') === 'tavern-notes-user') {
        return note.type === 'user_input' || note.character?.isUser === true || note.character?.id === 'tavern-notes-user';
    }
    const avatarPrefix = 'tavern-notes-avatar:';
    if (String(id || '').startsWith(avatarPrefix)) {
        return String(note.character?.avatar || '') === String(id).slice(avatarPrefix.length);
    }
    const namePrefix = 'tavern-notes-name:';
    if (String(id || '').startsWith(namePrefix)) {
        return (note.character?.name || '未命名角色') === String(id).slice(namePrefix.length);
    }
    if (id !== null && id !== undefined && id !== '') return String(note.character?.id ?? '') === String(id);
    if (name) return String(note.character?.name || '') === String(name);
    return true;
}

function searchMatches(note, query) {
    if (!query) return true;
    const haystack = [note.content, note.character?.name, note.chat?.name, ...(note.tags || [])]
        .join('\n')
        .toLocaleLowerCase();
    return haystack.includes(query.toLocaleLowerCase());
}

function baseFilteredNotes(notes, params) {
    const includeUserInput = params.get('includeUserInput') !== 'false';
    const query = String(params.get('q') || '').trim();
    const selectedTag = String(params.get('tag') || '').trim().toLocaleLowerCase();
    return notes.filter(note => (
        (includeUserInput || note.type !== 'user_input' || note.source === 'manual_inspiration')
        && (!selectedTag || (note.tags || []).some(tag => tag.toLocaleLowerCase() === selectedTag))
        && searchMatches(note, query)
    ));
}

function countGroups(notes) {
    return {
        all: groupNotesForDisplay(notes).length,
        user_input: groupNotesForDisplay(notes.filter(note => note.type === 'user_input')).length,
        excerpt: notes.filter(note => note.type === 'excerpt').length,
        manual: notes.filter(note => note.type === 'manual').length,
    };
}

function characterSummaries(notes, userName = 'User') {
    const map = new Map();
    const userCharacter = { id: 'tavern-notes-user', name: userName || 'User', avatar: null, isUser: true };
    const targets = [];
    for (const note of groupNotesForDisplay(notes)) {
        const storedCharacter = note.character || {};
        const personaNote = storedCharacter.isUser === true || storedCharacter.id === 'tavern-notes-user';
        // User inputs belong to the user card and also to the card they were sent to.
        if (note.type === 'user_input' || personaNote) targets.push([note, userCharacter]);
        if (!personaNote) targets.push([note, storedCharacter]);
    }
    for (const [note, character] of targets) {
        const avatar = String(character.avatar || '');
        const key = character.isUser === true
            ? 'user'
            : avatar
                ? `avatar|${avatar}`
                : character.id !== null && character.id !== undefined && character.id !== ''
                    ? `id|${character.id}`
                    : `name|${String(character.name || '').toLocaleLowerCase()}`;
        if (!map.has(key)) {
            map.set(key, {
                id: avatar
                    ? `tavern-notes-avatar:${avatar}`
                    : character.id !== null && character.id !== undefined && character.id !== ''
                        ? character.id
                        : `tavern-notes-name:${character.name || '未命名角色'}`,
                name: character.name || '未命名角色',
                avatar: character.avatar ?? null,
                isUser: character.isUser === true,
                total: 0,
                userInput: 0,
                excerpt: 0,
                manual: 0,
                latestAt: note.createdAt || '',
            });
        }
        const item = map.get(key);
        item.total += 1;
        if (note.type === 'user_input') item.userInput += 1;
        else if (note.type === 'excerpt') item.excerpt += 1;
        else item.manual += 1;
        if (String(note.createdAt || '') > item.latestAt) item.latestAt = note.createdAt;
    }
    return Array.from(map.values()).sort((left, right) => Number(right.isUser) - Number(left.isUser) || String(right.latestAt).localeCompare(String(left.latestAt)));
}

async function addNote(payload) {
    if (payload?.type === 'excerpt') {
        const excerptKey = excerptDedupeKey(payload);
        const duplicate = (await readAllNotes()).find(note => excerptDedupeKey(note) === excerptKey);
        if (duplicate) return { note: duplicate, deduplicated: true };
    }
    if (payload?.type === 'user_input' && payload?.collapseRepeated !== false) {
        const notes = await readAllNotes();
        const contextKey = userInputContextKey(payload);
        const previous = notes
            .filter(note => note.type === 'user_input' && userInputContextKey(note) === contextKey)
            .sort((left, right) => safeNumber(right.seq) - safeNumber(left.seq))[0];
        if (previous && normalizeRepeatContent(previous.content) === normalizeRepeatContent(payload.content)) {
            const repeatedAt = new Date().toISOString();
            const updated = {
                ...previous,
                updatedAt: repeatedAt,
                repeatCount: Math.max(1, safeNumber(previous.repeatCount, 1)) + 1,
                lastRepeatedAt: repeatedAt,
                latestMessageId: Number.isFinite(Number(payload?.chat?.messageId))
                    ? Number(payload.chat.messageId)
                    : (previous.latestMessageId ?? previous.chat?.messageId ?? null),
            };
            await commit({ put: [updated], meta: { updatedAt: repeatedAt } });
            return { note: updated, deduplicated: true };
        }
    }
    const nextSeq = safeNumber(await readMeta('nextSeq', 1), 1);
    const note = cleanNote(payload, nextSeq);
    // Re-sending the same text on the same floor keeps one copy (the newest). Edited text is a new
    // version of that floor and sits next to the older ones.
    const floorKey = userInputFloorKey(note);
    const floorNotes = floorKey ? (await readAllNotes()).filter(item => userInputFloorKey(item) === floorKey) : [];
    const replaced = floorNotes.filter(item => sameFloorSameText(item, note));
    // Tags describe the floor, so a new version keeps the tags given to the earlier ones.
    if (floorNotes.length) note.tags = mergeNoteTags([note, ...floorNotes]);
    await commit({
        put: [note],
        remove: replaced.map(item => item.id),
        meta: { nextSeq: nextSeq + 1, updatedAt: note.updatedAt },
    });
    return { note, deduplicated: false, replaced: replaced.length };
}

async function dedupeUserInputs(apply = false, selectedIds = null) {
    const notes = await readAllNotes();
    const selected = Array.isArray(selectedIds) ? new Set(selectedIds.map(String)) : null;
    const groups = findUserInputDedupeGroups(notes).filter(group => !selected || selected.has(String(group.canonical.id)));
    const duplicateNotes = groups.reduce((total, group) => total + group.duplicates.length, 0);
    const items = groups.map(group => ({
        id: group.canonical.id,
        content: group.canonical.content,
        characterName: group.canonical.character?.name || '',
        chatName: group.canonical.chat?.name || '',
        occurrences: group.duplicates.length + 1,
        duplicateNotes: group.duplicates.length,
    }));
    if (!apply || !duplicateNotes) return { groups: groups.length, duplicateNotes, remainingNotes: notes.length - duplicateNotes, items };
    const updatedAt = new Date().toISOString();
    const put = [];
    const remove = [];
    for (const group of groups) {
        const all = [group.canonical, ...group.duplicates];
        if (group.kind === 'floor') {
            put.push(group.canonical);
            group.duplicates.forEach(note => remove.push(note.id));
            continue;
        }
        const last = all[all.length - 1];
        put.push({
            ...group.canonical,
            tags: mergeNoteTags(all),
            updatedAt,
            repeatCount: all.reduce((total, note) => total + Math.max(1, safeNumber(note.repeatCount, 1)), 0),
            lastRepeatedAt: last.lastRepeatedAt || last.updatedAt || last.createdAt || updatedAt,
            latestMessageId: last.latestMessageId ?? last.chat?.messageId ?? null,
        });
        group.duplicates.forEach(note => remove.push(note.id));
    }
    await commit({ put, remove, meta: { updatedAt } });
    return { groups: groups.length, duplicateNotes, remainingNotes: notes.length - duplicateNotes, items };
}

async function deleteNote(id) {
    await commit({ remove: [String(id)], meta: { updatedAt: new Date().toISOString() } });
}

async function updateNote(id, payload) {
    const existing = (await readAllNotes()).find(note => String(note.id) === String(id));
    if (!existing) throw new Error('Note not found.');
    const content = String(payload?.content || '').trim();
    if (!content) throw new Error('Note content is empty.');
    const updated = {
        ...existing,
        content: content.slice(0, MAX_CONTENT_LENGTH),
        tags: normalizeTags(payload?.tags),
        updatedAt: new Date().toISOString(),
    };
    await commit({ put: [updated], meta: { updatedAt: updated.updatedAt } });
    return updated;
}

async function removeTagFromAllNotes(tag) {
    const key = String(tag || '').trim().toLocaleLowerCase();
    if (!key) throw new Error('Missing tag.');
    const notes = await readAllNotes();
    const changed = notes.filter(note => normalizeTags(note.tags).some(item => item.toLocaleLowerCase() === key));
    if (!changed.length) return 0;
    const updatedAt = new Date().toISOString();
    await commit({
        put: changed.map(note => ({
            ...note,
            tags: normalizeTags(note.tags).filter(item => item.toLocaleLowerCase() !== key),
            updatedAt,
        })),
        meta: { updatedAt },
    });
    return changed.length;
}

async function renameTagEverywhere(oldTag, newName) {
    const oldKey = String(oldTag || '').trim().toLocaleLowerCase();
    const newTag = normalizeTags([newName])[0] || '';
    if (!oldKey || !newTag) throw new Error('Missing tag name.');
    const notes = await readAllNotes();
    const changed = notes.filter(note => normalizeTags(note.tags).some(item => item.toLocaleLowerCase() === oldKey));
    if (!changed.length) return { newTag, updated: 0 };
    const updatedAt = new Date().toISOString();
    await commit({
        put: changed.map(note => ({ ...note, tags: normalizeTags(note.tags.map(item => item.toLocaleLowerCase() === oldKey ? newTag : item)), updatedAt })),
        meta: { updatedAt },
    });
    return { newTag, updated: changed.length };
}

// Count tags per displayed entry (input versions of one floor count once) so the shelf matches the list total.
function summarizeTags(notes) {
    const entries = new Map();
    for (const note of notes) {
        const entryKey = variantGroupKey(note) || `id|${note.id}`;
        if (!entries.has(entryKey)) entries.set(entryKey, new Map());
        const tags = entries.get(entryKey);
        for (const tag of normalizeTags(note.tags)) {
            const key = tag.toLocaleLowerCase();
            if (!tags.has(key)) tags.set(key, tag);
        }
    }
    const counts = new Map();
    for (const tags of entries.values()) {
        for (const [key, tag] of tags) {
            const current = counts.get(key) || { name: tag, count: 0 };
            current.count += 1;
            counts.set(key, current);
        }
    }
    return Array.from(counts.values()).sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

export async function getAllNotes() {
    const notes = await readAllNotes();
    return notes.sort((left, right) => safeNumber(left.seq) - safeNumber(right.seq));
}

export async function getNotesExport(user = 'default-user') {
    const notes = await getAllNotes();
    return {
        ok: true,
        format: 'tavern-notes-export',
        version: 1,
        source: 'tavern-notes',
        exportedAt: new Date().toISOString(),
        user,
        notes,
    };
}

export async function markNotesExported() {
    await writeMeta('lastExportAt', new Date().toISOString());
}

export async function importNotes(payload) {
    if (!payload || payload.format !== 'tavern-notes-export' || !Array.isArray(payload.notes)) {
        throw new Error('This is not a Tavern Notes JSON backup.');
    }
    const existing = await getAllNotes();
    const signatures = new Set(existing.map(note => [
        note.type,
        note.content,
        note.character?.id ?? '',
        note.character?.name ?? '',
        note.chat?.id ?? '',
        note.chat?.messageId ?? '',
        note.createdAt ?? '',
    ].join('\u0001')));
    let nextSeq = Math.max(0, ...existing.map(note => safeNumber(note.seq))) + 1;
    const accepted = [];
    for (const raw of payload.notes) {
        const signature = [
            raw?.type,
            raw?.content,
            raw?.character?.id ?? '',
            raw?.character?.name ?? '',
            raw?.chat?.id ?? '',
            raw?.chat?.messageId ?? '',
            raw?.createdAt ?? '',
        ].join('\u0001');
        if (signatures.has(signature) || !String(raw?.content || '').trim()) continue;
        signatures.add(signature);
        const note = cleanNote(raw, nextSeq, true);
        if (existing.some(item => item.id === note.id) || accepted.some(item => item.id === note.id)) note.id = makeId(nextSeq);
        note.seq = nextSeq;
        accepted.push(note);
        nextSeq += 1;
    }
    if (!accepted.length) return { imported: 0, skipped: payload.notes.length };
    await commit({ put: accepted, meta: { nextSeq, updatedAt: new Date().toISOString() } });
    return { imported: accepted.length, skipped: payload.notes.length - accepted.length };
}

export async function listNoteBackups() {
    const store = currentBackend();
    return typeof store.listBackups === 'function' ? store.listBackups() : [];
}

function notesFromExport(payload) {
    if (!payload || payload.format !== 'tavern-notes-export' || !Array.isArray(payload.notes)) {
        throw new Error('This is not a Tavern Notes JSON backup.');
    }
    const notes = [];
    const seen = new Set();
    for (const raw of payload.notes) {
        if (!String(raw?.content || '').trim()) continue;
        const note = cleanNote(raw, safeNumber(raw?.seq, notes.length + 1), true);
        if (seen.has(note.id)) note.id = makeId(note.seq);
        seen.add(note.id);
        notes.push(note);
    }
    return notes;
}

// Replace all notes with an exact copy (ids, order and timestamps kept). Used by restore and migration.
export async function replaceAllNotes(payload, { backup = false } = {}) {
    const store = currentBackend();
    if (typeof store.replaceAll !== 'function') throw new Error('Current storage cannot replace notes.');
    const notes = notesFromExport(payload);
    const nextSeq = Math.max(0, ...notes.map(note => safeNumber(note.seq))) + 1;
    await store.replaceAll(notes, { nextSeq, updatedAt: new Date().toISOString() }, { backup });
    return notes;
}

export async function restoreNoteBackup(name) {
    const store = currentBackend();
    const payload = await store.readBackup(name);
    if (!payload) throw new Error('找不到这份备份。');
    await store.saveBackup('before-restore');
    const notes = await replaceAllNotes(payload);
    return { restored: notes.length, name };
}

export async function readNotesFresh() {
    const store = currentBackend();
    return typeof store.readFresh === 'function' ? store.readFresh() : readAllNotes();
}

export async function hasStoredNotes() {
    const store = currentBackend();
    return typeof store.hasData === 'function' ? store.hasData() : (await readAllNotes()).length > 0;
}

export async function saveMigrationSnapshot(payload) {
    const store = currentBackend();
    if (typeof store.writeSnapshot !== 'function') return null;
    const stamp = new Date();
    const pad = value => String(value).padStart(2, '0');
    const name = `tavern-notes__migration-source-${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}.json`;
    await store.writeSnapshot(name, payload);
    return name;
}

export async function saveNamedBackup(suffix) {
    const store = currentBackend();
    return typeof store.saveBackup === 'function' ? store.saveBackup(suffix) : null;
}

export function buildNotesExport(notes, user = 'default-user', source = 'tavern-notes') {
    return {
        ok: true,
        format: 'tavern-notes-export',
        version: 1,
        source,
        exportedAt: new Date().toISOString(),
        user,
        notes: [...notes].sort((left, right) => safeNumber(left.seq) - safeNumber(right.seq)),
    };
}

export async function getStorageInfo() {
    const notes = await getAllNotes();
    const approximateBytes = new Blob([JSON.stringify(notes)]).size;
    const lastExportAt = await readMeta('lastExportAt', '');
    return { count: notes.length, approximateBytes, lastExportAt };
}

export async function notesApi(path, options = {}, user = 'default-user', runtimeVersion = '') {
    const url = new URL(path, 'https://tavern-notes.local');
    const method = String(options.method || 'GET').toUpperCase();
    if (url.pathname === '/status') {
        const notes = await readAllNotes();
        return { ok: true, user, version: runtimeVersion, totalNotes: notes.length, storage: 'files' };
    }
    if (url.pathname === '/notes' && method === 'POST') {
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
        const result = await addNote(payload);
        return { ok: true, ...result };
    }
    if (url.pathname === '/import' && method === 'POST') {
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
        return { ok: true, ...await importNotes(payload) };
    }
    if (url.pathname === '/notes' && method === 'GET') {
        const allNotes = await readAllNotes();
        const base = baseFilteredNotes(allNotes, url.searchParams);
        const counts = countGroups(base);
        let filtered = base;
        const type = url.searchParams.get('type');
        if (type) filtered = filtered.filter(note => note.type === type);
        filtered = filtered.filter(note => matchesCharacter(
            note,
            url.searchParams.get('characterId'),
            url.searchParams.get('characterName'),
        ));
        const display = groupNotesForDisplay(filtered);
        const offset = Math.max(0, safeNumber(url.searchParams.get('offset')));
        const limit = Math.max(1, safeNumber(url.searchParams.get('limit'), 15));
        return {
            ok: true,
            notes: display.slice(offset, offset + limit),
            totalNotes: display.length,
            allNotes: allNotes.length,
            counts,
        };
    }
    if (url.pathname === '/characters' && method === 'GET') {
        const allNotes = await readAllNotes();
        return { ok: true, characters: characterSummaries(baseFilteredNotes(allNotes, url.searchParams), user) };
    }
    if (url.pathname === '/tags' && method === 'GET') {
        const allNotes = await readAllNotes();
        const params = new URLSearchParams(url.searchParams);
        params.delete('q');
        params.delete('tag');
        return { ok: true, tags: summarizeTags(baseFilteredNotes(allNotes, params)) };
    }
    if (url.pathname.startsWith('/tags/') && method === 'DELETE') {
        const tag = decodeURIComponent(url.pathname.slice('/tags/'.length));
        return { ok: true, tag, updated: await removeTagFromAllNotes(tag) };
    }
    if (url.pathname.startsWith('/tags/') && method === 'PATCH') {
        const tag = decodeURIComponent(url.pathname.slice('/tags/'.length));
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
        return { ok: true, tag, ...await renameTagEverywhere(tag, payload.name) };
    }
    if (url.pathname.startsWith('/notes/') && method === 'PATCH') {
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
        const note = await updateNote(decodeURIComponent(url.pathname.slice('/notes/'.length)), payload);
        return { ok: true, note };
    }
    if (url.pathname === '/notes/delete-many' && method === 'POST') {
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
        const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
        if (ids.length) await commit({ remove: ids, meta: { updatedAt: new Date().toISOString() } });
        return { ok: true, deleted: ids.length };
    }
    if (url.pathname.startsWith('/notes/') && method === 'DELETE') {
        await deleteNote(decodeURIComponent(url.pathname.slice('/notes/'.length)));
        return { ok: true };
    }
    if (url.pathname === '/user-input-dedupe' && method === 'GET') {
        return { ok: true, ...await dedupeUserInputs(false) };
    }
    if (url.pathname === '/user-input-dedupe' && method === 'POST') {
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
        return { ok: true, ...await dedupeUserInputs(true, payload.ids) };
    }
    if (url.pathname === '/backups' && method === 'GET') {
        return { ok: true, backups: await listNoteBackups() };
    }
    if (url.pathname === '/backups/restore' && method === 'POST') {
        const payload = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
        return { ok: true, ...await restoreNoteBackup(payload.name) };
    }
    throw new Error(`Unsupported Tavern Notes operation: ${method} ${url.pathname}`);
}
