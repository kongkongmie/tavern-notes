export function renderThemeStudioMarkup({
    translate,
    escapeHtml,
    idPrefix = 'tavern-notes',
    classPrefix = 'tn',
    uiFontScale = 1,
    floatingButtonScale = 1,
    floatingButtonOpacity = 0.9,
    themeAnimationsEnabled = true,
}) {
    const t = translate;
    const escape = escapeHtml;
    return `
        <div class="${classPrefix}-theme-studio" data-theme-studio data-tn-theme-protected="surface">
            <div class="${classPrefix}-ui-font-control">
                <label for="${idPrefix}-ui-font-scale"><i class="fa-solid fa-text-height"></i><span>${escape(t('uiFontSize'))}</span><output id="${idPrefix}-ui-font-scale-value">${Math.round(uiFontScale * 100)}%</output></label>
                <div><input id="${idPrefix}-ui-font-scale" type="range" min="80" max="120" step="5" value="${Math.round(uiFontScale * 100)}" /><button id="${idPrefix}-ui-font-reset" type="button">${escape(t('resetDefault'))}</button></div>
            </div>
            <div class="${classPrefix}-ui-font-control">
                <label for="${idPrefix}-floating-button-scale"><i class="fa-solid fa-up-right-and-down-left-from-center"></i><span>${escape(t('floatingButtonSize'))}</span><output id="${idPrefix}-floating-button-scale-value">${Math.round(floatingButtonScale * 100)}%</output></label>
                <div><input id="${idPrefix}-floating-button-scale" type="range" min="40" max="150" step="5" value="${Math.round(floatingButtonScale * 100)}" /><button id="${idPrefix}-floating-button-scale-reset" type="button">${escape(t('resetDefault'))}</button></div>
            </div>
            <div class="${classPrefix}-ui-font-control">
                <label for="${idPrefix}-floating-button-opacity"><i class="fa-solid fa-circle-half-stroke"></i><span>${escape(t('floatingButtonOpacity'))}</span><output id="${idPrefix}-floating-button-opacity-value">${Math.round(floatingButtonOpacity * 100)}%</output></label>
                <div><input id="${idPrefix}-floating-button-opacity" type="range" min="30" max="100" step="5" value="${Math.round(floatingButtonOpacity * 100)}" /><button id="${idPrefix}-floating-button-opacity-reset" type="button">${escape(t('resetDefault'))}</button></div>
            </div>
            <label class="${classPrefix}-theme-motion-toggle"><input id="${idPrefix}-theme-animations" type="checkbox" ${themeAnimationsEnabled ? 'checked' : ''} /><span>${escape(t('themeAnimations'))}</span></label>
            <input id="${idPrefix}-theme-name-input" class="${classPrefix}-theme-input" type="text" placeholder="${escape(t('themeName'))}" />
            <section class="${classPrefix}-theme-basics" aria-labelledby="${idPrefix}-theme-basics-title">
                <h3 id="${idPrefix}-theme-basics-title">${escape(t('themeBasics'))}</h3>
                <div class="${classPrefix}-theme-basic-grid">
                    <label>${escape(t('mainBackground'))}<input id="${idPrefix}-theme-basic-paper" data-theme-basic-field="paper" type="color" /></label>
                    <label>${escape(t('secondaryBackground'))}<input id="${idPrefix}-theme-basic-paper-2" data-theme-basic-field="paper2" type="color" /></label>
                    <label>${escape(t('bodyText'))}<input id="${idPrefix}-theme-basic-ink" data-theme-basic-field="ink" type="color" /></label>
                    <label>${escape(t('mutedText'))}<input id="${idPrefix}-theme-basic-muted" data-theme-basic-field="muted" type="color" /></label>
                    <label>${escape(t('accentColor'))}<input id="${idPrefix}-theme-basic-gold" data-theme-basic-field="gold" type="color" /></label>
                    <label>${escape(t('themeFontFamily'))}<input id="${idPrefix}-theme-basic-font" data-theme-basic-field="font" type="text" /></label>
                    <label>${escape(t('themeFontSize'))}<input id="${idPrefix}-theme-basic-font-size" data-theme-basic-field="fontSize" type="range" min="12" max="20" step="1" /></label>
                    <label>${escape(t('themeRoundness'))}<input id="${idPrefix}-theme-basic-radius" data-theme-basic-field="radius" type="range" min="0" max="36" step="2" /></label>
                    <label>${escape(t('themeShadow'))}<select id="${idPrefix}-theme-basic-shadow" data-theme-basic-field="shadow"><option value="none">${escape(t('shadowNone'))}</option><option value="soft">${escape(t('shadowSoft'))}</option><option value="strong">${escape(t('shadowStrong'))}</option><option value="custom">${escape(t('shadowCustom'))}</option></select></label>
                    <label class="${classPrefix}-theme-basic-wide">${escape(t('backgroundImage'))}<input id="${idPrefix}-theme-basic-background" data-theme-basic-field="background" type="text" inputmode="url" placeholder="https://..." /></label>
                    <label class="${classPrefix}-theme-basic-wide">${escape(t('backgroundOpacity'))}<input id="${idPrefix}-theme-basic-background-opacity" data-theme-basic-field="backgroundOpacity" type="range" min="0" max="100" step="5" /></label>
                </div>
            </section>
            <button id="${idPrefix}-theme-merge-st" data-tn-theme-protected="control" class="${classPrefix}-theme-merge-button"><i class="fa-solid fa-wand-magic-sparkles"></i><span>${escape(t('mergeTheme'))}</span></button>
            <div class="${classPrefix}-theme-actions" data-tn-theme-protected="actions">
                <button id="${idPrefix}-theme-preview-save" data-tn-theme-protected="control" class="${classPrefix}-export-choice"><i class="fa-solid fa-eye"></i><span>${escape(t('previewSave'))}</span></button>
                <button id="${idPrefix}-theme-save-as" data-tn-theme-protected="control" class="${classPrefix}-export-choice"><i class="fa-solid fa-copy"></i><span>${escape(t('saveAs'))}</span></button>
                <button id="${idPrefix}-theme-reset" data-tn-theme-protected="control" class="${classPrefix}-export-choice"><i class="fa-solid fa-rotate-left"></i><span>${escape(t('resetDefault'))}</span></button>
            </div>
            <details class="${classPrefix}-theme-guide">
                <summary><i class="fa-solid fa-circle-info"></i><span>${escape(t('themeGuide'))}</span></summary>
                <pre>${escape(t('themeGuideContent'))}</pre>
            </details>
            <details class="${classPrefix}-theme-advanced">
                <summary><i class="fa-solid fa-code"></i><span>${escape(t('advancedThemeCss'))}</span></summary>
                <p>${escape(t('advancedThemeCssHelp'))}</p>
                <textarea id="${idPrefix}-theme-custom-css" class="${classPrefix}-theme-custom-css" spellcheck="false" placeholder=".tn-note::before { ... }"></textarea>
                <output id="${idPrefix}-theme-css-status" class="${classPrefix}-theme-css-status" aria-live="polite"></output>
            </details>
            <textarea id="${idPrefix}-theme-code" spellcheck="false"></textarea>
        </div>
    `;
}

