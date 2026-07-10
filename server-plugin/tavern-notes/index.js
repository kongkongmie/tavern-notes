const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const STORE_DIR = 'tavern-notes';
const PLUGIN_VERSION = '1.0.14';
const INDEX_FILE = 'index.json';
const THEME_FILE = 'theme.json';
const THEME_ACTIVE_FILE = 'theme-active.json';
const THEMES_DIR = 'themes';
const BACKUP_DIR = 'backups';
const DAILY_BACKUP_FILE = 'tavern-notes-daily-backup.json';
const SHARD_PREFIX = 'notes-';
const SHARD_SUFFIX = '.jsonl';
const MAX_SHARD_LINES = 1000;
const MAX_CONTENT_LENGTH = 20000;
const LATEST_CACHE_SIZE = 200;

function nowIso() {
    return new Date().toISOString();
}

function makeId(seq) {
    return `tn_${Date.now().toString(36)}_${String(seq).padStart(6, '0')}`;
}

function getStorePath(request) {
    if (!request.user?.directories?.root) {
        const error = new Error('Tavern Notes requires a logged-in SillyTavern user.');
        error.status = 403;
        throw error;
    }

    const userRoot = request.user.directories.root;
    const storePath = path.resolve(userRoot, STORE_DIR);
    const resolvedRoot = path.resolve(userRoot);

    if (!storePath.startsWith(resolvedRoot + path.sep)) {
        const error = new Error('Resolved notes path escaped the user directory.');
        error.status = 500;
        throw error;
    }

    fs.mkdirSync(storePath, { recursive: true });
    fs.mkdirSync(path.join(storePath, 'exports'), { recursive: true });
    fs.mkdirSync(path.join(storePath, 'cards'), { recursive: true });
    fs.mkdirSync(path.join(storePath, BACKUP_DIR), { recursive: true });
    fs.mkdirSync(path.join(storePath, THEMES_DIR), { recursive: true });
    return storePath;
}

function getIndexPath(storePath) {
    return path.join(storePath, INDEX_FILE);
}

function getThemePath(storePath) {
    return path.join(storePath, THEME_FILE);
}

function getThemesPath(storePath) {
    return path.join(storePath, THEMES_DIR);
}

function getThemeActivePath(storePath) {
    return path.join(storePath, THEME_ACTIVE_FILE);
}

function getDailyBackupPath(storePath) {
    return path.join(storePath, BACKUP_DIR, DAILY_BACKUP_FILE);
}

function openFolder(folderPath) {
    const resolved = path.resolve(folderPath);
    const systemRoot = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
    const candidates = process.platform === 'win32'
        ? [
            { command: process.env.ComSpec || path.join(systemRoot, 'System32', 'cmd.exe'), args: ['/c', 'start', '', resolved] },
            { command: path.join(systemRoot, 'explorer.exe'), args: [resolved] },
            { command: path.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'), args: ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', 'Start-Process', '-LiteralPath', resolved] },
        ]
        : [
            { command: process.platform === 'darwin' ? 'open' : 'xdg-open', args: [resolved] },
        ];

    const tryCandidate = index => new Promise((resolve, reject) => {
        const candidate = candidates[index];
        if (!candidate) return reject(new Error('No supported folder opener was found.'));

        const child = childProcess.spawn(candidate.command, candidate.args, {
            detached: true,
            stdio: 'ignore',
            windowsHide: true,
        });

        child.once('error', error => {
            tryCandidate(index + 1).then(resolve).catch(() => reject(error));
        });
        child.once('spawn', () => {
            child.unref();
            resolve();
        });
    });

    return tryCandidate(0);
}

