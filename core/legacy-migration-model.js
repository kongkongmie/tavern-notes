// Pure rules for moving notes from the old Full backend / Lite browser storage into file storage.

export function noteSignature(note) {
    return [note?.type, note?.content, note?.createdAt ?? ''].join('\u0001');
}

// Old Full and old Lite data may both exist; Full wins, Lite adds only notes Full does not have.
export function combineLegacyNotes({ fullNotes = [], liteNotes = [] } = {}) {
    const combined = [...fullNotes];
    const seenIds = new Set(fullNotes.map(note => String(note.id)));
    const seenSignatures = new Set(fullNotes.map(noteSignature));
    for (const note of liteNotes) {
        if (seenSignatures.has(noteSignature(note))) continue;
        combined.push(seenIds.has(String(note.id)) ? { ...note, id: `${note.id}_lite` } : note);
        seenIds.add(String(note.id));
        seenSignatures.add(noteSignature(note));
    }
    return combined;
}

function sameTags(left, right) {
    const normalize = tags => (Array.isArray(tags) ? tags : []).map(tag => String(tag)).join('\u0001');
    return normalize(left) === normalize(right);
}

// Checks every source note against what was read back from the files, field by field.
export function verifyMigratedNotes(sourceNotes, storedNotes, { matchBy = 'id' } = {}) {
    const stored = new Map(storedNotes.map(note => [matchBy === 'id' ? String(note.id) : noteSignature(note), note]));
    const problems = [];
    for (const source of sourceNotes) {
        if (!String(source?.content || '').trim()) continue;
        const key = matchBy === 'id' ? String(source.id) : noteSignature(source);
        const target = stored.get(key);
        if (!target) {
            problems.push({ id: source.id, reason: 'missing' });
            continue;
        }
        const checks = [
            ['content', String(source.content).trim().slice(0, 200000), target.content],
            ['type', source.type, target.type],
            ['createdAt', source.createdAt, target.createdAt],
            ['character', source.character?.name || '未命名角色', target.character?.name],
            ['chat', source.chat?.id ?? null, target.chat?.id ?? null],
        ];
        for (const [field, expected, actual] of checks) {
            if (String(expected ?? '') !== String(actual ?? '')) problems.push({ id: source.id, reason: field });
        }
        if (!sameTags(source.tags, target.tags)) problems.push({ id: source.id, reason: 'tags' });
    }
    const expected = sourceNotes.filter(note => String(note?.content || '').trim()).length;
    return { ok: problems.length === 0, expected, stored: storedNotes.length, problems };
}

const BUILT_IN_THEME_IDS = new Set(['default', 'apple-glass', 'apple-glass-day', 'apple-glass-night', 'blueprint-pixel', 'secret-files']);

export function isLegacyCustomThemeId(id) {
    return Boolean(id) && !BUILT_IN_THEME_IDS.has(String(id));
}

// The 2.x Server Plugin kept a daily backup (data/<user>/tavern-notes/backups/tavern-notes-daily-backup.json)
// in its own format. Accept it as a normal export so people who already removed the backend can import it.
export function toNotesExport(payload) {
    if (payload?.format === 'tavern-notes-daily-backup' && Array.isArray(payload.notes)) {
        return {
            ok: true,
            format: 'tavern-notes-export',
            version: 1,
            source: 'tavern-notes-daily-backup',
            exportedAt: payload.backedUpAt || '',
            user: payload.user || '',
            notes: payload.notes,
        };
    }
    return payload;
}
