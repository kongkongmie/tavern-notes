import { normalizeNote, normalizeNoteInput, normalizeNotePatch } from '../core/note-model.js';
import {
    createNoteListResult,
    normalizeDeleteManyResult,
    normalizeDeleteResult,
    queryNoteCollection,
    resolveNoteRepositoryQuery,
    toNoteRepositoryError,
} from '../core/note-repository-contract.js';

function legacyParams(query, options = {}, scope = 'notes') {
    const params = new URLSearchParams();
    if (scope === 'notes') {
        params.set('limit', String(query.pageSize));
        params.set('offset', String((query.page - 1) * query.pageSize));
        if (query.type !== 'all') params.set('type', query.type);
        if (options.currentCharacterId !== null && options.currentCharacterId !== undefined) {
            params.set('currentCharacterId', String(options.currentCharacterId));
        }
    }
    if (scope !== 'tags' && query.search) params.set('q', query.search);
    if (scope !== 'tags' && query.tags[0]) params.set('tag', query.tags[0]);
    if (scope !== 'characters' && query.characterId !== null) params.set('characterId', query.characterId);
    else if (scope !== 'characters' && options.characterName) params.set('characterName', String(options.characterName));
    if (options.includeUserInput === false) params.set('includeUserInput', 'false');
    return params;
}

function withQuery(path, params) {
    const query = params.toString();
    return query ? `${path}?${query}` : path;
}

export function createFullNoteRepository({
    request,
    requestFile = null,
    getAllNotes = null,
    importChunkSize = 100,
} = {}) {
    if (typeof request !== 'function') throw new TypeError('Full Note Repository requires request().');

    async function loadAllNotes(options = {}) {
        if (typeof getAllNotes === 'function') return getAllNotes(options);
        const exported = await request('/export.json', options.requestOptions);
        return Array.isArray(exported?.notes) ? exported.notes : [];
    }

    async function listNotes(query, options = {}) {
        const normalized = resolveNoteRepositoryQuery(query);
        try {
            if (options.legacy === true) {
                const [notes, characters, tags] = await Promise.all([
                    request(withQuery('/notes', legacyParams(normalized, options, 'notes')), options.requestOptions),
                    request(withQuery('/characters', legacyParams(normalized, options, 'characters')), options.requestOptions),
                    request(withQuery('/tags', legacyParams(normalized, options, 'tags')), options.requestOptions),
                ]);
                return createNoteListResult({
                    items: notes?.notes,
                    total: notes?.totalNotes,
                    counts: notes?.counts,
                    characters: characters?.characters,
                    tags: tags?.tags,
                }, normalized);
            }
            return queryNoteCollection(await loadAllNotes(options), normalized, options);
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'listNotes', fallbackCode: 'REQUEST_FAILED' });
        }
    }

    async function getNote(id, options = {}) {
        const normalizedId = String(id || '');
        try {
            const note = (await loadAllNotes(options)).find(item => String(item?.id || '') === normalizedId);
            if (!note) {
                const error = new Error('Note not found.');
                error.status = 404;
                throw error;
            }
            return normalizeNote(note);
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'getNote', fallbackCode: 'REQUEST_FAILED' });
        }
    }

    async function createNote(input, options = {}) {
        try {
            const payload = normalizeNoteInput(input);
            const result = await request('/notes', {
                ...options.requestOptions,
                method: 'POST',
                body: JSON.stringify(payload),
            });
            return normalizeNote(result?.note);
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'createNote', fallbackCode: 'WRITE_FAILED' });
        }
    }

    async function updateNote(id, patch, options = {}) {
        try {
            const payload = normalizeNotePatch(patch);
            const result = await request(`/notes/${encodeURIComponent(String(id))}`, {
                ...options.requestOptions,
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            return normalizeNote(result?.note);
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'updateNote', fallbackCode: 'WRITE_FAILED' });
        }
    }

    async function deleteNote(id, options = {}) {
        const normalizedId = String(id || '');
        try {
            await request(`/notes/${encodeURIComponent(normalizedId)}`, {
                ...options.requestOptions,
                method: 'DELETE',
            });
            return normalizeDeleteResult(normalizedId);
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'deleteNote', fallbackCode: 'DELETE_FAILED' });
        }
    }

    async function deleteNotes(ids, options = {}) {
        const result = normalizeDeleteManyResult(ids);
        try {
            for (const id of result.ids) await deleteNote(id, options);
            return result;
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'deleteNotes', fallbackCode: 'DELETE_FAILED' });
        }
    }

    async function importNotes(data, options = {}) {
        if (!data || data.format !== 'tavern-notes-export' || !Array.isArray(data.notes)) {
            throw toNoteRepositoryError(new Error('Invalid Tavern Notes import.'), {
                operation: 'importNotes',
                fallbackCode: 'IMPORT_FAILED',
            });
        }
        const notes = [];
        let invalid = 0;
        for (const note of data.notes) {
            try {
                notes.push(normalizeNote(note, { allowMissingId: true }));
            } catch {
                invalid += 1;
            }
        }
        try {
            let imported = 0;
            let skipped = invalid;
            for (let offset = 0; offset < notes.length; offset += importChunkSize) {
                const result = await request('/import', {
                    ...options.requestOptions,
                    method: 'POST',
                    body: JSON.stringify({
                        format: 'tavern-notes-export',
                        version: data.version || 1,
                        notes: notes.slice(offset, offset + importChunkSize),
                    }),
                });
                imported += Number(result?.imported || 0);
                skipped += Number(result?.skipped || 0);
            }
            return { imported, skipped };
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'importNotes', fallbackCode: 'IMPORT_FAILED' });
        }
    }

    async function exportNotes(options = {}) {
        const format = options.format === 'txt' ? 'txt' : 'json';
        try {
            if (format === 'txt' && typeof requestFile === 'function') {
                return { format, data: await requestFile('/export.txt', options.requestOptions), source: 'full' };
            }
            const data = await request('/export.json', options.requestOptions);
            return {
                format: 'json',
                data: {
                    ...data,
                    notes: (data?.notes || []).map(note => normalizeNote(note)),
                },
                source: 'full',
            };
        } catch (error) {
            throw toNoteRepositoryError(error, { operation: 'exportNotes', fallbackCode: 'REQUEST_FAILED' });
        }
    }

    return {
        listNotes,
        getNote,
        createNote,
        updateNote,
        deleteNote,
        deleteNotes,
        importNotes,
        exportNotes,
    };
}