export function createThemeStudio({
    document,
    window,
    getComputedStyle,
    defaultTheme,
    normalizeTheme,
    themeController,
    translate,
    notify,
    getUiFontScale = () => 1,
    updateUiFontScale = async () => {},
    getFloatingAppearance = () => ({ scale: 1, opacity: 0.9 }),
    updateFloatingAppearance = async () => {},
    getThemeAnimationsEnabled = () => true,
    updateThemeAnimationsEnabled = async () => {},
    validateThemeCss = () => {},
    idPrefix = 'tavern-notes',
    classPrefix = 'tn',
}) {
    const t = translate;
    let mounted = false;
    let syncedCustomCss = '';
    let syncedBasicValues = {};
    const listeners = [];

    const basicFieldIds = {
        paper: 'paper', paper2: 'paper-2', ink: 'ink', muted: 'muted', gold: 'gold', font: 'font',
        fontSize: 'font-size', radius: 'radius', shadow: 'shadow', background: 'background', backgroundOpacity: 'background-opacity',
    };

    function basicElements() {
        return Object.fromEntries(Object.entries(basicFieldIds).map(([name, suffix]) => [name, document.querySelector(`#${idPrefix}-theme-basic-${suffix}`)]));
    }

    function colorInputValue(value, fallback = '#000000') {
        const parsed = parseColor(value) || parseColor(fallback);
        if (!parsed) return '#000000';
        return `#${parsed.rgb.map(channel => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
    }

    function shadowChoice(value) {
        const shadow = String(value || '');
        if (!shadow || shadow === 'none') return 'none';
        if (shadow === defaultTheme.variables['--tn-panel-shadow']) return 'soft';
        if (/0\s+2[4-9]px|0\s+3[0-9]px|0\s+4[0-9]px/.test(shadow)) return 'strong';
        return 'custom';
    }

    function readBasicValues() {
        return Object.fromEntries(Object.entries(basicElements()).map(([name, input]) => [name, String(input?.value || '')]));
    }

    function syncBasicEditor(theme) {
        const fields = basicElements();
        const variables = theme.variables || {};
        const defaults = defaultTheme.variables || {};
        const set = (name, value) => { if (fields[name]) fields[name].value = String(value); };
        set('paper', colorInputValue(variables['--tn-paper'], defaults['--tn-paper']));
        set('paper2', colorInputValue(variables['--tn-paper-2'], defaults['--tn-paper-2']));
        set('ink', colorInputValue(variables['--tn-ink'], defaults['--tn-ink']));
        set('muted', colorInputValue(variables['--tn-muted'], defaults['--tn-muted']));
        set('gold', colorInputValue(variables['--tn-gold'], defaults['--tn-gold']));
        set('font', variables['--tn-font-family'] || defaults['--tn-font-family'] || 'inherit');
        set('fontSize', Number.parseFloat(variables['--tn-font-size']) || 15);
        set('radius', Number.parseFloat(variables['--tn-radius-panel']) || 0);
        set('shadow', shadowChoice(variables['--tn-panel-shadow']));
        set('background', theme.assets?.backgroundImage || '');
        set('backgroundOpacity', Math.round(Math.min(1, Math.max(0, Number(theme.assets?.backgroundOpacity ?? 1))) * 100));
        syncedBasicValues = readBasicValues();
    }

    function syncEditor(theme = themeController.getThemeState().theme || defaultTheme) {
        const clean = normalizeTheme(theme);
        const nameInput = document.querySelector(`#${idPrefix}-theme-name-input`);
        const code = document.querySelector(`#${idPrefix}-theme-code`);
        const customCss = document.querySelector(`#${idPrefix}-theme-custom-css`);
        if (nameInput) nameInput.value = clean.name || '';
        if (code) code.value = JSON.stringify(clean, null, 2);
        syncedCustomCss = clean.customCss || '';
        if (customCss) customCss.value = syncedCustomCss;
        syncBasicEditor(clean);
    }

    function getThemeFromEditor() {
        const code = document.querySelector(`#${idPrefix}-theme-code`);
        const nameInput = document.querySelector(`#${idPrefix}-theme-name-input`);
        const customCss = document.querySelector(`#${idPrefix}-theme-custom-css`);
        const theme = JSON.parse(code?.value || '{}');
        const editorCss = customCss?.value || '';
        theme.customCss = editorCss !== syncedCustomCss ? editorCss : String(theme.customCss || '');
        theme.variables = { ...(theme.variables || {}) };
        theme.assets = { ...(theme.assets || {}) };
        const currentBasicValues = readBasicValues();
        const changed = name => currentBasicValues[name] !== syncedBasicValues[name];
        for (const [name, variable] of Object.entries({ paper: '--tn-paper', paper2: '--tn-paper-2', ink: '--tn-ink', muted: '--tn-muted', gold: '--tn-gold' })) {
            if (changed(name)) theme.variables[variable] = currentBasicValues[name];
        }
        if (changed('font')) theme.variables['--tn-font-family'] = currentBasicValues.font.trim() || 'inherit';
        if (changed('fontSize')) theme.variables['--tn-font-size'] = `${Number(currentBasicValues.fontSize) || 15}px`;
        if (changed('radius')) {
            const radius = Math.max(0, Number(currentBasicValues.radius) || 0);
            theme.variables['--tn-radius-panel'] = `${radius}px`;
            theme.variables['--tn-radius-card'] = `${Math.max(0, radius - 4)}px`;
        }
        if (changed('shadow') && currentBasicValues.shadow !== 'custom') {
            const shadows = {
                none: ['none', 'none'],
                soft: [defaultTheme.variables['--tn-panel-shadow'] || '0 18px 48px rgba(0, 0, 0, 0.18)', defaultTheme.variables['--tn-note-shadow'] || '0 8px 22px rgba(0, 0, 0, 0.14)'],
                strong: ['0 28px 64px rgba(0, 0, 0, 0.34)', '0 18px 38px rgba(0, 0, 0, 0.28)'],
            };
            [theme.variables['--tn-panel-shadow'], theme.variables['--tn-note-shadow']] = shadows[currentBasicValues.shadow];
        }
        if (changed('background')) theme.assets.backgroundImage = currentBasicValues.background.trim();
        if (changed('backgroundOpacity')) theme.assets.backgroundOpacity = Math.min(1, Math.max(0, Number(currentBasicValues.backgroundOpacity) / 100));
        if (nameInput?.value?.trim()) theme.name = nameInput.value.trim();
        if (theme.format && theme.format !== 'tavern-notes-theme') throw new Error(t('invalidThemeFile'));
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

    function parseColor(value) {
        const text = String(value || '').trim();
        const rgb = text.match(/rgba?\(([^)]+)\)/i);
        if (rgb) {
            const [channelsText, alphaText] = rgb[1].split('/').map(part => part.trim());
            const parts = (channelsText.includes(',') ? channelsText.split(',') : channelsText.split(/\s+/))
                .map(part => Number.parseFloat(part));
            if (parts.length >= 3) {
                const commaAlpha = channelsText.includes(',') && parts.length >= 4 ? parts[3] : null;
                const alpha = Number.parseFloat(alphaText ?? commaAlpha ?? '1');
                return { rgb: parts.slice(0, 3), alpha: Number.isFinite(alpha) ? Math.min(Math.max(alpha, 0), 1) : 1 };
            }
        }
        const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
        if (!hex) return null;
        const raw = hex[1].length === 3 ? hex[1].split('').map(char => char + char).join('') : hex[1];
        return { rgb: [0, 2, 4].map(index => Number.parseInt(raw.slice(index, index + 2), 16)), alpha: 1 };
    }

    function parseRgb(value) {
        return parseColor(value)?.rgb || null;
    }

    function toOpaqueColor(value, fallback = '#111522') {
        const source = parseColor(value);
        if (!source) return fallback;
        const base = parseColor(fallback)?.rgb || [17, 21, 34];
        const rgb = source.rgb.map((channel, index) => channel * source.alpha + base[index] * (1 - source.alpha));
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

    function pickBackgroundColor(styles, fallback = defaultTheme.variables['--tn-paper']) {
        return pickStyleValue(styles, 'background-color', fallback);
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
        return selected?.textContent?.trim() || select?.value?.trim() || t('currentTavernTheme');
    }

    function extractCurrentSillyTavernTheme() {
        const body = getComputedStyle(document.body);
        const root = getComputedStyle(document.documentElement);
        const chatBlock = styleOf(['.mes', '.mes_block', '#chat .mes']);
        const chatText = styleOf(['.mes_text', '.mes .mes_text', '#chat']);
        const input = styleOf(['#send_textarea', '#send_form textarea', '#send_form']);
        const menu = styleOf(['#user-settings-block', '#left-nav-panel', '.drawer-content', '.popup']);
        const backdrop = styleOf(['#bg1', '#bg_custom', '#chat', '#sheld', '.drawer-content']);
        const button = styleOf(['.menu_button', '.qr--button', '#send_but']);
        const active = styleOf(['.selected', '.active', '.mes.selected', '.menu_button:hover']);
        const styles = [chatBlock, input, menu, body, root].filter(Boolean);
        const textStyles = [chatText, input, menu, body, root].filter(Boolean);
        const defaults = defaultTheme.variables;
        const bodyText = toOpaqueColor(cssVar(root, '--SmartThemeBodyColor') || pickStyleValue(textStyles, 'color', defaults['--tn-ink']), defaults['--tn-ink']);
        const border = toOpaqueColor(cssVar(root, '--SmartThemeBorderColor') || pickStyleValue([input, button, menu, root], 'border-color', defaults['--tn-line']), defaults['--tn-line']);
        const quote = toOpaqueColor(cssVar(root, '--SmartThemeQuoteColor') || pickStyleValue([active, button, root, body], 'color', defaults['--tn-gold']), defaults['--tn-gold']);
        const em = toOpaqueColor(cssVar(root, '--SmartThemeEmColor') || bodyText, bodyText);
        const underline = toOpaqueColor(cssVar(root, '--SmartThemeUnderlineColor') || quote, quote);
        const userTint = toOpaqueColor(cssVar(root, '--SmartThemeUserMesBlurTintColor') || quote, quote);
        const chatTint = cssVar(root, '--SmartThemeChatTintColor') || cssVar(root, '--SmartThemeBlurTintColor');
        const uiBackground = cssVar(root, '--SmartThemeBlurTintColor') || cssVar(root, '--SmartThemeChatTintColor');
        const lightFallback = isDarkColor(bodyText) ? '#f5f2ec' : defaults['--tn-paper'];
        const baseBackground = pickBackgroundColor([backdrop, chatBlock, input, menu, body, root], lightFallback);
        const baseSolid = toOpaqueColor(baseBackground, lightFallback);
        const panelBackground = pickBackgroundColor([menu, input], '') || uiBackground || baseBackground;
        const panelSolid = toOpaqueColor(panelBackground, baseSolid);
        const cardBackground = pickBackgroundColor([chatBlock], '') || chatTint || uiBackground || panelBackground;
        const cardSolid = toOpaqueColor(cardBackground, panelSolid);
        const botTint = toOpaqueColor(cssVar(root, '--SmartThemeBotMesBlurTintColor') || cardBackground || quote, quote);
        const shadow = pickStyleValue([chatBlock, input, button, menu], 'box-shadow', '');
        const isDark = isDarkColor(panelSolid) || isDarkColor(cardSolid);
        const lightGlow = isDark ? colorMix(quote, 0.18) : 'rgba(255, 255, 255, 0.76)';
        const textShadow = usefulColor(cssVar(root, '--SmartThemeShadowColor')) || 'transparent';
        const themeShadow = toOpaqueColor(cssVar(root, '--SmartThemeShadowColor') || shadowColor(shadow, '#000000'), '#000000');
        const muted = `color-mix(in srgb, ${bodyText} ${isDark ? '68%' : '62%'}, ${panelSolid} ${isDark ? '32%' : '38%'})`;
        const softBorder = `color-mix(in srgb, ${border} ${isDark ? '46%' : '38%'}, transparent)`;
        const glow = `color-mix(in srgb, ${quote} ${isDark ? '16%' : '24%'}, transparent)`;
        const darkShadow = isDark ? colorMix(themeShadow, 0.5) : shadowColor(shadow, pickStyleValue(styles, 'color', '#4c4a44'));
        const buttonBase = isDark ? `color-mix(in srgb, ${cardSolid} 88%, ${border} 12%)` : `color-mix(in srgb, ${cardSolid} 84%, white 16%)`;
        const darkButton = `color-mix(in srgb, ${cardSolid} 90%, black 10%)`;
        const darkButtonHover = `color-mix(in srgb, ${quote} 16%, ${darkButton} 84%)`;
        const darkButtonShadow = `0 0 0 1px ${softBorder}, 0 3px 10px ${colorMix(themeShadow, 0.42)}, inset 0 1px 0 color-mix(in srgb, ${bodyText} 12%, transparent)`;
        const darkIconBg = `linear-gradient(145deg, color-mix(in srgb, ${quote} 8%, ${darkButton} 92%), color-mix(in srgb, ${darkButton} 84%, black 16%))`;
        const darkIconShadow = `0 0 0 1px color-mix(in srgb, ${border} 68%, transparent), 0 2px 6px ${colorMix(themeShadow, 0.34)}, inset 0 1px 0 color-mix(in srgb, ${bodyText} 12%, transparent)`;
        const paperLift = isDark ? `color-mix(in srgb, ${panelSolid} 92%, black 8%)` : `color-mix(in srgb, ${panelSolid} 94%, white 6%)`;
        const cardLift = isDark ? `color-mix(in srgb, ${cardSolid} 94%, black 6%)` : `color-mix(in srgb, ${cardSolid} 90%, white 10%)`;

        return normalizeTheme({
            name: t('mergedThemeName', { name: getSillyTavernThemeName() }),
            author: 'Tavern Notes',
            variables: {
                '--tn-paper': panelSolid, '--tn-paper-2': cardSolid, '--tn-ink': bodyText, '--tn-muted': muted,
                '--tn-line': softBorder, '--tn-gold': quote, '--tn-gold-2': quote, '--tn-em': em,
                '--tn-underline': underline, '--tn-quote': quote, '--tn-text-shadow': textShadow,
                '--tn-panel-glow': glow, '--tn-scrollbar-thumb': quote,
                '--tn-scrollbar-track': `color-mix(in srgb, ${border} 24%, ${panelSolid} 76%)`,
                '--tn-mini-button-bg': `linear-gradient(145deg, ${buttonBase}, ${paperLift})`,
                '--tn-mini-button-shadow': isDark ? darkButtonShadow : defaults['--tn-mini-button-shadow'],
                '--tn-mini-button-hover-bg': `linear-gradient(145deg, color-mix(in srgb, ${quote} ${isDark ? '24%' : '28%'}, ${buttonBase}), ${buttonBase})`,
                '--tn-mini-button-hover-shadow': isDark ? `0 0 0 1px color-mix(in srgb, ${quote} 42%, transparent), 0 4px 12px ${colorMix(themeShadow, 0.42)}, inset 0 1px 0 color-mix(in srgb, ${bodyText} 16%, transparent)` : defaults['--tn-mini-button-hover-shadow'],
                '--tn-filter-hover-shadow': isDark ? `0 0 0 1px color-mix(in srgb, ${border} 70%, transparent), 0 5px 13px ${colorMix(themeShadow, 0.36)}` : defaults['--tn-filter-hover-shadow'],
                '--tn-filter-icon-border': isDark ? `color-mix(in srgb, ${border} 72%, transparent)` : defaults['--tn-filter-icon-border'],
                '--tn-filter-icon-shadow': isDark ? darkIconShadow : defaults['--tn-filter-icon-shadow'],
                '--tn-inline-action-bg': isDark ? darkButton : defaults['--tn-inline-action-bg'],
                '--tn-inline-action-hover-bg': isDark ? darkButtonHover : defaults['--tn-inline-action-hover-bg'],
                '--tn-inline-action-shadow': isDark ? 'none' : defaults['--tn-inline-action-shadow'],
                '--tn-inline-action-hover-shadow': isDark ? `inset 0 0 0 1px color-mix(in srgb, ${quote} 36%, transparent), inset 0 1px 0 color-mix(in srgb, ${bodyText} 12%, transparent)` : defaults['--tn-inline-action-hover-shadow'],
                '--tn-inline-icon-bg': isDark ? darkIconBg : defaults['--tn-inline-icon-bg'],
                '--tn-inline-icon-hover-bg': isDark ? `linear-gradient(145deg, color-mix(in srgb, ${quote} 22%, ${darkButton} 78%), ${darkButton})` : defaults['--tn-inline-icon-hover-bg'],
                '--tn-inline-icon-shadow': isDark ? darkIconShadow : defaults['--tn-inline-icon-shadow'],
                '--tn-shadow-dark': darkShadow, '--tn-shadow-light': lightGlow, '--tn-radius-panel': '24px',
                '--tn-radius-card': isDark ? '13px' : defaults['--tn-radius-card'], '--tn-panel-border': softBorder,
                '--tn-control-bg': `linear-gradient(145deg, ${buttonBase}, ${paperLift})`,
                '--tn-control-bg-hover': `linear-gradient(145deg, color-mix(in srgb, ${quote} ${isDark ? '22%' : '30%'}, ${buttonBase}), ${buttonBase})`,
                '--tn-control-inset-bg': `linear-gradient(145deg, color-mix(in srgb, ${panelSolid} ${isDark ? '90%' : '88%'}, ${isDark ? 'black' : 'white'} ${isDark ? '10%' : '12%'}), color-mix(in srgb, ${cardSolid} ${isDark ? '86%' : '88%'}, ${isDark ? 'black' : 'white'} ${isDark ? '14%' : '12%'}))`,
                '--tn-control-inset-shadow': isDark ? `inset 0 0 0 1px color-mix(in srgb, ${border} 54%, transparent), inset 0 8px 16px ${colorMix(themeShadow, 0.36)}` : defaults['--tn-control-inset-shadow'],
                '--tn-input-bg': cardLift, '--tn-input-color': bodyText, '--tn-input-border': softBorder, '--tn-input-placeholder': muted,
                '--tn-card-bg': `linear-gradient(145deg, ${cardLift}, ${paperLift})`,
                '--tn-card-bg-active': `linear-gradient(145deg, color-mix(in srgb, ${quote} ${isDark ? '18%' : '24%'}, ${cardLift}), ${cardLift})`,
                '--tn-card-active-shadow': isDark ? `inset 0 0 0 1px color-mix(in srgb, ${quote} 28%, transparent), inset 0 8px 14px ${colorMix(themeShadow, 0.3)}` : defaults['--tn-card-active-shadow'],
                '--tn-icon-bg': isDark ? darkIconBg : `linear-gradient(145deg, color-mix(in srgb, ${quote} 16%, ${buttonBase}), ${paperLift})`,
                '--tn-action-bg': `linear-gradient(145deg, ${paperLift}, ${cardLift})`,
                '--tn-overlay-bg': `color-mix(in srgb, ${panelSolid} 94%, ${isDark ? 'black' : 'white'} 6%)`,
                '--tn-fade-bg': `linear-gradient(90deg, color-mix(in srgb, ${cardSolid} 0%, transparent), ${cardSolid} 34%, color-mix(in srgb, ${quote} ${isDark ? '34%' : '18%'}, ${cardSolid}))`,
                '--tn-card-image': 'linear-gradient(transparent, transparent)',
                '--tn-note-bg': `linear-gradient(145deg, ${paperLift}, ${cardLift})`, '--tn-note-border': `1px solid ${softBorder}`,
                '--tn-note-shadow': isDark ? `0 0 0 1px color-mix(in srgb, ${quote} 18%, transparent), 0 8px 24px ${colorMix(themeShadow, 0.5)}` : defaults['--tn-note-shadow'],
                '--tn-note-type-bg': isDark ? `linear-gradient(145deg, color-mix(in srgb, ${userTint} 62%, ${quote} 38%), color-mix(in srgb, ${userTint} 72%, black 28%))` : `linear-gradient(145deg, color-mix(in srgb, ${userTint} 34%, white 66%), color-mix(in srgb, ${quote} 18%, white 82%))`,
                '--tn-note-type-color': isDark ? `color-mix(in srgb, ${bodyText} 82%, ${userTint} 18%)` : `color-mix(in srgb, ${quote} 82%, black 18%)`,
                '--tn-note-type-user-bg': isDark ? `linear-gradient(145deg, color-mix(in srgb, ${userTint} 58%, ${cardSolid} 42%), color-mix(in srgb, ${userTint} 28%, ${panelSolid} 72%))` : `linear-gradient(145deg, color-mix(in srgb, ${userTint} 32%, white 68%), color-mix(in srgb, ${quote} 16%, white 84%))`,
                '--tn-note-type-user-color': isDark ? `color-mix(in srgb, ${bodyText} 88%, ${userTint} 12%)` : `color-mix(in srgb, ${quote} 78%, black 22%)`,
                '--tn-note-type-excerpt-bg': isDark ? `linear-gradient(145deg, color-mix(in srgb, ${botTint} 52%, ${cardSolid} 48%), color-mix(in srgb, ${botTint} 22%, ${panelSolid} 78%))` : `linear-gradient(145deg, color-mix(in srgb, ${botTint} 32%, white 68%), color-mix(in srgb, ${border} 16%, white 84%))`,
                '--tn-note-type-excerpt-color': isDark ? `color-mix(in srgb, ${bodyText} 84%, ${botTint} 16%)` : `color-mix(in srgb, ${border} 76%, black 24%)`,
                '--tn-note-accent-user': userTint, '--tn-note-accent-excerpt': botTint,
                '--tn-note-padding': isDark ? '15px 17px 15px' : defaults['--tn-note-padding'],
                '--tn-note-topline-bg': isDark ? `linear-gradient(135deg, color-mix(in srgb, ${userTint} 12%, ${cardSolid} 88%), color-mix(in srgb, ${botTint} 8%, ${panelSolid} 92%))` : defaults['--tn-note-topline-bg'],
                '--tn-note-topline-border': isDark ? `1px solid ${softBorder}` : defaults['--tn-note-topline-border'],
                '--tn-note-topline-padding': isDark ? '8px 12px' : defaults['--tn-note-topline-padding'],
                '--tn-note-topline-radius': isDark ? '10px' : defaults['--tn-note-topline-radius'],
                '--tn-note-topline-margin': isDark ? '0 0 13px 0' : defaults['--tn-note-topline-margin'],
                '--tn-note-dot-display': isDark ? 'none' : defaults['--tn-note-dot-display'],
                '--tn-filter-shadow': isDark ? `0 0 0 1px ${softBorder}, 0 6px 16px ${colorMix(themeShadow, 0.38)}` : defaults['--tn-filter-shadow'],
                '--tn-control-shadow': isDark ? `0 0 0 1px ${softBorder}, 0 5px 14px ${colorMix(themeShadow, 0.38)}` : defaults['--tn-control-shadow'],
                '--tn-inset-light': isDark ? `color-mix(in srgb, ${quote} 16%, transparent)` : defaults['--tn-inset-light'],
                '--tn-font-family': defaults['--tn-font-family'],
            },
            assets: { ...defaultTheme.assets, backgroundImage: '' },
        });
    }

    function previewFromEditor() {
        const theme = getThemeFromEditor();
        themeController.setDraft(true);
        syncEditor(theme);
        return theme;
    }

    async function previewAndSaveFromEditor() {
        const theme = getThemeFromEditor();
        themeController.previewTheme(theme);
        await saveFromEditor(theme);
    }

    async function mergeCurrentSillyTavernTheme() {
        const theme = extractCurrentSillyTavernTheme();
        const stamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
        }).replace(/[\/:\s]/g, '-');
        theme.name = `${theme.name} - ${stamp}`;
        themeController.setDraft(true);
        syncEditor(theme);
        notify(t('mergedThemeDraft'), 'success');
    }

    function askThemeName(theme, actionLabel) {
        const currentName = theme?.name || document.querySelector(`#${idPrefix}-theme-name-input`)?.value || t('unnamedTheme');
        const nextName = window.prompt(t('themeNamePrompt', { action: actionLabel }), currentName);
        if (nextName === null) return null;
        const cleanName = nextName.trim();
        if (!cleanName) {
            notify(t('themeNameEmpty'), 'warning');
            return null;
        }
        return cleanName;
    }

    async function saveFromEditor(themeFromEditor = null) {
        const theme = themeFromEditor || getThemeFromEditor();
        const themeState = themeController.getThemeState();
        const shouldSaveAs = themeState.draft
            || !themeState.activeId
            || themeState.activeId === 'default'
            || themeController.isAppleThemeId(themeState.activeId);
        const name = askThemeName(theme, shouldSaveAs ? t('saveAsAction') : t('saveAction'));
        if (!name) return;
        theme.name = name;
        syncEditor(theme);
        await themeController.saveTheme(theme, {
            id: shouldSaveAs ? null : themeState.activeId,
            notifyKey: shouldSaveAs ? 'savedAsTheme' : 'savedTheme',
        });
    }

    async function saveAsFromEditor() {
        const theme = getThemeFromEditor();
        const name = askThemeName(theme, t('saveAsAction'));
        if (!name) return;
        theme.name = name;
        syncEditor(theme);
        await themeController.saveTheme(theme, {
            id: null,
            activate: false,
            notifyKey: 'savedAsTheme',
        });
    }

    function listen(selector, action, eventName = 'click') {
        const element = document.querySelector(selector);
        if (!element) return;
        const listener = event => Promise.resolve(action(event)).catch(error => notify(error.message, 'error'));
        element.addEventListener(eventName, listener);
        listeners.push([element, listener, eventName]);
    }

    function validateCustomCssEditor() {
        const input = document.querySelector(`#${idPrefix}-theme-custom-css`);
        const status = document.querySelector(`#${idPrefix}-theme-css-status`);
        if (!status) return true;
        try {
            validateThemeCss(input?.value || '', { themeId: 'preview' });
            status.textContent = input?.value?.trim() ? t('themeCssValid') : '';
            status.classList.remove('error');
            return true;
        } catch (error) {
            status.textContent = error.message;
            status.classList.add('error');
            return false;
        }
    }

    function previewBasicEditor() {
        const theme = getThemeFromEditor();
        const code = document.querySelector(`#${idPrefix}-theme-code`);
        if (code) code.value = JSON.stringify(theme, null, 2);
        syncedBasicValues = readBasicValues();
        themeController.setDraft(true);
        themeController.previewTheme(theme);
    }

    function syncUiFontScale(value = getUiFontScale()) {
        const percent = Math.round(Number(value || 1) * 100);
        const input = document.querySelector(`#${idPrefix}-ui-font-scale`);
        const output = document.querySelector(`#${idPrefix}-ui-font-scale-value`);
        if (input) input.value = String(percent);
        if (output) output.textContent = `${percent}%`;
        document.querySelector(`#${idPrefix}-panel`)?.style.setProperty('--tavern-notes-ui-scale', String(percent / 100));
    }

    async function saveUiFontScale(percent) {
        const value = Math.min(120, Math.max(80, Number(percent) || 100)) / 100;
        syncUiFontScale(value);
        await updateUiFontScale(value);
    }

    function syncFloatingControl(kind, value) {
        const percent = Math.round(Number(value) * 100);
        const input = document.querySelector(`#${idPrefix}-floating-button-${kind}`);
        const output = document.querySelector(`#${idPrefix}-floating-button-${kind}-value`);
        if (input) input.value = String(percent);
        if (output) output.textContent = `${percent}%`;
        const launcher = document.querySelector(`#${idPrefix}-floating-launcher`);
        launcher?.style.setProperty(`--tavern-notes-floating-${kind}`, String(value));
    }

    async function saveFloatingControl(kind, percent) {
        const value = Number(percent) / 100;
        syncFloatingControl(kind, value);
        await updateFloatingAppearance({ [kind === 'scale' ? 'floatingButtonScale' : 'floatingButtonOpacity']: value });
    }

    function syncThemeAnimations(enabled = getThemeAnimationsEnabled()) {
        const active = enabled !== false;
        const input = document.querySelector(`#${idPrefix}-theme-animations`);
        if (input) input.checked = active;
        document.querySelector(`#${idPrefix}-panel`)?.classList.toggle(`${classPrefix}-theme-motion-disabled`, !active);
    }

    function mount() {
        destroy();
        listen(`#${idPrefix}-theme-preview-save`, previewAndSaveFromEditor);
        listen(`#${idPrefix}-theme-merge-st`, mergeCurrentSillyTavernTheme);
        listen(`#${idPrefix}-theme-save-as`, saveAsFromEditor);
        listen(`#${idPrefix}-ui-font-scale`, event => syncUiFontScale(Number(event.target.value) / 100), 'input');
        listen(`#${idPrefix}-ui-font-scale`, event => saveUiFontScale(event.target.value), 'change');
        listen(`#${idPrefix}-ui-font-reset`, () => saveUiFontScale(100));
        for (const [kind, fallback] of [['scale', 1], ['opacity', 0.9]]) {
            listen(`#${idPrefix}-floating-button-${kind}`, event => syncFloatingControl(kind, Number(event.target.value) / 100), 'input');
            listen(`#${idPrefix}-floating-button-${kind}`, event => saveFloatingControl(kind, event.target.value), 'change');
            listen(`#${idPrefix}-floating-button-${kind}-reset`, () => saveFloatingControl(kind, fallback * 100));
        }
        listen(`#${idPrefix}-theme-animations`, async event => {
            syncThemeAnimations(event.target.checked);
            await updateThemeAnimationsEnabled(event.target.checked);
        }, 'change');
        listen(`#${idPrefix}-theme-custom-css`, validateCustomCssEditor, 'change');
        for (const suffix of Object.values(basicFieldIds)) {
            listen(`#${idPrefix}-theme-basic-${suffix}`, previewBasicEditor, suffix === 'background' ? 'change' : 'input');
        }
        syncUiFontScale();
        const appearance = getFloatingAppearance();
        syncFloatingControl('scale', appearance.scale || 1);
        syncFloatingControl('opacity', appearance.opacity || 0.9);
        syncThemeAnimations();
        validateCustomCssEditor();
        mounted = true;
    }

    function destroy() {
        for (const [element, listener, eventName] of listeners.splice(0)) {
            element.removeEventListener(eventName, listener);
        }
        mounted = false;
    }

    return {
        syncEditor,
        getThemeFromEditor,
        extractCurrentSillyTavernTheme,
        previewFromEditor,
        previewAndSaveFromEditor,
        mergeCurrentSillyTavernTheme,
        saveFromEditor,
        saveAsFromEditor,
        mount,
        destroy,
        isMounted: () => mounted,
    };
}