function defaultTheme() {
    return {
        format: 'tavern-notes-theme',
        version: 1,
        name: 'Soft Neomorphism',
        author: 'Tavern Notes',
        variables: {
            '--tn-paper': '#eeede9',
            '--tn-paper-2': '#fbfaf6',
            '--tn-ink': '#44423e',
            '--tn-muted': '#8f8b82',
            '--tn-line': 'rgba(188, 183, 171, 0.34)',
            '--tn-gold': '#f4b51f',
            '--tn-gold-2': '#ffd45f',
            '--tn-shadow-dark': 'rgba(151, 145, 132, 0.44)',
            '--tn-shadow-light': 'rgba(255, 255, 255, 0.98)',
            '--tn-radius-panel': '28px',
            '--tn-radius-card': '24px',
            '--tn-font-family': 'var(--mainFontFamily, inherit)',
            '--tn-panel-border': 'rgba(255, 255, 255, 0.86)',
            '--tn-control-bg': 'linear-gradient(145deg, #fffdf7 0%, #e4e1d8 100%)',
            '--tn-control-bg-hover': 'linear-gradient(145deg, rgba(255, 216, 82, 0.48), rgba(255, 254, 248, 0.98)), linear-gradient(145deg, #fffdf7, #e4e1d8)',
            '--tn-control-inset-bg': 'linear-gradient(145deg, #dedbd2 0%, #fffdf8 100%)',
            '--tn-control-inset-shadow': 'inset 8px 8px 18px rgba(151, 145, 132, 0.24), inset -8px -8px 18px rgba(255, 255, 255, 0.92)',
            '--tn-card-bg': 'linear-gradient(145deg, #fffdf7 0%, #e5e2d9 100%)',
            '--tn-card-bg-active': 'radial-gradient(circle at 18% 22%, rgba(255, 212, 74, 0.58), transparent 32%), linear-gradient(145deg, #fffdf7 0%, #e5e2d9 100%)',
            '--tn-card-active-shadow': 'inset 5px 5px 12px rgba(151, 145, 132, 0.18), inset -5px -5px 12px rgba(255, 255, 255, 0.78), 8px 8px 18px rgba(151, 145, 132, 0.2)',
            '--tn-icon-bg': 'linear-gradient(145deg, #fffef9 0%, #ddd9cf 100%)',
            '--tn-action-bg': 'linear-gradient(145deg, rgba(255, 253, 247, 0.98), rgba(230, 226, 217, 0.96))',
            '--tn-overlay-bg': 'rgba(238, 236, 229, 0.84)',
            '--tn-fade-bg': 'linear-gradient(90deg, rgba(251, 250, 246, 0), rgba(251, 250, 246, 0.88) 34%, rgba(251, 250, 246, 0.98))',
            '--tn-card-image': 'linear-gradient(transparent, transparent)',
            '--tn-em': '#8d8a82',
            '--tn-underline': '#d7a018',
            '--tn-quote': '#d89400',
            '--tn-text-shadow': 'transparent',
            '--tn-panel-glow': 'rgba(255, 215, 91, 0.24)',
            '--tn-scrollbar-thumb': '#f4b51f',
            '--tn-scrollbar-track': 'rgba(244, 181, 31, 0.13)',
            '--tn-mini-button-bg': 'linear-gradient(145deg, #fffef9, #e4e1da)',
            '--tn-mini-button-shadow': '4px 4px 9px rgba(151, 145, 132, 0.3), -4px -4px 9px rgba(255, 255, 255, 0.98)',
            '--tn-mini-button-hover-bg': 'linear-gradient(145deg, rgba(255, 218, 94, 0.45), #fffef9)',
            '--tn-mini-button-hover-shadow': '6px 6px 13px rgba(151, 145, 132, 0.38), -6px -6px 13px rgba(255, 255, 255, 1)',
            '--tn-filter-hover-shadow': '15px 15px 28px rgba(151, 145, 132, 0.3), -12px -12px 24px rgba(255, 255, 255, 0.99)',
            '--tn-filter-icon-border': 'rgba(255, 255, 255, 0.76)',
            '--tn-filter-icon-shadow': '6px 6px 12px rgba(151, 145, 132, 0.28), -5px -5px 11px rgba(255, 255, 255, 0.96), inset 1px 1px 2px rgba(255, 255, 255, 0.82), inset -1px -1px 2px rgba(151, 145, 132, 0.12)',
            '--tn-inline-action-bg': 'rgba(255, 253, 247, 0.42)',
            '--tn-inline-action-hover-bg': 'rgba(255, 229, 138, 0.24)',
            '--tn-inline-action-shadow': '3px 3px 7px rgba(151, 145, 132, 0.16), -3px -3px 7px rgba(255, 255, 255, 0.72)',
            '--tn-inline-action-hover-shadow': 'inset 3px 3px 7px rgba(151, 145, 132, 0.14), inset -3px -3px 7px rgba(255, 255, 255, 0.78)',
            '--tn-inline-icon-bg': 'linear-gradient(145deg, #fffdf8, #dedbd3)',
            '--tn-inline-icon-hover-bg': 'linear-gradient(145deg, #fff7d9, #fffefa)',
            '--tn-inline-icon-shadow': '2px 2px 5px rgba(151, 145, 132, 0.28), -2px -2px 5px rgba(255, 255, 255, 0.88)',
            '--tn-note-bg': 'var(--tn-card-image), var(--tn-card-bg)',
            '--tn-note-border': '1px solid rgba(255, 255, 255, 0.82)',
            '--tn-note-shadow': '16px 16px 30px rgba(151, 145, 132, 0.28), -14px -14px 28px rgba(255, 255, 255, 0.98)',
            '--tn-note-type-bg': 'linear-gradient(145deg, rgba(255, 225, 127, 0.7), rgba(255, 248, 224, 0.78))',
            '--tn-note-type-color': '#805d05',
            '--tn-note-type-user-bg': 'linear-gradient(145deg, rgba(255, 225, 127, 0.7), rgba(255, 248, 224, 0.78))',
            '--tn-note-type-user-color': '#805d05',
            '--tn-note-type-excerpt-bg': 'linear-gradient(145deg, rgba(210, 217, 228, 0.72), rgba(250, 250, 247, 0.86))',
            '--tn-note-type-excerpt-color': '#62676f',
            '--tn-note-accent-user': 'var(--tn-gold)',
            '--tn-note-accent-excerpt': 'var(--tn-muted)',
            '--tn-note-padding': '20px 22px 18px',
            '--tn-note-topline-bg': 'transparent',
            '--tn-note-topline-border': '0',
            '--tn-note-topline-padding': '0',
            '--tn-note-topline-radius': '0',
            '--tn-note-topline-margin': '0 0 12px 18px',
            '--tn-note-dot-display': 'block',
            '--tn-filter-shadow': '13px 13px 25px rgba(151, 145, 132, 0.28), -11px -11px 23px rgba(255, 255, 255, 0.99)',
            '--tn-control-shadow': '9px 9px 18px rgba(151, 145, 132, 0.3), -8px -8px 18px rgba(255, 255, 255, 0.99)',
            '--tn-inset-light': 'rgba(255, 255, 255, 0.94)',
        },
        assets: {
            brandIcon: 'fa-book-open',
            openIcon: 'fa-book-open',
            captureIcon: 'fa-highlighter',
            backgroundImage: '',
            buttonImage: '',
        },
    };
}

