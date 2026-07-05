import {
    characters,
    chat,
    eventSource,
    event_types,
    getCurrentChatId,
    getRequestHeaders,
    getThumbnailUrl,
    this_chid,
} from '../../../../script.js';

const API_BASE = '/api/plugins/tavern-notes';
const SETTINGS_KEY = 'tavern-notes-settings';

function loadLocalSettings() {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {};
    } catch {
        return {};
    }
}

const localSettings = loadLocalSettings();

const state = {
    open: false,
    filter: 'all',
    query: '',
    notes: [],
    characters: [],
    characterFilter: null,
    totalNotes: 0,
    counts: {},
    page: 1,
    pageSize: 15,
    status: null,
    lastCapturedMessageId: null,
    capturedUserInputs: {},
    variantIndexByGroup: {},
    lastSelection: null,
    searchTimer: null,
    qrBarObserver: null,
    theme: null,
    themes: [],
    activeThemeId: 'default',
    themeDraft: false,
    exportScope: 'all',
    showPageDownButton: localSettings.showPageDownButton !== false,
    shareCardNote: null,
    shareCardSettings: {
        theme: localSettings.shareCard?.theme || 'calendar',
        background: localSettings.shareCard?.background || '#f7f4ef',
        textColor: localSettings.shareCard?.textColor || '',
        fontFamily: localSettings.shareCard?.fontFamily || 'system-ui',
        fontImport: localSettings.shareCard?.fontImport || '',
        showCharacter: localSettings.shareCard?.showCharacter !== false,
        showDate: localSettings.shareCard?.showDate !== false,
    },
};

const DEFAULT_THEME = {
    format: 'tavern-notes-theme',
    version: 1,
    name: 'Soft Neomorphism',
    author: 'Tavern Notes',
    variables: {
        // 基础颜色：面板纸色、文字色、弱化文字、边框、强调色。
        '--tn-paper': '#eeede9',
        '--tn-paper-2': '#fbfaf6',
        '--tn-ink': '#44423e',
        '--tn-muted': '#8f8b82',
        '--tn-line': 'rgba(188, 183, 171, 0.34)',
        '--tn-gold': '#f4b51f',
        '--tn-gold-2': '#ffd45f',
        // 全局形状与阴影：面板半径、卡片半径、字体和外层投影。
        '--tn-shadow-dark': 'rgba(151, 145, 132, 0.44)',
        '--tn-shadow-light': 'rgba(255, 255, 255, 0.98)',
        '--tn-radius-panel': '28px',
        '--tn-radius-card': '24px',
        '--tn-font-family': 'var(--mainFontFamily, inherit)',
        '--tn-panel-border': 'rgba(255, 255, 255, 0.86)',
        // 控件与卡片：搜索框、筛选卡、按钮、弹层背景。
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
        // 文本语义：斜体、下划线、引用色和文本阴影。
        '--tn-em': '#8d8a82',
        '--tn-underline': '#d7a018',
        '--tn-quote': '#d89400',
        '--tn-text-shadow': 'transparent',
        // 滚动条与小按钮：分页、主题按钮、笔记操作按钮共用。
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
        // 笔记卡片：卡片背景、类型标签、User 输入/摘抄的区分色。
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

const FILTERS = [
    { id: 'all', icon: 'fa-layer-group', label: '全部', hint: 'all notes' },
    { id: 'characters', icon: 'fa-user', label: '角色', hint: 'by card' },
    { id: 'user_input', icon: 'fa-keyboard', label: 'User 输入', hint: 'your words' },
    { id: 'excerpt', icon: 'fa-highlighter', label: '摘抄', hint: 'selected text' },
];

const SHARE_CARD_THEMES = [
    { id: 'calendar', label: '日历' },
    { id: 'classic', label: '经典' },
    { id: 'ink', label: '墨白' },
];

const SHARE_CARD_BACKGROUNDS = ['#6f7fa8', '#f5f7fb', '#fff5f3', '#f5f8ef', '#eff8f4', '#f2e4b8', '#f7f4ef', '#ffffff', '#1f1f1f'];

const THEME_GUIDE = `主题文件说明

主题 JSON 由 variables 和 assets 两部分组成。

variables 分区：
1. 基础颜色：--tn-paper / --tn-paper-2 / --tn-ink / --tn-muted / --tn-line / --tn-gold
2. 全局形状：--tn-radius-panel / --tn-radius-card / --tn-font-family
3. 控件卡片：--tn-control-* / --tn-card-* / --tn-icon-bg / --tn-action-bg
4. 文本语义：--tn-em / --tn-underline / --tn-quote / --tn-text-shadow
5. 小按钮：--tn-mini-button-* / --tn-inline-action-* / --tn-inline-icon-*
6. 笔记卡：--tn-note-* / --tn-note-type-* / --tn-note-accent-*

assets 分区：
brandIcon 控制面板标题图标。
openIcon 控制输入栏上的酒馆笔记图标。
captureIcon 控制摘录按钮图标。
backgroundImage 可填空、url(...) 或 CSS 渐变。

融合当前酒馆主题时读取的 SillyTavern 变量：
--SmartThemeBodyColor -> 主文字与 --tn-ink
--SmartThemeEmColor -> 斜体/弱强调文字
--SmartThemeUnderlineColor -> 下划线语义色
--SmartThemeQuoteColor -> 引用色、强调色、滚动条
--SmartThemeShadowColor -> 阴影参考色
--SmartThemeChatTintColor -> 笔记卡/聊天内容背景
--SmartThemeBlurTintColor -> 面板/UI 背景
--SmartThemeBorderColor -> 边框与分割线
--SmartThemeUserMesBlurTintColor -> User 输入标签与强调
--SmartThemeBotMesBlurTintColor -> 摘抄标签与强调

融合主题是临时预览，只有点击保存或另存为才会生成主题文件。`;

function getCurrentCharacter() {
    const character = characters?.[this_chid] || {};
    return {
        id: this_chid ?? null,
        name: character.name || '未命名角色',
        avatar: character.avatar || null,
    };
}

function getChatName() {
    return getCurrentChatId?.() || '';
}

async function api(path, options = {}) {
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                ...getRequestHeaders(),
                'Content-Type': 'application/json',
                ...(options.headers || {}),
            },
        });
    } catch (error) {
        throw new Error(`无法连接酒馆笔记后端。请确认 server plugin 已安装到 plugins/tavern-notes，且 config.yaml 已开启 enableServerPlugins。原始错误：${error.message}`);
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
        if (response.status === 404) {
            throw new Error('找不到酒馆笔记后端。请安装 server-plugin/tavern-notes 并重启 SillyTavern。');
        }
        throw new Error(data.error || `酒馆笔记请求失败：${response.status}`);
    }
    return data;
}

function notify(message, kind = 'info') {
    setStatus(message);
    const toastrApi = globalThis.toastr;
    if (!toastrApi) return;
    if (kind === 'success') toastrApi.success(message);
    else if (kind === 'error') toastrApi.error(message);
    else toastrApi.info(message);
}

function setStatus(message) {
    state.status = message;
    document.querySelectorAll('.tavern-notes-status').forEach(el => {
        el.textContent = message;
    });
}

function saveLocalSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        showPageDownButton: state.showPageDownButton,
        shareCard: state.shareCardSettings,
    }));
}

function updatePageDownSettingButton() {
    const button = document.querySelector('#tavern-notes-page-down-setting');
    if (!button) return;
    button.classList.toggle('active', state.showPageDownButton);
    button.title = state.showPageDownButton
        ? '隐藏输入栏上的向下翻页按钮，适合不需要手机快捷翻页时关闭'
        : '显示输入栏上的向下翻页按钮，手机端常用';
}

function togglePageDownButtonSetting() {
    state.showPageDownButton = !state.showPageDownButton;
    saveLocalSettings();
    updatePageDownSettingButton();
    addInputToolbar();
    notify(state.showPageDownButton ? '已显示向下翻页按钮。' : '已隐藏向下翻页按钮。', 'success');
}