function sanitizeTheme(input = {}) {
    const base = defaultTheme();
    const theme = {
        ...base,
        ...input,
        format: 'tavern-notes-theme',
        version: 1,
        variables: {
            ...base.variables,
            ...(input.variables || {}),
        },
        assets: {
            ...base.assets,
            ...(input.assets || {}),
        },
    };
    if (JSON.stringify(theme).length > 200000) {
        const error = new Error('Theme file is too large.');
        error.status = 400;
        throw error;
    }
    theme.name = String(theme.name || base.name).slice(0, 80);
    theme.author = String(theme.author || '').slice(0, 80);
    for (const key of Object.keys(theme.variables)) {
        if (!key.startsWith('--tn-')) delete theme.variables[key];
        else theme.variables[key] = String(theme.variables[key]).slice(0, 3000);
    }
    for (const key of Object.keys(theme.assets)) {
        theme.assets[key] = String(theme.assets[key] || '').slice(0, 50000);
    }
    return theme;
}

function loadTheme(storePath) {
    const themePath = getThemePath(storePath);
    if (!fs.existsSync(themePath)) return defaultTheme();
    return sanitizeTheme(JSON.parse(fs.readFileSync(themePath, 'utf8')));
}

function saveTheme(storePath, theme) {
    const clean = sanitizeTheme(theme);
    fs.writeFileSync(getThemePath(storePath), JSON.stringify(clean, null, 2), 'utf8');
    return clean;
}

function makeThemeId(name = 'theme') {
    const slug = String(name || 'theme')
        .normalize('NFKD')
        .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'theme';
    return `${slug}-${Date.now().toString(36)}`;
}

function sanitizeThemeId(id) {
    const clean = String(id || '').replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '').slice(0, 80);
    if (!clean) {
        const error = new Error('Missing theme id.');
        error.status = 400;
        throw error;
    }
    return clean;
}

function getThemeFilePath(storePath, id) {
    const themesPath = getThemesPath(storePath);
    const filePath = path.resolve(themesPath, `${sanitizeThemeId(id)}.json`);
    const resolvedThemes = path.resolve(themesPath);
    if (!filePath.startsWith(resolvedThemes + path.sep)) {
        const error = new Error('Resolved theme path escaped the themes directory.');
        error.status = 400;
        throw error;
    }
    return filePath;
}

function getActiveThemeId(storePath) {
    const activePath = getThemeActivePath(storePath);
    if (!fs.existsSync(activePath)) return 'default';
    try {
        return sanitizeThemeId(JSON.parse(fs.readFileSync(activePath, 'utf8')).activeId || 'default');
    } catch {
        return 'default';
    }
}

function setActiveThemeId(storePath, id) {
    fs.writeFileSync(getThemeActivePath(storePath), JSON.stringify({ activeId: sanitizeThemeId(id) }, null, 2), 'utf8');
}

function themeSummary(id, theme) {
    const clean = sanitizeTheme(theme);
    return {
        id,
        name: clean.name || '未命名主题',
        author: clean.author || '',
        version: clean.version || 1,
    };
}

function listThemes(storePath) {
    const themesPath = getThemesPath(storePath);
    const themes = [{ id: 'default', ...themeSummary('default', defaultTheme()) }];
    for (const file of fs.readdirSync(themesPath)) {
        if (!file.endsWith('.json')) continue;
        const id = file.slice(0, -5);
        try {
            themes.push(themeSummary(id, JSON.parse(fs.readFileSync(path.join(themesPath, file), 'utf8'))));
        } catch {
            // Ignore broken theme files so one bad import does not block the panel.
        }
    }
    return themes.filter((theme, index, array) => array.findIndex(item => item.id === theme.id) === index);
}

function loadThemeById(storePath, id) {
    const cleanId = sanitizeThemeId(id);
    if (cleanId === 'default') return defaultTheme();
    const filePath = getThemeFilePath(storePath, cleanId);
    if (!fs.existsSync(filePath)) {
        const error = new Error('Theme not found.');
        error.status = 404;
        throw error;
    }
    return sanitizeTheme(JSON.parse(fs.readFileSync(filePath, 'utf8')));
}

function loadActiveTheme(storePath) {
    try {
        return loadThemeById(storePath, getActiveThemeId(storePath));
    } catch {
        setActiveThemeId(storePath, 'default');
        return defaultTheme();
    }
}

function saveThemeFile(storePath, theme, id) {
    const clean = sanitizeTheme(theme);
    const cleanId = id ? sanitizeThemeId(id) : makeThemeId(clean.name);
    if (cleanId === 'default') {
        const error = new Error('Default theme cannot be overwritten.');
        error.status = 400;
        throw error;
    }
    fs.writeFileSync(getThemeFilePath(storePath, cleanId), JSON.stringify(clean, null, 2), 'utf8');
    return { id: cleanId, theme: clean };
}

function ensureThemeLibrary(storePath) {
    const themesPath = getThemesPath(storePath);
    const existing = fs.readdirSync(themesPath).filter(file => file.endsWith('.json'));
    if (existing.length || !fs.existsSync(getThemePath(storePath))) return;
    const current = loadTheme(storePath);
    if (JSON.stringify(current) === JSON.stringify(defaultTheme())) return;
    const result = saveThemeFile(storePath, current, makeThemeId(current.name || '当前主题'));
    setActiveThemeId(storePath, result.id);
}

function defaultIndex(handle = 'unknown') {
    return {
        version: 1,
        user: handle,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        nextSeq: 1,
        currentShard: 1,
        currentShardLines: 0,
        totalNotes: 0,
        deletedIds: [],
        latest: [],
        settings: {
            autoCaptureUserInput: true,
        },
    };
}