function htmlEscape(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function renderQuotedText(value) {
    const text = String(value ?? '');
    const pairs = {
        '“': '”',
        '「': '」',
        '『': '』',
        '《': '》',
        '"': '"',
    };
    const openers = new Set(Object.keys(pairs));
    let output = '';
    let index = 0;

    while (index < text.length) {
        const open = text[index];
        if (!openers.has(open)) {
            output += htmlEscape(open);
            index += 1;
            continue;
        }

        const close = pairs[open];
        const closeIndex = text.indexOf(close, index + 1);
        if (closeIndex === -1) {
            output += htmlEscape(open);
            index += 1;
            continue;
        }

        const quoted = text.slice(index, closeIndex + 1);
        output += `<span class="tn-dialogue">${htmlEscape(quoted)}</span>`;
        index = closeIndex + 1;
    }

    return output;
}

function noteTypeLabel(type) {
    if (type === 'user_input') return 'User 输入';
    if (type === 'excerpt') return '摘抄';
    return '手动';
}

function noteTypeClass(type) {
    if (type === 'user_input') return 'user';
    if (type === 'excerpt') return 'excerpt';
    return 'manual';
}

function getListPath() {
    const params = new URLSearchParams();
    params.set('limit', String(state.pageSize));
    params.set('offset', String((state.page - 1) * state.pageSize));
    if (state.query.trim()) params.set('q', state.query.trim());
    const currentCharacter = getCurrentCharacter();
    if (currentCharacter.id !== null) params.set('currentCharacterId', String(currentCharacter.id));
    if (state.filter === 'user_input') params.set('type', 'user_input');
    if (state.filter === 'excerpt') params.set('type', 'excerpt');
    if (state.characterFilter) {
        if (state.characterFilter.id !== null && state.characterFilter.id !== undefined && state.characterFilter.id !== '') {
            params.set('characterId', String(state.characterFilter.id));
        } else if (state.characterFilter.name) {
            params.set('characterName', state.characterFilter.name);
        }
    }
    return `/notes?${params.toString()}`;
}

function getCharactersPath() {
    const params = new URLSearchParams();
    if (state.query.trim()) params.set('q', state.query.trim());
    return `/characters?${params.toString()}`;
}

async function refreshNotes() {
    try {
        const [data, characterData] = await Promise.all([
            api(getListPath()),
            api(getCharactersPath()),
        ]);
        state.notes = data.notes || [];
        state.characters = characterData.characters || [];
        const isCharacterDirectory = state.filter === 'characters' && !state.characterFilter;
        state.totalNotes = isCharacterDirectory ? state.characters.length : Number(data.totalNotes || 0);
        state.counts = data.counts || {};
        const maxPage = getMaxPage();
        if (state.page > maxPage) {
            state.page = maxPage;
            await refreshNotes();
            return;
        }
        renderNotes();
        if (isCharacterDirectory) {
            setStatus(`已显示 ${state.characters.length} 个角色`);
        } else {
            setStatus(`已显示 ${state.notes.length} 条，当前筛选共 ${state.totalNotes} 条`);
        }
    } catch (error) {
        notify(error.message, 'error');
    }
}

function getMaxPage() {
    return Math.max(1, Math.ceil(state.totalNotes / state.pageSize));
}

function isLongNote(note) {
    const content = String(note.content || '');
    return content.length > 120 || content.split(/\r?\n/).length > 3;
}

function getCharacterAvatar(character) {
    const avatar = character?.avatar;
    if (!avatar || avatar === 'none') return '';
    try {
        return getThumbnailUrl('avatar', avatar);
    } catch {
        return '';
    }
}

function getCharacterInitial(name) {
    return String(name || '未').trim().slice(0, 1) || '未';
}

function getCharacterKey(character) {
    return [
        character?.id ?? '',
        character?.avatar ?? '',
        character?.name ?? '',
    ].map(value => String(value)).join('|');
}

function getCurrentCharacterSummary() {
    const current = getCurrentCharacter();
    const matched = state.characters.find(character => String(character.id ?? '') === String(current.id ?? ''))
        || state.characters.find(character => character.avatar && character.avatar === current.avatar)
        || state.characters.find(character => character.name === current.name);

    return {
        ...current,
        ...(matched || {}),
        id: matched?.id ?? current.id,
        name: matched?.name || current.name,
        avatar: matched?.avatar || current.avatar,
        total: Number(matched?.total || 0),
        userInput: Number(matched?.userInput || 0),
        excerpt: Number(matched?.excerpt || 0),
        isCurrent: true,
    };
}

function getNoteVariants(note) {
    return Array.isArray(note?.variants) && note.variants.length ? note.variants : [note];
}

function getVariantIndex(note) {
    const variants = getNoteVariants(note);
    const saved = state.variantIndexByGroup[note.id];
    const fallback = Math.max(0, variants.findIndex(variant => variant.id === note.activeVariantId));
    const index = Number.isFinite(Number(saved)) ? Number(saved) : (fallback >= 0 ? fallback : variants.length - 1);
    return Math.min(Math.max(index, 0), variants.length - 1);
}

function getActiveVariant(note) {
    const variants = getNoteVariants(note);
    return variants[getVariantIndex(note)] || note;
}

function renderVariantControls(note) {
    const variants = getNoteVariants(note);
    if (variants.length <= 1) return '';
    const index = getVariantIndex(note);
    return `
        <button class="tn-variant-side tn-variant-prev" type="button" ${index <= 0 ? 'disabled' : ''} title="上一个版本">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button class="tn-variant-side tn-variant-next" type="button" ${index >= variants.length - 1 ? 'disabled' : ''} title="下一个版本">
            <i class="fa-solid fa-chevron-right"></i>
        </button>
        <span class="tn-variant-count">${index + 1}/${variants.length}</span>
    `;
}

function renderCharacterOverview() {
    if (state.filter !== 'characters' || state.characterFilter) return '';
    const current = getCurrentCharacterSummary();
    const currentKey = getCharacterKey(current);
    const restCharacters = state.characters.filter(character => getCharacterKey(character) !== currentKey);

    if (!state.characters.length && !current.name) {
        return `
            <div class="tn-empty">
                <div class="tn-empty-orb"><i class="fa-solid fa-user"></i></div>
                <div class="tn-empty-title">还没有角色笔记</div>
                <small>发送 User 输入或摘录聊天文字后，这里会按角色汇总。</small>
            </div>
        `;
    }

    const renderCard = (character, isCurrent = false) => {
        const avatar = getCharacterAvatar(character);
        return `
            <button class="tn-character-card ${isCurrent ? 'tn-character-current' : ''}" type="button"
                data-character-id="${htmlEscape(character.id ?? '')}"
                data-character-name="${htmlEscape(character.name || '')}">
                <span class="tn-character-avatar">
                    ${avatar
                        ? `<img src="${htmlEscape(avatar)}" alt="${htmlEscape(character.name || '角色头像')}" loading="lazy" />`
                        : `<span>${htmlEscape(getCharacterInitial(character.name))}</span>`}
                </span>
                <span class="tn-character-info">
                    <b>${htmlEscape(character.name || '未命名角色')}${isCurrent ? '<em>当前</em>' : ''}</b>
                    <small>${htmlEscape(character.total)} 条 · 输入 ${htmlEscape(character.userInput)} · 摘抄 ${htmlEscape(character.excerpt)}</small>
                </span>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        `;
    };

    const cards = restCharacters.map(character => renderCard(character)).join('');

    return `
        <section class="tn-character-overview">
            <div class="tn-section-title">
                <span>当前角色</span>
                <small>优先显示</small>
            </div>
            <div class="tn-character-featured">${renderCard(current, true)}</div>
            <div class="tn-section-title">
                <span>按角色浏览</span>
                <small>${state.characters.length} 个角色</small>
            </div>
            ${cards ? `<div class="tn-character-grid">${cards}</div>` : '<div class="tn-character-empty-line">其他角色有记录后会显示在这里。</div>'}
        </section>
    `;
}

function renderCharacterScope() {
    if (!state.characterFilter) return '';
    const avatar = getCharacterAvatar(state.characterFilter);
    return `
        <section class="tn-character-scope">
            <span class="tn-character-avatar">
                ${avatar
                    ? `<img src="${htmlEscape(avatar)}" alt="${htmlEscape(state.characterFilter.name || '角色头像')}" loading="lazy" />`
                    : `<span>${htmlEscape(getCharacterInitial(state.characterFilter.name))}</span>`}
            </span>
            <div>
                <b>${htmlEscape(state.characterFilter.name || '未命名角色')}</b>
                <small>正在查看这个角色的笔记</small>
            </div>
            <button class="tn-clear-character" type="button"><i class="fa-solid fa-arrow-left"></i><span>返回角色列表</span></button>
        </section>
    `;
}

function renderNoteArticles() {
    if (!state.notes.length) {
        return `
            <div class="tn-empty">
                <div class="tn-empty-orb"><i class="fa-regular fa-note-sticky"></i></div>
                <div class="tn-empty-title">这里还没有笔记</div>
                <small>发送消息会自动记录 User 输入；选中聊天文字后点“摘录选中”会保存摘抄。</small>
            </div>
        `;
    }

    return state.notes.map(note => {
        const activeNote = getActiveVariant(note);
        const created = activeNote.createdAt ? new Date(activeNote.createdAt).toLocaleString() : '';
        const messageId = activeNote.chat?.messageId ?? note.chat?.messageId ?? '-';
        return `
            <article class="tn-note tn-note-${htmlEscape(noteTypeClass(note.type))}" data-note-id="${htmlEscape(note.id)}">
                ${renderVariantControls(note)}
                <div class="tn-note-topline">
                    <span class="tn-note-type">${htmlEscape(noteTypeLabel(note.type))}</span>
                    <span class="tn-note-character">${htmlEscape(note.character?.name || '未命名角色')}</span>
                    <span class="tn-note-muted">${htmlEscape(activeNote.chat?.name || note.chat?.name || '')}</span>
                    <span class="tn-note-muted">#${htmlEscape(messageId)}</span>
                    <span class="tn-note-time">${htmlEscape(created)}</span>
                </div>
                <div class="tn-note-body">
                    <div class="tn-note-content">${renderQuotedText(activeNote.content)}</div>
                    ${isLongNote(activeNote) ? '<button class="tn-expand" title="查看全文">...</button>' : ''}
                </div>
                <div class="tn-note-actions">
                    <button class="menu_button tn-fill" title="把这条内容放进输入框">
                        <i class="fa-solid fa-arrow-turn-down"></i><span>输入</span>
                    </button>
                    <button class="menu_button tn-copy" title="复制这条笔记">
                        <i class="fa-regular fa-copy"></i><span>复制</span>
                    </button>
                    <button class="menu_button tn-share" title="分享这条笔记">
                        <i class="fa-solid fa-share-nodes"></i><span>分享</span>
                    </button>
                    <button class="menu_button tn-delete" title="删除这条笔记">
                        <i class="fa-regular fa-trash-can"></i><span>删除</span>
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function renderNotes() {
    const list = document.querySelector('#tavern-notes-list');
    if (!list) return;

    updateFilterCounts();
    updateCharacterScopeStyle();
    const isCharacterDirectory = state.filter === 'characters' && !state.characterFilter;
    list.innerHTML = isCharacterDirectory ? renderCharacterOverview() : `${renderCharacterScope()}${renderNoteArticles()}`;
    renderPagination(!isCharacterDirectory);
}

function updateCharacterScopeStyle() {
    const panel = document.querySelector('#tavern-notes-panel');
    if (!panel) return;

    const avatar = getCharacterAvatar(state.characterFilter);
    panel.classList.toggle('tn-character-scoped', Boolean(state.characterFilter && avatar));
    if (!state.characterFilter || !avatar) {
        panel.style.removeProperty('--tn-scope-avatar');
        return;
    }

    panel.style.setProperty('--tn-scope-avatar', `url("${avatar.replaceAll('"', '\\"')}")`);
}

function updateFilterCounts() {
    const scopedCharacter = state.characterFilter;
    const countMap = {
        all: scopedCharacter ? scopedCharacter.total : (state.counts.all ?? state.totalNotes),
        characters: state.characters.length,
        user_input: scopedCharacter ? scopedCharacter.userInput : (state.counts.user_input ?? 0),
        excerpt: scopedCharacter ? scopedCharacter.excerpt : (state.counts.excerpt ?? 0),
    };
    document.querySelectorAll('.tn-filter-count').forEach(el => {
        const key = el.closest('.tn-filter')?.dataset.filter;
        el.textContent = countMap[key] === '' ? '' : String(countMap[key] ?? '');
    });
}

function findNoteGroupFromElement(element) {
    const article = element.closest('.tn-note');
    const id = article?.dataset.noteId;
    return state.notes.find(note => note.id === id);
}

function findNoteFromButton(button) {
    const note = findNoteGroupFromElement(button);
    return note ? getActiveVariant(note) : null;
}

function getInputBox() {
    return document.querySelector('#send_textarea') || document.querySelector('textarea');
}

function writeInput(text, append = false) {
    const input = getInputBox();
    if (!input) {
        notify('没有找到输入框。', 'error');
        return;
    }
    input.value = append && input.value ? `${input.value}\n${text}` : text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
}

async function saveNote(payload) {
    const data = await api('/notes', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (state.open) await refreshNotes();
    return data.note;
}

async function captureSelection() {
    const selection = window.getSelection();
    const currentText = selection?.toString()?.trim();
    const cached = state.lastSelection;
    const canUseCached = cached?.text && Date.now() - cached.time < 10 * 60 * 1000;
    const selected = currentText || (canUseCached ? cached.text : '');
    const messageId = currentText ? getSelectionMessageId(selection) : cached?.messageId;

    if (!selected) {
        notify('先在聊天里选中一段文字，再点“摘录选中”。');
        return;
    }

    await saveNote({
        type: 'excerpt',
        content: selected,
        character: getCurrentCharacter(),
        chat: {
            id: getChatName(),
            name: getChatName(),
            messageId,
        },
        source: 'selected_text',
    });
    notify('已摘录选中文字。', 'success');
}

function getSelectionMessageId(selection = window.getSelection()) {
    if (!selection || selection.rangeCount === 0) return null;

    const nodes = [selection.anchorNode, selection.focusNode];
    for (const startNode of nodes) {
        let node = startNode;
        while (node && node !== document.body) {
            const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
            const message = element?.closest?.('[mesid], .mes');
            const id = message?.getAttribute?.('mesid') || message?.dataset?.mesid;
            if (id !== undefined && id !== null) return Number(id);
            node = node.parentNode;
        }
    }
    return null;
}

function rememberSelection() {
    const selection = window.getSelection();
    const text = selection?.toString()?.trim();
    if (!text) return;
    state.lastSelection = {
        text,
        messageId: getSelectionMessageId(selection),
        time: Date.now(),
    };
}

async function captureUserMessage(messageId) {
    const message = chat?.[messageId];
    if (!message || !message.is_user || !String(message.mes || '').trim()) return;
    const content = String(message.mes || '').trim();
    const cacheKey = `${getChatName()}::${messageId}`;
    if (messageId === state.lastCapturedMessageId && state.capturedUserInputs[cacheKey] === content) return;
    if (state.capturedUserInputs[cacheKey] === content) return;
    state.lastCapturedMessageId = messageId;
    state.capturedUserInputs[cacheKey] = content;

    await saveNote({
        type: 'user_input',
        content,
        character: getCurrentCharacter(),
        chat: {
            id: getChatName(),
            name: getChatName(),
            messageId,
        },
        source: 'message_sent',
    }).catch(error => notify(error.message, 'error'));
}

function setActiveFilter(filter) {
    state.filter = filter;
    if (filter === 'characters') state.characterFilter = null;
    state.page = 1;
    document.querySelectorAll('.tn-filter').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    refreshNotes();
}

function setCharacterFilter(character) {
    state.filter = 'all';
    state.characterFilter = {
        id: character.id === '' ? null : character.id,
        name: character.name || '未命名角色',
        avatar: character.avatar || null,
        total: Number(character.total || 0),
        userInput: Number(character.userInput || 0),
        excerpt: Number(character.excerpt || 0),
    };
    state.page = 1;
    document.querySelectorAll('.tn-filter').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === 'all');
    });
    refreshNotes();
}

function clearCharacterFilter() {
    state.characterFilter = null;
    state.filter = 'characters';
    state.page = 1;
    document.querySelectorAll('.tn-filter').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === 'characters');
    });
    refreshNotes();
}

function buildPanel() {
    if (document.querySelector('#tavern-notes-panel')) return;

    document.body.insertAdjacentHTML('beforeend', `
        <section id="tavern-notes-panel" aria-label="酒馆笔记">
            <header class="tn-header">
                <div class="tn-brand-mark"><i class="fa-solid fa-book-open"></i></div>
                <div class="tn-heading">
                    <div class="tn-title">酒馆笔记 <span>@KKM</span></div>
                    <div class="tn-subtitle">soft notes · character memory</div>
                </div>
                <div class="tn-header-actions">
                    <button id="tavern-notes-theme" class="tn-soft-button" title="打开主题面板：切换、导入、导出或编辑酒馆笔记主题" aria-label="打开主题面板">
                        <i class="fa-solid fa-palette"></i><span>主题</span>
                    </button>
                    <button id="tavern-notes-page-down-setting" class="tn-soft-button" title="显示或隐藏输入栏上的向下翻页按钮，手机端常用" aria-label="切换向下翻页按钮">
                        <i class="fa-solid fa-arrow-down"></i><span>翻页</span>
                    </button>
                    <button id="tavern-notes-refresh" class="tn-icon-button" title="重新读取当前筛选和分页的笔记" aria-label="刷新笔记">
                        <i class="fa-solid fa-rotate-right"></i>
                    </button>
                    <button id="tavern-notes-export" class="tn-icon-button" title="打开导出面板：可导出全部笔记或当前页面" aria-label="导出笔记">
                        <i class="fa-solid fa-download"></i>
                    </button>
                    <button class="tn-icon-button tn-close" title="关闭酒馆笔记面板" aria-label="关闭酒馆笔记">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </header>
            <div class="tn-search-row">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input id="tavern-notes-search" class="text_pole" type="search" placeholder="搜索笔记、角色、聊天..." />
            </div>
            <div class="tn-shell">
                <nav class="tn-filters">
                    ${FILTERS.map(filter => `
                        <button class="tn-filter ${filter.id === 'all' ? 'active' : ''}" data-filter="${filter.id}">
                            <span class="tn-filter-icon"><i class="fa-solid ${filter.icon}"></i></span>
                            <span class="tn-filter-text">
                                <b>${filter.label}</b>
                                <small>${filter.hint}</small>
                            </span>
                            <span class="tn-filter-count"></span>
                        </button>
                    `).join('')}
                </nav>
                <main id="tavern-notes-list" class="tn-list"></main>
            </div>
            <footer class="tn-footer">
                <span class="tavern-notes-status">正在连接酒馆笔记...</span>
                <div class="tn-pagination">
                    <button id="tavern-notes-prev" class="tn-page-button" title="上一页"><i class="fa-solid fa-chevron-left"></i></button>
                    <span id="tavern-notes-page-label">1 / 1</span>
                    <button id="tavern-notes-next" class="tn-page-button" title="下一页"><i class="fa-solid fa-chevron-right"></i></button>
                    <input id="tavern-notes-page-input" type="number" min="1" value="1" />
                    <button id="tavern-notes-page-jump" class="tn-page-button">跳页</button>
                </div>
            </footer>
            <div id="tavern-notes-modal" aria-hidden="true">
                <div class="tn-modal-card">
                    <button class="tn-icon-button tn-modal-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-modal-kicker"></div>
                    <div class="tn-modal-title"></div>
                    <div class="tn-modal-content"></div>
                </div>
            </div>
            <div id="tavern-notes-export-menu" aria-hidden="true">
                <div class="tn-export-card">
                    <div class="tn-export-title">导出笔记</div>
                    <div class="tn-export-scope">
                        <div class="tn-export-scope-label">导出范围</div>
                        <div class="tn-export-scope-options" role="group" aria-label="导出范围">
                            <button class="tn-export-scope-choice active" data-scope="all" type="button">全部笔记</button>
                            <button class="tn-export-scope-choice" data-scope="page" type="button">当前页面</button>
                        </div>
                        <small class="tn-export-hint">当前页面只导出现在列表里这一页看到的笔记。</small>
                    </div>
                    <button class="tn-export-choice" data-format="json" title="导出结构化 JSON，适合以后重新导入或备份"><i class="fa-solid fa-file-code"></i><span>可再次导入 JSON</span></button>
                    <button class="tn-export-choice" data-format="txt" title="导出干净的 TXT 文本，User 输入和摘抄会分区显示"><i class="fa-solid fa-file-lines"></i><span>清爽 TXT 文本</span></button>
                    <button class="tn-export-choice" data-format="both" title="同时导出 JSON 和 TXT 两个文件"><i class="fa-solid fa-layer-group"></i><span>两个都导出</span></button>
                </div>
            </div>
            <div id="tavern-notes-theme-menu" aria-hidden="true">
                <div class="tn-theme-card">
                    <div class="tn-export-title">主题文件</div>
                    <div class="tn-theme-name">当前：Soft Neomorphism</div>
                    <div class="tn-theme-picker">
                        <select id="tavern-notes-theme-select" title="切换主题"></select>
                        <button id="tavern-notes-theme-import" class="tn-theme-icon-button" title="导入主题"><i class="fa-solid fa-file-import"></i></button>
                        <button id="tavern-notes-theme-export" class="tn-theme-icon-button" title="导出当前主题"><i class="fa-solid fa-file-export"></i></button>
                        <button id="tavern-notes-theme-open-folder" class="tn-theme-icon-button" title="打开主题文件夹"><i class="fa-solid fa-folder-open"></i></button>
                        <button id="tavern-notes-theme-delete" class="tn-theme-icon-button" title="删除主题"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                    <input id="tavern-notes-theme-name-input" class="tn-theme-input" type="text" placeholder="主题名称" />
                    <button id="tavern-notes-theme-merge-st" class="tn-theme-merge-button"><i class="fa-solid fa-wand-magic-sparkles"></i><span>融合当前酒馆主题</span></button>
                    <details class="tn-theme-guide">
                        <summary><i class="fa-solid fa-circle-info"></i><span>主题制作说明</span></summary>
                        <pre>${htmlEscape(THEME_GUIDE)}</pre>
                    </details>
                    <textarea id="tavern-notes-theme-code" spellcheck="false"></textarea>
                    <div class="tn-theme-actions">
                        <button id="tavern-notes-theme-preview" class="tn-export-choice"><i class="fa-solid fa-eye"></i><span>预览</span></button>
                        <button id="tavern-notes-theme-save" class="tn-export-choice"><i class="fa-solid fa-floppy-disk"></i><span>保存</span></button>
                        <button id="tavern-notes-theme-save-as" class="tn-export-choice"><i class="fa-solid fa-copy"></i><span>另存为</span></button>
                        <button id="tavern-notes-theme-reset" class="tn-export-choice"><i class="fa-solid fa-rotate-left"></i><span>恢复默认</span></button>
                    </div>
                    <input id="tavern-notes-theme-file" type="file" accept=".json,application/json" hidden />
                </div>
            </div>
            <div id="tavern-notes-share-menu" aria-hidden="true">
                <div class="tn-share-card">
                    <button class="tn-icon-button tn-share-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
                    <div class="tn-share-preview-wrap">
                        <canvas id="tavern-notes-share-canvas" width="900" height="1400"></canvas>
                    </div>
                    <div class="tn-share-controls">
                        <div class="tn-export-title">分享卡片</div>
                        <label class="tn-share-label">主题</label>
                        <div class="tn-share-theme-row">
                            ${SHARE_CARD_THEMES.map(theme => `<button class="tn-share-choice" data-share-theme="${theme.id}" type="button">${theme.label}</button>`).join('')}
                        </div>
                        <label class="tn-share-label">字体</label>
                        <input id="tavern-notes-share-font" class="tn-theme-input" type="text" placeholder='例如 STDongGuanTi, 思源宋体, serif' />
                        <label class="tn-share-label">字体地址或 @import</label>
                        <textarea id="tavern-notes-share-font-import" class="tn-share-font-import" spellcheck="false" placeholder='https://fontsapi.zeoseven.com/488/main/result.css'></textarea>
                        <div class="tn-share-help">
                            粘贴 ZeoSeven 的 result.css 地址，或整段 @import CSS，然后点“导入字体”。识别成功后会自动填入字体名并刷新图片。
                            <a href="https://fonts.zeoseven.com/" target="_blank" rel="noopener noreferrer">查找免费商用字体</a>
                        </div>
                        <label class="tn-share-label">背景</label>
                        <div class="tn-share-bg-row">
                            ${SHARE_CARD_BACKGROUNDS.map(color => `<button class="tn-share-bg" data-share-bg="${color}" type="button" style="--share-bg:${color}"></button>`).join('')}
                        </div>
                        <label class="tn-share-label">显示</label>
                        <div class="tn-share-toggle-row">
                            <label><input id="tavern-notes-share-show-character" type="checkbox" />角色名</label>
                            <label><input id="tavern-notes-share-show-date" type="checkbox" />日期</label>
                        </div>
                        <div class="tn-share-actions">
                            <button id="tavern-notes-share-import-font" class="tn-export-choice" type="button"><i class="fa-solid fa-font"></i><span>导入字体</span></button>
                            <button id="tavern-notes-share-redraw" class="tn-export-choice" type="button"><i class="fa-solid fa-wand-magic-sparkles"></i><span>刷新预览</span></button>
                            <button id="tavern-notes-share-download" class="tn-export-choice" type="button"><i class="fa-solid fa-download"></i><span>导出 PNG</span></button>
                        </div>
                    </div>
                    <style id="tavern-notes-share-font-style"></style>
                </div>
            </div>
        </section>
    `);

    addInputToolbar();
    addExtensionsMenuEntry();
    bindEvents();
}

function bindEvents() {
    document.querySelector('#tavern-notes-theme')?.addEventListener('click', toggleThemeMenu);
    document.querySelector('#tavern-notes-page-down-setting')?.addEventListener('click', togglePageDownButtonSetting);
    document.querySelector('.tn-close')?.addEventListener('click', closePanel);
    document.querySelector('#tavern-notes-refresh')?.addEventListener('click', refreshNotes);
    document.querySelector('#tavern-notes-export')?.addEventListener('click', toggleExportMenu);
    document.querySelector('#tavern-notes-search')?.addEventListener('input', event => {
        state.query = event.target.value;
        state.page = 1;
        clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(refreshNotes, 300);
    });
    document.querySelectorAll('.tn-filter').forEach(tab => {
        tab.addEventListener('click', () => setActiveFilter(tab.dataset.filter || 'all'));
    });
    document.querySelector('#tavern-notes-list')?.addEventListener('click', handleNoteAction);
    document.querySelector('.tn-modal-close')?.addEventListener('click', closeFullNote);
    document.querySelector('#tavern-notes-modal')?.addEventListener('click', event => {
        if (event.target.id === 'tavern-notes-modal') closeFullNote();
    });
    document.querySelector('#tavern-notes-export-menu')?.addEventListener('click', event => {
        if (event.target.id === 'tavern-notes-export-menu') closeExportMenu();
    });
    document.querySelector('#tavern-notes-theme-menu')?.addEventListener('click', event => {
        if (event.target.id === 'tavern-notes-theme-menu') closeThemeMenu();
    });
    document.querySelector('#tavern-notes-share-menu')?.addEventListener('click', event => {
        if (event.target.id === 'tavern-notes-share-menu') closeShareCard();
    });
    document.querySelector('.tn-share-close')?.addEventListener('click', closeShareCard);
    document.querySelectorAll('.tn-share-choice').forEach(button => {
        button.addEventListener('click', () => updateShareCardSetting({ theme: button.dataset.shareTheme || 'calendar' }));
    });
    document.querySelectorAll('.tn-share-bg').forEach(button => {
        button.addEventListener('click', () => updateShareCardSetting({ background: button.dataset.shareBg || '#f7f4ef' }));
    });
    document.querySelector('#tavern-notes-share-font')?.addEventListener('input', event => updateShareCardSetting({ fontFamily: event.target.value || 'system-ui' }));
    document.querySelector('#tavern-notes-share-font-import')?.addEventListener('input', event => {
        state.shareCardSettings = {
            ...state.shareCardSettings,
            fontImport: event.target.value || '',
        };
        saveLocalSettings();
    });
    document.querySelector('#tavern-notes-share-show-character')?.addEventListener('change', event => updateShareCardSetting({ showCharacter: event.target.checked }));
    document.querySelector('#tavern-notes-share-show-date')?.addEventListener('change', event => updateShareCardSetting({ showDate: event.target.checked }));
    document.querySelector('#tavern-notes-share-import-font')?.addEventListener('click', () => importShareCardFont().catch(error => notify(error.message, 'error')));
    document.querySelector('#tavern-notes-share-redraw')?.addEventListener('click', () => drawShareCard().catch(error => notify(error.message, 'error')));
    document.querySelector('#tavern-notes-share-download')?.addEventListener('click', () => downloadShareCard().catch(error => notify(error.message, 'error')));
    document.querySelectorAll('#tavern-notes-export-menu .tn-export-choice').forEach(button => {
        button.addEventListener('click', () => exportNotes(button.dataset.format).catch(error => notify(error.message, 'error')));
    });
    document.querySelectorAll('#tavern-notes-export-menu .tn-export-scope-choice').forEach(button => {
        button.addEventListener('click', () => setExportScope(button.dataset.scope || 'all'));
    });
    document.querySelector('#tavern-notes-prev')?.addEventListener('click', () => goToPage(state.page - 1));
    document.querySelector('#tavern-notes-next')?.addEventListener('click', () => goToPage(state.page + 1));
    document.querySelector('#tavern-notes-page-jump')?.addEventListener('click', jumpToInputPage);
    document.querySelector('#tavern-notes-page-input')?.addEventListener('keydown', event => {
        if (event.key === 'Enter') jumpToInputPage();
    });
    document.querySelector('#tavern-notes-theme-export')?.addEventListener('click', exportTheme);
    document.querySelector('#tavern-notes-theme-preview')?.addEventListener('click', previewThemeFromEditor);
    document.querySelector('#tavern-notes-theme-merge-st')?.addEventListener('click', () => {
        mergeCurrentSillyTavernTheme().catch(error => notify(error.message, 'error'));
    });
    document.querySelector('#tavern-notes-theme-save')?.addEventListener('click', () => saveThemeFromEditor().catch(error => notify(error.message, 'error')));
    document.querySelector('#tavern-notes-theme-save-as')?.addEventListener('click', () => saveThemeAsFromEditor().catch(error => notify(error.message, 'error')));
    document.querySelector('#tavern-notes-theme-import')?.addEventListener('click', () => document.querySelector('#tavern-notes-theme-file')?.click());
    document.querySelector('#tavern-notes-theme-open-folder')?.addEventListener('click', () => openThemeFolder().catch(error => notify(error.message, 'error')));
    document.querySelector('#tavern-notes-theme-delete')?.addEventListener('click', () => deleteSelectedTheme().catch(error => notify(error.message, 'error')));
    document.querySelector('#tavern-notes-theme-reset')?.addEventListener('click', () => activateTheme('default').catch(error => notify(error.message, 'error')));
    document.querySelector('#tavern-notes-theme-select')?.addEventListener('change', event => {
        activateTheme(event.target.value).catch(error => notify(error.message, 'error'));
    });
    document.querySelector('#tavern-notes-theme-file')?.addEventListener('change', event => {
        importThemeFile(event).catch(error => notify(error.message, 'error'));
    });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        closeFullNote();
        closeExportMenu();
        closeThemeMenu();
        closeShareCard();
    });
}

async function handleNoteAction(event) {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.classList.contains('tn-character-card')) {
        const id = button.dataset.characterId || null;
        const name = button.dataset.characterName || '未命名角色';
        const character = state.characters.find(item => String(item.id ?? '') === String(id ?? '') && item.name === name)
            || state.characters.find(item => item.name === name)
            || { id, name };
        setCharacterFilter(character);
        return;
    }

    if (button.classList.contains('tn-clear-character')) {
        clearCharacterFilter();
        return;
    }

    const noteGroup = findNoteGroupFromElement(button);
    if (!noteGroup) return;

    if (button.classList.contains('tn-variant-prev') || button.classList.contains('tn-variant-next')) {
        const variants = getNoteVariants(noteGroup);
        const direction = button.classList.contains('tn-variant-prev') ? -1 : 1;
        state.variantIndexByGroup[noteGroup.id] = Math.min(Math.max(getVariantIndex(noteGroup) + direction, 0), variants.length - 1);
        renderNotes();
        return;
    }

    const note = findNoteFromButton(button);
    if (!note) return;

    if (button.classList.contains('tn-expand')) {
        openFullNote(note);
    } else if (button.classList.contains('tn-copy')) {
        await navigator.clipboard.writeText(note.content);
        notify('已复制。', 'success');
    } else if (button.classList.contains('tn-fill')) {
        writeInput(note.content, false);
        closePanel();
        notify('已进入输入栏。', 'success');
    } else if (button.classList.contains('tn-share')) {
        openShareCard(note);
    } else if (button.classList.contains('tn-delete')) {
        const confirmed = await confirmDelete(note);
        if (!confirmed) return;
        await api(`/notes/${encodeURIComponent(note.id)}`, { method: 'DELETE' });
        await refreshNotes();
        notify('已删除。', 'success');
    }
}

function renderPagination(visible = true) {
    const pagination = document.querySelector('.tn-pagination');
    if (pagination) pagination.classList.toggle('tn-hidden', !visible);
    if (!visible) return;

    const maxPage = getMaxPage();
    const label = document.querySelector('#tavern-notes-page-label');
    const input = document.querySelector('#tavern-notes-page-input');
    const prev = document.querySelector('#tavern-notes-prev');
    const next = document.querySelector('#tavern-notes-next');
    if (label) label.textContent = `${state.page} / ${maxPage}`;
    if (input) {
        input.max = String(maxPage);
        input.value = String(state.page);
    }
    if (prev) prev.disabled = state.page <= 1;
    if (next) next.disabled = state.page >= maxPage;
}

function goToPage(page) {
    const maxPage = getMaxPage();
    const nextPage = Math.min(Math.max(Number(page) || 1, 1), maxPage);
    if (nextPage === state.page) return;
    state.page = nextPage;
    refreshNotes();
}

function jumpToInputPage() {
    const input = document.querySelector('#tavern-notes-page-input');
    goToPage(input?.value || 1);
}

function exportFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
}

async function downloadApiFile(path, filename, type) {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: getRequestHeaders(),
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `导出失败：${response.status}`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(type ? new Blob([blob], { type }) : blob);
    exportFile(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadTextFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    exportFile(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toggleExportMenu() {
    const menu = document.querySelector('#tavern-notes-export-menu');
    if (!menu) return;
    setExportScope(state.exportScope);
    menu.classList.toggle('open');
    menu.setAttribute('aria-hidden', menu.classList.contains('open') ? 'false' : 'true');
}

function closeExportMenu() {
    const menu = document.querySelector('#tavern-notes-export-menu');
    menu?.classList.remove('open');
    menu?.setAttribute('aria-hidden', 'true');
}

function setExportScope(scope = 'all') {
    state.exportScope = scope === 'page' ? 'page' : 'all';
    document.querySelectorAll('#tavern-notes-export-menu .tn-export-scope-choice').forEach(button => {
        button.classList.toggle('active', button.dataset.scope === state.exportScope);
    });
}

function toggleThemeMenu() {
    const menu = document.querySelector('#tavern-notes-theme-menu');
    if (!menu) return;
    syncThemeEditor();
    refreshThemeList().catch(() => {});
    menu.classList.toggle('open');
    menu.setAttribute('aria-hidden', menu.classList.contains('open') ? 'false' : 'true');
}

function closeThemeMenu() {
    const menu = document.querySelector('#tavern-notes-theme-menu');
    menu?.classList.remove('open');
    menu?.setAttribute('aria-hidden', 'true');
}

function getExportNote(note) {
    const activeNote = getActiveVariant(note);
    return {
        ...note,
        ...activeNote,
        id: activeNote.id || note.id,
        type: activeNote.type || note.type,
        character: activeNote.character || note.character,
        chat: activeNote.chat || note.chat,
        tags: activeNote.tags || note.tags || [],
        variant: getNoteVariants(note).length > 1 ? {
            groupId: note.id,
            activeIndex: getVariantIndex(note),
            count: getNoteVariants(note).length,
        } : undefined,
    };
}

function buildCurrentPageExport() {
    return {
        ok: true,
        format: 'tavern-notes-export',
        version: 1,
        scope: 'current-page',
        exportedAt: new Date().toISOString(),
        page: state.page,
        pageSize: state.pageSize,
        filter: state.filter,
        query: state.query,
        characterFilter: state.characterFilter,
        totalNotes: state.totalNotes,
        notes: state.notes.map(getExportNote),
    };
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

function buildCurrentPageTxtExport(exportData) {
    return buildPlainTextExport(exportData.notes || []);
}

async function exportNotes(format = 'both') {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const scope = state.exportScope === 'page' ? 'page' : 'all';
    if (scope === 'page') {
        const exportData = buildCurrentPageExport();
        if (!exportData.notes.length) throw new Error('当前页面没有可导出的笔记。');
        if (format === 'json' || format === 'both') {
            downloadTextFile(JSON.stringify(exportData, null, 2), `tavern-notes-current-page-${stamp}.json`, 'application/json;charset=utf-8');
        }
        if (format === 'txt' || format === 'both') {
            downloadTextFile(buildCurrentPageTxtExport(exportData), `tavern-notes-current-page-${stamp}.txt`, 'text/plain;charset=utf-8');
        }
    } else {
        if (format === 'json' || format === 'both') {
            await downloadApiFile('/export.json', `tavern-notes-all-${stamp}.json`, 'application/json;charset=utf-8');
        }
        if (format === 'txt' || format === 'both') {
            await downloadApiFile('/export.txt', `tavern-notes-all-${stamp}.txt`, 'text/plain;charset=utf-8');
        }
    }
    closeExportMenu();
    notify('已开始导出。', 'success');
}

function openShareCard(note) {
    state.shareCardNote = note;
    const menu = document.querySelector('#tavern-notes-share-menu');
    if (!menu) return;
    syncShareCardControls();
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    drawShareCard().catch(error => notify(error.message, 'error'));
}

function closeShareCard() {
    const menu = document.querySelector('#tavern-notes-share-menu');
    menu?.classList.remove('open');
    menu?.setAttribute('aria-hidden', 'true');
}

function syncShareCardControls() {
    const settings = state.shareCardSettings;
    document.querySelectorAll('.tn-share-choice').forEach(button => {
        button.classList.toggle('active', button.dataset.shareTheme === settings.theme);
    });
    document.querySelectorAll('.tn-share-bg').forEach(button => {
        button.classList.toggle('active', button.dataset.shareBg === settings.background);
    });
    const font = document.querySelector('#tavern-notes-share-font');
    const fontImport = document.querySelector('#tavern-notes-share-font-import');
    const showCharacter = document.querySelector('#tavern-notes-share-show-character');
    const showDate = document.querySelector('#tavern-notes-share-show-date');
    if (font) font.value = settings.fontFamily || '';
    if (fontImport) fontImport.value = settings.fontImport || '';
    if (showCharacter) showCharacter.checked = settings.showCharacter;
    if (showDate) showDate.checked = settings.showDate;
    applyShareFontImport();
}

function updateShareCardSetting(next) {
    state.shareCardSettings = {
        ...state.shareCardSettings,
        ...next,
    };
    saveLocalSettings();
    syncShareCardControls();
    drawShareCard().catch(error => notify(error.message, 'error'));
}

async function importShareCardFont() {
    const raw = String(state.shareCardSettings.fontImport || '').trim();
    if (!raw) {
        notify('先粘贴字体地址或 @import 代码。', 'warning');
        return;
    }
    const css = await buildShareFontCss(raw);
    const family = parseShareFontFamilyFromCss(css);
    state.shareCardSettings = {
        ...state.shareCardSettings,
        fontImport: css,
        fontFamily: family || state.shareCardSettings.fontFamily || 'system-ui',
    };
    saveLocalSettings();
    syncShareCardControls();
    await drawShareCard();
    notify(family ? `已导入字体：${family.replaceAll('"', '')}` : '已导入字体代码，请确认字体名。', 'success');
}

function applyShareFontImport() {
    const style = document.querySelector('#tavern-notes-share-font-style');
    if (!style) return;
    const css = normalizeShareFontCss(state.shareCardSettings.fontImport || '');
    if (!css || /<\/?script/i.test(css)) {
        style.textContent = '';
        return;
    }
    style.textContent = css;
}

async function buildShareFontCss(raw) {
    const normalized = normalizeShareFontCss(raw);
    const url = extractShareFontCssUrl(normalized);
    let remoteCss = '';
    if (url) {
        try {
            const response = await fetch(url);
            if (response.ok) remoteCss = await response.text();
        } catch {
            remoteCss = '';
        }
    }
    const family = parseShareFontFamilyFromCss(normalized) || parseShareFontFamilyFromCss(remoteCss);
    return [
        normalized,
        family ? `.tavern-notes-share-font-probe { font-family: ${family}; }` : '',
    ].filter(Boolean).join('\n');
}

function normalizeShareFontCss(value) {
    const text = String(value || '').trim();
    if (/^https?:\/\/\S+$/i.test(text)) return `@import url("${text}");`;
    return text
        .split(/\r?\n/)
        .map(line => {
            const text = line.trim();
            if (/^https?:\/\/\S+$/i.test(text)) return `@import url("${text}");`;
            if (/^@import\b/i.test(text) && !/[;{}]\s*$/.test(text)) return `${text};`;
            return line;
        })
        .join('\n');
}

function extractShareFontCssUrl(css) {
    const importUrl = String(css || '').match(/@import\s+url\((['"]?)(.*?)\1\)/i);
    if (importUrl?.[2]) return importUrl[2].trim();
    const plainUrl = String(css || '').match(/https?:\/\/[^\s'")]+/i);
    return plainUrl?.[0] || '';
}

function shareCardFontStack() {
    const family = String(state.shareCardSettings.fontFamily || parseShareFontFamilyFromCss(state.shareCardSettings.fontImport) || '').trim();
    if (!family || family === 'system-ui') return 'system-ui, "Noto Serif SC", serif';
    return `${family}, "Noto Serif SC", "Microsoft YaHei", serif`;
}

function parseShareFontFamilyFromCss(css) {
    const match = String(css || '').match(/font-family\s*:\s*([^;}\n]+)/i);
    if (!match) return '';
    return match[1].trim();
}

async function waitForShareCardFonts(font) {
    if (!document.fonts) return;
    const timeout = new Promise(resolve => setTimeout(resolve, 900));
    const tasks = [];
    if (document.fonts.load) tasks.push(document.fonts.load(`32px ${font}`, '酒馆笔记分享卡'));
    if (document.fonts.ready) tasks.push(document.fonts.ready);
    await Promise.race([Promise.allSettled(tasks), timeout]);
}

function getShareCardAvatarUrl(note) {
    const url = getCharacterAvatar(note?.character);
    if (url) return url;
    return '';
}

function loadShareCardImage(url) {
    return new Promise(resolve => {
        if (!url) {
            resolve(null);
            return;
        }
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = url;
    });
}

function shareCardDateParts(note) {
    const date = note?.createdAt ? new Date(note.createdAt) : new Date();
    const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const weekday = date.toLocaleDateString('zh-CN', { weekday: 'long' });
    return {
        day: String(date.getDate()),
        month,
        year: String(date.getFullYear()),
        weekday,
        full: date.toLocaleDateString('zh-CN'),
    };
}

function isDarkShareCardColor(color) {
    const hex = String(color || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function wrapCanvasText(ctx, text, maxWidth) {
    const paragraphs = String(text || '').split(/\n+/).map(item => item.trim()).filter(Boolean);
    const lines = [];
    for (const paragraph of paragraphs) {
        let line = '';
        for (const char of Array.from(paragraph)) {
            const test = line + char;
            if (line && ctx.measureText(test).width > maxWidth) {
                lines.push(line);
                line = char;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        lines.push('');
    }
    if (lines[lines.length - 1] === '') lines.pop();
    return lines;
}

function roundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

function drawMultiline(ctx, lines, x, y, lineHeight, maxLines) {
    const visible = maxLines ? lines.slice(0, maxLines) : lines;
    visible.forEach((line, index) => {
        ctx.fillText(line, x, y + index * lineHeight);
    });
    if (maxLines && lines.length > maxLines) {
        ctx.fillText('...', x, y + visible.length * lineHeight);
    }
}

function drawCircleImage(ctx, image, x, y, size) {
    ctx.save();
    roundedRectPath(ctx, x, y, size, size, size / 2);
    ctx.clip();
    const scale = Math.max(size / image.width, size / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    ctx.drawImage(image, x + (size - drawW) / 2, y + (size - drawH) / 2, drawW, drawH);
    ctx.restore();
}

async function drawShareCard() {
    const canvas = document.querySelector('#tavern-notes-share-canvas');
    const note = state.shareCardNote;
    if (!canvas || !note) return;

    applyShareFontImport();
    const font = shareCardFontStack();
    await waitForShareCardFonts(font);
    const avatar = await loadShareCardImage(getShareCardAvatarUrl(note));

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const settings = state.shareCardSettings;
    const background = settings.background || '#f7f4ef';
    const themeId = settings.theme || 'calendar';
    const darkBackground = isDarkShareCardColor(background);
    const themeStyles = {
        calendar: {
            title: 'calendar',
            text: settings.textColor || (darkBackground ? '#f6f3ed' : '#211d19'),
            muted: darkBackground ? 'rgba(246,243,237,0.62)' : 'rgba(33,29,25,0.58)',
            accent: darkBackground ? 'rgba(246,243,237,0.46)' : 'rgba(33,29,25,0.32)',
            weight: 700,
            lineHeight: 68,
        },
        classic: {
            title: 'classic',
            text: settings.textColor || (darkBackground ? '#fbf4dc' : '#2d2418'),
            muted: darkBackground ? 'rgba(251,244,220,0.64)' : 'rgba(83,69,49,0.62)',
            accent: darkBackground ? 'rgba(221,196,139,0.76)' : 'rgba(122,91,42,0.38)',
            weight: 600,
            lineHeight: 66,
        },
        ink: {
            title: 'ink',
            text: settings.textColor || (darkBackground ? '#f4f4f2' : '#151515'),
            muted: darkBackground ? 'rgba(244,244,242,0.58)' : 'rgba(21,21,21,0.46)',
            accent: darkBackground ? 'rgba(244,244,242,0.32)' : 'rgba(21,21,21,0.18)',
            weight: 400,
            lineHeight: 72,
        },
    };
    const themeStyle = themeStyles[themeId] || themeStyles.calendar;
    const textColor = themeStyle.text;
    const muted = themeStyle.muted;
    const dates = shareCardDateParts(note);
    const character = note.character?.name || '未命名角色';
    const content = String(note.content || '').trim();

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const contentColor = textColor;
    const contentMuted = muted;
    const left = 126;
    const right = width - 126;
    const maxTextWidth = right - left;
    let y = 180;

    ctx.textAlign = 'center';
    ctx.fillStyle = contentColor;

    if (themeId === 'calendar') {
        if (settings.showDate) {
            ctx.font = `800 164px ${font}`;
            ctx.fillText(dates.day, width / 2, y + 48);
            ctx.font = `800 44px ${font}`;
            ctx.fillText(`${dates.month} ${dates.year}`, width / 2, y + 140);
            ctx.font = `400 27px ${font}`;
            ctx.fillStyle = contentMuted;
            ctx.fillText(dates.weekday, width / 2, y + 196);
            ctx.strokeStyle = contentMuted;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 56, y + 275);
            ctx.lineTo(width / 2 + 56, y + 275);
            ctx.stroke();
            y += 360;
        }
    } else if (themeId === 'classic') {
        ctx.font = `800 40px ${font}`;
        ctx.fillStyle = contentColor;
        ctx.fillText('TAVERN NOTES', width / 2, y);
        ctx.font = `400 22px ${font}`;
        ctx.fillStyle = contentMuted;
        ctx.fillText('selected excerpt', width / 2, y + 42);
        ctx.strokeStyle = themeStyle.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 62, y + 82);
        ctx.lineTo(width / 2 + 62, y + 82);
        ctx.stroke();
        y += 154;
    } else {
        ctx.font = `300 28px ${font}`;
        ctx.fillStyle = contentMuted;
        ctx.fillText('TAVERN NOTES', width / 2, y - 28);
        ctx.font = `700 108px ${font}`;
        ctx.fillStyle = contentColor;
        ctx.fillText('“', width / 2, y + 42);
        y += 150;
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = contentColor;
    ctx.font = `${themeId === 'ink' ? 500 : 800} 36px ${font}`;
    if (settings.showCharacter) {
        ctx.fillText(themeId === 'ink' ? character : `《${character}》`, left, y);
        y += 76;
    }

    ctx.font = `${themeStyle.weight} 34px ${font}`;
    const lines = wrapCanvasText(ctx, content, maxTextWidth);
    drawMultiline(ctx, lines, left, y, themeStyle.lineHeight, 11);

    const footerY = height - 112;
    const avatarSize = 58;
    if (avatar) {
        drawCircleImage(ctx, avatar, right - avatarSize, footerY - avatarSize + 18, avatarSize);
    } else {
        ctx.save();
        roundedRectPath(ctx, right - avatarSize, footerY - avatarSize + 18, avatarSize, avatarSize, avatarSize / 2);
        ctx.fillStyle = darkBackground ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.08)';
        ctx.fill();
        ctx.fillStyle = contentMuted;
        ctx.font = `700 26px ${font}`;
        ctx.textAlign = 'center';
        ctx.fillText(getCharacterInitial(character), right - avatarSize / 2, footerY - 2);
        ctx.restore();
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = contentMuted;
    ctx.font = `400 22px ${font}`;
    ctx.fillText('来自酒馆笔记', right - avatarSize - 18, footerY);
}

async function downloadShareCard() {
    await drawShareCard();
    const canvas = document.querySelector('#tavern-notes-share-canvas');
    const note = state.shareCardNote;
    if (!canvas || !note) throw new Error('没有可导出的分享卡。');
    const stamp = new Date().toISOString().slice(0, 10);
    const character = (note.character?.name || '未命名角色').replace(/[\\/:*?"<>|]/g, '_');
    canvas.toBlob(blob => {
        if (!blob) {
            notify('生成图片失败。', 'error');
            return;
        }
        const url = URL.createObjectURL(blob);
        exportFile(url, `酒馆笔记分享卡-${character}-${stamp}.png`);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        notify('已导出分享卡。', 'success');
    }, 'image/png');
}

async function confirmDelete(note) {
    const preview = String(note.content || '').slice(0, 40).replace(/\s+/g, ' ');
    return window.confirm(`确定删除这条笔记吗？\n\n${preview}${note.content.length > 40 ? '...' : ''}`);
}

function openFullNote(note) {
    const modal = document.querySelector('#tavern-notes-modal');
    if (!modal) return;
    modal.querySelector('.tn-modal-kicker').textContent = `${noteTypeLabel(note.type)} · ${note.character?.name || '未命名角色'}`;
    modal.querySelector('.tn-modal-title').textContent = note.createdAt ? new Date(note.createdAt).toLocaleString() : '全文';
    modal.querySelector('.tn-modal-content').innerHTML = renderQuotedText(note.content);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeFullNote() {
    const modal = document.querySelector('#tavern-notes-modal');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden', 'true');
}

function normalizeTheme(theme) {
    return {
        ...DEFAULT_THEME,
        ...(theme || {}),
        variables: {
            ...DEFAULT_THEME.variables,
            ...(theme?.variables || {}),
        },
        assets: {
            ...DEFAULT_THEME.assets,
            ...(theme?.assets || {}),
        },
    };
}

function paintTheme(theme) {
    const clean = normalizeTheme(theme);
    const panel = document.querySelector('#tavern-notes-panel');
    if (panel) {
        Object.entries(clean.variables).forEach(([key, value]) => {
            if (key.startsWith('--tn-')) panel.style.setProperty(key, String(value));
        });
        const flavor = String(clean.variables['--tn-theme-flavor'] || '').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
        if (flavor) panel.dataset.themeFlavor = flavor;
        else delete panel.dataset.themeFlavor;
        if (clean.assets.backgroundImage) {
            const image = String(clean.assets.backgroundImage).trim();
            const cssImage = /^(url|linear-gradient|radial-gradient|conic-gradient)\(/i.test(image) ? image : `url("${image}")`;
            panel.style.setProperty('--tn-background-image', cssImage);
        } else {
            panel.style.removeProperty('--tn-background-image');
        }
    }
    updateThemeIcons(clean);
    return clean;
}

function applyTheme(theme) {
    const clean = paintTheme(theme);
    state.theme = clean;
    document.querySelector('.tn-theme-name')?.replaceChildren(document.createTextNode(`当前：${clean.name || '未命名主题'}`));
    syncThemeEditor(clean);
}

function renderThemeSelect() {
    const select = document.querySelector('#tavern-notes-theme-select');
    if (!select) return;
    const themes = state.themes?.length ? state.themes : [{ id: 'default', name: 'Soft Neomorphism' }];
    select.replaceChildren(...themes.map(theme => {
        const option = document.createElement('option');
        option.value = theme.id;
        option.textContent = theme.author ? `${theme.name} · ${theme.author}` : theme.name;
        return option;
    }));
    select.value = state.activeThemeId || 'default';
}

function syncThemeEditor(theme = state.theme || DEFAULT_THEME) {
    const clean = normalizeTheme(theme);
    const nameInput = document.querySelector('#tavern-notes-theme-name-input');
    const code = document.querySelector('#tavern-notes-theme-code');
    if (nameInput) nameInput.value = clean.name || '';
    if (code) code.value = JSON.stringify(clean, null, 2);
}

function getThemeFromEditor() {
    const code = document.querySelector('#tavern-notes-theme-code');
    const nameInput = document.querySelector('#tavern-notes-theme-name-input');
    const theme = JSON.parse(code?.value || '{}');
    if (nameInput?.value?.trim()) theme.name = nameInput.value.trim();
    if (theme.format && theme.format !== 'tavern-notes-theme') throw new Error('这不是酒馆笔记主题文件。');
    return normalizeTheme(theme);
}

function firstElement(selectors) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

function styleOf(selectors) {
    const element = Array.isArray(selectors) ? firstElement(selectors) : document.querySelector(selectors);
    return element ? getComputedStyle(element) : null;
}

function usefulColor(value) {
    if (!value || value === 'transparent') return '';
    const text = String(value).trim();
    if (/^\d+(\.\d+)?\s*,\s*\d+(\.\d+)?\s*,\s*\d+(\.\d+)?/.test(text)) return `rgb(${text})`;
    if (/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(value)) return '';
    return text;
}

function cssVar(styles, name) {
    return usefulColor(styles?.getPropertyValue(name)?.trim());
}

function parseRgb(value) {
    const text = String(value || '').trim();
    const rgb = text.match(/rgba?\(([^)]+)\)/i);
    if (rgb) {
        const parts = rgb[1].split(',').map(part => Number.parseFloat(part));
        if (parts.length >= 3) return parts.slice(0, 3);
    }
    const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
        const raw = hex[1].length === 3 ? hex[1].split('').map(char => char + char).join('') : hex[1];
        return [0, 2, 4].map(index => Number.parseInt(raw.slice(index, index + 2), 16));
    }
    return null;
}

function toOpaqueColor(value, fallback = '#111522') {
    const rgb = parseRgb(value);
    if (!rgb) return fallback;
    return `rgb(${rgb.map(channel => Math.max(0, Math.min(255, Math.round(channel)))).join(', ')})`;
}

function isDarkColor(value) {
    const rgb = parseRgb(value);
    if (!rgb) return false;
    const [r, g, b] = rgb.map(channel => {
        const normalized = channel / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 0.35;
}

function pickStyleValue(styles, property, fallback = '') {
    for (const style of styles) {
        const value = usefulColor(style?.getPropertyValue(property)?.trim());
        if (value) return value;
    }
    return fallback;
}

function pickBackgroundColor(styles, fallback = DEFAULT_THEME.variables['--tn-paper']) {
    return pickStyleValue(styles, 'background-color', fallback);
}

function pickBackgroundImage(styles, fallback = '') {
    const image = pickStyleValue(styles, 'background-image', fallback);
    return image === 'none' ? fallback : image;
}

function colorMix(color, alpha = 0.3) {
    const value = usefulColor(color);
    if (!value) return `rgba(156, 151, 139, ${alpha})`;
    if (value.startsWith('rgb(')) return value.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    if (value.startsWith('rgba(')) return value.replace(/,\s*[\d.]+\)$/, `, ${alpha})`);
    return value;
}

function shadowColor(value, fallbackColor) {
    const shadow = String(value || '');
    const rgba = shadow.match(/rgba?\([^)]+\)/i)?.[0];
    return colorMix(rgba || fallbackColor, 0.38);
}

function getSillyTavernThemeName() {
    const select = document.querySelector('#themes');
    const selected = select?.selectedOptions?.[0];
    const name = selected?.textContent?.trim() || select?.value?.trim() || '';
    return name || '当前酒馆主题';
}

function extractCurrentSillyTavernTheme() {
    const body = getComputedStyle(document.body);
    const root = getComputedStyle(document.documentElement);
    const chatBlock = styleOf(['.mes', '.mes_block', '#chat .mes']);
    const chatText = styleOf(['.mes_text', '.mes .mes_text', '#chat']);
    const input = styleOf(['#send_textarea', '#send_form textarea', '#send_form']);
    const menu = styleOf(['#user-settings-block', '#left-nav-panel', '.drawer-content', '.popup']);
    const button = styleOf(['.menu_button', '.qr--button', '#send_but']);
    const active = styleOf(['.selected', '.active', '.mes.selected', '.menu_button:hover']);
    const styles = [chatBlock, input, menu, body, root].filter(Boolean);
    const textStyles = [chatText, input, menu, body, root].filter(Boolean);
    const bodyText = toOpaqueColor(cssVar(root, '--SmartThemeBodyColor') || pickStyleValue(textStyles, 'color', DEFAULT_THEME.variables['--tn-ink']), DEFAULT_THEME.variables['--tn-ink']);
    const border = toOpaqueColor(cssVar(root, '--SmartThemeBorderColor') || pickStyleValue([input, button, menu, root], 'border-color', DEFAULT_THEME.variables['--tn-line']), DEFAULT_THEME.variables['--tn-line']);
    const quote = toOpaqueColor(cssVar(root, '--SmartThemeQuoteColor') || pickStyleValue([active, button, root, body], 'color', DEFAULT_THEME.variables['--tn-gold']), DEFAULT_THEME.variables['--tn-gold']);
    const em = toOpaqueColor(cssVar(root, '--SmartThemeEmColor') || bodyText, bodyText);
    const underline = toOpaqueColor(cssVar(root, '--SmartThemeUnderlineColor') || quote, quote);
    const userTint = toOpaqueColor(cssVar(root, '--SmartThemeUserMesBlurTintColor') || quote, quote);
    const chatTint = cssVar(root, '--SmartThemeChatTintColor') || cssVar(root, '--SmartThemeBlurTintColor');
    const uiBackground = cssVar(root, '--SmartThemeBlurTintColor') || cssVar(root, '--SmartThemeChatTintColor');
    const panelBackground = uiBackground || pickBackgroundColor([menu, input, body, root], DEFAULT_THEME.variables['--tn-paper']);
    const cardBackground = chatTint || uiBackground || pickBackgroundColor([chatBlock, input, menu, body], DEFAULT_THEME.variables['--tn-paper-2']);
    const botTint = toOpaqueColor(cssVar(root, '--SmartThemeBotMesBlurTintColor') || cardBackground || quote, quote);
    const panelSolid = toOpaqueColor(panelBackground, DEFAULT_THEME.variables['--tn-paper']);
    const cardSolid = toOpaqueColor(cardBackground, panelSolid);
    const inputSolid = toOpaqueColor(pickBackgroundColor([input, menu, body], panelSolid), panelSolid);
    const shadow = pickStyleValue([chatBlock, input, button, menu], 'box-shadow', '');
    const isDark = isDarkColor(panelBackground) || isDarkColor(cardBackground);
    const lightGlow = isDark ? colorMix(quote, 0.18) : 'rgba(255, 255, 255, 0.76)';
    const textShadow = usefulColor(cssVar(root, '--SmartThemeShadowColor')) || 'transparent';
    const themeShadow = toOpaqueColor(cssVar(root, '--SmartThemeShadowColor') || shadowColor(shadow, '#000000'), '#000000');
    const muted = `color-mix(in srgb, ${bodyText} ${isDark ? '68%' : '62%'}, ${panelSolid} ${isDark ? '32%' : '38%'})`;
    const softBorder = `color-mix(in srgb, ${border} ${isDark ? '82%' : '52%'}, transparent)`;
    const glow = `color-mix(in srgb, ${quote} ${isDark ? '16%' : '24%'}, transparent)`;
    const darkShadow = isDark
        ? colorMix(themeShadow, 0.5)
        : shadowColor(shadow, pickStyleValue(styles, 'color', '#4c4a44'));
    const buttonBase = isDark
        ? `color-mix(in srgb, ${cardSolid} 88%, ${border} 12%)`
        : `color-mix(in srgb, ${inputSolid} 84%, white 16%)`;
    const darkButton = `color-mix(in srgb, ${cardSolid} 90%, black 10%)`;
    const darkButtonHover = `color-mix(in srgb, ${quote} 16%, ${darkButton} 84%)`;
    const darkButtonShadow = `0 0 0 1px ${softBorder}, 0 3px 10px ${colorMix(themeShadow, 0.42)}, inset 0 1px 0 color-mix(in srgb, ${bodyText} 12%, transparent)`;
    const darkIconBg = `linear-gradient(145deg, color-mix(in srgb, ${quote} 8%, ${darkButton} 92%), color-mix(in srgb, ${darkButton} 84%, black 16%))`;
    const darkIconShadow = `0 0 0 1px color-mix(in srgb, ${border} 68%, transparent), 0 2px 6px ${colorMix(themeShadow, 0.34)}, inset 0 1px 0 color-mix(in srgb, ${bodyText} 12%, transparent)`;
    const paperLift = isDark
        ? `color-mix(in srgb, ${panelSolid} 92%, black 8%)`
        : `color-mix(in srgb, ${panelSolid} 94%, white 6%)`;
    const cardLift = isDark
        ? `color-mix(in srgb, ${cardSolid} 94%, black 6%)`
        : `color-mix(in srgb, ${cardSolid} 90%, white 10%)`;
    const themeName = getSillyTavernThemeName();

    const theme = normalizeTheme({
        name: `融合酒馆主题 - ${themeName}`,
        author: 'Tavern Notes',
        variables: {
            '--tn-paper': panelSolid,
            '--tn-paper-2': cardSolid,
            '--tn-ink': bodyText,
            '--tn-muted': muted,
            '--tn-line': softBorder,
            '--tn-gold': quote,
            '--tn-gold-2': quote,
            '--tn-em': em,
            '--tn-underline': underline,
            '--tn-quote': quote,
            '--tn-text-shadow': textShadow,
            '--tn-panel-glow': glow,
            '--tn-scrollbar-thumb': quote,
            '--tn-scrollbar-track': `color-mix(in srgb, ${border} 24%, ${panelSolid} 76%)`,
            '--tn-mini-button-bg': `linear-gradient(145deg, ${buttonBase}, ${paperLift})`,
            '--tn-mini-button-shadow': isDark
                ? darkButtonShadow
                : DEFAULT_THEME.variables['--tn-mini-button-shadow'],
            '--tn-mini-button-hover-bg': `linear-gradient(145deg, color-mix(in srgb, ${quote} ${isDark ? '24%' : '28%'}, ${buttonBase}), ${buttonBase})`,
            '--tn-mini-button-hover-shadow': isDark
                ? `0 0 0 1px color-mix(in srgb, ${quote} 42%, transparent), 0 4px 12px ${colorMix(themeShadow, 0.42)}, inset 0 1px 0 color-mix(in srgb, ${bodyText} 16%, transparent)`
                : DEFAULT_THEME.variables['--tn-mini-button-hover-shadow'],
            '--tn-filter-hover-shadow': isDark
                ? `0 0 0 1px color-mix(in srgb, ${border} 70%, transparent), 0 5px 13px ${colorMix(themeShadow, 0.36)}`
                : DEFAULT_THEME.variables['--tn-filter-hover-shadow'],
            '--tn-filter-icon-border': isDark ? `color-mix(in srgb, ${border} 72%, transparent)` : DEFAULT_THEME.variables['--tn-filter-icon-border'],
            '--tn-filter-icon-shadow': isDark ? darkIconShadow : DEFAULT_THEME.variables['--tn-filter-icon-shadow'],
            '--tn-inline-action-bg': isDark ? darkButton : DEFAULT_THEME.variables['--tn-inline-action-bg'],
            '--tn-inline-action-hover-bg': isDark ? darkButtonHover : DEFAULT_THEME.variables['--tn-inline-action-hover-bg'],
            '--tn-inline-action-shadow': isDark ? 'none' : DEFAULT_THEME.variables['--tn-inline-action-shadow'],
            '--tn-inline-action-hover-shadow': isDark
                ? `inset 0 0 0 1px color-mix(in srgb, ${quote} 36%, transparent), inset 0 1px 0 color-mix(in srgb, ${bodyText} 12%, transparent)`
                : DEFAULT_THEME.variables['--tn-inline-action-hover-shadow'],
            '--tn-inline-icon-bg': isDark ? darkIconBg : DEFAULT_THEME.variables['--tn-inline-icon-bg'],
            '--tn-inline-icon-hover-bg': isDark ? `linear-gradient(145deg, color-mix(in srgb, ${quote} 22%, ${darkButton} 78%), ${darkButton})` : DEFAULT_THEME.variables['--tn-inline-icon-hover-bg'],
            '--tn-inline-icon-shadow': isDark ? darkIconShadow : DEFAULT_THEME.variables['--tn-inline-icon-shadow'],
            '--tn-shadow-dark': darkShadow,
            '--tn-shadow-light': lightGlow,
            '--tn-radius-panel': '24px',
            '--tn-radius-card': isDark ? '13px' : DEFAULT_THEME.variables['--tn-radius-card'],
            '--tn-panel-border': border,
            '--tn-control-bg': `linear-gradient(145deg, ${buttonBase}, ${paperLift})`,
            '--tn-control-bg-hover': `linear-gradient(145deg, color-mix(in srgb, ${quote} ${isDark ? '22%' : '30%'}, ${buttonBase}), ${buttonBase})`,
            '--tn-control-inset-bg': `linear-gradient(145deg, color-mix(in srgb, ${panelSolid} ${isDark ? '90%' : '88%'}, ${isDark ? 'black' : 'white'} ${isDark ? '10%' : '12%'}), color-mix(in srgb, ${cardSolid} ${isDark ? '86%' : '88%'}, ${isDark ? 'black' : 'white'} ${isDark ? '14%' : '12%'}))`,
            '--tn-control-inset-shadow': isDark
                ? `inset 0 0 0 1px color-mix(in srgb, ${border} 54%, transparent), inset 0 8px 16px ${colorMix(themeShadow, 0.36)}`
                : DEFAULT_THEME.variables['--tn-control-inset-shadow'],
            '--tn-card-bg': `linear-gradient(145deg, ${cardLift}, ${paperLift})`,
            '--tn-card-bg-active': `linear-gradient(145deg, color-mix(in srgb, ${quote} ${isDark ? '18%' : '24%'}, ${cardLift}), ${cardLift})`,
            '--tn-card-active-shadow': isDark
                ? `inset 0 0 0 1px color-mix(in srgb, ${quote} 28%, transparent), inset 0 8px 14px ${colorMix(themeShadow, 0.3)}`
                : DEFAULT_THEME.variables['--tn-card-active-shadow'],
            '--tn-icon-bg': isDark ? darkIconBg : `linear-gradient(145deg, color-mix(in srgb, ${quote} 16%, ${buttonBase}), ${paperLift})`,
            '--tn-action-bg': `linear-gradient(145deg, ${paperLift}, ${cardLift})`,
            '--tn-overlay-bg': `color-mix(in srgb, ${panelSolid} 94%, ${isDark ? 'black' : 'white'} 6%)`,
            '--tn-fade-bg': `linear-gradient(90deg, color-mix(in srgb, ${cardSolid} 0%, transparent), ${cardSolid} 34%, color-mix(in srgb, ${quote} ${isDark ? '34%' : '18%'}, ${cardSolid}))`,
            '--tn-card-image': 'linear-gradient(transparent, transparent)',
            '--tn-note-bg': `linear-gradient(145deg, ${paperLift}, ${cardLift})`,
            '--tn-note-border': `1px solid ${softBorder}`,
            '--tn-note-shadow': isDark
                ? `0 0 0 1px color-mix(in srgb, ${quote} 18%, transparent), 0 8px 24px ${colorMix(themeShadow, 0.5)}`
                : DEFAULT_THEME.variables['--tn-note-shadow'],
            '--tn-note-type-bg': isDark
                ? `linear-gradient(145deg, color-mix(in srgb, ${userTint} 62%, ${quote} 38%), color-mix(in srgb, ${userTint} 72%, black 28%))`
                : `linear-gradient(145deg, color-mix(in srgb, ${userTint} 34%, white 66%), color-mix(in srgb, ${quote} 18%, white 82%))`,
            '--tn-note-type-color': isDark
                ? `color-mix(in srgb, ${bodyText} 82%, ${userTint} 18%)`
                : `color-mix(in srgb, ${quote} 82%, black 18%)`,
            '--tn-note-type-user-bg': isDark
                ? `linear-gradient(145deg, color-mix(in srgb, ${userTint} 58%, ${cardSolid} 42%), color-mix(in srgb, ${userTint} 28%, ${panelSolid} 72%))`
                : `linear-gradient(145deg, color-mix(in srgb, ${userTint} 32%, white 68%), color-mix(in srgb, ${quote} 16%, white 84%))`,
            '--tn-note-type-user-color': isDark
                ? `color-mix(in srgb, ${bodyText} 88%, ${userTint} 12%)`
                : `color-mix(in srgb, ${quote} 78%, black 22%)`,
            '--tn-note-type-excerpt-bg': isDark
                ? `linear-gradient(145deg, color-mix(in srgb, ${botTint} 52%, ${cardSolid} 48%), color-mix(in srgb, ${botTint} 22%, ${panelSolid} 78%))`
                : `linear-gradient(145deg, color-mix(in srgb, ${botTint} 32%, white 68%), color-mix(in srgb, ${border} 16%, white 84%))`,
            '--tn-note-type-excerpt-color': isDark
                ? `color-mix(in srgb, ${bodyText} 84%, ${botTint} 16%)`
                : `color-mix(in srgb, ${border} 76%, black 24%)`,
            '--tn-note-accent-user': userTint,
            '--tn-note-accent-excerpt': botTint,
            '--tn-note-padding': isDark ? '15px 17px 15px' : DEFAULT_THEME.variables['--tn-note-padding'],
            '--tn-note-topline-bg': isDark
                ? `linear-gradient(135deg, color-mix(in srgb, ${userTint} 12%, ${cardSolid} 88%), color-mix(in srgb, ${botTint} 8%, ${panelSolid} 92%))`
                : DEFAULT_THEME.variables['--tn-note-topline-bg'],
            '--tn-note-topline-border': isDark ? `1px solid ${softBorder}` : DEFAULT_THEME.variables['--tn-note-topline-border'],
            '--tn-note-topline-padding': isDark ? '8px 12px' : DEFAULT_THEME.variables['--tn-note-topline-padding'],
            '--tn-note-topline-radius': isDark ? '10px' : DEFAULT_THEME.variables['--tn-note-topline-radius'],
            '--tn-note-topline-margin': isDark ? '0 0 13px 0' : DEFAULT_THEME.variables['--tn-note-topline-margin'],
            '--tn-note-dot-display': isDark ? 'none' : DEFAULT_THEME.variables['--tn-note-dot-display'],
            '--tn-filter-shadow': isDark
                ? `0 0 0 1px ${softBorder}, 0 6px 16px ${colorMix(themeShadow, 0.38)}`
                : DEFAULT_THEME.variables['--tn-filter-shadow'],
            '--tn-control-shadow': isDark
                ? `0 0 0 1px ${softBorder}, 0 5px 14px ${colorMix(themeShadow, 0.38)}`
                : DEFAULT_THEME.variables['--tn-control-shadow'],
            '--tn-inset-light': isDark ? `color-mix(in srgb, ${quote} 16%, transparent)` : DEFAULT_THEME.variables['--tn-inset-light'],
            '--tn-font-family': DEFAULT_THEME.variables['--tn-font-family'],
        },
        assets: {
            ...DEFAULT_THEME.assets,
            backgroundImage: '',
        },
    });
    return theme;
}

function previewThemeFromEditor() {
    const theme = paintTheme(getThemeFromEditor());
    document.querySelector('.tn-theme-name')?.replaceChildren(document.createTextNode(`预览：${theme.name || '未命名主题'}`));
    notify('已预览主题，还没有保存。', 'success');
}

async function mergeCurrentSillyTavernTheme() {
    const theme = extractCurrentSillyTavernTheme();
    const stamp = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).replace(/[\/:\s]/g, '-');
    theme.name = `${theme.name} - ${stamp}`;
    state.themeDraft = true;
    syncThemeEditor(theme);
    paintTheme(theme);
    document.querySelector('.tn-theme-name')?.replaceChildren(document.createTextNode(`临时融合：${theme.name}`));
    notify('已生成临时融合预览；点“保存”或“另存为”才会生成主题文件。', 'success');
}

function askThemeName(theme, actionLabel) {
    const currentName = theme?.name || document.querySelector('#tavern-notes-theme-name-input')?.value || '未命名主题';
    const nextName = window.prompt(`${actionLabel}主题名称：`, currentName);
    if (nextName === null) return null;
    const cleanName = nextName.trim();
    if (!cleanName) {
        notify('主题名称不能为空。', 'warning');
        return null;
    }
    return cleanName;
}

async function saveThemeFromEditor() {
    const theme = getThemeFromEditor();
    const shouldSaveAs = state.themeDraft || !state.activeThemeId || state.activeThemeId === 'default';
    const name = askThemeName(theme, shouldSaveAs ? '另存为' : '保存');
    if (!name) return;
    theme.name = name;
    syncThemeEditor(theme);
    if (shouldSaveAs) {
        const data = await saveTheme(theme, null);
        state.activeThemeId = data.id || state.activeThemeId;
        state.themeDraft = false;
        notify('已另存为新主题。', 'success');
        return;
    }
    await saveTheme(theme, state.activeThemeId);
    state.themeDraft = false;
    notify('主题已保存。', 'success');
}

async function saveThemeAsFromEditor() {
    const theme = getThemeFromEditor();
    const name = askThemeName(theme, '另存为');
    if (!name) return;
    theme.name = name;
    syncThemeEditor(theme);
    const data = await saveTheme(theme, null);
    state.activeThemeId = data.id || state.activeThemeId;
    state.themeDraft = false;
    notify('已另存为新主题。', 'success');
}

function updateIconElement(element, iconName, extraClass = '') {
    if (!element || !iconName) return;
    element.className = `fa-solid ${String(iconName).replace(/[^a-z0-9-]/gi, '')} ${extraClass}`.trim();
}

function updateThemeIcons(theme = state.theme) {
    const assets = normalizeTheme(theme).assets;
    updateIconElement(document.querySelector('.tn-brand-mark i'), assets.brandIcon);
    updateIconElement(document.querySelector('#tavern-notes-open i'), assets.openIcon, 'qr--button-icon');
    updateIconElement(document.querySelector('#tavern-notes-capture i'), assets.captureIcon, 'qr--button-icon');
}

async function loadTheme() {
    try {
        await refreshThemeList();
    } catch {
        try {
            const data = await api('/theme');
            state.activeThemeId = data.activeId || 'default';
            state.themeDraft = false;
            applyTheme(data.theme || DEFAULT_THEME);
            renderThemeSelect();
        } catch {
            state.themeDraft = false;
            applyTheme(DEFAULT_THEME);
        }
    }
}

async function refreshThemeList() {
    const data = await api('/themes');
    state.themes = data.themes || [];
    state.activeThemeId = data.activeId || 'default';
    state.themeDraft = false;
    renderThemeSelect();
    applyTheme(data.activeTheme || DEFAULT_THEME);
}

async function activateTheme(id) {
    const data = await api(`/themes/${encodeURIComponent(id || 'default')}/activate`, { method: 'POST' });
    state.themes = data.themes || state.themes;
    state.activeThemeId = data.activeId || data.id || id || 'default';
    state.themeDraft = false;
    renderThemeSelect();
    applyTheme(data.theme || DEFAULT_THEME);
    notify('主题已切换。', 'success');
}

async function saveTheme(theme, id = state.activeThemeId) {
    const clean = normalizeTheme(theme);
    const data = await api('/themes', {
        method: 'POST',
        body: JSON.stringify({ theme: clean, id: id === 'default' ? null : id, activate: true }),
    });
    state.themes = data.themes || state.themes;
    state.activeThemeId = data.activeId || data.id || state.activeThemeId || 'default';
    state.themeDraft = false;
    renderThemeSelect();
    applyTheme(data.theme || clean);
    return data;
}

function exportTheme() {
    const theme = getThemeFromEditor();
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const safeName = String(theme.name || '未命名主题').replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
    exportFile(url, `酒馆笔记主题-${safeName}-${Date.now()}.json`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importThemeFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    const theme = JSON.parse(text);
    if (theme.format && theme.format !== 'tavern-notes-theme') throw new Error('这不是酒馆笔记主题文件。');
    await saveTheme(theme, null);
    notify('主题已导入并切换。', 'success');
}

async function openThemeFolder() {
    await api('/themes/folder/open', { method: 'POST' });
    notify('已请求打开主题文件夹。默认主题是内嵌的，不在这个文件夹里。', 'success');
}

async function deleteSelectedTheme() {
    const id = document.querySelector('#tavern-notes-theme-select')?.value || state.activeThemeId;
    if (!id || id === 'default') {
        notify('默认主题不能删除。', 'warning');
        return;
    }
    const selected = state.themes.find(theme => theme.id === id);
    if (!window.confirm(`确定删除主题“${selected?.name || id}”吗？`)) return;
    const data = await api(`/themes/${encodeURIComponent(id)}`, { method: 'DELETE' });
    state.themes = data.themes || [];
    state.activeThemeId = data.activeId || 'default';
    state.themeDraft = false;
    renderThemeSelect();
    applyTheme(data.theme || state.theme || DEFAULT_THEME);
    notify('主题已删除。', 'success');
}

function getChatScroller() {
    const chatMessages = document.querySelector('#chat .mes')?.parentElement;
    const candidates = [
        document.querySelector('#chat'),
        document.querySelector('#chat_container'),
        chatMessages,
        document.scrollingElement,
    ].filter(Boolean);

    return candidates.find(element => element.scrollHeight > element.clientHeight + 20) || document.scrollingElement;
}

function pageDownChat() {
    const scroller = getChatScroller();
    if (!scroller) return;
    const distance = Math.max(Math.floor(scroller.clientHeight * 0.86), 360);
    scroller.scrollBy({ top: distance, behavior: 'smooth' });
}

function addInputToolbar() {
    document.querySelector('#rightSendForm > #tavern-notes-open')?.remove();
    document.querySelector('#rightSendForm > #tavern-notes-capture')?.remove();
    document.querySelector('#rightSendForm > #tavern-notes-page-down')?.remove();

    const qrBar = document.querySelector('#qr--bar');
    const target = document.querySelector('#qr--bar > .qr--buttons') || qrBar;
    if (!target) {
        setTimeout(addInputToolbar, 800);
        return;
    }

    const existingOpen = document.querySelector('#tavern-notes-open');
    const existingCapture = document.querySelector('#tavern-notes-capture');
    const existingPageDown = document.querySelector('#tavern-notes-page-down');
    if (existingOpen && existingCapture && Boolean(existingPageDown) === state.showPageDownButton) {
        updatePageDownSettingButton();
        return;
    }

    document.querySelector('#tavern-notes-open')?.remove();
    document.querySelector('#tavern-notes-capture')?.remove();
    document.querySelector('#tavern-notes-page-down')?.remove();

    const openButton = document.createElement('div');
    openButton.id = 'tavern-notes-open';
    openButton.className = 'qr--button tavern-notes-qr-button interactable';
    openButton.title = '打开酒馆笔记';
    openButton.tabIndex = 0;
    openButton.innerHTML = '<i class="fa-solid fa-book-open qr--button-icon"></i><span class="qr--hidden">酒馆笔记</span>';

    const captureButton = document.createElement('div');
    captureButton.id = 'tavern-notes-capture';
    captureButton.className = 'qr--button tavern-notes-qr-button interactable';
    captureButton.title = '摘录选中的聊天文字';
    captureButton.tabIndex = 0;
    captureButton.innerHTML = '<i class="fa-solid fa-highlighter qr--button-icon"></i><span class="qr--hidden">摘录选中</span>';

    const buttons = [openButton, captureButton];
    let pageDownButton = null;
    if (state.showPageDownButton) {
        pageDownButton = document.createElement('div');
        pageDownButton.id = 'tavern-notes-page-down';
        pageDownButton.className = 'qr--button tavern-notes-qr-button tavern-notes-page-down-button interactable';
        pageDownButton.title = '向下翻一页';
        pageDownButton.tabIndex = 0;
        pageDownButton.innerHTML = '<i class="fa-solid fa-chevron-down qr--button-icon"></i><span class="qr--hidden">向下翻页</span>';
        buttons.push(pageDownButton);
    }

    target.append(...buttons);
    updateThemeIcons();
    updatePageDownSettingButton();

    openButton.addEventListener('click', openPanel);
    openButton.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') openPanel();
    });
    captureButton.addEventListener('click', () => captureSelection().catch(error => notify(error.message, 'error')));
    captureButton.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') captureSelection().catch(error => notify(error.message, 'error'));
    });
    pageDownButton?.addEventListener('click', pageDownChat);
    pageDownButton?.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') pageDownChat();
    });
}

function watchQuickReplyBar() {
    if (state.qrBarObserver) return;
    const sendForm = document.querySelector('#send_form');
    if (!sendForm) {
        setTimeout(watchQuickReplyBar, 800);
        return;
    }
    state.qrBarObserver = new MutationObserver(() => addInputToolbar());
    state.qrBarObserver.observe(sendForm, { childList: true, subtree: true });
}

function addExtensionsMenuEntry() {
    const menu = document.querySelector('#extensionsMenu');
    if (!menu || document.querySelector('#tavern-notes-menu-entry')) return;

    menu.insertAdjacentHTML('beforeend', `
        <div id="tavern-notes-menu-entry" class="list-group-item flex-container flexGap5 interactable" title="打开酒馆笔记" tabindex="0">
            <i class="fa-solid fa-book-open"></i>
            <span>酒馆笔记</span>
        </div>
    `);
    document.querySelector('#tavern-notes-menu-entry')?.addEventListener('click', openPanel);
}

async function openPanel() {
    const panel = document.querySelector('#tavern-notes-panel');
    if (!panel) return;
    state.open = true;
    panel.classList.add('open');
    await refreshNotes();
}

function closePanel() {
    const panel = document.querySelector('#tavern-notes-panel');
    if (!panel) return;
    state.open = false;
    panel.classList.remove('open');
}

async function init() {
    buildPanel();
    await loadTheme();
    addInputToolbar();
    watchQuickReplyBar();

    try {
        const status = await api('/status');
        state.status = status;
        setStatus(`已连接：${status.user}，V${status.version || '1.0.0'}，总记录约 ${status.totalNotes || 0} 条`);
    } catch (error) {
        notify(`后端未连接：${error.message}`, 'error');
    }

    eventSource.on(event_types.MESSAGE_SENT, messageId => {
        setTimeout(() => captureUserMessage(messageId), 100);
    });
    eventSource.on(event_types.MESSAGE_EDITED, messageId => {
        setTimeout(() => captureUserMessage(messageId), 100);
    });
    eventSource.on(event_types.MESSAGE_UPDATED, messageId => {
        setTimeout(() => captureUserMessage(messageId), 100);
    });

    document.addEventListener('selectionchange', rememberSelection);
}

eventSource.on(event_types.APP_READY, init);