function loadIndex(storePath, handle) {
    const indexPath = getIndexPath(storePath);
    if (!fs.existsSync(indexPath)) {
        const index = defaultIndex(handle);
        saveIndex(storePath, index);
        return index;
    }

    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    return {
        ...defaultIndex(handle),
        ...parsed,
        settings: {
            ...defaultIndex(handle).settings,
            ...(parsed.settings || {}),
        },
    };
}

function saveIndex(storePath, index) {
    index.updatedAt = nowIso();
    const tempPath = `${getIndexPath(storePath)}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(index, null, 2), 'utf8');
    fs.renameSync(tempPath, getIndexPath(storePath));
}

function shardName(number) {
    return `${SHARD_PREFIX}${String(number).padStart(4, '0')}${SHARD_SUFFIX}`;
}

function normalizeNote(input, index) {
    const content = String(input.content || '').trim();
    if (!content) {
        const error = new Error('Note content is empty.');
        error.status = 400;
        throw error;
    }

    return {
        id: makeId(index.nextSeq),
        seq: index.nextSeq,
        type: ['user_input', 'excerpt', 'manual'].includes(input.type) ? input.type : 'manual',
        content: content.slice(0, MAX_CONTENT_LENGTH),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        character: {
            id: input.character?.id ?? null,
            name: input.character?.name || '未命名角色',
            avatar: input.character?.avatar ?? null,
        },
        chat: {
            id: input.chat?.id ?? null,
            name: input.chat?.name || '',
            messageId: Number.isFinite(Number(input.chat?.messageId)) ? Number(input.chat.messageId) : null,
        },
        source: input.source || '',
        tags: Array.isArray(input.tags) ? input.tags.map(String).slice(0, 20) : [],
    };
}

function noteSummary(note) {
    return {
        id: note.id,
        seq: note.seq,
        type: note.type,
        content: note.content,
        createdAt: note.createdAt,
        character: note.character,
        chat: note.chat,
        source: note.source,
        tags: note.tags,
    };
}

function getVariantGroupKey(note) {
    if (note.type !== 'user_input') return '';
    if (note.chat?.messageId === null || note.chat?.messageId === undefined) return '';
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

function makeGroupId(groupKey) {
    return `tng_${Buffer.from(groupKey).toString('base64url')}`;
}

function groupNotesForDisplay(notes) {
    const groups = new Map();
    const display = [];

    for (const note of notes) {
        const groupKey = getVariantGroupKey(note);
        if (!groupKey) {
            display.push(note);
            continue;
        }

        let group = groups.get(groupKey);
        if (!group) {
            group = {
                ...note,
                id: makeGroupId(groupKey),
                groupId: makeGroupId(groupKey),
                variantGroupKey: groupKey,
                activeVariantId: note.id,
                variants: [],
                variantCount: 0,
            };
            groups.set(groupKey, group);
            display.push(group);
        }

        if (!group.variants.some(variant => variant.content === note.content)) {
            group.variants.push(note);
        }
    }

    for (const group of groups.values()) {
        group.variants.reverse();
        group.variantCount = group.variants.length;
        const latest = group.variants[group.variants.length - 1] || group;
        group.activeVariantId = latest.id;
        group.content = latest.content;
        group.createdAt = latest.createdAt;
        group.seq = latest.seq;
        group.chat = latest.chat;
        group.source = latest.source;
        group.tags = latest.tags;
    }

    return display;
}

function appendNote(storePath, index, note) {
    if (index.currentShardLines >= MAX_SHARD_LINES) {
        index.currentShard += 1;
        index.currentShardLines = 0;
    }

    fs.appendFileSync(path.join(storePath, shardName(index.currentShard)), `${JSON.stringify(note)}\n`, 'utf8');
    index.nextSeq += 1;
    index.totalNotes += 1;
    index.currentShardLines += 1;
    index.latest.unshift(noteSummary(note));
    index.latest = index.latest.slice(0, LATEST_CACHE_SIZE);
    saveIndex(storePath, index);
}

function getDeletedSet(index) {
    return new Set(Array.isArray(index.deletedIds) ? index.deletedIds : []);
}

function matchesFilters(note, filters) {
    if (filters.type && note.type !== filters.type) return false;
    if (filters.characterName && note.character?.name !== filters.characterName) return false;
    if (filters.characterId && String(note.character?.id ?? '') !== filters.characterId) return false;
    if (filters.q) {
        const haystack = `${note.content}\n${note.character?.name || ''}\n${note.chat?.name || ''}\n${(note.tags || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(filters.q.toLowerCase())) return false;
    }
    return true;
}

function readNotes(storePath, index, filters) {
    const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
    const offset = Math.max(Number(filters.offset) || 0, 0);
    const deleted = getDeletedSet(index);
    const results = [];

    for (let shard = index.currentShard; shard >= 1; shard -= 1) {
        const filePath = path.join(storePath, shardName(shard));
        if (!fs.existsSync(filePath)) continue;

        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).reverse();
        for (const line of lines) {
            let note;
            try {
                note = JSON.parse(line);
            } catch {
                continue;
            }
            if (deleted.has(note.id) || !matchesFilters(note, filters)) continue;
            results.push(noteSummary(note));
        }
    }

    return groupNotesForDisplay(results).slice(offset, offset + limit);
}

function countNotes(storePath, index, filters) {
    const deleted = getDeletedSet(index);
    const results = [];

    for (let shard = index.currentShard; shard >= 1; shard -= 1) {
        const filePath = path.join(storePath, shardName(shard));
        if (!fs.existsSync(filePath)) continue;

        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
        for (const line of lines) {
            let note;
            try {
                note = JSON.parse(line);
            } catch {
                continue;
            }
            if (!deleted.has(note.id) && matchesFilters(note, filters)) results.push(noteSummary(note));
        }
    }

    return groupNotesForDisplay(results).length;
}

function cleanCountFilters(filters = {}, overrides = {}) {
    const cleaned = { ...filters, ...overrides };
    delete cleaned.limit;
    delete cleaned.offset;
    delete cleaned.currentCharacterId;
    return cleaned;
}

function countNoteGroups(storePath, index, filters = {}) {
    const currentCharacterId = filters.currentCharacterId || filters.characterId;
    const base = cleanCountFilters(filters);
    delete base.type;
    delete base.characterId;
    delete base.characterName;
    return {
        all: countNotes(storePath, index, base),
        current_character: currentCharacterId ? countNotes(storePath, index, { ...base, characterId: currentCharacterId }) : 0,
        user_input: countNotes(storePath, index, { ...base, type: 'user_input' }),
        excerpt: countNotes(storePath, index, { ...base, type: 'excerpt' }),
    };
}

function summarizeCharacters(storePath, index, filters = {}) {
    const notes = groupNotesForDisplay(readAllNotes(storePath, index, cleanCountFilters(filters)));
    const summaries = new Map();

    for (const note of notes) {
        const character = note.character || {};
        const key = [
            character.id ?? '',
            character.avatar ?? '',
            character.name ?? '未命名角色',
        ].map(value => String(value).replaceAll('|', '\\|')).join('|');

        const summary = summaries.get(key) || {
            id: character.id ?? null,
            name: character.name || '未命名角色',
            avatar: character.avatar ?? null,
            total: 0,
            userInput: 0,
            excerpt: 0,
            latestAt: '',
        };

        summary.total += 1;
        if (note.type === 'user_input') summary.userInput += 1;
        else if (note.type === 'excerpt') summary.excerpt += 1;
        if (!summary.latestAt || String(note.createdAt || '') > summary.latestAt) {
            summary.latestAt = note.createdAt || '';
        }

        summaries.set(key, summary);
    }

    return Array.from(summaries.values())
        .sort((a, b) => String(b.latestAt || '').localeCompare(String(a.latestAt || '')));
}

function readAllNotes(storePath, index, filters = {}) {
    const deleted = getDeletedSet(index);
    const results = [];

    for (let shard = 1; shard <= index.currentShard; shard += 1) {
        const filePath = path.join(storePath, shardName(shard));
        if (!fs.existsSync(filePath)) continue;

        const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
        for (const line of lines) {
            let note;
            try {
                note = JSON.parse(line);
            } catch {
                continue;
            }
            if (deleted.has(note.id) || !matchesFilters(note, filters)) continue;
            results.push(noteSummary(note));
        }
    }

    return results;
}

function writeDailyBackup(storePath, index, userHandle) {
    try {
        const notes = readAllNotes(storePath, index);
        const backup = {
            ok: true,
            format: 'tavern-notes-daily-backup',
            version: 1,
            backedUpAt: nowIso(),
            user: userHandle || 'default-user',
            totalNotes: notes.length,
            notes,
        };
        const backupPath = getDailyBackupPath(storePath);
        const tempPath = `${backupPath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(backup, null, 2), 'utf8');
        fs.renameSync(tempPath, backupPath);
        return {
            path: backupPath,
            totalNotes: notes.length,
            backedUpAt: backup.backedUpAt,
        };
    } catch (error) {
        const wrapped = new Error(`自动备份失败：${error.message}`);
        wrapped.status = 500;
        throw wrapped;
    }
}

function groupNotesByCharacterForText(notes) {
    const groups = new Map();
    for (const note of notes) {
        const characterName = note.character?.name || '未命名角色';
        const key = [
            note.character?.id ?? '',
            note.character?.avatar ?? '',
            characterName,
        ].map(value => String(value).replaceAll('|', '\\|')).join('|');

        if (!groups.has(key)) {
            groups.set(key, {
                characterName,
                notes: [],
            });
        }
        groups.get(key).notes.push(note);
    }
    return Array.from(groups.values());
}

function formatNoteForText(note, index) {
    const created = note.createdAt ? new Date(note.createdAt).toLocaleString('zh-CN', { hour12: false }) : '';
    const chatName = note.chat?.name || '';
    const message = note.chat?.messageId === null || note.chat?.messageId === undefined ? '' : `#${note.chat.messageId}`;
    const source = [created, chatName, message].filter(Boolean).join(' · ');
    return [
        `${index + 1}. ${note.content || ''}`,
        source ? `   ${source}` : '',
    ].filter(Boolean).join('\n');
}

function buildTextSection(title, notes, emptyText) {
    const lines = [`【${title}】`, ''];
    if (!notes.length) {
        lines.push(emptyText, '');
        return lines;
    }

    for (const group of groupNotesByCharacterForText(notes)) {
        lines.push(`《${group.characterName}》`);
        lines.push(`共 ${group.notes.length} 条${title}`);
        lines.push('');
        lines.push(group.notes.map(formatNoteForText).join('\n\n'));
        lines.push('');
    }
    return lines;
}

function textExportCountLine(notes) {
    const userInputCount = notes.filter(note => note.type === 'user_input').length;
    const excerptCount = notes.filter(note => note.type === 'excerpt').length;
    if (userInputCount === notes.length) return `共 ${notes.length} 条User 输入`;
    if (excerptCount === notes.length) return `共 ${notes.length} 条摘抄`;
    return `共 ${notes.length} 条笔记（User 输入 ${userInputCount} · 摘抄 ${excerptCount}）`;
}

function buildPlainTextExport(notes) {
    const groups = groupNotesByCharacterForText(notes);
    if (!groups.length) return '暂无笔记\n\n——来自酒馆笔记\n';

    const body = groups.map(group => [
        `《${group.characterName}》`,
        textExportCountLine(group.notes),
        '',
        group.notes
            .map(note => String(note.content || '').trim())
            .filter(Boolean)
            .join('\n\n'),
    ].filter(line => line !== '').join('\n')).join('\n\n');

    return `${body}\n\n——来自酒馆笔记\n`;
}

function buildTxtExport(notes) {
    return buildPlainTextExport(notes);
}

async function init(router) {
    router.get('/status', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const index = loadIndex(storePath, request.user.profile?.handle);
            response.json({
                ok: true,
                user: request.user.profile?.handle || 'default-user',
                version: PLUGIN_VERSION,
                totalNotes: index.totalNotes,
                currentShard: index.currentShard,
                storage: storePath,
                settings: index.settings,
            });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.get('/notes', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const index = loadIndex(storePath, request.user.profile?.handle);
            const notes = readNotes(storePath, index, request.query || {});
            const filteredTotal = countNotes(storePath, index, request.query || {});
            const counts = countNoteGroups(storePath, index, request.query || {});
            response.json({ ok: true, notes, totalNotes: filteredTotal, allNotes: index.totalNotes, counts });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.get('/characters', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const index = loadIndex(storePath, request.user.profile?.handle);
            const characters = summarizeCharacters(storePath, index, request.query || {});
            response.json({ ok: true, characters });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.post('/notes', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const index = loadIndex(storePath, request.user.profile?.handle);
            const note = normalizeNote(request.body || {}, index);
            appendNote(storePath, index, note);
            const backup = writeDailyBackup(storePath, index, request.user.profile?.handle);
            response.json({ ok: true, note: noteSummary(note), backup });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.delete('/notes/:id', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const index = loadIndex(storePath, request.user.profile?.handle);
            const id = String(request.params.id || '');
            if (!id) return response.status(400).json({ ok: false, error: 'Missing note id.' });
            index.deletedIds = Array.from(new Set([...(index.deletedIds || []), id])).slice(-5000);
            index.latest = (index.latest || []).filter(note => note.id !== id);
            saveIndex(storePath, index);
            const backup = writeDailyBackup(storePath, index, request.user.profile?.handle);
            response.json({ ok: true, backup });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.get('/export.json', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const index = loadIndex(storePath, request.user.profile?.handle);
            const notes = readAllNotes(storePath, index);
            response.json({
                ok: true,
                format: 'tavern-notes-export',
                version: 1,
                exportedAt: nowIso(),
                user: request.user.profile?.handle || 'default-user',
                notes,
            });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.get('/export.txt', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const index = loadIndex(storePath, request.user.profile?.handle);
            const notes = readAllNotes(storePath, index);
            response.type('text/plain; charset=utf-8').send(buildTxtExport(notes));
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.get('/theme', (request, response) => {
        try {
            const storePath = getStorePath(request);
            response.json({ ok: true, theme: loadActiveTheme(storePath), activeId: getActiveThemeId(storePath) });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.post('/theme', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const theme = saveTheme(storePath, request.body?.theme || request.body || {});
            response.json({ ok: true, theme });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.get('/themes', (request, response) => {
        try {
            const storePath = getStorePath(request);
            ensureThemeLibrary(storePath);
            const activeId = getActiveThemeId(storePath);
            response.json({
                ok: true,
                themes: listThemes(storePath),
                activeId,
                activeTheme: loadActiveTheme(storePath),
            });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.post('/themes/folder/open', async (request, response) => {
        try {
            const storePath = getStorePath(request);
            const themesPath = getThemesPath(storePath);
            fs.mkdirSync(themesPath, { recursive: true });
            await openFolder(themesPath);
            response.json({ ok: true });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: `打开主题文件夹失败：${error.message}` });
        }
    });

    router.get('/themes/:id', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const id = sanitizeThemeId(request.params.id);
            response.json({ ok: true, id, theme: loadThemeById(storePath, id) });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.post('/themes', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const result = saveThemeFile(storePath, request.body?.theme || {}, request.body?.id);
            if (request.body?.activate !== false) {
                setActiveThemeId(storePath, result.id);
            }
            response.json({ ok: true, ...result, themes: listThemes(storePath), activeId: getActiveThemeId(storePath) });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.post('/themes/:id/activate', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const id = sanitizeThemeId(request.params.id);
            const theme = loadThemeById(storePath, id);
            setActiveThemeId(storePath, id);
            response.json({ ok: true, id, theme, activeId: id, themes: listThemes(storePath) });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    router.delete('/themes/:id', (request, response) => {
        try {
            const storePath = getStorePath(request);
            const id = sanitizeThemeId(request.params.id);
            if (id === 'default') return response.status(400).json({ ok: false, error: 'Default theme cannot be deleted.' });
            const filePath = getThemeFilePath(storePath, id);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (getActiveThemeId(storePath) === id) {
                setActiveThemeId(storePath, 'default');
                const theme = defaultTheme();
                return response.json({ ok: true, theme, activeId: 'default', themes: listThemes(storePath) });
            }
            response.json({ ok: true, activeId: getActiveThemeId(storePath), themes: listThemes(storePath) });
        } catch (error) {
            response.status(error.status || 500).json({ ok: false, error: error.message });
        }
    });

    console.log('Tavern Notes plugin loaded.');
}

module.exports = {
    init,
    info: {
        id: 'tavern-notes',
        name: '酒馆笔记 / Tavern Notes',
        version: PLUGIN_VERSION,
        description: 'Per-user local note storage, excerpts, exports, themes, and share cards for SillyTavern.',
    },
};
